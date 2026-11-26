import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY || '';
    const userEmail = await getVerifiedSessionEmail(req);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (!isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { leadId, action, editedPitch } = body;

    if (!leadId || !action) {
      return NextResponse.json({ error: 'Missing leadId or action' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const { data: lead, error: fetchErr } = await supabase
      .from('outreach_leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (fetchErr || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (action === 'reject') {
      const { error: updateErr } = await supabase
        .from('outreach_leads')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Lead pitch dismissed' });
    }

    if (action === 'mark_sent') {
      const { error: updateErr } = await supabase
        .from('outreach_leads')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        status: 'sent',
        message: `Marked ${lead.company} as manually applied`,
      });
    }

    if (action === 'approve') {
      const pitchToSend = editedPitch || lead.ai_generated_pitch || '';

      // If pitchToSend is a JSON string (3-in-1 format), extract email text for email dispatch
      let emailText = pitchToSend;
      try {
        if (typeof pitchToSend === 'string' && pitchToSend.trim().startsWith('{')) {
          const parsed = JSON.parse(pitchToSend);
          if (parsed.email) {
            emailText = parsed.email;
          }
        }
      } catch {
        // Fallback to pitchToSend as raw text
      }

      const rawEmail = typeof lead.email === 'string' ? lead.email.trim() : '';
      const recipientEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : '';
      let emailSent = false;

      // Dispatch Email via Resend API only if the lead has a real verified email address
      if (apiKey && recipientEmail) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: 'Prateek Sharma <notifications@prateeq.in>',
              to: [recipientEmail],
              subject: `Partnership & Software Architecture for ${lead.company}`,
              text: emailText,
            }),
          });
          if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            console.error('Resend email dispatch error:', res.status, errBody);
            return NextResponse.json(
              { error: `Email dispatch failed: Resend returned status ${res.status}` },
              { status: 502 }
            );
          }
          emailSent = true;
        } catch (emailErr) {
          console.error('Resend email dispatch exception:', emailErr);
          return NextResponse.json(
            { error: 'Failed to communicate with email dispatch service' },
            { status: 502 }
          );
        }
      }

      const nextStatus = emailSent ? 'sent' : 'approved';
      const { error: updateErr } = await supabase
        .from('outreach_leads')
        .update({
          status: nextStatus,
          ai_generated_pitch: pitchToSend,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      const message = emailSent
        ? `Approved & dispatched email to ${lead.lead_name || lead.company} (${recipientEmail})`
        : recipientEmail
          ? `Approved ${lead.company} (email not dispatched — RESEND_API_KEY is not configured).`
          : `Approved ${lead.company} for manual application (no direct email on posting — use source link).`;

      return NextResponse.json({
        success: true,
        status: nextStatus,
        message,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
