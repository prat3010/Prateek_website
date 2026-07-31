export interface RetrieverConfig {
  apiUrl: string;
  tenantId: string;
  apiKey: string;
  userId: string;
  llmKey?: string;
  llmProvider?: string;
}

const STORAGE_KEY = "rag_config";

export function getConfig(): RetrieverConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveConfig(config: RetrieverConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

const REQUEST_TIMEOUT = 90_000;
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Request failed after retries");
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DEFAULT_GUEST_USER_ID = "00000000-0000-0000-0000-000000000001";

function sanitizeUserId(userId?: string): string {
  if (userId && UUID_REGEX.test(userId)) return userId;
  return DEFAULT_GUEST_USER_ID;
}

export class RetrieverClient {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}${path}`;
    const validUserId = sanitizeUserId(this.config.userId);
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": validUserId,
      "X-Tenant-ID": this.config.tenantId,
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetchWithRetry(url, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        signal: options.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async search(query: string, limit = 5) {
    return this.request<import("./rag-types").SearchResponse>(`/v1/tenants/${this.config.tenantId}/search`, {
      method: "POST",
      body: JSON.stringify({ query, top_k: limit }),
    });
  }

  async listDocuments() {
    return this.request<import("./rag-types").DocumentMeta[]>(`/v1/tenants/${this.config.tenantId}/documents`);
  }

  async createSession() {
    const validUserId = sanitizeUserId(this.config.userId);
    return this.request<{ sessionId: string; createdAt: string }>(
      `/v1/tenants/${this.config.tenantId}/chat/sessions`,
      { method: "POST", body: JSON.stringify({ user_id: validUserId }) },
    );
  }

  async chat(sessionId: string, message: string, signal?: AbortSignal): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${this.config.tenantId}/chat/sessions/${sessionId}/messages`;
    const validUserId = sanitizeUserId(this.config.userId);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": validUserId,
      Accept: "text/event-stream",
    };
    if (this.config.llmKey) headers["X-LLM-Key"] = this.config.llmKey;
    if (this.config.llmProvider) headers["X-LLM-Provider"] = this.config.llmProvider;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const combinedSignal = signal
      ? combineAbortSignals(signal, controller.signal)
      : controller.signal;

    try {
      const res = await fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: message, stream: true }),
        signal: combinedSignal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.body;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request(`/v1/tenants/${this.config.tenantId}/documents`, {
      method: "POST",
      body: formData,
    });
  }

  async deleteDocument(documentId: string) {
    return this.request(`/v1/tenants/${this.config.tenantId}/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async submitFeedback(sessionId: string, messageId: string, rating: "up" | "down", feedbackText?: string) {
    return this.request(
      `/v1/tenants/${this.config.tenantId}/chat/sessions/${sessionId}/messages/${messageId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ rating, feedback_text: feedbackText || "" }),
      }
    );
  }

  async getDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    return this.request<{ downloadUrl: string }>(
      `/v1/tenants/${this.config.tenantId}/documents/${documentId}/download-url`
    );
  }
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
