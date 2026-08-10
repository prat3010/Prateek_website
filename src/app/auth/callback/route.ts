import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const nextParam = requestUrl.searchParams.get('next') || '/dashboard';
  const targetPath = nextParam.startsWith('/') ? nextParam : '/dashboard';

  let origin = requestUrl.origin;
  if (origin.includes('www.prateeq.in')) {
    origin = origin.replace('www.prateeq.in', 'prateeq.in');
  }

  if (error || errorDescription) {
    console.error('Supabase Auth Callback Error:', error, errorDescription);
    const errMessage = encodeURIComponent(errorDescription || error || 'OAuth authentication failed.');
    return NextResponse.redirect(`${origin}/dashboard?error=${errMessage}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeErr && data.session) {
        const response = NextResponse.redirect(`${origin}${targetPath}`);

        if (data.session.user) {
          response.cookies.set('prateeq_active_user', JSON.stringify(data.session.user), {
            path: '/',
            maxAge: 2592000,
            sameSite: 'lax',
            secure: origin.startsWith('https:'),
          });
        }

        return response;
      } else if (exchangeErr) {
        console.warn('OAuth code exchange warning in callback:', exchangeErr.message);
      }
    } catch (err) {
      console.error('OAuth callback handler exception:', err);
    }
  }

  return NextResponse.redirect(`${origin}${targetPath}`);
}
