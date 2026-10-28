import { NextRequest, NextResponse } from 'next/server';
import { RetrieverClient } from '@/lib/rag-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const cookieSessionId = req.cookies.get('prateeq_chat_session_id')?.value;
    if (cookieSessionId && !cookieSessionId.startsWith('scoping_fallback_')) {
      return NextResponse.json({ sessionId: cookieSessionId, isExisting: true });
    }

    const tenantId =
      process.env.RETRIEVER_SCOPING_TENANT_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID ||
      '';
    const apiKey =
      process.env.RETRIEVER_SCOPING_API_KEY ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY ||
      '';
    const apiUrl = (
      process.env.RETRIEVER_API_URL ||
      process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
      'https://rag.prateeq.in'
    ).replace(/\/$/, '');
    const userId =
      process.env.RETRIEVER_SCOPING_USER_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID ||
      '36e62429-419e-48ef-af92-533afca9e028';

    if (!tenantId || !apiKey) {
      return NextResponse.json({ sessionId: null, error: 'Retriever credentials missing' });
    }

    const client = new RetrieverClient({
      apiUrl,
      tenantId,
      apiKey,
      userId,
    });

    const sessionRes = await Promise.race([
      client.createSession(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Session creation timeout')), 10000)
      ),
    ]);

    if (!sessionRes?.sessionId) {
      return NextResponse.json({ sessionId: null, error: 'Session creation returned empty' });
    }

    const res = NextResponse.json({ sessionId: sessionRes.sessionId, isExisting: false });
    res.headers.set(
      'Set-Cookie',
      `prateeq_chat_session_id=${encodeURIComponent(sessionRes.sessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`
    );
    return res;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Scoping session pre-warm warning:', errorMsg);
    return NextResponse.json({ sessionId: null, error: errorMsg }, { status: 200 });
  }
}
