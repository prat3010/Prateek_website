import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/data/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabase) {
    return NextResponse.json([]);
  }
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const body = await request.json();
  const { data, error } = await supabase.from('skills').insert(body).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag('portfolio-data', 'max');
  revalidateTag('skills', 'max');
  return NextResponse.json(data, { status: 201 });
}
