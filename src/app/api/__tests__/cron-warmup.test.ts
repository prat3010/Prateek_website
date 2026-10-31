import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../cron/warmup/route';

describe('/api/cron/warmup route', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CRON_SECRET = 'cron_test_secret';
    process.env.RETRIEVER_PORTFOLIO_TENANT_ID = 'portfolio_tenant';
    process.env.RETRIEVER_PORTFOLIO_API_KEY = 'portfolio_key';
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'scoping_tenant';
    process.env.RETRIEVER_SCOPING_API_KEY = 'scoping_key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it('rejects requests without the cron secret', async () => {
    const req = new NextRequest('http://localhost/api/cron/warmup', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 503 when no tenant can be warmed', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('upstream timeout'));

    const req = new NextRequest('http://localhost/api/cron/warmup', {
      method: 'POST',
      headers: { Authorization: 'Bearer cron_test_secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.warmed).toBe(0);
    expect(data.failed).toBe(2);
    expect(data.skipped).toBe(0);
  });

  it('returns 503 when one configured tenant fails and the other warms', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ latency_ms: 12000, generation_latency_ms: 250 }),
      } as unknown as Response)
      .mockRejectedValueOnce(new Error('scoping warmup timeout'));

    const req = new NextRequest('http://localhost/api/cron/warmup', {
      method: 'POST',
      headers: { Authorization: 'Bearer cron_test_secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.warmed).toBe(1);
    expect(data.failed).toBe(1);
    expect(data.skipped).toBe(0);
    expect(data.results[0].name).toBe('portfolio');
    expect(data.results[1].status).toBe('error');
  });

  it('does not call Retriever with implicit tenant fallbacks when env is absent', async () => {
    delete process.env.RETRIEVER_PORTFOLIO_TENANT_ID;
    delete process.env.RETRIEVER_PORTFOLIO_API_KEY;
    delete process.env.RETRIEVER_SCOPING_TENANT_ID;
    delete process.env.RETRIEVER_SCOPING_API_KEY;
    global.fetch = vi.fn();

    const req = new NextRequest('http://localhost/api/cron/warmup', {
      method: 'POST',
      headers: { Authorization: 'Bearer cron_test_secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.warmed).toBe(0);
    expect(data.failed).toBe(0);
    expect(data.skipped).toBe(2);
    expect(data.results.every((result: { status: string }) => result.status === 'skipped')).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 200 when at least one tenant warms', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ latency_ms: 12000, generation_latency_ms: 250 }),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/cron/warmup', {
      method: 'POST',
      headers: { Authorization: 'Bearer cron_test_secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.warmed).toBe(2);
    expect(data.results[0].generationLatencyMs).toBe(250);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
