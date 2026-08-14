import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function GET(req: Request) {
  try {
    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ members: [] });
    }

    const { searchParams } = new URL(req.url);
    const requestedTenantId = searchParams.get('tenantId');

    let tenantId = requestedTenantId;

    if (!tenantId) {
      const { data: memberRecord } = await supabase
        .from('rag_tenant_members')
        .select('tenant_id')
        .eq('email', callerEmail)
        .maybeSingle();

      if (memberRecord) {
        tenantId = memberRecord.tenant_id;
      }
    }

    if (!tenantId) {
      return NextResponse.json({ members: [] });
    }

    const { data: members, error } = await supabase
      .from('rag_tenant_members')
      .select('id, tenant_id, user_id, email, role, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch team members from Supabase:', error.message);
      return NextResponse.json({ error: 'Failed to retrieve team members.' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (err: unknown) {
    console.error('RAG Members GET API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database instance not initialized.' }, { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const memberId = payload.memberId as string;
    const email = payload.email as string;

    if (!memberId && !email) {
      return NextResponse.json({ error: 'memberId or email is required.' }, { status: 400 });
    }

    let query = supabase.from('rag_tenant_members').delete();
    if (memberId) {
      query = query.eq('id', memberId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { error } = await query;
    if (error) {
      console.error('Failed to remove team member from Supabase:', error.message);
      return NextResponse.json({ error: 'Failed to remove team member.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('RAG Members DELETE API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
