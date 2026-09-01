"use client";

import React, { useState, useEffect } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import styles from "./rag.module.css";

interface CachePanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
}

export function CachePanel({ hidden, client }: CachePanelProps) {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.95);
  const [cachedVectors, setCachedVectors] = useState<number | null>(null);
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!hidden && client) {
      client
        .getCacheStats()
        .then((stats) => {
          if (isMounted) setCachedVectors(stats.total_vectors);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [hidden, client]);


  if (hidden) return null;

  const handleFlushCache = async () => {
    if (!client || purging) return;
    setPurging(true);
    setPurgeMessage(null);
    try {
      const res = await client.purgeCache();
      setCachedVectors(0);
      setPurgeMessage(`✓ Successfully purged semantic cache (${res.deleted_count ?? 0} query vectors deleted).`);
    } catch (e: unknown) {
      setPurgeMessage(e instanceof Error ? e.message : "Cache purge failed");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>⚡ Sub-50ms Semantic Cache Management</h2>
        <p className={styles.panelDesc}>
          Save query latency and token financial costs by caching high-confidence query embeddings in PostgreSQL pgvector.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Cache Performance Card */}
        <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>📈 Active Cache Telemetry</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total Cached Embeddings:</span>
              <strong>{cachedVectors !== null ? `${cachedVectors} vectors` : "Checking pgvector..."}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cache Strategy:</span>
              <strong style={{ color: "#00E676" }}>pgvector HNSW Cosine Distance</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Cache TTL:</span>
              <strong>24 Hours (Rolling Expiry)</strong>
            </div>
          </div>
        </div>

        {/* Sensitivity Tuning Card */}
        <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>🎯 Similarity Hit Threshold</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: "0 0 1rem" }}>
            Controls the minimum vector similarity required to return an instantaneous cached answer before invoking the LLM.
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
          If knowledge base documents have been significantly updated, purge the semantic vector cache to ensure responses reflect latest documents.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleFlushCache}
            disabled={purging || !client}
            className="comic-btn comic-btn-outline"
            style={{ borderColor: "#FF1744", color: "#FF1744" }}
          >
            {purging ? "Purging Cache Vectors..." : "Purge Semantic Vector Cache"}
          </button>
          {purgeMessage && (
            <span style={{ fontSize: "0.8rem", color: purgeMessage.startsWith("✓") ? "#00E676" : "#FF1744" }}>
              {purgeMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

