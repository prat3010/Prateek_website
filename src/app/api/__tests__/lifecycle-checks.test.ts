import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../cron/lifecycle-checks/route';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    tenants: [] as Array<Record<string, unknown>>,
    subs: [] as Array<Record<string, unknown>>,
    invoices: [] as Array<Record<string, unknown>>,
  };

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(async () => {
        if (table === 'rag_tenants') return { data: state.tenants, error: null };
        return { data: [], error: null };
      }),
      in: vi.fn(async () => {
        if (table === 'invoices') return { data: state.invoices, error: null };
        return { data: [], error: null };
      }),
      then: (resolve: (val: unknown) => void) => {
        if (table === 'rag_subscriptions') return resolve({ data: state.subs, error: null });
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

describe('GET /api/cron/lifecycle-checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test_cron_secret');
    mocks.state.tenants = [];
    mocks.state.subs = [];
    mocks.state.invoices = [];
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('http://localhost/api/cron/lifecycle-checks');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('authenticates with Bearer token and returns summary', async () => {
    const req = new NextRequest('http://localhost/api/cron/lifecycle-checks', {
      headers: { Authorization: 'Bearer test_cron_secret' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toBeDefined();
  });

  it('identifies expiring trials and overdue invoices', async () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    mocks.state.tenants = [
      { tenant_id: 't1', name: 'Expiring Trial Workspace', plan_tier: 'starter', is_active: true, created_at: sixDaysAgo },
    ];
    mocks.state.invoices = [
      { id: 'inv1', invoice_number: 'INV-101', amount: 15000, currency: 'INR', payment_status: 'issued', created_at: tenDaysAgo },
    ];

    const req = new NextRequest('http://localhost/api/cron/lifecycle-checks', {
      headers: { Authorization: 'Bearer test_cron_secret' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.expiringTrialsCount).toBe(1);
    expect(body.summary.overdueInvoicesCount).toBe(1);
  });
});
