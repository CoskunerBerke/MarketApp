import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: error.issues[0]?.message || 'Girdi doğrulama hatası.',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({ message: 'Geçersiz veri formatı.' });
  }
};

// Only http(s) links are stored: they are rendered as <a href> / <img src> by the clients.
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const httpUrl = (message: string) => z.string().url(message).refine(isHttpUrl, message);

const emailField = z.string({ error: 'E-posta zorunludur.' })
  .trim()
  .toLowerCase()
  .min(1, 'E-posta zorunludur.')
  .max(254, 'E-posta adresi çok uzun.')
  .email('Geçersiz e-posta formatı.');

// Upper bound keeps bcrypt input below its 72-byte limit for typical passwords.
const newPasswordField = z.string({ error: 'Şifre zorunludur.' })
  .min(8, 'Şifre en az 8 karakter olmalıdır.')
  .max(72, 'Şifre en fazla 72 karakter olabilir.');

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: 'Şifre boş olamaz.' }).min(1, 'Şifre boş olamaz.').max(200, 'Şifre çok uzun.'),
});

export const registerSchema = z.object({
  email: emailField,
  password: newPasswordField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  email: emailField,
  token: z.string({ error: 'Sıfırlama kodu zorunludur.' }).trim().regex(/^\d{6}$/, 'Sıfırlama kodu 6 haneli olmalıdır.'),
  newPassword: newPasswordField,
});

export const favoriteSchema = z.object({
  productId: z.string({ error: 'Ürün ID gereklidir.' }).regex(/^[a-f\d]{24}$/i, 'Geçersiz ürün ID.'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı boş olamaz.').max(200, 'Ürün adı en fazla 200 karakter olabilir.'),
  price: z.number().nonnegative('Fiyat 0 veya daha büyük olmalıdır.'),
  oldPrice: z.number().nonnegative('Eski fiyat 0 veya daha büyük olmalıdır.').optional(),
  discountRate: z.number().min(0).max(100).optional(),
  promotionPrice: z.number().nonnegative().optional(),
  promotionText: z.string().optional(),
  imageUrl: httpUrl('Geçersiz görsel URL formatı.').or(z.string().length(0)).optional().nullable(),
  sourceUrl: httpUrl('Geçersiz kaynak URL formatı.').or(z.string().length(0)).optional().nullable(),
  marketId: z.string().min(1, 'Market ID gereklidir.').optional(),
  categoryId: z.string().optional(),
});

export const marketSchema = z.object({
  name: z.string().min(1, 'Market adı boş olamaz.').max(100, 'Market adı en fazla 100 karakter olabilir.'),
  logoUrl: httpUrl('Geçersiz logo URL formatı.').or(z.string().length(0)).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const bulkProductSchema = z.object({
  marketName: z.string().min(1, 'Market adı boş olamaz.'),
  products: z.array(
    z.object({
      name: z.string().min(1, 'Ürün adı boş olamaz.').max(200, 'Ürün adı en fazla 200 karakter olabilir.'),
      price: z.number().nonnegative('Fiyat 0 veya daha büyük olmalıdır.'),
      oldPrice: z.number().nonnegative().optional(),
      discountRate: z.number().min(0).max(100).optional(),
      promotionPrice: z.number().nonnegative().optional(),
      promotionText: z.string().optional(),
      imageUrl: httpUrl('Geçersiz görsel URL formatı.').or(z.string().length(0)).optional().nullable(),
      sourceUrl: httpUrl('Geçersiz kaynak URL formatı.').or(z.string().length(0)).optional().nullable(),
    })
  ).max(500, 'Tek seferde en fazla 500 ürün gönderilebilir.'),
});
