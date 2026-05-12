import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const router = express.Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Bu mail adresi zaten kayıtlı.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
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

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Girdiğiniz şifre hatalı, lütfen tekrar deneyin.' });
    }

    res.json({
      _id: user.id,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// Mock forgot password (in a real app, this sends an email)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.' });
    }

    // Generate a simple 6-digit token for MVP
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'Şifre sıfırlama kodu e-postanıza (veya loglara) gönderildi.', token: resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş kod.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

export default router;
