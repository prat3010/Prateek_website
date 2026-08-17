import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/data/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-api-key');
  const slug = request.nextUrl.searchParams.get('slug');

  if (!secret || secret !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Missing required query parameter: slug' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  // Update post status to published
  const { data, error } = await supabase
    .from('posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)
    .select('slug, title')
    .maybeSingle();

  if (error) {
    console.error('Failed to publish blog draft:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Purge Next.js cache
  revalidateTag('portfolio-data', 'max');

  // Return user-friendly HTML confirmation and redirect
  const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog Post Published Live!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 12px; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚀 Post Published Live!</h1>
        <p><strong>"${data?.title || slug}"</strong> has been successfully published to <code>prateeq.in/blog</code> and Next.js cache has been revalidated.</p>
        <a href="/blog/${slug}" class="btn">View Live Blog Post →</a>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlResponse, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
