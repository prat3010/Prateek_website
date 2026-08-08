import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

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

    const { data, error } = await supabase
      .from('client_orders')
      .select('*')
      .eq('client_email', clientEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Get scopes DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scopes: data || [] });
  } catch (err: unknown) {
    console.error('Get Scopes API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}