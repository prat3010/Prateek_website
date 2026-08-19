import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

    if (!supabase || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service role key is not configured' }, { status: 500 });
    }

    // 1. Fetch Client Profile & Scopes
    const { data: clientScopes } = await supabase
      .from('client_scopes')
      .select('*')
      .eq('client_email', clientEmail);

    if (!clientScopes || clientScopes.length === 0) {
      return NextResponse.json({
        answer: "You do not have an active project scope yet. You can create a new scope on the Scoping Lab (/scoping) page!",
        citations: []
      });
    }

    const activeScope = clientScopes[0];
    const engineTitle = activeScope.base_engine || 'Web App Engine';
    const featuresList = (activeScope.features || []).join(', ') || 'Core web features';
    const timeline = activeScope.timeline || 'Standard Turnaround';
    const maintenance = activeScope.maintenance_plan || '30-Day Warranty';
    const costINR = activeScope.total_cost_inr ? `₹${activeScope.total_cost_inr.toLocaleString('en-IN')}` : '';
    const costUSD = activeScope.total_cost_usd ? `$${activeScope.total_cost_usd.toLocaleString('en-US')}` : '';

    const queryLower = queryStr.toLowerCase();

    // 2. Synthesize RAG Copilot Response grounded in client scope
    let answer = `Here are the details for your project (${activeScope.company_name || activeScope.scope_code}):\n\n`;

    if (queryLower.includes('feature') || queryLower.includes('module') || queryLower.includes('include')) {
      answer += `• **Base Engine:** ${engineTitle}\n`;
      answer += `• **Included Features:** ${featuresList}\n`;
      answer += `• **Brand Asset Tier:** ${activeScope.brand_asset || 'Standard'}\n`;
    } else if (queryLower.includes('cost') || queryLower.includes('price') || queryLower.includes('payment') || queryLower.includes('invoice')) {
      answer += `• **Total Project Value:** ${costINR} ${costUSD ? `(${costUSD})` : ''}\n`;
      answer += `• **Payment Structure:** ${activeScope.payment_structure || '50/50 Deposit & Completion'}\n`;
      answer += `• **Currency:** ${activeScope.currency || 'INR'}\n`;
    } else if (queryLower.includes('time') || queryLower.includes('schedule') || queryLower.includes('deadline') || queryLower.includes('milestone')) {
      answer += `• **Project Timeline:** ${timeline}\n`;
      answer += `• **Current Status:** Scoped & Confirmed\n`;
    } else if (queryLower.includes('warranty') || queryLower.includes('support') || queryLower.includes('sla') || queryLower.includes('maintenance')) {
      answer += `• **Maintenance Plan:** ${maintenance}\n`;
      answer += `• **Support SLA:** Included per contract specifications.\n`;
    } else {
      answer += `• **Engine:** ${engineTitle}\n`;
      answer += `• **Features:** ${featuresList}\n`;
      answer += `• **Timeline:** ${timeline}\n`;
      answer += `• **Care Plan:** ${maintenance}\n`;
    }

    return NextResponse.json({
      answer: answer.trim(),
      scope_code: activeScope.scope_code,
      company_name: activeScope.company_name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
