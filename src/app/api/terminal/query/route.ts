import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RETRIEVER_API_URL = (process.env.RETRIEVER_API_URL || '').replace(/\/$/, '');
const RETRIEVER_PORTFOLIO_TENANT_ID = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '';
const RETRIEVER_PORTFOLIO_API_KEY = process.env.RETRIEVER_PORTFOLIO_API_KEY || '';
const PUBLIC_DEMO_TENANT_ID = 'demo_public_docs';
const SYSTEM_TENANT_ID = 'system_master';

export async function POST(req: NextRequest) {
  try {
    const userEmail = await getVerifiedSessionEmail(req);
    const isAdmin = userEmail ? isAdminEmail(userEmail) : false;
    const targetTenantId = isAdmin ? SYSTEM_TENANT_ID : PUBLIC_DEMO_TENANT_ID;

    const body = await req.json();
    const queryStr = (body.query || '').trim();

    if (!queryStr) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // 1. Primary: Query Retriever hybrid search when portfolio credentials are configured
    if (RETRIEVER_API_URL && RETRIEVER_PORTFOLIO_TENANT_ID && RETRIEVER_PORTFOLIO_API_KEY) {
      try {
        const searchRes = await fetch(
          `${RETRIEVER_API_URL}/v1/tenants/${encodeURIComponent(RETRIEVER_PORTFOLIO_TENANT_ID)}/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': RETRIEVER_PORTFOLIO_API_KEY,
            },
            body: JSON.stringify({ query: queryStr, top_k: 5 }),
            signal: AbortSignal.timeout(8000),
          }
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          const results = Array.isArray(data.results)
            ? data.results.map((r: Record<string, unknown>) => ({
                chunk_id: r.chunk_id,
                content: r.content,
                meta_data: (r.metadata || {}) as Record<string, unknown>,
                score: r.score,
              }))
            : [];
          return NextResponse.json({ results, source: 'retriever' });
        }
      } catch {
        // Fall through to Postgres full-text search fallback
      }
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service role key is not configured' }, { status: 500 });
    }

    // 2. Fallback: Server-side Postgres websearch full-text query (no 500-row JS scanning)
    const headers = {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };

    const url = new URL(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/document_chunks`);
    url.searchParams.set('tenant_id', `eq.${targetTenantId}`);
    url.searchParams.set('select', 'chunk_id,content,meta_data');
    url.searchParams.set('content', `wfts(english).${queryStr}`);
    url.searchParams.set('limit', '5');

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Supabase query failed: ${errText}` }, { status: 502 });
    }

    const chunks = await res.json();
    const results = Array.isArray(chunks)
      ? chunks.map((ch: Record<string, unknown>) => ({
          chunk_id: ch.chunk_id,
          content: ch.content || '',
          meta_data: (ch.meta_data || {}) as Record<string, unknown>,
          score: 1,
        }))
      : [];

    return NextResponse.json({ results, source: 'postgres_fts' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
