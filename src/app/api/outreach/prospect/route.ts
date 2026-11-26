import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';
import outreachDefaults from '@/data/outreach_defaults.json';
import {
  fetchHnWhosHiring,
  fetchHnFreelance,
  fetchRemoteOk,
  type RawLeadCandidate,
} from '@/lib/outreachProspecting';

export const maxDuration = 60;

const MODEL_NAME = outreachDefaults.activeModel || 'gemini-2.5-flash';

interface LeadEvaluation {
  is_valid_lead: boolean;
  quality_score: number;
  source_type: string;
  reason: string;
}

async function queryRetrieverForProof(queryText: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in';
  const tenantId = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';
  const apiKey = process.env.RETRIEVER_PORTFOLIO_API_KEY || '';

  if (!apiKey || !tenantId) return '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/tenants/${tenantId}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Tenant-ID': tenantId,
        'X-User-ID': '00000000-0000-0000-0000-000000000001',
      },
      body: JSON.stringify({
        query: queryText.slice(0, 250),
        limit: 2,
        top_k: 2,
        reranker_engine: 'none',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return '';

    const data = await res.json();
    const results = (data.results || []) as Array<{ content?: string; metadata?: { filename?: string } }>;
    if (!results.length) return '';

    const chunks = results
      .filter((r) => r.content)
      .slice(0, 2)
      .map(
        (r, i) =>
          `[Verified Production Proof ${i + 1} from ${r.metadata?.filename || 'System Architecture'}]:\n${(r.content || '').slice(0, 300).replace(/\n/g, ' ')}`
      );

    return chunks.length ? `\n\n### VERIFIED PRODUCTION EVIDENCE FROM PRATEEK'S RETRIEVER PLATFORM:\n${chunks.join('\n\n')}` : '';
  } catch {
    return '';
  }
}

async function callGeminiWithFallback(prompt: string): Promise<string | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiApiKey) return null;
  const models = [MODEL_NAME, 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const uniqueModels = Array.from(new Set(models));

  for (const model of uniqueModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') return text.trim();
    } catch {
      // Failover to next model
    }
  }
  return null;
}

async function evaluateLeadWithGemini(candidate: RawLeadCandidate): Promise<LeadEvaluation> {
  const localThreshold = Math.min(outreachDefaults.minQualityScore || 75, 55);
  const localFallback: LeadEvaluation = {
    is_valid_lead: candidate.local_score >= localThreshold,
    quality_score: candidate.local_score,
    source_type: candidate.intent_source,
    reason: candidate.local_reason,
  };

  if (!process.env.GEMINI_API_KEY) return localFallback;

  try {
    const promptText = `Analyze this active tech hiring/project post for a potential software engineering or AI architecture lead (Next.js, Python, FastAPI, RAG AI, Supabase). Filter out spam, irrelevant stacks (C++, iOS/Android native, PHP/WordPress), and US-only/clearance-only roles.
Context: Company=${candidate.company}, Role=${candidate.role}, Source=${candidate.intent_source}, Snippet=${candidate.snippet}.
Return valid JSON ONLY: {"is_valid_lead": boolean, "quality_score": number (0-100), "source_type": "${candidate.intent_source}", "reason": "brief 1-sentence reason"}`;

    const text = await callGeminiWithFallback(promptText);
    if (!text) return localFallback;

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      is_valid_lead: Boolean(parsed.is_valid_lead),
      quality_score: typeof parsed.quality_score === 'number' ? parsed.quality_score : candidate.local_score,
      source_type: parsed.source_type || candidate.intent_source,
      reason: parsed.reason || candidate.local_reason,
    };
  } catch {
    return localFallback;
  }
}

async function generateGeminiPitch(candidate: RawLeadCandidate): Promise<string> {
  const lowSnip = `${candidate.role} ${candidate.snippet}`.toLowerCase();
  const ctaLink = lowSnip.includes('agent') || lowSnip.includes('workflow') || lowSnip.includes('tool')
    ? 'https://prateeq.in/scoping?engine=saas&goal=autonomous_agents'
    : lowSnip.includes('rag') || lowSnip.includes('vector') || lowSnip.includes('embedding')
      ? 'https://prateeq.in/scoping?engine=saas&goal=ai_rag_app'
      : 'https://prateeq.in/scoping?engine=saas&goal=saas_app';

  const fallbackPitch = `Hi ${candidate.company} Team,\n\nI saw your post for ${candidate.role} (${candidate.snippet.slice(0, 100)}...).\n\nAs a Forward Deployed Engineer & AI Solutions Architect, I specialize in building custom AI agents, pgvector RAG systems, and Next.js/FastAPI production software.\n\nI put together an interactive scoping spec for your stack: ${ctaLink}\n\nBest,\nPrateek Sharma`;

  if (!process.env.GEMINI_API_KEY) return fallbackPitch;

  try {
    const retrieverEvidence = await queryRetrieverForProof(`${candidate.company} ${candidate.role}: ${candidate.snippet}`);
    const promptText = `You are writing a B2B outreach pitch as Prateek Sharma (Forward Deployed Engineer & AI Solutions Architect).
Prateek's Production Background:
- Retriever AI SaaS: Multi-tenant hybrid search & pgvector RAG platform on Next.js 16, FastAPI, and Supabase with presigned citation downloads and 1-line script embeds.
- Synchronizer Control Deck: Streamlit management dashboard integrated with Gemini for automated skills scanning, certificate analysis, and real-time database sync.
- Client Workspace Dashboard: Google OAuth 2.0 workspace with interactive milestone tracking, Razorpay payment processing, and dynamic commercial PDF proposal exports.
- Portfolio & Telemetry Engine: Next.js 16 edge proxy architecture with sub-100ms SQL telemetry aggregations.
${retrieverEvidence}

Client Information:
Company=${candidate.company}, Role=${candidate.role}, Compensation=${candidate.compensation || 'Not specified'}, Snippet=${candidate.snippet}.

Rules:
1. Write a 3-sentence, hyper-personalized pitch connecting their exact needs to Prateek's real production builds. If verified architectural proof from Retriever is present above, reference relevant systems proof (e.g. ColBERT token MaxSim, pgvector HNSW, DeBERTa NLI judge, zero-downtime deployment).
2. Position Prateek as a Forward Deployed Engineer who ships custom AI solutions and full-stack software.
3. Include the CTA deep link: ${ctaLink}
4. Sign off from Prateek Sharma.
Return raw plain text ONLY, no markdown formatting or subject lines.`;

    const text = await callGeminiWithFallback(promptText);
    return text || fallbackPitch;
  } catch {
    return fallbackPitch;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = await getVerifiedSessionEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (!isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabase || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // Fetch known source URLs to avoid re-inserting duplicate leads
    const { data: existingRows } = await supabase
      .from('outreach_leads')
      .select('source_url');
    const knownUrls = new Set<string>(
      (existingRows || [])
        .map((r: { source_url?: string | null }) => r.source_url)
        .filter((u): u is string => Boolean(u))
    );

    // Fetch real, high-intent leads concurrently from HN Who's Hiring, HN Freelance, and RemoteOK
    const [hnHiringRes, hnFreelanceRes, remoteOkRes] = await Promise.allSettled([
      fetchHnWhosHiring(knownUrls),
      fetchHnFreelance(knownUrls),
      fetchRemoteOk(knownUrls),
    ]);

    const rawCandidates: RawLeadCandidate[] = [
      ...(hnHiringRes.status === 'fulfilled' ? hnHiringRes.value : []),
      ...(hnFreelanceRes.status === 'fulfilled' ? hnFreelanceRes.value : []),
      ...(remoteOkRes.status === 'fulfilled' ? remoteOkRes.value : []),
    ];

    // Deduplicate within this batch by source_url and sort by local relevance score
    const seenBatchUrls = new Set<string>();
    const uniqueCandidates = rawCandidates
      .filter((c) => {
        if (!c.source_url || seenBatchUrls.has(c.source_url)) return false;
        seenBatchUrls.add(c.source_url);
        return true;
      })
      .sort((a, b) => b.local_score - a.local_score);

    const minQualityScore = outreachDefaults.minQualityScore || 75;
    const effectiveMinScore = process.env.GEMINI_API_KEY ? minQualityScore : Math.min(minQualityScore, 55);
    const maxLeadsPerRun = Math.min(outreachDefaults.maxLeadsPerRun || 8, 8);

    const prospectsToInsert = [];
    for (const candidate of uniqueCandidates.slice(0, 12)) {
      const evaluation = await evaluateLeadWithGemini(candidate);
      if (!evaluation.is_valid_lead || evaluation.quality_score < effectiveMinScore) {
        continue;
      }

      const customPitch = await generateGeminiPitch(candidate);
      prospectsToInsert.push({
        lead_name: candidate.lead_name,
        company: candidate.company,
        role: candidate.role,
        email: candidate.email,
        source_url: candidate.source_url,
        ai_generated_pitch: customPitch,
        quality_score: evaluation.quality_score,
        intent_source: evaluation.source_type,
        verification_reason: evaluation.reason,
        snippet: candidate.snippet,
        lead_type: candidate.lead_type,
        compensation: candidate.compensation,
      });

      if (prospectsToInsert.length >= maxLeadsPerRun) break;
    }

    const insertedLeads = [];
    const insertErrors: string[] = [];
    for (const lead of prospectsToInsert) {
      const { data, error } = await supabase
        .from('outreach_leads')
        .insert({
          lead_name: lead.lead_name,
          company: lead.company,
          role: lead.role,
          email: lead.email,
          source_url: lead.source_url,
          ai_generated_pitch: lead.ai_generated_pitch,
          quality_score: lead.quality_score,
          intent_source: lead.intent_source,
          verification_reason: lead.verification_reason,
          snippet: lead.snippet || '',
          lead_type: lead.lead_type || 'job',
          compensation: lead.compensation || null,
          status: 'pending',
        })
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Failed to insert outreach lead:', error);
        insertErrors.push(error.message);
      } else if (data) {
        insertedLeads.push(data);
      }
    }

    if (prospectsToInsert.length > 0 && insertedLeads.length === 0 && insertErrors.length > 0) {
      return NextResponse.json(
        { error: `Failed to save discovered leads: ${insertErrors[0]}` },
        { status: 500 }
      );
    }

    const message =
      insertedLeads.length > 0
        ? `Discovered & staged ${insertedLeads.length} verified high-intent leads from HN & RemoteOK!`
        : 'No new verified high-intent leads matched your criteria in this run.';

    return NextResponse.json({
      success: true,
      candidates_scanned: uniqueCandidates.length,
      message,
      leads: insertedLeads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
