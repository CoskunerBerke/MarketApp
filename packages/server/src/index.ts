import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

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

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
