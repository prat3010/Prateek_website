import { supabase } from '@/data/supabase';
import { sendHotLeadAlertNotification } from '@/lib/emailNotification';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';

// In-memory deduplication set to prevent duplicate hot-lead alerts for the same session
const alertedHotLeadSessions = new Set<string>();

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

    // Evaluate qualification for immediate real-time Hot-Lead executive alert
    const quoteUSD = Number(record.quoteUSD) || 0;
    const quoteINR = Number(record.quoteINR) || 0;
    const turnIndex = record.turnIndex || 1;
    const isEscrow =
      record.modelUsed === 'escrow-escalation-router' ||
      record.agentIntent === 'escrow_escalation';
    const isHighValue = quoteUSD >= 2500 || quoteINR >= 200000;
    const isEngagedLead = turnIndex >= 3 && quoteUSD >= 1500;

    if (
      (isHighValue || isEscrow || isEngagedLead) &&
      record.sessionId &&
      !alertedHotLeadSessions.has(record.sessionId)
    ) {
      alertedHotLeadSessions.add(record.sessionId);
      if (alertedHotLeadSessions.size > 2000) {
        const firstKey = alertedHotLeadSessions.values().next().value;
        if (firstKey) alertedHotLeadSessions.delete(firstKey);
      }

      const featureCatalog = (questionnaireDefaults.features || []) as Array<{ id: string; label: string }>;
      const featureLabels = (record.selectedFeatures || []).map((id) => {
        const match = featureCatalog.find((f) => f.id === id);
        return match ? match.label : id;
      });

      sendHotLeadAlertNotification({
        sessionId: record.sessionId,
        scopeCode: record.scopeCode,
        userQuery: record.userQuery,
        totalINR: quoteINR,
        totalUSD: quoteUSD,
        engine: record.currentEngine || 'saas',
        featureCount: record.selectedFeatures?.length || 0,
        featureLabels,
        turnIndex,
        visitorCountry: record.visitorCountry,
        userEmail: record.userEmail,
        isEscrow,
        reasoning: record.agentReasoning,
      }).catch((err) => console.warn('Hot lead alert dispatch notice:', err));
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
