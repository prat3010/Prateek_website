import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    invalidToken: false,
    existingScope: true,
    isPaid: true,
  };

  const selectFn = vi.fn();
  const eqFn = vi.fn();
  const orderFn = vi.fn();
  const maybeSingleFn = vi.fn();
  const singleFn = vi.fn();
  const updateFn = vi.fn();
  const insertFn = vi.fn();

  const chain = {
    select: selectFn,
    eq: eqFn,
    order: orderFn,
    maybeSingle: maybeSingleFn,
    single: singleFn,
    update: updateFn,
    insert: insertFn,
  };

  selectFn.mockReturnValue(chain);
  eqFn.mockReturnValue(chain);
  orderFn.mockResolvedValue({
    data: [
      {
        id: 'co-1',
        scope_id: 'scope-101',
        change_order_number: 'CO-SCOPE-10001-01',
        requested_by_email: 'client@example.com',
        added_features: ['Custom AI Chatbot'],
        removed_features: [],
        price_delta_inr: 25000,
        price_delta_usd: 350,
        timeline_impact: '+1 Week',
        status: 'invoiced',
        invoice_id: 'inv-co-1',
        created_at: new Date().toISOString(),
      },
    ],
    error: null,
  });

  maybeSingleFn.mockImplementation(async () => {
    if (!state.existingScope) return { data: null, error: null };
    return {
      data: {
        id: 'scope-101',
        scope_code: 'SCOPE-10001',
        client_email: 'client@example.com',
        company_name: 'Acme Test Labs',
        deposit_paid: state.isPaid,
        total_cost_inr: 100000,
        total_cost_usd: 1500,
        currency: 'INR',
      },
      error: null,
    };
  });

  singleFn.mockResolvedValue({
    data: {
      id: 'co-new',
      change_order_number: 'CO-SCOPE-10001-01',
      price_delta_inr: 25000,
      price_delta_usd: 350,
      status: 'invoiced',
    },
    error: null,
  });

  updateFn.mockReturnValue(chain);
  insertFn.mockReturnValue(chain);

  return { state, selectFn, eqFn, orderFn, maybeSingleFn, singleFn, updateFn, insertFn, chain };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => mocks.chain),
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return null;
    if (mocks.state.invalidToken) return null;
    return 'client@example.com';
  }),
}));

import { GET, POST } from '@/app/api/client/change-orders/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.invalidToken = false;
  mocks.state.existingScope = true;
  mocks.state.isPaid = true;
});

const authorizedHeaders = {
  Authorization: 'Bearer valid-token',
  'Content-Type': 'application/json',
};

describe('GET /api/client/change-orders', () => {
  it('returns 401 without a valid session token', async () => {
    const req = new Request('http://localhost/api/client/change-orders?scopeCode=SCOPE-10001');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/change-orders', {
      headers: authorizedHeaders,
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing scopeCode parameter');
  });

  it('returns change orders for the authorized scope', async () => {
    const req = new Request('http://localhost/api/client/change-orders?scopeCode=SCOPE-10001', {
      headers: authorizedHeaders,
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.changeOrders).toHaveLength(1);
    expect(body.changeOrders[0].change_order_number).toBe('CO-SCOPE-10001-01');
  });
});

describe('POST /api/client/change-orders', () => {
  it('returns 401 without authorization', async () => {
    const req = new Request('http://localhost/api/client/change-orders', {
      method: 'POST',
      body: JSON.stringify({ scopeCode: 'SCOPE-10001' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/change-orders', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({ addedFeatures: ['AI Assistant'] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if scope does not exist or client does not own it', async () => {
    mocks.state.existingScope = false;
    const req = new Request('http://localhost/api/client/change-orders', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({ scopeCode: 'SCOPE-UNKNOWN' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 if scope deposit has not been paid', async () => {
    mocks.state.isPaid = false;
    const req = new Request('http://localhost/api/client/change-orders', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({
        scopeCode: 'SCOPE-10001',
        addedFeatures: ['AI Assistant'],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Deposit has not been paid');
  });

  it('creates change order and generates invoice on valid request', async () => {
    const req = new Request('http://localhost/api/client/change-orders', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({
        scopeCode: 'SCOPE-10001',
        addedFeatures: ['Custom AI Chatbot'],
        removedFeatures: [],
        priceDeltaINR: 25000,
        priceDeltaUSD: 350,
        timelineImpact: '+1 Week',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.changeOrder).toBeDefined();
    expect(body.changeOrder.change_order_number).toBe('CO-SCOPE-10001-01');
  });
});
