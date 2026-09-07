"use client";

import React, { useState } from "react";
import styles from "./rag.module.css";

interface IntegrationsPanelProps {
  hidden?: boolean;
  tenantId?: string;
}

export function IntegrationsPanel({ hidden, tenantId }: IntegrationsPanelProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSlash, setCopiedSlash] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in";
  const webhookUrl = `${apiBase}/v1/integrations/slack/slash`;
  const extensionDownloadUrl = `${apiBase}/v1/integrations/extension/bundle`;

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  function handleCopySlash() {
    navigator.clipboard.writeText("/ask-retriever");
    setCopiedSlash(true);
    setTimeout(() => setCopiedSlash(false), 2000);
  }

  if (hidden) return null;

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Ecosystem Plugins & Integrations</h2>
          <p className={styles.panelSubtitle}>
            Connect your Retriever workspace directly into Slack channels, Chrome browser toolbars, and Cloud Storage.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className={styles.badgeActive} style={{ fontSize: "11px" }}>
            M90 • v0.75.0
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "16px" }}>
        {/* 1. Slack Bot */}
        <div className={styles.featureCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>💬</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Slack Workspace Bot</h3>
            </div>
            <span className={styles.badgeSuccess}>Active & Ready</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Ask questions with <code className={styles.codeSnippet}>/ask-retriever</code> in any channel to get instant citations and feedback buttons.
          </p>

          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)" }}>
              Slash Command Webhook URL
            </span>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <input
                readOnly
                value={webhookUrl}
                style={{
                  flex: 1,
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--surface-glass-border)",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "var(--color-text)",
                }}
              />
              <button
                onClick={handleCopyWebhook}
                className={styles.secondaryButton}
                style={{ padding: "6px 12px", fontSize: "11px" }}
              >
                {copiedWebhook ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Command: <code className={styles.codeSnippet}>/ask-retriever</code></span>
            <button
              onClick={handleCopySlash}
              className={styles.linkButton}
              style={{ fontSize: "11px" }}
            >
              {copiedSlash ? "Copied" : "Copy Command"}
            </button>
          </div>
        </div>

        {/* 2. Chrome Extension */}
        <div className={styles.featureCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🌐</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>1-Click Chrome Extension</h3>
            </div>
            <span className={styles.badgeNeutral}>Manifest V3</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Save full articles, PDFs, and documentation directly into tenant <code className={styles.codeSnippet}>{tenantId || "default"}</code> from your browser.
          </p>

          <div style={{ background: "var(--surface-elevated)", padding: "10px", borderRadius: "6px", marginBottom: "14px", fontSize: "11px", color: "var(--color-text-muted)" }}>
            <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>Quick Setup:</div>
            <div>1. Download & extract ZIP</div>
            <div>2. Open <code className={styles.codeSnippet}>chrome://extensions</code></div>
            <div>3. Enable Developer Mode & click <b>Load unpacked</b></div>
          </div>

          <a
            href={extensionDownloadUrl}
            download="retriever-chrome-extension.zip"
            style={{ textDecoration: "none" }}
          >
            <button
              className={styles.primaryButton}
              style={{ width: "100%", justifyContent: "center", padding: "8px 14px", fontSize: "12px" }}
            >
              ⚡ Download Chrome Extension (.zip)
            </button>
          </a>
        </div>

        {/* 3. Google Drive */}
        <div className={styles.featureCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>📁</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Google Drive 2-Way Sync</h3>
            </div>
            <span className={styles.badgeSuccess}>REST v3</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Continuous background sync of Google Drive folders with differential checksum re-indexing.
          </p>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
            <div>• Auto Google Docs to Markdown Export: <b>Active</b></div>
            <div>• Differential MD5 Checksums: <b>Enabled</b></div>
          </div>
          <div style={{ padding: "8px", background: "var(--surface-elevated)", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-muted)" }}>
            Configurable via Workspace Settings or Retriever Admin Console.
          </div>
        </div>

        {/* 4. Notion Workspace */}
        <div className={styles.featureCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>📝</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Notion Workspace Connector</h3>
            </div>
            <span className={styles.badgeSuccess}>v1 API</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Sync Notion databases and recursive page block trees into clean, chunked markdown knowledge.
          </p>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
            <div>• Block-to-Markdown Traversal: <b>Headings, Code, Lists, Quotes</b></div>
            <div>• Differential Updates: <b>via last_edited_time</b></div>
          </div>
          <div style={{ padding: "8px", background: "var(--surface-elevated)", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-muted)" }}>
            Configurable via Workspace Settings or Retriever Admin Console.
          </div>
        </div>

        {/* 5. Universal MCP Server */}
        <div className={styles.featureCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🔌</span>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Universal MCP Server</h3>
            </div>
            <span className={styles.badgeSuccess}>MCP 2024-11-05</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Expose all 20 platform batteries and vector indexes as native tools to Cursor, Claude Desktop, and VS Code Cline over JSON-RPC 2.0 &amp; SSE.
          </p>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
            <div>• SSE Transport: <code>/v1/mcp/sse</code></div>
            <div>• JSON-RPC Endpoint: <code>/v1/mcp/messages</code></div>
          </div>
          <div style={{ padding: "8px", background: "var(--surface-elevated)", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-muted)" }}>
            Access full setup snippets and live test probe in the <b>Model Context Protocol (MCP)</b> tab.
          </div>
        </div>
      </div>
    </div>
  );
}
