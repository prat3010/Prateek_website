"use client";

import React, { useState, useEffect } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import styles from "./ragStyles";

interface CachePanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
}

export function CachePanel({ hidden, client }: CachePanelProps) {
  const [cachedVectors, setCachedVectors] = useState<number | null>(null);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!hidden && client) {
      client
        .getCacheStats()
        .then((stats) => {
          if (isMounted) {
            setCachedVectors(stats.total_vectors);
            setCacheError(null);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setCacheError(err instanceof Error ? err.message : "Failed to load cache telemetry.");
          }
        });
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
        <h2 className={styles.panelTitle}>⚡ Semantic Cache Management</h2>
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
            {cacheError && (
              <div style={{ color: "#FF1744", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                ⚠️ {cacheError}
              </div>
            )}
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

