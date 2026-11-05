import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { timingSafeCompare } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handleLifecycleChecks(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.SYNC_API_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured; lifecycle cron is disabled.' },
      { status: 503 }
    );
  }

  const authorization = req.headers.get('authorization') || '';
  const bearer = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const provided = bearer || req.nextUrl.searchParams.get('secret') || '';

  if (!timingSafeCompare(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ ok: true, message: 'Degraded dev mode: no Supabase client.' });
  }

  const report: {
    expiringTrials: Array<{ tenantId: string; name: string; daysRemaining: number }>;
    expiredTrials: Array<{ tenantId: string; name: string }>;
    overdueInvoices: Array<{ invoiceNumber: string; amount: number; daysPastDue: number }>;
  } = {
    expiringTrials: [],
    expiredTrials: [],
    overdueInvoices: [],
  };

  try {
    // 1. Audit RAG SaaS Trials
    const { data: tenants } = await supabase
      .from('rag_tenants')
      .select('tenant_id, name, plan_tier, is_active, created_at')
      .eq('is_active', true);

    const { data: subs } = await supabase
      .from('rag_subscriptions')
      .select('tenant_id, plan_tier, is_active, razorpay_subscription_id');

    const paidTenantIds = new Set(
      (subs || [])
        .filter((s) => s.is_active && Boolean(s.razorpay_subscription_id))
        .map((s) => s.tenant_id)
    );

    const now = Date.now();
    for (const t of tenants || []) {
      if (paidTenantIds.has(t.tenant_id)) continue;
      if (t.plan_tier !== 'starter' && t.plan_tier !== 'free') continue;

      const createdMs = t.created_at ? new Date(t.created_at).getTime() : now;
      const elapsedDays = Math.floor((now - createdMs) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 7 - elapsedDays);

      if (remaining === 0) {
        report.expiredTrials.push({ tenantId: t.tenant_id, name: t.name });
      } else if (remaining <= 2) {
        report.expiringTrials.push({ tenantId: t.tenant_id, name: t.name, daysRemaining: remaining });
      }
    }

    // 2. Audit Overdue Invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, currency, payment_status, created_at')
      .in('payment_status', ['issued', 'pending']);

    for (const inv of invoices || []) {
      const createdMs = inv.created_at ? new Date(inv.created_at).getTime() : now;
      const ageDays = Math.floor((now - createdMs) / (1000 * 60 * 60 * 24));
      if (ageDays >= 7) {
        report.overdueInvoices.push({
          invoiceNumber: inv.invoice_number,
          amount: Number(inv.amount) || 0,
          daysPastDue: ageDays - 7,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      summary: {
        expiringTrialsCount: report.expiringTrials.length,
        expiredTrialsCount: report.expiredTrials.length,
        overdueInvoicesCount: report.overdueInvoices.length,
      },
      report,
    });
  } catch (err: unknown) {
    console.error('Lifecycle checks cron error:', err);
    const msg = err instanceof Error ? err.message : 'Lifecycle checks failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleLifecycleChecks(req);
}

export async function POST(req: NextRequest) {
  return handleLifecycleChecks(req);
}
