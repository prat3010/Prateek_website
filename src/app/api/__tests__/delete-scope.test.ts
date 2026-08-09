import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    invalidToken: false,
    wrongUser: false,
    paidScope: false,
    scopeMissing: false,
  };

  const mockUnpaidScope = {
    scope_code: 'SCOPE-10001',
    client_email: 'client@example.com',
    deposit_paid: false,
  };

  const mockPaidScope = {
    scope_code: 'SCOPE-10002',
    client_email: 'client@example.com',
    deposit_paid: true,
  };

  const selectFn = vi.fn().mockImplementation((scopeCode: string) => {
    if (mocks.state.scopeMissing) return { data: null, error: null };
    if (scopeCode === 'SCOPE-10002' || mocks.state.paidScope) return { data: mockPaidScope, error: null };
    return { data: mockUnpaidScope, error: null };
  });

  return { state, selectFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockImplementation(async () => {
              if (mocks.state.scopeMissing) return { data: null, error: null };
              if (mocks.state.paidScope) {
                return { data: { scope_code: 'SCOPE-10002', client_email: 'client@example.com', deposit_paid: true }, error: null };
              }
              return { data: { scope_code: 'SCOPE-10001', client_email: 'client@example.com', deposit_paid: false }, error: null };
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })),
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return null;
    if (mocks.state.invalidToken) return null;
    if (mocks.state.wrongUser) return 'other@example.com';
    return 'client@example.com';
  }),
}));

import { DELETE as deleteScopeDELETE } from '@/app/api/client/delete-scope/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.invalidToken = false;
  mocks.state.wrongUser = false;
  mocks.state.paidScope = false;
  mocks.state.scopeMissing = false;
});

const authorizedHeaders = { Authorization: 'Bearer valid-token' };

describe('DELETE /api/client/delete-scope', () => {
  it('returns 401 without valid session', async () => {
    const req = new Request('http://localhost/api/client/delete-scope?scopeCode=SCOPE-10001', {
      method: 'DELETE',
    });
    const res = await deleteScopeDELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/delete-scope', {
      method: 'DELETE',
      headers: authorizedHeaders,
    });
    const res = await deleteScopeDELETE(req);
    expect(res.status).toBe(400);
  });

  it('returns 403 when trying to delete scope owned by another user', async () => {
    mocks.state.wrongUser = true;
    const req = new Request('http://localhost/api/client/delete-scope?scopeCode=SCOPE-10001', {
      method: 'DELETE',
      headers: authorizedHeaders,
    });
    const res = await deleteScopeDELETE(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when trying to delete a paid engineering scope', async () => {
    mocks.state.paidScope = true;
    const req = new Request('http://localhost/api/client/delete-scope?scopeCode=SCOPE-10002', {
      method: 'DELETE',
      headers: authorizedHeaders,
    });
    const res = await deleteScopeDELETE(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Paid scopes in active engineering cannot be deleted');
  });

  it('deletes unpaid draft scope successfully', async () => {
    const req = new Request('http://localhost/api/client/delete-scope?scopeCode=SCOPE-10001', {
      method: 'DELETE',
      headers: authorizedHeaders,
    });
    const res = await deleteScopeDELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
