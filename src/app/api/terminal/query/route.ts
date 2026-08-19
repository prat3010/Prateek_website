import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osaqaemntuzrjouzobvx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Supabase service role key is not configured' }, { status: 500 });
    }

    const headers = {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };

    // Fetch document chunks for target tenant
    const res = await fetch(
      `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/document_chunks?tenant_id=eq.${targetTenantId}&select=chunk_id,content,meta_data&limit=500`,
      { headers, next: { revalidate: 60 } }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Supabase query failed: ${errText}` }, { status: 502 });
    }

    const chunks = await res.json();
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const queryWords = queryStr.toLowerCase().split(/\s+/).filter((w: string) => Boolean(w));
    const scoredChunks: Array<{
      chunk_id: string;
      content: string;
      meta_data: Record<string, unknown>;
      score: number;
    }> = [];

    for (const ch of chunks) {
      const content = ch.content || '';
      const contentLower = content.toLowerCase();
      const meta = (ch.meta_data || {}) as Record<string, unknown>;
      const filePath = typeof meta.file_path === 'string' ? meta.file_path.toLowerCase() : '';
      const symbol = typeof meta.symbol_name === 'string' ? meta.symbol_name.toLowerCase() : '';

      let matchCount = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word) || filePath.includes(word) || symbol.includes(word)) {
          matchCount += 1;
        }
      }

      if (matchCount > 0) {
        scoredChunks.push({
          chunk_id: ch.chunk_id,
          content: content,
          meta_data: meta,
          score: matchCount,
        });
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);
    const topResults = scoredChunks.slice(0, 5);

    return NextResponse.json({ results: topResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
