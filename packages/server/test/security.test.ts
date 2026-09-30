import { afterEach, describe, expect, it } from 'vitest';
import { escapeRegex, generateResetCode, getJwtSecret, hashResetCode, safeEqual } from '../src/utils/security';

describe('safeEqual', () => {
  it('matches equal strings and rejects different ones (including different lengths)', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', 'x')).toBe(false);
  });
});

describe('escapeRegex', () => {
  it('makes user input match literally', () => {
    const pattern = new RegExp(escapeRegex('süt (1l'), 'i');
    expect(pattern.test('Tam Yağlı Süt (1L)')).toBe(true);
    expect(new RegExp(escapeRegex('.')).test('Ekmek')).toBe(false);
    expect(() => new RegExp(escapeRegex('(a+)+$['))).not.toThrow();
  });
});

describe('password reset codes', () => {
  const originalSecret = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('generates 6-digit numeric codes', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateResetCode()).toMatch(/^\d{6}$/);
    }
  });

  it('stores a keyed hash bound to the user, never the code itself', () => {
    const hash = hashResetCode('user-a', '123456');
    expect(hash).not.toContain('123456');
    expect(hash).toHaveLength(64);
    expect(hashResetCode('user-a', '123456')).toBe(hash);
    expect(hashResetCode('user-b', '123456')).not.toBe(hash);
  });

  it('fails closed when JWT_SECRET is missing instead of using a default', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow();
    expect(() => hashResetCode('user-a', '123456')).toThrow();
  });
});
