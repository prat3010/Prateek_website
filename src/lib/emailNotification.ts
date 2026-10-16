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


