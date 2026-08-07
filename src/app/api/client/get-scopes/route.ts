import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email query parameter' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ scopes: [] });
    }

    const { data, error } = await supabase
      .from('client_orders')
      .select('*')
      .eq('client_email', email)
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
