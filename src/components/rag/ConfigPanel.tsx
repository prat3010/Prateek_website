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
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [form, setForm] = useState<RetrieverConfig>(
    config ?? EMPTY_CONFIG,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Widget Visual Customizer State Helpers
  const getSavedWidgetConfig = (tenantId: string, key: string, fallback: string) => {
    if (typeof window === "undefined" || !tenantId) return fallback;
    try {
      const saved = localStorage.getItem(`widget_config_${tenantId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch {}
    return fallback;
  };

  const [brandColor, setBrandColor] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "brandColor", "#2563EB")
  );
  const [launcherPosition, setLauncherPosition] = useState<"bottom-right" | "bottom-left">(() =>
    getSavedWidgetConfig(form.tenantId, "launcherPosition", "bottom-right") as "bottom-right" | "bottom-left"
  );
  const [botTitle, setBotTitle] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "botTitle", "Retriever AI Support")
  );
  const [welcomeMessage, setWelcomeMessage] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "welcomeMessage", "Hi there! How can I help answer questions from our documentation today?")
  );
  const [corsDomain, setCorsDomain] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "corsDomain", "https://mysite.com")
  );
  const [contextualHeader, setContextualHeader] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "contextualHeader", "Document Title & Section Scope")
  );
  const [searchFusionStrategy, setSearchFusionStrategy] = useState<string>(() =>
    getSavedWidgetConfig(form.tenantId, "searchFusionStrategy", "normalized_hybrid")
  );



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

      if (typeof window !== "undefined" && form.tenantId) {
        localStorage.setItem(`widget_config_${form.tenantId}`, JSON.stringify({
          brandColor,
          launcherPosition,
          botTitle,
          welcomeMessage,
          corsDomain,
          contextualHeader,
          searchFusionStrategy,
        }));
      }

      setConnectResult({ ok: true, msg: "Connected & Configuration Saved" });
      onSave(form);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setConnectResult({ ok: false, msg });
    } finally {
      setConnecting(false);
    }
  }


  const scriptSnippet = `<script
  src="https://prateeq.in/widget.js"
  data-tenant="${form.tenantId || "YOUR_TENANT_ID"}"
  data-color="${brandColor}"
  data-position="${launcherPosition}"
  async>
</script>`;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>⚙️ Live Visual Widget Studio & API Deployment</h2>
        <p className={styles.panelDesc}>Customize your embeddable chatbot widget theme, preview it live side-by-side, and manage API keys.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Left Side: Visual Style Customizer */}
        <div>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>🎨 Brand Widget Customizer</h3>

          <label className={styles.label}>Brand Primary Color</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <input
              type="color"
              aria-label="Brand Primary Color picker"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              style={{ width: "36px", height: "36px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
            <input className={styles.input} aria-label="Brand Primary Color hex value" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ margin: 0 }} />
          </div>

          <label className={styles.label}>Bot Title Name</label>
          <input className={styles.input} aria-label="Bot Title Name" value={botTitle} onChange={(e) => setBotTitle(e.target.value)} />

          <label className={styles.label}>Initial Welcome Greeting</label>
          <textarea
            className={styles.input}
            aria-label="Initial Welcome Greeting"
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />

          <div className={styles.row}>
            <div>
              <label className={styles.label}>Launcher Position</label>
              <select
                className={styles.input}
                aria-label="Launcher Position"
                value={launcherPosition}
                onChange={(e) => setLauncherPosition(e.target.value as "bottom-right" | "bottom-left")}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>CORS Whitelist Origin</label>
              <input
                className={styles.input}
                aria-label="CORS Whitelist Origin"
                value={corsDomain}
                onChange={(e) => setCorsDomain(e.target.value)}
                placeholder="https://mysite.com"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Side-by-Side Live Widget Preview */}
        <div>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>👁️ Live Interactive Preview</h3>
          <div className={styles.widgetPreviewCanvas}>
            {/* Widget Mock Header */}
            <div style={{ background: brandColor, color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🤖</span>
                <strong>{botTitle}</strong>
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>⚡ Online</span>
            </div>

            {/* Widget Mock Body */}
            <div style={{ padding: "1rem", flex: 1, background: "rgba(0, 0, 0, 0.2)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "0.6rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", maxWidth: "85%" }}>
                {welcomeMessage}
              </div>
              <div style={{ alignSelf: "flex-end", background: brandColor, color: "#fff", padding: "0.6rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", maxWidth: "85%" }}>
                Where can I find pricing plans?
              </div>
            </div>

            {/* Widget Launcher Icon Mock */}
            <div style={{ position: "absolute", bottom: "16px", [launcherPosition === "bottom-right" ? "right" : "left"]: "16px", background: brandColor, width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", cursor: "pointer" }}>
              <span style={{ color: "#fff", fontSize: "1.2rem" }}>💬</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Line Script Generator */}
      <div style={{ background: "rgba(90, 142, 182, 0.08)", border: "1px solid rgba(90, 142, 182, 0.2)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>📦 1-Line Embed Script Tag</h3>
        <p style={{ fontSize: "0.8rem", opacity: 0.8, margin: "0 0 0.5rem" }}>Copy and paste this single line before the <code>&lt;/body&gt;</code> tag of your website.</p>
        <pre style={{ background: "#090d16", padding: "0.75rem", borderRadius: "6px", fontSize: "0.78rem", color: "#00E676", overflowX: "auto" }}>
          {scriptSnippet}
        </pre>
      </div>

      {/* Credentials & API Settings */}
      <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>🔑 Workspace Connection & BYOK Keys</h3>
      <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {!authLoading && user ? (
          <button className="comic-btn comic-btn-blue" onClick={handleSupabaseSessionConnect} disabled={connecting}>
            {connecting ? "Connecting…" : `🔐 Connect via Supabase Auth (${user.email?.split("@")[0]})`}
          </button>
        ) : null}
      </div>

      <div className={styles.row}>
        <div>
          <label className={styles.label}>Tenant ID</label>
          <input className={styles.input} aria-label="Tenant ID" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="Tenant UUID" />
        </div>
        <div>
          <label className={styles.label}>User ID</label>
          <input className={styles.input} aria-label="User ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="User UUID" />
        </div>
      </div>

      <label className={styles.label}>API Key</label>
      <input className={styles.input} aria-label="API Key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} type="password" placeholder="ret_live_..." />

      <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem", marginBottom: "0.75rem" }} onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "Hide" : "Show"} Advanced Settings
      </button>

      {showAdvanced && (
        <>
          <div className={styles.row}>
            <div>
              <label className={styles.label}>BYOK LLM Key (AES-256 Encrypted)</label>
              <input className={styles.input} aria-label="BYOK LLM Key" value={form.llmKey ?? ""} onChange={(e) => setForm({ ...form, llmKey: e.target.value || undefined })} type="password" placeholder="sk-..." />
            </div>
            <div>
              <label className={styles.label}>BYOK LLM Provider</label>
              <select className={styles.input} aria-label="BYOK LLM Provider" value={form.llmProvider ?? ""} onChange={(e) => setForm({ ...form, llmProvider: e.target.value || undefined })}>
                <option value="">Managed Platform Credits</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>
          </div>

          <div className={styles.row} style={{ marginTop: "0.75rem" }}>
            <div>
              <label className={styles.label}>🏷️ Anthropic Contextual Prepending Header</label>
              <input
                className={styles.input}
                aria-label="Anthropic Contextual Prepending Header"
                value={contextualHeader}
                onChange={(e) => setContextualHeader(e.target.value)}
                placeholder="Prefix attached to chunk text before vector embedding..."
              />
            </div>
            <div>
              <label className={styles.label}>⚡ Search Fusion Strategy</label>
              <select
                className={styles.input}
                aria-label="Search Fusion Strategy"
                value={searchFusionStrategy}
                onChange={(e) => setSearchFusionStrategy(e.target.value)}
              >
                <option value="normalized_hybrid">Normalized Min-Max Hybrid Score Fusion</option>
                <option value="hybrid_rrf">Standard Reciprocal Rank Fusion (RRF)</option>
              </select>
            </div>
          </div>

        </>
      )}

      <div className={styles.actions}>
        <button className="comic-btn comic-btn-blue" onClick={handleSave} disabled={!valid || connecting}>
          {connecting ? "Connecting…" : "Save Configuration"}
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
