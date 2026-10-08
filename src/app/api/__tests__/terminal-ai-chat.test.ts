import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../terminal/ai-chat/route';

describe('/api/terminal/ai-chat route', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns 400 if query is missing or empty', async () => {
    const req = new NextRequest('http://localhost/api/terminal/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Query is required.');
  });

  it('successfully proxies query to Retriever chat completions endpoint', async () => {
    const mockRetrieverResponse = {
      choices: [
        {
          message: {
            content: "I'm Prateek's AI Twin running live on Retriever!",
          },
        },
      ],
      citations: [
        { doc_id: 'PRATEEQ_KNOWLEDGE_DOSSIER.md' },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: vi.fn((key: string) => (key === 'x-cache-lookup' ? 'HIT' : null)),
      },
      json: vi.fn().mockResolvedValue(mockRetrieverResponse),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/terminal/ai-chat', {
      method: 'POST',
      body: JSON.stringify({
        query: 'What are Prateek top projects?',
        history: [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hey there' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.reply).toBe("I'm Prateek's AI Twin running live on Retriever!");
    expect(data.citations).toHaveLength(1);
    expect(data.cacheLookup).toBe('HIT');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/chat/completions');
    const sentBody = JSON.parse(options.body);
    expect(sentBody.messages).toHaveLength(4);
    expect(sentBody.messages[0].role).toBe('system');
    expect(sentBody.messages[3]).toEqual({ role: 'user', content: 'What are Prateek top projects?' });
    expect(sentBody.use_repl).toBe(false);
  });

  it('handles upstream HTTP error gracefully with a neural glitch notice', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('Service Unavailable'),
    } as unknown as Response);

    const req = new NextRequest('http://localhost/api/terminal/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'ping' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('Neural Glitch');
    expect(data.error).toBe('Service Unavailable');
  });

  it('handles network failure with 500 status', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const req = new NextRequest('http://localhost/api/terminal/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ query: 'ping' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.reply).toContain('Connection Timeout');
    expect(data.error).toBe('Connection refused');
  });
});
