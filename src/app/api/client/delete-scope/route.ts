import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let scopeCode = searchParams.get('scopeCode');

    if (!scopeCode) {
      try {
        const body = await req.json();
        scopeCode = body.scopeCode;
      } catch {}
    }

    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing scopeCode parameter' }, { status: 400 });
    }

    // Degraded mode check
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Scope deleted (degraded mode).' });
    }

    // Verify session identity
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    // Look up scope to verify ownership and deposit payment status
    const { data: scope } = await supabase
      .from('client_scopes')
      .select('scope_code, client_email, deposit_paid')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (!scope) {
      return NextResponse.json({ error: 'Scope proposal not found' }, { status: 404 });
    }

    if (scope.client_email && scope.client_email !== clientEmail) {
      return NextResponse.json({ error: 'Forbidden: scope belongs to another account' }, { status: 403 });
    }

    if (scope.deposit_paid) {
      return NextResponse.json(
        { error: 'Forbidden: Paid scopes in active engineering cannot be deleted.' },
        { status: 400 }
      );
    }

    // Perform deletion from normalized client_scopes table
    try {
      await supabase.from('client_scopes').delete().eq('scope_code', scopeCode);
    } catch (err) {
      console.warn('Delete client_scopes warning:', err);
    }

    try {
      await supabase.from('intake_leads').delete().eq('scope_code', scopeCode);
    } catch (err) {
      console.warn('Delete intake_leads warning:', err);
    }

    const response = NextResponse.json({
      success: true,
      message: `Scope proposal ${scopeCode} deleted successfully.`,
    });

    response.cookies.set('prateeq_pending_scope_code', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('Delete Scope API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
