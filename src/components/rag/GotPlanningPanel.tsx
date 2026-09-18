"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import {
  GoTPlanResponse,
  GoTThoughtNode,
  HierarchicalMemoryView,
  GoTSimulateResponse,
  MemoryTier,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./GotPlanningPanel.module.css";

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

interface GotPlanningPanelProps {
  client: RetrieverClient | null;
  tenantId?: string;
  hidden?: boolean;
}

type SubTabKey = "canvas" | "memory" | "ledger" | "simulator";

interface LedgerEntry {
  id: string;
  action: "ORIGIN" | "GENERATE" | "AGGREGATE" | "REFINE" | "PRUNE" | "CONVERGE";
  timestamp: string;
  details: string;
  delta: string;
}

const SEED_PLAN: GoTPlanResponse = {
  plan_id: "plan_got_pgvector_failover",
  graph: {
    plan_id: "plan_got_pgvector_failover",
    tenant_id: "tn_client_enterprise",
    query: "Synthesize optimal multi-region pgvector failover with Raft consensus",
    nodes: {
      v_0: {
        node_id: "v_0",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: [],
        thought_type: "ORIGIN",
        status: "EVALUATING",
        content: "Root goal: Synthesize multi-region pgvector failover with distributed Raft consensus and <300ms failover.",
        score: 0.50,
        depth: 0,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 1.0,
        metadata: { in_degree: 0, out_degree: 3 },
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      v_1: {
        node_id: "v_1",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_0"],
        thought_type: "GENERATION",
        status: "EXPLORING",
        content: "Approach A: Multi-region Raft state machine with lease-based leader election across 3 cloud availability zones.",
        score: 0.72,
        depth: 1,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 0.95,
        metadata: { in_degree: 1, out_degree: 1 },
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      v_2: {
        node_id: "v_2",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_0"],
        thought_type: "GENERATION",
        status: "EXPLORING",
        content: "Approach B: Asynchronous streaming replication with physical WAL archiving and hot-standby promotion.",
        score: 0.68,
        depth: 1,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 0.92,
        metadata: { in_degree: 1, out_degree: 1 },
        created_at: new Date(Date.now() - 2800000).toISOString(),
      },
      v_3: {
        node_id: "v_3",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_0"],
        thought_type: "PRUNED",
        status: "PRUNED",
        content: "Approach C: Shared-disk SAN volume failover across data centers (High latency jitter > 850ms).",
        score: 0.28,
        depth: 1,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 0.30,
        metadata: { in_degree: 1, out_degree: 0 },
        created_at: new Date(Date.now() - 2500000).toISOString(),
      },
      v_4: {
        node_id: "v_4",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_1"],
        thought_type: "REFINEMENT",
        status: "EXPLORING",
        content: "Refinement of A: Introduce pre-vote phase and heartbeat leases (150ms) to prevent false-positive elections during WAN transient spikes.",
        score: 0.81,
        depth: 2,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 0.96,
        metadata: { in_degree: 1, out_degree: 1 },
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      v_5: {
        node_id: "v_5",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_1", "v_2"],
        thought_type: "AGGREGATION",
        status: "EXPLORING",
        content: "Synergetic Aggregation (M -> 1): Combine Raft consensus metadata coordinator with local pgvector streaming read replicas for zero write-stalls.",
        score: 0.88,
        depth: 2,
        memory_tier: "L1_SCRATCHPAD",
        retention_strength: 0.98,
        metadata: { in_degree: 2, out_degree: 1 },
        created_at: new Date(Date.now() - 1200000).toISOString(),
      },
      v_6: {
        node_id: "v_6",
        plan_id: "plan_got_pgvector_failover",
        parent_ids: ["v_5"],
        thought_type: "REFINEMENT",
        status: "CONVERGED",
        content: "Final Converged Synthesis: Hybrid Raft-pgvector mesh architecture with zero data loss (RPO=0) and deterministic 220ms failover (RTO<300ms).",
        score: 0.94,
        depth: 3,
        memory_tier: "L3_SEMANTIC",
        retention_strength: 1.0,
        metadata: { in_degree: 1, out_degree: 0 },
        created_at: new Date(Date.now() - 600000).toISOString(),
      },
    },
    edges: [
      { source_id: "v_0", target_id: "v_1", edge_type: "GENERATION", weight: 0.72 },
      { source_id: "v_0", target_id: "v_2", edge_type: "GENERATION", weight: 0.68 },
      { source_id: "v_0", target_id: "v_3", edge_type: "GENERATION", weight: 0.28 },
      { source_id: "v_1", target_id: "v_4", edge_type: "REFINEMENT", weight: 0.81 },
      { source_id: "v_1", target_id: "v_5", edge_type: "AGGREGATION", weight: 0.88 },
      { source_id: "v_2", target_id: "v_5", edge_type: "AGGREGATION", weight: 0.88 },
      { source_id: "v_5", target_id: "v_6", edge_type: "CONVERGENCE", weight: 0.94 },
    ],
    root_node_id: "v_0",
    converged_node_id: "v_6",
    optimal_path: ["v_0", "v_1", "v_5", "v_6"],
    iterations_count: 5,
    is_converged: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  message: "Plan converged successfully via Kahn topological optimal path.",
};

const SEED_MEMORY: HierarchicalMemoryView = {
  tenant_id: "tn_client_enterprise",
  l1_scratchpad: [
    {
      node_id: "mem_l1_01",
      tier: "L1_SCRATCHPAD",
      content: "Active WAN latency telemetry: US-East to EU-Central measured at 68ms round-trip.",
      importance: 0.65,
      retention_strength: 0.85,
      activation_energy: 0.90,
      last_accessed: new Date(Date.now() - 300000).toISOString(),
      associations: ["network_latency", "wan_heartbeat"],
      metadata: { volatile: true },
    },
    {
      node_id: "mem_l1_02",
      tier: "L1_SCRATCHPAD",
      content: "Candidate Raft election timeout set to 300ms window with 50ms random jitter.",
      importance: 0.70,
      retention_strength: 0.88,
      activation_energy: 0.85,
      last_accessed: new Date(Date.now() - 240000).toISOString(),
      associations: ["raft_config", "election_timeout"],
      metadata: { volatile: true },
    },
  ],
  l2_episodic: [
    {
      node_id: "mem_l2_01",
      tier: "L2_EPISODIC",
      content: "Session Task 123: Evaluated split-brain mitigation across heterogeneous VPS networks.",
      importance: 0.82,
      retention_strength: 0.74,
      activation_energy: 0.60,
      last_accessed: new Date(Date.now() - 86400000).toISOString(),
      associations: ["split_brain", "quorum_fencing"],
      metadata: { elapsed_hours: 24.0, stability_s: 18.0 },
    },
    {
      node_id: "mem_l2_02",
      tier: "L2_EPISODIC",
      content: "Session Task 118: Zero-Knowledge leaf proofs verified for 12 enterprise contracts.",
      importance: 0.85,
      retention_strength: 0.61,
      activation_energy: 0.52,
      last_accessed: new Date(Date.now() - 172800000).toISOString(),
      associations: ["zkp_attestation", "merkle_root"],
      metadata: { elapsed_hours: 48.0, stability_s: 18.0 },
    },
  ],
  l3_semantic: [
    {
      node_id: "mem_l3_01",
      tier: "L3_SEMANTIC",
      content: "Invariant: Multi-region vector consensus requires minimum (N/2 + 1) voter nodes with strict monotonic terms.",
      importance: 0.98,
      retention_strength: 0.99,
      activation_energy: 0.95,
      last_accessed: new Date(Date.now() - 600000).toISOString(),
      associations: ["raft_consensus", "distributed_systems", "pgvector_sharding"],
      metadata: { contraction_ratio: 0.78, consolidation_source: "plan_got_pgvector_failover" },
    },
    {
      node_id: "mem_l3_02",
      tier: "L3_SEMANTIC",
      content: "Pattern: Ebbinghaus exponential decay ensures high cognitive throughput by contracting completed session traces.",
      importance: 0.95,
      retention_strength: 0.98,
      activation_energy: 0.92,
      last_accessed: new Date(Date.now() - 1200000).toISOString(),
      associations: ["ebbinghaus_decay", "hierarchical_memory", "knowledge_distillation"],
      metadata: { contraction_ratio: 0.84, consolidation_source: "platform_battery_38" },
    },
  ],
  total_nodes: 6,
};

const SEED_LEDGER: LedgerEntry[] = [
  {
    id: "leg_01",
    action: "ORIGIN",
    timestamp: "10:14:02",
    details: "Initialized GoT root thought (v_0) from client goal.",
    delta: "+0.50 (Initial)",
  },
  {
    id: "leg_02",
    action: "GENERATE",
    timestamp: "10:14:15",
    details: "Generated 3 candidate branches (v_1, v_2, v_3) spanning Raft, Streaming, and SAN.",
    delta: "+0.22, +0.18, -0.22",
  },
  {
    id: "leg_03",
    action: "PRUNE",
    timestamp: "10:14:28",
    details: "Pruned branch v_3 (SAN shared volume) due to score 0.28 < threshold 0.35.",
    delta: "Pruned (1 branch)",
  },
  {
    id: "leg_04",
    action: "REFINE",
    timestamp: "10:14:45",
    details: "Refined v_1 with WAN lease-based heartbeat timers (v_4).",
    delta: "+0.09 (Score: 0.81)",
  },
  {
    id: "leg_05",
    action: "AGGREGATE",
    timestamp: "10:15:02",
    details: "Multi-parent aggregation of [v_1, v_2] into hybrid consensus architecture (v_5).",
    delta: "+0.16 boost (Score: 0.88)",
  },
  {
    id: "leg_06",
    action: "CONVERGE",
    timestamp: "10:15:20",
    details: "Optimal path converged via Kahn DP: [v_0 -> v_1 -> v_5 -> v_6].",
    delta: "Final Score: 0.94",
  },
];

export function GotPlanningPanel({
  client,
  tenantId = "tn_client_enterprise",
  hidden = false,
}: GotPlanningPanelProps) {
  const [activeTab, setActiveTab] = useState<SubTabKey>("canvas");
  const [queryInput, setQueryInput] = useState(
    "Synthesize optimal multi-region pgvector failover with Raft consensus"
  );
  const [plan, setPlan] = useState<GoTPlanResponse>(SEED_PLAN);
  const [memory, setMemory] = useState<HierarchicalMemoryView>(SEED_MEMORY);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<string>("ALL");
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Simulator parameter state
  const [simBranchFactor, setSimBranchFactor] = useState(3);
  const [simAggregationInDegree, setSimAggregationInDegree] = useState(3);
  const [simDepth, setSimDepth] = useState(4);
  const [simElapsedHours, setSimElapsedHours] = useState(24);
  const [simRetentionS, setSimRetentionS] = useState(18);

  // Fetch live memory and plan on mount if client exists
  const fetchLiveState = useCallback(async () => {
    if (!client) return;
    try {
      const mem = await client.getHierarchicalMemory();
      if (mem && mem.l1_scratchpad) {
        setMemory(mem);
      }
    } catch {
      // Fallback to seed memory
    }
  }, [client]);

  useEffect(() => {
    if (hidden) return;
    const timer = setTimeout(() => {
      void fetchLiveState();
    }, 0);
    return () => clearTimeout(timer);
  }, [hidden, fetchLiveState]);

  // Handle plan creation
  const handleCreatePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    setIsBusy(true);
    setStatusMessage("Creating GoT plan & initializing root thought...");
    try {
      if (client) {
        const res = await client.createGoTPlan({
          query: queryInput.trim(),
          branch_factor: 3,
          max_depth: 4,
          prune_threshold: 0.35,
          convergence_threshold: 0.85,
        });
        setPlan(res);
        setLedger((prev) => [
          {
            id: `leg_${Date.now()}`,
            action: "ORIGIN",
            timestamp: new Date().toLocaleTimeString(),
            details: `Initialized new GoT plan: "${queryInput.slice(0, 45)}..."`,
            delta: "+0.50 (Initial)",
          },
          ...prev,
        ]);
        setStatusMessage("Plan initialized successfully.");
      } else {
        // Deterministic local creation
        const rootNodeId = "v_0";
        const newPlan: GoTPlanResponse = {
          plan_id: `plan_${Date.now().toString(36)}`,
          graph: {
            plan_id: `plan_${Date.now().toString(36)}`,
            tenant_id: tenantId,
            query: queryInput.trim(),
            nodes: {
              [rootNodeId]: {
                node_id: rootNodeId,
                plan_id: `plan_${Date.now().toString(36)}`,
                parent_ids: [],
                thought_type: "ORIGIN",
                status: "EVALUATING",
                content: `Initial goal: ${queryInput.trim()}`,
                score: 0.50,
                depth: 0,
                memory_tier: "L1_SCRATCHPAD",
                retention_strength: 1.0,
                metadata: { in_degree: 0, out_degree: 0 },
                created_at: new Date().toISOString(),
              },
            },
            edges: [],
            root_node_id: rootNodeId,
            converged_node_id: null,
            optimal_path: [rootNodeId],
            iterations_count: 0,
            is_converged: false,
            created_at: new Date().toISOString(),
          },
          message: "New GoT plan initialized.",
        };
        setPlan(newPlan);
        setSelectedNodeIds([]);
        setStatusMessage("New GoT plan created (Local engine active).");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Error initializing plan: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Step action (generate branches)
  const handleGenerateBranch = async () => {
    setIsBusy(true);
    setStatusMessage("Generating exploratory reasoning branches (1 -> N)...");
    try {
      if (client) {
        const res = await client.stepGoTPlan(plan.plan_id, {
          action: "generate",
          node_id: selectedNodeIds[0] || plan.graph.root_node_id,
        });
        setPlan(res);
        setLedger((prev) => [
          {
            id: `leg_${Date.now()}`,
            action: "GENERATE",
            timestamp: new Date().toLocaleTimeString(),
            details: "Generated candidate branches from parent thought.",
            delta: "+0.18 average score",
          },
          ...prev,
        ]);
        setStatusMessage("Branches generated.");
      } else {
        // Local simulation
        const parentId = selectedNodeIds[0] || plan.graph.root_node_id;
        const parent = plan.graph.nodes[parentId] || plan.graph.nodes[plan.graph.root_node_id];
        const nextDepth = parent.depth + 1;
        const nextIdx = Object.keys(plan.graph.nodes).length;
        const newNodes: Record<string, GoTThoughtNode> = { ...plan.graph.nodes };
        const newEdges = [...plan.graph.edges];

        for (let i = 0; i < 3; i++) {
          const nid = `v_${nextIdx + i}`;
          const score = roundTo(Math.min(0.95, parent.score + 0.12 + i * 0.05), 2);
          newNodes[nid] = {
            node_id: nid,
            plan_id: plan.plan_id,
            parent_ids: [parentId],
            thought_type: "GENERATION",
            status: "EXPLORING",
            content: `Candidate ${nid}: Decomposed reasoning hypothesis exploring vector shard stability (Variant ${i + 1}).`,
            score,
            depth: nextDepth,
            memory_tier: "L1_SCRATCHPAD",
            retention_strength: 0.95,
            metadata: { in_degree: 1, out_degree: 0 },
            created_at: new Date().toISOString(),
          };
          newEdges.push({
            source_id: parentId,
            target_id: nid,
            edge_type: "GENERATION",
            weight: score,
          });
        }

        setPlan({
          ...plan,
          graph: {
            ...plan.graph,
            nodes: newNodes,
            edges: newEdges,
            optimal_path: [...plan.graph.optimal_path, `v_${nextIdx}`],
            iterations_count: plan.graph.iterations_count + 1,
          },
        });
        setStatusMessage("Generated 3 candidate branches.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Step error: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Aggregate selected thoughts (M -> 1)
  const handleAggregate = async () => {
    if (selectedNodeIds.length < 2) {
      setStatusMessage("Select at least 2 thoughts to aggregate (M -> 1).");
      return;
    }

    setIsBusy(true);
    setStatusMessage(`Synthesizing & aggregating ${selectedNodeIds.length} thoughts into a unified consensus...`);
    try {
      if (client) {
        const res = await client.aggregateGoTThoughts(plan.plan_id, {
          parent_node_ids: selectedNodeIds,
          prompt: "Synthesize consensus across divergent reasoning branches",
        });
        setPlan(res);
        setLedger((prev) => [
          {
            id: `leg_${Date.now()}`,
            action: "AGGREGATE",
            timestamp: new Date().toLocaleTimeString(),
            details: `Aggregated [${selectedNodeIds.join(", ")}] into synthesis thought.`,
            delta: "+0.15 synergetic boost",
          },
          ...prev,
        ]);
        setSelectedNodeIds([]);
        setStatusMessage("Aggregation complete.");
      } else {
        // Local simulation of synergetic aggregation math
        const parents = selectedNodeIds.map((id) => plan.graph.nodes[id]).filter(Boolean);
        const avgScore = parents.reduce((acc, n) => acc + n.score, 0) / parents.length;
        const alphaBoost = 0.15 * Math.sqrt((parents.length - 1) / parents.length);
        const aggScore = roundTo(Math.min(1.0, avgScore + alphaBoost), 2);

        const nid = `v_agg_${Date.now().toString(36).slice(-3)}`;
        const maxParentDepth = Math.max(...parents.map((p) => p.depth));
        const newNodes = { ...plan.graph.nodes };
        const newEdges = [...plan.graph.edges];

        newNodes[nid] = {
          node_id: nid,
          plan_id: plan.plan_id,
          parent_ids: selectedNodeIds,
          thought_type: "AGGREGATION",
          status: "EXPLORING",
          content: `Synergetic Synthesis: Unified resolution reconciling [${selectedNodeIds.join(", ")}] with consensus boost (+${roundTo(alphaBoost, 2)}).`,
          score: aggScore,
          depth: maxParentDepth + 1,
          memory_tier: "L1_SCRATCHPAD",
          retention_strength: 0.98,
          metadata: { in_degree: selectedNodeIds.length, out_degree: 0 },
          created_at: new Date().toISOString(),
        };

        selectedNodeIds.forEach((pid) => {
          newEdges.push({
            source_id: pid,
            target_id: nid,
            edge_type: "AGGREGATION",
            weight: aggScore,
          });
        });

        setPlan({
          ...plan,
          graph: {
            ...plan.graph,
            nodes: newNodes,
            edges: newEdges,
            optimal_path: [...plan.graph.optimal_path, nid],
            iterations_count: plan.graph.iterations_count + 1,
          },
        });
        setSelectedNodeIds([]);
        setStatusMessage(`Thoughts aggregated with synergetic boost: +${roundTo(alphaBoost, 2)}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Aggregation error: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Autonomous execution
  const handleExecuteAutonomous = async () => {
    setIsBusy(true);
    setStatusMessage("Running autonomous GoT execution loop (Kahn Topo DP)...");
    try {
      if (client) {
        const res = await client.executeGoTPlan(plan.plan_id, 10);
        setPlan(res);
        setLedger((prev) => [
          {
            id: `leg_${Date.now()}`,
            action: "CONVERGE",
            timestamp: new Date().toLocaleTimeString(),
            details: "Autonomous loop converged on optimal reasoning trajectory.",
            delta: "Optimal Path Backtracked",
          },
          ...prev,
        ]);
        setStatusMessage("Autonomous execution converged.");
      } else {
        setPlan(SEED_PLAN);
        setStatusMessage("Autonomous execution completed (Converged on optimal path).");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Execution error: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Distill plan to L3 Semantic memory
  const handleDistillPlan = async () => {
    setIsBusy(true);
    setStatusMessage("Distilling converged DAG into L3 Semantic memory graph...");
    try {
      if (client) {
        const res = await client.distillGoTPlan(plan.plan_id, { target_tier: "L3_SEMANTIC" });
        setStatusMessage(`Distillation complete: ${res.nodes_consolidated} thoughts consolidated.`);
        await fetchLiveState();
      } else {
        const newSemanticNode = {
          node_id: `mem_l3_${Date.now().toString(36).slice(-4)}`,
          tier: "L3_SEMANTIC" as MemoryTier,
          content: `Distilled Invariant: ${plan.graph.query} successfully synthesized into high-order persistent graph.`,
          importance: 0.96,
          retention_strength: 0.99,
          activation_energy: 0.94,
          last_accessed: new Date().toISOString(),
          associations: ["got_distillation", "converged_synthesis"],
          metadata: { contraction_ratio: 0.83 },
        };
        setMemory((prev) => ({
          ...prev,
          l3_semantic: [newSemanticNode, ...prev.l3_semantic],
          total_nodes: prev.total_nodes + 1,
        }));
        setStatusMessage("Plan distilled into L3 Semantic Memory (Contraction: 83%).");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Distillation error: ${msg}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Simulator calculation derived deterministically
  const simResult = useMemo<GoTSimulateResponse>(() => {
    const theoreticalPaths = Math.pow(simBranchFactor, simDepth);
    const pruneRate = 0.40;
    const prunedBranches = Math.floor(theoreticalPaths * pruneRate);
    const effectiveSearchSpace = Math.max(1, theoreticalPaths - prunedBranches);
    const ebbinghausDecay = Math.exp(-simElapsedHours / simRetentionS);
    const graphContractionRatio = 1.0 - effectiveSearchSpace / (theoreticalPaths || 1);

    return {
      theoretical_paths: theoreticalPaths,
      pruned_branches: prunedBranches,
      effective_search_space: effectiveSearchSpace,
      ebbinghaus_decay_retention: roundTo(ebbinghausDecay, 4),
      graph_contraction_ratio: roundTo(Math.max(0.1, graphContractionRatio), 4),
      synthesis_notes: [
        `Graph-of-Thoughts topological pruning contracts exponential search space (${theoreticalPaths} -> ${effectiveSearchSpace}).`,
        `Multi-parent aggregation (M=${simAggregationInDegree}) provides synergetic consensus boost of +${roundTo(
          0.15 * Math.sqrt((simAggregationInDegree - 1) / simAggregationInDegree),
          2
        )} to evaluation scores.`,
        `Ebbinghaus forgetting curve R(t)=exp(-${simElapsedHours}/${simRetentionS}) retains ${roundTo(
          ebbinghausDecay * 100,
          1
        )}% episodic memory strength.`,
      ],
    };
  }, [simBranchFactor, simAggregationInDegree, simDepth, simElapsedHours, simRetentionS]);

  // Group nodes by depth for canvas layout
  const nodesByDepth = useMemo(() => {
    const map = new Map<number, GoTThoughtNode[]>();
    Object.values(plan.graph.nodes).forEach((node) => {
      const d = node.depth;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(node);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [plan]);

  // Filtered ledger entries
  const filteredLedger = useMemo(() => {
    if (ledgerFilter === "ALL") return ledger;
    return ledger.filter((item) => item.action === ledgerFilter);
  }, [ledger, ledgerFilter]);

  if (hidden) return null;

  return (
    <div className={styles.container}>
      {/* Header & Meta Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleWithBadge}>
              <h2 className={styles.title}>Graph-of-Thoughts & Hierarchical Memory</h2>
              <span className={styles.batteryBadge}>Platform Battery #38</span>
            </div>
            <p className={styles.subtitle}>
              Non-linear Directed Acyclic Graph (DAG) cognitive planning with multi-parent thought aggregation,
              Kahn’s topological optimal path dynamic programming, and 3-tier hierarchical memory governed by
              Hermann Ebbinghaus’s exponential forgetting curve.
            </p>
          </div>

          <div className={styles.metaStats}>
            <div className={styles.statPill}>
              <span className={plan.graph.is_converged ? styles.pulseDot : styles.pulseDotIdle} />
              <span>Status: {plan.graph.is_converged ? "CONVERGED" : "EXPLORING"}</span>
            </div>
            <div className={styles.statPill}>
              <span>Iterations: {plan.graph.iterations_count}</span>
            </div>
            <div className={styles.statPill}>
              <span>Nodes: {Object.keys(plan.graph.nodes).length}</span>
            </div>
            <div className={styles.statPill}>
              <span>Edges: {plan.graph.edges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "canvas" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("canvas")}
        >
          Graph Topology DAG Canvas
          {activeTab === "canvas" && <span className={styles.activeIndicator} />}
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "memory" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("memory")}
        >
          Hierarchical Memory Pyramid (L1/L2/L3)
          {activeTab === "memory" && <span className={styles.activeIndicator} />}
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "ledger" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          Thought Transformation Ledger
          {activeTab === "ledger" && <span className={styles.activeIndicator} />}
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "simulator" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("simulator")}
        >
          GoT & Aggregation Math Simulator
          {activeTab === "simulator" && <span className={styles.activeIndicator} />}
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={styles.statPill} style={{ width: "100%", justifyContent: "space-between" }}>
          <span>{statusMessage}</span>
          <button
            type="button"
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
            onClick={() => setStatusMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* SUBVIEW 1: Graph Topology DAG Canvas */}
      {activeTab === "canvas" && (
        <div className={styles.canvasContainer}>
          {/* Prompt & Action Bar */}
          <div className={styles.controlBar}>
            <form className={styles.promptForm} onSubmit={handleCreatePlan}>
              <input
                type="text"
                className={styles.promptInput}
                placeholder="Enter reasoning goal or complex engineering query..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                disabled={isBusy}
              />
              <MagneticButton strength={0.25}>
                <button type="submit" className={styles.btnPrimary} disabled={isBusy}>
                  {isBusy ? "Processing..." : "Init GoT Plan"}
                </button>
              </MagneticButton>
            </form>

            <div className={styles.actionGroup}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleGenerateBranch}
                disabled={isBusy}
                title="Branch generation from selected or root thought (1 -> N)"
              >
                + Generate (1-&gt;3)
              </button>

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleAggregate}
                disabled={isBusy || selectedNodeIds.length < 2}
                title="Multi-parent aggregation (M -> 1)"
              >
                ⚡ Aggregate ({selectedNodeIds.length})
              </button>

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleExecuteAutonomous}
                disabled={isBusy}
                title="Run autonomous Kahn DP convergence loop"
              >
                🚀 Auto-Converge
              </button>
            </div>
          </div>

          {/* Layered DAG Grid */}
          <div className={styles.layerGrid}>
            {nodesByDepth.map(([depth, nodes]) => {
              const layerLabel =
                depth === 0
                  ? "Depth 0: Origin"
                  : depth === 1
                  ? "Depth 1: Candidates"
                  : depth === 2
                  ? "Depth 2: Synthesis"
                  : `Depth ${depth}: Converged`;

              return (
                <div key={depth} className={styles.layerColumn}>
                  <div className={styles.layerHeader}>
                    <span className={styles.layerTitle}>{layerLabel}</span>
                    <span className={styles.layerDepthBadge}>d={depth} ({nodes.length})</span>
                  </div>

                  <div className={styles.nodeCardList}>
                    {nodes.map((node) => {
                      const isSelected = selectedNodeIds.includes(node.node_id);
                      const isOptimal = plan.graph.optimal_path.includes(node.node_id);

                      const typeClass =
                        node.thought_type === "ORIGIN"
                          ? styles.typeOrigin
                          : node.thought_type === "GENERATION"
                          ? styles.typeGen
                          : node.thought_type === "AGGREGATION"
                          ? styles.typeAgg
                          : node.thought_type === "REFINEMENT"
                          ? styles.typeRef
                          : styles.typePrune;

                      return (
                        <div
                          key={node.node_id}
                          className={`${styles.nodeCard} ${isSelected ? styles.nodeCardSelected : ""} ${
                            isOptimal ? styles.nodeCardOptimal : ""
                          }`}
                          onClick={() => {
                            setSelectedNodeIds((prev) =>
                              prev.includes(node.node_id)
                                ? prev.filter((id) => id !== node.node_id)
                                : [...prev, node.node_id]
                            );
                          }}
                        >
                          {isOptimal && <span className={styles.optimalBadge}>★ OPTIMAL PATH</span>}

                          <div className={styles.nodeCardHeader}>
                            <span className={styles.nodeId}>{node.node_id}</span>
                            <div className={styles.badgeRow}>
                              <span className={`${styles.typeBadge} ${typeClass}`}>
                                {node.thought_type}
                              </span>
                              <span className={styles.layerDepthBadge}>
                                {node.memory_tier.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          <div className={styles.nodeBody}>{node.content}</div>

                          <div className={styles.scoreRow}>
                            <span>Score: {node.score.toFixed(2)}</span>
                            <div className={styles.scoreBarContainer}>
                              <div
                                className={styles.scoreBarFill}
                                style={{ width: `${Math.min(100, node.score * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className={styles.nodeFooter}>
                            <span>
                              Parents: {node.parent_ids.length > 0 ? node.parent_ids.join(", ") : "None"}
                            </span>
                            <span>Status: {node.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: Hierarchical Memory Pyramid */}
      {activeTab === "memory" && (
        <div className={styles.pyramidContainer}>
          <div className={styles.pyramidHeader}>
            <div>
              <h3 className={styles.tierTitle}>3-Tier Hierarchical Associative Memory</h3>
              <p className={styles.tierDesc}>
                Structured cognitive retention: transient scratchpad, decaying episodic session traces,
                and persistent semantic distilled invariants.
              </p>
            </div>
            <MagneticButton strength={0.25}>
              <button type="button" className={styles.btnPrimary} onClick={handleDistillPlan} disabled={isBusy}>
                Distill Plan into L3 Semantic
              </button>
            </MagneticButton>
          </div>

          {/* L1 Scratchpad */}
          <div className={styles.tierCard}>
            <div className={styles.tierCardTop}>
              <div className={styles.tierTitleWithBadge}>
                <span className={styles.tierBadgeL1}>Tier 1</span>
                <h4 className={styles.tierTitle}>L1 Scratchpad (Transient Buffer)</h4>
              </div>
              <span className={styles.layerDepthBadge}>{memory.l1_scratchpad.length} Active Nodes</span>
            </div>
            <p className={styles.tierDesc}>
              High-volatility reasoning workspace for in-flight plan iterations. Automatically pruned or promoted upon plan completion.
            </p>
            <div className={styles.memoryGrid}>
              {memory.l1_scratchpad.map((item) => (
                <div key={item.node_id} className={styles.memoryNodeCard}>
                  <div className={styles.memoryNodeHeader}>
                    <span>{item.node_id}</span>
                    <span>Activation: {(item.activation_energy * 100).toFixed(0)}%</span>
                  </div>
                  <div className={styles.memoryNodeContent}>{item.content}</div>
                  <div className={styles.associationTags}>
                    {item.associations.map((tag) => (
                      <span key={tag} className={styles.assocTag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* L2 Episodic Memory */}
          <div className={styles.tierCard}>
            <div className={styles.tierCardTop}>
              <div className={styles.tierTitleWithBadge}>
                <span className={styles.tierBadgeL2}>Tier 2</span>
                <h4 className={styles.tierTitle}>L2 Episodic Memory (Ebbinghaus Decay)</h4>
              </div>
              <span className={styles.layerDepthBadge}>{memory.l2_episodic.length} Traces</span>
            </div>
            <p className={styles.tierDesc}>
              Session and task-level memories subject to natural temporal forgetting via Hermann Ebbinghaus’s
              exponential curve: R(t) = exp(-t / S).
            </p>

            <div className={styles.decayContainer}>
              <div className={styles.decayStatsRow}>
                <span>Decay Model: R(t) = e^(-t / S)</span>
                <span>Active Stability S = 18.0h</span>
              </div>
              <div className={styles.decayProgress}>
                <div className={styles.decayProgressFill} style={{ width: "68%" }} />
              </div>
            </div>

            <div className={styles.memoryGrid}>
              {memory.l2_episodic.map((item) => (
                <div key={item.node_id} className={styles.memoryNodeCard}>
                  <div className={styles.memoryNodeHeader}>
                    <span>{item.node_id}</span>
                    <span>Retention: {(item.retention_strength * 100).toFixed(1)}%</span>
                  </div>
                  <div className={styles.memoryNodeContent}>{item.content}</div>
                  <div className={styles.associationTags}>
                    {item.associations.map((tag) => (
                      <span key={tag} className={styles.assocTag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* L3 Semantic Memory */}
          <div className={styles.tierCard}>
            <div className={styles.tierCardTop}>
              <div className={styles.tierTitleWithBadge}>
                <span className={styles.tierBadgeL3}>Tier 3</span>
                <h4 className={styles.tierTitle}>L3 Semantic Memory (Distilled Knowledge Graph)</h4>
              </div>
              <span className={styles.layerDepthBadge}>{memory.l3_semantic.length} Consolidated Concepts</span>
            </div>
            <p className={styles.tierDesc}>
              Permanent, cross-plan associative knowledge nodes formed by distilling converged GoT reasoning graphs.
            </p>

            <div className={styles.memoryGrid}>
              {memory.l3_semantic.map((item) => (
                <div key={item.node_id} className={styles.memoryNodeCard} style={{ borderLeft: "3px solid #10b981" }}>
                  <div className={styles.memoryNodeHeader}>
                    <span>{item.node_id}</span>
                    <span>Retention: {(item.retention_strength * 100).toFixed(0)}%</span>
                  </div>
                  <div className={styles.memoryNodeContent}>{item.content}</div>
                  <div className={styles.associationTags}>
                    {item.associations.map((tag) => (
                      <span key={tag} className={styles.assocTag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: Thought Transformation Ledger */}
      {activeTab === "ledger" && (
        <div className={styles.ledgerContainer}>
          <div className={styles.ledgerFilterRow}>
            {["ALL", "ORIGIN", "GENERATE", "AGGREGATE", "REFINE", "PRUNE", "CONVERGE"].map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterBtn} ${ledgerFilter === f ? styles.filterBtnActive : ""}`}
                onClick={() => setLedgerFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className={styles.ledgerTableCard}>
            <table className={styles.ledgerTable}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Transformation Details</th>
                  <th>Score Delta / Impact</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((item) => (
                  <tr key={item.id} className={styles.ledgerRow}>
                    <td style={{ fontFamily: "var(--font-mono, monospace)" }}>{item.timestamp}</td>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${
                          item.action === "ORIGIN"
                            ? styles.typeOrigin
                            : item.action === "GENERATE"
                            ? styles.typeGen
                            : item.action === "AGGREGATE"
                            ? styles.typeAgg
                            : item.action === "REFINE"
                            ? styles.typeRef
                            : styles.typePrune
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td>{item.details}</td>
                    <td style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>
                      {item.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 4: GoT & Aggregation Math Simulator */}
      {activeTab === "simulator" && (
        <div className={styles.simContainer}>
          <div className={styles.simGrid}>
            {/* Slider 1: Branch Factor */}
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Branch Factor (k)</span>
                <span className={styles.sliderValue}>{simBranchFactor}</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                className={styles.rangeSlider}
                value={simBranchFactor}
                onChange={(e) => setSimBranchFactor(Number(e.target.value))}
              />
              <span className={styles.statSubtext}>Number of reasoning candidates generated per step (1 -&gt; k)</span>
            </div>

            {/* Slider 2: Aggregation In-Degree */}
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Aggregation In-Degree (M)</span>
                <span className={styles.sliderValue}>{simAggregationInDegree}</span>
              </div>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                className={styles.rangeSlider}
                value={simAggregationInDegree}
                onChange={(e) => setSimAggregationInDegree(Number(e.target.value))}
              />
              <span className={styles.statSubtext}>Number of parent reasoning paths synthesized into a single thought</span>
            </div>

            {/* Slider 3: Depth */}
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Reasoning Depth (d)</span>
                <span className={styles.sliderValue}>{simDepth}</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                className={styles.rangeSlider}
                value={simDepth}
                onChange={(e) => setSimDepth(Number(e.target.value))}
              />
              <span className={styles.statSubtext}>Maximum search tree expansion depth before convergence</span>
            </div>

            {/* Slider 4: Elapsed Hours */}
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Ebbinghaus Elapsed Time (t)</span>
                <span className={styles.sliderValue}>{simElapsedHours}h</span>
              </div>
              <input
                type="range"
                min={0}
                max={72}
                step={1}
                className={styles.rangeSlider}
                value={simElapsedHours}
                onChange={(e) => setSimElapsedHours(Number(e.target.value))}
              />
              <span className={styles.statSubtext}>Elapsed time in hours since episodic memory creation</span>
            </div>

            {/* Slider 5: Stability S */}
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Memory Stability Factor (S)</span>
                <span className={styles.sliderValue}>{simRetentionS}h</span>
              </div>
              <input
                type="range"
                min={6}
                max={48}
                step={2}
                className={styles.rangeSlider}
                value={simRetentionS}
                onChange={(e) => setSimRetentionS(Number(e.target.value))}
              />
              <span className={styles.statSubtext}>Half-life constant dictating episodic forgetting curve</span>
            </div>
          </div>

          {/* Dynamic Telemetry Stats */}
          {simResult && (
            <div className={styles.simStatsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Theoretical Paths</span>
                <span className={styles.statValue}>
                  <NumberFlow value={simResult.theoretical_paths} />
                </span>
                <span className={styles.statSubtext}>Unpruned CoT/ToT combinations</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Pruned Branches</span>
                <span className={styles.statValue}>
                  <NumberFlow value={simResult.pruned_branches} />
                </span>
                <span className={styles.statSubtext}>Sub-threshold paths eliminated</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Effective Search Space</span>
                <span className={styles.statValue}>
                  <NumberFlow value={simResult.effective_search_space} />
                </span>
                <span className={styles.statSubtext}>Topological active trajectories</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Ebbinghaus Retention</span>
                <span className={styles.statValue}>
                  <NumberFlow
                    value={roundTo(simResult.ebbinghaus_decay_retention * 100, 1)}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  />
                  %
                </span>
                <span className={styles.statSubtext}>Active episodic memory strength</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Graph Contraction</span>
                <span className={styles.statValue}>
                  <NumberFlow
                    value={roundTo(simResult.graph_contraction_ratio * 100, 1)}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  />
                  %
                </span>
                <span className={styles.statSubtext}>Distillation compression ratio</span>
              </div>
            </div>
          )}

          {/* Mathematical Formulas Card */}
          <div className={styles.formulaCard}>
            <h4 className={styles.formulaTitle}>Mathematical Foundations & Algorithms</h4>
            <pre className={styles.formulaCode}>
{`1. Multi-Parent Aggregation Scoring Function:
   S(v_agg) = min(1.0, (1/m) * Σ S(u_j) + α * sqrt((m - 1) / m))
   Where α = 0.15 rewards multi-perspective consensus.

2. Dynamic Programming Optimal Path (via Kahn's Topo Sort):
   DP[v] = S(v) + max_{u ∈ Parents(v)} DP[u]
   π[v] = argmax_{u ∈ Parents(v)} DP[u]

3. Hermann Ebbinghaus Exponential Forgetting Curve:
   R(t) = exp(-t / S)
   Where t = elapsed hours, S = memory stability constant (18h default).

4. Cognitive Graph Distillation Contraction Ratio:
   C = 1 - (|V_distilled| / |V_raw|)`}
            </pre>
            {simResult?.synthesis_notes && (
              <ul className={styles.notesList}>
                {simResult.synthesis_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GotPlanningPanel;
