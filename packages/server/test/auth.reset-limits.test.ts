import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, hasTestDb } from './helpers/db';

const sentCodes = vi.hoisted(() => [] as string[]);
vi.mock('../src/services/mailService', () => ({
  sendPasswordResetCode: vi.fn(async (_email: string, code: string) => {
    sentCodes.push(code);
    return true;
  }),
}));

import app from '../src/app';
import User from '../src/models/User';
import { MAX_RESET_ATTEMPTS } from '../src/routes/authRoutes';

const EMAIL = 'limits.demo@example.com';

const wrongCodeFor = (code: string) => (code === '000000' ? '111111' : '000000');

// The reset-password rate limiter allows 10 requests per IP in 15 minutes;
// this file uses exactly 10 and then checks that the 11th is refused.
describe.skipIf(!hasTestDb)('password reset limits', () => {
  beforeAll(async () => {
    await connectTestDb('marketapp_test_reset_limits');
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: 'original-pass-1' });
    expect(res.status).toBe(201);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it(`locks the code after ${MAX_RESET_ATTEMPTS} wrong attempts, even when they arrive in parallel`, async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: EMAIL }).expect(200);
    const code = sentCodes[sentCodes.length - 1];
    const wrong = wrongCodeFor(code);

    const attempts = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app).post('/api/auth/reset-password').send({ email: EMAIL, token: wrong, newPassword: 'attacker-pass-1' })
      )
    );
    attempts.forEach((res) => expect(res.status).toBe(400));

    const user = await User.findOne({ email: EMAIL }).lean();
    expect(user?.resetPasswordAttempts).toBe(MAX_RESET_ATTEMPTS);

    // The correct code no longer works once the attempts are used up.
    const late = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: code, newPassword: 'brand-new-pass-1' });
    expect(late.status).toBe(400);
  });

  it('rejects expired codes', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: EMAIL }).expect(200);
    const code = sentCodes[sentCodes.length - 1];
    await User.updateOne({ email: EMAIL }, { $set: { resetPasswordExpires: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: code, newPassword: 'brand-new-pass-1' });
    expect(res.status).toBe(400);
  });

  it('rate-limits reset attempts per IP', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: '123456', newPassword: 'brand-new-pass-1' });
    expect(res.status).toBe(429);
  });
});
