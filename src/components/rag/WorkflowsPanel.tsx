"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  WorkflowExecution,
  WorkflowDefinition,
  WorkflowStepRecord,
  WorkflowStatus,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import TiltCard from "@/components/ui/TiltCard";
import Portal from "@/components/ui/Portal";
import styles from "./WorkflowsPanel.module.css";

interface WorkflowsPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
}

const DEFAULT_BLUEPRINTS: WorkflowDefinition[] = [
  {
    name: "vault_bulk_ingest",
    title: "Vault Bulk Ingest & Chunk Pipeline",
    description: "Ingest multi-file markdown/PDF vaults, extract text chunks, compute nomic-embed-text embeddings, and index into pgvector.",
    concurrency_limit: 2,
    max_step_retries: 3,
    backoff_factor: 2.0,
    initial_interval_seconds: 1.0,
    steps: [
      { name: "scan_documents", description: "Scan and checksum vault documents", max_attempts: 3, timeout_seconds: 60 },
      { name: "chunk_and_embed", description: "Split text into semantic chunks and compute embeddings", max_attempts: 3, timeout_seconds: 180 },
      { name: "index_vectors", description: "Persist chunks to PostgreSQL pgvector table", max_attempts: 3, timeout_seconds: 120 },
    ],
  },
  {
    name: "batch_graph_extraction",
    title: "Batch Graph Extraction Pipeline",
    description: "Extract named entities and semantic relationships across documents to build persistent GraphRAG knowledge structures.",
    concurrency_limit: 1,
    max_step_retries: 3,
    backoff_factor: 2.0,
    initial_interval_seconds: 1.0,
    steps: [
      { name: "extract_entities", description: "LLM extraction of domain entities and attributes", max_attempts: 3, timeout_seconds: 120 },
      { name: "link_relations", description: "Resolve cross-document relationships and edges", max_attempts: 3, timeout_seconds: 120 },
      { name: "build_graph_clusters", description: "Calculate community clusters and graph summarizations", max_attempts: 3, timeout_seconds: 120 },
    ],
  },
  {
    name: "synthetic_eval_generator",
    title: "Synthetic Q&A Eval Dataset Generator",
    description: "Generate synthetic question-answer-context triplets from document chunks for RAG triangulation and test evaluation.",
    concurrency_limit: 2,
    max_step_retries: 3,
    backoff_factor: 2.0,
    initial_interval_seconds: 1.0,
    steps: [
      { name: "sample_chunks", description: "Uniformly sample representative chunks", max_attempts: 3, timeout_seconds: 60 },
      { name: "synthesize_qa_pairs", description: "Generate diverse domain questions and answers", max_attempts: 3, timeout_seconds: 180 },
      { name: "filter_and_export", description: "Score quality and compile golden evaluation dataset", max_attempts: 3, timeout_seconds: 60 },
    ],
  },
  {
    name: "bulk_reembed_pipeline",
    title: "Semantic Cache Bulk Re-embedding",
    description: "Re-embed cached query vectors and re-index vector similarity indexes without service downtime.",
    concurrency_limit: 1,
    max_step_retries: 3,
    backoff_factor: 2.0,
    initial_interval_seconds: 1.0,
    steps: [
      { name: "fetch_cache_keys", description: "Query all stale semantic cache entries", max_attempts: 3, timeout_seconds: 60 },
      { name: "recompute_embeddings", description: "Batch recompute embeddings via local model", max_attempts: 3, timeout_seconds: 180 },
      { name: "update_cache_store", description: "Atomically commit updated vectors into database", max_attempts: 3, timeout_seconds: 60 },
    ],
  },
];

export function WorkflowsPanel({ hidden, client }: WorkflowsPanelProps) {
  const [blueprints, setBlueprints] = useState<WorkflowDefinition[]>(DEFAULT_BLUEPRINTS);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStepRecord | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Blueprint Launch Modal State
  const [launchModalBlueprint, setLaunchModalBlueprint] = useState<WorkflowDefinition | null>(null);
  const [launchPayloadStr, setLaunchPayloadStr] = useState<string>("{}");
  const [launchIdempotencyKey, setLaunchIdempotencyKey] = useState<string>("");
  const [launching, setLaunching] = useState<boolean>(false);

  const fetchBlueprintsAndExecutions = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      const [bpRes, execRes] = await Promise.all([
        client.listWorkflowBlueprints().catch(() => DEFAULT_BLUEPRINTS),
        client.listWorkflowExecutions({ limit: 50 }).catch(() => ({ items: [], total: 0, limit: 50, offset: 0 })),
      ]);
      if (bpRes && bpRes.length > 0) {
        setBlueprints(bpRes);
      }
      setExecutions(execRes.items || []);
    } catch (err) {
      console.warn("[WorkflowsPanel] Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client]);

  useEffect(() => {
    if (!hidden && client) {
      void fetchBlueprintsAndExecutions();
    }
  }, [hidden, client, fetchBlueprintsAndExecutions]);

  // Dynamic Polling: poll every 3 seconds if there are running or queued executions
  useEffect(() => {
    if (hidden || !client) return;

    const hasActiveJobs = executions.some(
      (e) => e.status === "running" || e.status === "queued"
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      client
        .listWorkflowExecutions({ limit: 50 })
        .then((res) => {
          setExecutions(res.items || []);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [hidden, client, executions]);

  if (hidden) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlueprintsAndExecutions();
  };

  const handleOpenLaunchModal = (bp: WorkflowDefinition) => {
    setLaunchModalBlueprint(bp);
    setLaunchIdempotencyKey(`run_${bp.name}_${Date.now()}`);
    let defaultPayload: Record<string, unknown> = {};
    if (bp.name === "vault_bulk_ingest") {
      defaultPayload = { vault_path: "documents/enterprise_vault", batch_size: 20 };
    } else if (bp.name === "batch_graph_extraction") {
      defaultPayload = { cluster_threshold: 0.82, max_entities_per_chunk: 10 };
    } else if (bp.name === "synthetic_eval_generator") {
      defaultPayload = { num_samples: 15, difficulty: "hard" };
    } else if (bp.name === "bulk_reembed_pipeline") {
      defaultPayload = { reembed_threshold: 0.95, force_refresh: true };
    }
    setLaunchPayloadStr(JSON.stringify(defaultPayload, null, 2));
  };

  const handleExecuteLaunch = async () => {
    if (!client || !launchModalBlueprint || launching) return;
    setLaunching(true);
    setActionNotice(null);
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(launchPayloadStr);
      } catch {
        throw new Error("Invalid JSON input payload");
      }

      const exec = await client.startWorkflow(
        launchModalBlueprint.name,
        parsedPayload,
        launchIdempotencyKey.trim() || undefined
      );

      setExecutions((prev) => [exec, ...prev]);
      setSelectedExecutionId(exec.execution_id);
      setLaunchModalBlueprint(null);
      setActionNotice({
        type: "success",
        message: `Workflow "${launchModalBlueprint.title}" successfully queued with ID: ${exec.execution_id.slice(0, 8)}...`,
      });
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to start workflow",
      });
    } finally {
      setLaunching(false);
    }
  };

  const handleRetryExecution = async (e: React.MouseEvent, execId: string) => {
    e.stopPropagation();
    if (!client) return;
    try {
      const updated = await client.retryWorkflowExecution(execId);
      setExecutions((prev) =>
        prev.map((item) => (item.execution_id === execId ? updated : item))
      );
      setActionNotice({
        type: "success",
        message: `Execution ${execId.slice(0, 8)} resumed from last completed checkpoint!`,
      });
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Retry failed",
      });
    }
  };

  const handleCancelExecution = async (e: React.MouseEvent, execId: string) => {
    e.stopPropagation();
    if (!client) return;
    try {
      const updated = await client.cancelWorkflowExecution(execId);
      setExecutions((prev) =>
        prev.map((item) => (item.execution_id === execId ? updated : item))
      );
      setActionNotice({
        type: "success",
        message: `Execution ${execId.slice(0, 8)} cancelled.`,
      });
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Cancel failed",
      });
    }
  };

  // Derived Metrics for KPI cards
  const totalExecutions = executions.length;
  const activeJobs = executions.filter(
    (e) => e.status === "running" || e.status === "queued"
  ).length;
  const completedStepsTotal = executions.reduce(
    (acc, curr) => acc + (curr.completed_steps || 0),
    0
  );
  // Estimate cache hits / memoized steps
  const memoizedCacheHits = executions.reduce((acc, curr) => {
    const hits = (curr.step_history || []).filter(
      (s) => s.status === "completed" && s.execution_time_ms < 5
    ).length;
    return acc + hits;
  }, 0);

  const filteredExecutions = executions.filter((e) => {
    if (statusFilter === "all") return true;
    return e.status === statusFilter;
  });

  const selectedExecution = executions.find(
    (e) => e.execution_id === selectedExecutionId
  ) || executions[0] || null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>⚡</span> Durable Asynchronous Execution & Background AI Workflows
          </h2>
          <p className={styles.description}>
            Step-level memoization, resilient automatic retry backoff, and idempotent checkpoint state machines across distributed AI pipelines.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.statusBadge}>
            <span className={styles.statusDot} />
            Platform Battery #15 Active
          </span>
          <button
            className={styles.actionBtn}
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? "Refreshing…" : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div
          className={
            actionNotice.type === "error"
              ? styles.errorBanner
              : styles.statusBadge
          }
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 1rem",
            width: "100%",
          }}
        >
          <span>{actionNotice.message}</span>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              fontWeight: "bold",
            }}
            onClick={() => setActionNotice(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <TiltCard maxAngle={2} glare={false}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>
              <span>📋</span> Total Executions
            </div>
            <div className={styles.kpiValue}>
              <NumberFlow value={totalExecutions} />
            </div>
            <div className={styles.kpiSub}>Tracked workflow runs</div>
          </div>
        </TiltCard>

        <TiltCard maxAngle={2} glare={false}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>
              <span>⚡</span> In-Flight Active Jobs
            </div>
            <div className={styles.kpiValue} style={{ color: activeJobs > 0 ? "var(--pop-amber, #f59e0b)" : undefined }}>
              <NumberFlow value={activeJobs} />
            </div>
            <div className={styles.kpiSub}>Queued & running background workers</div>
          </div>
        </TiltCard>

        <TiltCard maxAngle={2} glare={false}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>
              <span>✓</span> Completed Checkpoints
            </div>
            <div className={styles.kpiValue} style={{ color: "var(--pop-green, #10b981)" }}>
              <NumberFlow value={completedStepsTotal} />
            </div>
            <div className={styles.kpiSub}>Idempotent state checkpoints saved</div>
          </div>
        </TiltCard>

        <TiltCard maxAngle={2} glare={false}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>
              <span>🎯</span> Checkpoint Cache Hits
            </div>
            <div className={styles.kpiValue} style={{ color: "var(--color-link, #2563eb)" }}>
              <NumberFlow value={memoizedCacheHits} />
            </div>
            <div className={styles.kpiSub}>Zero-cost step replays</div>
          </div>
        </TiltCard>
      </div>

      {/* Prepackaged Blueprints Section */}
      <div>
        <h3 className={styles.sectionTitle}>
          <span>🚀</span> Pre-Packaged AI Workflow Blueprints
        </h3>
        <div className={styles.blueprintGrid}>
          {blueprints.map((bp) => (
            <div key={bp.name} className={styles.blueprintCard}>
              <div className={styles.blueprintHeader}>
                <div>
                  <div className={styles.blueprintName}>{bp.title}</div>
                  <div className={styles.blueprintDesc}>{bp.description}</div>
                </div>
              </div>

              <div className={styles.stepsTimelineMini}>
                {bp.steps.map((s, idx) => (
                  <React.Fragment key={s.name}>
                    <span className={styles.miniStepTag}>{s.name}</span>
                    {idx < bp.steps.length - 1 && <span className={styles.miniArrow}>➔</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className={styles.blueprintMeta}>
                <span className={styles.metaPill}>
                  🔄 Retries: {bp.max_step_retries}x
                </span>
                <span className={styles.metaPill}>
                  ⏱️ Backoff: {bp.backoff_factor}x
                </span>
                <span className={styles.metaPill}>
                  🔒 Concurrency: {bp.concurrency_limit}
                </span>
              </div>

              <div className={styles.blueprintCardActions}>
                <MagneticButton strength={0.25}>
                  <button
                    className={styles.primaryBtn}
                    onClick={() => handleOpenLaunchModal(bp)}
                  >
                    <span>▶</span> Launch Blueprint
                  </button>
                </MagneticButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executions Ledger Table */}
      <div className={styles.ledgerContainer}>
        <div className={styles.ledgerHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              <span>📜</span> Workflow Execution Ledger
            </h3>
            <span className={styles.codePill}>{filteredExecutions.length} jobs</span>
          </div>

          <div className={styles.filterTabs}>
            {["all", "running", "completed", "failed", "cancelled"].map((filterKey) => (
              <button
                key={filterKey}
                className={`${styles.filterTab} ${statusFilter === filterKey ? styles.filterTabActive : ""}`}
                onClick={() => setStatusFilter(filterKey)}
              >
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredExecutions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <div>No {statusFilter !== "all" ? statusFilter : ""} workflow executions found.</div>
            <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
              Launch a blueprint above to trigger asynchronous execution.
            </div>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Execution ID</th>
                  <th className={styles.th}>Workflow</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Progress</th>
                  <th className={styles.th}>Started</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((exec) => {
                  const isSelected = selectedExecution?.execution_id === exec.execution_id;
                  const pct =
                    exec.total_steps > 0
                      ? Math.round((exec.completed_steps / exec.total_steps) * 100)
                      : 0;

                  return (
                    <tr
                      key={exec.execution_id}
                      className={`${styles.tr} ${isSelected ? styles.trActive : ""}`}
                      onClick={() => setSelectedExecutionId(exec.execution_id)}
                    >
                      <td className={styles.td}>
                        <span className={styles.codePill}>
                          {exec.execution_id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className={styles.td}>
                        <strong>{exec.workflow_name}</strong>
                      </td>
                      <td className={styles.td}>
                        {renderStatusBadge(exec.status, exec.current_step_name)}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.progressBarOuter}>
                          <div
                            className={styles.progressBarInner}
                            style={{
                              width: `${pct}%`,
                              background:
                                exec.status === "failed"
                                  ? "#ef4444"
                                  : exec.status === "completed"
                                  ? "#10b981"
                                  : undefined,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {exec.completed_steps} / {exec.total_steps}
                        </span>
                      </td>
                      <td className={styles.td} style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {formatTime(exec.started_at)}
                      </td>
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          {(exec.status === "failed" || exec.status === "cancelled") && (
                            <button
                              className={styles.actionBtn}
                              style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem" }}
                              onClick={(e) => handleRetryExecution(e, exec.execution_id)}
                              title="Resume from last checkpoint"
                            >
                              🔄 Resume
                            </button>
                          )}
                          {(exec.status === "running" || exec.status === "queued") && (
                            <button
                              className={styles.actionBtn}
                              style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem", color: "#ef4444" }}
                              onClick={(e) => handleCancelExecution(e, exec.execution_id)}
                              title="Cancel execution"
                            >
                              ⏹ Stop
                            </button>
                          )}
                          <button
                            className={styles.actionBtn}
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem" }}
                            onClick={() => setSelectedExecutionId(exec.execution_id)}
                          >
                            Inspect DAG
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Execution Visual Step DAG Timeline */}
      {selectedExecution && (
        <div className={styles.detailSection}>
          <div className={styles.detailHeader}>
            <div>
              <h3 className={styles.sectionTitle} style={{ margin: "0 0 0.25rem" }}>
                <span>🧬</span> Execution Step DAG: {selectedExecution.workflow_name}
              </h3>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                ID: <span className={styles.codePill}>{selectedExecution.execution_id}</span> •
                Idempotency Key: {selectedExecution.idempotency_key || "None"} •
                Started: {formatTime(selectedExecution.started_at)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(selectedExecution.status === "failed" || selectedExecution.status === "cancelled") && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => handleRetryExecution(e, selectedExecution.execution_id)}
                >
                  🔄 Resume / Retry Pipeline
                </button>
              )}
            </div>
          </div>

          {selectedExecution.error_message && (
            <div className={styles.errorBanner}>
              <strong>Pipeline Failure:</strong> {selectedExecution.error_message}
            </div>
          )}

          {/* Visual Step Nodes */}
          <div className={styles.dagTimeline}>
            {(selectedExecution.step_history || []).length > 0 ? (
              selectedExecution.step_history.map((step, idx, arr) => {
                const isStepCompleted = step.status === "completed";
                const isStepRunning = step.status === "running";
                const isStepFailed = step.status === "failed";

                return (
                  <React.Fragment key={step.step_id || step.step_name}>
                    <div
                      className={`${styles.dagNode} ${
                        isStepCompleted
                          ? styles.dagNodeCompleted
                          : isStepRunning
                          ? styles.dagNodeRunning
                          : isStepFailed
                          ? styles.dagNodeFailed
                          : styles.dagNodePending
                      } ${selectedStep?.step_id === step.step_id ? styles.dagNodeSelected : ""}`}
                      onClick={() => setSelectedStep(step)}
                    >
                      <div className={styles.nodeTitle} title={step.step_name}>
                        {isStepCompleted ? "✓ " : isStepRunning ? "🔄 " : isStepFailed ? "✕ " : "⏳ "}
                        {step.step_name}
                      </div>
                      <div className={styles.nodeMeta}>
                        <span>Attempt {step.attempts}/{step.max_attempts}</span>
                        <span>{step.execution_time_ms ? `${step.execution_time_ms.toFixed(1)}ms` : "—"}</span>
                      </div>
                      {step.memoized_output && Object.keys(step.memoized_output).length > 0 && (
                        <div style={{ fontSize: "0.65rem", color: "var(--color-link, #2563eb)", fontWeight: 600 }}>
                          💾 State Checkpointed
                        </div>
                      )}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={styles.dagConnector}>➔</div>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <div style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                Steps will appear as checkpoints execute in background.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step Detail Drawer — Wrapped in Portal to escape containing block */}
      {selectedStep && (
        <Portal>
          <div className={styles.drawerOverlay} onClick={() => setSelectedStep(null)}>
            <div
              className={styles.drawerContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h4 className={styles.drawerTitle}>Step Checkpoint Inspector</h4>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {selectedStep.step_name} (Index #{selectedStep.step_index})
                  </div>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedStep(null)}
                >
                  ✕
                </button>
              </div>

              <div>
                <strong>Status:</strong>{" "}
                <span className={styles.codePill}>{selectedStep.status.toUpperCase()}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Attempts:</span>{" "}
                  <strong>{selectedStep.attempts} / {selectedStep.max_attempts}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Duration:</span>{" "}
                  <strong>{selectedStep.execution_time_ms.toFixed(1)} ms</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Started:</span>{" "}
                  {selectedStep.started_at ? formatTime(selectedStep.started_at) : "—"}
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Completed:</span>{" "}
                  {selectedStep.completed_at ? formatTime(selectedStep.completed_at) : "—"}
                </div>
              </div>

              {selectedStep.error_details && (
                <div className={styles.errorBanner}>
                  <strong>Error Trace:</strong>
                  <pre style={{ margin: "0.35rem 0 0", fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                    {selectedStep.error_details}
                  </pre>
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <strong style={{ fontSize: "0.8125rem" }}>Memoized Checkpoint Output:</strong>
                  <button
                    className={styles.actionBtn}
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}
                    onClick={() => {
                      void navigator.clipboard.writeText(JSON.stringify(selectedStep.memoized_output, null, 2));
                    }}
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className={styles.jsonBox}>
                  {JSON.stringify(selectedStep.memoized_output || {}, null, 2)}
                </pre>
              </div>

              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setSelectedStep(null)}
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Blueprint Launch Modal — Wrapped in Portal */}
      {launchModalBlueprint && (
        <Portal>
          <div className={styles.drawerOverlay} onClick={() => setLaunchModalBlueprint(null)}>
            <div
              className={styles.drawerContent}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "560px" }}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h4 className={styles.drawerTitle}>Launch Blueprint</h4>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {launchModalBlueprint.title}
                  </div>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setLaunchModalBlueprint(null)}
                >
                  ✕
                </button>
              </div>

              <div>
                <label className={styles.kpiLabel} style={{ marginBottom: "0.35rem" }}>
                  Idempotency Key (Optional)
                </label>
                <input
                  type="text"
                  value={launchIdempotencyKey}
                  onChange={(e) => setLaunchIdempotencyKey(e.target.value)}
                  placeholder="e.g. run_vault_bulk_ingest_12345"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    background: "var(--surface-elevated)",
                    color: "var(--color-text)",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                />
              </div>

              <div>
                <label className={styles.kpiLabel} style={{ marginBottom: "0.35rem" }}>
                  Input Payload (JSON)
                </label>
                <textarea
                  rows={8}
                  value={launchPayloadStr}
                  onChange={(e) => setLaunchPayloadStr(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid var(--color-border)",
                    background: "var(--surface-elevated)",
                    color: "var(--color-text)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono, monospace)",
                    lineHeight: 1.4,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "auto" }}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setLaunchModalBlueprint(null)}
                  disabled={launching}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleExecuteLaunch}
                  disabled={launching}
                >
                  {launching ? "Starting Pipeline…" : "▶ Execute Pipeline"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function renderStatusBadge(status: WorkflowStatus, currentStep?: string | null) {
  switch (status) {
    case "running":
      return (
        <span className={styles.badgeRunning}>
          <span className={styles.badgePulse} />
          Running {currentStep ? `(${currentStep})` : ""}
        </span>
      );
    case "completed":
      return (
        <span className={styles.badgeCompleted}>
          ✓ Completed
        </span>
      );
    case "failed":
      return (
        <span className={styles.badgeFailed}>
          ✕ Failed
        </span>
      );
    case "queued":
      return (
        <span className={styles.badgeQueued}>
          ⏳ Queued
        </span>
      );
    case "cancelled":
      return (
        <span className={styles.badgeCancelled}>
          ⊘ Cancelled
        </span>
      );
    default:
      return <span className={styles.codePill}>{status}</span>;
  }
}

function formatTime(isoStr?: string | null) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return isoStr;
  }
}
