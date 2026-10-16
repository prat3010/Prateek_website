import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Degraded dev/CI mode: no Supabase environment, no persistence to read.
    if (!supabase) {
      return NextResponse.json({ scopes: [] });
    }

    // The client-supplied email is ignored; scopes are scoped to the
    // verified session email from the Bearer access token.
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wantsAll = searchParams.get('all') === 'true' && isAdminEmail(clientEmail);

    try {
      let query = supabase.from('client_scopes').select('*');
      if (!wantsAll) {
        query = query.eq('client_email', clientEmail);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Get client_scopes DB error:', error);
        return NextResponse.json({ scopes: [] });
      }

      const scopesList = Array.isArray(data) ? data : [];

      // Enrich scopes with project_deliverables (and invoices for admin view) when available
      if (scopesList.length > 0) {
        try {
          const scopeIds = scopesList.map((s) => s.id).filter(Boolean);
          const delivSelect = supabase.from('project_deliverables').select('*');
          if (scopeIds.length > 0 && typeof (delivSelect as unknown as { in?: unknown }).in === 'function') {
            const { data: delivRows } = await (
              delivSelect as unknown as {
                in: (col: string, vals: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
              }
            ).in('scope_id', scopeIds);

            if (Array.isArray(delivRows) && delivRows.length > 0) {
              const delivByScopeId = new Map(delivRows.map((d) => [String(d.scope_id), d]));
              for (const s of scopesList) {
                const matchedDeliv = delivByScopeId.get(String(s.id));
                if (matchedDeliv) {
                  (s as Record<string, unknown>).deliverables = matchedDeliv;
                }
              }
            }
          }
        } catch {}
      }

      return NextResponse.json({ scopes: scopesList });
    } catch (dbErr) {
      console.warn('Get scopes DB connection warning (returning empty array fallback):', dbErr);
      return NextResponse.json({ scopes: [] });
    }
  } catch (err: unknown) {
    console.error('Get Scopes API error:', err);
    return NextResponse.json({ scopes: [] });
  }
}