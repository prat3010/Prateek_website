"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getConfig, saveConfig, clearConfig, RetrieverClient, type RetrieverConfig } from "@/lib/rag-client";
import styles from "./rag.module.css";

type Tab = "config" | "chat" | "search" | "documents";

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

  if (hidden) return null;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Configuration</h2>
      <p className={styles.panelDesc}>Connect to your Retriever API instance.</p>
      <label className={styles.label}>API Base URL</label>
      <input className={styles.input} value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} />
      <div className={styles.row}>
        <div>
          <label className={styles.label}>Tenant ID</label>
          <input className={styles.input} value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>User ID</label>
          <input className={styles.input} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
        </div>
      </div>
      <label className={styles.label}>API Key</label>
      <input className={styles.input} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} type="password" />
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
        <button className="comic-btn comic-btn-blue" onClick={() => onSave(form)}>Save & Connect</button>
        {config && <button className="comic-btn comic-btn-outline" onClick={onClear}>Disconnect</button>}
      </div>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
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
      let full = "";
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
                full += parsed.content ?? parsed.delta ?? "";
              } catch {}
            }
          }
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content: full || "(empty response)" }]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Chat</h2>
      <p className={styles.panelDesc}>Streaming RAG chat with your documents.</p>

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

      <div className={styles.chatMessages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.chatMsg} ${m.role === "user" ? styles.chatUser : styles.chatAssistant}`}>
            {m.content}
          </div>
        ))}
        <div ref={chatEnd} />
      </div>

      {sessionId && (
        <div className={styles.chatInput}>
          <input
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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

  async function handleSearch() {
    if (!client || !query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.search(query);
      setResults(res);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
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

      {results && (
        <div style={{ marginTop: "1.5rem" }}>
          <p className={styles.resultMeta}>
            Found {results.results.length} results
            {results.searchMeta?.durationMs && ` in ${results.searchMeta.durationMs}ms`}
          </p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {results.results.map((r: any, i: number) => (
            <div key={r.chunkId} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <span className={styles.resultRank}>#{i + 1}</span>
                <span className={styles.resultScore}>Score: {r.score.toFixed(4)}</span>
              </div>
              <p className={styles.resultContent}>{r.content}</p>
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
  const [error, setError] = useState("");

  const fetchDocs = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.listDocuments();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDocs(res as any[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [client]);

  if (hidden) return null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploading(true);
    setError("");
    try {
      await client.uploadDocument(file);
      await fetchDocs();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
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
        <label className="comic-btn comic-btn-outline" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "Upload PDF"}
          <input type="file" accept=".pdf,.txt,.md,.docx" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {docs && docs.length === 0 && <p className={styles.empty}>No documents yet.</p>}

      {docs && docs.length > 0 && (
        <ul className={styles.fileList}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {docs.map((doc: any) => (
            <li key={doc.documentId} className={styles.fileItem}>
              <span>{doc.filename}</span>
              <span className={styles.fileStatus}>{doc.status}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
