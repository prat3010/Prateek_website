import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabase } from '@/data/supabase';
import { timingSafeCompare } from '@/lib/security';

export const dynamic = 'force-dynamic';

function getConfirmationHtml(postTitle: string, targetSlug: string, slug: string, secret: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Publication</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; font-size: 1.5rem; margin-bottom: 12px; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        code { background: #1f2937; padding: 2px 6px; border-radius: 4px; color: #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>📝 Confirm Blog Publication</h1>
        <p>You are about to publish <strong>"${postTitle}"</strong> to <code>/blog/${targetSlug}</code>.<br><br>Click below to confirm publication.</p>
        <form method="POST" action="/api/blog/publish">
          <input type="hidden" name="secret" value="${secret}" />
          <input type="hidden" name="slug" value="${slug}" />
          <button type="submit" class="btn">🚀 Confirm & Publish Live</button>
        </form>
      </div>
    </body>
    </html>
  `;
}

function getSuccessHtml(postTitle: string, targetSlug: string): string {
  return `
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
        <p><strong>"${postTitle}"</strong> has been successfully published to <code>prateeq.in/blog</code> and Next.js cache has been revalidated.</p>
        <a href="/blog/${targetSlug}" class="btn">View Live Blog Post →</a>
      </div>
    </body>
    </html>
  `;
}

async function findPost(slug: string) {
  if (!supabase) return { post: null, error: 'Database service unavailable' };

  const initialFetch = await supabase
    .from('posts')
    .select('id, slug, title, status')
    .eq('slug', slug)
    .maybeSingle();

  let existingPost = initialFetch.data;
  const fetchError = initialFetch.error;

  if (!existingPost && !slug.startsWith('draft-')) {
    const draftSlug = `draft-${slug}`;
    const { data: draftPost } = await supabase
      .from('posts')
      .select('id, slug, title, status')
      .eq('slug', draftSlug)
      .maybeSingle();
    if (draftPost) {
      existingPost = draftPost;
    }
  }

  return { post: existingPost, error: fetchError ? fetchError.message : null };
}

/**
 * Safe, idempotent GET handler:
 * Does NOT mutate state. If the post is already published, redirects/shows link.
 * If draft, shows a confirmation page requiring explicit user action (POST).
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-api-key') || '';
  const slug = request.nextUrl.searchParams.get('slug');

  if (!timingSafeCompare(secret, process.env.SYNC_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Missing required query parameter: slug' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { post, error } = await findPost(slug);
  if (error || !post) {
    return NextResponse.json({ error: `Blog post with slug '${slug}' not found` }, { status: 404 });
  }

  const targetSlug = post.slug.replace(/^draft-/, '');
  const targetTitle = post.title.replace(/^\[DRAFT\]\s*/i, '');

  if (post.status === 'published') {
    return new NextResponse(getSuccessHtml(targetTitle, targetSlug), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(getConfirmationHtml(targetTitle, targetSlug, slug, secret), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * State-mutating POST handler:
 * Authenticates request, updates post status to 'published', flushes ISR cache, and returns result.
 */
export async function POST(request: NextRequest) {
  let secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-api-key') || '';
  let slug = request.nextUrl.searchParams.get('slug');

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      if (!secret && formData.has('secret')) secret = String(formData.get('secret'));
      if (!slug && formData.has('slug')) slug = String(formData.get('slug'));
    } catch {
      // ignore
    }
  } else if (contentType.includes('application/json')) {
    try {
      const json = await request.json();
      if (!secret && json.secret) secret = String(json.secret);
      if (!slug && json.slug) slug = String(json.slug);
    } catch {
      // ignore
    }
  }

  if (!timingSafeCompare(secret, process.env.SYNC_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Missing required parameter: slug' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { post, error: findError } = await findPost(slug);
  if (findError || !post) {
    return NextResponse.json({ error: `Blog post with slug '${slug}' not found` }, { status: 404 });
  }

  const targetSlug = post.slug.replace(/^draft-/, '');
  const targetTitle = post.title.replace(/^\[DRAFT\]\s*/i, '');
  const nowIso = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from('posts')
    .update({
      slug: targetSlug,
      title: targetTitle,
      status: 'published',
      published_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', post.id)
    .select('slug, title')
    .single();

  if (updateError) {
    console.error('Failed to publish blog draft:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidateTag('portfolio-data', 'max');

  if (request.headers.get('accept')?.includes('text/html') || contentType.includes('form')) {
    return new NextResponse(getSuccessHtml(data?.title || targetTitle, data?.slug || targetSlug), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return NextResponse.json({
    success: true,
    published: true,
    title: data?.title || targetTitle,
    slug: data?.slug || targetSlug,
  });
}
