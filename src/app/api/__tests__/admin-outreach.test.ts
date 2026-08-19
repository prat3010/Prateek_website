import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [{ id: 'lead-1', lead_name: 'Jane Doe', status: 'pending' }], error: null }),
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'lead-1', lead_name: 'Jane Doe', email: 'jane@example.com', ai_generated_pitch: 'Hello Jane' }, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: 'lead-2', lead_name: 'New Lead' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const auth = req.headers.get('Authorization');
    if (!auth) return null;
    if (auth.includes('admin')) return '3010prateeksharma@gmail.com';
    return 'user@example.com';
  }),
}));

import { GET as GETLeads } from '@/app/api/outreach/get-leads/route';
import { POST as POSTProspect } from '@/app/api/outreach/prospect/route';
import { POST as POSTDispatch } from '@/app/api/outreach/dispatch/route';

import { NextRequest } from 'next/server';

describe('Admin Outreach Endpoints Security', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
  });

  it('rejects anonymous callers with 401 on GET /api/outreach/get-leads', async () => {
    const req = new Request('http://localhost/api/outreach/get-leads');
    const res = await GETLeads(req);
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users with 403 on GET /api/outreach/get-leads', async () => {
    const req = new Request('http://localhost/api/outreach/get-leads', {
      headers: { Authorization: 'Bearer user_token' },
    });
    const res = await GETLeads(req);
    expect(res.status).toBe(403);
  });

  it('allows verified admin to fetch leads on GET /api/outreach/get-leads', async () => {
    const req = new Request('http://localhost/api/outreach/get-leads', {
      headers: { Authorization: 'Bearer admin_token' },
    });
    const res = await GETLeads(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.leads)).toBe(true);
  });

  it('rejects non-admin callers on POST /api/outreach/prospect with 403', async () => {
    const req = new NextRequest('http://localhost/api/outreach/prospect', {
      method: 'POST',
      headers: { Authorization: 'Bearer user_token' },
    });
    const res = await POSTProspect(req);
    expect(res.status).toBe(403);
  });

  it('rejects non-admin callers on POST /api/outreach/dispatch with 403', async () => {
    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer user_token' },
      body: JSON.stringify({ leadId: 'lead-1', action: 'approve' }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(403);
  });
});