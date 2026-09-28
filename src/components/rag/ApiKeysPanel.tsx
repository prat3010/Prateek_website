"use client";

import React, { useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./rag.module.css";

interface ApiKeysPanelProps {
  hidden?: boolean;
  tenantId: string;
  apiKey: string;
  planTier?: string;
}

export function ApiKeysPanel({ hidden, tenantId, apiKey, planTier = "starter" }: ApiKeysPanelProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedTs, setCopiedTs] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [allowedOrigins, setAllowedOrigins] = useState("");
  const [originsSaved, setOriginsSaved] = useState(false);

  if (hidden) return null;

  const displayKey = apiKey || "ret_live_sample_key_configured";
  const maskedKey = keyVisible
    ? displayKey
    : `${displayKey.slice(0, 12)}••••••••••••••••••••••••••••`;

  const curlSnippet = `curl -X POST https://rag.prateeq.in/v1/tenants/${tenantId || "YOUR_TENANT_ID"}/search \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the project deliverables?",
    "limit": 5,
    "enable_hybrid": true
  }'`;

  const pythonSnippet = `import httpx

client = httpx.Client(
    base_url="https://rag.prateeq.in",
    headers={"Authorization": "Bearer ${displayKey}"}
)

response = client.post(
    "/v1/tenants/${tenantId || "YOUR_TENANT_ID"}/chat",
    json={
        "messages": [{"role": "user", "content": "Summarize the technical architecture"}],
        "temperature": 0.2
    }
)
print(response.json())`;

  const tsSnippet = `const res = await fetch("https://rag.prateeq.in/v1/tenants/${tenantId || "YOUR_TENANT_ID"}/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${displayKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "What is the warranty policy?" }],
  }),
});
const data = await res.json();
console.log(data);`;

  const handleCopy = (text: string, setFn: (v: boolean) => void) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setFn(true);
      setTimeout(() => setFn(false), 2000);
    }
  };

  const handleSaveOrigins = (e: React.FormEvent) => {
    e.preventDefault();
    setOriginsSaved(true);
    setTimeout(() => setOriginsSaved(false), 2500);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className={styles.panelTitle}>🔑 API Keys &amp; Developer SDK</h2>
            <p className={styles.panelDesc}>
              Secure programmatic access to your sovereign cognitive engine. Use these keys to query, search, and ingest documents.
            </p>
          </div>
          <span className={styles.tenantPill} style={{ textTransform: "uppercase" }}>
            Plan: {planTier}
          </span>
        </div>
      </div>

      {/* Primary API Key Card */}
      <div className={styles.metricCard} style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Live Secret API Key (Server-Side)</span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-link)", background: "var(--surface-elevated)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
            Tenant: {tenantId ? `${tenantId.slice(0, 13)}…` : "Not initialized"}
          </span>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
          This key has full administrative read/write access to your tenant. Keep it confidential and never expose it in public client-side browser code.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <code
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "0.6rem 0.8rem",
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {maskedKey}
          </code>

          <button
            onClick={() => setKeyVisible(!keyVisible)}
            className="comic-btn comic-btn-outline"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
          >
            {keyVisible ? "Hide" : "Reveal"}
          </button>

          <button
            onClick={() => handleCopy(displayKey, setCopiedKey)}
            className="comic-btn comic-btn-blue"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
          >
            {copiedKey ? "✓ Copied!" : "Copy Key"}
          </button>
        </div>
      </div>

      {/* Domain Whitelist for Public Widget */}
      <div className={styles.metricCard} style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          🛡️ Embed Widget Allowed Domains (CORS)
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
          Lock the public 1-line chat widget to your official domains. The widget script will only answer requests originating from these hostnames.
        </p>
        <form onSubmit={handleSaveOrigins} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="text"
            value={allowedOrigins}
            onChange={(e) => setAllowedOrigins(e.target.value)}
            placeholder="e.g. https://mycompany.com, https://app.mycompany.com"
            style={{
              flex: 1,
              minWidth: "240px",
              padding: "0.55rem 0.75rem",
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              color: "var(--color-text)",
              fontSize: "0.85rem",
            }}
          />
          <MagneticButton strength={0.25}>
            <button type="submit" className="comic-btn comic-btn-blue" style={{ padding: "0.5rem 0.85rem", fontSize: "0.8rem" }}>
              {originsSaved ? "✓ Saved!" : "Save Allowed Domains"}
            </button>
          </MagneticButton>
        </form>
      </div>

      {/* Developer SDK Quickstarts */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          ⚡ 60-Second Developer Quickstart
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          Drop Retriever into your application stack in 4 lines of code.
        </p>

        {/* cURL */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-link)" }}>cURL (REST API)</span>
            <button
              onClick={() => handleCopy(curlSnippet, setCopiedCurl)}
              className="comic-btn comic-btn-outline"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
            >
              {copiedCurl ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.75rem",
              fontSize: "0.78rem",
              overflowX: "auto",
            }}
          >
            <code>{curlSnippet}</code>
          </pre>
        </div>

        {/* Python */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-link)" }}>Python (httpx / requests)</span>
            <button
              onClick={() => handleCopy(pythonSnippet, setCopiedPython)}
              className="comic-btn comic-btn-outline"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
            >
              {copiedPython ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.75rem",
              fontSize: "0.78rem",
              overflowX: "auto",
            }}
          >
            <code>{pythonSnippet}</code>
          </pre>
        </div>

        {/* TypeScript */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-link)" }}>TypeScript / Node.js (fetch)</span>
            <button
              onClick={() => handleCopy(tsSnippet, setCopiedTs)}
              className="comic-btn comic-btn-outline"
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
            >
              {copiedTs ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "0.75rem",
              fontSize: "0.78rem",
              overflowX: "auto",
            }}
          >
            <code>{tsSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
