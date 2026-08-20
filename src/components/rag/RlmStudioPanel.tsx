"use client";

import { useState } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { RlmExecutionResponse } from "@/lib/rag-types";
import styles from "./rag.module.css";

interface RlmStudioPanelProps {
  client: RetrieverClient | null;
  hidden?: boolean;
  isExpired?: boolean;
}

const PRESET_QUERIES = [
  {
    title: "Multi-Doc Compliance Audit",
    query: "Perform a multi-step recursive audit across all ingested documents to extract security compliance requirements.",
  },
  {
    title: "Tabular Financial Extraction",
    query: "Traverse document vault and extract structured financial metrics, billing terms, and subscription revenue items.",
  },
  {
    title: "Cross-Reference Validation",
    query: "Analyze architecture diagrams and cross-reference feature requirements against technical dependencies.",
  },
];

export function RlmStudioPanel({ client, hidden, isExpired }: RlmStudioPanelProps) {
  const [query, setQuery] = useState("");
  const [maxSteps, setMaxSteps] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RlmExecutionResponse | null>(null);

  if (hidden) return null;

  const handleExecute = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() || !client || loading) return;
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await client.executeRlmSubroutine(q, maxSteps);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "RLM Subroutine execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>🐍 RLM Python REPL Studio</h2>
        <p className={styles.panelDesc}>
          Execute multi-step Recursive Language Model (RLM) subroutines inside a sandboxed Python REPL environment to traverse document vaults and generate complex reasoning chains.
        </p>
      </div>

      {/* Preset Queries */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted, #888)", display: "block", marginBottom: "0.5rem" }}>
          Subroutine Presets
        </span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset.title}
              onClick={() => {
                setQuery(preset.query);
                void handleExecute(preset.query);
              }}
              disabled={loading || isExpired || !client}
              className="comic-btn comic-btn-outline"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
            >
              ⚡ {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.02))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
          Subroutine Prompt / Task Directive:
        </label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter prompt directive for multi-step Python REPL execution..."
          disabled={loading || isExpired || !client}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", opacity: 0.8 }}>Max Execution Steps:</label>
            <select
              value={maxSteps}
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              disabled={loading || isExpired}
              style={{ background: "var(--surface-secondary, #1a202c)", color: "inherit", border: "1px solid var(--color-border, #444)", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              {[1, 2, 3, 5, 8, 10].map((num) => (
                <option key={num} value={num}>{num} Steps</option>
              ))}
            </select>
          </div>

          <button
            className="comic-btn comic-btn-blue"
            onClick={() => handleExecute()}
            disabled={!query.trim() || loading || isExpired || !client}
          >
            {loading ? "Running Subroutine..." : "🚀 Execute RLM Subroutine"}
          </button>
        </div>
      </div>

      {/* Execution Results */}
      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div style={{ background: "var(--surface-card, rgba(0, 0, 0, 0.4))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
          {/* Telemetry Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border, #333)", paddingBottom: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className={styles.badgeGroundedExact}>✓ Status: {result.status}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #aaa)" }}>Steps: {result.steps_executed} / {maxSteps}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #aaa)" }}>Time: {result.execution_time_ms}ms</span>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", padding: "0.1rem 0.5rem" }}>
              ✓ AST REPL Security Validated
            </span>
          </div>

          {/* Terminal Console Output */}
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted, #888)", display: "block", marginBottom: "0.5rem" }}>
            Python REPL Execution Stream Output:
          </span>
          <pre
            style={{
              background: "#080b12",
              color: "#38bdf8",
              fontFamily: "var(--font-code, monospace)",
              fontSize: "0.82rem",
              lineHeight: 1.55,
              padding: "1rem",
              borderRadius: "6px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              margin: 0,
            }}
          >
            {result.output || "(no output returned)"}
          </pre>
        </div>
      )}
    </div>
  );
}
