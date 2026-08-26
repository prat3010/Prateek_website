"use client";

import { useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./rag.module.css";

export function InteractiveWidgetCustomizer() {
  const [color, setColor] = useState("#2563eb");
  const [botName, setBotName] = useState("Retriever Concierge");
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
    // A browser-visible demo key would be a public credential. The preview is
    // therefore deliberately kept credential-free; test the generated snippet
    // after creating a tenant-scoped API key in the studio.
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

            <div className={styles.actionRow}>
              <MagneticButton strength={0.25}>
                <button className="comic-btn comic-btn-blue" onClick={handleTestLive}>
                  {widgetMounted ? "✓ Configure a workspace to test" : "🔐 Test with your workspace key"}
                </button>
              </MagneticButton>
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
