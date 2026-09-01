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
  const [maxSteps, setMaxSteps] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RlmExecutionResponse | null>(null);
  const [selectedTurn, setSelectedTurn] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"summary" | "code" | "console">("summary");
  const [copied, setCopied] = useState(false);

  if (hidden) return null;

  const handleExecute = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() || !client || loading) return;
    setError("");
    setLoading(true);
    setResult(null);
    setSelectedTurn(0);
    setActiveTab("summary");

    try {
      const res = await client.executeRlmSubroutine(q, maxSteps);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "RLM Subroutine execution failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executions = result?.code_executions || [];
  const currentExecution = executions[selectedTurn] as Record<string, unknown> | undefined;
  const currentCode =
    typeof currentExecution?.code === "string"
      ? currentExecution.code
      : typeof currentExecution?.script === "string"
        ? currentExecution.script
        : "";
  const currentStdout =
    typeof currentExecution?.stdout === "string"
      ? currentExecution.stdout
      : typeof currentExecution?.output === "string"
        ? currentExecution.output
        : "";
  const currentResult =
    typeof currentExecution?.result === "string"
      ? currentExecution.result
      : typeof currentExecution?.return_value === "string"
        ? currentExecution.return_value
        : currentExecution?.return_value
          ? JSON.stringify(currentExecution.return_value, null, 2)
          : "";


  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>🐍 RLM Python REPL Studio</h2>
        <p className={styles.panelDesc}>
          Execute multi-step Recursive Language Model (RLM) subroutines inside a sandboxed Python REPL environment to traverse document vaults and synthesize complex multi-turn logic.
        </p>
      </div>

      {/* Preset Queries */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>
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
              className={styles.rlmPresetBtn}
            >
              ⚡ {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className={styles.rlmCard}>
        <label className={styles.label}>
          Subroutine Prompt / Analytical Directive:
        </label>
        <textarea
          className={styles.textarea}
          aria-label="RLM prompt or task directive"
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter directive for multi-turn Recursive Language Model execution..."
          disabled={loading || isExpired || !client}
          style={{ width: "100%", marginBottom: "1rem" }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Max Execution Turns:</label>
            <select
              value={maxSteps}
              aria-label="Maximum execution steps"
              onChange={(e) => setMaxSteps(Number(e.target.value))}
              disabled={loading || isExpired}
              className={styles.select}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
            >
              {[1, 2, 3, 5].map((num) => (
                <option key={num} value={num}>{num} {num === 1 ? "Turn (Direct)" : "Turns (Adaptive Loop)"}</option>
              ))}
            </select>
          </div>

          <button
            className={styles.buttonPrimary}
            onClick={() => handleExecute()}
            disabled={!query.trim() || loading || isExpired || !client}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
          >
            {loading ? "Executing Subroutine..." : "🚀 Run RLM REPL Loop"}
          </button>
        </div>
      </div>

      {/* Execution Error Banner */}
      {error && <p className={styles.error}>{error}</p>}

      {/* Execution Results */}
      {result && (
        <div className={styles.rlmCard}>
          {/* Telemetry Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className={styles.badgeGroundedExact}>✓ Subcalls: {result.subcalls_count ?? 1}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Time: {result.execution_time_ms}ms</span>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--color-link, #3b82f6)", background: "var(--surface-elevated)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "0.15rem 0.6rem" }}>
              🔒 Restricted AST REPL Sandbox
            </span>
          </div>

          {/* Turn Tabs (if multi-turn) */}
          {executions.length > 1 && (
            <div className={styles.rlmTurnTabContainer}>
              <span style={{ fontSize: "0.75rem", alignSelf: "center", color: "var(--color-text-muted)", marginRight: "0.25rem" }}>
                Execution Turns:
              </span>
              {executions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTurn(idx)}
                  className={`${styles.rlmTurnTab} ${selectedTurn === idx ? styles.rlmTurnTabActive : ""}`}
                >
                  Turn {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* View Mode Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button
              onClick={() => setActiveTab("summary")}
              className={`${styles.rlmTurnTab} ${activeTab === "summary" ? styles.rlmTurnTabActive : ""}`}
            >
              📊 Analysis Synthesis
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`${styles.rlmTurnTab} ${activeTab === "code" ? styles.rlmTurnTabActive : ""}`}
            >
              🐍 Generated Python Code
            </button>
            <button
              onClick={() => setActiveTab("console")}
              className={`${styles.rlmTurnTab} ${activeTab === "console" ? styles.rlmTurnTabActive : ""}`}
            >
              💻 REPL Console / Stdout
            </button>
          </div>

          {/* Tab Content 1: Synthesis Summary */}
          {activeTab === "summary" && (
            <div className={styles.rlmSummaryBox}>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", display: "block", marginBottom: "0.4rem" }}>
                Recursive RLM Synthesis Output:
              </span>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {result.analysis_summary || result.output || "(no summary returned)"}
              </p>
            </div>
          )}

          {/* Tab Content 2: Python Code */}
          {activeTab === "code" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  AST Code Snippet (Turn {selectedTurn + 1}):
                </span>
                {currentCode && (
                  <button
                    onClick={() => handleCopyCode(currentCode)}
                    className={styles.rlmPresetBtn}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Code"}
                  </button>
                )}
              </div>
              <pre className={styles.rlmCodeBlock}>
                {currentCode || "# No code recorded for this turn"}
              </pre>
            </div>
          )}

          {/* Tab Content 3: Console Output */}
          {activeTab === "console" && (
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.4rem" }}>
                Sandbox Stdout / Return Value:
              </span>
              <pre className={styles.rlmOutputTerminal}>
                {currentStdout || currentResult || result.output || "(no console stdout recorded)"}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
