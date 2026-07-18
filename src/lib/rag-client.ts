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

export class RetrieverClient {
  private config: RetrieverConfig;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": this.config.userId,
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  }

  async search(query: string, limit = 5) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/v1/tenants/${this.config.tenantId}/search`, {
      method: "POST",
      body: JSON.stringify({ query, top_k: limit }),
    });
  }

  async listDocuments() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/v1/tenants/${this.config.tenantId}/documents`);
  }

  async createSession() {
    return this.request<{ sessionId: string }>(
      `/v1/tenants/${this.config.tenantId}/chat/sessions`,
      { method: "POST", body: JSON.stringify({ user_id: this.config.userId }) },
    );
  }

  async chat(sessionId: string, message: string): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${this.config.tenantId}/chat/sessions/${sessionId}/messages`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": this.config.userId,
      Accept: "text/event-stream",
    };
    if (this.config.llmKey) headers["X-LLM-Key"] = this.config.llmKey;
    if (this.config.llmProvider) headers["X-LLM-Provider"] = this.config.llmProvider;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ query: message }) });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.body;
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${this.config.tenantId}/documents`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "X-User-ID": this.config.userId,
      },
      body: formData,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  }

  async deleteDocument(documentId: string) {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${this.config.tenantId}/documents/${documentId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "X-User-ID": this.config.userId,
      },
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
  }
}
