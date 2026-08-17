import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osaqaemntuzrjouzobvx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secretKey = process.env.SYNC_API_KEY || 'dev-sync-key';
    const isCron = authHeader === `Bearer ${secretKey}`;

    if (!supabase || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // Sample Lead Prospect Generator (Simulated Web Prospector Engine)
    const sampleLeads = [
      {
        lead_name: 'Alex Vance',
        company: 'Vance Legal Tech Agency',
        role: 'Founder & Managing Partner',
        email: 'alex@vancelegal.com',
        source_url: 'https://vancelegal.com',
        pitch: `Hi Alex,\n\nI noticed Vance Legal Tech is scaling document automation for law firms. We recently shipped a multi-tenant hybrid search & RAG platform ("Retriever") built on Next.js 16 and PostgreSQL pgvector.\n\nI built an instant interactive quote spec for your stack: https://prateeq.in/scoping?engine=landing&goal=rag-saas\n\nWould love to show you a 5-min demo!`,
      },
      {
        lead_name: 'Sarah Lin',
        company: 'Apex Commerce Group',
        role: 'Head of Product',
        email: 'sarah@apexcommerce.io',
        source_url: 'https://apexcommerce.io',
        pitch: `Hi Sarah,\n\nI saw Apex Commerce Group is expanding custom headless storefronts. I recently architected a Next.js 16 + Supabase site with instant PDF proposal exports and sub-100ms analytics.\n\nCheck out the instant interactive quote for your shop: https://prateeq.in/scoping?engine=saas\n\nBest,\nPrateek Sharma`,
      },
    ];

    const insertedLeads = [];
    for (const lead of sampleLeads) {
      const { data, error } = await supabase
        .from('outreach_leads')
        .insert({
          lead_name: lead.lead_name,
          company: lead.company,
          role: lead.role,
          email: lead.email,
          source_url: lead.source_url,
          ai_generated_pitch: lead.pitch,
          status: 'pending',
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        insertedLeads.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${insertedLeads.length} new leads in Pending Approvals Queue`,
      leads: insertedLeads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
