import type { ConsoleLine } from './types';

export interface AiTwinStreamHandlers {
  onStart: () => void;
  onRetry?: () => void;
  onDelta: (accumulated: string) => void;
  onComplete: (finalText: string) => void;
  onError: (message: string, retryable: boolean) => void;
}

const AI_TWIN_TIMEOUT_MS = 48_000;
const AI_TWIN_RETRY_DELAY_MS = 2_000;
export const AI_TWIN_THINKING_TEXT = '🧠 Thinking...';
export const AI_TWIN_RETRY_TEXT = '🧠 Engine cold — retrying once...';

export const isAiTwinPendingLine = (line: ConsoleLine) =>
  line.text === AI_TWIN_THINKING_TEXT || line.text === AI_TWIN_RETRY_TEXT;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isAiTwinTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      /timeout|timed out/i.test(error.message))
  );
}

/**
 * Requests an AI Twin reply, preferring the SSE stream but falling back to a
 * JSON body for older backends. Retries once before any tokens are rendered.
 */
export async function requestAiTwin(
  query: string,
  history: { role: string; content: string }[],
  handlers: AiTwinStreamHandlers
): Promise<void> {
  let lastError = 'Unable to reach the AI Twin.';

  for (let attempt = 0; attempt < 2; attempt++) {
    let streamStarted = false;

    try {
      const res = await fetch('/api/terminal/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history, stream: true }),
        signal: AbortSignal.timeout(AI_TWIN_TIMEOUT_MS),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          reply?: string;
          retryable?: boolean;
        };
        lastError = data.error || data.reply || `Server error (${res.status})`;

        if (res.status >= 500 && attempt === 0) {
          handlers.onRetry?.();
          await delay(AI_TWIN_RETRY_DELAY_MS);
          continue;
        }

        handlers.onError(lastError, data.retryable !== false);
        return;
      }

      const contentType = res.headers.get('content-type') || '';

      // Backward-compatible path: a cached/older backend may answer with JSON.
      if (!res.body || !contentType.includes('text/event-stream')) {
        const data = (await res.json().catch(() => ({}))) as {
          reply?: string;
          error?: string;
        };
        const reply = typeof data.reply === 'string' ? data.reply : '';

        if (reply) {
          handlers.onStart();
          handlers.onComplete(reply);
          return;
        }

        lastError = data.error || 'The cognitive engine returned an empty response.';
        if (attempt === 0) {
          handlers.onRetry?.();
          await delay(AI_TWIN_RETRY_DELAY_MS);
          continue;
        }

        handlers.onError(lastError, true);
        return;
      }

      handlers.onStart();
      streamStarted = true;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let lastRendered = 0;
      let streamError: string | null = null;

      readStream: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          if (payload === '[DONE]') break readStream;

          try {
            const parsed = JSON.parse(payload);
            if (parsed?.error) {
              streamError = String(parsed.error);
              break readStream;
            }

            const delta =
              parsed?.delta ??
              parsed?.choices?.[0]?.delta?.content ??
              parsed?.text ??
              parsed?.content;

            if (typeof delta === 'string' && delta.length > 0) {
              accumulated += delta;
              const now = Date.now();
              if (now - lastRendered > 60) {
                lastRendered = now;
                handlers.onDelta(accumulated);
              }
            }
          } catch {
            // Ignore malformed frames
          }
        }
      }

      reader.cancel().catch(() => {});

      if (streamError) {
        handlers.onError(streamError, true);
        return;
      }

      const finalText = accumulated
        .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
        .trim();

      if (finalText) {
        handlers.onComplete(finalText);
        return;
      }

      lastError = 'The cognitive engine returned an empty response.';
      if (attempt === 0) {
        handlers.onRetry?.();
        await delay(AI_TWIN_RETRY_DELAY_MS);
        continue;
      }

      handlers.onError(lastError, true);
      return;
    } catch (error) {
      lastError = isAiTwinTimeout(error)
        ? 'The cognitive engine took longer than expected. Please try again.'
        : error instanceof Error
          ? error.message
          : 'Unknown network failure';

      // Do not auto-retry after tokens have started rendering: it would
      // duplicate the partial answer in the transcript.
      if (attempt === 0 && !streamStarted) {
        handlers.onRetry?.();
        await delay(AI_TWIN_RETRY_DELAY_MS);
        continue;
      }

      handlers.onError(lastError, true);
      return;
    }
  }

  handlers.onError(lastError, true);
}


export const AI_TWIN_BOOT_LINES: ConsoleLine[] = [
  { text: '================================================================================', type: 'success' },
  { text: '   PRATEEQ.AI // INTERACTIVE KNOWLEDGE TWIN (v2.5)', type: 'success' },
  { text: '   Live Neural Bridge • Oracle Cloud VPS (rag.prateeq.in)', type: 'output' },
  { text: '================================================================================', type: 'success' },
  { text: ' ', type: 'output' },
  { text: 'SYSTEM STATUS & TELEMETRY:', type: 'success' },
  { text: '  • Architecture   : Hexagonal Core (FastAPI 3.11+ / Next.js 16 App Router)', type: 'output' },
  { text: '  • Cognitive Core : Retriever Hybrid Fusion (Dense HNSW + Sparse BM25)', type: 'output' },
  { text: '  • Vector Engine  : Local nomic-embed-text via Ollama (Zero External Token Leak)', type: 'output' },
  { text: '  • Knowledge Base : Architecture Blueprints, Production Code & Project Dossiers', type: 'output' },
  { text: ' ', type: 'output' },
  { text: "Hello! I am Prateek's interactive AI Twin.", type: 'output' },
  { text: 'I have full context on his engineering background, systems architecture,', type: 'output' },
  { text: 'production codebases, and commercial services.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: 'Ask me anything about his projects, architecture, tech stack, or engineering philosophy.', type: 'output' },
  { text: 'Type "exit" at any time to disconnect and return to the standard terminal shell.', type: 'success' },
  { text: '================================================================================', type: 'success' },
  { text: '', type: 'output' },
];


export const AI_COMMANDS: string[] = [
  'exit',
  'quit',
  'clear',
  'cls',
  'help',
  'telemetry',
  'focus',
  'who are you?',
  'architecture',
  'tech stack',
  'rag engine',
  'pricing tiers',
];

