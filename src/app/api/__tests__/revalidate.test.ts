import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

import { POST, GET } from '@/app/api/revalidate/route';

function makeNextRequest(url: string, method: string) {
  return new NextRequest(url, { method });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    vi.stubEnv('SYNC_API_KEY', 'my-secret');
  });

  it('returns 401 without secret', async () => {
    const res = await POST(makeNextRequest('http://localhost/api/revalidate', 'POST'));
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong secret', async () => {
    const res = await POST(makeNextRequest('http://localhost/api/revalidate?secret=wrong', 'POST'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with correct secret via query param', async () => {
    const res = await POST(makeNextRequest('http://localhost/api/revalidate?secret=my-secret', 'POST'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.revalidated).toBe(true);
  });

  it('returns 200 with correct secret via header', async () => {
    const req = new NextRequest('http://localhost/api/revalidate', {
      method: 'POST',
      headers: { 'x-api-key': 'my-secret' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/revalidate', () => {
  beforeEach(() => {
    vi.stubEnv('SYNC_API_KEY', 'my-secret');
  });

  it('returns 401 without secret', async () => {
    const res = await GET(makeNextRequest('http://localhost/api/revalidate', 'GET'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with correct secret', async () => {
    const res = await GET(makeNextRequest('http://localhost/api/revalidate?secret=my-secret', 'GET'));
    expect(res.status).toBe(200);
  });
});
