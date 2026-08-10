import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/auth';

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
      const { data, error: exchangeErr } = await supabaseAuth.auth.exchangeCodeForSession(code);
      if (!exchangeErr && data.session) {
        const response = NextResponse.redirect(`${origin}${targetPath}`);

        const maxAge = 2592000; // 30 days
        const isSecure = origin.startsWith('https:');

        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge,
          sameSite: 'lax',
          secure: isSecure,
        });

        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            maxAge,
            sameSite: 'lax',
            secure: isSecure,
          });
        }

        if (data.session.user) {
          response.cookies.set('prateeq_active_user', JSON.stringify(data.session.user), {
            path: '/',
            maxAge,
            sameSite: 'lax',
            secure: isSecure,
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
