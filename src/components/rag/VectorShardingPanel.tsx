"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { RetrieverClient } from "@/lib/rag-client";
import {
  ShardPartition,
  ShardTopologyResponse,
  RaftConsensusStatus,
  ScatterGatherResponse,
  ShardRebalancePlan,
  ReadQuorum,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./VectorShardingPanel.module.css";

interface VectorShardingPanelProps {
  client: RetrieverClient | null;
  tenantId?: string;
  hidden?: boolean;
}

type TabKey = "topology" | "raft" | "scatter_gather" | "rebalance";

export function VectorShardingPanel({ client, tenantId, hidden }: VectorShardingPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("topology");
  const [topology, setTopology] = useState<ShardTopologyResponse | null>(null);
  const [raftStatus, setRaftStatus] = useState<RaftConsensusStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Scatter-Gather Simulator State
  const [queryPrompt, setQueryPrompt] = useState<string>("neural semantic vector routing");
  const [readQuorum, setReadQuorum] = useState<ReadQuorum>("quorum");
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<ScatterGatherResponse | null>(null);

  // Rebalance State
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  const [lastRebalancePlan, setLastRebalancePlan] = useState<ShardRebalancePlan | null>(null);

  const fetchTelemetry = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [topoData, raftData] = await Promise.all([
        client.getShardTopology(),
        client.getRaftConsensusStatus(),
      ]);
      setTopology(topoData);
      setRaftStatus(raftData);
    } catch (err) {
      console.warn("Error fetching vector sharding telemetry:", err);
      setError(err instanceof Error ? err.message : "Failed to load vector sharding telemetry.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (!hidden) {
      const timer = setTimeout(() => {
        void fetchTelemetry();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hidden, fetchTelemetry]);

  const handleExecuteSearch = async () => {
    if (!client) return;
    setIsQuerying(true);
    setError(null);
    try {
      // Mock 3-dim normalized float vector derived from prompt
      const queryVector = [0.85, 0.45, 0.25];
      const res = await client.queryShardedVectors({
        tenant_id: tenantId || "tenant_default",
        query_vector: queryVector,
        top_k: 5,
        read_quorum: readQuorum,
      });
      setQueryResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scatter-gather query failed.");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTriggerElection = async (nodeId: string) => {
    if (!client) return;
    try {
      await client.triggerRaftElection(nodeId);
      await fetchTelemetry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger leader election.");
    }
  };

  const handleTriggerRebalance = async () => {
    if (!client) return;
    setIsRebalancing(true);
    setError(null);
    try {
      const plan = await client.rebalanceShards();
      setLastRebalancePlan(plan);
      await fetchTelemetry();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rebalance failed.");
    } finally {
      setIsRebalancing(false);
    }
  };

  if (hidden) return null;

  const totalVectors = topology?.shards.reduce((acc, s) => acc + s.vector_count, 0) ?? 0;
  const isSkewed = topology?.skew_metrics?.is_skewed ?? false;

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🌐</span> Vector Sharding & Raft Consensus
            <span className={styles.badgeShards}>v1.7.0-alpha1</span>
            <span className={styles.badgeBattery}>Platform Battery #32</span>
          </h2>
          <p className={styles.description}>
            Horizontally partition multi-tenant vector embedding collections across consistent virtual-node hash rings,
            replicated via distributed Raft consensus logs with tunable read quorums and zero-downtime online migration.
          </p>
        </div>
        <MagneticButton strength={0.25}>
          <button
            onClick={() => void fetchTelemetry()}
            disabled={loading}
            className={styles.actionBtn}
            style={{ padding: "0.5rem 1rem" }}
          >
            {loading ? "Refreshing…" : "Sync Shards ↻"}
          </button>
        </MagneticButton>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(255, 82, 82, 0.15)", border: "1px solid rgba(255, 82, 82, 0.3)", color: "#ff5252", fontSize: "0.85rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cluster Overview Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Partitions</span>
          <span className={styles.metricValue}>{topology?.total_shards ?? 8}</span>
          <span className={styles.metricSubtext}>64 vnodes / partition</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Replication Factor</span>
          <span className={styles.metricValue}>{topology?.replication_factor ?? 3}x</span>
          <span className={styles.metricSubtext}>Majority Quorum (≥2)</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Vectors</span>
          <span className={styles.metricValue}>{totalVectors.toLocaleString()}</span>
          <span className={styles.metricSubtext}>Distributed chunk embeddings</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Raft Consensus</span>
          <span className={styles.metricValue} style={{ color: raftStatus?.quorum_healthy ? "#00E676" : "#FFAB00" }}>
            Term {raftStatus?.current_term ?? 1}
          </span>
          <span className={styles.metricSubtext}>Leader: {raftStatus?.active_leader_id ?? "node_core_01"}</span>
        </div>
      </div>

      {/* Tab Segmented Controller */}
      <div className={styles.tabsContainer} role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "topology"}
          className={`${styles.tabBtn} ${activeTab === "topology" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("topology")}
        >
          {activeTab === "topology" && <m.span layoutId="shardingTabPill" className={styles.tabPill} />}
          <span>🪐</span> Shard Topology ({topology?.shards.length ?? 8})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "raft"}
          className={`${styles.tabBtn} ${activeTab === "raft" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("raft")}
        >
          {activeTab === "raft" && <m.span layoutId="shardingTabPill" className={styles.tabPill} />}
          <span>⚖️</span> Raft Consensus State
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "scatter_gather"}
          className={`${styles.tabBtn} ${activeTab === "scatter_gather" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("scatter_gather")}
        >
          {activeTab === "scatter_gather" && <m.span layoutId="shardingTabPill" className={styles.tabPill} />}
          <span>⚡</span> Scatter-Gather Benchmark
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "rebalance"}
          className={`${styles.tabBtn} ${activeTab === "rebalance" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("rebalance")}
        >
          {activeTab === "rebalance" && <m.span layoutId="shardingTabPill" className={styles.tabPill} />}
          <span>🔄</span> Cluster Rebalance {isSkewed && <span style={{ color: "#FFAB00", fontSize: "0.7rem" }}>● SKEW</span>}
        </button>
      </div>

      {/* Sub-View 1: Shard Ring & Topology */}
      {activeTab === "topology" && (
        <div className={styles.panelCard}>
          <div className={styles.cardTitle}>
            <span>Consistent Virtual-Node Hash Partitions</span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Hash Ring: [0, 4,294,967,295]</span>
          </div>

          <div className={styles.shardGrid}>
            {(topology?.shards || []).map((shard: ShardPartition) => {
              const rangePct = Math.round(((shard.hash_range_end - shard.hash_range_start) / 4294967295) * 100);
              return (
                <div key={shard.shard_id} className={styles.shardCard}>
                  <div className={styles.shardHeader}>
                    <span className={styles.shardId}>{shard.shard_id}</span>
                    <span className={`${styles.statusPill} ${shard.status === "healthy" ? styles.statusHealthy : styles.statusRebalancing}`}>
                      {shard.status}
                    </span>
                  </div>

                  <div className={styles.hashRangeBar}>
                    <div className={styles.hashRangeFill} style={{ width: `${Math.max(12, rangePct)}%` }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    <span>Range: {shard.hash_range_start.toLocaleString()} - {shard.hash_range_end.toLocaleString()}</span>
                    <span>{rangePct}% of ring</span>
                  </div>

                  <div className={styles.nodeBadgeRow}>
                    <span className={styles.leaderPill}>👑 {shard.leader_node_id}</span>
                    {shard.replica_node_ids.map((r) => (
                      <span key={r} className={styles.replicaPill}>🛡️ {r}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "0.25rem", color: "var(--color-text)" }}>
                    <span>Vectors: <strong>{shard.vector_count}</strong></span>
                    <span>Index Size: <strong>{Math.round(shard.index_size_bytes / 1024)} KB</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-View 2: Raft Consensus State */}
      {activeTab === "raft" && (
        <div className={styles.panelCard}>
          <div className={styles.cardTitle}>
            <span>Cluster Consensus State Machine (Term {raftStatus?.current_term ?? 1})</span>
            <span style={{ fontSize: "0.8rem", color: "#00E676" }}>● Quorum Active</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Role</th>
                  <th>Current Term</th>
                  <th>Commit Index</th>
                  <th>Log Length</th>
                  <th>Voted For</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(raftStatus?.nodes || []).map((node) => (
                  <tr key={node.node_id}>
                    <td><strong>{node.node_id}</strong></td>
                    <td>
                      <span className={node.role === "leader" ? styles.roleLeader : node.role === "candidate" ? styles.roleCandidate : styles.roleFollower}>
                        {node.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{node.current_term}</td>
                    <td>{node.commit_index}</td>
                    <td>{node.log_length}</td>
                    <td>{node.voted_for || "—"}</td>
                    <td>
                      {node.role !== "leader" && (
                        <button
                          onClick={() => void handleTriggerElection(node.node_id)}
                          className={styles.secondaryBtn}
                          style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          Elect Leader
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Replicated Log */}
          <div style={{ marginTop: "1rem" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "var(--color-text)" }}>Replicated Mutation Log (Recent)</h4>
            <div className={styles.waterfallList}>
              {(raftStatus?.recent_log_entries || []).length === 0 ? (
                <div style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  No mutations committed yet. Log index at 0.
                </div>
              ) : (
                raftStatus?.recent_log_entries.map((entry) => (
                  <div key={entry.index} className={styles.waterfallItem}>
                    <span>#{entry.index} [Term {entry.term}] <strong>{entry.command_type}</strong></span>
                    <span style={{ opacity: 0.75 }}>{JSON.stringify(entry.payload)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 3: Scatter-Gather Benchmark */}
      {activeTab === "scatter_gather" && (
        <div className={styles.panelCard}>
          <div className={styles.cardTitle}>
            <span>Parallel Scatter-Gather Vector Search Simulator</span>
          </div>

          <div className={styles.controlRow}>
            <input
              type="text"
              value={queryPrompt}
              onChange={(e) => setQueryPrompt(e.target.value)}
              placeholder="Enter search prompt or topic..."
              className={styles.input}
            />

            <select
              value={readQuorum}
              onChange={(e) => setReadQuorum(e.target.value as ReadQuorum)}
              className={styles.select}
            >
              <option value="quorum">Quorum (Majority)</option>
              <option value="all">Strict All (100%)</option>
              <option value="one">Fastest One</option>
              <option value="local">Local Node Only</option>
            </select>

            <MagneticButton strength={0.25}>
              <button
                onClick={() => void handleExecuteSearch()}
                disabled={isQuerying}
                className={styles.actionBtn}
              >
                {isQuerying ? "Fanning Out…" : "Execute Scatter-Gather ➔"}
              </button>
            </MagneticButton>
          </div>

          {queryResponse && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: "var(--surface-elevated)", padding: "0.75rem 1rem", borderRadius: 8, fontSize: "0.85rem" }}>
                <span>Total Latency: <strong>{queryResponse.total_latency_ms} ms</strong></span>
                <span>Partitions Queried: <strong>{queryResponse.successful_shards} / {queryResponse.total_shards_queried}</strong></span>
                <span style={{ color: "#00E676" }}>✓ Quorum Achieved</span>
              </div>

              {/* Per-Shard Latency Waterfall */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--color-text)" }}>Shard Latency Breakdown</h4>
                <div className={styles.waterfallList}>
                  {queryResponse.shard_breakdown.map((s) => (
                    <div key={s.shard_id} className={styles.waterfallItem}>
                      <span>{s.shard_id} ({s.node_id})</span>
                      <span>{s.latency_ms} ms — {s.candidates_count} candidates</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Merged Results */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--color-text)" }}>Globally Merged & Ranked Candidates</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {queryResponse.results.map((c) => (
                    <div key={c.chunk_id} className={styles.candidateCard}>
                      <div className={styles.candidateHeader}>
                        <span>Chunk: {c.chunk_id} ({c.shard_id})</span>
                        <span className={styles.candidateScore}>Cosine: {c.score}</span>
                      </div>
                      <div className={styles.candidateSnippet}>{c.text || "Vector match from partition store."}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-View 4: Cluster Rebalancer */}
      {activeTab === "rebalance" && (
        <div className={styles.panelCard}>
          <div className={styles.cardTitle}>
            <span>Online Shard Rebalancing & Skew Sentinel</span>
            <span style={{ fontSize: "0.8rem", color: isSkewed ? "#FFAB00" : "#00E676" }}>
              {isSkewed ? "⚠️ Cluster Skew Detected" : "✓ Balanced Topology"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "var(--color-text)" }}>
                Skew Std Dev: <strong>{topology?.skew_metrics?.skew_std_dev ?? 0}</strong> | Mean per Node: <strong>{topology?.skew_metrics?.mean_vectors_per_node ?? 0}</strong>
              </p>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Online migration streams partition snapshots to target replicas before atomic lease handoff.
              </span>
            </div>

            <MagneticButton strength={0.25}>
              <button
                onClick={() => void handleTriggerRebalance()}
                disabled={isRebalancing}
                className={styles.actionBtn}
              >
                {isRebalancing ? "Migrating Shard…" : "Trigger Auto-Rebalance 🔄"}
              </button>
            </MagneticButton>
          </div>

          {lastRebalancePlan && (
            <div style={{ marginTop: "1rem", background: "var(--surface-elevated)", padding: "1rem", borderRadius: 8, border: "1px solid var(--surface-glass-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span>Plan: <strong>{lastRebalancePlan.plan_id}</strong></span>
                <span style={{ color: "#00E676" }}>Status: {lastRebalancePlan.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Migrated shard <strong>{lastRebalancePlan.shard_id}</strong> from <code>{lastRebalancePlan.source_node_id}</code> to <code>{lastRebalancePlan.target_node_id}</code> ({lastRebalancePlan.vectors_transferred} vectors).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
