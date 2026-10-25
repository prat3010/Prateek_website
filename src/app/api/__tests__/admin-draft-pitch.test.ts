import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const state = {
    unauthorized: false,
    sessionEmail: 'prateeqsharma@gmail.com',
    lead: null as Record<string, unknown> | null,
    updateCalled: false,
    updatedStatus: '',
  };

  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => {
          if (table === 'intake_leads') {
            return { data: state.lead, error: null };
          }
          return { data: null, error: null };
        }),
      })),
    })),
    update: vi.fn((updates: Record<string, unknown>) => ({
      eq: vi.fn(async () => {
        state.updateCalled = true;
        state.updatedStatus = String(updates.status || '');
        return { data: null, error: null };
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

import { POST } from '../admin/draft-pitch/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.unauthorized = false;
  mocks.state.sessionEmail = 'prateeqsharma@gmail.com';
  mocks.state.updateCalled = false;
  mocks.state.updatedStatus = '';
  mocks.state.lead = {
    id: 'lead-test-123',
    scope_code: 'SCOPE-77889',
    company_name: 'Nexus Robotics',
    contact_email: 'founder@nexusrobotics.ai',
    base_engine_id: 'saas',
    base_engine_title: 'Full-Stack SaaS Engine',
    selected_features: ['auth', 'ai_agents', 'admin'],
    total_cost_inr: 450000,
    total_cost_usd: 5400,
    timeline: '4–5 Weeks',
    status: 'new',
    chat_session_id: 'sess-test-999',
    chat_transcript: [
      { role: 'user', content: 'We need autonomous agents for factory floor monitoring.' },
      { role: 'assistant', content: 'Here is your recommended architecture.' },
    ],
  };
});

describe('POST /api/admin/draft-pitch', () => {
  it('returns 401 when unauthenticated', async () => {
    mocks.state.unauthorized = true;
    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({ leadId: 'lead-test-123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('returns 403 when user is not an admin', async () => {
    mocks.state.sessionEmail = 'external_user@test.com';
    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({ leadId: 'lead-test-123' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
  });

  it('returns 400 when missing leadId and scopeCode', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing leadid or scopecode/i);
  });

  it('returns 404 when lead is not found in database', async () => {
    mocks.state.lead = null;
    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({ leadId: 'non-existent-lead' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/lead not found/i);
  });

  it('returns 200 with proposal draft when drafting for a valid lead', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({ leadId: 'lead-test-123', action: 'draft' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.draft).toBeDefined();
    expect(json.draft.subject).toContain('Nexus Robotics');
    expect(json.draft.emailBody).toContain('Prateek Sharma');
    expect(json.draft.emailBody).toContain('Phase 1');
    expect(json.draft.keyPainPoints.length).toBeGreaterThan(0);
  });

  it('dispatches email via Resend and updates lead status to contacted when action=send', async () => {
    const originalFetch = global.fetch;
    process.env.RESEND_API_KEY = 're_test_mock_key';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email-id-mock-123' }),
    });

    try {
      const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
        method: 'POST',
        body: JSON.stringify({
          leadId: 'lead-test-123',
          action: 'send',
          subject: 'Custom Subject for Nexus Robotics',
          emailBody: 'Hello Nexus Robotics team, here is your proposal.',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mocks.state.updateCalled).toBe(true);
      expect(mocks.state.updatedStatus).toBe('contacted');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('founder@nexusrobotics.ai'),
        })
      );
    } finally {
      global.fetch = originalFetch;
      delete process.env.RESEND_API_KEY;
    }
  });

  it('returns 400 when attempting to send proposal to an unauthenticated placeholder email', async () => {
    process.env.RESEND_API_KEY = 're_test_mock_key';
    mocks.state.lead = {
      ...mocks.state.lead,
      contact_email: 'lead@unauthenticated.client',
    };

    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({
        leadId: 'lead-test-123',
        action: 'send',
        subject: 'Custom Subject',
        emailBody: 'Hello world',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/unauthenticated placeholder email/i);
    delete process.env.RESEND_API_KEY;
  });

  it('returns 400 when attempting to send proposal to a lead with empty or invalid email', async () => {
    process.env.RESEND_API_KEY = 're_test_mock_key';
    mocks.state.lead = {
      ...mocks.state.lead,
      contact_email: '',
    };

    const req = new NextRequest('http://localhost:3000/api/admin/draft-pitch', {
      method: 'POST',
      body: JSON.stringify({
        leadId: 'lead-test-123',
        action: 'send',
        subject: 'Custom Subject',
        emailBody: 'Hello world',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid or missing contact email/i);
    delete process.env.RESEND_API_KEY;
  });
});
