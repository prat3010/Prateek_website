"use client";

import { useState } from "react";
import styles from "./rag.module.css";

export function InteractiveWidgetCustomizer() {
  const [color, setColor] = useState("#2563eb");
  const [botName, setBotName] = useState("AI Support Assistant");
  const [position, setPosition] = useState("bottom-right");
  const [copied, setCopied] = useState(false);
  const [widgetMounted, setWidgetMounted] = useState(false);

  const snippet = `<script
  src="https://prateeq.in/widget.js"
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

  const handleTestLive = () => {
    if (document.getElementById("retriever-widget-host")) {
      document.getElementById("retriever-widget-host")?.remove();
      // Reset loaded flag
      // @ts-expect-error global flag reset
      delete window.__RETRIEVER_WIDGET_LOADED__;
    }

    const script = document.createElement("script");
    script.src = "/widget.js";
    script.setAttribute("data-tenant", "00000000-0000-0000-0000-000000000000");
    script.setAttribute("data-key", "ret_live_GuestAccessKey2026.ReadOnlyChat");
    script.setAttribute("data-color", color);
    script.setAttribute("data-title", botName);
    script.setAttribute("data-position", position);
    document.body.appendChild(script);
    setWidgetMounted(true);
  };

  return (
    <section className={styles.customizerSection} id="widget-builder">
      <div className={styles.customizerContainer}>
        <div className={styles.customizerHeader}>
          <span className={styles.customizerBadge}>🎨 No-Code Widget Configurator</span>
          <h2 className={styles.customizerTitle}>Customize & Preview Your Live Widget</h2>
          <p className={styles.customizerSubtitle}>
            Configure colors, branding, and placement in seconds. Test the widget directly on this page or copy the 1-line script for your website.
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
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={color}
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

            <div className={styles.actionRow}>
              <button className="comic-btn comic-btn-blue" onClick={handleTestLive}>
                {widgetMounted ? "⚡ Refresh Live Widget" : "🚀 Test Live Widget on Page"}
              </button>
            </div>
          </div>

          {/* Right: Code Block */}
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
          </div>
        </div>
      </div>
    </section>
  );
}
