"use client";

import { useState, useEffect } from "react";
import { type RetrieverConfig } from "@/lib/rag-client";
import { useAuth } from "@/context/AuthContext";
import styles from "./rag.module.css";

interface TelemetryData {
  planTier: string;
  quotas: {
    maxMonthlyTokens: number;
    maxDocuments: number;
    maxStorageBytes: number;
  };
  usage: {
    monthlyTokensUsed: number;
    documentsCount: number;
    storageBytesUsed: number;
    tokenUsagePercentage: number;
    documentsPercentage: number;
    storagePercentage: number;
  };
  semanticCache: {
    cacheHits: number;
    latencySavedMs: number;
    costSavedUSD: number;
  };
  feedback: {
    thumbsUp: number;
    thumbsDown: number;
    totalFeedback: number;
    satisfactionRate: number;
  };
}

export function TelemetryPanel({
  config,
  hidden,
}: {
  config: RetrieverConfig | null;
  hidden: boolean;
}) {
  const { user, getAccessToken } = useAuth();
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hidden && user) {
      let ignore = false;
      (async () => {
        setLoading(true);
        try {
          const token = await getAccessToken();
          const headers: Record<string, string> = {};
          if (token) headers.Authorization = `Bearer ${token}`;

          const url = config?.tenantId
            ? `/api/rag/telemetry?tenantId=${encodeURIComponent(config.tenantId)}`
            : "/api/rag/telemetry";

          const res = await fetch(url, { headers });
          if (res.ok && !ignore) {
            const resData = await res.json();
            setData(resData);
          }
        } catch (err) {
          console.warn("Failed to fetch telemetry:", err);
        } finally {
          if (!ignore) setLoading(false);
        }
      })();

      return () => {
        ignore = true;
      };
    }
  }, [hidden, user, config, getAccessToken]);

  if (hidden) return null;

  function getBarColor(pct: number) {
    if (pct > 90) return "#ef4444"; // Red
    if (pct > 70) return "#f59e0b"; // Amber
    return "#10b981"; // Green
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Workspace Telemetry & Usage Analytics</h2>
      <p className={styles.panelDesc}>
        Real-time monitoring for monthly token budgets, storage limits, semantic cache savings, and quality ratings.
      </p>

      {!user ? (
        <p className={styles.connectFail}>
          ⚠️ Please sign in with Google to view your RAG workspace telemetry and quota usage.
        </p>
      ) : loading && !data ? (
        <p className={styles.panelDesc}>Loading workspace telemetry metrics…</p>
      ) : data ? (
        <div>
          {/* Plan Tier Banner */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--bg-card, #f8fafc)",
              border: "2px solid #000",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span className={styles.label} style={{ margin: 0 }}>
                Active Plan Tier
              </span>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", textTransform: "capitalize" }}>
                {data.planTier} Subscription
              </div>
            </div>
            <span
              style={{
                background: "#3b82f6",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: "bold",
              }}
            >
              Active
            </span>
          </div>

          {/* Token Usage Progress Meter */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span className={styles.label}>Monthly Token Budget</span>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                {data.usage.monthlyTokensUsed.toLocaleString()} / {data.quotas.maxMonthlyTokens.toLocaleString()} tokens ({data.usage.tokenUsagePercentage}%)
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "16px",
                background: "#e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #000",
              }}
            >
              <div
                style={{
                  width: `${data.usage.tokenUsagePercentage}%`,
                  height: "100%",
                  background: getBarColor(data.usage.tokenUsagePercentage),
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Storage and File Gauges Grid */}
          <div className={styles.row} style={{ marginBottom: "1.5rem" }}>
            <div>
              <span className={styles.label}>Indexed Documents Limit</span>
              <div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "4px" }}>
                {data.usage.documentsCount} / {data.quotas.maxDocuments.toLocaleString()} files ({data.usage.documentsPercentage}%)
              </div>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e2e8f0",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${data.usage.documentsPercentage}%`,
                    height: "100%",
                    background: getBarColor(data.usage.documentsPercentage),
                  }}
                />
              </div>
            </div>

            <div>
              <span className={styles.label}>Storage Volume Allocated</span>
              <div style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "4px" }}>
                {formatBytes(data.usage.storageBytesUsed)} / {formatBytes(data.quotas.maxStorageBytes)} ({data.usage.storagePercentage}%)
              </div>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "#e2e8f0",
                  borderRadius: "5px",
                  overflow: "hidden",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${data.usage.storagePercentage}%`,
                    height: "100%",
                    background: getBarColor(data.usage.storagePercentage),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Semantic Cache & Feedback Grid */}
          <div className={styles.row}>
            <div
              style={{
                padding: "12px",
                border: "2px solid #000",
                borderRadius: "8px",
                background: "#f0fdf4",
              }}
            >
              <span className={styles.label} style={{ color: "#166534" }}>
                ⚡ Semantic Vector Cache Efficiency
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#15803d", marginTop: "4px" }}>
                ${data.semanticCache.costSavedUSD.toFixed(2)} Saved
              </div>
              <p className={styles.panelDesc} style={{ fontSize: "0.8rem", margin: "4px 0 0 0" }}>
                {data.semanticCache.cacheHits} cached hits • ~{Math.round(data.semanticCache.latencySavedMs / 1000)}s latency saved
              </p>
            </div>

            <div
              style={{
                padding: "12px",
                border: "2px solid #000",
                borderRadius: "8px",
                background: "#eff6ff",
              }}
            >
              <span className={styles.label} style={{ color: "#1e40af" }}>
                👍 Response Satisfaction Rating
              </span>
              <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1d4ed8", marginTop: "4px" }}>
                {data.feedback.satisfactionRate}% Positive
              </div>
              <p className={styles.panelDesc} style={{ fontSize: "0.8rem", margin: "4px 0 0 0" }}>
                👍 {data.feedback.thumbsUp} Up • 👎 {data.feedback.thumbsDown} Down ({data.feedback.totalFeedback} rated)
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
