import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => ({
  supabase: null,
}));

let lastSendPayload: Record<string, unknown> | null = null;

vi.mock('resend', () => ({
  Resend: class MockResend {
    constructor() {}
    emails = {
      send: vi.fn((payload: Record<string, unknown>) => {
        lastSendPayload = payload;
        return Promise.resolve({ data: { id: 'test-id' }, error: null });
      }),
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
    lastSendPayload = null;
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

  it('returns 400 when message exceeds 10000 chars', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'x'.repeat(10001) }));
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

  it('attaches the proposal PDF to the email', async () => {
    const pdfAttachment = { content: 'JVBERi0xLjQgLS1mYWtl', filename: 'Acme_Scoping_Brief_Agreement.pdf' };
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'hi', pdfAttachment }));
    expect(res.status).toBe(200);
    expect(lastSendPayload?.attachments).toEqual([
      {
        content: 'JVBERi0xLjQgLS1mYWtl',
        filename: 'Acme_Scoping_Brief_Agreement.pdf',
        content_type: 'application/pdf',
      },
    ]);
  });

  it('sends email without attachments when none provided', async () => {
    const res = await POST(makeRequest({ name: 'Test', email: 'a@b.com', message: 'hi' }));
    expect(res.status).toBe(200);
    expect(lastSendPayload?.attachments).toEqual([]);
  });

  it('returns 400 when attachment content is not a string', async () => {
    const res = await POST(makeRequest({
      name: 'Test',
      email: 'a@b.com',
      message: 'hi',
      pdfAttachment: { content: 123, filename: 'x.pdf' },
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when attachment filename is not a PDF', async () => {
    const res = await POST(makeRequest({
      name: 'Test',
      email: 'a@b.com',
      message: 'hi',
      pdfAttachment: { content: 'base64', filename: 'notes.txt' },
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when attachment exceeds size limit', async () => {
    const res = await POST(makeRequest({
      name: 'Test',
      email: 'a@b.com',
      message: 'hi',
      pdfAttachment: { content: 'x'.repeat(7_000_001), filename: 'big.pdf' },
    }));
    expect(res.status).toBe(400);
  });
});
