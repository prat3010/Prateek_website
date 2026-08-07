import { describe, it, expect, vi, beforeEach } from 'vitest';

function createResolvableChain(result: unknown) {
  const chain: Record<string, unknown> = {};

  const selectMock = vi.fn().mockReturnValue(chain);
  const upsertMock = vi.fn().mockReturnValue(chain);

  chain.select = selectMock;
  chain.upsert = upsertMock;
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue({
    ...chain,
    then: (resolve: (value: unknown) => void) => resolve(result),
  });
  return chain;
}

const mockChain = createResolvableChain({
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

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return { from: vi.fn(() => mockChain) };
  },
}));

import { GET } from '@/app/api/client/get-scopes/route';
import { POST } from '@/app/api/client/save-scope/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/client/get-scopes', () => {
  it('returns 400 when email query param is missing', async () => {
    const req = new Request('http://localhost/api/client/get-scopes');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing email');
  });

  it('returns client scopes list on success', async () => {
    const req = new Request('http://localhost/api/client/get-scopes?email=client@example.com');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.scopes)).toBe(true);
    expect(json.scopes.length).toBe(1);
    expect(json.scopes[0].scope_code).toBe('SCOPE-10001');
  });
});

describe('POST /api/client/save-scope', () => {
  it('returns 400 when clientEmail or scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'Acme' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('persists scope payload successfully', async () => {
    const req = new Request('http://localhost/api/client/save-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientEmail: 'client@example.com',
        scopeCode: 'SCOPE-10001',
        companyName: 'Acme Test Corp',
        selectedFeatures: ['Authentication'],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
