import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, rateLimitResponse, getClientIdentifier, applyRateLimitHeaders } from '../rateLimit';
import { NextRequest, NextResponse } from 'next/server';

describe('Universal Rate Limiter (Edge AI Token Shield)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('correctly derives client identifier from x-forwarded-for or explicit ID', () => {
    const req1 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    expect(getClientIdentifier(req1)).toBe('203.0.113.195');

    const req2 = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '198.51.100.22' },
    });
    expect(getClientIdentifier(req2)).toBe('198.51.100.22');

    const explicit = getClientIdentifier(req2, 'user_12345');
    expect(explicit).toBe('user_12345');
  });

  it('allows requests within rate limit budget using in-memory engine', async () => {
    const scope = `test_allow_${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    const res1 = await checkRateLimit(req, { scope, limit: 3, windowSeconds: 60 });
    expect(res1.success).toBe(true);
    expect(res1.limit).toBe(3);
    expect(res1.remaining).toBe(2);
    expect(res1.engine).toBe('memory');

    const res2 = await checkRateLimit(req, { scope, limit: 3, windowSeconds: 60 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(req, { scope, limit: 3, windowSeconds: 60 });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests once rate limit is exceeded and returns retryAfter', async () => {
    const scope = `test_block_${Date.now()}`;
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '5.6.7.8' },
    });

    // Exhaust quota of 2
    await checkRateLimit(req, { scope, limit: 2, windowSeconds: 10 });
    await checkRateLimit(req, { scope, limit: 2, windowSeconds: 10 });

    // 3rd attempt should be blocked
    const blocked = await checkRateLimit(req, { scope, limit: 2, windowSeconds: 10 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    const res429 = rateLimitResponse(blocked);
    expect(res429.status).toBe(429);
    expect(res429.headers.get('Retry-After')).toBe(String(blocked.retryAfter));
    expect(res429.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(res429.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('applies rate limit headers to successful responses', () => {
    const mockResult = {
      success: true,
      limit: 10,
      remaining: 9,
      reset: 1700000000,
      retryAfter: 0,
      engine: 'memory' as const,
    };
    const res = NextResponse.json({ ok: true });
    applyRateLimitHeaders(res, mockResult);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
    expect(res.headers.get('X-RateLimit-Reset')).toBe('1700000000');
  });

  it('handles Upstash Redis REST when credentials are provided', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake-upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake_token';

    const globalFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { result: 0 },
        { result: 1 }, // currentCount = 1
        { result: 1 },
        { result: 1 },
      ],
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '9.10.11.12' },
    });

    const res = await checkRateLimit(req, { scope: 'upstash_test', limit: 5, windowSeconds: 60 });
    expect(globalFetch).toHaveBeenCalled();
    expect(res.engine).toBe('upstash');
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(3);
  });

  it('falls back to memory engine if Upstash fetch fails', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://broken-upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'broken_token';

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '13.14.15.16' },
    });

    const res = await checkRateLimit(req, { scope: 'fallback_test', limit: 5, windowSeconds: 60 });
    expect(res.engine).toBe('memory');
    expect(res.success).toBe(true);
  });
});
