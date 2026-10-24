import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ leads: [] });
    }

    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    if (!isAdminEmail(callerEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const { data: leads, error } = await supabase
      .from('intake_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin fetch intake_leads error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });
  } catch (err) {
    console.error('Unhandled admin intake leads error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
