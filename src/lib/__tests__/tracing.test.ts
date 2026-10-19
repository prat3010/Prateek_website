import { describe, it, expect } from 'vitest';
import { generateTraceparent } from '../tracing';

describe('generateTraceparent', () => {
  it('generates a valid W3C Trace Context Level 2 traceparent header', () => {
    const { traceparent, traceId, spanId } = generateTraceparent();

    // W3C Traceparent regex format: 00-{32 hex chars}-{16 hex chars}-{2 hex chars}
    const traceparentRegex = /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/;
    expect(traceparent).toMatch(traceparentRegex);

    expect(traceId).toHaveLength(32);
    expect(traceId).toMatch(/^[0-9a-f]{32}$/);

    expect(spanId).toHaveLength(16);
    expect(spanId).toMatch(/^[0-9a-f]{16}$/);

    expect(traceparent).toBe(`00-${traceId}-${spanId}-01`);
  });

  it('generates unique trace and span identifiers across sequential calls', () => {
    const ctx1 = generateTraceparent();
    const ctx2 = generateTraceparent();

    expect(ctx1.traceId).not.toBe(ctx2.traceId);
    expect(ctx1.spanId).not.toBe(ctx2.spanId);
    expect(ctx1.traceparent).not.toBe(ctx2.traceparent);
  });
});
