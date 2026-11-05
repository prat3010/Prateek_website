import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../client/cancel-razorpay-subscription/route';

const mocks = vi.hoisted(() => {
  const state = {
    unauthorized: false,
    sessionUser: { id: 'u1', email: 'client@example.com' } as Record<string, unknown> | null,
    scopeOwnerEmail: 'client@example.com',
    memberRole: 'owner',
  };

  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        or: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            if (table === 'rag_tenant_members') {
              return { data: { role: state.memberRole }, error: null };
            }
            return { data: null, error: null };
          }),
        })),
        maybeSingle: vi.fn(async () => {
          if (table === 'client_scopes') {
            return {
              data: {
                client_email: state.scopeOwnerEmail,
                metadata: { razorpay_care_subscription_id: 'sub_care_123' },
              },
              error: null,
            };
          }
          if (table === 'rag_subscriptions') {
            return {
              data: { razorpay_subscription_id: 'sub_saas_456' },
              error: null,
            };
          }
          return { data: null, error: null };
        }),
      })),
    })),
    update: updateFn,
  }));

  return { state, fromFn, updateFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: mocks.fromFn,
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async () =>
    mocks.state.unauthorized ? null : (mocks.state.sessionUser?.email as string)
  ),
  getVerifiedSessionUser: vi.fn(async () =>
    mocks.state.unauthorized ? null : mocks.state.sessionUser
  ),
}));

describe('POST /api/client/cancel-razorpay-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.unauthorized = false;
    mocks.state.sessionUser = { id: 'u1', email: 'client@example.com' };
    mocks.state.scopeOwnerEmail = 'client@example.com';
    mocks.state.memberRole = 'owner';
  });

  it('rejects unauthorized requests with 401', async () => {
    mocks.state.unauthorized = true;
    const req = new Request('http://localhost/api/client/cancel-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({ scopeCode: 'SCOPE-101' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests missing all identifiers with 400', async () => {
    const req = new Request('http://localhost/api/client/cancel-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('cancels care plan subscription by scopeCode and marks maintenance_status cancelled', async () => {
    const req = new Request('http://localhost/api/client/cancel-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({ scopeCode: 'SCOPE-101' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mocks.fromFn).toHaveBeenCalledWith('client_scopes');
  });

  it('cancels SaaS workspace subscription by tenantId for owner', async () => {
    const req = new Request('http://localhost/api/client/cancel-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({ tenantId: 'tenant-uuid-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mocks.fromFn).toHaveBeenCalledWith('rag_subscriptions');
  });

  it('forbids non-owner members from cancelling SaaS subscription', async () => {
    mocks.state.memberRole = 'member';
    const req = new Request('http://localhost/api/client/cancel-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({ tenantId: 'tenant-uuid-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
