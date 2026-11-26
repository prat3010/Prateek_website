import { BLUEPRINT_CLOSE_TAG, BLUEPRINT_OPEN_TAG } from './blueprintCatalog';

export function createTextStream(
  fullText: string,
  delayMs = 10,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const words = fullText.split(' ');
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : ''));
  }

  let isClosed = false;

  return new ReadableStream({
    async start(controller) {
      const onAbort = () => {
        isClosed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      for (const chunk of chunks) {
        if (isClosed || signal?.aborted) break;
        const sseLine = `data: ${JSON.stringify({ delta: chunk })}\n\n`;
        try {
          controller.enqueue(encoder.encode(sseLine));
        } catch {
          isClosed = true;
          break;
        }
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      if (!isClosed && !signal?.aborted) {
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch {
          // ignore
        }
      }
    },
    cancel() {
      isClosed = true;
    },
  });
}

export interface UpstreamSseEvent {
  text?: string;
  error?: string;
  done: boolean;
}

/**
 * Reads Retriever's OpenAI-compatible SSE frames into plain text deltas.
 * The idle timeout bounds a stalled upstream stream without cutting off a
 * healthy long answer.
 */
export function createUpstreamSseReader(
  stream: ReadableStream<Uint8Array>,
  idleTimeoutMs: number
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let closed = false;

  async function readChunk(): Promise<ReadableStreamReadResult<Uint8Array>> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reader.cancel().catch(() => {});
            reject(new Error(`Retriever stream idle timeout (${idleTimeoutMs / 1000}s)`));
          }, idleTimeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function next(): Promise<UpstreamSseEvent> {
    while (!closed) {
      const newline = buffer.indexOf('\n');
      if (newline !== -1) {
        const rawLine = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const line = rawLine.replace(/\r$/, '').trim();
        if (!line || !line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          closed = true;
          return { done: true };
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed?.error) {
            return { error: String(parsed.error), done: false };
          }
          const text =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.delta ??
            parsed?.text ??
            parsed?.content;
          if (typeof text === 'string' && text.length > 0) {
            return { text, done: false };
          }
        } catch {
          // Ignore malformed frames and SSE comments.
        }
        continue;
      }

      const { done, value } = await readChunk();
      if (done) {
        closed = true;
        return { done: true };
      }
      buffer += decoder.decode(value, { stream: true });
    }
    return { done: true };
  }

  return {
    next,
    cancel: () => {
      closed = true;
      reader.cancel().catch(() => {});
    },
  };
}

/**
 * Removes <blueprint_action> blocks from a token stream even when the tag is
 * split across upstream chunks, while retaining a small tail to detect partial
 * opening tags.
 */
export function createBlueprintTagFilter() {
  let buffer = '';
  let insideBlueprint = false;

  function drain(final: boolean): string {
    let output = '';

    while (buffer.length > 0) {
      const lowerBuffer = buffer.toLowerCase();

      if (insideBlueprint) {
        const closeIndex = lowerBuffer.indexOf(BLUEPRINT_CLOSE_TAG);
        if (closeIndex === -1) {
          if (final) {
            buffer = '';
          } else {
            const keep = BLUEPRINT_CLOSE_TAG.length - 1;
            if (buffer.length > keep) buffer = buffer.slice(-keep);
          }
          break;
        }
        buffer = buffer.slice(closeIndex + BLUEPRINT_CLOSE_TAG.length);
        insideBlueprint = false;
        continue;
      }

      const openIndex = lowerBuffer.indexOf(BLUEPRINT_OPEN_TAG);
      if (openIndex === -1) {
        if (final) {
          const partialStart = lowerBuffer.lastIndexOf('<');
          const partialTag =
            partialStart === -1 ? '' : lowerBuffer.slice(partialStart);
          output +=
            partialTag && BLUEPRINT_OPEN_TAG.startsWith(partialTag)
              ? buffer.slice(0, partialStart)
              : buffer;
          buffer = '';
        } else {
          const keep = BLUEPRINT_OPEN_TAG.length - 1;
          if (buffer.length > keep) {
            output += buffer.slice(0, buffer.length - keep);
            buffer = buffer.slice(-keep);
          }
        }
        break;
      }

      output += buffer.slice(0, openIndex);
      buffer = buffer.slice(openIndex + BLUEPRINT_OPEN_TAG.length);
      insideBlueprint = true;
    }

    return output;
  }

  return {
    push(text: string): string {
      buffer += text;
      return drain(false);
    },
    flush(): string {
      return drain(true);
    },
  };
}
