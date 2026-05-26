import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Girdi doğrulama hatası.',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({ message: 'Geçersiz veri formatı.' });
  }
};

export const loginSchema = z.object({
  email: z.string().min(1, 'E-posta zorunludur.').email('Geçersiz e-posta formatı.').trim().toLowerCase(),
  password: z.string().min(1, 'Şifre boş olamaz.'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı boş olamaz.').max(200, 'Ürün adı en fazla 200 karakter olabilir.'),
  price: z.number().nonnegative('Fiyat 0 veya daha büyük olmalıdır.'),
  oldPrice: z.number().nonnegative('Eski fiyat 0 veya daha büyük olmalıdır.').optional(),
  discountRate: z.number().min(0).max(100).optional(),
  promotionPrice: z.number().nonnegative().optional(),
  promotionText: z.string().optional(),
  imageUrl: z.string().url('Geçersiz görsel URL formatı.').or(z.string().length(0)).optional().nullable(),
  sourceUrl: z.string().url('Geçersiz kaynak URL formatı.').or(z.string().length(0)).optional().nullable(),
  marketId: z.string().min(1, 'Market ID gereklidir.').optional(),
  categoryId: z.string().optional(),
});

export const marketSchema = z.object({
  name: z.string().min(1, 'Market adı boş olamaz.').max(100, 'Market adı en fazla 100 karakter olabilir.'),
  logoUrl: z.string().url('Geçersiz logo URL formatı.').or(z.string().length(0)).optional().nullable(),
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
      imageUrl: z.string().url('Geçersiz görsel URL formatı.').or(z.string().length(0)).optional().nullable(),
      sourceUrl: z.string().url('Geçersiz kaynak URL formatı.').or(z.string().length(0)).optional().nullable(),
    })
  ).max(500, 'Tek seferde en fazla 500 ürün gönderilebilir.'),
});
