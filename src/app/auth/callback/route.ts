import { NextResponse } from 'next/server';
import type { EmailOtpType, Session, User, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { sendAdminSignupNotification } from '@/lib/emailNotification';
import { isAdminEmail } from '@/lib/auth';
import { stitchAnonymousSession } from '@/lib/scopingObservability';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type') as EmailOtpType | null;
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
    const destinationPath = targetPath.startsWith('/') ? targetPath.split('?')[0] : '/dashboard';
    return NextResponse.redirect(`${origin}${destinationPath}?error=${errMessage}`);
  }

  if (code || (tokenHash && otpType)) {
    try {
      const supabase = await createClient();
      let data: { session: Session | null; user: User | null } | null = null;
      let exchangeErr: AuthError | null = null;

      if (code) {
        const res = await supabase.auth.exchangeCodeForSession(code);
        data = res.data;
        exchangeErr = res.error;
      } else if (tokenHash && otpType) {
        const res = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
        data = res.data;
        exchangeErr = res.error;
      }

      if (!exchangeErr && data?.session) {
        const user = data.session.user;
        let redirectPath = targetPath;
        if (user && isAdminEmail(user.email) && targetPath === '/dashboard') {
          redirectPath = '/admin';
        }
        const response = NextResponse.redirect(`${origin}${redirectPath}`);

        if (user) {
          response.cookies.set('prateeq_active_user', JSON.stringify(user), {
            path: '/',
            maxAge: 2592000,
            sameSite: 'lax',
            secure: origin.startsWith('https:'),
          });

          // Trigger admin email alert asynchronously (does not block redirect)
          sendAdminSignupNotification({
            email: user.email || 'unknown@client.com',
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || 'Client',
            provider: user.app_metadata?.provider || (otpType ? 'Magic Link' : 'Google OAuth'),
            signedUpAt: user.created_at,
          }).catch(err => console.warn('Failed to send admin signup notification:', err));

          // Session Stitching: Link any anonymous scoping traces to verified user
          const cookieHeader = request.headers.get('cookie') || '';
          const rawScopeCode = cookieHeader
            .split(';')
            .find(c => c.trim().startsWith('prateeq_pending_scope_code='))
            ?.split('=')[1]?.trim();
          const pendingScopeCode = rawScopeCode ? decodeURIComponent(rawScopeCode) : '';

          const rawDraftToken = cookieHeader
            .split(';')
            .find(c => c.trim().startsWith('prateeq_draft_token='))
            ?.split('=')[1]?.trim();
          const pendingDraftToken = rawDraftToken ? decodeURIComponent(rawDraftToken) : '';

          const rawChatSessionId = cookieHeader
            .split(';')
            .find(c => c.trim().startsWith('prateeq_chat_session_id='))
            ?.split('=')[1]?.trim();
          const chatSessionId = rawChatSessionId ? decodeURIComponent(rawChatSessionId) : '';

          const effectiveSessionId = chatSessionId || pendingDraftToken || '';

          Promise.resolve(
            stitchAnonymousSession(
              effectiveSessionId,
              user.email || '',
              pendingScopeCode,
              pendingDraftToken
            )
          ).catch(err => console.warn('Session stitching warning in auth callback:', err));
        }

        return response;
      } else if (exchangeErr) {
        console.warn('OAuth code/OTP exchange warning in callback:', exchangeErr.message);
        const destinationPath = targetPath.startsWith('/') ? targetPath.split('?')[0] : '/dashboard';
        return NextResponse.redirect(`${origin}${destinationPath}?error=${encodeURIComponent(exchangeErr.message)}`);
      }
    } catch (err) {
      console.error('OAuth callback handler exception:', err);
    }
  }

  return NextResponse.redirect(`${origin}${targetPath}`);
}

