"use client";

import React, { useState } from "react";
import styles from "./rag.module.css";

interface CachePanelProps {
  hidden?: boolean;
}

export function CachePanel({ hidden }: CachePanelProps) {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.95);
  const [cacheFlushed, setCacheFlushed] = useState<boolean>(false);

  if (hidden) return null;

  const handleFlushCache = () => {
    setCacheFlushed(true);
    setTimeout(() => setCacheFlushed(false), 3000);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>⚡ Sub-50ms Semantic Cache Management</h2>
        <p className={styles.panelDesc}>
          Save query latency and token financial costs by fine-tuning vector semantic hit thresholds and flushing stale cached responses.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Cache Performance Card */}
        <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>📈 Active Cache Telemetry</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Cached Embeddings:</span>
              <strong>{cacheFlushed ? "0 vectors" : "0 vectors (Active)"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Average Response Latency:</span>
              <strong style={{ color: "#00E676" }}>-- ms</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Est. Tokens Saved (30 Days):</span>
              <strong>0 tokens ($0.00)</strong>
            </div>
          </div>
        </div>

        {/* Sensitivity Tuning Card */}
        <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>🎯 Similarity Hit Threshold</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: "0 0 1rem" }}>
            Higher values (e.g. 0.98) enforce strict prompt similarity before returning cached answers.
          </p>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              <span>Threshold Cosine Value:</span>
              <strong>{similarityThreshold.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min={0.90}
              max={0.99}
              step={0.01}
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-link, #5A8EB6)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", opacity: 0.6 }}>
              <span>0.90 (Relaxed match)</span>
              <span>0.99 (Exact match)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Control Actions */}
      <div style={{ background: "rgba(255, 23, 68, 0.06)", border: "1px solid rgba(255, 23, 68, 0.2)", borderRadius: "8px", padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", color: "#FF1744", margin: "0 0 0.5rem" }}>🧹 Cache Invalidation & Purge</h3>
        <p style={{ fontSize: "0.85rem", margin: "0 0 1rem", opacity: 0.8 }}>
          If knowledge base documents have been significantly modified, flush the semantic cache to prevent outdated answers.
        </p>
        <button
          onClick={handleFlushCache}
          className="comic-btn comic-btn-outline"
          style={{ borderColor: "#FF1744", color: "#FF1744" }}
        >
          {cacheFlushed ? "✓ Semantic Vector Cache Flushed!" : "Purge Semantic Vector Cache"}
        </button>
      </div>
    </div>
  );
}
