import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/auth', () => ({
  isAdminEmail: vi.fn().mockReturnValue(false),
}));

describe('POST /api/terminal/query', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns 400 when query is empty', async () => {
    const { POST } = await import('@/app/api/terminal/query/route');
    const req = new NextRequest('http://localhost/api/terminal/query', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('uses Postgres websearch full-text search fallback without 500-row JS scanning', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    delete process.env.RETRIEVER_API_URL;

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([{ chunk_id: 'c1', content: 'pgvector HNSW', meta_data: {} }]), {
        status: 200,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('@/app/api/terminal/query/route');
    const req = new NextRequest('http://localhost/api/terminal/query', {
      method: 'POST',
      body: JSON.stringify({ query: 'pgvector' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.source).toBe('postgres_fts');
    expect(data.results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('wfts');
  });
});
