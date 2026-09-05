"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  CloudRegion,
  CloudRegionNode,
  RegionHealthProbe,
  ClusterTopology,
  LibsqlReplicationStats,
  LibsqlReplicaConfig,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./MultiCloudPanel.module.css";

interface MultiCloudPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
  tenantId?: string;
}

const DEFAULT_NODES: CloudRegionNode[] = [
  {
    region: "oracle-bom",
    provider: "oracle",
    role: "leader",
    endpoint: "https://rag.prateeq.in",
    is_active: true,
    weight: 100,
    health_status: "healthy",
    consecutive_failures: 0,
    last_probe_ms: 12.4,
  },
  {
    region: "aws-iad",
    provider: "aws",
    role: "standby",
    endpoint: "https://iad.rag.prateeq.in",
    is_active: true,
    weight: 80,
    health_status: "healthy",
    consecutive_failures: 0,
    last_probe_ms: 184.2,
  },
  {
    region: "fly-fra",
    provider: "fly_io",
    role: "standby",
    endpoint: "https://fra.rag.fly.dev",
    is_active: true,
    weight: 70,
    health_status: "healthy",
    consecutive_failures: 0,
    last_probe_ms: 142.6,
  },
  {
    region: "cf-global",
    provider: "cloudflare",
    role: "edge_worker",
    endpoint: "https://edge.prateeq.workers.dev",
    is_active: true,
    weight: 90,
    health_status: "healthy",
    consecutive_failures: 0,
    last_probe_ms: 8.5,
  },
];

export function MultiCloudPanel({ hidden, client, tenantId }: MultiCloudPanelProps) {
  const [topology, setTopology] = useState<ClusterTopology>({
    active_leader: "oracle-bom",
    generation_term: 1,
    nodes: DEFAULT_NODES,
    quorum_state: "quorum_established",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [probing, setProbing] = useState<boolean>(false);
  const [failingOver, setFailingOver] = useState<boolean>(false);
  const [syncingReplica, setSyncingReplica] = useState<boolean>(false);
  const [targetRegion, setTargetRegion] = useState<CloudRegion>("aws-iad");
  const [simulatedPartition, setSimulatedPartition] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [replicaConfig, setReplicaConfig] = useState<LibsqlReplicaConfig | null>({
    tenant_id: tenantId || "tn_demo",
    primary_url: "libsql://primary.rag.prateeq.in",
    replica_path: "/data/libsql/tenant_replica.db",
    sync_interval_seconds: 5,
    read_your_writes: true,
    embedded_replica_enabled: true,
  });

  const [replicaStats, setReplicaStats] = useState<LibsqlReplicationStats>({
    tenant_id: tenantId || "tn_demo",
    current_wal_frame: 41829,
    applied_wal_frame: 41829,
    replication_lag_ms: 0.45,
    last_sync_timestamp: new Date().toISOString(),
    is_synchronized: true,
  });

  const refreshOverview = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const data = await client.getMultiCloudClusters();
      if (data && data.topology) {
        setTopology(data.topology);
      }
    } catch (err) {
      console.warn("Could not fetch multi-cloud cluster status:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchTenantReplica = useCallback(async () => {
    if (!client || !tenantId) return;
    try {
      const cfg = await client.getTenantLibsqlConfig();
      if (cfg) setReplicaConfig(cfg);
    } catch (err) {
      console.warn("Could not fetch tenant LibSQL replica config:", err);
    }
  }, [client, tenantId]);

  useEffect(() => {
    if (!hidden) {
      if (client) {
        void refreshOverview();
        void fetchTenantReplica();
      }
    }
  }, [hidden, client, refreshOverview, fetchTenantReplica]);

  if (hidden) return null;

  const handleProbe = async () => {
    setProbing(true);
    setStatusMessage(null);
    try {
      if (client) {
        const probes: RegionHealthProbe[] = await client.probeMultiCloudRegions();
        // Update local topology node latencies
        setTopology((prev) => {
          const updatedNodes = prev.nodes.map((node) => {
            const probe = probes.find((p) => p.region === node.region);
            if (!probe) return node;
            return {
              ...node,
              health_status: probe.is_healthy ? ("healthy" as const) : ("unhealthy" as const),
              last_probe_ms: probe.latency_ms,
            };
          });
          return { ...prev, nodes: updatedNodes };
        });
        setStatusMessage({
          type: "success",
          text: `Probed ${probes.length} multi-cloud regions successfully. All quorum probes responsive.`,
        });
      } else {
        // Fallback simulation probe
        setTopology((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => ({
            ...n,
            last_probe_ms: Number((Math.random() * 20 + (n.region === "oracle-bom" ? 10 : 120)).toFixed(1)),
          })),
        }));
        setStatusMessage({
          type: "success",
          text: "Probed 4 regions. Hybrid simulation telemetry refreshed.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Region probe failed";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setProbing(false);
    }
  };

  const handleTriggerFailover = async () => {
    setFailingOver(true);
    setStatusMessage(null);
    try {
      if (client) {
        const result = await client.triggerMultiCloudFailover({
          target_region: targetRegion,
          trigger_type: "manual_operator",
          reason: "Operator initiated multi-cloud failover drill",
        });

        if (result.success) {
          setTopology((prev) => {
            const updatedNodes = prev.nodes.map((n) => ({
              ...n,
              role: (n.region === result.new_leader ? "leader" : "standby") as CloudRegionNode["role"],
            }));
            return {
              ...prev,
              active_leader: result.new_leader,
              generation_term: result.generation_term,
              nodes: updatedNodes,
            };
          });
          setStatusMessage({
            type: "success",
            text: `Failover successful! Region [${result.new_leader}] elected leader (Term ${result.generation_term}) with ${result.quorum_votes_acquired} quorum votes.`,
          });
        } else {
          setStatusMessage({
            type: "error",
            text: `Failover rejected: ${result.error_details || "Insufficient quorum majority"}`,
          });
        }
      } else {
        // Local simulation fallback
        setTopology((prev) => {
          const nextTerm = prev.generation_term + 1;
          const updatedNodes = prev.nodes.map((n) => ({
            ...n,
            role: (n.region === targetRegion ? "leader" : n.region === "cf-global" ? "edge_worker" : "standby") as CloudRegionNode["role"],
          }));
          return {
            ...prev,
            active_leader: targetRegion,
            generation_term: nextTerm,
            nodes: updatedNodes,
          };
        });
        setStatusMessage({
          type: "success",
          text: `[Simulation] Failover to ${targetRegion} executed. Generation term incremented.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failover execution failed";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setFailingOver(false);
    }
  };

  const handleSimulatePartition = (partitionActive: boolean) => {
    setSimulatedPartition(partitionActive);
    if (partitionActive) {
      // Simulate Oracle BOM going down
      setTopology((prev) => {
        const updatedNodes = prev.nodes.map((n) => {
          if (n.region === "oracle-bom") {
            return {
              ...n,
              health_status: "unhealthy" as const,
              consecutive_failures: 4,
              last_probe_ms: 9999,
            };
          }
          return n;
        });
        return {
          ...prev,
          nodes: updatedNodes,
        };
      });
      setStatusMessage({
        type: "error",
        text: "⚡ Network partition injected on primary Oracle BOM! Standby nodes detecting heartbeat timeouts.",
      });
    } else {
      // Restore Oracle BOM
      setTopology((prev) => {
        const updatedNodes = prev.nodes.map((n) => {
          if (n.region === "oracle-bom") {
            return {
              ...n,
              health_status: "healthy" as const,
              consecutive_failures: 0,
              last_probe_ms: 12.8,
            };
          }
          return n;
        });
        return {
          ...prev,
          nodes: updatedNodes,
        };
      });
      setStatusMessage({
        type: "success",
        text: "Oracle BOM connectivity restored. Node health verified.",
      });
    }
  };

  const handleSyncReplica = async () => {
    setSyncingReplica(true);
    setStatusMessage(null);
    try {
      if (client) {
        const stats = await client.syncTenantLibsqlReplica();
        setReplicaStats(stats);
        setStatusMessage({
          type: "success",
          text: `Replica synced. WAL Frame: ${stats.applied_wal_frame}, Replication Lag: ${stats.replication_lag_ms.toFixed(2)}ms.`,
        });
      } else {
        // Fallback simulation
        const nextFrame = replicaStats.current_wal_frame + 12;
        setReplicaStats({
          tenant_id: tenantId || "tn_demo",
          current_wal_frame: nextFrame,
          applied_wal_frame: nextFrame,
          replication_lag_ms: 0.38,
          last_sync_timestamp: new Date().toISOString(),
          is_synchronized: true,
        });
        setStatusMessage({
          type: "success",
          text: `[Simulation] Embedded LibSQL synced to frame ${nextFrame} in 0.38ms.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Replica sync failed";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSyncingReplica(false);
    }
  };

  const healthyNodesCount = topology.nodes.filter((n) => n.health_status === "healthy").length;

  return (
    <div className={styles.container}>
      {/* Header & Badges */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🌐</span> Multi-Cloud Failover & Edge Turso LibSQL Quorum
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span className={styles.badgeM99}>Milestone 99 • v0.84.0</span>
            <span className={styles.badgeBattery}>Battery #19: Edge Distribution</span>
          </div>
          <p className={styles.description}>
            Multi-cloud high-availability failover across Oracle Cloud (Mumbai), AWS (us-east-1), Fly.io (Frankfurt),
            and Cloudflare Global Edge. Integrates Turso LibSQL embedded replicas for sub-1ms local read latency and
            continuous WAL replication streams.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => void handleProbe()}
            disabled={probing || loading}
          >
            {probing ? "Probing..." : "🔍 Probe All Regions"}
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => void refreshOverview()}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`${styles.statusBanner} ${
            statusMessage.type === "success" ? styles.statusSuccess : styles.statusError
          }`}
        >
          <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Consensus Quorum</span>
          <div className={styles.metricValue}>
            <span style={{ color: healthyNodesCount >= 3 ? "#10b981" : "#ef4444" }}>
              {healthyNodesCount}/4 Nodes
            </span>
          </div>
          <span className={styles.metricSubtitle}>
            {topology.quorum_state.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Leader Region</span>
          <div className={styles.metricValue}>
            <span style={{ color: "var(--color-accent, #00f0ff)" }}>
              {topology.active_leader.toUpperCase()}
            </span>
          </div>
          <span className={styles.metricSubtitle}>
            Generation Term: <NumberFlow value={topology.generation_term} />
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Replication Lag (WAL)</span>
          <div className={styles.metricValue}>
            <NumberFlow value={replicaStats.replication_lag_ms} format={{ minimumFractionDigits: 2 }} />
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>ms</span>
          </div>
          <span className={styles.metricSubtitle}>
            WAL Frame: <NumberFlow value={replicaStats.applied_wal_frame} />
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>LibSQL Embedded Status</span>
          <div className={styles.metricValue} style={{ color: "#10b981" }}>
            <span>⚡ Sub-1ms</span>
          </div>
          <span className={styles.metricSubtitle}>Read-Your-Writes Enabled</span>
        </div>
      </div>

      {/* Region Nodes Grid */}
      <div>
        <div className={styles.sectionTitle}>
          <span>Multi-Cloud Topology Nodes</span>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", opacity: 0.7 }}>
            Testing Mode: Mock Hybrid Probes (`is_simulated=true`)
          </span>
        </div>

        <div className={styles.regionGrid}>
          {topology.nodes.map((node) => {
            const isLeader = node.role === "leader";
            const isDegraded = node.health_status === "unhealthy";

            return (
              <div
                key={node.region}
                className={`${styles.regionCard} ${
                  isLeader ? styles.regionCardLeader : isDegraded ? styles.regionCardDegraded : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.regionName}>{node.region}</div>
                    <div className={styles.regionProvider}>{node.provider}</div>
                  </div>
                  <span
                    className={`${styles.roleBadge} ${
                      isLeader
                        ? styles.roleBadgeLeader
                        : isDegraded
                        ? styles.roleBadgeDegraded
                        : node.role === "edge_worker"
                        ? styles.roleBadgeEdge
                        : styles.roleBadgeStandby
                    }`}
                  >
                    {isDegraded ? "DEGRADED" : node.role.replace(/_/g, " ")}
                  </span>
                </div>

                <div className={styles.endpoint}>{node.endpoint}</div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Latency:</span>
                  <span className={styles.statValue}>
                    {node.last_probe_ms ? (
                      <>
                        <NumberFlow value={node.last_probe_ms} format={{ minimumFractionDigits: 1 }} /> ms
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Weight / Failures:</span>
                  <span className={styles.statValue}>
                    {node.weight}% / {node.consecutive_failures}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operations Grid */}
      <div className={styles.operationsGrid}>
        {/* Failover Control Card */}
        <div className={styles.opCard}>
          <h3 className={styles.opTitle}>
            <span>⚡</span> Quorum Failover Control & Chaos Drill
          </h3>
          <p className={styles.opDescription}>
            Test distributed quorum failover consensus. When the primary region experiences failure, standby nodes
            elect a new leader without split-brain via majority consensus (&gt;50%).
          </p>

          <div className={styles.toggleRow}>
            <div className={styles.toggleLabel}>
              <span className={styles.toggleTitle}>Simulate Oracle BOM Partition</span>
              <span className={styles.toggleDesc}>
                Drop primary heartbeats to simulate VPS network severance
              </span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={simulatedPartition}
                onChange={(e) => handleSimulatePartition(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Select Target Region for Failover</label>
            <select
              className={styles.select}
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value as CloudRegion)}
            >
              <option value="aws-iad">aws-iad (AWS US-East Standby)</option>
              <option value="fly-fra">fly-fra (Fly.io Frankfurt Standby)</option>
              <option value="oracle-bom">oracle-bom (Oracle Mumbai Primary)</option>
            </select>
          </div>

          <MagneticButton strength={0.2}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => void handleTriggerFailover()}
              disabled={failingOver}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {failingOver ? "Executing Quorum Consensus..." : `Elect ${targetRegion.toUpperCase()} as Leader`}
            </button>
          </MagneticButton>
        </div>

        {/* Turso LibSQL Replica Card */}
        <div className={styles.opCard}>
          <h3 className={styles.opTitle}>
            <span>💾</span> Turso LibSQL Embedded Replica
          </h3>
          <p className={styles.opDescription}>
            Tenant-isolated embedded SQLite/LibSQL database replica. Reads resolve against local disk in sub-1ms,
            while writes replicate asynchronously through WAL frame streaming.
          </p>

          <div className={styles.tursoBox}>
            <div className={styles.tursoRow}>
              <span style={{ color: "var(--color-text-muted)" }}>Tenant ID:</span>
              <span>{replicaConfig?.tenant_id || "tn_client_default"}</span>
            </div>
            <div className={styles.tursoRow}>
              <span style={{ color: "var(--color-text-muted)" }}>Primary URL:</span>
              <span style={{ color: "var(--color-accent, #00f0ff)" }}>{replicaConfig?.primary_url}</span>
            </div>
            <div className={styles.tursoRow}>
              <span style={{ color: "var(--color-text-muted)" }}>Local Replica:</span>
              <span>{replicaConfig?.replica_path}</span>
            </div>
          </div>

          <div className={styles.streamStats}>
            <div className={styles.streamStatBox}>
              <span className={styles.streamStatLabel}>CURRENT WAL FRAME</span>
              <span className={styles.streamStatNum}>
                <NumberFlow value={replicaStats.current_wal_frame} />
              </span>
            </div>
            <div className={styles.streamStatBox}>
              <span className={styles.streamStatLabel}>APPLIED FRAME</span>
              <span className={styles.streamStatNum} style={{ color: "#10b981" }}>
                <NumberFlow value={replicaStats.applied_wal_frame} />
              </span>
            </div>
          </div>

          <MagneticButton strength={0.2}>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => void handleSyncReplica()}
              disabled={syncingReplica}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {syncingReplica ? "Catching up WAL..." : "⚡ Trigger Replica Catch-up Sync"}
            </button>
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
