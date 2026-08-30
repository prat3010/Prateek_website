import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function POST(req: NextRequest) {
  try {
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const body = await req.json();
    const queryStr = (body.query || '').trim();
    if (!queryStr) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({
        answer: "Supabase service unavailable. Please check your network connection.",
        citations: [],
      }, { status: 503 });
    }

    // 1. Fetch Client Profile & Scopes
    const { data: clientScopes } = await supabase
      .from('client_scopes')
      .select('*')
      .eq('client_email', clientEmail);

    if (!clientScopes || clientScopes.length === 0) {
      return NextResponse.json({
        answer: "You do not have an active project scope yet. You can create a new scope on the Scoping Lab (/scoping) page!",
        citations: [],
      });
    }

    const activeScope = clientScopes[0];
    const engineTitle = activeScope.base_engine || 'Web App Engine';
    const featuresList = (activeScope.features || []).join(', ') || 'Core web features';
    const timeline = activeScope.timeline || 'Standard Turnaround';
    const maintenance = activeScope.maintenance_plan || '30-Day Warranty';
    const costINR = activeScope.total_cost_inr ? `₹${activeScope.total_cost_inr.toLocaleString('en-IN')}` : '';
    const costUSD = activeScope.total_cost_usd ? `$${activeScope.total_cost_usd.toLocaleString('en-US')}` : '';
    const deliveryStage = activeScope.delivery_stage || (activeScope.deposit_paid ? 'engineering' : 'architecture');
    const sowHash = activeScope.sow_hash || '';

    // 2. Fetch any approved Phase 2 Change Orders
    let changeOrdersText = '';
    const citations: Array<{ id: string; label: string; type: 'sow' | 'milestone' | 'change_order' | 'sla' }> = [];

    if (activeScope.scope_code) {
      citations.push({
        id: `sow-${activeScope.scope_code}`,
        label: sowHash ? `Locked SOW (${activeScope.scope_code})` : `Draft Scope (${activeScope.scope_code})`,
        type: 'sow',
      });

      const { data: coData } = await supabase
        .from('scope_change_orders')
        .select('*')
        .eq('scope_code', activeScope.scope_code)
        .order('created_at', { ascending: true });

      if (coData && coData.length > 0) {
        const approvedCos = coData.filter((co) => co.status === 'approved' || co.status === 'paid');
        if (approvedCos.length > 0) {
          changeOrdersText = approvedCos
            .map(
              (co) =>
                `• **${co.change_order_number}:** +${(co.added_features || []).join(', ')} (${co.delta_inr ? `₹${co.delta_inr.toLocaleString('en-IN')}` : ''} / ${co.delta_usd ? `$${co.delta_usd.toLocaleString('en-US')}` : ''})`
            )
            .join('\n');

          approvedCos.forEach((co) => {
            citations.push({
              id: co.change_order_number,
              label: `Change Order ${co.change_order_number}`,
              type: 'change_order',
            });
          });
        }
      }
    }

    citations.push({
      id: `milestone-${deliveryStage}`,
      label: `Phase Tracker (${deliveryStage.toUpperCase()})`,
      type: 'milestone',
    });

    if (activeScope.maintenance_plan) {
      citations.push({
        id: 'care-sla-plan',
        label: `SLA Plan (${activeScope.maintenance_plan})`,
        type: 'sla',
      });
    }

    const queryLower = queryStr.toLowerCase();

    // 3. Synthesize RAG Copilot Response grounded in client scope & contract
    let answer = `Here are the details for your project (${activeScope.company_name || activeScope.scope_code}):\n\n`;

    if (queryLower.includes('warranty') || queryLower.includes('support') || queryLower.includes('sla') || queryLower.includes('maintenance')) {
      answer += `• **Maintenance Plan:** ${maintenance}\n`;
      answer += `• **Support SLA:** Guaranteed bug fixes, health probe monitoring, and dependency patch updates per contract specification.\n`;
    } else if (queryLower.includes('cost') || queryLower.includes('price') || queryLower.includes('payment') || queryLower.includes('invoice') || queryLower.includes('deposit')) {
      answer += `• **Total Project Value:** ${costINR} ${costUSD ? `(${costUSD})` : ''}\n`;
      answer += `• **Payment Structure:** ${activeScope.payment_structure || '50/50 Deposit & Completion'}\n`;
      answer += `• **Deposit Status:** ${activeScope.deposit_paid ? '✅ 50% Deposit Paid & Confirmed' : '⏳ Pending Upfront Deposit'}\n`;
      answer += `• **Currency:** ${activeScope.currency || 'INR'}\n`;
      if (changeOrdersText) {
        answer += `\n**Approved Change Orders:**\n${changeOrdersText}\n`;
      }
    } else if (queryLower.includes('time') || queryLower.includes('schedule') || queryLower.includes('deadline') || queryLower.includes('milestone') || queryLower.includes('status') || queryLower.includes('phase')) {
      const stageLabel =
        deliveryStage === 'live'
          ? 'Phase 4: Production Launch (Live)'
          : deliveryStage === 'staging'
          ? 'Phase 3: Staging & QA'
          : deliveryStage === 'engineering'
          ? 'Phase 2: Core Engineering'
          : 'Phase 1: Architecture & Specs';

      answer += `• **Current Delivery Stage:** ${stageLabel}\n`;
      answer += `• **Estimated Turnaround Timeline:** ${timeline}\n`;
      answer += `• **SOW Status:** ${activeScope.deposit_paid ? '🔒 Cryptographically Frozen & In Active Sprint' : 'Draft Proposal'}\n`;
    } else if (queryLower.includes('feature') || queryLower.includes('module') || queryLower.includes('include') || queryLower.includes('deliverable')) {
      answer += `• **Base Engine:** ${engineTitle}\n`;
      answer += `• **Included Baseline Features:** ${featuresList}\n`;
      if (changeOrdersText) {
        answer += `\n**Approved Phase 2 Change Orders:**\n${changeOrdersText}\n`;
      }
      answer += `• **Brand Asset Tier:** ${activeScope.brand_asset || 'Standard'}\n`;
      if (activeScope.business_kpi) {
        answer += `• **Business KPI Goal:** ${activeScope.business_kpi}\n`;
      }
    } else {
      answer += `• **Base Engine:** ${engineTitle}\n`;
      answer += `• **Included Features:** ${featuresList}\n`;
      if (changeOrdersText) {
        answer += `\n**Approved Change Orders:**\n${changeOrdersText}\n`;
      }
      answer += `• **Timeline:** ${timeline}\n`;
      answer += `• **Care Plan:** ${maintenance}\n`;
      answer += `• **Current Phase:** ${deliveryStage.toUpperCase()}\n`;
    }

    return NextResponse.json({
      answer: answer.trim(),
      scope_code: activeScope.scope_code,
      company_name: activeScope.company_name,
      delivery_stage: deliveryStage,
      deposit_paid: !!activeScope.deposit_paid,
      citations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
