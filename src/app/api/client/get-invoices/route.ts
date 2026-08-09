import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ invoices: [] });
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    try {
      // Fetch client record ID for double mapping
      let clientId: string | null = null;
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('email', clientEmail)
          .maybeSingle();
        if (client) clientId = client.id;
      } catch (clientErr) {
        console.warn('Client lookup error in get-invoices:', clientErr);
      }

      let query = supabase.from('invoices').select('*');
      
      if (clientId) {
        query = query.or(`customer_email.eq.${clientEmail},client_id.eq.${clientId}`);
      } else {
        query = query.eq('customer_email', clientEmail);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Get invoices query error:', error);
        return NextResponse.json({ invoices: [] });
      }

      return NextResponse.json({ invoices: data || [] });
    } catch (dbErr) {
      console.warn('Get invoices DB connection warning:', dbErr);
      return NextResponse.json({ invoices: [] });
    }
  } catch (err: unknown) {
    console.error('Get Invoices API error:', err);
    return NextResponse.json({ invoices: [] });
  }
}
