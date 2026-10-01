// Load .env before app.ts runs: it reads CLIENT_ORIGIN, ADMIN_ORIGIN and TRUST_PROXY at import time.
import 'dotenv/config';
import app from './app';
import connectDB from './config/db';
import { findPlaceholderSecrets } from './utils/security';

const requiredEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SCRAPER_API_KEY'
];

if (process.env.NODE_ENV === 'production') {
  requiredEnv.push('CLIENT_ORIGIN', 'ADMIN_ORIGIN', 'ADMIN_EMAIL', 'ADMIN_PASSWORD');
}

const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`[CRITICAL ERROR] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  // The values from .env.example are public, so production must not run with them.
  const placeholderEnv = findPlaceholderSecrets(process.env, ['JWT_SECRET', 'SCRAPER_API_KEY', 'ADMIN_PASSWORD']);
  if (placeholderEnv.length > 0) {
    console.error(
      `[CRITICAL ERROR] Placeholder values from .env.example are not allowed in production: ${placeholderEnv.join(', ')}. ` +
      'Set real secret values.'
    );
    process.exit(1);
  }
}

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
