import { Resend } from 'resend';
import { escapeHtml } from '@/utils/sanitize';

function getResendClient(): { resend: Resend; recipient: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const recipient = process.env.CONTACT_EMAIL_TO?.trim() || '3010prateeksharma@gmail.com';
  return { resend: new Resend(apiKey), recipient };
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/[<>"'\s]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return '';
      }
    });
  }
  return '#';
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

export interface PaymentConfirmationAlertParams {
  clientEmail: string;
  clientName?: string;
  scopeCode?: string;
  projectName?: string;
  invoiceNumber?: string;
  milestoneName?: string;
  amount: number;
  currency: string;
  paymentId?: string;
}

/**
 * Sends payment confirmation emails to both Prateek (admin alert) and the Client (official payment receipt).
 */
export async function sendPaymentConfirmationNotifications(
  params: PaymentConfirmationAlertParams
): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  const formattedAmount =
    params.currency?.toUpperCase() === 'USD'
      ? `$${Number(params.amount || 0).toLocaleString('en-US')}`
      : `₹${Number(params.amount || 0).toLocaleString('en-IN')}`;
  const scopeLabel = escapeHtml(params.scopeCode || params.invoiceNumber || 'Custom Project');
  const projectLabel = escapeHtml(params.projectName || params.clientName || 'Client Project');
  const milestoneLabel = escapeHtml(params.milestoneName || '50% Scope Deposit & Sprint Lock');
  const paymentIdLabel = escapeHtml(params.paymentId || 'Verified via Razorpay');
  const clientEmailEscaped = escapeHtml(params.clientEmail);

  try {
    // 1. Admin Alert
    await client.resend.emails.send({
      from: 'Prateeq Studio Billing <notifications@prateeq.in>',
      to: client.recipient,
      subject: `💰 Payment Received: ${formattedAmount} — ${params.projectName || params.scopeCode || params.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #10b981; border-radius: 12px; padding: 24px;">
              <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">💰 Milestone Payment Captured</h2>
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Amount Paid:</strong> <span style="color: #10b981; font-weight: 700;">${formattedAmount}</span></p>
                <p style="margin: 4px 0;"><strong>Project / Company:</strong> ${projectLabel}</p>
                <p style="margin: 4px 0;"><strong>Scope / Invoice:</strong> ${scopeLabel}</p>
                <p style="margin: 4px 0;"><strong>Milestone:</strong> ${milestoneLabel}</p>
                <p style="margin: 4px 0;"><strong>Client Email:</strong> <a href="mailto:${clientEmailEscaped}" style="color: #38bdf8;">${clientEmailEscaped}</a></p>
                <p style="margin: 4px 0;"><strong>Razorpay Payment ID:</strong> <code>${paymentIdLabel}</code></p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://prateeq.in/admin" style="display: inline-block; background: #10b981; color: #0f172a; padding: 10px 20px; font-weight: 700; border-radius: 6px; text-decoration: none; font-size: 14px;">Manage Order in Admin Console</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // 2. Client Receipt
    if (params.clientEmail && params.clientEmail.includes('@')) {
      await client.resend.emails.send({
        from: 'Prateeq Studio <notifications@prateeq.in>',
        to: params.clientEmail,
        subject: `✅ Payment Receipt (${formattedAmount}) — ${params.projectName || 'Prateeq Studio'}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
              <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px;">
                <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">✅ Payment Confirmed & Sprint Locked</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Thank you! Your payment of <strong>${formattedAmount}</strong> for <strong>${projectLabel}</strong> has been verified and recorded.
                </p>
                <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                  <p style="margin: 4px 0;"><strong>Reference:</strong> ${scopeLabel}</p>
                  <p style="margin: 4px 0;"><strong>Milestone:</strong> ${milestoneLabel}</p>
                  <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ${formattedAmount}</p>
                  <p style="margin: 4px 0;"><strong>Transaction ID:</strong> <code>${paymentIdLabel}</code></p>
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                  You can download your official PDF invoice, complete your onboarding checklist, and track live engineering milestones anytime in your Client Workspace.
                </p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://prateeq.in/dashboard" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 10px 20px; font-weight: 700; border-radius: 6px; text-decoration: none; font-size: 14px;">Open Client Workspace →</a>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    }
    return true;
  } catch (err) {
    console.warn('sendPaymentConfirmationNotifications warning:', err);
    return false;
  }
}

export interface AdminChangeOrderAlertParams {
  changeOrderNumber: string;
  scopeCode: string;
  companyName: string;
  clientEmail: string;
  addedFeatures: string[];
  removedFeatures: string[];
  priceDeltaINR: number;
  priceDeltaUSD: number;
}

/**
 * Sends an email notification when a client submits a Phase 2 Change Order on /dashboard.
 */
export async function sendAdminChangeOrderNotification(
  params: AdminChangeOrderAlertParams
): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: client.recipient,
      subject: `🔄 Change Order Submitted: ${params.changeOrderNumber} (${params.companyName})`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #f59e0b; border-radius: 12px; padding: 24px;">
              <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">🔄 Phase 2 Change Order Requested</h2>
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Change Order:</strong> <span style="color: #f59e0b;">${escapeHtml(params.changeOrderNumber)}</span></p>
                <p style="margin: 4px 0;"><strong>Scope Code:</strong> ${escapeHtml(params.scopeCode)}</p>
                <p style="margin: 4px 0;"><strong>Company:</strong> ${escapeHtml(params.companyName)}</p>
                <p style="margin: 4px 0;"><strong>Client Email:</strong> ${escapeHtml(params.clientEmail)}</p>
                <p style="margin: 4px 0;"><strong>Added Features:</strong> ${escapeHtml(params.addedFeatures.join(', ') || 'None')}</p>
                <p style="margin: 4px 0;"><strong>Removed Features:</strong> ${escapeHtml(params.removedFeatures.join(', ') || 'None')}</p>
                <p style="margin: 4px 0;"><strong>Price Delta:</strong> +₹${Number(params.priceDeltaINR || 0).toLocaleString('en-IN')} / +$${Number(params.priceDeltaUSD || 0).toLocaleString('en-US')}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return !error;
  } catch (err) {
    console.warn('sendAdminChangeOrderNotification warning:', err);
    return false;
  }
}

export interface AdminOnboardingCompleteParams {
  scopeCode: string;
  companyName: string;
  clientEmail: string;
  checklistSummary: string;
}

/**
 * Sends a notification when a client completes 100% of their post-deposit onboarding checklist.
 */
export async function sendAdminOnboardingCompletedNotification(
  params: AdminOnboardingCompleteParams
): Promise<boolean> {
  const client = getResendClient();
  if (!client) return false;

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: client.recipient,
      subject: `✅ Onboarding Checklist 100% Complete: ${params.companyName} (${params.scopeCode})`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #34d399; border-radius: 12px; padding: 24px;">
              <h2 style="color: #34d399; margin-top: 0; font-size: 20px;">✅ Client Completed All Onboarding Prerequisites</h2>
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Scope Code:</strong> ${escapeHtml(params.scopeCode)}</p>
                <p style="margin: 4px 0;"><strong>Company:</strong> ${escapeHtml(params.companyName)}</p>
                <p style="margin: 4px 0;"><strong>Client Email:</strong> ${escapeHtml(params.clientEmail)}</p>
                <p style="margin: 8px 0 4px;"><strong>Submitted Checklist & Links:</strong></p>
                <pre style="white-space: pre-wrap; color: #cbd5e1; font-size: 12px;">${escapeHtml(params.checklistSummary)}</pre>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return !error;
  } catch (err) {
    console.warn('sendAdminOnboardingCompletedNotification warning:', err);
    return false;
  }
}

export interface RetrieverSubscriptionAlertParams {
  subscriberEmail: string;
  subscriberName?: string;
  planTier: string;
  amountFormatted: string;
  subscriptionId: string;
  paymentId?: string;
  tenantId: string;
  monthlyTokenLimit: number;
}

/**
 * Sends both an Owner Alert and a Subscriber Receipt + Workspace Onboarding email
 * when a Retriever SaaS subscription is purchased or renewed via Razorpay.
 */
export async function sendRetrieverSubscriptionNotifications(
  params: RetrieverSubscriptionAlertParams
): Promise<{ adminSent: boolean; subscriberSent: boolean }> {
  const client = getResendClient();
  if (!client) return { adminSent: false, subscriberSent: false };

  const tierLabel = (params.planTier || 'starter').toUpperCase();
  const displayName = params.subscriberName || params.subscriberEmail.split('@')[0];
  const tokenQuotaFormatted = Number(params.monthlyTokenLimit || 250000).toLocaleString('en-US');

  let adminSent = false;
  let subscriberSent = false;

  try {
    const { error: adminErr } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: client.recipient,
      subject: `⚡ [Retriever SaaS] ${tierLabel} Subscription Activated: ${params.subscriberEmail} (${params.amountFormatted}/mo)`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #38bdf8; border-radius: 12px; padding: 24px;">
              <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">⚡ Retriever SaaS Subscription Active</h2>
              <p style="color: #94a3b8; font-size: 14px;">A subscriber has activated or renewed a Retriever AI RAG Engine subscription.</p>
              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Subscriber:</strong> ${escapeHtml(displayName)} (${escapeHtml(params.subscriberEmail)})</p>
                <p style="margin: 4px 0;"><strong>Plan Tier:</strong> <span style="color: #38bdf8; font-weight: 700;">${escapeHtml(tierLabel)}</span> (${escapeHtml(params.amountFormatted)}/mo)</p>
                <p style="margin: 4px 0;"><strong>Token Quota:</strong> ${escapeHtml(tokenQuotaFormatted)} tokens/mo</p>
                <p style="margin: 4px 0;"><strong>Tenant ID:</strong> <code>${escapeHtml(params.tenantId)}</code></p>
                <p style="margin: 4px 0;"><strong>Subscription ID:</strong> <code>${escapeHtml(params.subscriptionId)}</code></p>
                ${params.paymentId ? `<p style="margin: 4px 0;"><strong>Payment ID:</strong> <code>${escapeHtml(params.paymentId)}</code></p>` : ''}
              </div>
              <a href="https://prateeq.in/admin" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 700; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;">Open Admin Control Center →</a>
            </div>
          </body>
        </html>
      `,
    });
    adminSent = !adminErr;
  } catch (err) {
    console.warn('sendRetrieverSubscriptionNotifications (admin) warning:', err);
  }

  if (params.subscriberEmail && params.subscriberEmail.includes('@')) {
    try {
      const { error: subErr } = await client.resend.emails.send({
        from: 'Retriever AI by Prateeq <notifications@prateeq.in>',
        to: params.subscriberEmail,
        subject: `⚡ Your Retriever ${tierLabel} Workspace is Live (${params.amountFormatted}/mo Receipt)`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
              <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #34d399; border-radius: 12px; padding: 24px;">
                <h2 style="color: #34d399; margin-top: 0; font-size: 20px;">⚡ Welcome to Retriever ${escapeHtml(tierLabel)}</h2>
                <p style="color: #cbd5e1; font-size: 14px;">Hi ${escapeHtml(displayName)}, your Retriever AI RAG subscription has been verified and your isolated pgvector tenant workspace is active.</p>
                <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155;">
                  <p style="margin: 4px 0;"><strong>Active Plan:</strong> <span style="color: #34d399; font-weight: 700;">Retriever ${escapeHtml(tierLabel)}</span> (${escapeHtml(params.amountFormatted)}/month)</p>
                  <p style="margin: 4px 0;"><strong>Monthly Token Quota:</strong> ${escapeHtml(tokenQuotaFormatted)} tokens/mo</p>
                  <p style="margin: 4px 0;"><strong>Workspace Tenant ID:</strong> <code>${escapeHtml(params.tenantId)}</code></p>
                  <p style="margin: 4px 0;"><strong>Subscription Reference:</strong> <code>${escapeHtml(params.subscriptionId)}</code></p>
                  ${params.paymentId ? `<p style="margin: 4px 0;"><strong>Payment Reference:</strong> <code>${escapeHtml(params.paymentId)}</code></p>` : ''}
                </div>
                <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px;">You can upload documents, configure hybrid search &amp; system prompts, and copy your 1-line embed widget directly in the RAG App Studio:</p>
                <a href="https://prateeq.in/rag/app" style="display: inline-block; background: #34d399; color: #0f172a; font-weight: 700; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px;">Open Retriever App Studio →</a>
              </div>
            </body>
          </html>
        `,
      });
      subscriberSent = !subErr;
    } catch (err) {
      console.warn('sendRetrieverSubscriptionNotifications (subscriber) warning:', err);
    }
  }

  return { adminSent, subscriberSent };
}

export interface ClientMilestoneAlertParams {
  clientEmail: string;
  clientName?: string;
  companyName: string;
  scopeCode: string;
  previousStage?: string;
  newStage: string;
  stagingUrl?: string;
  productionUrl?: string;
  githubRepo?: string;
  customNotes?: string;
}

/**
 * Sends an email notification to the client when the operator advances the project delivery stage.
 */
export async function sendClientMilestoneStageAdvancedNotification(
  params: ClientMilestoneAlertParams
): Promise<boolean> {
  const client = getResendClient();
  if (!client || !params.clientEmail || !params.clientEmail.includes('@')) {
    return false;
  }

  const stage = (params.newStage || '').toLowerCase();
  const companyEscaped = escapeHtml(params.companyName);
  const codeEscaped = escapeHtml(params.scopeCode);
  const nameEscaped = escapeHtml(params.clientName || 'Partner');

  let stageTitle = 'Milestone Updated';
  let badgeText = '📋 MILESTONE UPDATE';
  let badgeColor = '#a78bfa';
  let subject = `📋 Project Milestone Update — ${params.companyName} (${params.scopeCode})`;
  let headline = `Your Project Stage Has Been Updated`;
  let stageDescription = `Your project milestone has progressed to ${escapeHtml(params.newStage.toUpperCase())}.`;
  let primaryCtaUrl = 'https://prateeq.in/dashboard';
  let primaryCtaText = 'Open Client Workspace →';

  if (stage === 'engineering') {
    stageTitle = 'Active Engineering Sprint';
    badgeText = '🚀 SPRINT ACTIVE';
    badgeColor = '#38bdf8';
    subject = `🚀 Engineering Sprint Started — ${params.companyName} (${params.scopeCode})`;
    headline = `Engineering Sprint Commenced`;
    stageDescription = `The technical blueprint has been locked, and active engineering has begun! Architecture scaffolding, data models, and core feature logic are actively being built.`;
    primaryCtaText = 'Track Sprint in Workspace →';
  } else if (stage === 'staging') {
    stageTitle = 'Staging Preview Ready';
    badgeText = '👀 READY FOR CLIENT REVIEW';
    badgeColor = '#f59e0b';
    subject = `👀 Staging Preview Ready for Review — ${params.companyName} (${params.scopeCode})`;
    headline = `Staging Build Ready for Review`;
    stageDescription = `Your application has been deployed to the isolated staging environment. You can now test live feature interactions, inspect UI responsiveness across mobile & desktop, and submit sign-off.`;
    if (params.stagingUrl) {
      primaryCtaUrl = params.stagingUrl;
      primaryCtaText = 'Open Live Staging Preview ↗';
    }
  } else if (stage === 'live') {
    stageTitle = 'Production Live';
    badgeText = '🎉 PRODUCTION LIVE';
    badgeColor = '#10b981';
    subject = `🎉 Production Deployment Live — ${params.companyName} (${params.scopeCode})`;
    headline = `Your Application is Officially Live!`;
    stageDescription = `Congratulations! All sprint milestones, DNS configurations, and SSL certifications have been completed. Your application is officially deployed and live in production.`;
    if (params.productionUrl) {
      primaryCtaUrl = params.productionUrl;
      primaryCtaText = 'Visit Live Production Website ↗';
    }
  }

  const deliverablesHtml: string[] = [];
  if (params.stagingUrl) {
    const safeUrl = sanitizeUrl(params.stagingUrl);
    deliverablesHtml.push(
      `<p style="margin: 4px 0;"><strong>Staging URL:</strong> <a href="${safeUrl}" style="color: #38bdf8; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></p>`
    );
  }
  if (params.productionUrl) {
    const safeUrl = sanitizeUrl(params.productionUrl);
    deliverablesHtml.push(
      `<p style="margin: 4px 0;"><strong>Production URL:</strong> <a href="${safeUrl}" style="color: #10b981; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></p>`
    );
  }
  if (params.githubRepo) {
    const safeUrl = sanitizeUrl(params.githubRepo);
    deliverablesHtml.push(
      `<p style="margin: 4px 0;"><strong>Repository:</strong> <a href="${safeUrl}" style="color: #cbd5e1; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></p>`
    );
  }

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: params.clientEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
            <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
              <div style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid ${badgeColor}; color: ${badgeColor}; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                ${badgeText}
              </div>
              <h2 style="color: #f8fafc; margin-top: 0; font-size: 22px; font-weight: 700;">${headline}</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Hi ${nameEscaped}, we have an exciting update on your project with Prateeq Studio.
              </p>
              
              <div style="background: #0f172a; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Project:</strong> ${companyEscaped}</p>
                <p style="margin: 4px 0;"><strong>Scope Reference:</strong> <span style="color: #38bdf8; font-weight: 600;">${codeEscaped}</span></p>
                <p style="margin: 4px 0;"><strong>Current Stage:</strong> <span style="color: ${badgeColor}; font-weight: 700;">${escapeHtml(stageTitle)}</span></p>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; font-size: 13px; line-height: 1.5;">
                  ${stageDescription}
                </div>
                ${deliverablesHtml.length > 0 ? `
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 13px;">
                    ${deliverablesHtml.join('')}
                  </div>
                ` : ''}
              </div>

              ${params.customNotes ? `
                <div style="background: rgba(56, 189, 248, 0.05); border-left: 3px solid #38bdf8; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; font-weight: 600;">Note from Prateek</p>
                  <p style="color: #f8fafc; font-size: 13px; margin: 0; line-height: 1.5;">${escapeHtml(params.customNotes)}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin: 28px 0 10px;">
                <a href="${escapeHtml(primaryCtaUrl)}" style="display: inline-block; background: ${badgeColor}; color: #0f172a; padding: 12px 24px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
                  ${escapeHtml(primaryCtaText)}
                </a>
              </div>

              ${primaryCtaUrl !== 'https://prateeq.in/dashboard' ? `
                <div style="text-align: center; margin-top: 10px;">
                  <a href="https://prateeq.in/dashboard" style="color: #94a3b8; font-size: 12px; text-decoration: underline;">
                    Manage Scope & Invoices in Client Workspace →
                  </a>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('sendClientMilestoneStageAdvancedNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendClientMilestoneStageAdvancedNotification exception:', err);
    return false;
  }
}

export interface ClientChangeOrderAlertParams {
  clientEmail: string;
  clientName?: string;
  companyName: string;
  scopeCode: string;
  changeOrderNumber: string;
  action: 'approve' | 'reject' | 'mark_paid';
  addedFeatures?: string[];
  removedFeatures?: string[];
  priceDeltaINR?: number;
  priceDeltaUSD?: number;
  invoiceNumber?: string;
  invoiceId?: string;
}

/**
 * Sends an email notification to the client when their Phase 2 Change Order is approved, rejected, or marked paid.
 */
export async function sendClientChangeOrderUpdateNotification(
  params: ClientChangeOrderAlertParams
): Promise<boolean> {
  const client = getResendClient();
  if (!client || !params.clientEmail || !params.clientEmail.includes('@')) {
    return false;
  }

  const coNumberEscaped = escapeHtml(params.changeOrderNumber);
  const companyEscaped = escapeHtml(params.companyName);
  const codeEscaped = escapeHtml(params.scopeCode);
  const nameEscaped = escapeHtml(params.clientName || 'Partner');

  const addedStr = (params.addedFeatures && params.addedFeatures.length > 0)
    ? params.addedFeatures.join(', ')
    : 'None';
  const removedStr = (params.removedFeatures && params.removedFeatures.length > 0)
    ? params.removedFeatures.join(', ')
    : 'None';

  const deltaFormatted = `+₹${Number(params.priceDeltaINR || 0).toLocaleString('en-IN')} / +$${Number(params.priceDeltaUSD || 0).toLocaleString('en-US')}`;

  let badgeText = '✅ CHANGE ORDER APPROVED';
  let badgeColor = '#10b981';
  let subject = `✅ Change Order Approved: ${params.changeOrderNumber} — ${params.companyName}`;
  let headline = `Change Order Approved & Scheduled`;
  let description = `Prateek has approved your change order request. The scope adjustments have been merged into the engineering roadmap.`;

  if (params.action === 'reject') {
    badgeText = '⚠️ CHANGE ORDER DECLINED';
    badgeColor = '#ef4444';
    subject = `⚠️ Change Order Update: ${params.changeOrderNumber} — ${params.companyName}`;
    headline = `Change Order Declined / Cancelled`;
    description = `Your change order request has been reviewed and declined or held for discussion. Any associated pending milestone invoice has been cancelled with zero balance due.`;
  } else if (params.action === 'mark_paid') {
    badgeText = '🎉 CHANGE ORDER SETTLED & MERGED';
    badgeColor = '#38bdf8';
    subject = `🎉 Change Order Settled: ${params.changeOrderNumber} — ${params.companyName}`;
    headline = `Change Order Payment Confirmed`;
    description = `Payment for this change order has been received and verified. The requested feature additions are now officially part of your project deliverable scope.`;
  }

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Workspace <notifications@prateeq.in>',
      to: params.clientEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
            <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
              <div style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid ${badgeColor}; color: ${badgeColor}; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                ${badgeText}
              </div>
              <h2 style="color: #f8fafc; margin-top: 0; font-size: 22px; font-weight: 700;">${headline}</h2>
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                Hi ${nameEscaped}, here is an update on your change order request for <strong>${companyEscaped}</strong>.
              </p>

              <div style="background: #0f172a; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Change Order:</strong> <span style="color: #38bdf8; font-weight: 700;">${coNumberEscaped}</span></p>
                <p style="margin: 4px 0;"><strong>Project Scope:</strong> ${codeEscaped}</p>
                <p style="margin: 4px 0;"><strong>Added Features:</strong> <span style="color: #34d399;">${escapeHtml(addedStr)}</span></p>
                ${removedStr !== 'None' ? `<p style="margin: 4px 0;"><strong>Removed Features:</strong> <span style="color: #f87171;">${escapeHtml(removedStr)}</span></p>` : ''}
                <p style="margin: 4px 0;"><strong>Valuation Adjustment:</strong> ${deltaFormatted}</p>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; font-size: 13px; line-height: 1.5;">
                  ${description}
                </div>
              </div>

              ${params.action === 'approve' && (Number(params.priceDeltaINR || 0) > 0 || Number(params.priceDeltaUSD || 0) > 0) ? `
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                  A supplementary milestone invoice is now available in your Client Workspace ledger for online settlement.
                </p>
              ` : ''}

              <div style="text-align: center; margin: 24px 0 10px;">
                <a href="https://prateeq.in/dashboard" style="display: inline-block; background: ${badgeColor}; color: #0f172a; padding: 12px 24px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">
                  Open Client Workspace →
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('sendClientChangeOrderUpdateNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendClientChangeOrderUpdateNotification exception:', err);
    return false;
  }
}

export interface FinalBalanceAlertParams {
  clientEmail: string;
  clientName?: string;
  companyName: string;
  scopeCode: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentId?: string;
  productionUrl?: string;
  githubRepo?: string;
  figmaUrl?: string;
  maintenancePlan?: string;
}

/**
 * Sends the official 100% Zero-Balance Clearance & Final Handover receipt to the client,
 * and notifies the operator to finalize handover deliverables.
 */
export async function sendFinalBalanceSettlementNotifications(
  params: FinalBalanceAlertParams
): Promise<{ adminSent: boolean; clientSent: boolean }> {
  const client = getResendClient();
  if (!client) return { adminSent: false, clientSent: false };

  const formattedAmount =
    params.currency?.toUpperCase() === 'USD'
      ? `$${Number(params.amount || 0).toLocaleString('en-US')}`
      : `₹${Number(params.amount || 0).toLocaleString('en-IN')}`;

  const companyEscaped = escapeHtml(params.companyName);
  const codeEscaped = escapeHtml(params.scopeCode);
  const invEscaped = escapeHtml(params.invoiceNumber);
  const paymentIdEscaped = escapeHtml(params.paymentId || 'Verified via Razorpay');
  const nameEscaped = escapeHtml(params.clientName || 'Partner');
  const clientEmailEscaped = escapeHtml(params.clientEmail);
  const planEscaped = escapeHtml(params.maintenancePlan || 'Standard Launch Warranty (30 Days)');

  let adminSent = false;
  let clientSent = false;

  // 1. Admin Handover Checklist Alert
  try {
    const { error: adminErr } = await client.resend.emails.send({
      from: 'Prateeq Studio Billing <notifications@prateeq.in>',
      to: client.recipient,
      subject: `🏆 Full Balance Settled: ${params.companyName} (${params.scopeCode}) — Handover Due`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
            <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #10b981; border-radius: 12px; padding: 28px;">
              <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
                💰 100% REVENUE CAPTURED
              </div>
              <h2 style="color: #10b981; margin-top: 0; font-size: 22px;">Final Balance Captured &amp; Settled</h2>
              <div style="background: #0f172a; border-radius: 8px; padding: 18px; margin: 16px 0; border: 1px solid #334155;">
                <p style="margin: 4px 0;"><strong>Company:</strong> ${companyEscaped}</p>
                <p style="margin: 4px 0;"><strong>Scope Reference:</strong> ${codeEscaped}</p>
                <p style="margin: 4px 0;"><strong>Invoice Reference:</strong> ${invEscaped}</p>
                <p style="margin: 4px 0;"><strong>Balance Settled:</strong> <span style="color: #10b981; font-weight: 700;">${formattedAmount}</span></p>
                <p style="margin: 4px 0;"><strong>Client Email:</strong> <a href="mailto:${clientEmailEscaped}" style="color: #38bdf8;">${clientEmailEscaped}</a></p>
                <p style="margin: 4px 0;"><strong>Razorpay Payment ID:</strong> <code>${paymentIdEscaped}</code></p>
                <p style="margin: 4px 0;"><strong>Maintenance Plan:</strong> ${planEscaped}</p>
              </div>

              <div style="background: rgba(16, 185, 129, 0.05); border: 1px dashed #10b981; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h4 style="color: #34d399; margin: 0 0 8px; font-size: 14px; text-transform: uppercase;">Final Handover Action Items</h4>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                  <li>Transfer full admin permissions to GitHub repository</li>
                  <li>Confirm custom domain DNS records and SSL certificates</li>
                  <li>Provide client with production credentials &amp; API keys</li>
                  <li>Archive staging build &amp; log sign-off receipt</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 20px;">
                <a href="https://prateeq.in/admin" style="display: inline-block; background: #10b981; color: #0f172a; padding: 12px 24px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">
                  Open Admin Control Center →
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    adminSent = !adminErr;
  } catch (err) {
    console.warn('sendFinalBalanceSettlementNotifications (admin) error:', err);
  }

  // 2. Client 100% Zero-Balance Clearance & IP Transfer Receipt
  if (params.clientEmail && params.clientEmail.includes('@')) {
    const deliverablesList: string[] = [];
    if (params.productionUrl) {
      const safeUrl = sanitizeUrl(params.productionUrl);
      deliverablesList.push(`<li><strong>Live Website:</strong> <a href="${safeUrl}" style="color: #10b981; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></li>`);
    }
    if (params.githubRepo) {
      const safeUrl = sanitizeUrl(params.githubRepo);
      deliverablesList.push(`<li><strong>Source Code Repository:</strong> <a href="${safeUrl}" style="color: #38bdf8; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></li>`);
    }
    if (params.figmaUrl) {
      const safeUrl = sanitizeUrl(params.figmaUrl);
      deliverablesList.push(`<li><strong>Design System &amp; Figma Specs:</strong> <a href="${safeUrl}" style="color: #a78bfa; text-decoration: underline;" target="_blank" rel="noopener">${safeUrl}</a></li>`);
    }

    try {
      const { error: clientErr } = await client.resend.emails.send({
        from: 'Prateeq Studio <notifications@prateeq.in>',
        to: params.clientEmail,
        subject: `🏆 Project Fully Settled & Handover Complete — ${params.companyName} (${params.scopeCode})`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
              <div style="max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #10b981; border-radius: 12px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
                <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
                  🏆 100% PAID — ZERO-BALANCE CLEARANCE
                </div>
                <h2 style="color: #10b981; margin-top: 0; font-size: 22px;">Project Settled &amp; Handover Complete</h2>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Hi ${nameEscaped}, thank you! Your final balance payment of <strong>${formattedAmount}</strong> has been received and verified. With this settlement, <strong>${companyEscaped}</strong> holds official <strong>Zero-Balance Commercial Clearance</strong> on Scope <strong>#${codeEscaped}</strong>.
                </p>

                <div style="background: #0f172a; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #334155;">
                  <p style="margin: 4px 0;"><strong>Project:</strong> ${companyEscaped}</p>
                  <p style="margin: 4px 0;"><strong>Scope Reference:</strong> ${codeEscaped}</p>
                  <p style="margin: 4px 0;"><strong>Settlement Invoice:</strong> ${invEscaped}</p>
                  <p style="margin: 4px 0;"><strong>Final Amount Settled:</strong> <span style="color: #10b981; font-weight: 700;">${formattedAmount}</span></p>
                  <p style="margin: 4px 0;"><strong>Outstanding Balance:</strong> <span style="color: #10b981; font-weight: 700;">$0.00 / ₹0.00 (Zero Balance)</span></p>
                  <p style="margin: 4px 0;"><strong>Transaction Reference:</strong> <code>${paymentIdEscaped}</code></p>
                </div>

                <div style="background: rgba(16, 185, 129, 0.05); border-left: 3px solid #10b981; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
                  <strong style="color: #34d399; font-size: 13px; text-transform: uppercase;">Commercial Intellectual Property Clearance</strong>
                  <p style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0; line-height: 1.5;">
                    In accordance with our Master Services Agreement, full intellectual property and source code copyright for custom bespoke assets is hereby released to <strong>${companyEscaped}</strong>.
                  </p>
                </div>

                ${deliverablesList.length > 0 ? `
                  <div style="margin: 18px 0;">
                    <p style="color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Handover Deliverables</p>
                    <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                      ${deliverablesList.join('')}
                    </ul>
                  </div>
                ` : ''}

                <div style="background: #0f172a; border-radius: 8px; padding: 14px 16px; margin: 18px 0; border: 1px solid #334155;">
                  <strong style="color: #38bdf8; font-size: 13px;">Maintenance &amp; Ongoing Support</strong>
                  <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0; line-height: 1.5;">
                    Active Plan: <span style="color: #f8fafc; font-weight: 600;">${planEscaped}</span>. You can manage maintenance tickets, change requests, and PDF invoices anytime directly in your workspace.
                  </p>
                </div>

                <div style="text-align: center; margin: 28px 0 10px;">
                  <a href="https://prateeq.in/dashboard" style="display: inline-block; background: #10b981; color: #0f172a; padding: 12px 24px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">
                    Open Client Workspace &amp; Ledger →
                  </a>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      clientSent = !clientErr;
    } catch (err) {
      console.warn('sendFinalBalanceSettlementNotifications (client) error:', err);
    }
  }

  return { adminSent, clientSent };
}

export interface HotLeadAlertParams {
  sessionId: string;
  scopeCode?: string;
  userQuery: string;
  assistantSummary?: string;
  totalINR: number;
  totalUSD: number;
  engine: string;
  featureCount: number;
  featureLabels: string[];
  turnIndex: number;
  visitorCountry?: string;
  userEmail?: string | null;
  isEscrow?: boolean;
  reasoning?: string;
}

/**
 * Sends an instant high-priority executive alert email to Prateek when a hot scoping lead or escrow escalation occurs.
 */
export async function sendHotLeadAlertNotification(params: HotLeadAlertParams): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn('Skipping sendHotLeadAlertNotification: RESEND_API_KEY not configured.');
    return false;
  }

  const queryEscaped = escapeHtml(params.userQuery || 'N/A');
  const engineEscaped = escapeHtml(params.engine.toUpperCase() || 'CUSTOM');
  const countryEscaped = escapeHtml(params.visitorCountry || 'Global / Unknown');
  const scopeCodeEscaped = escapeHtml(params.scopeCode || 'DRAFT');
  const userEmailEscaped = params.userEmail ? escapeHtml(params.userEmail) : 'Anonymous Visitor';
  const featuresEscaped = params.featureLabels
    .map(
      (f) =>
        `<span style="display: inline-block; background: #334155; color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 2px 4px 2px 0;">${escapeHtml(f)}</span>`
    )
    .join('');
  const quoteFormatted = `$${params.totalUSD.toLocaleString()} / ₹${params.totalINR.toLocaleString()}`;

  const subject = params.isEscrow
    ? `🚨 ESCROW ESCALATION: Bespoke/Physical Inquiry (${countryEscaped})`
    : `🔥 HOT SCOPING LEAD: ${quoteFormatted} [${engineEscaped}] (${countryEscaped})`;

  const adminUrl = 'https://prateeq.in/admin';

  try {
    const { error } = await client.resend.emails.send({
      from: 'Prateeq Studio Scoping <notifications@prateeq.in>',
      to: client.recipient,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 18px;">
                <h2 style="color: ${params.isEscrow ? '#f59e0b' : '#38bdf8'}; margin: 0; font-size: 20px;">
                  ${params.isEscrow ? '🚨 Executive Escrow Escalation' : '🔥 High-Value Scoping Prospect'}
                </h2>
                <span style="background: ${params.isEscrow ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)'}; color: ${params.isEscrow ? '#fbbf24' : '#38bdf8'}; border: 1px solid ${params.isEscrow ? '#f59e0b' : '#38bdf8'}; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700;">
                  Turn ${params.turnIndex}
                </span>
              </div>

              <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 18px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #94a3b8; font-size: 13px;">Estimated Investment:</span>
                  <strong style="color: #4ade80; font-size: 15px;">${quoteFormatted}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #94a3b8; font-size: 13px;">Target Engine:</span>
                  <span style="color: #f8fafc; font-size: 13px; font-weight: 600;">${engineEscaped} Core</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #94a3b8; font-size: 13px;">Visitor Origin:</span>
                  <span style="color: #f8fafc; font-size: 13px;">${countryEscaped}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #94a3b8; font-size: 13px;">Prospect Identity:</span>
                  <span style="color: #38bdf8; font-size: 13px;">${userEmailEscaped}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #94a3b8; font-size: 13px;">Scope Code:</span>
                  <code style="color: #cbd5e1; font-size: 12px;">${scopeCodeEscaped}</code>
                </div>
              </div>

              <div style="margin-bottom: 18px;">
                <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">
                  Prospect Inquiry / Need:
                </strong>
                <div style="background: #0f172a; border-left: 3px solid #38bdf8; padding: 12px 14px; border-radius: 4px; font-size: 14px; color: #f1f5f9; line-height: 1.5; font-style: italic;">
                  &ldquo;${queryEscaped}&rdquo;
                </div>
              </div>

              ${
                params.featureLabels.length > 0
                  ? `
                <div style="margin-bottom: 20px;">
                  <strong style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">
                    Included Modules (${params.featureCount}):
                  </strong>
                  <div>${featuresEscaped}</div>
                </div>
              `
                  : ''
              }

              <div style="text-align: center; margin-top: 24px;">
                <a href="${adminUrl}" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 24px; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">
                  Open Admin Command Center →
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.warn('sendHotLeadAlertNotification Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('sendHotLeadAlertNotification network exception:', err);
    return false;
  }
}


