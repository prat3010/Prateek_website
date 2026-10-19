import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import pako from 'pako';
import { POST, extractTextFromPdfBuffer } from '../scoping/parse-rfp/route';

describe('POST /api/scoping/parse-rfp', () => {
  it('returns 400 when no document or filename is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.1',
      },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('No document file provided');
  });

  it('returns 415 for unsupported file extension', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.2',
      },
      body: JSON.stringify({ filename: 'design.png', content: 'binary' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(415);
    const data = await res.json();
    expect(data.error).toContain('Unsupported file format');
  });

  it('parses a text/markdown PRD file into structured blueprint', async () => {
    const prdContent = `
# Project RFP: Enterprise AI Knowledge Base & RAG Copilot
We need a SaaS platform where enterprise teams can upload PDFs, search semantically with pgvector, and ask questions with cited sources.
Requirements:
- User login with Google OAuth
- Admin center for managing users
- Citation downloads
- Billing subscriptions
    `;
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.3',
      },
      body: JSON.stringify({ filename: 'enterprise_rag_prd.md', content: prdContent }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('ai_rag_app');
    expect(data.baseEngineId).toBe('saas');
    expect(data.featureIds).toContain('ai_rag');
    expect(data.featureIds).toContain('auth');
    expect(data.featureIds).not.toContain('search');
    expect(data.telemetry).toBeDefined();
    expect(data.telemetry.modelUsed).toBe('catalog-heuristic-extractor');
  });

  it('correctly maps RFP with LMS to cms instead of phantom blog', async () => {
    const prdContent = `
# Project RFP: Course Learning Academy
Requirements:
- Student login
- Video courses and lessons
- Payment gateway for course enrollments
    `;
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.4',
      },
      body: JSON.stringify({ filename: 'lms_prd.md', content: prdContent }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.archetypeId).toBe('lms_portal');
    expect(data.featureIds).toContain('cms');
    expect(data.featureIds).not.toContain('blog');
  });

  it('correctly maps RFP with E-Commerce to integrations instead of phantom analytics', async () => {
    const prdContent = `
# Project RFP: Direct to Consumer E-Commerce Store
Requirements:
- Product catalog
- Shopping cart
- Checkout and payments
    `;
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.5',
      },
      body: JSON.stringify({ filename: 'store_rfp.md', content: prdContent }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.archetypeId).toBe('ecommerce');
    expect(data.featureIds).toContain('integrations');
    expect(data.featureIds).not.toContain('analytics');
  });

  it('handles multipart/form-data file upload with text sanitization', async () => {
    const mockFile = {
      name: 'healthcare_voice.txt',
      size: 120,
      text: async () => '# RFP: Healthcare AI\nNeed speech calling bot with appointment booking\x00\x08',
    };
    const mockFormData = {
      get: (key: string) => (key === 'file' ? mockFile : 'USD'),
    };

    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '10.0.1.6',
      },
    });
    vi.spyOn(req, 'formData').mockResolvedValue(mockFormData as unknown as FormData);

    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.archetypeId).toBe('voice_ai_agent_app');
    expect(data.featureIds).toContain('ai_voice_agent');
    expect(data.featureIds).toContain('ai_rag');
  });

  it('returns 413 when file exceeds maximum allowed size (25MB)', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.7',
      },
      body: JSON.stringify({
        filename: 'huge_document.pdf',
        content: 'content',
        size: 30 * 1024 * 1024, // 30MB
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toContain('File exceeds maximum allowed size');
  });

  it('wires to live cognitive RetrieverClient when API key and tenant are configured', async () => {
    const mockIntentResponse = {
      success: true,
      data: {
        archetype_id: 'vision_ocr_saas',
        base_engine_id: 'saas',
        feature_ids: ['ai_vision_ocr', 'auth', 'payments', 'admin', 'email'],
        brand_asset_id: 'comprehensive',
        maintenance_plan_id: 'standard',
        suggested_timeline: '3 to 4 Weeks',
        confidence_score: 0.98,
        summary_rationale: 'Extracted by live Retriever LLM cognitive analysis.',
        retriever_engine_recommended: true,
        unrecognized_requirements: [],
      },
      model: 'meta-llama/llama-3.3-70b-instruct',
      provider: 'groq',
      inputTokens: 320,
      outputTokens: 95,
      latencyMs: 142,
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
      const prdContent = `
# Project RFP: Multi-page Invoice Extraction and Vision OCR Platform
We need automated extraction of invoices with PDF document layout recognition.
Users need to log in and pay with Razorpay.
      `;
      const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.1.8',
        },
        body: JSON.stringify({
          filename: 'invoice_spec.md',
          content: prdContent,
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

  it('falls back to catalog heuristic when Retriever LLM throws network error', async () => {
    const originalFetch = global.fetch;
    const prevTenant = process.env.RETRIEVER_SCOPING_TENANT_ID;
    const prevKey = process.env.RETRIEVER_SCOPING_API_KEY;

    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_scoping';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_key';

    global.fetch = async () => {
      throw new Error('Connection refused to rag.prateeq.in');
    };

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.1.9',
        },
        body: JSON.stringify({
          filename: 'voice_ai_agent.md',
          content: 'Need conversational Voice AI calling bot with speech synthesis and knowledge base',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.telemetry.fallbackMode).toBe(true);
      expect(data.telemetry.modelUsed).toBe('catalog-heuristic-extractor');
      expect(data.archetypeId).toBe('voice_ai_agent_app');
      expect(data.featureIds).toContain('ai_voice_agent');
    } finally {
      global.fetch = originalFetch;
      process.env.RETRIEVER_SCOPING_TENANT_ID = prevTenant;
      process.env.RETRIEVER_SCOPING_API_KEY = prevKey;
    }
  });

  it('stays in fallback mode when RETRIEVER_SCOPING_TENANT_ID is unconfigured even if API key exists', async () => {
    const prevTenant = process.env.RETRIEVER_SCOPING_TENANT_ID;
    const prevKey = process.env.RETRIEVER_SCOPING_API_KEY;

    delete process.env.RETRIEVER_SCOPING_TENANT_ID;
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_key_without_tenant';

    try {
      const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.1.10',
        },
        body: JSON.stringify({
          filename: 'autonomous_agents.md',
          content: 'Need autonomous AI agent with tool calling and vector memory',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.telemetry.fallbackMode).toBe(true);
      expect(data.telemetry.modelUsed).toBe('catalog-heuristic-extractor');
      expect(data.archetypeId).toBe('autonomous_agents');
      expect(data.featureIds).toContain('ai_agents');
    } finally {
      process.env.RETRIEVER_SCOPING_TENANT_ID = prevTenant;
      process.env.RETRIEVER_SCOPING_API_KEY = prevKey;
    }
  });

  it('extracts text streams directly from binary PDF files via extractTextFromPdfBuffer', async () => {
    const streamContent = 'BT /F1 12 Tf (Enterprise AI Knowledge Base and RAG specifications) Tj ET';
    const compressed = pako.deflate(Buffer.from(streamContent, 'latin1'));
    const pdfBuffer = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length ' + compressed.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1'),
      compressed,
      Buffer.from('\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF', 'latin1'),
    ]);

    const extracted = extractTextFromPdfBuffer(pdfBuffer);
    expect(extracted).toContain('Enterprise AI Knowledge Base and RAG specifications');

    // Test uploading this PDF via multipart/form-data with local heuristic isolation
    const prevTenant = process.env.RETRIEVER_SCOPING_TENANT_ID;
    const prevKey = process.env.RETRIEVER_SCOPING_API_KEY;
    delete process.env.RETRIEVER_SCOPING_TENANT_ID;
    delete process.env.RETRIEVER_SCOPING_API_KEY;

    try {
      const mockFile = {
        name: 'enterprise_spec.pdf',
        size: pdfBuffer.length,
        arrayBuffer: async () => pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength),
      };
      const mockFormData = {
        get: (key: string) => (key === 'file' ? mockFile : 'USD'),
      };

      const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '10.0.1.11',
        },
      });
      vi.spyOn(req, 'formData').mockResolvedValue(mockFormData as unknown as FormData);

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.archetypeId).toBe('ai_rag_app');
      expect(data.featureIds).toContain('ai_rag');
      expect(data.telemetry.fallbackMode).toBe(true);
    } finally {
      process.env.RETRIEVER_SCOPING_TENANT_ID = prevTenant;
      process.env.RETRIEVER_SCOPING_API_KEY = prevKey;
    }
  });
});
