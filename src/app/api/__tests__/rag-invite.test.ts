import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => {
  const createChainableMock = () => {
    const chain: Record<string, any> = {};
    chain.select = () => chain;
    chain.delete = () => chain;
    chain.upsert = () => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'm-1', tenant_id: 'tenant-123', email: 'invited@example.com', role: 'member' }, error: null }),
      }),
    });
    chain.eq = () => chain;
    chain.order = () => Promise.resolve({ data: [{ id: '1', email: 'member@example.com', role: 'member', created_at: new Date().toISOString() }] });
    chain.maybeSingle = () => Promise.resolve({ data: { id: 'm-1', tenant_id: 'tenant-123', role: 'owner', email: 'owner@example.com' } });
    return chain;
  };
  return {
    supabase: {
      from: () => createChainableMock(),
    },
  };
});

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const auth = req.headers.get('Authorization');
    if (!auth) return null;
    return 'owner@example.com';
  }),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    constructor() {}
    emails = {
      send: vi.fn(() => Promise.resolve({ data: { id: 'email-id' }, error: null })),
    };
  },
}));

import { POST as POSTInvite } from '@/app/api/rag/invite/route';
import { GET as GETMembers, DELETE as DELETEMembers } from '@/app/api/rag/members/route';

describe('/api/rag/invite & /api/rag/members', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
  });

  it('rejects unauthenticated invitation requests with 401', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'invitee@example.com', role: 'member' }),
    });
    const res = await POSTInvite(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid email formats with 400', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock_token' },
      body: JSON.stringify({ email: 'invalid-email', role: 'member' }),
    });
    const res = await POSTInvite(req);
    expect(res.status).toBe(400);
  });

  it('successfully records team invitation and attempts Resend email', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock_token' },
      body: JSON.stringify({ email: 'newmember@example.com', role: 'member', tenantId: 'tenant-123' }),
    });
    const res = await POSTInvite(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.emailSent).toBe(true);
  });

  it('returns team members list for authenticated caller', async () => {
    const req = new Request('http://localhost/api/rag/members', {
      headers: { Authorization: 'Bearer mock_token' },
    });
    const res = await GETMembers(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.members)).toBe(true);
  });

  it('removes member access via DELETE /api/rag/members', async () => {
    const req = new Request('http://localhost/api/rag/members', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mock_token' },
      body: JSON.stringify({ memberId: 'm-1' }),
    });
    const res = await DELETEMembers(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
