import { NextResponse, userAgent } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { supabase } from '@/data/supabase';
import { getIpHash, HONEYPOT_PATTERNS } from '@/lib/security';

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Extract theme and audience cookies
  const themeCookie = request.cookies.get('theme')?.value || 'light';
  const audienceCookie = request.cookies.get('audience')?.value || null;
  let regionCookie = request.cookies.get('region')?.value || null;

  // Retrieve country header (populated automatically by Vercel in production)
  const country = request.headers.get('x-vercel-ip-country') || 'Local/Unknown';
  if (!regionCookie) {
    regionCookie = country === 'IN' ? 'india' : 'global';
  }
  
  // Parse User Agent via Next.js helper
  const { device, browser, os, isBot } = userAgent(request);

  // Set request headers for layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-theme', themeCookie);
  requestHeaders.set('x-region', regionCookie);
  if (isBot) {
    requestHeaders.set('x-audience', 'developer');
  } else if (audienceCookie) {
    requestHeaders.set('x-audience', audienceCookie);
  }

  const nextResponse = () => {
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
    if (request.cookies.get('region')?.value !== regionCookie) {
      res.cookies.set('region', regionCookie || 'global', { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }
    return res;
  };

  // If Supabase is not configured yet, silently pass
  if (!supabase) {
    return nextResponse();
  }

  const { pathname } = request.nextUrl;
  
  // Skip tracking for the admin dashboard itself to avoid padding your own view stats during debugging
  if (pathname.startsWith('/admin')) {
    return nextResponse();
  }

  // Bypass database writes for vulnerability scans / honeypot URLs
  const isHoneypot = HONEYPOT_PATTERNS.some(pattern => pattern.test(pathname));
  if (isHoneypot) {
    return nextResponse();
  }

  // Retrieve IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  // Get geolocation headers (populated automatically by Vercel in production)
  // (using outer country variable)

  // Get Referrer & Sanitize to Domain to protect privacy and prevent spam
  let referrer = request.headers.get('referer') || '';
  if (referrer) {
    try {
      const refUrl = new URL(referrer);
      referrer = refUrl.hostname;
    } catch {
      // Fallback: truncate to maximum 100 characters to prevent spam payloads
      referrer = referrer.slice(0, 100);
    }
  }

  // Bypass database writes for search engine crawlers and automated bots
  if (isBot) {
    return nextResponse();
  }

  // Run the logging asynchronously using event.waitUntil
  // This sends the data in the background and does NOT add to the page load latency.
  event.waitUntil(
    (async () => {
      try {
        const ipHash = await getIpHash(ip);
        
        await supabase.from('page_visits').insert({
          path: pathname || '/',
          country,
          region: null,
          city: null,
          browser: browser.name || 'Unknown',
          os: os.name || 'Unknown',
          device: device.type || 'desktop', // fallback to desktop if type is undefined
          referrer,
          ip_hash: ipHash,
          is_bot: isBot || false,
        });
      } catch (error) {
        console.error('Error logging page visit to Supabase:', error);
      }
    })()
  );

  return nextResponse();
}

// Next.js middleware configuration matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, etc. (standard assets)
     * - robots.txt, sitemap.xml, etc.
     * - images (static theme assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)',
  ],
};
