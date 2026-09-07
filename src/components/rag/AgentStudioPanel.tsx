"use client";

import React, { useState, useEffect } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import {
  ToolDefinition,
  AgentExecutionResult,
  HITLApprovalRequest,
  ThreadHistoryResponse,
  ThreadCheckpointItem,
} from "@/lib/rag-types";
import Portal from "@/components/ui/Portal";
import styles from "./rag.module.css";

interface AgentStudioPanelProps {
  client: RetrieverClient | null;
  hidden?: boolean;
  isExpired?: boolean;
}

const FALLBACK_TOOLS: ToolDefinition[] = [
  { name: "calculator", description: "Safe math evaluator", category: "math", requires_approval: false, risk_level: "low" },
  { name: "hybrid_search", description: "Dense-sparse vector search across knowledge base", category: "retrieval", requires_approval: false, risk_level: "low" },
  { name: "document_reader", description: "Read chunk or document text", category: "retrieval", requires_approval: false, risk_level: "low" },
  { name: "system_metrics", description: "Inspect tenant usage and quota metrics", category: "system", requires_approval: false, risk_level: "low" },
  { name: "document_delete", description: "Permanently delete document from knowledge base", category: "destructive", requires_approval: true, risk_level: "high" },
  { name: "tenant_prompt_update", description: "Hot-reload active system prompt template", category: "configuration", requires_approval: true, risk_level: "high" },
  { name: "api_key_revoke", description: "Instantly revoke tenant API key", category: "security", requires_approval: true, risk_level: "critical" },
];

export function AgentStudioPanel({ client, hidden, isExpired }: AgentStudioPanelProps) {
  const [tools, setTools] = useState<ToolDefinition[]>(FALLBACK_TOOLS);
  const [selectedTools, setSelectedTools] = useState<string[]>(FALLBACK_TOOLS.map((t) => t.name));
  const [prompt, setPrompt] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<AgentExecutionResult | null>(null);

  // HITL State
  const [pendingApproval, setPendingApproval] = useState<HITLApprovalRequest | null>(null);
  const [modifiedArgsJson, setModifiedArgsJson] = useState<string>("");
  const [approvalComment, setApprovalComment] = useState<string>("");
  const [resolvingApproval, setResolvingApproval] = useState(false);

  // Time-Travel History State
  const [history, setHistory] = useState<ThreadHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<ThreadCheckpointItem | null>(null);



  useEffect(() => {
    if (hidden || !client) return;
    let active = true;

    client
      .listAgentTools()
      .then((data) => {
        if (!active || !data || data.length === 0) return;
        setTools(data);
        setSelectedTools(data.map((t) => t.name));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [hidden, client]);

  const toggleTool = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName]
    );
  };

  // Execute Agent Workflow
  const handleExecute = async (presetPrompt?: string) => {
    const targetPrompt = presetPrompt || prompt;
    if (!targetPrompt.trim() || !client || running) return;

    setError(null);
    setRunning(true);
    setExecutionResult(null);
    setPendingApproval(null);

    try {
      const res = await client.executeAgentWorkflow(targetPrompt, {
        threadId: activeThreadId || undefined,
        maxSteps: 10,
        allowedTools: selectedTools,
      });

      setExecutionResult(res);
      setActiveThreadId(res.thread_id);

      if (res.status === "waiting_approval" && res.pending_approval) {
        setPendingApproval(res.pending_approval);
        setModifiedArgsJson(JSON.stringify(res.pending_approval.arguments, null, 2));
        setApprovalComment("");
      }

      // Refresh checkpoint timeline
      void fetchHistory(res.thread_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent workflow failed");
    } finally {
      setRunning(false);
    }
  };

  // Resume HITL Workflow
  const handleResolveApproval = async (decision: "approve" | "reject") => {
    if (!client || !pendingApproval || !activeThreadId || resolvingApproval) return;
    setResolvingApproval(true);
    setError(null);

    try {
      let modifiedArgs: Record<string, unknown> | undefined = undefined;
      if (decision === "approve" && modifiedArgsJson.trim()) {
        try {
          modifiedArgs = JSON.parse(modifiedArgsJson);
        } catch {
          throw new Error("Invalid JSON in modified arguments editor");
        }
      }

      const res = await client.resumeAgentWorkflow(activeThreadId, {
        action_id: pendingApproval.action_id,
        decision,
        modified_arguments: modifiedArgs,
        comment: approvalComment.trim() || undefined,
      });

      setExecutionResult(res);
      setPendingApproval(null);

      if (res.status === "waiting_approval" && res.pending_approval) {
        setPendingApproval(res.pending_approval);
        setModifiedArgsJson(JSON.stringify(res.pending_approval.arguments, null, 2));
      }

      void fetchHistory(activeThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume agent workflow");
    } finally {
      setResolvingApproval(false);
    }
  };

  // Fetch Checkpoint History
  const fetchHistory = async (threadId: string) => {
    if (!client || !threadId) return;
    setLoadingHistory(true);
    try {
      const res = await client.getAgentThreadHistory(threadId);
      setHistory(res);
    } catch {
      // Ignore background history failure
    } finally {
      setLoadingHistory(false);
    }
  };

  // Rollback Checkpoint
  const handleRollback = async (checkpointId: string) => {
    if (!client || !activeThreadId) return;
    try {
      await client.rollbackAgentThread(activeThreadId, checkpointId, false);
      setSelectedCheckpoint(null);
      await fetchHistory(activeThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    }
  };

  if (hidden) return null;

  return (
    <div className={styles.panelContainer}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>LangGraph Agentic Orchestration Studio</h2>
          <p className={styles.panelSubtitle}>
            Stateful cyclic computation graphs with persistent checkpoints, Human-in-the-Loop (HITL) approval gateways, and time-travel rollbacks.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className={styles.badgeActive} style={{ fontSize: "11px" }}>
            M91 • v0.76.0
          </span>
          {activeThreadId && (
            <span className={styles.taglineChip} style={{ fontSize: "11px" }}>
              Thread: {activeThreadId.slice(0, 10)}…
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} style={{ marginTop: "12px" }}>
          <span>⚠️ {error}</span>
          <button className={styles.closeBtn} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Grid: Control & Tools vs Live Step Flow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", marginTop: "16px" }}>
        
        {/* Left Column: Configuration & Prompting */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Tool Whitelist Selector */}
          <div className={styles.featureCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                🛠️ Available Agent Toolbox ({tools.length})
              </h3>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {selectedTools.length} enabled
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
              {tools.map((tool) => {
                const isChecked = selectedTools.includes(tool.name);
                const isSensitive = tool.requires_approval;
                return (
                  <label
                    key={tool.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: isChecked ? "var(--surface-elevated, rgba(255,255,255,0.04))" : "transparent",
                      border: "1px solid var(--surface-glass-border, rgba(255,255,255,0.08))",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTool(tool.name)}
                        style={{ accentColor: "var(--app-accent, #38bdf8)" }}
                      />
                      <span style={{ fontWeight: 600, fontFamily: "var(--font-mono, monospace)" }}>
                        {tool.name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isSensitive ? (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: tool.risk_level === "critical" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)",
                            color: tool.risk_level === "critical" ? "#f87171" : "#fbbf24",
                            border: `1px solid ${tool.risk_level === "critical" ? "#f87171" : "#fbbf24"}`,
                          }}
                        >
                          HITL • {tool.risk_level.toUpperCase()}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(16,185,129,0.15)",
                            color: "#34d399",
                            border: "1px solid #34d399",
                          }}
                        >
                          AUTO
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Prompt Input & Quick Presets */}
          <div className={styles.featureCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label htmlFor="agent-task-input" style={{ fontSize: "13px", fontWeight: 700 }}>
                Objective / Multi-Step Task
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    setActiveThreadId("");
                    setExecutionResult(null);
                    setHistory(null);
                  }}
                  title="Reset active thread and start a fresh session"
                >
                  New Thread
                </button>
              </div>
            </div>

            <textarea
              id="agent-task-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Calculate 15% discount on $3500 and search our enterprise SLA terms..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--surface-glass-border, rgba(255,255,255,0.12))",
                background: "var(--surface-elevated, rgba(0,0,0,0.25))",
                color: "var(--color-text, #ffffff)",
                fontSize: "13px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />

            {/* Quick Demo Presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => {
                  const p = "Calculate 18% GST on $4500 and search our refund terms";
                  setPrompt(p);
                  void handleExecute(p);
                }}
              >
                Safe: Calc & Search
              </button>
              <button
                type="button"
                className={styles.copyBtn}
                style={{ borderColor: "#f59e0b", color: "#fbbf24" }}
                onClick={() => {
                  const p = "Delete obsolete document doc_audit_2024 from knowledge base";
                  setPrompt(p);
                  void handleExecute(p);
                }}
              >
                HITL Gate: Delete Document
              </button>
              <button
                type="button"
                className={styles.copyBtn}
                style={{ borderColor: "#ef4444", color: "#f87171" }}
                onClick={() => {
                  const p = "Revoke expired partner API key 'key_demo_staging'";
                  setPrompt(p);
                  void handleExecute(p);
                }}
              >
                Critical: Revoke API Key
              </button>
            </div>

            <button
              type="button"
              className="comic-btn comic-btn-blue"
              onClick={() => handleExecute()}
              disabled={running || isExpired || !prompt.trim()}
              style={{ width: "100%", marginTop: "14px", padding: "10px" }}
            >
              {running ? "Orchestrating Graph Steps…" : "Run Agentic Graph ➔"}
            </button>
          </div>

          {/* Time-Travel History Scrubber */}
          {history && history.checkpoints.length > 0 && (
            <div className={styles.featureCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>
                  ⏳ Time-Travel State Checkpoints ({history.checkpoints.length})
                </h3>
                {loadingHistory && <span style={{ fontSize: "10px" }}>Syncing…</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                {history.checkpoints.map((chk) => (
                  <div
                    key={chk.checkpoint_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "var(--surface-elevated, rgba(255,255,255,0.03))",
                      fontSize: "11px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--app-accent, #38bdf8)" }}>
                        Step {chk.step_index}
                      </span>{" "}
                      • <code style={{ fontSize: "10px" }}>{chk.node_name}</code>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        style={{ fontSize: "10px", padding: "2px 6px" }}
                        onClick={() => setSelectedCheckpoint(chk)}
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        style={{ fontSize: "10px", padding: "2px 6px", color: "#f59e0b" }}
                        onClick={() => handleRollback(chk.checkpoint_id)}
                      >
                        Rollback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Output & Cyclic Visualizer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Status & Metrics Bar */}
          <div className={styles.featureCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>Execution Trace</span>
                {executionResult && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      background:
                        executionResult.status === "completed"
                          ? "rgba(16,185,129,0.2)"
                          : executionResult.status === "waiting_approval"
                          ? "rgba(245,158,11,0.25)"
                          : "rgba(239,68,68,0.2)",
                      color:
                        executionResult.status === "completed"
                          ? "#34d399"
                          : executionResult.status === "waiting_approval"
                          ? "#fbbf24"
                          : "#f87171",
                    }}
                  >
                    {executionResult.status === "waiting_approval" ? "⏸️ WAITING FOR APPROVAL" : executionResult.status.toUpperCase()}
                  </span>
                )}
              </div>
              {executionResult && (
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {executionResult.total_steps} iterations • {executionResult.execution_time_ms}ms
                </span>
              )}
            </div>

            {/* Waiting Approval Alert Card */}
            {pendingApproval && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid #f59e0b",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>🛑</span>
                    <strong style={{ fontSize: "13px", color: "#fbbf24" }}>
                      Human Approval Required
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#f59e0b",
                      color: "#000",
                    }}
                  >
                    {pendingApproval.risk_level.toUpperCase()} RISK
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text)" }}>
                  {pendingApproval.description}
                </p>

                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Proposed Arguments:</span>
                  <pre
                    style={{
                      margin: "4px 0",
                      padding: "8px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {JSON.stringify(pendingApproval.arguments, null, 2)}
                  </pre>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="comic-btn comic-btn-blue"
                    style={{ background: "#10b981", borderColor: "#059669", color: "#fff", fontSize: "12px", padding: "6px 14px" }}
                    onClick={() => handleResolveApproval("approve")}
                    disabled={resolvingApproval}
                  >
                    {resolvingApproval ? "Resuming…" : "✓ Approve & Execute"}
                  </button>
                  <button
                    type="button"
                    className="comic-btn"
                    style={{ background: "#ef4444", borderColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "6px 14px" }}
                    onClick={() => handleResolveApproval("reject")}
                    disabled={resolvingApproval}
                  >
                    ✕ Reject Action
                  </button>
                </div>
              </div>
            )}

            {/* Step Trace Timeline */}
            <div
              style={{
                marginTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "440px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {!executionResult && !running && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                  Enter a task prompt or select a demo preset above to launch the cyclic agent graph.
                </div>
              )}

              {running && (
                <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--app-accent, #38bdf8)", fontSize: "13px" }}>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span> Orchestrating graph cycle…
                </div>
              )}

              {executionResult?.steps.map((step) => (
                <div
                  key={step.step_index}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--surface-elevated, rgba(255,255,255,0.03))",
                    border: "1px solid var(--surface-glass-border, rgba(255,255,255,0.08))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--app-accent, #38bdf8)" }}>
                      Iteration Step {step.step_index + 1}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {step.tool_calls.length} tool call(s)
                    </span>
                  </div>

                  {/* Thought */}
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", lineHeight: 1.5 }}>
                    <strong>Plan:</strong> {step.thought}
                  </p>

                  {/* Tool Invocations */}
                  {step.tool_calls.map((tc, idx) => (
                    <div
                      key={tc.call_id || idx}
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.2)",
                        marginTop: "6px",
                        fontSize: "11px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#a5f3fc" }}>
                          ⚡ {tc.tool_name}
                        </span>
                        <code style={{ fontSize: "10px" }}>{JSON.stringify(tc.arguments)}</code>
                      </div>

                      {/* Tool Observation */}
                      {step.tool_results[idx] && (
                        <div style={{ marginTop: "6px", color: step.tool_results[idx].is_error ? "#f87171" : "#86efac" }}>
                          <span>➔ Observation: </span>
                          <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                            {typeof step.tool_results[idx].output === "object"
                              ? JSON.stringify(step.tool_results[idx].output)
                              : String(step.tool_results[idx].output)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Final Synthesis Card */}
              {executionResult?.final_answer && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid #10b981",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", marginBottom: "6px" }}>
                    🎯 Final Synthesized Answer
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {executionResult.final_answer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoint Inspection Modal (Safe with <Portal>) */}
      {selectedCheckpoint && (
        <Portal>
          <div className={styles.modalOverlay} onClick={() => setSelectedCheckpoint(null)}>
            <div
              className={styles.modalCard}
              style={{ maxWidth: "550px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Checkpoint: {selectedCheckpoint.checkpoint_id}
                </h3>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setSelectedCheckpoint(null)}
                >
                  ✕
                </button>
              </div>

              <div style={{ margin: "16px 0", fontSize: "12px" }}>
                <p><strong>Graph Node:</strong> <code>{selectedCheckpoint.node_name}</code></p>
                <p><strong>Step Index:</strong> {selectedCheckpoint.step_index}</p>
                <p><strong>Captured Epoch:</strong> {new Date(selectedCheckpoint.created_at * 1000).toLocaleString()}</p>
                <p><strong>State Snapshot:</strong></p>
                <pre
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    padding: "10px",
                    background: "rgba(0,0,0,0.35)",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                >
                  {JSON.stringify(selectedCheckpoint.state_snapshot, null, 2)}
                </pre>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="comic-btn comic-btn-blue"
                  style={{ background: "#f59e0b", borderColor: "#d97706", fontSize: "12px" }}
                  onClick={() => handleRollback(selectedCheckpoint.checkpoint_id)}
                >
                  Rollback to this state
                </button>
                <button
                  type="button"
                  className="comic-btn"
                  onClick={() => setSelectedCheckpoint(null)}
                  style={{ fontSize: "12px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
