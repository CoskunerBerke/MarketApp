import { afterEach, describe, expect, it } from 'vitest';
import {
  escapeRegex,
  findPlaceholderSecrets,
  generateResetCode,
  getJwtSecret,
  hashResetCode,
  parseTrustProxy,
  PLACEHOLDER_SECRETS,
  safeEqual,
} from '../src/utils/security';

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

describe('findPlaceholderSecrets', () => {
  const secretNames = ['JWT_SECRET', 'SCRAPER_API_KEY', 'ADMIN_PASSWORD'];

  it('flags the .env.example placeholders, including old ones and the former JWT fallback', () => {
    expect(PLACEHOLDER_SECRETS).toEqual(expect.arrayContaining(['change-me', 'your_jwt_secret_key_here', 'supersecretkey']));
    for (const placeholder of PLACEHOLDER_SECRETS) {
      expect(findPlaceholderSecrets({ SCRAPER_API_KEY: placeholder }, secretNames)).toEqual(['SCRAPER_API_KEY']);
    }
    expect(
      findPlaceholderSecrets(
        { JWT_SECRET: 'supersecretkey', SCRAPER_API_KEY: 'your_scraper_secure_api_key_here', ADMIN_PASSWORD: ' change-me ' },
        secretNames,
      ),
    ).toEqual(secretNames);
  });

  it('accepts any other value (no length rule) and ignores unset variables', () => {
    expect(findPlaceholderSecrets({ JWT_SECRET: 'x7', SCRAPER_API_KEY: 'change-me-2' }, secretNames)).toEqual([]);
  });
});

describe('parseTrustProxy', () => {
  it('accepts a non-negative hop count and treats an empty value as no proxy', () => {
    expect(parseTrustProxy(undefined)).toEqual({ hops: 0 });
    expect(parseTrustProxy('')).toEqual({ hops: 0 });
    expect(parseTrustProxy('0')).toEqual({ hops: 0 });
    expect(parseTrustProxy('1')).toEqual({ hops: 1 });
    expect(parseTrustProxy(' 2 ')).toEqual({ hops: 2 });
  });

  it('reads "true" as one hop instead of trusting every hop, with a warning', () => {
    for (const value of ['true', 'TRUE']) {
      const result = parseTrustProxy(value);
      expect(result.hops).toBe(1);
      expect(result.warning).toMatch(/TRUST_PROXY=true/);
    }
  });

  it('ignores proxy headers for anything else, with a warning', () => {
    for (const value of ['false', 'yes', '-1', '1.5', 'loopback', '10.0.0.0/8']) {
      const result = parseTrustProxy(value);
      expect(result.hops).toBe(0);
      expect(result.warning).toMatch(/not a hop count/);
    }
  });
});
