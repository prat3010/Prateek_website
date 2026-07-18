"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getConfig, saveConfig, clearConfig, RetrieverClient, type RetrieverConfig } from "@/lib/rag-client";
import styles from "./rag.module.css";

// :deferred:
// - Toast notification system — inline error/success is sufficient for current use
// - Markdown rendering in chat messages — pre-wrap handles plain text fine
// - Chat session history list — requires new API call + UI panel, speculative
// - Search-to-chat flow integration — adds cross-panel complexity
// - Stop generation button — only matters after live streaming (Phase 1.1 done)
// - Keyboard shortcuts (/, Cmd+Enter) — nice polish, not foundational
// - Document preview / multi-file upload — low usage currently

type Tab = "config" | "chat" | "search" | "documents";

function isValidUrl(s: string) {
  try { return !!new URL(s); } catch { return false; }
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export default function RagInterface() {
  const [tab, setTab] = useState<Tab>("config");
  const [config, setConfig] = useState<RetrieverConfig | null>(() => typeof window !== "undefined" ? getConfig() : null);
  const [client, setClient] = useState<RetrieverClient | null>(() => {
    if (typeof window === "undefined") return null;
    const c = getConfig();
    return c ? new RetrieverClient(c) : null;
  });

  function handleSaveConfig(c: RetrieverConfig) {
    saveConfig(c);
    setConfig(c);
    setClient(new RetrieverClient(c));
    setTab("chat");
  }

  function handleClear() {
    clearConfig();
    setConfig(null);
    setClient(null);
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "config" ? styles.active : ""}`} onClick={() => setTab("config")}>
          Config
        </button>
        <button className={`${styles.tab} ${tab === "chat" ? styles.active : ""}`} onClick={() => setTab("chat")} disabled={!client}>
          Chat
        </button>
        <button className={`${styles.tab} ${tab === "search" ? styles.active : ""}`} onClick={() => setTab("search")} disabled={!client}>
          Search
        </button>
        <button className={`${styles.tab} ${tab === "documents" ? styles.active : ""}`} onClick={() => setTab("documents")} disabled={!client}>
          Documents
        </button>
      </nav>

      <div className={styles.status}>
        {client
          ? <span className={styles.connected}>Connected: {config?.tenantId?.slice(0, 8)}…</span>
          : <span className={styles.disconnected}>Not configured</span>}
      </div>

      <div className={styles.content}>
        <ConfigPanel key={config?.apiKey ?? "empty"} config={config} onSave={handleSaveConfig} onClear={handleClear} hidden={tab !== "config"} />
        <ChatPanel client={client} hidden={tab !== "chat"} />
        <SearchPanel client={client} hidden={tab !== "search"} />
        <DocumentsPanel client={client} hidden={tab !== "documents"} />
      </div>
    </div>
  );
}

function ConfigPanel({
  config, onSave, onClear, hidden,
}: {
  config: RetrieverConfig | null;
  onSave: (c: RetrieverConfig) => void;
  onClear: () => void;
  hidden: boolean;
}) {
  const [form, setForm] = useState<RetrieverConfig>(
    config ?? { apiUrl: "https://rag.prateeq.in", tenantId: "00000000-0000-0000-0000-000000000000", apiKey: "", userId: "a8b819bb-61bb-450b-9662-62bd06b188d3" },
  );
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (hidden) return null;

  const valid = isValidUrl(form.apiUrl) && isUuid(form.tenantId) && isUuid(form.userId) && form.apiKey.length > 0;

  async function handleSave() {
    if (!valid) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const res = await fetch(`${form.apiUrl.replace(/\/$/, "")}/health/liveness`, {
        headers: { Authorization: `Bearer ${form.apiKey}` },
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      setConnectResult({ ok: true, msg: "Connected" });
      onSave(form);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setConnectResult({ ok: false, msg });
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Configuration</h2>
      <p className={styles.panelDesc}>
        Connect to your Retriever instance to search documents, upload new content, and chat with your data.
      </p>
      <label className={styles.label}>API Base URL</label>
      <input className={styles.input} value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://rag.prateeq.in" />
      <div className={styles.row}>
        <div>
          <label className={styles.label}>Tenant ID</label>
          <input className={styles.input} value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" />
        </div>
        <div>
          <label className={styles.label}>User ID</label>
          <input className={styles.input} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="a8b819bb-61bb-450b-9662-62bd06b188d3" />
        </div>
      </div>
      <label className={styles.label}>API Key</label>
      <input className={styles.input} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} type="password" placeholder="sk_live_..." />
      <div className={styles.row}>
        <div>
          <label className={styles.label}>LLM Key (optional)</label>
          <input className={styles.input} value={form.llmKey ?? ""} onChange={(e) => setForm({ ...form, llmKey: e.target.value || undefined })} type="password" />
        </div>
        <div>
          <label className={styles.label}>LLM Provider</label>
          <select className={styles.input} value={form.llmProvider ?? ""} onChange={(e) => setForm({ ...form, llmProvider: e.target.value || undefined })}>
            <option value="">Tenant default</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
      </div>
      <div className={styles.actions}>
        <button className="comic-btn comic-btn-blue" onClick={handleSave} disabled={!valid || connecting}>
          {connecting ? "Connecting…" : "Save & Connect"}
        </button>
        {config && <button className="comic-btn comic-btn-outline" onClick={onClear}>Disconnect</button>}
      </div>
      {connectResult && (
        <p className={`${styles.connectStatus} ${connectResult.ok ? styles.connectOk : styles.connectFail}`}>
          {connectResult.ok ? "✓" : "✗"} {connectResult.msg}
        </p>
      )}
    </div>
  );
}

function ChatPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (hidden) return null;

  async function startSession() {
    if (!client) return;
    setError("");
    try {
      const res = await client.createSession();
      setSessionId(res.sessionId);
      setMessages([{ role: "assistant", content: `Session started. Send your first message.` }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    }
  }

  async function sendMessage() {
    if (!client || !sessionId || !input.trim() || loading) return;
    const msg = input;
    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const body = await client.chat(sessionId, msg);
      if (body) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split("\n")) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.event === "done") break;
                const delta = parsed.content ?? parsed.delta ?? "";
                if (delta) {
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant") {
                      return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
                    }
                    return [...prev, { role: "assistant", content: delta }];
                  });
                }
              } catch {}
            }
          }
        }
      }
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev;
        return [...prev, { role: "assistant", content: "(empty response)" }];
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Chat</h2>
      <p className={styles.panelDesc}>Streaming RAG chat with your documents.</p>

      {!sessionId && messages.length === 0 && (
        <p className={styles.empty}>Start a session to begin chatting with your documents.</p>
      )}

      <div className={styles.chatControls}>
        {!sessionId ? (
          <button className="comic-btn comic-btn-blue" onClick={startSession}>Start Session</button>
        ) : (
          <span className={styles.sessionBadge}>
            Session: {sessionId.slice(0, 8)}…
            <button className="comic-btn comic-btn-outline" style={{ marginLeft: "0.5rem" }} onClick={() => { setSessionId(null); setMessages([]); }}>End</button>
          </span>
        )}
      </div>

      {messages.length > 0 && (
        <div className={styles.chatMessages}>
          {messages.map((m, i) => (
            <div key={i} className={`${styles.chatMsg} ${m.role === "user" ? styles.chatUser : styles.chatAssistant}`} style={{ whiteSpace: "pre-wrap" }}>
              {(i === messages.length - 1 && m.role === "assistant" && loading)
                ? m.content + " ▌"
                : m.content}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
      )}

      {sessionId && (
        <div className={styles.chatInput}>
          <input
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            disabled={loading}
          />
          <button className="comic-btn comic-btn-blue" onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

function SearchPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [query, setQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hidden) return null;

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightText(text: string, q: string): (string | React.ReactNode)[] {
    if (!q.trim()) return [text];
    const escaped = escapeRegex(q);
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ? <strong key={i}>{p}</strong> : p
    );
  }

  async function handleSearch() {
    if (!client || !query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.search(query);
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Semantic Search</h2>
      <p className={styles.panelDesc}>Hybrid search across indexed documents.</p>

      <div className={styles.chatInput}>
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search query..."
        />
        <button className="comic-btn comic-btn-blue" onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {!results && !loading && (
        <p className={styles.empty}>Enter a query above to search your indexed documents.</p>
      )}

      {results && (
        <div style={{ marginTop: "1.5rem" }}>
          <p className={styles.resultMeta}>
            Found {results.results.length} result{results.results.length !== 1 ? "s" : ""}
            {results.searchMeta?.durationMs && ` in ${results.searchMeta.durationMs}ms`}
          </p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {results.results.map((r: any, i: number) => (
            <div key={r.chunkId ?? i} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <span className={styles.resultRank}>#{i + 1}</span>
                <span className={styles.resultScore}>{(r.score * 100).toFixed(1)}%</span>
              </div>
              <p className={styles.resultContent}>{highlightText(r.content, query)}</p>
              {(r.metadata?.filename || r.metadata?.document_id) && (
                <p className={styles.searchDoc}>
                  📄 {r.metadata?.filename ?? r.metadata?.document_id?.slice(0, 8) ?? ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

function DocumentsPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [docs, setDocs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState("");

  const fetchDocs = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.listDocuments();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDocs(res as any[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [client]);

  if (hidden) return null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploading(true);
    setUploadName(file.name);
    setError("");
    try {
      await client.uploadDocument(file);
      await fetchDocs();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadName("");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDelete(doc: any) {
    if (!client) return;
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    try {
      await client.deleteDocument(doc.documentId);
      setDocs((prev) => prev ? prev.filter((d) => d.documentId !== doc.documentId) : null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Documents</h2>
      <p className={styles.panelDesc}>Manage indexed documents.</p>

      <div className={styles.chatInput}>
        <button className="comic-btn comic-btn-blue" onClick={fetchDocs} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <label className="comic-btn comic-btn-outline" style={{ cursor: uploading ? "wait" : "pointer" }}>
          {uploading ? `Uploading ${uploadName}…` : "Upload PDF"}
          <input type="file" accept=".pdf,.txt,.md,.docx" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {uploading && <div className={styles.progressBar} />}

      {docs === null && !loading && (
        <p className={styles.empty}>Connect and refresh to see your documents.</p>
      )}

      {docs && docs.length === 0 && (
        <p className={styles.empty}>No documents yet. Upload a PDF, TXT, Markdown, or DOCX file to get started.</p>
      )}

      {docs && docs.length > 0 && (
        <ul className={styles.fileList}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {docs.map((doc: any) => (
            <li key={doc.documentId} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{doc.filename}</span>
              </div>
              <div className={styles.fileActions}>
                <span className={styles.fileStatus}>{doc.status}</span>
                <button className={styles.deleteBtn} onClick={() => handleDelete(doc)} title="Delete document">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
