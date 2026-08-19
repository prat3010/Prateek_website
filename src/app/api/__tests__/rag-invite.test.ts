import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => {
  type MemberRecord = { id: string; tenant_id: string; email: string; role: string; created_at?: string };

  const membersStore: MemberRecord[] = [
    { id: 'm-owner', tenant_id: 'tenant-123', email: 'owner@example.com', role: 'owner', created_at: new Date().toISOString() },
    { id: 'm-admin', tenant_id: 'tenant-123', email: 'admin@example.com', role: 'admin', created_at: new Date().toISOString() },
    { id: 'm-member', tenant_id: 'tenant-123', email: 'member@example.com', role: 'member', created_at: new Date().toISOString() },
  ];

  const createChainableMock = () => {
    let currentFilterEmail: string | null = null;
    let currentFilterTenantId: string | null = null;
    let currentFilterRole: string | null = null;
    let currentFilterId: string | null = null;
    let selectedFields = '';

    const chain = {
      select: (fields: string) => {
        selectedFields = fields;
        return chain;
      },
      delete: () => chain,
      upsert: (payload: { tenant_id: string; email: string; role: string }) => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'm-new', tenant_id: payload.tenant_id, email: payload.email, role: payload.role },
            error: null,
          }),
        }),
      }),
      eq: (col: string, val: string) => {
        if (col === 'email') currentFilterEmail = val;
        if (col === 'tenant_id') currentFilterTenantId = val;
        if (col === 'role') currentFilterRole = val;
        if (col === 'id') currentFilterId = val;
        return chain;
      },
      order: () => {
        const filtered = membersStore.filter((m) => !currentFilterTenantId || m.tenant_id === currentFilterTenantId);
        return Promise.resolve({ data: filtered });
      },
      maybeSingle: () => {
        let match = membersStore.find((m) => {
          if (currentFilterId && m.id !== currentFilterId) return false;
          if (currentFilterEmail && m.email !== currentFilterEmail) return false;
          if (currentFilterTenantId && m.tenant_id !== currentFilterTenantId) return false;
          if (currentFilterRole && m.role !== currentFilterRole) return false;
          return true;
        });

        if (!match && selectedFields === 'role' && currentFilterEmail) {
          match = membersStore.find((m) => m.email === currentFilterEmail);
        }

        if (!match) return Promise.resolve({ data: null });
        if (selectedFields === 'role') return Promise.resolve({ data: { role: match.role } });
        if (selectedFields === 'tenant_id') return Promise.resolve({ data: { tenant_id: match.tenant_id } });
        return Promise.resolve({ data: { ...match } });
      },
    };

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
    if (auth.includes('non_member')) return 'stranger@example.com';
    if (auth.includes('admin')) return 'admin@example.com';
    if (auth.includes('member')) return 'member@example.com';
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

  it('rejects invitation from non-admin/non-owner with 403', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      headers: { Authorization: 'Bearer member_token' },
      body: JSON.stringify({ email: 'newbie@example.com', role: 'member', tenantId: 'tenant-123' }),
    });
    const res = await POSTInvite(req);
    expect(res.status).toBe(403);
  });

  it('rejects member list request from non-member of requested tenant with 403', async () => {
    const req = new Request('http://localhost/api/rag/members?tenantId=tenant-123', {
      headers: { Authorization: 'Bearer non_member_token' },
    });
    const res = await GETMembers(req);
    expect(res.status).toBe(403);
  });

  it('rejects invalid email formats with 400', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      headers: { Authorization: 'Bearer owner_token' },
      body: JSON.stringify({ email: 'invalid-email', role: 'member' }),
    });
    const res = await POSTInvite(req);
    expect(res.status).toBe(400);
  });

  it('successfully records team invitation and attempts Resend email', async () => {
    const req = new Request('http://localhost/api/rag/invite', {
      method: 'POST',
      headers: { Authorization: 'Bearer owner_token' },
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
      headers: { Authorization: 'Bearer owner_token' },
    });
    const res = await GETMembers(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.members)).toBe(true);
  });

  it('removes member access via DELETE /api/rag/members', async () => {
    const req = new Request('http://localhost/api/rag/members', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer owner_token' },
      body: JSON.stringify({ memberId: 'm-member' }),
    });
    const res = await DELETEMembers(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('rejects admin attempting to delete owner with 403', async () => {
    const req = new Request('http://localhost/api/rag/members', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ memberId: 'm-owner' }),
    });
    const res = await DELETEMembers(req);
    expect(res.status).toBe(403);
  });
});
