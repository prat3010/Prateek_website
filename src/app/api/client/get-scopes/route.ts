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

      // Enrich scopes with project_deliverables, change_orders, and invoices in a single pass
      if (scopesList.length > 0) {
        try {
          const scopeIds = scopesList.map((s) => s.id).filter(Boolean);
          if (scopeIds.length > 0) {
            // 1. Deliverables
            const delivSelect = supabase.from('project_deliverables').select('*');
            if (typeof (delivSelect as unknown as { in?: unknown }).in === 'function') {
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

            // 2. Change Orders
            const coSelect = supabase.from('scope_change_orders').select('*');
            if (typeof (coSelect as unknown as { in?: unknown }).in === 'function') {
              const { data: coRows } = await (
                coSelect as unknown as {
                  in: (col: string, vals: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
                }
              ).in('scope_id', scopeIds);

              if (Array.isArray(coRows)) {
                const coByScopeId = new Map<string, Array<Record<string, unknown>>>();
                for (const co of coRows) {
                  const sid = String(co.scope_id);
                  if (!coByScopeId.has(sid)) coByScopeId.set(sid, []);
                  coByScopeId.get(sid)!.push(co);
                }
                for (const s of scopesList) {
                  (s as Record<string, unknown>).change_orders = coByScopeId.get(String(s.id)) || [];
                }
              }
            }

            // 3. Invoices
            const invSelect = supabase.from('invoices').select('*');
            if (typeof (invSelect as unknown as { in?: unknown }).in === 'function') {
              const { data: invRows } = await (
                invSelect as unknown as {
                  in: (col: string, vals: string[]) => Promise<{ data: Array<Record<string, unknown>> | null }>;
                }
              ).in('scope_id', scopeIds);

              if (Array.isArray(invRows)) {
                const invByScopeId = new Map<string, Array<Record<string, unknown>>>();
                for (const inv of invRows) {
                  const sid = String(inv.scope_id);
                  if (!invByScopeId.has(sid)) invByScopeId.set(sid, []);
                  invByScopeId.get(sid)!.push(inv);
                }
                for (const s of scopesList) {
                  (s as Record<string, unknown>).invoices = invByScopeId.get(String(s.id)) || [];
                }
              }
            }
          }
        } catch (enrichErr) {
          console.warn('Scope enrichment warning:', enrichErr);
        }
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