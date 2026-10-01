import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';

// These requests are rejected before any database access, so no MongoDB is needed.

describe('error handling', () => {
  it('answers malformed JSON with a JSON 400 and no stack trace', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.(js|ts)|SyntaxError/);
  });

  it('validates register input instead of crashing on a missing body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it('validates forgot-password input', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('rejects operator objects as reset codes', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'victim@example.com', token: { $ne: null }, newPassword: 'attacker-pass-1' });
    expect(res.status).toBe(400);
  });
});

describe('CORS', () => {
  it('does not turn a disallowed origin into a 500', async () => {
    const res = await request(app).get('/api/system/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows the configured client origin', async () => {
    const res = await request(app).get('/api/system/health').set('Origin', 'https://client.example.test');
    expect(res.headers['access-control-allow-origin']).toBe('https://client.example.test');
  });
});

describe('product query validation', () => {
  it('rejects invalid ObjectIds with 400 instead of a 500 CastError', async () => {
    const res = await request(app).get('/api/products?marketId=abc');
    expect(res.status).toBe(400);
  });

  it('rejects repeated search parameters', async () => {
    const res = await request(app).get('/api/products?search=a&search=b');
    expect(res.status).toBe(400);
  });
});

describe('scraper endpoints', () => {
  it('requires the right API key (compared in constant time)', async () => {
    const res = await request(app)
      .post('/api/products/bulk')
      .set('x-api-key', 'wrong-key')
      .send({ marketName: 'BİM', products: [] });
    expect(res.status).toBe(401);
  });

  it('validates bulk payloads before touching the database', async () => {
    const res = await request(app)
      .post('/api/products/bulk')
      .set('x-api-key', 'test-scraper-key')
      .send({ marketName: 'BİM', products: [{ name: 'Demo', price: 1, sourceUrl: 'javascript:alert(1)' }] });
    expect(res.status).toBe(400);
  });

  it('no longer exposes the old /api/debug/sok route', async () => {
    const res = await request(app).get('/api/debug/sok');
    expect(res.status).toBe(404);
  });

  it('rejects markets without a server-side scraper instead of reporting a fake start', async () => {
    for (const market of ['migros', 'unknown']) {
      const res = await request(app).post(`/api/scrape/${market}`).set('x-api-key', 'test-scraper-key');
      expect(res.status).toBe(400);
    }
  });
});
