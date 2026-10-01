import crypto from 'crypto';

/**
 * Returns the JWT signing secret. There is deliberately no fallback value:
 * if JWT_SECRET is missing, signing and verifying tokens fails (fail closed)
 * instead of silently using a guessable default.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return secret;
};

/**
 * Example values from .env.example and from older versions of this repository
 * (including the former JWT fallback). They are public on GitHub, so they must
 * never be used as real secrets.
 */
export const PLACEHOLDER_SECRETS: readonly string[] = [
  'change-me',
  'your_jwt_secret_key_here',
  'your_scraper_secure_api_key_here',
  'your_secure_admin_password_here',
  'supersecretkey',
];

/** Returns the names of the given environment variables that are set to a known placeholder value. */
export const findPlaceholderSecrets = (env: NodeJS.ProcessEnv, names: readonly string[]): string[] =>
  names.filter((name) => {
    const value = env[name];
    return value !== undefined && PLACEHOLDER_SECRETS.includes(value.trim());
  });

/**
 * Constant-time string comparison. Both values are hashed first so that
 * inputs of different lengths do not leak timing information either.
 */
export const safeEqual = (a: string, b: string): boolean => {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

/** Generates a 6-digit numeric password reset code with a CSPRNG. */
export const generateResetCode = (): string => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

/**
 * Hashes a reset code before it is stored, bound to the user id and keyed with
 * the server secret, so a database dump does not reveal usable codes.
 */
export const hashResetCode = (userId: string, code: string): string =>
  crypto.createHmac('sha256', getJwtSecret()).update(`${userId}:${code}`).digest('hex');

/**
 * Reads TRUST_PROXY as the number of reverse-proxy hops in front of the API (1 on Render).
 * Only a non-negative integer is accepted: trusting every hop would let clients pick their
 * own IP with X-Forwarded-For and get around the rate limits. "true" (an older setting) is
 * read as 1 hop and any other value as 0 (proxy headers ignored), both with a warning.
 */
export const parseTrustProxy = (value: string | undefined): { hops: number; warning?: string } => {
  const raw = (value ?? '').trim();
  const hint = 'Set TRUST_PROXY to the number of proxies in front of the API (1 on Render).';
  if (raw === '') return { hops: 0 };
  if (/^\d+$/.test(raw)) return { hops: Number(raw) };
  if (raw.toLowerCase() === 'true') {
    return { hops: 1, warning: `TRUST_PROXY=true would trust every X-Forwarded-For hop; using 1 hop instead. ${hint}` };
  }
  return { hops: 0, warning: `TRUST_PROXY="${raw}" is not a hop count; proxy headers are ignored. ${hint}` };
};

/** Escapes user input so it can be used literally inside a RegExp / $regex. */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
