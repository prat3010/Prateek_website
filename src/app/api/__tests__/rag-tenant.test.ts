import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    unauthorized: false,
    existingMember: null as { tenant_id: string; role: string; email: string } | null,
    existingTenant: null as { tenant_id: string; name: string; plan_tier: string; is_active: boolean; created_at: string } | null,
    existingSub: null as { tenant_id: string; plan_tier: string; is_active: boolean } | null,
  };

  const makeSelectQuery = (table: string) => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(async () => {
        if (table === 'rag_tenant_members') return { data: state.existingMember, error: null };
        if (table === 'rag_tenants') return { data: state.existingTenant, error: null };
        if (table === 'rag_subscriptions') return { data: state.existingSub, error: null };
        return { data: null, error: null };
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    return query;
  };

  const insertFn = vi.fn().mockImplementation((payload) => {
    const query = {
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { ...payload, tenant_id: payload.tenant_id || 'new-tn-1' }, error: null }),
      }),
    };
    return query;
  });

  const upsertFn = vi.fn().mockResolvedValue({ data: null, error: null });

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => makeSelectQuery(table)),
    insert: insertFn,
    upsert: upsertFn,
  }));

  return { state, fromFn, insertFn, upsertFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: mocks.fromFn,
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionUser: vi.fn(async () => {
    if (mocks.state.unauthorized) return null;
    return { id: 'user-uuid-1', email: 'testuser@example.com' };
  }),
}));

import { GET } from '@/app/api/rag/tenant/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.unauthorized = false;
  mocks.state.existingMember = null;
  mocks.state.existingTenant = null;
  mocks.state.existingSub = null;
});

describe('GET /api/rag/tenant', () => {
  it('returns 401 without valid session', async () => {
    mocks.state.unauthorized = true;
    const req = new Request('http://localhost/api/rag/tenant');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns existing tenant with dynamic plan tier and trial days', async () => {
    mocks.state.existingMember = {
      tenant_id: 'tn-existing-123',
      role: 'owner',
      email: 'testuser@example.com',
    };
    mocks.state.existingTenant = {
      tenant_id: 'tn-existing-123',
      name: 'Test Corp Workspace',
      plan_tier: 'pro',
      is_active: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mocks.state.existingSub = {
      tenant_id: 'tn-existing-123',
      plan_tier: 'pro',
      is_active: true,
    };

    const req = new Request('http://localhost/api/rag/tenant');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.tenantId).toBe('tn-existing-123');
    expect(json.planTier).toBe('pro');
    expect(json.role).toBe('owner');
    expect(json.isActive).toBe(true);
  });

  it('bootstraps new tenant for first-time authenticated user', async () => {
    const req = new Request('http://localhost/api/rag/tenant');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.tenantId).toBeDefined();
    expect(json.planTier).toBe('starter');
    expect(json.trialDaysRemaining).toBe(7);
    expect(json.email).toBe('testuser@example.com');
  });
});
