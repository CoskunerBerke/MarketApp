import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { connectTestDb, disconnectTestDb, hasTestDb } from './helpers/db';

// Capture the codes the mailer would send, so the flow can be tested end to end.
const sentCodes = vi.hoisted(() => [] as { email: string; code: string }[]);
vi.mock('../src/services/mailService', () => ({
  sendPasswordResetCode: vi.fn(async (email: string, code: string) => {
    sentCodes.push({ email, code });
    return true;
  }),
}));

import app from '../src/app';
import User from '../src/models/User';

const EMAIL = 'reset.demo@example.com';
const PASSWORD = 'original-pass-1';

const lastCode = () => sentCodes[sentCodes.length - 1].code;

describe.skipIf(!hasTestDb)('password reset flow', () => {
  beforeAll(async () => {
    await connectTestDb('marketapp_test_reset');
    const res = await request(app).post('/api/auth/register').send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(201);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('never returns the code and answers the same for unknown accounts', async () => {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: EMAIL });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    expect(Object.keys(known.body)).toEqual(['message']);

    expect(sentCodes).toHaveLength(1);
    const code = lastCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(known.body)).not.toContain(code);

    const user = await User.findOne({ email: EMAIL }).lean();
    expect(user?.resetPasswordToken).toBeTruthy();
    expect(user?.resetPasswordToken).not.toBe(code);
  });

  it('does not accept an operator object instead of the code', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: { $ne: null }, newPassword: 'attacker-pass-1' });
    expect(res.status).toBe(400);

    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    expect(login.status).toBe(200);
  });

  it('resets the password with the right code exactly once', async () => {
    const code = lastCode();
    const ok = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: code, newPassword: 'brand-new-pass-1' });
    expect(ok.status).toBe(200);

    const reused = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: EMAIL, token: code, newPassword: 'another-pass-1' });
    expect(reused.status).toBe(400);

    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'brand-new-pass-1' });
    expect(login.status).toBe(200);
  });
});
