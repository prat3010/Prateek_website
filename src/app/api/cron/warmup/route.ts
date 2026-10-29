import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RETRIEVER_API_URL = (
  process.env.RETRIEVER_API_URL ||
  process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
  'https://rag.prateeq.in'
).replace(/\/$/, '');

const PORTFOLIO_TENANT_ID =
  process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';
const SCOPING_TENANT_ID =
  process.env.RETRIEVER_SCOPING_TENANT_ID || '1f85286c-9d9a-4ebc-9c62-a99360a5ece4';

interface WarmupTarget {
  name: string;
  tenantId: string;
  apiKey: string | undefined;
}

async function handleWarmup(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.SYNC_API_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured; warmup endpoint is disabled.' },
      { status: 503 }
    );
  }

  const authorization = req.headers.get('authorization') || '';
  const bearer = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const provided = bearer || req.nextUrl.searchParams.get('secret') || '';

  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targets: WarmupTarget[] = [
    {
      name: 'portfolio',
      tenantId: PORTFOLIO_TENANT_ID,
      apiKey: process.env.RETRIEVER_PORTFOLIO_API_KEY,
    },
    {
      name: 'scoping',
      tenantId: SCOPING_TENANT_ID,
      apiKey: process.env.RETRIEVER_SCOPING_API_KEY,
    },
  ];

  const results = await Promise.all(
    targets.map(async (target) => {
      if (!target.apiKey) {
        return {
          name: target.name,
          status: 'skipped' as const,
          reason: 'Retriever API key is not configured.',
        };
      }

      const started = Date.now();
      try {
        const res = await fetch(
          `${RETRIEVER_API_URL}/v1/tenants/${target.tenantId}/warmup`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${target.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            signal: AbortSignal.timeout(20000),
            cache: 'no-store',
          }
        );

        const payload = (await res.json().catch(() => ({}))) as {
          latency_ms?: number;
        };
        return {
          name: target.name,
          status: res.ok ? ('warm' as const) : ('error' as const),
          httpStatus: res.status,
          latencyMs: Date.now() - started,
          upstreamLatencyMs:
            typeof payload?.latency_ms === 'number' ? payload.latency_ms : undefined,
        };
      } catch (error) {
        return {
          name: target.name,
          status: 'error' as const,
          latencyMs: Date.now() - started,
          error: error instanceof Error ? error.message : 'Unknown warmup failure',
        };
      }
    })
  );

  const warmed = results.filter((result) => result.status === 'warm').length;

  return NextResponse.json(
    { ok: warmed > 0, warmed, results },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function GET(req: NextRequest) {
  return handleWarmup(req);
}

export async function POST(req: NextRequest) {
  return handleWarmup(req);
}
