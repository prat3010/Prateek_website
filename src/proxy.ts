import { NextResponse, userAgent } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { supabase } from '@/data/supabase';

// Helper to hash IP addresses with a daily rotating salt (GDPR compliant unique visitor tracking)
async function getIpHash(ip: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // Daily rotating salt
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '-' + today);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Blocklist of common bot exploit patterns to skip database logging
const HONEYPOT_PATTERNS = [
  /\.php$/,
  /wp-admin/i,
  /xmlrpc/i,
  /\.env/,
  /actuator/i,
  /setup/i,
  /config/i,
  /\.well-known/i
];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // If Supabase is not configured yet, silently pass
  if (!supabase) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  
  // Skip tracking for the admin dashboard itself to avoid padding your own view stats during debugging
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Bypass database writes for vulnerability scans / honeypot URLs
  const isHoneypot = HONEYPOT_PATTERNS.some(pattern => pattern.test(pathname));
  if (isHoneypot) {
    return NextResponse.next();
  }

  // Retrieve IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

  // Get geolocation headers (populated automatically by Vercel in production)
  const country = request.headers.get('x-vercel-ip-country') || 'Local/Unknown';
  const rawRegion = request.headers.get('x-vercel-ip-country-region') || '';
  const rawCity = request.headers.get('x-vercel-ip-city') || '';

  // Vercel sends geolocation headers URL-encoded (e.g., "Amb%C4%81la" for "Ambāla")
  let region = rawRegion;
  let city = rawCity;
  try {
    if (rawRegion) region = decodeURIComponent(rawRegion);
    if (rawCity) city = decodeURIComponent(rawCity);
  } catch (e) {
    console.error('Failed to decode geolocation headers:', e);
  }

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

  // Parse User Agent via Next.js helper
  const { device, browser, os, isBot } = userAgent(request);

  // Bypass database writes for search engine crawlers and automated bots
  if (isBot) {
    return NextResponse.next();
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
          region,
          city,
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

  return NextResponse.next();
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
