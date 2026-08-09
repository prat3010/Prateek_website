import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    existingOrder: false,
    invalidToken: false,
  };

  const selectFn = vi.fn();
  const eqFn = vi.fn();
  const orderFn = vi.fn();
  const maybeSingleFn = vi.fn();
  const updateFn = vi.fn();
  const insertFn = vi.fn();

  const chain = {
    select: selectFn,
    eq: eqFn,
    order: orderFn,
    maybeSingle: maybeSingleFn,
    update: updateFn,
    insert: insertFn,
  };

  selectFn.mockReturnValue(chain);
  eqFn.mockReturnValue(chain);
  orderFn.mockResolvedValue({
    data: [
      {
        id: 'scope-1',
        scope_code: 'SCOPE-10001',
        company_name: 'Acme Test Corp',
        client_email: 'client@example.com',
        base_engine: 'Full-Stack Web Engine',
        features: ['Authentication & RBAC', 'Dark Mode'],
        delivery_stage: 'engineering',
        deposit_paid: true,
      },
    ],
    error: null,
  });
  maybeSingleFn.mockImplementation(async () =>
    state.existingOrder
      ? { data: { id: 'client-1', scope_code: 'SCOPE-10001' }, error: null }
      : { data: null, error: null }
  );
  updateFn.mockReturnValue(chain);
  insertFn.mockReturnValue(chain);

  return { state, selectFn, eqFn, orderFn, maybeSingleFn, updateFn, insertFn, chain };
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

import { GET } from '@/app/api/client/get-scopes/route';
import { POST } from '@/app/api/client/save-scope/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.existingOrder = false;
  mocks.state.invalidToken = false;
});

const authorizedHeaders = { Authorization: 'Bearer valid-token' };

describe('GET /api/client/get-scopes', () => {
  it('returns 401 without a valid session token', async () => {
    const req = new Request('http://localhost/api/client/get-scopes');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the session token is invalid or expired', async () => {
    mocks.state.invalidToken = true;
    const req = new Request('http://localhost/api/client/get-scopes', {
      headers: authorizedHeaders,
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns scopes for the verified session email only', async () => {
    const req = new Request('http://localhost/api/client/get-scopes', {
      headers: authorizedHeaders,
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.scopes).toHaveLength(1);
    expect(json.scopes[0].scope_code).toBe('SCOPE-10001');
    expect(mocks.eqFn).toHaveBeenCalledWith('client_email', 'client@example.com');
  });
});

describe('POST /api/client/save-scope', () => {
  const baseBody = {
    scopeCode: 'SCOPE-10001',
    companyName: 'Acme Test Corp',
    selectedFeatures: ['Authentication'],
  };

  it('returns 401 without a valid session token', async () => {
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizedHeaders },
      body: JSON.stringify({ companyName: 'Acme' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('inserts a new order with the verified email and draft defaults', async () => {
    mocks.state.existingOrder = false;
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizedHeaders },
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mocks.insertFn).toHaveBeenCalled();
    const insertedCalls = mocks.insertFn.mock.calls;
    const scopeInsert = insertedCalls.find((call) => call[0]?.scope_code === 'SCOPE-10001')?.[0];
    expect(scopeInsert).toBeDefined();
    expect(scopeInsert.client_email).toBe('client@example.com');
    expect(scopeInsert.company_name).toBe('Acme Test Corp');
    expect(scopeInsert.status).toBe('Draft Proposal');
    expect(scopeInsert.deposit_paid).toBe(false);
  });

  it('updates an existing order without touching server-managed fields', async () => {
    mocks.state.existingOrder = true;
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizedHeaders },
      body: JSON.stringify(baseBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mocks.updateFn).toHaveBeenCalled();
    const updateCalls = mocks.updateFn.mock.calls;
    const scopeUpdate = updateCalls.find((call) => call[0]?.company_name === 'Acme Test Corp')?.[0];
    expect(scopeUpdate).toBeDefined();
    expect(scopeUpdate).not.toHaveProperty('status');
    expect(scopeUpdate).not.toHaveProperty('deposit_paid');
    expect(scopeUpdate).not.toHaveProperty('delivery_stage');
  });
});