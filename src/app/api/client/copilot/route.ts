import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { copilotQuerySchema } from '@/lib/clientOrder';
import { RetrieverClient } from '@/lib/rag-client';

export async function POST(req: NextRequest) {
  try {
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = copilotQuerySchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.message, issues: parseResult.error.issues }, { status: 400 });
    }

    const { query } = parseResult.data;

    if (!supabase) {
      return NextResponse.json({
        answer: 'Supabase service unavailable. Please check your network connection.',
        citations: [],
      }, { status: 503 });
    }

    // 1. Fetch Client Profile & Active Scope
    const { data: clientScopes } = await supabase
      .from('client_scopes')
      .select('*')
      .eq('client_email', clientEmail)
      .order('created_at', { ascending: false });

    if (!clientScopes || clientScopes.length === 0) {
      return NextResponse.json({
        answer: 'You do not have an active project scope yet. You can configure and save a new scope in the Scoping Lab (/scoping)!',
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

    // 2. Build Structured Grounding Citations
    const citations: Array<{ id: string; label: string; type: 'sow' | 'milestone' | 'change_order' | 'sla' }> = [];

    let changeOrdersList: Array<{ change_order_number: string; added_features?: string[]; status?: string }> = [];

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
        changeOrdersList = coData;
        const approvedCos = coData.filter((co) => co.status === 'approved' || co.status === 'paid');
        approvedCos.forEach((co) => {
          citations.push({
            id: co.change_order_number,
            label: `Change Order ${co.change_order_number}`,
            type: 'change_order',
          });
        });
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

    // 3. Attempt Live RAG Retrieval from Dedicated Retriever Tenant
    let answerText = '';
    const tenantId = activeScope.retriever_tenant_id || process.env.RETRIEVER_SCOPING_TENANT_ID;
    const apiKey = process.env.RETRIEVER_SCOPING_API_KEY || process.env.RETRIEVER_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in';

    if (tenantId && apiKey) {
      try {
        const client = new RetrieverClient({
          apiUrl,
          tenantId,
          apiKey,
          userId: '00000000-0000-0000-0000-000000000000',
        });

        const searchRes = await client.search(query, { limit: 3, enableHybrid: true });
        if (searchRes && searchRes.results && searchRes.results.length > 0) {
          const topResult = searchRes.results[0];
          answerText = `${topResult.content.slice(0, 450)}...\n\n*(Grounded in ${activeScope.company_name || activeScope.scope_code} knowledge vault)*`;
        }
      } catch (ragErr) {
        console.warn('Retriever live search fallback:', ragErr);
      }
    }

    // 4. Grounded Synthesis Fallback if tenant indexing is pending
    if (!answerText) {
      const stageLabel =
        deliveryStage === 'live'
          ? 'Phase 4: Production Launch (Live)'
          : deliveryStage === 'staging'
          ? 'Phase 3: Staging & QA'
          : deliveryStage === 'engineering'
          ? 'Phase 2: Core Engineering'
          : 'Phase 1: Architecture & Specs';

      const changeOrderSummary =
        changeOrdersList.length > 0
          ? changeOrdersList
              .filter((co) => co.status === 'approved' || co.status === 'paid')
              .map(
                (co) =>
                  `• **Change Order ${co.change_order_number}:** ${(co.added_features || []).join(', ')}`
              )
              .join('\n')
          : '';

      answerText = [
        `**Project Scope Overview (${activeScope.company_name || activeScope.scope_code})**`,
        `• **Architecture Engine:** ${engineTitle}`,
        `• **Features:** ${featuresList}`,
        `• **Timeline:** ${timeline} (${stageLabel})`,
        `• **Commercial Investment:** ${costINR} ${costUSD ? `(${costUSD})` : ''} • Terms: 50/50 Deposit & Completion • Deposit: ${activeScope.deposit_paid ? '✅ Confirmed (50%)' : '⏳ Pending'}`,
        `• **Warranty & Maintenance:** ${maintenance}`,
        changeOrderSummary,
        sowHash ? `• **SOW Cryptographic Baseline:** \`${sowHash.slice(0, 16)}...\` (Locked)` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    return NextResponse.json({
      answer: answerText.trim(),
      scope_code: activeScope.scope_code,
      company_name: activeScope.company_name,
      delivery_stage: deliveryStage,
      deposit_paid: Boolean(activeScope.deposit_paid),
      citations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
