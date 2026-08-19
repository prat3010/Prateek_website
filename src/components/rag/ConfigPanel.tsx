"use client";

import { useState } from "react";
import { type RetrieverConfig } from "@/lib/rag-client";
import { useAuth } from "@/context/AuthContext";
import { isValidUrl } from "./utils";
import styles from "./rag.module.css";

const EMPTY_CONFIG: RetrieverConfig = {
  apiUrl: "https://rag.prateeq.in",
  tenantId: "",
  apiKey: "",
  userId: "",
};

export function ConfigPanel({
  config, onSave, onClear, hidden,
}: {
  config: RetrieverConfig | null;
  onSave: (c: RetrieverConfig) => void;
  onClear: () => void;
  hidden: boolean;
}) {
  const { user, getAccessToken } = useAuth();
  const [form, setForm] = useState<RetrieverConfig>(
    config ?? EMPTY_CONFIG,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (hidden) return null;

  const valid = isValidUrl(form.apiUrl) && form.tenantId.length > 0 && form.userId.length > 0 && form.apiKey.length > 0;

  async function handleSupabaseSessionConnect() {
    setConnecting(true);
    setConnectResult(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No active Supabase session token found. Please sign in.");
      const baseUrl = form.apiUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/v1/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Auth session endpoint returned ${res.status}`);
      const data = await res.json();
      const newConfig: RetrieverConfig = {
        apiUrl: baseUrl,
        tenantId: data.tenantId,
        userId: data.userId,
        apiKey: token,
      };
      setForm(newConfig);
      setConnectResult({ ok: true, msg: "Connected via Supabase Auth" });
      onSave(newConfig);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Supabase session connection failed";
      setConnectResult({ ok: false, msg });
    } finally {
      setConnecting(false);
    }
  }

  async function handleSave() {
    if (!valid) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(`${form.apiUrl.replace(/\/$/, "")}/health/liveness`, {
        headers: { Authorization: `Bearer ${form.apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
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

      <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {user ? (
          <button className="comic-btn comic-btn-blue" onClick={handleSupabaseSessionConnect} disabled={connecting}>
            {connecting ? "Connecting…" : `🔐 Connect as ${user.email?.split("@")[0]}`}
          </button>
        ) : null}
      </div>
      {showAdvanced && (
        <div>
          <label className={styles.label}>API Base URL</label>
          <input className={styles.input} value={form.apiUrl} onChange={(e) => setForm({ ...form, apiUrl: e.target.value })} placeholder="https://rag.prateeq.in" />
        </div>
      )}
      <div className={styles.row}>
        <div>
          <label className={styles.label}>Tenant ID</label>
          <input className={styles.input} value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="Tenant UUID" />
        </div>
        <div>
          <label className={styles.label}>User ID</label>
          <input className={styles.input} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="User UUID" />
        </div>
      </div>
      <label className={styles.label}>API Key</label>
      <input className={styles.input} value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} type="password" placeholder="ret_live_..." />
      <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem", marginBottom: "0.75rem" }} onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "Hide" : "Show"} Advanced
      </button>
      <div className={styles.row}>
        <div>
          <label className={styles.label}>LLM Key (optional)</label>
          <input className={styles.input} value={form.llmKey ?? ""} onChange={(e) => setForm({ ...form, llmKey: e.target.value || undefined })} type="password" />
        </div>
        <div>
          <label className={styles.label}>LLM Provider</label>
          <select className={styles.input} value={form.llmProvider ?? ""} onChange={(e) => setForm({ ...form, llmProvider: e.target.value || undefined })}>
            <option value="">Tenant default</option>
            <option value="openrouter">OpenRouter</option>
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
