import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../rag/guest/[...path]/route';

const GUEST_TENANT = '11111111-1111-4111-8111-111111111111';
const GUEST_KEY = 'ret_live_test_guest_key';
const GUEST_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let requestCounter = 0;

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function guestRequest(path: string, body: unknown, headers: Record<string, string> = {}) {
  requestCounter += 1;
  return new NextRequest(`http://localhost/api/rag/guest/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `203.0.113.${requestCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('/api/rag/guest proxy', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.RETRIEVER_GUEST_TENANT_ID = GUEST_TENANT;
    process.env.RETRIEVER_GUEST_API_KEY = GUEST_KEY;
    process.env.RETRIEVER_API_URL = 'https://retriever.test';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('returns 503 when guest credentials are absent', async () => {
    delete process.env.RETRIEVER_GUEST_TENANT_ID;
    delete process.env.RETRIEVER_GUEST_API_KEY;
    delete process.env.RETRIEVER_SCOPING_TENANT_ID;
    delete process.env.RETRIEVER_SCOPING_API_KEY;
    global.fetch = vi.fn();

    const res = await POST(guestRequest('search', { query: 'hello' }), context(['search']));

    expect(res.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects tenant paths outside the configured guest tenant', async () => {
    global.fetch = vi.fn();

    const res = await POST(
      guestRequest('v1/tenants/other-tenant/search', { query: 'hello' }),
      context(['v1', 'tenants', 'other-tenant', 'search'])
    );

    expect(res.status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('injects the server key and strips caller credentials for search', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-cache-lookup': 'MISS' },
      })
    );

    const res = await POST(
      guestRequest(
        'search',
        { query: 'hybrid retrieval', limit: 99, enable_hybrid: true, enable_colbert_rerank: true },
        { authorization: 'Bearer attacker-key', 'x-user-id': 'spoofed-user' }
      ),
      context(['search'])
    );

    expect(res.status).toBe(200);
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`https://retriever.test/v1/tenants/${GUEST_TENANT}/search`);
    expect((options.headers as Headers).get('Authorization')).toBe(`Bearer ${GUEST_KEY}`);
    const sentBody = JSON.parse(options.body);
    expect(sentBody.limit).toBe(5);
    expect(sentBody.enable_hybrid).toBe(true);
    expect(sentBody.enable_colbert_rerank).toBe(true);
    expect((options.headers as Headers).get('X-User-ID')).toMatch(GUEST_USER_ID_PATTERN);
    expect((options.headers as Headers).get('X-User-ID')).not.toBe('spoofed-user');
  });

  it('honors an explicit hybrid opt-out and defaults it on when omitted', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await POST(
      guestRequest('search', { query: 'exact lookup', enable_hybrid: false }),
      context(['search'])
    );
    const optOut = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(optOut.enable_hybrid).toBe(false);

    await POST(guestRequest('search', { query: 'default lookup' }), context(['search']));
    const defaulted = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body
    );
    expect(defaulted.enable_hybrid).toBe(true);
  });

  it('maps the public tenant alias to the configured tenant for widget sessions', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sessionId: 'session-1', createdAt: 'now' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );

    const res = await POST(
      guestRequest('v1/tenants/guest/chat/sessions', { user_id: 'client-chosen' }),
      context(['v1', 'tenants', 'guest', 'chat', 'sessions'])
    );

    expect(res.status).toBe(201);
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`https://retriever.test/v1/tenants/${GUEST_TENANT}/chat/sessions`);
    const sentBody = JSON.parse(options.body);
    expect(sentBody.user_id).toMatch(GUEST_USER_ID_PATTERN);
    expect((options.headers as Headers).get('X-User-ID')).toBe(sentBody.user_id);
    expect(sentBody.user_id).not.toBe('client-chosen');
  });

  it('streams SSE bodies through without buffering or rewriting', async () => {
    const sse = 'data: {"token":"Hello"}\n\ndata: [DONE]\n\n';
    global.fetch = vi.fn().mockResolvedValue(
      new Response(sse, {
        status: 200,
        headers: { 'content-type': 'text/event-stream', 'x-cache-lookup': 'MISS' },
      })
    );

    const res = await POST(
      guestRequest('v1/tenants/guest/chat/sessions/session-1/messages', { query: 'hi' }),
      context(['v1', 'tenants', 'guest', 'chat', 'sessions', 'session-1', 'messages'])
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('x-accel-buffering')).toBe('no');
    expect(await res.text()).toBe(sse);
  });

  it('rejects invalid, oversized, and malformed request bodies', async () => {
    global.fetch = vi.fn();

    const invalid = await POST(guestRequest('search', { query: '   ' }), context(['search']));
    expect(invalid.status).toBe(400);

    const tooLarge = await POST(
      guestRequest('search', { query: 'x'.repeat(17 * 1024) }),
      context(['search'])
    );
    expect(tooLarge.status).toBe(413);

    const badJson = new NextRequest('http://localhost/api/rag/guest/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.250' },
      body: '{not-json',
    });
    const malformed = await POST(badJson, context(['search']));
    expect(malformed.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects non-POST methods', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });
});
