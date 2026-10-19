/**
 * W3C Distributed Tracing utility for Next.js App Router and Edge Proxy.
 * Generates traceparent headers compliant with the W3C Trace Context Level 2 specification:
 * version-trace_id-parent_id-trace_flags
 */

export interface W3CTraceContext {
  traceparent: string;
  traceId: string;
  spanId: string;
}

export function generateTraceparent(): W3CTraceContext {
  const hex = (len: number) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const traceId = hex(32);
  const spanId = hex(16);
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
  };
}
