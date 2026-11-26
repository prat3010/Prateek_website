import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const insertedPayloads: Record<string, unknown>[] = [];
let mockInsertError: { message: string } | null = null;
let mockLeadRow: Record<string, unknown> = {
  id: 'lead-1',
  lead_name: 'Jane Doe',
  company: 'Acme AI',
  email: 'jane@example.com',
  ai_generated_pitch: 'Hello Jane',
};
const updatedPayloads: Record<string, unknown>[] = [];

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => ({
  supabase: {
    from: () => ({
      select: (cols?: string) => {
        if (cols === 'source_url') {
          return Promise.resolve({ data: [], error: null });
        }
        return {
          order: () =>
            Promise.resolve({
              data: [{ id: 'lead-1', lead_name: 'Jane Doe', status: 'pending' }],
              error: null,
            }),
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockLeadRow, error: null }),
          }),
        };
      },
      insert: (payload: Record<string, unknown>) => {
        insertedPayloads.push(payload);
        return {
          select: () => ({
            maybeSingle: () =>
              mockInsertError
                ? Promise.resolve({ data: null, error: mockInsertError })
                : Promise.resolve({ data: { id: 'lead-2', ...payload }, error: null }),
          }),
        };
      },
      update: (payload: Record<string, unknown>) => {
        updatedPayloads.push(payload);
        return {
          eq: () => Promise.resolve({ error: null }),
        };
      },
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
import {
  extractRealEmail,
  extractApplicationUrl,
  isIndiaEligibleRemote,
  scoreCandidateLocally,
} from '@/lib/outreachProspecting';

import { NextRequest } from 'next/server';

describe('Admin Outreach Endpoints Security', () => {
  beforeEach(() => {
    insertedPayloads.length = 0;
    updatedPayloads.length = 0;
    mockInsertError = null;
    mockLeadRow = {
      id: 'lead-1',
      lead_name: 'Jane Doe',
      company: 'Acme AI',
      email: 'jane@example.com',
      ai_generated_pitch: 'Hello Jane',
    };
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

  it('allows verified admin to approve lead with 3-in-1 JSON pitch', async () => {
    const pitchJson = JSON.stringify({
      email: 'Hi Jane, verified systems evidence.',
      linkedin: 'Hi Jane, connecting!',
      cover_letter: 'Dear Jane, cover letter.',
    });
    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ leadId: 'lead-1', action: 'approve', editedPitch: pitchJson }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('approved');
    expect(data.message).toContain('RESEND_API_KEY is not configured');
  });

  it('supports mark_sent action for manually applied leads', async () => {
    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ leadId: 'lead-1', action: 'mark_sent' }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('sent');
    expect(updatedPayloads[0]?.status).toBe('sent');
  });

  it('allows verified admin to dismiss lead with reject action', async () => {
    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ leadId: 'lead-1', action: 'reject' }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('dismissed');
  });

  it('dispatches email from verified domain notifications@prateeq.in when RESEND_API_KEY is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key_123');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ leadId: 'lead-1', action: 'approve', editedPitch: 'Hi Jane' }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Prateek Sharma <notifications@prateeq.in>'),
      })
    );
  });

  it('marks ATS-only lead (no email) as approved without emailing contactEmailTo', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key_123');
    mockLeadRow = {
      id: 'lead-ats',
      lead_name: 'Hiring Team',
      company: 'VectorLabs',
      email: null,
      source_url: 'https://jobs.ashbyhq.com/vectorlabs/123',
      ai_generated_pitch: 'Hi VectorLabs Team',
    };
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const req = new NextRequest('http://localhost/api/outreach/dispatch', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ leadId: 'lead-ats', action: 'approve' }),
    });
    const res = await POSTDispatch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('approved');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(updatedPayloads[0]?.status).toBe('approved');
  });
});

describe('Outreach Prospecting Pipeline (Real Leads & Zero Fakes)', () => {
  beforeEach(() => {
    insertedPayloads.length = 0;
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service_role_key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('never inserts fake David Miller fallback when external sources return no leads', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = new NextRequest('http://localhost/api/outreach/prospect', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
    });
    const res = await POSTProspect(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.leads).toEqual([]);
    expect(insertedPayloads.length).toBe(0);
  });

  it('discovers real high-intent leads from HN & RemoteOK without guessing contact@domain', async () => {
    const mockFetch = vi.fn(async (url: string) => {
      if (url.includes('user/whoishiring.json')) {
        return { ok: true, json: async () => ({ submitted: [9001] }) };
      }
      if (url.includes('item/9001.json')) {
        return {
          ok: true,
          json: async () => ({ title: 'Ask HN: Who is hiring? (November 2026)', kids: [9002] }),
        };
      }
      if (url.includes('item/9002.json')) {
        return {
          ok: true,
          json: async () => ({
            id: 9002,
            text: 'VectorFlow | Forward Deployed AI Engineer | Remote (Worldwide) | $140k - $180k<p>Building pgvector RAG agents with Next.js and FastAPI. Apply: https://jobs.ashbyhq.com/vectorflow/ai-eng or founders@vectorflow.ai',
          }),
        };
      }
      if (url.includes('hn.algolia.com')) {
        return { ok: true, json: async () => ({ hits: [] }) };
      }
      if (url.includes('remoteok.com/api')) {
        return {
          ok: true,
          json: async () => [
            { legal: 'notice' },
            {
              company: 'AgenticStack',
              position: 'Senior Next.js & RAG AI Engineer',
              description: 'Contract/freelance build for multi-tenant pgvector search and FastAPI backend. Worldwide remote.',
              url: 'https://remoteok.com/remote-jobs/12345',
              apply_url: 'https://boards.greenhouse.io/agenticstack/jobs/12345',
              location: 'Worldwide',
              salary_min: 120000,
              salary_max: 160000,
            },
          ],
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = new NextRequest('http://localhost/api/outreach/prospect', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
    });
    const res = await POSTProspect(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(insertedPayloads.length).toBe(2);

    const hnLead = insertedPayloads.find((l) => l.company === 'VectorFlow');
    expect(hnLead).toBeDefined();
    expect(hnLead?.email).toBe('founders@vectorflow.ai');
    expect(hnLead?.source_url).toBe('https://jobs.ashbyhq.com/vectorflow/ai-eng');
    expect(hnLead?.intent_source).toBe('hn_whoishiring');

    const remoteOkLead = insertedPayloads.find((l) => l.company === 'AgenticStack');
    expect(remoteOkLead).toBeDefined();
    expect(remoteOkLead?.email).toBeNull(); // Never guessed contact@agenticstack.com!
    expect(remoteOkLead?.source_url).toBe('https://boards.greenhouse.io/agenticstack/jobs/12345');
    expect(remoteOkLead?.compensation).toBe('$120k - $160k/yr');
  });

  it('extractRealEmail ignores placeholder/platform addresses, reads mailto links, and returns null when absent', () => {
    expect(extractRealEmail('Contact test@example.com or sentry@sentry.io')).toBeNull();
    expect(extractRealEmail('Apply at https://lever.co/acme without email')).toBeNull();
    expect(extractRealEmail('Reach out tocto: hiring@realstartup.io!')).toBe('hiring@realstartup.io');
    expect(extractRealEmail('<a href="mailto:founders@realstartup.io">email us</a>')).toBe('founders@realstartup.io');
  });

  it('extractApplicationUrl extracts full ATS links from href even when HN truncates anchor text', () => {
    expect(extractApplicationUrl('Apply here: https://jobs.lever.co/acme/123.')).toBe(
      'https://jobs.lever.co/acme/123'
    );
    expect(
      extractApplicationUrl(
        '<a href="https://jobs.ashbyhq.com/acme/full-uuid-1234" rel="nofollow">https://jobs.ashbyhq.com/acme/full...</a>'
      )
    ).toBe('https://jobs.ashbyhq.com/acme/full-uuid-1234');
    expect(extractApplicationUrl('No ATS link here')).toBeNull();
  });

  it('returns 500 when Supabase insert fails for all discovered leads instead of claiming 0 matches', async () => {
    mockInsertError = { message: 'violates row-level security policy' };
    const mockFetch = vi.fn(async (url: string) => {
      if (url.includes('remoteok.com/api')) {
        return {
          ok: true,
          json: async () => [
            { legal: 'notice' },
            {
              company: 'AgenticStack',
              position: 'Senior Next.js & RAG AI Engineer',
              description: 'Contract/freelance build for multi-tenant pgvector search and FastAPI backend. Worldwide remote.',
              apply_url: 'https://boards.greenhouse.io/agenticstack/jobs/12345',
              location: 'Worldwide',
            },
          ],
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = new NextRequest('http://localhost/api/outreach/prospect', {
      method: 'POST',
      headers: { Authorization: 'Bearer admin_token' },
    });
    const res = await POSTProspect(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('violates row-level security policy');
  });

  it('isIndiaEligibleRemote enforces geographic exclusions and remote inclusions', () => {
    expect(isIndiaEligibleRemote('Remote (US only) - Next.js engineer')).toBe(false);
    expect(isIndiaEligibleRemote('On-site in NYC')).toBe(false);
    expect(isIndiaEligibleRemote('Remote (Worldwide) - AI Engineer')).toBe(true);
  });

  it('scoreCandidateLocally filters negative tech stacks and rewards AI/Next.js/RAG', () => {
    expect(scoreCandidateLocally('iOS Engineer', 'Swift and SwiftUI mobile app').score).toBe(0);
    const high = scoreCandidateLocally(
      'Forward Deployed AI Engineer',
      'Freelance contract building Next.js, FastAPI, pgvector RAG AI agents. Worldwide remote.'
    );
    expect(high.score).toBeGreaterThanOrEqual(75);
  });
});
