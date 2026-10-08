import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import resumeFallback from '@/data/resume.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fallbackPager = (resumeFallback as { pager?: { active: boolean; messages: { id: string; freq?: string; sectionId?: string; sender: string; text: string }[] } }).pager;


    if (!supabase) {
      return NextResponse.json(fallbackPager);
    }

    const { data, error } = await supabase
      .from('profile')
      .select('data')
      .eq('id', 1)
      .single();

    if (error || !data || !data.data?.pager) {
      return NextResponse.json(fallbackPager);
    }

    return NextResponse.json(data.data.pager);
  } catch (err) {
    console.warn('Pager API GET fallback triggered:', err);
    return NextResponse.json({
      active: true,
      messages: [
        {
          id: 'msg_01',
          sender: 'PRATEEQ // ARCHITECT',
          text: 'Welcome to the systems vault. Reviewing capabilities or looking to architect a custom platform?',
        },
      ],
    });
  }
}
