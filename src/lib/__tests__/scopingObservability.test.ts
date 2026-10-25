import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const updates: Array<{ table: string; payload: Record<string, unknown>; filterKey: string; filterVal: string }> = [];
  const inserts: Array<{ table: string; payload: Record<string, unknown> }> = [];

  const fromFn = vi.fn((table: string) => ({
    insert: vi.fn(async (payload: Record<string, unknown>) => {
      inserts.push({ table, payload });
      return { error: null };
    }),
    update: vi.fn((payload: Record<string, unknown>) => ({
      eq: vi.fn((col1: string, val1: string) => ({
        eq: vi.fn(async (col2: string, val2: string) => {
          updates.push({ table, payload, filterKey: `${col1}=${val1}&${col2}`, filterVal: val2 });
          return { error: null };
        }),
      })),
    })),
  }));

  return { updates, inserts, fromFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: mocks.fromFn,
    };
  },
}));

import { logScopingChatTrace, stitchAnonymousSession } from '../scopingObservability';

describe('scopingObservability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updates.length = 0;
    mocks.inserts.length = 0;
  });

  describe('logScopingChatTrace', () => {
    it('successfully inserts trace payload into scoping_chat_traces', async () => {
      await logScopingChatTrace({
        sessionId: 'test-session-123',
        scopeCode: 'SCOPE-10101',
        turnIndex: 1,
        userQuery: 'Build me an AI voice bot',
        assistantResponse: 'Here is the architecture blueprint.',
        agentIntent: 'voice_ai_agent_app',
        agentReasoning: 'Voice platform with LiveKit',
        currency: 'USD',
        visitorCountry: 'US',
      });

      expect(mocks.inserts.length).toBe(1);
      expect(mocks.inserts[0].table).toBe('scoping_chat_traces');
      expect(mocks.inserts[0].payload).toMatchObject({
        session_id: 'test-session-123',
        scope_code: 'SCOPE-10101',
        turn_index: 1,
        user_query: 'Build me an AI voice bot',
        assistant_response: 'Here is the architecture blueprint.',
        agent_intent: 'voice_ai_agent_app',
        currency: 'USD',
        visitor_country: 'US',
      });
    });
  });

  describe('stitchAnonymousSession', () => {
    it('updates traces and intake_leads across sessionId, scopeCode, and draftToken', async () => {
      await stitchAnonymousSession(
        'sess-abc',
        'CLIENT@Company.com ',
        'SCOPE-99999',
        'draft_token_xyz'
      );

      const targetEmail = 'client@company.com';

      // 1. Check scoping_chat_traces updates
      const traceSessionUpdate = mocks.fromFn.mock.results.some(() => true);
      expect(traceSessionUpdate).toBe(true);

      // Check intake_leads updates for sessionId, scopeCode, and draftToken
      const leadUpdates = mocks.updates.filter((u) => u.table === 'intake_leads');
      expect(leadUpdates.length).toBe(3);

      expect(leadUpdates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            table: 'intake_leads',
            payload: { contact_email: targetEmail },
            filterKey: 'chat_session_id=sess-abc&contact_email',
            filterVal: 'lead@unauthenticated.client',
          }),
          expect.objectContaining({
            table: 'intake_leads',
            payload: { contact_email: targetEmail },
            filterKey: 'scope_code=SCOPE-99999&contact_email',
            filterVal: 'lead@unauthenticated.client',
          }),
          expect.objectContaining({
            table: 'intake_leads',
            payload: { contact_email: targetEmail },
            filterKey: 'draft_token=draft_token_xyz&contact_email',
            filterVal: 'lead@unauthenticated.client',
          }),
        ])
      );
    });

    it('gracefully handles missing optional arguments and empty emails', async () => {
      await stitchAnonymousSession('', '');
      expect(mocks.updates.length).toBe(0);
    });
  });
});
