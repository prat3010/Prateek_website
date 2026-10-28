import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../scoping/session/route';
import { RetrieverClient } from '@/lib/rag-client';

describe('POST /api/scoping/session', () => {
  const origTenant = process.env.RETRIEVER_SCOPING_TENANT_ID;
  const origKey = process.env.RETRIEVER_SCOPING_API_KEY;

  beforeEach(() => {
    process.env.RETRIEVER_SCOPING_TENANT_ID = 'test_tenant_live_123';
    process.env.RETRIEVER_SCOPING_API_KEY = 'test_api_key_live_456';
  });

  afterEach(() => {
    if (origTenant) process.env.RETRIEVER_SCOPING_TENANT_ID = origTenant;
    else delete process.env.RETRIEVER_SCOPING_TENANT_ID;

    if (origKey) process.env.RETRIEVER_SCOPING_API_KEY = origKey;
    else delete process.env.RETRIEVER_SCOPING_API_KEY;
  });

  it('returns existing session if cookie is present and valid', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/session', {
      method: 'POST',
      headers: {
        cookie: 'prateeq_chat_session_id=existing-session-123',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBe('existing-session-123');
    expect(data.isExisting).toBe(true);
  });

  it('creates new session via RetrieverClient when cookie is absent', async () => {
    const createSessionSpy = vi
      .spyOn(RetrieverClient.prototype, 'createSession')
      .mockResolvedValueOnce({
        sessionId: 'new-retriever-session-999',
        createdAt: new Date().toISOString(),
      });

    const req = new NextRequest('http://localhost:3000/api/scoping/session', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBe('new-retriever-session-999');
    expect(data.isExisting).toBe(false);
    expect(res.headers.get('set-cookie')).toContain('prateeq_chat_session_id=new-retriever-session-999');

    createSessionSpy.mockRestore();
  });

  it('handles RetrieverClient failure gracefully without 500 error', async () => {
    const createSessionSpy = vi
      .spyOn(RetrieverClient.prototype, 'createSession')
      .mockRejectedValueOnce(new Error('Connection refused'));

    const req = new NextRequest('http://localhost:3000/api/scoping/session', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBeNull();
    expect(data.error).toBe('Connection refused');

    createSessionSpy.mockRestore();
  });

  it('returns informative error when credentials are not configured', async () => {
    delete process.env.RETRIEVER_SCOPING_TENANT_ID;
    delete process.env.RETRIEVER_SCOPING_API_KEY;

    const req = new NextRequest('http://localhost:3000/api/scoping/session', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBeNull();
    expect(data.error).toBe('Retriever credentials missing');
  });
});
