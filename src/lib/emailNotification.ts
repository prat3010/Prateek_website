import { Resend } from 'resend';
import { escapeHtml } from '@/utils/sanitize';

function getResendClient(): { resend: Resend; recipient: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const recipient = process.env.CONTACT_EMAIL_TO?.trim() || '3010prateeksharma@gmail.com';
  return { resend: new Resend(apiKey), recipient };
}

export interface AdminSignupAlertParams {
  email: string;
  fullName?: string;
  provider?: string;
  signedUpAt?: string;
}

/**
 * Sends an email notification to Prateek when a new user signs up or logs in via Auth.
 */
export async function sendAdminSignupNotification(params: AdminSignupAlertParams): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('Skipping sendAdminSignupNotification: RESEND_API_KEY not configured.');
    return false;
  }

  const emailEscaped = escapeHtml(params.email);
  const nameEscaped = escapeHtml(params.fullName || 'User');
  const providerEscaped = escapeHtml(params.provider || 'OAuth / Password');
  const timeStr = params.signedUpAt ? escapeHtml(params.signedUpAt) : new Date().toISOString();

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Auth <notifications@prateeq.in>',
      to: client.recipient,
      subject: `🔔 New User Sign-Up Alert: ${params.email}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">👤 New User Registered</h2>
              <p style="color: #94a3b8; font-size: 14px;">A user has logged in / signed up on your site platform.</p>
              
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <div style="margin-bottom: 10px;">
                  <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Email Address</strong>
                  <div style="color: #f8fafc; font-size: 16px; font-weight: 600;"><a href="mailto:${emailEscaped}" style="color: #38bdf8; text-decoration: none;">${emailEscaped}</a></div>
                </div>
                
                <div style="margin-bottom: 10px;">
                  <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Name / Profile</strong>
                  <div style="color: #f8fafc; font-size: 15px;">${nameEscaped}</div>
                </div>

                <div style="margin-bottom: 10px;">
                  <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Auth Method</strong>
                  <div style="color: #f8fafc; font-size: 14px;">${providerEscaped}</div>
                </div>

                <div>
                  <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase;">Timestamp</strong>
                  <div style="color: #cbd5e1; font-size: 13px;">${timeStr}</div>
                </div>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <a href="https://prateeq.in/dashboard" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 10px 20px; font-weight: 700; border-radius: 6px; text-decoration: none; font-size: 14px;">Open Client Dashboard</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('sendAdminSignupNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendAdminSignupNotification exception:', err);
    return false;
  }
}

export interface AdminIntakeLeadAlertParams {
  scopeCode: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  baseEngineTitle: string;
  totalCostINR: number;
  totalCostUSD: number;
  timeline?: string;
}

/**
 * Sends an email notification when a prospect creates an intake lead on /scoping.
 */
export async function sendAdminIntakeLeadNotification(params: AdminIntakeLeadAlertParams): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  const codeEscaped = escapeHtml(params.scopeCode);
  const companyEscaped = escapeHtml(params.companyName);
  const emailEscaped = escapeHtml(params.contactEmail);
  const phoneEscaped = escapeHtml(params.contactPhone || 'N/A');
  const engineEscaped = escapeHtml(params.baseEngineTitle);

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Scoping <notifications@prateeq.in>',
      to: client.recipient,
      subject: `🎯 New Intake Lead: ${params.companyName} (${params.scopeCode})`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
              <h2 style="color: #34d399; margin-top: 0; font-size: 20px;">🎯 New Scoping Intake Lead</h2>
              
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Scope Code:</strong> <span style="color: #34d399;">${codeEscaped}</span></p>
                <p style="margin: 4px 0;"><strong>Company/Prospect:</strong> ${companyEscaped}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${emailEscaped}" style="color: #38bdf8;">${emailEscaped}</a></p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> ${phoneEscaped}</p>
                <p style="margin: 4px 0;"><strong>Engine:</strong> ${engineEscaped}</p>
                <p style="margin: 4px 0;"><strong>Estimated Investment:</strong> ₹${params.totalCostINR.toLocaleString()} / $${params.totalCostUSD.toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>Timeline:</strong> ${escapeHtml(params.timeline || 'Standard')}</p>
              </div>

              <p style="color: #94a3b8; font-size: 13px;">View and manage this lead in your Sweet Sync local dashboard under Commercial & Client Ops.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('sendAdminIntakeLeadNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendAdminIntakeLeadNotification exception:', err);
    return false;
  }
}

export interface AdminScopeSavedAlertParams {
  scopeCode: string;
  companyName: string;
  clientEmail: string;
  baseEngineTitle: string;
  totalCostINR: number;
  totalCostUSD: number;
}

/**
 * Sends an email notification when a client confirms or updates a scope on /dashboard.
 */
export async function sendAdminScopeSavedNotification(params: AdminScopeSavedAlertParams): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: client.recipient,
      subject: `⚡ Client Scope Confirmed: ${params.companyName} (${params.scopeCode})`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
              <h2 style="color: #a78bfa; margin-top: 0; font-size: 20px;">⚡ Client Scope Brief Confirmed</h2>
              
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Scope Code:</strong> <span style="color: #a78bfa;">${escapeHtml(params.scopeCode)}</span></p>
                <p style="margin: 4px 0;"><strong>Client Email:</strong> ${escapeHtml(params.clientEmail)}</p>
                <p style="margin: 4px 0;"><strong>Company:</strong> ${escapeHtml(params.companyName)}</p>
                <p style="margin: 4px 0;"><strong>Engine:</strong> ${escapeHtml(params.baseEngineTitle)}</p>
                <p style="margin: 4px 0;"><strong>Total Valuation:</strong> ₹${params.totalCostINR.toLocaleString()} / $${params.totalCostUSD.toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('sendAdminScopeSavedNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendAdminScopeSavedNotification exception:', err);
    return false;
  }
}
