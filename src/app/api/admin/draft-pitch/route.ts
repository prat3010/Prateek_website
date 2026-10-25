import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export const maxDuration = 45;

interface ProposalDraft {
  subject: string;
  emailBody: string;
  keyPainPoints: string[];
}

async function callGeminiForProposal(prompt: string, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash'];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

export async function POST(req: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || '';
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const userEmail = await getVerifiedSessionEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (!isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { leadId, scopeCode, action = 'draft', subject, emailBody } = body;

    if (!leadId && !scopeCode) {
      return NextResponse.json({ error: 'Missing leadId or scopeCode' }, { status: 400 });
    }

    let query = supabase.from('intake_leads').select('*');
    if (leadId) {
      query = query.eq('id', leadId);
    } else {
      query = query.eq('scope_code', scopeCode);
    }

    const { data: lead, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !lead) {
      return NextResponse.json({ error: 'Lead not found in intake_leads' }, { status: 404 });
    }

    // Action 1: Direct Send via Resend
    if (action === 'send') {
      if (!resendApiKey) {
        return NextResponse.json(
          { error: 'RESEND_API_KEY is not configured on the server.' },
          { status: 500 }
        );
      }

      const recipientEmail = (lead.contact_email || '').trim().toLowerCase();
      if (!recipientEmail || !recipientEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid or missing contact email for this lead.' },
          { status: 400 }
        );
      }

      if (
        recipientEmail === 'lead@unauthenticated.client' ||
        recipientEmail.endsWith('@unauthenticated.client')
      ) {
        return NextResponse.json(
          { error: 'Cannot send proposal to an unauthenticated placeholder email.' },
          { status: 400 }
        );
      }

      const emailSubject = subject || `Software Architecture Proposal for ${lead.company_name}`;
      const emailContent = emailBody;

      if (!emailContent || typeof emailContent !== 'string') {
        return NextResponse.json({ error: 'emailBody is required for dispatch.' }, { status: 400 });
      }

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Prateek Sharma <notifications@prateeq.in>',
            to: [recipientEmail],
            reply_to: '3010prateeksharma@gmail.com',
            subject: emailSubject,
            text: emailContent,
          }),
        });

        if (!resendRes.ok) {
          const errBody = await resendRes.text().catch(() => '');
          console.error('Resend email error:', resendRes.status, errBody);
          return NextResponse.json(
            { error: `Email dispatch failed (status ${resendRes.status}): ${errBody}` },
            { status: 502 }
          );
        }

        await supabase
          .from('intake_leads')
          .update({ status: 'contacted' })
          .eq('id', lead.id);

        return NextResponse.json({
          success: true,
          message: `Proposal dispatched to ${recipientEmail} successfully!`,
        });
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        return NextResponse.json({ error: `Failed to dispatch email: ${msg}` }, { status: 500 });
      }
    }

    // Action 2: Generate AI Proposal Draft
    const prospectInquiries = Array.isArray(lead.chat_transcript)
      ? lead.chat_transcript
          .filter((m: { role?: string; content?: string }) => m.role === 'user')
          .map((m: { content?: string }) => m.content)
          .slice(-6)
          .join('\n- ')
      : '';

    const selectedFeaturesList = Array.isArray(lead.selected_features)
      ? lead.selected_features.join(', ')
      : 'Standard core modules';

    const fallbackSubject = `Technical Architecture & Phased Roadmap for ${lead.company_name}`;
    const fallbackBody = `Hi ${lead.company_name} Team,

Thank you for exploring your software vision on our Scoping Lab. Based on your project requirements for ${lead.base_engine_title || lead.base_engine_id.toUpperCase()} with ${selectedFeaturesList}, I have assembled an architectural blueprint to help you launch without technical debt.

To de-risk delivery and respect your budget, I recommend decoupling the implementation into a Phase 1 Core Lean MVP followed by a Phase 2 Scale Layer. Our production stack leverages Next.js 16 App Router, React 19, Supabase PostgreSQL with strict Row-Level Security (RLS), and sub-second API pipelines.

You can inspect your personalized proposal and sprint deliverables in your client workspace: https://prateeq.in/dashboard

Would you be open to a quick 20-minute architectural alignment call this week to finalize your sprint scope?

Best regards,
Prateek Sharma
Forward Deployed Engineer & AI Solutions Architect
prateeq.in • +91 9540540445`;

    const fallbackPainPoints = [
      `Deploying ${lead.base_engine_title || 'MVP'} on a verified production stack`,
      `De-risking delivery with a Phase 1 Core Lean MVP roadmap`,
      `Enforcing strict PostgreSQL Row-Level Security (RLS)`,
    ];

    const fallbackDraft: ProposalDraft = {
      subject: fallbackSubject,
      emailBody: fallbackBody,
      keyPainPoints: fallbackPainPoints,
    };

    if (!geminiApiKey) {
      return NextResponse.json({ success: true, draft: fallbackDraft, isFallback: true });
    }

    const geminiPrompt = `You are writing a consultative executive proposal email as Prateek Sharma (Forward Deployed Engineer & AI Solutions Architect at prateeq.in).

Prospect Context:
- Company Name: ${lead.company_name}
- Contact Email: ${lead.contact_email}
- Scope Code: ${lead.scope_code}
- Base Engine: ${lead.base_engine_title || lead.base_engine_id}
- Active Modules: ${selectedFeaturesList}
- Total Investment: ₹${Number(lead.total_cost_inr || 0).toLocaleString()} / $${Number(lead.total_cost_usd || 0).toLocaleString()}
- Target Timeline: ${lead.timeline || '3–4 Weeks'}
- Prospect Inquiries / Chat Transcript:
${prospectInquiries ? `- ${prospectInquiries}` : 'Client explored interactive scoping lab.'}

Rules:
1. Write a 3-paragraph executive proposal email from Prateek Sharma.
   - Paragraph 1: Sincere opening acknowledging their project vision at ${lead.company_name} and addressing their specific inquiry or user flow requirements.
   - Paragraph 2: Outline the recommended technical architecture (Next.js 16 App Router, React 19, Supabase RLS, and Retriever pgvector if AI/search was discussed) with a proposed Phase 1 Core MVP vs Phase 2 roadmap to de-risk delivery.
   - Paragraph 3: Direct call-to-action inviting them to view their interactive workspace dashboard or book a 20-minute architectural alignment call with Prateek. Include workspace URL: https://prateeq.in/dashboard
2. Sign off with:
Best regards,
Prateek Sharma
Forward Deployed Engineer & AI Solutions Architect
prateeq.in • +91 9540540445
3. Provide an engaging email Subject line and 2-3 key pain points identified from their inquiry.

Return VALID JSON ONLY with this schema (no markdown fences, no extra text):
{
  "subject": "...",
  "emailBody": "...",
  "keyPainPoints": ["...", "..."]
}`;

    const rawResponse = await callGeminiForProposal(geminiPrompt, geminiApiKey);

    if (rawResponse) {
      try {
        let cleaned = rawResponse.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.subject && parsed.emailBody) {
          return NextResponse.json({
            success: true,
            draft: {
              subject: String(parsed.subject),
              emailBody: String(parsed.emailBody),
              keyPainPoints: Array.isArray(parsed.keyPainPoints) ? parsed.keyPainPoints : fallbackPainPoints,
            },
            isFallback: false,
          });
        }
      } catch {
        // Fallback to deterministic template if JSON parsing failed
      }
    }

    return NextResponse.json({ success: true, draft: fallbackDraft, isFallback: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown drafting error';
    console.error('Fatal draft pitch error:', error);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
