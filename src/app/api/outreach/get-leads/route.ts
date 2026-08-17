import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ leads: [] });
    }

    const { data: leads, error } = await supabase
      .from('outreach_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
