import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';
import { getIpHash } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PUBLIC_TENANT_ALIAS = 'guest';
const MAX_BODY_BYTES = 16 * 1024;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

type GuestOperation =
  | { kind: 'search'; path: string }
  | { kind: 'chat'; path: string }
  | { kind: 'session-create'; path: string }
  | { kind: 'session-message'; path: string };

function resolveOperation(segments: string[], guestTenantId: string): GuestOperation | null {
  let path = [...segments];

  if (path[0] === 'v1' && path[1] === 'tenants' && path[2]) {
    const tenant = path[2];
    if (tenant !== guestTenantId && tenant !== PUBLIC_TENANT_ALIAS) {
      return null;
    }
    path = path.slice(3);
  } else if (path[0] === 'tenants' && path[1]) {
    const tenant = path[1];
    if (tenant !== guestTenantId && tenant !== PUBLIC_TENANT_ALIAS) {
      return null;
    }
    path = path.slice(2);
  }

  if (path.length === 1 && path[0] === 'search') {
    return { kind: 'search', path: 'search' };
  }

  if (path.length === 1 && path[0] === 'chat') {
    return { kind: 'chat', path: 'chat' };
  }

  if (path.length === 2 && path[0] === 'chat' && path[1] === 'sessions') {
    return { kind: 'session-create', path: 'chat/sessions' };
  }

  if (
    path.length === 4 &&
    path[0] === 'chat' &&
    path[1] === 'sessions' &&
    path[3] === 'messages' &&
    SESSION_ID_PATTERN.test(path[2])
  ) {
    return { kind: 'session-message', path: `chat/sessions/${path[2]}/messages` };
  }

  return null;
}

function readQuery(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const query = value.trim();
  if (!query || query.length > maxLength) return null;
  return query;
}

function buildUpstreamBody(
  operation: GuestOperation,
  payload: Record<string, unknown>,
  guestUserId: string
): Record<string, unknown> | null {
  if (operation.kind === 'session-create') {
    return { user_id: guestUserId };
  }

  if (operation.kind === 'search') {
    const query = readQuery(payload.query, 2000);
    if (!query) return null;

    const requestedLimit = typeof payload.limit === 'number' ? payload.limit : 5;
    return {
      query,
      limit: Math.min(5, Math.max(1, Math.round(requestedLimit))),
      enable_hybrid:
        typeof payload.enable_hybrid === 'boolean' ? payload.enable_hybrid : true,
      enable_colbert_rerank: payload.enable_colbert_rerank === true,
    };
  }

  if (operation.kind === 'chat' || operation.kind === 'session-message') {
    const query = readQuery(payload.query, 4000);
    if (!query) return null;
    return { query, stream: true };
  }

  return null;
}

function upstreamHeaders(apiKey: string, accept: string | null, guestUserId: string): Headers {
  const headers = new Headers({
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-User-ID': guestUserId,
    Accept: accept && accept.includes('text/event-stream') ? 'text/event-stream' : 'application/json',
  });
  return headers;
}

async function guestUserIdForRequest(req: NextRequest): Promise<string> {
  const ipHash = await getIpHash(getClientIdentifier(req));
  // Retriever requires X-User-ID to be a UUID. Derive an opaque, daily-rotating
  // UUID from the IP hash so no raw or stable guest identifier is sent upstream.
  const hex = ipHash.slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const uuid = hex.join('');
  return [
    uuid.slice(0, 8),
    uuid.slice(8, 12),
    uuid.slice(12, 16),
    uuid.slice(16, 20),
    uuid.slice(20, 32),
  ].join('-');
}

async function handleGuestRequest(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const retrieverApiUrl = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
  const guestTenantId = (
    process.env.RETRIEVER_GUEST_TENANT_ID ||
    process.env.RETRIEVER_SCOPING_TENANT_ID ||
    ''
  ).trim();
  const guestApiKey = (
    process.env.RETRIEVER_GUEST_API_KEY ||
    process.env.RETRIEVER_SCOPING_API_KEY ||
    ''
  ).trim();

  if (!guestTenantId || !guestApiKey) {
    console.error('[rag-guest] Guest Retriever credentials are not configured.');
    return NextResponse.json(
      { error: 'Guest RAG is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { path: segments = [] } = await context.params;
  const operation = resolveOperation(segments, guestTenantId);
  if (!operation) {
    return NextResponse.json(
      { error: 'Guest RAG route not found.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const isChat = operation.kind !== 'search';
  const rateLimit = await checkRateLimit(req, {
    scope: isChat ? 'rag-guest-chat' : 'rag-guest-search',
    limit: isChat ? 10 : 30,
    windowSeconds: 60,
  });
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body is too large.' },
      { status: 413, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = rawBody ? JSON.parse(rawBody) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Body must be a JSON object');
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const guestUserId = await guestUserIdForRequest(req);
  const upstreamBody = buildUpstreamBody(operation, payload, guestUserId);
  if (!upstreamBody) {
    return NextResponse.json(
      { error: 'A valid query is required.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${retrieverApiUrl}/v1/tenants/${encodeURIComponent(guestTenantId)}/${operation.path}`,
      {
        method: 'POST',
        headers: upstreamHeaders(guestApiKey, req.headers.get('accept'), guestUserId),
        body: JSON.stringify(upstreamBody),
        cache: 'no-store',
        signal: AbortSignal.timeout(55_000),
      }
    );
  } catch (error) {
    console.error(
      '[rag-guest] Upstream request failed:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: 'Guest RAG upstream is unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!upstream.ok) {
    console.warn(`[rag-guest] Upstream returned ${upstream.status} for ${operation.kind}.`);
    return NextResponse.json(
      { error: 'Guest RAG request failed.', upstreamStatus: upstream.status },
      { status: upstream.status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!upstream.body) {
    return NextResponse.json(
      { error: 'Guest RAG upstream returned an empty response.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
  const isEventStream = contentType.includes('text/event-stream');
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set(
    'Cache-Control',
    isEventStream ? 'no-store, no-transform' : 'no-store'
  );
  if (isEventStream) {
    // Prevent intermediary buffering so widget tokens arrive incrementally.
    responseHeaders.set('X-Accel-Buffering', 'no');
  }

  const cacheLookup = upstream.headers.get('x-cache-lookup');
  if (cacheLookup) responseHeaders.set('X-Cache-Lookup', cacheLookup);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handleGuestRequest(req, context);
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed.' },
    { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } }
  );
}
