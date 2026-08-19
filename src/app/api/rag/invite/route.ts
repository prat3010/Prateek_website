import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { escapeHtml } from '@/utils/sanitize';

export async function POST(req: Request) {
  try {
    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const inviteeEmail = (payload.email as string)?.trim()?.toLowerCase();
    const role = (payload.role as string) || 'member';
    const tenantId = (payload.tenantId as string)?.trim();

    if (!inviteeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteeEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database instance not initialized.' }, { status: 500 });
    }

    // 1. Resolve active tenant mapping for caller or target tenantId
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const { data: memberRecord } = await supabase
        .from('rag_tenant_members')
        .select('tenant_id')
        .eq('email', callerEmail)
        .maybeSingle();

      if (memberRecord) {
        targetTenantId = memberRecord.tenant_id;
      }
    }

    if (!targetTenantId) {
      return NextResponse.json({ error: 'No active RAG tenant found for user session.' }, { status: 404 });
    }

    // Assert caller is an owner or admin of targetTenantId
    const { data: callerMembership } = await supabase
      .from('rag_tenant_members')
      .select('role')
      .eq('email', callerEmail)
      .eq('tenant_id', targetTenantId)
      .maybeSingle();

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only tenant owners or admins can invite team members.' },
        { status: 403 }
      );
    }

    if (role === 'owner' && callerMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owners can assign owner role.' },
        { status: 403 }
      );
    }

    // 2. Insert or update rag_tenant_members record in Supabase DB
    const nowIso = new Date().toISOString();
    const { data: newMember, error: dbErr } = await supabase
      .from('rag_tenant_members')
      .upsert(
        {
          tenant_id: targetTenantId,
          email: inviteeEmail,
          role,
          created_at: nowIso,
        },
        { onConflict: 'tenant_id,email' }
      )
      .select()
      .single();

    if (dbErr) {
      console.error('Failed to save team member to Supabase:', dbErr.message);
      return NextResponse.json({ error: 'Failed to record team member invitation.' }, { status: 500 });
    }

    // 3. Send invitation email via Resend if API key is present
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const escapedInvitee = escapeHtml(inviteeEmail);
        const escapedCaller = escapeHtml(callerEmail);
        const escapedRole = escapeHtml(role.toUpperCase());

        await resend.emails.send({
          from: 'Retriever Team <notifications@prateeq.in>',
          to: inviteeEmail,
          subject: `You've been invited to join an RAG SaaS Workspace on prateeq.in`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Workspace Invitation</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f9fa; padding: 20px; color: #1a1a1a; }
                  .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 2px solid #000000; border-radius: 8px; box-shadow: 4px 4px 0px 0px #000000; overflow: hidden; }
                  .header { background-color: #3b82f6; color: #ffffff; padding: 24px; text-align: center; border-bottom: 2px solid #000000; }
                  .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; }
                  .content { padding: 30px 24px; }
                  .role-badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
                  .btn { display: inline-block; background: #2563eb; color: #ffffff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 20px; border: 2px solid #000000; box-shadow: 2px 2px 0px 0px #000000; }
                  .footer { background: #f8f9fa; padding: 16px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; text-align: center; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Workspace Invitation</h1>
                  </div>
                  <div class="content">
                    <p>Hello <strong>${escapedInvitee}</strong>,</p>
                    <p><strong>${escapedCaller}</strong> has invited you to join their RAG SaaS Workspace as a <span class="role-badge">${escapedRole}</span>.</p>
                    <p>Log in with Google on <strong>prateeq.in/rag/app</strong> to access your workspace documents, search, and RAG studio tools.</p>
                    <a href="https://prateeq.in/rag/app" class="btn">Open SaaS Studio Workspace</a>
                  </div>
                  <div class="footer">
                    Retriever RAG SaaS Subscription Platform • prateeq.in
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.warn('Resend invitation email error:', emailErr);
      }
    }

    // 4. Optionally sync user to retriever backend if admin key is configured
    const adminKey = process.env.ADMIN_MASTER_KEY || process.env.RETRIEVER_ADMIN_KEY;
    const retrieverUrl = process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in';

    if (adminKey && targetTenantId) {
      try {
        await fetch(`${retrieverUrl.replace(/\/$/, '')}/v1/admin/tenants/${targetTenantId}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Master-Key': adminKey,
          },
          body: JSON.stringify({
            external_id: inviteeEmail,
            display_name: inviteeEmail.split('@')[0],
          }),
        });
      } catch (syncErr) {
        console.warn('Retriever administrative user sync warning:', syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      emailSent,
    });
  } catch (err: unknown) {
    console.error('RAG Invite API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
