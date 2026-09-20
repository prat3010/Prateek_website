"use client";

import { useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./rag.module.css";

export function InteractiveWidgetCustomizer() {
  const [color, setColor] = useState("#2563eb");
  const [botName, setBotName] = useState("Retriever Concierge");
  const [position, setPosition] = useState("bottom-right");
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const snippet = `<script
  src="https://rag.prateeq.in/widget.js"
  data-tenant="YOUR_TENANT_ID"
  data-key="YOUR_API_KEY"
  data-color="${color}"
  data-title="${botName}"
  data-position="${position}">
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.customizerSection} id="widget-builder">
      <div className={styles.customizerContainer}>
        <div className={styles.customizerHeader}>
          <span className={styles.customizerBadge}>🎨 No-Code Widget Configurator</span>
          <h2 className={styles.customizerTitle}>Customize &amp; Preview Your Live Widget</h2>
          <p className={styles.customizerSubtitle}>
            Configure colors, branding, and placement in seconds. Test the widget preview directly below or copy the 1-line script for your website.
          </p>
        </div>

        <div className={styles.customizerGrid}>
          {/* Left: Controls */}
          <div className={styles.customizerControls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Brand Accent Color</label>
              <div className={styles.colorSwatches}>
                {[
                  { name: "Azure Blue", hex: "#2563eb" },
                  { name: "Emerald Green", hex: "#10b981" },
                  { name: "Violet Purple", hex: "#8b5cf6" },
                  { name: "Rose Pink", hex: "#f43f5e" },
                  { name: "Amber Gold", hex: "#f59e0b" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    className={`${styles.swatchBtn} ${color === c.hex ? styles.swatchActive : ""}`}
                    style={{ background: c.hex }}
                    onClick={() => setColor(c.hex)}
                    aria-label={`Select ${c.name} color`}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  aria-label="Custom hex color picker"
                  onChange={(e) => setColor(e.target.value)}
                  className={styles.colorPickerInput}
                  title="Custom hex color"
                />
              </div>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Bot Header Title</label>
              <input
                type="text"
                value={botName}
                aria-label="Bot Header Title"
                onChange={(e) => setBotName(e.target.value)}
                placeholder="e.g. Acme Support AI"
                className={styles.customizerInput}
              />
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Widget Screen Position</label>
              <div className={styles.toggleRow}>
                <button
                  className={`${styles.toggleBtn} ${position === "bottom-right" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setPosition("bottom-right")}
                >
                  Bottom-Right
                </button>
                <button
                  className={`${styles.toggleBtn} ${position === "bottom-left" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setPosition("bottom-left")}
                >
                  Bottom-Left
                </button>
              </div>
            </div>

            {/* Live Interactive Preview Trigger */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Interactive Sandbox Preview</label>
              <button
                className={`comic-btn ${styles.toggleBtnActive}`}
                style={{ width: "100%", padding: "0.6rem", background: color, color: "#fff", borderColor: color }}
                onClick={() => setPreviewOpen(!previewOpen)}
              >
                {previewOpen ? "✕ Close Widget Preview" : "💬 Open Live Widget Preview"}
              </button>
            </div>

            <div className={styles.actionRow}>
              <MagneticButton strength={0.25}>
                <a href="/rag/app" className="comic-btn comic-btn-blue" style={{ textDecoration: "none", display: "inline-block" }}>
                  🚀 Launch SaaS Studio to Test Live
                </a>
              </MagneticButton>
            </div>
          </div>

          {/* Right: Code Block & Visual Preview */}
          <div className={styles.customizerCodeBox}>
            <div className={styles.codeSnippetHeader}>
              <span>embed-code.html</span>
              <button className={`comic-btn ${styles.copyBtn}`} onClick={handleCopy}>
                {copied ? "✓ Copied!" : "Copy Snippet"}
              </button>
            </div>
            <pre className={styles.heroCodeBlock}>
              <code>{snippet}</code>
            </pre>
            <div className={styles.codeNote}>
              💡 Paste this single snippet before the closing <code>&lt;/body&gt;</code> tag on any website, Shopify store, or WordPress site.
            </div>

            {/* Embedded Mini-Preview Card */}
            {previewOpen && (
              <div
                style={{
                  marginTop: "1.25rem",
                  background: "var(--surface-card)",
                  border: `2px solid ${color}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-comic-md)",
                }}
              >
                <div
                  style={{
                    background: color,
                    color: "#ffffff",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  <span>💬 {botName}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>● Online</span>
                </div>
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.825rem" }}>
                  <div
                    style={{
                      background: "var(--surface-secondary)",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      maxWidth: "85%",
                      lineHeight: 1.5,
                    }}
                  >
                    👋 Hello! I am your AI concierge. Ask me anything about our enterprise architecture, pricing, or documentation.
                  </div>
                  <div
                    style={{
                      background: color,
                      color: "#ffffff",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      maxWidth: "85%",
                      alignSelf: "flex-end",
                      lineHeight: 1.5,
                    }}
                  >
                    What are your security SLAs?
                  </div>
                  <div
                    style={{
                      background: "var(--surface-secondary)",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "8px",
                      maxWidth: "85%",
                      lineHeight: 1.5,
                    }}
                  >
                    We offer 99.9% uptime SLAs with PostgreSQL Row-Level Security (RLS) and cryptographic SHA-256 audit chains.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
