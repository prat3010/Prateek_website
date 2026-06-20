import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-api-key');

  if (!secret || secret !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('portfolio-data', 'max');
  console.log('Revalidated cache tag: portfolio-data');
  return NextResponse.json({ revalidated: true, method: 'POST', now: Date.now() });
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-api-key');

  if (!secret || secret !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('portfolio-data', 'max');
  console.log('Revalidated cache tag: portfolio-data (via GET)');
  return NextResponse.json({ revalidated: true, method: 'GET', now: Date.now() });
}
