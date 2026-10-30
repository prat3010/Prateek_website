import { afterEach, describe, expect, it, vi } from 'vitest';
import { RetrieverClient } from '../rag-client';

const USER_ID = '00000000-0000-4000-a000-000000000001';

function makeClient() {
  return new RetrieverClient({
    apiUrl: 'https://rag.example/',
    tenantId: 'tenant_1',
    apiKey: 'ret_key_test',
    userId: USER_ID,
  });
}

describe('RetrieverClient streaming completions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('requests stream:true and returns the upstream body', async () => {
    const encoder = new TextEncoder();
    const expected =
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(encoder.encode(expected), { status: 200 })
    );
    global.fetch = fetchMock;

    const client = makeClient();
    const stream = await client.completionsStream(
      [{ role: 'user', content: 'hello' }],
      { max_tokens: 12, top_k: 3 }
    );

    const body = await new Response(stream).text();
    expect(body).toBe(expected);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rag.example/v1/tenants/tenant_1/chat/completions');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Accept).toBe('text/event-stream');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer ret_key_test'
    );

    const payload = JSON.parse(String(init.body));
    expect(payload.stream).toBe(true);
    expect(payload.max_tokens).toBe(12);
    expect(payload.top_k).toBe(3);
  });

  it('throws a truthful error when the upstream stream fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('provider unavailable', { status: 503 })
    );

    await expect(
      makeClient().completionsStream([{ role: 'user', content: 'hello' }])
    ).rejects.toThrow('Retriever completions stream error [503]');
  });

  it('passes the caller abort signal through session creation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sessionId: 'sess_1', createdAt: '2026-01-01' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    global.fetch = fetchMock;

    const controller = new AbortController();
    await makeClient().createSession(controller.signal);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});
