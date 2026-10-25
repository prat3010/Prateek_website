import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ leads: [] });
    }

    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    if (!isAdminEmail(callerEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const tracesOrder = supabase.from('scoping_chat_traces').select('*').order('created_at', { ascending: false });
    const tracesPromise =
      tracesOrder && typeof (tracesOrder as unknown as { limit?: unknown }).limit === 'function'
        ? (tracesOrder as unknown as { limit: (n: number) => Promise<{ data: unknown[] | null; error: unknown }> }).limit(200)
        : tracesOrder;

    const [leadsRes, tracesRes] = await Promise.all([
      supabase.from('intake_leads').select('*').order('created_at', { ascending: false }),
      tracesPromise,
    ]);

    if (leadsRes.error) {
      console.warn('Admin fetch intake_leads error:', leadsRes.error);
      return NextResponse.json({ error: leadsRes.error.message }, { status: 500 });
    }

    const rawLeads = leadsRes.data || [];
    const rawTraces = tracesRes.data || [];

    // Map traces to lead records by scope_code or session_id
    const enrichedLeads = rawLeads.map((lead) => {
      const matchingTraces = rawTraces.filter(
        (t) =>
          (lead.scope_code && t.scope_code === lead.scope_code) ||
          (lead.chat_session_id && t.session_id === lead.chat_session_id)
      );

      const latestTrace = matchingTraces[0];
      return {
        ...lead,
        visitor_country: latestTrace?.visitor_country || lead.visitor_country || 'Unknown',
        model_used: latestTrace?.model_used || 'retriever-vps',
        latency_ms: latestTrace?.latency_ms || 0,
        agent_intent: latestTrace?.agent_intent || '',
        agent_reasoning: latestTrace?.agent_reasoning || '',
        turn_count: matchingTraces.length || (Array.isArray(lead.chat_transcript) ? Math.ceil(lead.chat_transcript.length / 2) : 0),
      };
    });

    return NextResponse.json({
      leads: enrichedLeads,
      traces: rawTraces,
    });
  } catch (err) {
    console.error('Unhandled admin intake leads error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
