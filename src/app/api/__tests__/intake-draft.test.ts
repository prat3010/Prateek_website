import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const insertFn = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'lead-uuid-123', draft_token: 'draft_SCOPE-123_1000' },
        error: null,
      }),
    }),
  });

  const selectGteFn = vi.fn().mockResolvedValue({
    count: 0,
    data: [],
    error: null,
  });

  const selectEqFn = vi.fn().mockReturnValue({
    gte: selectGteFn,
  });

  const selectFn = vi.fn().mockReturnValue({
    eq: selectEqFn,
  });

  return { insertFn, selectFn, selectEqFn, selectGteFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => ({
        insert: mocks.insertFn,
        select: mocks.selectFn,
      })),
    };
  },
}));

import { POST } from '@/app/api/client/intake-draft/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/client/intake-draft', () => {
  it('returns 400 when lead payload lacks companyName and contactEmail', async () => {
    const req = new Request('http://localhost/api/client/intake-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseEngineTitle: 'Full-Stack Web Engine' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('persists draft intake lead into intake_leads table and sets prateeq_draft_token cookie', async () => {
    const payload = {
      companyName: 'Acme Test Corp',
      contactEmail: 'lead@acmetest.corp',
      contactPhone: '+919999999999',
      baseEngineTitle: 'Multi-Page Web App Engine',
      selectedFeatures: ['Authentication', 'Payments'],
      brandAssetOption: 'Complete Brand Kit',
      maintenancePlan: 'Standard SLA',
      totalCostINR: 250000,
      totalCostUSD: 3000,
    };

    const req = new Request('http://localhost/api/client/intake-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mocks.insertFn).toHaveBeenCalled();
    const inserted = mocks.insertFn.mock.calls[0][0];
    expect(inserted.company_name).toBe('Acme Test Corp');
    expect(inserted.contact_email).toBe('lead@acmetest.corp');
    expect(inserted.status).toBe('new');

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('prateeq_draft_token=');
  });

  it('returns 429 when rate limit of 5 drafts per hour is exceeded', async () => {
    mocks.selectGteFn.mockResolvedValueOnce({
      count: 5,
      data: [],
      error: null,
    });

    const payload = {
      companyName: 'Acme Test Corp',
      contactEmail: 'lead@acmetest.corp',
    };

    const req = new Request('http://localhost/api/client/intake-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('Too many draft submissions. Please try again later.');
    expect(mocks.insertFn).not.toHaveBeenCalled();
  });
});
