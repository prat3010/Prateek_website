import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../scoping/chat/route';
import { RetrieverClient } from '@/lib/rag-client';

async function parseSseStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.delta) accumulated += parsed.delta;
          else if (parsed.text) accumulated += parsed.text;
          else if (parsed.content) accumulated += parsed.content;
        } catch {
          // ignore non-json
        }
      }
    }
  }
  return accumulated;
}

describe('POST /api/scoping/chat', () => {
  it('returns 400 when message is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Message is required');
  });

  it('streams response with text/event-stream and X-Session-ID header', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'I want to build a SaaS MVP with billing and user auth',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(res.headers.get('X-Session-ID')).toBeTruthy();

    expect(res.body).toBeTruthy();
    const accumulatedText = await parseSseStream(res.body!);

    expect(accumulatedText).toContain('<blueprint_action>');
    expect(accumulatedText).toContain('</blueprint_action>');

    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.baseEngineId).toBe('saas');
    expect(blueprint.featureIds).toContain('auth');
    expect(blueprint.featureIds).toContain('payments');
    expect(blueprint.totalUSD).toBeGreaterThan(0);
    expect(blueprint.totalINR).toBeGreaterThan(0);
  });

  it('preserves existing sessionId in X-Session-ID header', async () => {
    const existingSessionId = 'test_session_existing_12345';
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'I need an e-commerce store with checkout',
        sessionId: existingSessionId,
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Session-ID')).toBe(existingSessionId);

    const accumulatedText = await parseSseStream(res.body!);
    expect(accumulatedText).toContain('<blueprint_action>');
    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.baseEngineId).toBe('multipage');
    expect(blueprint.featureIds).toContain('commerce');
    expect(blueprint.featureIds).toContain('payments');
  });

  it('handles creator YouTube VIP vault prompt with video and merch features', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message:
          'I am a gaming YouTuber looking to sell custom merchandise and build a VIP vault for behind-the-scenes videos.',
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.featureIds).toContain('video');
    expect(blueprint.featureIds).toContain('commerce');
    expect(blueprint.featureIds).toContain('auth');
    expect(blueprint.featureIds).toContain('payments');
  });

  it('handles voice AI calling bot prompt with speech features', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Conversational voice AI agent calling bot with real-time audio',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.archetypeId).toBe('voice_ai_agent_app');
    expect(blueprint.featureIds).toContain('ai_voice_agent');
  });

  it('correctly classifies factory automation prompt from user screenshot', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'I have a factory, what can be automated?',
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.archetypeId).toBe('autonomous_agents');
    expect(blueprint.featureIds).toContain('ai_agents');
    expect(blueprint.featureIds).toContain('admin');
    expect(blueprint.maintenancePlanId).toBe('premium');
    expect(blueprint.totalINR).toBeGreaterThan(0);
    expect(blueprint.totalUSD).toBeGreaterThan(0);
  });

  it('correctly classifies private AI knowledge base / RAG prompt', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'I need a private AI knowledge base for company documents with vector search and citations',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.archetypeId).toBe('ai_rag_app');
    expect(blueprint.featureIds).toContain('ai_rag');
    expect(blueprint.maintenancePlanId).toBe('premium');
  });

  it('handles client AbortSignal cancellation cleanly without unhandled rejections', async () => {
    const abortController = new AbortController();
    abortController.abort(); // already aborted

    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test cancelled request',
        currency: 'USD',
      }),
      signal: abortController.signal,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
  });

  it('streams upstream tokens directly when RetrieverClient succeeds', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const encoder = new TextEncoder();
    const mockUpstreamStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"event":"token","delta":"Live Retriever guidance"}\n\n')
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const createSessionSpy = vi
      .spyOn(RetrieverClient.prototype, 'createSession')
      .mockResolvedValue({ sessionId: 'session_mock_777', createdAt: new Date().toISOString() });
    const chatSpy = vi
      .spyOn(RetrieverClient.prototype, 'chat')
      .mockResolvedValue(mockUpstreamStream);

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Can you recommend an architecture?',
          currency: 'USD',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Session-ID')).toBe('session_mock_777');
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');

      const text = await parseSseStream(res.body!);
      expect(text).toContain('Live Retriever guidance');
    } finally {
      createSessionSpy.mockRestore();
      chatSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('gracefully falls back to local blueprint generator when RetrieverClient throws', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const createSessionSpy = vi
      .spyOn(RetrieverClient.prototype, 'createSession')
      .mockRejectedValue(new Error('Connection refused by VPS'));

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Build me an online store with checkout',
          currency: 'INR',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Fallback-Mode')).toBe('true');

      const text = await parseSseStream(res.body!);
      expect(text).toContain('<blueprint_action>');
      expect(text).toContain('Direct-to-Consumer E-Commerce Store');
    } finally {
      createSessionSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });
});
