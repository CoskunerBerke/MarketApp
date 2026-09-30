import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import {
  validateBody,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middleware/validationMiddleware';
import { auditLogAction } from '../middleware/auditLogger';
import { sendPasswordResetCode } from '../services/mailService';
import { generateResetCode, getJwtSecret, hashResetCode, safeEqual } from '../utils/security';

const router = express.Router();

export const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_RESET_ATTEMPTS = 5;

const FORGOT_PASSWORD_MESSAGE = 'Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama kodu e-posta ile gönderilecektir.';
const INVALID_RESET_CODE_MESSAGE = 'Kod geçersiz, süresi dolmuş veya deneme hakkı bitmiş. Lütfen yeni bir kod isteyin.';

const generateToken = (id: string) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email; // trimmed and lower-cased by registerSchema

  try {
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'Bu mail adresi zaten kayıtlı.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı bilgileri.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: normalizedEmail });

    // Fallback: If not found with lowercase, try original (for older accounts)
    if (!user) {
      user = await User.findOne({ email: email.trim() });
      if (user) {
        // Migration: Update the user to use normalized email for future logins
        user.email = normalizedEmail;
        await user.save();
        console.log(`Auto-normalized account: ${normalizedEmail}`);
      }
    }

    if (!user) {
      auditLogAction(req, 'Login Attempt', 'failure', `Email not found: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      auditLogAction(req, 'Login Attempt', 'failure', `Invalid password for: ${normalizedEmail}`);
      return res.status(401).json({ message: 'Girdiğiniz şifre hatalı, lütfen tekrar deneyin.' });
    }

    const actionName = user.role === 'admin' ? 'Admin Login Success' : 'User Login Success';
    auditLogAction(req, actionName, 'success');

    res.json({
      _id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    auditLogAction(req, 'Login Failed with Server Error', 'failure');
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Password reset, step 1: create a single-use code. The response is identical whether or
// not the account exists, and the code is never returned to the client or logged.
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const code = generateResetCode();
      user.resetPasswordToken = hashResetCode(user.id, code);
      user.resetPasswordExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
      user.resetPasswordAttempts = 0;
      await user.save();
      await sendPasswordResetCode(user.email, code);
      auditLogAction(req, 'Password Reset Requested', 'success');
    } else {
      auditLogAction(req, 'Password Reset Requested', 'failure', 'Unknown email');
    }

    res.json({ message: FORGOT_PASSWORD_MESSAGE });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Password reset, step 2: verify the code (expiring, single use, limited attempts).
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    // Atomically consume one attempt, so parallel requests cannot exceed MAX_RESET_ATTEMPTS.
    const user = await User.findOneAndUpdate(
      {
        email,
        resetPasswordToken: { $type: 'string' },
        resetPasswordExpires: { $gt: new Date() },
        resetPasswordAttempts: { $lt: MAX_RESET_ATTEMPTS },
      },
      { $inc: { resetPasswordAttempts: 1 } },
      { returnDocument: 'after' }
    );

    if (!user || !user.resetPasswordToken || !safeEqual(user.resetPasswordToken, hashResetCode(user.id, token))) {
      auditLogAction(req, 'Password Reset', 'failure', 'Invalid, expired or exhausted code');
      return res.status(400).json({ message: INVALID_RESET_CODE_MESSAGE });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Single use: only succeeds if the code has not been consumed in the meantime.
    const updated = await User.findOneAndUpdate(
      { _id: user._id, resetPasswordToken: user.resetPasswordToken },
      {
        $set: { passwordHash, resetPasswordAttempts: 0 },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      }
    );
    if (!updated) {
      return res.status(400).json({ message: INVALID_RESET_CODE_MESSAGE });
    }

    auditLogAction(req, 'Password Reset', 'success');
    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

export default router;
