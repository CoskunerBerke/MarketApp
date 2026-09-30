import { describe, expect, it } from 'vitest';
import {
  bulkProductSchema,
  favoriteSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../src/middleware/validationMiddleware';

describe('auth schemas', () => {
  it('rejects MongoDB operator objects instead of strings (NoSQL injection)', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'victim@example.com',
      token: { $ne: null },
      newPassword: 'new-password-123',
    });
    expect(result.success).toBe(false);
    expect(loginSchema.safeParse({ email: { $gt: '' }, password: 'x' }).success).toBe(false);
  });

  it('only accepts a 6-digit reset code', () => {
    const base = { email: 'user@example.com', newPassword: 'new-password-123' };
    expect(resetPasswordSchema.safeParse({ ...base, token: '123456' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...base, token: '12345' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...base, token: 'abcdef' }).success).toBe(false);
  });

  it('normalises e-mail addresses', () => {
    const parsed = loginSchema.parse({ email: '  Demo@Example.COM ', password: 'x' });
    expect(parsed.email).toBe('demo@example.com');
  });

  it('requires an e-mail and a password of at least 8 characters on register', () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'user@example.com', password: 'long-enough' }).success).toBe(true);
  });

  it('validates favourite product ids', () => {
    expect(favoriteSchema.safeParse({ productId: '507f1f77bcf86cd799439011' }).success).toBe(true);
    expect(favoriteSchema.safeParse({ productId: 'abc' }).success).toBe(false);
    expect(favoriteSchema.safeParse({ productId: { $ne: null } }).success).toBe(false);
  });
});

describe('bulkProductSchema', () => {
  const product = { name: 'Demo Ürün', price: 10 };

  it('accepts http(s) links and empty values', () => {
    const result = bulkProductSchema.safeParse({
      marketName: 'BİM',
      products: [
        { ...product, sourceUrl: 'https://example.com/p/1', imageUrl: '' },
        { ...product, sourceUrl: 'http://example.com/p/2', imageUrl: null },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects script URLs that the clients would render as links', () => {
    for (const sourceUrl of ['javascript:alert(1)', 'data:text/html,hi']) {
      const result = bulkProductSchema.safeParse({ marketName: 'BİM', products: [{ ...product, sourceUrl }] });
      expect(result.success).toBe(false);
    }
  });
});
