import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO || '3010prateeksharma@gmail.com';

export async function POST(req: NextRequest) {
  try {
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
      await supabase
        .from('outreach_leads')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', leadId);

      return NextResponse.json({ success: true, message: 'Lead pitch dismissed' });
    }

    if (action === 'approve') {
      const pitchToSend = editedPitch || lead.ai_generated_pitch;

      // Dispatch Email via Resend API if key is present
      if (RESEND_API_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'Prateek Sharma <onboarding@resend.dev>',
              to: [lead.email || CONTACT_EMAIL_TO],
              subject: `Partnership & Software Architecture for ${lead.company}`,
              text: pitchToSend,
            }),
          });
        } catch (emailErr) {
          console.warn('Resend email dispatch warning:', emailErr);
        }
      }

      await supabase
        .from('outreach_leads')
        .update({
          status: 'sent',
          ai_generated_pitch: pitchToSend,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      return NextResponse.json({
        success: true,
        message: `Approved & dispatched email to ${lead.lead_name} (${lead.email})`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
