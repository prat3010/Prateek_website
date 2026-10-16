import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    unauthorized: false,
    sessionEmail: 'prateeqsharma@gmail.com',
    tenants: [] as Array<Record<string, unknown>>,
    subscriptions: [] as Array<Record<string, unknown>>,
    members: [] as Array<Record<string, unknown>>,
    clients: [] as Array<Record<string, unknown>>,
  };

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      order: vi.fn(async () => {
        if (table === 'rag_tenants') return { data: state.tenants, error: null };
        return { data: [], error: null };
      }),
      then: (resolve: (val: unknown) => void) => {
        if (table === 'rag_subscriptions') return resolve({ data: state.subscriptions, error: null });
        if (table === 'rag_tenant_members') return resolve({ data: state.members, error: null });
        if (table === 'clients') return resolve({ data: state.clients, error: null });
        return resolve({ data: [], error: null });
      },
    })),
  }));

  return { state, fromFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: mocks.fromFn,
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async () => {
    if (mocks.state.unauthorized) return null;
    return mocks.state.sessionEmail;
  }),
}));

import { GET } from '@/app/api/rag/admin-subscribers/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.unauthorized = false;
  mocks.state.sessionEmail = 'prateeqsharma@gmail.com';
  mocks.state.tenants = [
    {
      id: 'tenant-row-1',
      tenant_id: 'tn-uuid-001',
      name: 'Acme Corp Workspace',
      plan_tier: 'pro',
      is_active: true,
      api_key: 'ret_live_test_key_123',
      created_at: new Date().toISOString(),
    },
  ];
  mocks.state.subscriptions = [
    {
      tenant_id: 'tn-uuid-001',
      plan_tier: 'pro',
      is_active: true,
      razorpay_subscription_id: 'sub_test_123',
      monthly_token_limit: 1500000,
      tokens_used_this_month: 25000,
    },
  ];
  mocks.state.members = [
    {
      tenant_id: 'tn-uuid-001',
      email: 'founder@acme.com',
      role: 'owner',
    },
  ];
  mocks.state.clients = [
    {
      id: 'client-1',
      email: 'founder@acme.com',
      name: 'Acme Founder',
    },
  ];
});

describe('GET /api/rag/admin-subscribers', () => {
  it('returns 401 without valid session', async () => {
    mocks.state.unauthorized = true;
    const req = new Request('http://localhost/api/rag/admin-subscribers');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    mocks.state.sessionEmail = 'random_visitor@gmail.com';
    const req = new Request('http://localhost/api/rag/admin-subscribers');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns enriched subscribers list for verified admin', async () => {
    const req = new Request('http://localhost/api/rag/admin-subscribers');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.subscribers).toHaveLength(1);
    const sub = json.subscribers[0];
    expect(sub.tenantId).toBe('tn-uuid-001');
    expect(sub.workspaceName).toBe('Acme Corp Workspace');
    expect(sub.ownerEmail).toBe('founder@acme.com');
    expect(sub.planTier).toBe('pro');
    expect(sub.isPaidSubscription).toBe(true);
    expect(sub.monthlyTokenLimit).toBe(1500000);
    expect(sub.hasApiKey).toBe(true);
  });
});
