import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../scoping/parse-rfp/route';

describe('POST /api/scoping/parse-rfp', () => {
  it('returns 400 when no document or filename is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    expect(data.telemetry).toBeDefined();
  });
});
