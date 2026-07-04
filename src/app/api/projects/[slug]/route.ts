import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/data/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!supabase) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const { slug } = await params;
  const body = await request.json();
  const { data, error } = await supabase
    .from('projects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag('portfolio-data', 'max');
  revalidateTag('projects', 'max');
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const { slug } = await params;
  const { error } = await supabase.from('projects').delete().eq('slug', slug);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidateTag('portfolio-data', 'max');
  revalidateTag('projects', 'max');
  return NextResponse.json({ success: true });
}
