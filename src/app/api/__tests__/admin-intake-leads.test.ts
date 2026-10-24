import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    unauthorized: false,
    sessionEmail: 'prateeqsharma@gmail.com',
    leads: [] as Array<Record<string, unknown>>,
    queryError: null as { message: string } | null,
  };

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      order: vi.fn(async () => {
        if (table === 'intake_leads') {
          if (state.queryError) {
            return { data: null, error: state.queryError };
          }
          return { data: state.leads, error: null };
        }
        return { data: [], error: null };
      }),
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

import { GET } from '@/app/api/admin/intake-leads/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.unauthorized = false;
  mocks.state.sessionEmail = 'prateeqsharma@gmail.com';
  mocks.state.queryError = null;
  mocks.state.leads = [
    {
      id: 'lead-1',
      scope_code: 'SCOPE-12345',
      company_name: 'Acme AI',
      contact_email: 'founder@acme.ai',
      base_engine_id: 'saas',
      base_engine_title: 'Full-Stack SaaS Engine',
      total_cost_inr: 375000,
      total_cost_usd: 5050,
      selected_features: ['auth', 'ai_rag'],
      timeline: '4–6 weeks',
      status: 'new',
      chat_session_id: 'sess-abc-123',
      chat_transcript: [
        { role: 'user', content: 'Need SaaS with RAG' },
        { role: 'assistant', content: 'Here is the blueprint' },
      ],
      created_at: '2026-10-24T12:00:00.000Z',
    },
  ];
});

describe('GET /api/admin/intake-leads', () => {
  it('returns 401 when caller is unauthenticated', async () => {
    mocks.state.unauthorized = true;
    const req = new Request('http://localhost/api/admin/intake-leads');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('returns 403 when caller is not an admin', async () => {
    mocks.state.sessionEmail = 'random_visitor@external.org';
    const req = new Request('http://localhost/api/admin/intake-leads');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
  });

  it('returns 200 with lead records when caller is authorized admin', async () => {
    const req = new Request('http://localhost/api/admin/intake-leads');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.leads).toHaveLength(1);
    expect(json.leads[0].company_name).toBe('Acme AI');
    expect(json.leads[0].chat_session_id).toBe('sess-abc-123');
    expect(json.leads[0].chat_transcript).toHaveLength(2);
  });

  it('returns 500 when database query encounters an error', async () => {
    mocks.state.queryError = { message: 'Database connection failed' };
    const req = new Request('http://localhost/api/admin/intake-leads');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Database connection failed');
  });
});
