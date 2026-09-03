import { NextResponse, NextRequest } from 'next/server';

export interface RateLimitOptions {
  scope: string;
  limit: number;
  windowSeconds: number;
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds when the window resets
  retryAfter: number; // Seconds until the client can retry
  engine: 'upstash' | 'memory';
}

// In-Memory Sliding-Window Store with self-cleaning garbage collection
interface MemoryEntry {
  timestamps: number[];
  updatedAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
let lastMemoryCleanup = Date.now();

function cleanupStaleMemoryEntries(maxWindowMs: number = 3600000) {
  const now = Date.now();
  if (now - lastMemoryCleanup < 60000) return; // Clean up at most once per minute
  lastMemoryCleanup = now;

  for (const [key, entry] of memoryStore.entries()) {
    if (now - entry.updatedAt > maxWindowMs) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Derives a reliable client identifier from headers or fallback.
 */
export function getClientIdentifier(req: Request | NextRequest, explicitId?: string): string {
  if (explicitId && explicitId.trim()) {
    return explicitId.trim().toLowerCase();
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');

  const rawIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || cfIp || '127.0.0.1');
  return rawIp;
}

/**
 * Execute rate limit check against Upstash Redis REST API.
 */
async function checkUpstashRateLimit(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult | null> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const clearBefore = now - windowMs;

  try {
    const pipelineUrl = `${url.replace(/\/$/, '')}/pipeline`;
    // Pipeline commands for atomic sliding window log:
    // 1. ZREMRANGEBYSCORE key 0 clearBefore
    // 2. ZCARD key
    // 3. ZADD key now now (as string for member)
    // 4. EXPIRE key windowSeconds
    const commands = [
      ['ZREMRANGEBYSCORE', key, '0', String(clearBefore)],
      ['ZCARD', key],
      ['ZADD', key, String(now), `${now}:${Math.random().toString(36).slice(2, 7)}`],
      ['EXPIRE', key, String(windowSeconds)],
    ];

    const res = await fetch(pipelineUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length < 4) {
      return null;
    }

    // data[1] is the result of ZCARD (current count within the window before this request)
    const currentCount = Number(data[1]?.result) || 0;
    const isAllowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - (isAllowed ? 1 : 0));
    const resetTimeSeconds = Math.ceil((now + windowMs) / 1000);
    const retryAfter = Math.ceil(windowSeconds);

    return {
      success: isAllowed,
      limit,
      remaining,
      reset: resetTimeSeconds,
      retryAfter: isAllowed ? 0 : retryAfter,
      engine: 'upstash',
    };
  } catch {
    // Return null to fall back gracefully to in-memory limiter
    return null;
  }
}

/**
 * In-Memory sliding-window rate limiter fallback.
 */
function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  cleanupStaleMemoryEntries(windowSeconds * 1000 * 2);

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const clearBefore = now - windowMs;

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [], updatedAt: now };
    memoryStore.set(key, entry);
  }

  // Filter timestamps within current sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > clearBefore);
  entry.updatedAt = now;

  const count = entry.timestamps.length;
  const isAllowed = count < limit;

  if (isAllowed) {
    entry.timestamps.push(now);
  }

  const oldestTimestamp = entry.timestamps[0] || now;
  const resetTimeMs = oldestTimestamp + windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
  const remaining = Math.max(0, limit - entry.timestamps.length);

  return {
    success: isAllowed,
    limit,
    remaining,
    reset: Math.ceil(resetTimeMs / 1000),
    retryAfter: isAllowed ? 0 : retryAfter,
    engine: 'memory',
  };
}

/**
 * Universal rate limit checker. Automatically probes Upstash Redis REST
 * and seamlessly falls back to thread-safe In-Memory Sliding Window.
 */
export async function checkRateLimit(
  req: Request | NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { scope, limit, windowSeconds } = options;
  const identifier = getClientIdentifier(req, options.identifier);
  const key = `ratelimit:${scope}:${identifier}`;

  // Check for Upstash or Vercel KV REST credentials
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (upstashUrl && upstashToken) {
    const upstashResult = await checkUpstashRateLimit(upstashUrl, upstashToken, key, limit, windowSeconds);
    if (upstashResult) {
      return upstashResult;
    }
  }

  // Fall back to robust in-memory sliding window
  return checkMemoryRateLimit(key, limit, windowSeconds);
}

/**
 * Formats a standard RFC-compliant 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded for this operation. Please retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      limit: result.limit,
      engine: result.engine,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}

/**
 * Attaches rate limit telemetry headers to an existing response.
 */
export function applyRateLimitHeaders(res: NextResponse, result: RateLimitResult): NextResponse {
  res.headers.set('X-RateLimit-Limit', String(result.limit));
  res.headers.set('X-RateLimit-Remaining', String(result.remaining));
  res.headers.set('X-RateLimit-Reset', String(result.reset));
  return res;
}
