"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  MemoryNode,
  MemoryStats,
  MemoryType,
  DistilledGuidance,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import TiltCard from "@/components/ui/TiltCard";
import styles from "./MemoryPanel.module.css";

interface MemoryPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
  tenantId?: string;
  isExpired?: boolean;
}

const DEMO_STATS: MemoryStats = {
  total_memories: 14,
  episodic_count: 8,
  semantic_count: 4,
  procedural_count: 2,
  avg_stability: 3.42,
  total_access_count: 47,
};

const DEMO_NODES: MemoryNode[] = [
  {
    id: "mem_demo_1",
    tenant_id: "demo_tenant",
    memory_type: "procedural",
    query: "Execute Python script to process user usage CSV",
    distilled_insight: "When task encounters KeyError on 'userId', self-healed by inspecting headers and using dict.get() fallback.",
    tool_chain: ["rlm_execute", "document_reader"],
    success: true,
    turns_count: 3,
    importance_score: 0.85,
    stability_score: 4.5,
    retention_score: 0.94,
    last_accessed_at: Date.now() / 1000 - 3600,
    access_count: 9,
    created_at: Date.now() / 1000 - 86400 * 3,
  },
  {
    id: "mem_demo_2",
    tenant_id: "demo_tenant",
    memory_type: "episodic",
    query: "Calculate enterprise volume discount pricing schedule",
    distilled_insight: "Successfully resolved via [retriever_search_hybrid -> calculator] applying 20% annual commit tier.",
    tool_chain: ["hybrid_search", "calculator"],
    success: true,
    turns_count: 2,
    importance_score: 0.75,
    stability_score: 2.8,
    retention_score: 0.88,
    last_accessed_at: Date.now() / 1000 - 7200,
    access_count: 6,
    created_at: Date.now() / 1000 - 86400 * 2,
  },
  {
    id: "mem_demo_3",
    tenant_id: "demo_tenant",
    memory_type: "semantic",
    query: "Traverse GraphRAG triples for multi-cloud quorum topology",
    distilled_insight: "Knowledge exploration for 'MultiCloud Consensus': resolved active nodes via [graph_query].",
    tool_chain: ["graph_query"],
    success: true,
    turns_count: 1,
    importance_score: 0.70,
    stability_score: 1.5,
    retention_score: 0.76,
    last_accessed_at: Date.now() / 1000 - 18000,
    access_count: 3,
    created_at: Date.now() / 1000 - 86400,
  },
];

export function MemoryPanel({
  hidden,
  client,
  tenantId,
  isExpired,
}: MemoryPanelProps) {
  const [stats, setStats] = useState<MemoryStats>(DEMO_STATS);
  const [nodes, setNodes] = useState<MemoryNode[]>(DEMO_NODES);
  const [activeFilter, setActiveFilter] = useState<"all" | MemoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Experience Simulator State
  const [simulatorQuery, setSimulatorQuery] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<DistilledGuidance | null>(null);

  const fetchMemoryData = useCallback(async () => {
    if (!client || !tenantId) return;
    try {
      setLoading(true);
      const [fetchedStats, fetchedNodes] = await Promise.all([
        client.getMemoryStats(),
        client.listMemoryNodes(),
      ]);
      setStats(fetchedStats);
      if (fetchedNodes && fetchedNodes.length > 0) {
        setNodes(fetchedNodes);
      }
    } catch (err) {
      console.warn("Using offline demo memory state:", err);
    } finally {
      setLoading(false);
    }
  }, [client, tenantId]);

  useEffect(() => {
    if (hidden || !client || !tenantId) return;
    let isMounted = true;
    Promise.all([client.getMemoryStats(), client.listMemoryNodes()])
      .then(([fetchedStats, fetchedNodes]) => {
        if (!isMounted) return;
        setStats(fetchedStats);
        if (fetchedNodes && fetchedNodes.length > 0) {
          setNodes(fetchedNodes);
        }
      })
      .catch((err) => {
        console.warn("Using offline demo memory state:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [hidden, client, tenantId]);

  const handleSimulateGuidance = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const query = simulatorQuery.trim();
    if (!query) return;

    if (!client || !tenantId) {
      // Offline fallback simulation
      setSimulating(true);
      setGuidanceResult({
        relevant_nodes: [
          {
            node: nodes[0],
            similarity_score: 0.86,
            retention_score: 0.94,
          },
        ],
        guidance_prompt: `DISTILLED EXPERIENCE FROM PRIOR SESSIONS:\n- [Strategy (PROCEDURAL, sim=0.86)]: ${nodes[0]?.distilled_insight || "Resolved task"} (Recommended Tool Path: rlm_execute -> document_reader)\nUse these proven historical patterns to prevent redundant tool errors.`,
        matched_tool_chains: [nodes[0]?.tool_chain || ["rlm_execute"]],
      });
      setSimulating(false);
      return;
    }

    try {
      setSimulating(true);
      const res = await client.testMemoryGuidance(simulatorQuery, 3, 0.40);
      setGuidanceResult(res);
    } catch (err) {
      setStatusMessage(`Simulation error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSimulating(false);
    }
  };

  const handlePruneDecayed = async () => {
    if (isExpired) return;
    if (!client || !tenantId) {
      setStatusMessage("Demo mode: 0 decayed memories (all currently retained).");
      return;
    }

    try {
      setPruning(true);
      const res = await client.pruneMemories(0.15);
      setStatusMessage(`Pruned ${res.pruned_count} decayed memory node(s) below retention threshold.`);
      await fetchMemoryData();
    } catch (err) {
      setStatusMessage(`Prune failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPruning(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (isExpired) return;
    if (!client || !tenantId) {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setStatusMessage(`Deleted memory node ${nodeId} (demo mode).`);
      return;
    }

    try {
      await client.deleteMemoryNode(nodeId);
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setStatusMessage(`Memory node ${nodeId} deleted.`);
      void fetchMemoryData();
    } catch (err) {
      setStatusMessage(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredNodes = nodes.filter((node) => {
    if (activeFilter !== "all" && node.memory_type !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.query.toLowerCase().includes(q) ||
        node.distilled_insight.toLowerCase().includes(q) ||
        node.tool_chain.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (hidden) return null;

  return (
    <div className={styles.container}>
      {/* Header Group */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🧠 Cognitive Agent Memory & Experience Distillation</span>
            <span className={styles.badgeMemory}>Milestone 108</span>
            <span className={styles.badgeEbbinghaus}>Ebbinghaus Active</span>
          </h2>
          <p className={styles.description}>
            Compresses multi-turn autonomous ReAct execution traces into high-signal episodic and procedural memory nodes.
            Learned tool heuristics prime future sessions while Ebbinghaus decay mathematically purges stale exploratory traces.
          </p>
        </div>

        <div className={styles.headerActions}>
          <MagneticButton strength={0.2}>
            <button
              type="button"
              className={styles.filterTab}
              onClick={() => void fetchMemoryData()}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "🔄 Refresh"}
            </button>
          </MagneticButton>

          <MagneticButton strength={0.25}>
            <button
              type="button"
              className={`${styles.filterTab} ${styles.filterTabActive}`}
              onClick={() => void handlePruneDecayed()}
              disabled={pruning || isExpired}
            >
              {pruning ? "Pruning…" : "🧹 Prune Decayed (R < 0.15)"}
            </button>
          </MagneticButton>
        </div>
      </div>

      {statusMessage && (
        <div className={styles.bannerNotice}>
          <span>ℹ️</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 4-Stat Metrics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Memories</span>
          <div className={styles.statValue}>
            <NumberFlow value={stats.total_memories} />
          </div>
          <span className={styles.statSub}>Cross-session knowledge nodes</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Episodic / Procedural</span>
          <div className={styles.statValue}>
            <span>{stats.episodic_count}</span>
            <span style={{ fontSize: "1rem", color: "var(--color-text-muted)" }}>/</span>
            <span>{stats.procedural_count}</span>
          </div>
          <span className={styles.statSub}>{stats.semantic_count} semantic graph relations</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Average Stability (S)</span>
          <div className={styles.statValue}>
            <NumberFlow value={stats.avg_stability} format={{ minimumFractionDigits: 1, maximumFractionDigits: 2 }} />
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-muted)" }}>days</span>
          </div>
          <span className={styles.statSub}>Reinforced upon each retrieval</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Experience Injections</span>
          <div className={styles.statValue}>
            <NumberFlow value={stats.total_access_count} />
          </div>
          <span className={styles.statSub}>Exploratory tool errors prevented</span>
        </div>
      </div>

      {/* Experience Simulator & Guidance Tester */}
      <div className={styles.panelSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>
              <span>🧪 Experience Distillation Simulator</span>
            </h3>
            <p className={styles.sectionSubtitle}>
              Test how an inbound prompt queries cognitive memory and preview the distilled guidance prompt injected into ReAct agents.
            </p>
          </div>
        </div>

        <form onSubmit={handleSimulateGuidance} className={styles.simulatorBox}>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.queryInput}
              placeholder="Enter hypothetical task (e.g., 'Execute Python script to process revenue CSV')..."
              value={simulatorQuery}
              onChange={(e) => setSimulatorQuery(e.target.value)}
            />
            <MagneticButton strength={0.25}>
              <button
                type="submit"
                className={`${styles.filterTab} ${styles.filterTabActive}`}
                disabled={simulating || !simulatorQuery.trim()}
              >
                {simulating ? "Simulating…" : "⚡ Test Guidance"}
              </button>
            </MagneticButton>
          </div>

          {guidanceResult && (
            <div className={styles.guidanceResult} data-testid="guidance-result-container">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
                  Distilled Guidance Prompt ({guidanceResult.relevant_nodes.length} matched experience(s)):
                </span>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)", color: "var(--badge-active-color, #00f0ff)" }}>
                  Peak Sim: {guidanceResult.relevant_nodes[0] ? (guidanceResult.relevant_nodes[0].similarity_score * 100).toFixed(0) : 0}%
                </span>
              </div>
              <pre className={styles.guidancePromptBox}>
                {guidanceResult.guidance_prompt || "No prior experience met similarity threshold."}
              </pre>
            </div>
          )}
        </form>
      </div>

      {/* Memory Node Explorer */}
      <div className={styles.panelSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>
              <span>🗂️ Consolidated Memory Explorer</span>
            </h3>
            <p className={styles.sectionSubtitle}>
              Inspect episodic traces, learned error-recovery heuristics, and semantic facts stored for this tenant.
            </p>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.tabGroup}>
              <button
                type="button"
                className={`${styles.filterTab} ${activeFilter === "all" ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All ({nodes.length})
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${activeFilter === "episodic" ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter("episodic")}
              >
                Episodic
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${activeFilter === "procedural" ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter("procedural")}
              >
                Procedural
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${activeFilter === "semantic" ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter("semantic")}
              >
                Semantic
              </button>
            </div>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search memories or tools…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredNodes.length === 0 ? (
          <div className={styles.emptyState}>
            No cognitive memories matched your filter. Execute ReAct tasks or run tests to generate traces.
          </div>
        ) : (
          <div className={styles.nodesGrid}>
            {filteredNodes.map((node) => {
              const typeClass =
                node.memory_type === "procedural"
                  ? styles.typeProcedural
                  : node.memory_type === "semantic"
                  ? styles.typeSemantic
                  : styles.typeEpisodic;

              return (
                <TiltCard key={node.id} maxAngle={2} glare={false}>
                  <div className={styles.nodeCard}>
                    <div className={styles.nodeTop}>
                      <span className={`${styles.typeBadge} ${typeClass}`}>
                        {node.memory_type}
                      </span>
                      <span className={styles.stabilityPill}>
                        S = {node.stability_score.toFixed(1)}d | Hits: {node.access_count}
                      </span>
                    </div>

                    <h4 className={styles.nodeQuery}>{node.query}</h4>

                    <p className={styles.nodeInsight}>
                      &ldquo;{node.distilled_insight}&rdquo;
                    </p>

                    <div className={styles.toolChainRow}>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Tools:</span>
                      {node.tool_chain.map((tool, idx) => (
                        <span key={idx} className={styles.toolBadge}>
                          {tool}
                        </span>
                      ))}
                    </div>

                    <div className={styles.nodeFooter}>
                      <span>Turns: {node.turns_count}</span>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => void handleDeleteNode(node.id)}
                        disabled={isExpired}
                        title="Delete memory node"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Explanatory Banner */}
      <div className={styles.bannerNotice}>
        <span>📐</span>
        <div>
          <strong style={{ color: "var(--color-text)" }}>Ebbinghaus Mathematical Retention:</strong>
          {" "}Memory retention score follows R(t) = exp(-Δt / (S × 86,400)).
          Each time a memory primes a successful agent session, its stability S expands (S ← 1.5S + 0.5).
          Decayed memories with R &lt; 0.15 are automatically eligible for zero-compute pruning.
        </div>
      </div>
    </div>
  );
}
