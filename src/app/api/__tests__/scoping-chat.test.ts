import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/scopingObservability', () => ({
  logScopingChatTrace: vi.fn().mockResolvedValue(undefined),
  stitchAnonymousSession: vi.fn().mockResolvedValue(undefined),
}));

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

function retrieverFrame(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

function createRetrieverSseStream(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
}

describe('POST /api/scoping/chat', () => {
  beforeEach(() => {
    process.env.RETRIEVER_SCOPING_USER_ID = '11111111-1111-4111-8111-111111111111';
  });

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

  it('streams live Retriever token frames directly when configured', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const streamSpy = vi
      .spyOn(RetrieverClient.prototype, 'completionsStream')
      .mockResolvedValue(
        createRetrieverSseStream([
          retrieverFrame('Live Retriever guidance with '),
          retrieverFrame('custom architecture recommendations.'),
          'data: [DONE]\n\n',
        ])
      );

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Can you recommend an architecture?',
          sessionId: 'session_mock_777',
          currency: 'USD',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Session-ID')).toBe('session_mock_777');
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');
      expect(res.headers.get('X-Fallback-Mode')).toBe('false');

      const text = await parseSseStream(res.body!);
      expect(text).toContain('Live Retriever guidance with custom architecture recommendations.');
      expect(text).toContain('<blueprint_action>');

      expect(streamSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: expect.stringContaining('Can you recommend an architecture?') }),
        ]),
        expect.objectContaining({
          enable_reranking: false,
          max_tokens: 800,
          top_k: 3,
          signal: expect.any(AbortSignal),
        })
      );
    } finally {
      streamSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('forwards conversation history to Retriever completions', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const streamSpy = vi
      .spyOn(RetrieverClient.prototype, 'completionsStream')
      .mockResolvedValue(
        createRetrieverSseStream([
          retrieverFrame('I remember our prior discussion about auth.'),
          'data: [DONE]\n\n',
        ])
      );

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Can you now add stripe billing?',
          history: [
            { role: 'user', content: 'I need auth' },
            { role: 'assistant', content: 'Sure, Supabase auth is recommended' },
          ],
          currency: 'USD',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(streamSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'I need auth' }),
          expect.objectContaining({ role: 'assistant', content: 'Sure, Supabase auth is recommended' }),
          expect.objectContaining({ role: 'user', content: expect.stringContaining('Can you now add stripe billing?') }),
        ]),
        expect.objectContaining({ enable_reranking: false })
      );
    } finally {
      streamSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('gracefully falls back to local blueprint generator when RetrieverClient throws', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const streamSpy = vi
      .spyOn(RetrieverClient.prototype, 'completionsStream')
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
      streamSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('falls back locally without calling Retriever when no API key is configured', async () => {
    const streamSpy = vi.spyOn(RetrieverClient.prototype, 'completionsStream');

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
      expect(streamSpy).not.toHaveBeenCalled();

      const text = await parseSseStream(res.body!);
      expect(text).toContain('<blueprint_action>');
    } finally {
      streamSpy.mockRestore();
    }
  });

  it('strips an upstream blueprint block split across frames and appends the canonical card', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const streamSpy = vi
      .spyOn(RetrieverClient.prototype, 'completionsStream')
      .mockResolvedValue(
        createRetrieverSseStream([
          retrieverFrame('Grounded architecture advice. <blueprint_'),
          retrieverFrame('action>{"featureIds":["hacked_module"]}</blueprint_action>'),
          retrieverFrame(' Keep the stack lean.'),
          'data: [DONE]\n\n',
        ])
      );

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'I need a private AI knowledge base with vector search',
          currency: 'USD',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Fallback-Mode')).toBe('false');

      const text = await parseSseStream(res.body!);
      expect(text).toContain('Grounded architecture advice.');
      expect(text).toContain('Keep the stack lean.');
      expect(text).not.toContain('hacked_module');
      expect(text.match(/<blueprint_action>/g)).toHaveLength(1);

      const match = text.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
      expect(match).toBeTruthy();
      const blueprint = JSON.parse(match![1].trim());
      expect(blueprint.featureIds).toContain('ai_rag');
      expect(blueprint.featureIds).not.toContain('hacked_module');
    } finally {
      streamSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('falls back when the upstream stream reports an error before any token', async () => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';

    const streamSpy = vi
      .spyOn(RetrieverClient.prototype, 'completionsStream')
      .mockResolvedValue(
        createRetrieverSseStream([
          `data: ${JSON.stringify({ error: 'The cognitive engine stream was interrupted. Please retry.', retryable: true })}\n\n`,
          'data: [DONE]\n\n',
        ])
      );

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
      expect(text).toContain('Direct-to-Consumer E-Commerce Store');
      expect(text).not.toContain('cognitive engine stream was interrupted');
    } finally {
      streamSpy.mockRestore();
      delete process.env.RETRIEVER_SCOPING_TENANT_ID;
      delete process.env.RETRIEVER_SCOPING_API_KEY;
    }
  });

  it('handles budget de-escalation query and generates phased MVP breakdown', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Can we sculpt a lean Phase 1 MVP under $3,000 / ₹2,50,000? What features can we de-scope?',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    expect(accumulatedText).toContain('Budget-Sculpted Architecture: Phased MVP Roadmap');
    expect(accumulatedText).toContain('Phase 1: Core Lean MVP');
    expect(accumulatedText).toContain('Phase 2: Scale & Automation');
    expect(accumulatedText).toContain('<blueprint_action>');

    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.phasedBreakdown).toBeDefined();
    expect(blueprint.phasedBreakdown.phase1).toBeDefined();
    expect(blueprint.phasedBreakdown.phase1.totalUSD).toBeGreaterThan(0);
    expect(blueprint.phasedBreakdown.phase1.featureIds.length).toBeGreaterThan(0);
    expect(blueprint.phasedBreakdown.phase2).toBeDefined();

    // Verify zero duplicate features between Phase 1 MVP and Phase 2 scale add-ons
    const phase1Set = new Set(blueprint.phasedBreakdown.phase1.featureIds);
    for (const fId of blueprint.phasedBreakdown.phase2.featureIds) {
      expect(phase1Set.has(fId)).toBe(false);
    }
  });

  it('provides Socratic diagnostic questions for brief/vague prompts', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'make app',
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    expect(accumulatedText).toContain('Socratic Diagnostic Alignment');
    expect(accumulatedText).toContain('Target Audience');
    expect(accumulatedText).toContain('Access & Monetization');
    expect(accumulatedText).toContain('<blueprint_action>');
  });

  it('handles active currentScope context for budget sculpting on Step 2', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'How can I cut $1,000 without losing core UX?',
        currency: 'USD',
        currentScope: {
          currentStep: 2,
          baseEngineId: 'saas',
          selectedFeatures: ['auth', 'payments', 'ai_rag', 'admin'],
          totalINR: 350000,
          totalUSD: 4200,
        },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    expect(accumulatedText).toContain('active Step 2 selection');
    expect(accumulatedText).toContain('Phase 1: Core Lean MVP');
    expect(accumulatedText).toContain('<blueprint_action>');

    const match = accumulatedText.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/);
    expect(match).toBeTruthy();
    const blueprint = JSON.parse(match![1].trim());
    expect(blueprint.baseEngineId).toBe('saas');
    expect(blueprint.phasedBreakdown).toBeDefined();
  });

  it('handles delivery timeline query with active currentScope context', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is the estimated delivery timeline for these exact modules?',
        currency: 'USD',
        currentScope: {
          currentStep: 2,
          baseEngineId: 'saas',
          selectedFeatures: ['auth', 'payments', 'ai_rag'],
          totalINR: 280000,
          totalUSD: 3400,
        },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const accumulatedText = await parseSseStream(res.body!);
    expect(accumulatedText).toContain('Estimated Production Delivery');
    expect(accumulatedText).toContain('Sprint Delivery Breakdown');
    expect(accumulatedText).toContain('<blueprint_action>');
  });
});
