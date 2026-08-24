import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/data/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(null);
    }
    const { data, error } = await supabase
      .from('profile')
      .select('data')
      .eq('id', 1)
      .single();
    if (error || !data) {
      return NextResponse.json(null);
    }
    return NextResponse.json(data.data);
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    const body = await request.json();
    const { data, error } = await supabase
      .from('profile')
      .upsert(
        { id: 1, data: body, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select('data')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidateTag('portfolio-data', 'max');
    revalidateTag('profile', 'max');
    return NextResponse.json(data.data);
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Invalid JSON payload or database error' }, { status: 400 });
  }
}
