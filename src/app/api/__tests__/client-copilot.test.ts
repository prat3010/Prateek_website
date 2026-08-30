import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../client/copilot/route';

const mocks = vi.hoisted(() => {
  const state = {
    scopes: [] as Record<string, unknown>[],
    changeOrders: [] as Record<string, unknown>[],
    unauthorized: false,
  };

  const fromFn = vi.fn();
  const selectFn = vi.fn();
  const eqFn = vi.fn();
  const orderFn = vi.fn();

  const chain = {
    select: selectFn,
    eq: eqFn,
    order: orderFn,
  };

  selectFn.mockReturnValue(chain);
  eqFn.mockImplementation((column: string, _value: string) => {
    if (column === 'client_email') {
      return Promise.resolve({ data: state.scopes, error: null });
    }
    if (column === 'scope_code') {
      return {
        order: vi.fn().mockResolvedValue({ data: state.changeOrders, error: null }),
      };
    }
    return chain;
  });

  return { state, fromFn, selectFn, eqFn, orderFn, chain };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn((table: string) => {
        if (table === 'scope_change_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mocks.state.changeOrders, error: null }),
              }),
            }),
          };
        }
        return mocks.chain;
      }),
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async () => (mocks.state.unauthorized ? null : 'client@example.com')),
  getVerifiedSessionUser: vi.fn(async () => (mocks.state.unauthorized ? null : { id: 'usr-123', email: 'client@example.com' })),
}));

describe('POST /api/client/copilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.unauthorized = false;
    mocks.state.changeOrders = [];
    mocks.state.scopes = [
      {
        id: 'scope-101',
        scope_code: 'SCOPE-8899',
        company_name: 'Apex Innovations',
        client_email: 'client@example.com',
        base_engine: 'SaaS AI Platform Engine',
        features: ['OAuth Authentication & RBAC', 'pgvector Semantic Search', 'Razorpay Subscriptions'],
        timeline: '3-4 Weeks',
        maintenance_plan: 'Managed 99.9% Uptime Retainer',
        brand_asset: 'Complete Design Kit',
        business_kpi: 'Sub-500ms AI search across 10k enterprise documents',
        delivery_stage: 'engineering',
        deposit_paid: true,
        sow_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        total_cost_inr: 450000,
        total_cost_usd: 5400,
        currency: 'INR',
        payment_structure: '50/50 Deposit & Completion',
      },
    ];
  });

  it('rejects unauthorized requests without session token', async () => {
    mocks.state.unauthorized = true;
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'What features are in my scope?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Unauthorized');
  });

  it('rejects empty query parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Query parameter is required');
  });

  it('handles client with no scopes gracefully', async () => {
    mocks.state.scopes = [];
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'Show me my deliverables' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('do not have an active project scope');
    expect(json.citations).toEqual([]);
  });

  it('answers feature and deliverables queries with grounding and citations', async () => {
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'What modules and features are included?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('SaaS AI Platform Engine');
    expect(json.answer).toContain('OAuth Authentication & RBAC');
    expect(json.scope_code).toBe('SCOPE-8899');
    expect(json.citations.length).toBeGreaterThan(0);
    expect(json.citations.some((c: { type: string }) => c.type === 'sow')).toBe(true);
  });

  it('answers financial and pricing queries with currency and payment breakdown', async () => {
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'What is the total cost and payment terms?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('₹4,50,000');
    expect(json.answer).toContain('50/50 Deposit & Completion');
  });

  it('answers milestone and schedule queries with current delivery stage', async () => {
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'What is the current delivery milestone status?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('Phase 2: Core Engineering');
    expect(json.answer).toContain('3-4 Weeks');
    expect(json.delivery_stage).toBe('engineering');
  });

  it('answers SLA and warranty queries with maintenance plan', async () => {
    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'What warranty and maintenance SLA is included?' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('Managed 99.9% Uptime Retainer');
  });

  it('includes Phase 2 Change Orders when present in context', async () => {
    mocks.state.changeOrders = [
      {
        id: 'co-1',
        change_order_number: 'CO-SCOPE-8899-01',
        scope_code: 'SCOPE-8899',
        added_features: ['Multi-Language Localization', 'Custom PDF Export'],
        delta_inr: 75000,
        delta_usd: 900,
        status: 'approved',
      },
    ];

    const req = new NextRequest('http://localhost:3000/api/client/copilot', {
      method: 'POST',
      body: JSON.stringify({ query: 'List all features including change orders' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toContain('CO-SCOPE-8899-01');
    expect(json.answer).toContain('Multi-Language Localization');
    expect(json.citations.some((c: { type: string }) => c.type === 'change_order')).toBe(true);
  });
});
