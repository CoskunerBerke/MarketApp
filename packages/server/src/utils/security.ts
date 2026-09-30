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

/** Escapes user input so it can be used literally inside a RegExp / $regex. */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
