import { supabase } from '@/data/supabase';

export interface ScopingTraceRecord {
  sessionId: string;
  scopeCode?: string;
  turnIndex?: number;
  userQuery: string;
  assistantResponse: string;
  agentIntent?: string;
  agentReasoning?: string;
  retrievedChunks?: unknown[];
  modelUsed?: string;
  latencyMs?: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
  isFallback?: boolean;
  currency?: 'INR' | 'USD';
  currentEngine?: string;
  selectedFeatures?: string[];
  quoteINR?: number;
  quoteUSD?: number;
  visitorIpHash?: string;
  visitorCountry?: string;
  visitorUserAgent?: string;
  userEmail?: string | null;
}

/**
 * Log a turn-level scoping chat telemetry trace asynchronously into Supabase.
 * Suppresses errors to guarantee zero disruption to the active user streaming response.
 */
export async function logScopingChatTrace(record: ScopingTraceRecord): Promise<void> {
  if (!supabase) return;

  try {
    const payload = {
      session_id: record.sessionId,
      scope_code: record.scopeCode || '',
      turn_index: record.turnIndex || 1,
      user_query: record.userQuery,
      assistant_response: record.assistantResponse,
      agent_intent: record.agentIntent || '',
      agent_reasoning: record.agentReasoning || '',
      retrieved_chunks: Array.isArray(record.retrievedChunks) ? record.retrievedChunks : [],
      model_used: record.modelUsed || 'retriever',
      latency_ms: record.latencyMs || 0,
      tokens_prompt: record.tokensPrompt || 0,
      tokens_completion: record.tokensCompletion || 0,
      is_fallback: Boolean(record.isFallback),
      currency: record.currency || 'INR',
      current_engine: record.currentEngine || '',
      selected_features: Array.isArray(record.selectedFeatures) ? record.selectedFeatures : [],
      quote_inr: Number(record.quoteINR) || 0,
      quote_usd: Number(record.quoteUSD) || 0,
      visitor_ip_hash: record.visitorIpHash || '',
      visitor_country: record.visitorCountry || '',
      visitor_user_agent: record.visitorUserAgent || '',
      user_email: record.userEmail || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('scoping_chat_traces').insert(payload);
    if (error) {
      // Table may not yet be migrated in some environments; log warning without breaking
      console.warn('Scoping trace telemetry insert notice:', error.message);
    }
  } catch (err) {
    console.warn('Unhandled scoping trace telemetry error:', err);
  }
}

/**
 * Stitches an anonymous session to a verified client email upon successful login.
 */
export async function stitchAnonymousSession(
  sessionId: string,
  userEmail: string,
  scopeCode?: string,
  draftToken?: string
): Promise<void> {
  if (!supabase || !userEmail) return;

  try {
    const cleanEmail = userEmail.toLowerCase().trim();

    // 1. Associate all historical scoping traces
    if (sessionId) {
      await supabase
        .from('scoping_chat_traces')
        .update({ user_email: cleanEmail })
        .eq('session_id', sessionId);

      // Associate intake leads draft if recorded by chat_session_id
      await supabase
        .from('intake_leads')
        .update({ contact_email: cleanEmail })
        .eq('chat_session_id', sessionId)
        .eq('contact_email', 'lead@unauthenticated.client');
    }

    if (scopeCode) {
      await supabase
        .from('scoping_chat_traces')
        .update({ user_email: cleanEmail })
        .eq('scope_code', scopeCode);

      // Associate intake leads draft by scope_code
      await supabase
        .from('intake_leads')
        .update({ contact_email: cleanEmail })
        .eq('scope_code', scopeCode)
        .eq('contact_email', 'lead@unauthenticated.client');
    }

    if (draftToken) {
      // Associate intake leads draft by draft_token
      await supabase
        .from('intake_leads')
        .update({ contact_email: cleanEmail })
        .eq('draft_token', draftToken)
        .eq('contact_email', 'lead@unauthenticated.client');
    }
  } catch (err) {
    console.warn('Failed to stitch anonymous session to verified user:', err);
  }
}
