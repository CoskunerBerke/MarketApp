import { spawnSync } from 'child_process';
import path from 'path';
import { describe, expect, it } from 'vitest';

// Runs the real entry points in a child process. Both checks fail before any
// database connection is attempted, so no MongoDB is needed.
const serverDir = path.resolve(__dirname, '..');

const run = (entry: string, env: Record<string, string>) =>
  spawnSync(process.execPath, ['-r', 'ts-node/register', entry], {
    cwd: serverDir,
    env: { PATH: process.env.PATH ?? '', TS_NODE_TRANSPILE_ONLY: 'true', ...env },
    encoding: 'utf8',
    timeout: 20000,
  });

// Test-only values; never real secrets.
const productionEnv = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://127.0.0.1:1/unused',
  JWT_SECRET: 'test-only-jwt-secret',
  SCRAPER_API_KEY: 'test-only-scraper-key',
  CLIENT_ORIGIN: 'https://client.example.test',
  ADMIN_ORIGIN: 'https://admin.example.test',
  ADMIN_EMAIL: 'admin@example.test',
  ADMIN_PASSWORD: 'test-only-admin-password',
};

describe('production startup', () => {
  it('refuses to start the API with placeholder secrets from .env.example', () => {
    const result = run('src/index.ts', {
      ...productionEnv,
      JWT_SECRET: 'change-me',
      ADMIN_PASSWORD: 'your_secure_admin_password_here',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'Placeholder values from .env.example are not allowed in production: JWT_SECRET, ADMIN_PASSWORD.',
    );
  });

  it('does not seed the admin user with a placeholder password', () => {
    const result = run('src/scripts/seedAdmin.ts', { ...productionEnv, ADMIN_PASSWORD: 'change-me' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ADMIN_PASSWORD is still a placeholder value');
  });
});
