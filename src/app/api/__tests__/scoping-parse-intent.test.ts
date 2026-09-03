import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../scoping/parse-intent/route';

describe('POST /api/scoping/parse-intent', () => {
  it('returns 400 when prompt is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Prompt is required');
  });

  it('correctly classifies a RAG / AI Knowledge Base prompt with dependencies', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Build a private AI knowledge base with vector search, citations, and client portal',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('ai_rag_app');
    expect(data.baseEngineId).toBe('saas');
    expect(data.featureIds).toContain('ai_rag');
    expect(data.featureIds).toContain('auth');
    expect(data.confidenceScore).toBeGreaterThan(0.9);
    expect(data.telemetry).toBeDefined();
    expect(data.telemetry.tenantId).toBeDefined();
    expect(data.telemetry.latencyMs).toBeGreaterThan(0);
  });

  it('correctly classifies a Voice AI bot prompt', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Autonomous Voice AI calling bot with ElevenLabs integration',
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('voice_ai_agent_app');
    expect(data.featureIds).toContain('ai_voice_agent');
    expect(data.featureIds).toContain('ai_rag');
  });

  it('correctly classifies an E-Commerce storefront prompt', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Modern e-commerce brand store with product catalog, cart, and Razorpay checkout',
        currency: 'INR',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('ecommerce');
    expect(data.baseEngineId).toBe('multipage');
    expect(data.featureIds).toContain('commerce');
    expect(data.featureIds).toContain('payments');
  });

  it('correctly classifies a single-page landing page prompt', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'High converting landing page for my product launch waitlist',
        currency: 'USD',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('landing_page');
    expect(data.baseEngineId).toBe('landing');
  });

  it('correctly uses live Retriever classification when available', async () => {
    const mockIntentResponse = {
      success: true,
      data: {
        archetype_id: 'vision_ocr_saas',
        base_engine_id: 'saas',
        feature_ids: ['ai_vision_ocr', 'auth', 'payments'],
        brand_asset_id: 'basic',
        maintenance_plan_id: 'standard',
        suggested_timeline: '3 to 4 Weeks',
        confidence_score: 0.94,
        summary_rationale: 'Live classification from Retriever engine.',
        retriever_engine_recommended: true,
        unrecognized_requirements: [],
      },
      model: 'meta-llama/llama-3.3-70b-instruct',
      provider: 'groq',
      inputTokens: 120,
      outputTokens: 60,
      latencyMs: 145,
    };

    const originalFetch = global.fetch;
    const prevTenant = process.env.RETRIEVER_SCOPING_TENANT_ID;
    const prevKey = process.env.RETRIEVER_SCOPING_API_KEY;

    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_scoping';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_key';

    global.fetch = async () =>
      new Response(JSON.stringify(mockIntentResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Need a document OCR scanner with automated invoice parsing',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.telemetry.fallbackMode).toBe(false);
      expect(data.telemetry.modelUsed).toBe('meta-llama/llama-3.3-70b-instruct');
      expect(data.archetypeId).toBe('vision_ocr_saas');
      expect(data.featureIds).toContain('ai_vision_ocr');
    } finally {
      global.fetch = originalFetch;
      process.env.RETRIEVER_SCOPING_TENANT_ID = prevTenant;
      process.env.RETRIEVER_SCOPING_API_KEY = prevKey;
    }
  });

  it('marks fallbackMode: true and modelUsed: rule-based-fallback on network error', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error('Connection refused to rag.prateeq.in');
    };

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Autonomous Voice AI bot with ElevenLabs integration',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.telemetry.fallbackMode).toBe(true);
      expect(data.telemetry.modelUsed).toBe('rule-based-fallback');
      expect(data.archetypeId).toBe('voice_ai_agent_app');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

