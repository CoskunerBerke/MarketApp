import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { auditLogAction } from '../src/middleware/auditLogger';
import type { AuthRequest } from '../src/types';

// app.ts reads TRUST_PROXY when it is first imported, so this file imports it
// after setting the old Render value "true" (test files run in separate workers).
let app: Express;
let trustProxyWarnings: string[];

beforeAll(async () => {
  process.env.TRUST_PROXY = 'true';
  app = (await import('../src/app')).default;
  // Mock calls are cleared before each test, so keep the warnings logged during the import.
  trustProxyWarnings = vi.mocked(console.warn).mock.calls.map(([line]) => String(line)).filter((line) => line.includes('TRUST_PROXY'));
});

describe('TRUST_PROXY=true', () => {
  it('is treated as one proxy hop, with a single warning', () => {
    expect(trustProxyWarnings).toHaveLength(1);
    expect(trustProxyWarnings[0]).toContain('using 1 hop');
  });

  it('does not let spoofed X-Forwarded-For entries bypass the login rate limit', async () => {
    // The proxy appends the real client address as the last entry; everything
    // before it is chosen by the client. 10 attempts are allowed per window.
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', `10.0.${i}.1, 203.0.113.7`)
        .send({});
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((status) => status === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe('audit log', () => {
  it('logs the IP Express resolved (req.ip), not the raw X-Forwarded-For header', () => {
    const req = {
      method: 'POST',
      originalUrl: '/api/products/bulk',
      ip: '203.0.113.7',
      headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.7', 'user-agent': 'vitest' },
      socket: { remoteAddress: '10.1.2.3' },
      body: {},
    } as unknown as AuthRequest;

    auditLogAction(req, 'Test Action', 'success');

    const line = String(vi.mocked(console.log).mock.calls.at(-1)?.[0]);
    expect(line).toContain('[AUDIT]');
    expect(line).toContain('IP: 203.0.113.7 -');
    expect(line).not.toContain('6.6.6.6');
  });
});
