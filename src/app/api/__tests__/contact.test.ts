import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('resend', () => ({
  Resend: class MockResend {
    constructor() {}
    emails = {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    };
  },
}));

let testCounter = 0;
function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  testCounter++;
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `1.0.0.${testCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

import { POST } from '@/app/api/contact/route';

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('CONTACT_EMAIL_TO', 'test@example.com');
  });

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ name: 'Test', message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when fields are not strings', async () => {
    const res = await POST(makeRequest({ name: 123, email: 'a@b.com', message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 100 chars', async () => {
    const res = await POST(makeRequest({ name: 'x'.repeat(101), email: 'a@b.com', message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message exceeds 5000 chars', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'x'.repeat(5001) }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'not-an-email', message: 'hi' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'hi' }));
    expect(res.status).toBe(500);
  });

  it('returns 200 on successful email send', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'Hello' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 429 when rate limit exceeded', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'hi' }, { 'x-forwarded-for': ip }));
    }
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'hi' }, { 'x-forwarded-for': ip }));
    expect(res.status).toBe(429);
  });
});
