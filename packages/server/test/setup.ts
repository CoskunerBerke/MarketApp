import { vi } from 'vitest';

// Test-only values; never real secrets.
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SCRAPER_API_KEY = 'test-scraper-key';
process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'https://client.example.test';
process.env.ADMIN_ORIGIN = 'https://admin.example.test';

// Keep request / audit logging out of the test output.
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
