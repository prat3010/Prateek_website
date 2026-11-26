"use client";

import { useState } from "react";
import { m } from "framer-motion";
import styles from "./ragStyles";

type CategoryKey = "all" | "retrieval" | "reasoning" | "memory" | "multimodal" | "security";

interface BatteryItem {
  id: number;
  icon: string;
  title: string;
  category: Exclude<CategoryKey, "all">;
  categoryLabel: string;
  badge: string;
  description: string;
}

const BATTERIES: BatteryItem[] = [
  // 1. Core Retrieval (4)
  {
    id: 1,
    icon: "⚡",
    title: "Sublinear BM25 Keyword Search",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Exact Match",
    description: "In-memory BM25 inverted index delivering sub-millisecond keyword matching for SKUs, error codes, and proper nouns.",
  },
  {
    id: 2,
    icon: "🔍",
    title: "pgvector HNSW Dense Embeddings",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "768-dim Cosine",
    description: "Approximate nearest-neighbor HNSW index in PostgreSQL with Row-Level Security tenant isolation.",
  },
  {
    id: 3,
    icon: "🎯",
    title: "Lexical MaxSim Late-Interaction Reranker",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Token-Level",
    description: "Fine-grained token-level late interaction computing maximum bigram similarity across query tokens.",
  },
  {
    id: 4,
    icon: "📄",
    title: "pdfplumber Layout Parser & Optional RapidOCR",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Layout Parser",
    description: "Parses multi-column PDFs and structured tables with optional RapidOCR for scanned document text.",
  },

  // 2. Cognitive Reasoning, Graph & ML (8)
  {
    id: 5,
    icon: "🐍",
    title: "RLM Python REPL Execution Sandbox",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Isolated Subprocess",
    description: "Subprocess-isolated Python execution with CPU/memory rlimits for programmatic data verification.",
  },
  {
    id: 6,
    icon: "🕸️",
    title: "GraphRAG HDBSCAN Community Clustering",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Unsupervised",
    description: "Extracts entity-relation triples and clusters global knowledge communities for multi-hop analytical reasoning.",
  },
  {
    id: 7,
    icon: "🔗",
    title: "Neo4j Cypher Labeled Property Graph",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Multi-Hop",
    description: "Optional Neo4j Cypher backend for deep relationship traversal alongside PostgreSQL graph storage.",
  },
  {
    id: 8,
    icon: "🛡️",
    title: "Telemetry Anomaly Sentinel",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Isolation Forest",
    description: "Monitors query latency, cache hit drops, and error spikes to surface tenant operational anomalies.",
  },
  {
    id: 9,
    icon: "🚀",
    title: "Serverless GPU & Dynamic vLLM / LoRA",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "LoRA Adapters",
    description: "Tenant-scoped LoRA embedding weight loading and serverless GPU cluster health orchestration.",
  },
  {
    id: 10,
    icon: "🤖",
    title: "Autonomous Multi-Turn ReAct Engine",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Tool Calling",
    description: "Iterative Reason-Act-Observe agent loop executing registered domain tools with bounded step budgets.",
  },
  {
    id: 11,
    icon: "🗳️",
    title: "Multi-Agent Consensus & Reflection Loop",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Arbitration",
    description: "Multi-model critique and consensus synthesis with automated faithfulness reflection.",
  },
  {
    id: 12,
    icon: "⚡",
    title: "System 1 Fast-Path Decision Plane",
    category: "reasoning",
    categoryLabel: "Cognitive & Graph",
    badge: "Jev Engine",
    description: "Low-latency intent classification and corrective retrieval routing before full LLM synthesis.",
  },

  // 3. Long-Horizon Memory (1)
  {
    id: 13,
    icon: "🧬",
    title: "Cognitive Agent Memory Consolidation",
    category: "memory",
    categoryLabel: "Agent Memory",
    badge: "768-dim + Ebbinghaus",
    description: "Ebbinghaus retention decay and 768-dim pgvector semantic consolidation across multi-session histories.",
  },

  // 4. Multimodal Vision (1)
  {
    id: 14,
    icon: "👁️",
    title: "Multimodal Vision GraphRAG & Schematics",
    category: "multimodal",
    categoryLabel: "Multimodal Vision",
    badge: "Vision LLM",
    description: "Extracts architectural diagrams and schematic entities via configured Vision LLMs with fail-closed HTTP 415/503 guards.",
  },

  // 5. Security, Edge & Platform Extensibility (11)
  {
    id: 15,
    icon: "🚦",
    title: "Edge AI Token Shield & Rate Limiter",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Rate-Limit",
    description: "Sliding-window token and request quotas enforced at both the edge proxy and FastAPI router layer.",
  },
  {
    id: 16,
    icon: "🔒",
    title: "Structured Safety & Moderation Rails",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Fail-Closed",
    description: "Structured input/output safety guard with configurable fail-closed policy enforcement.",
  },
  {
    id: 17,
    icon: "🗜️",
    title: "Heuristic Context Window Compression",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Token Budget",
    description: "Deterministic token-budget pruning to fit high-density retrieved chunks within model context limits.",
  },
  {
    id: 18,
    icon: "⚖️",
    title: "Programmable Rule & Policy Guardrails",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Postgres RLS",
    description: "Tenant-persisted regex and policy guardrail rules enforcing PII redaction and topic boundaries.",
  },
  {
    id: 19,
    icon: "📡",
    title: "Sovereign Edge SQLite & Vector Sync",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Delta Sync",
    description: "Offline-capable edge node delta synchronization and local bundle manifest generation.",
  },
  {
    id: 20,
    icon: "🔌",
    title: "Universal MCP Tool Server",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "JSON-RPC 2.0",
    description: "Exposes tenant search, chat, and active platform tools to Cursor, Claude Desktop, and IDE agents.",
  },
  {
    id: 21,
    icon: "🔄",
    title: "Enterprise CDC & Community Connectors",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "8 Connectors",
    description: "Live API connectors for GitHub, Slack, Notion, Confluence, Jira, Google Drive, S3, and PostgreSQL.",
  },
  {
    id: 22,
    icon: "🔐",
    title: "Signed Merkle Vector Attestation",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Ed25519 + SHA-256",
    description: "Ed25519-signed SHA-256 Merkle document roots and grounding certificates persisted in PostgreSQL RLS.",
  },
  {
    id: 23,
    icon: "🪪",
    title: "Enterprise Identity Federation & RB-VAC",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "SAML 2.0 / SCIM",
    description: "SAML 2.0 assertion validation, SHA-256 SCIM bearer provisioning, and role-based vector access control.",
  },
  {
    id: 24,
    icon: "📑",
    title: "Enterprise SaaS Connectors with ACLs",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Document ACL",
    description: "Inherits source document permissions so users only retrieve chunks they are authorized to read.",
  },
  {
    id: 25,
    icon: "🧩",
    title: "Visual DAG Workflow Canvas & Composer",
    category: "security",
    categoryLabel: "Security & Platform",
    badge: "Kahn Topo-Sort",
    description: "Declarative multi-step RAG pipeline compiler and executor wired to live hybrid search and LLM ports.",
  },
];

export function BatteriesBentoMatrix() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  const filteredBatteries = activeCategory === "all"
    ? BATTERIES
    : BATTERIES.filter((b) => b.category === activeCategory);

  return (
    <section className={styles.matrixSection} id="batteries">
      {/* Header */}
      <div className={styles.matrixHeader}>
        <div className={styles.matrixBadge}>
          ⚡ Unified Architecture • {BATTERIES.length} Verified Engine Batteries
        </div>
        <h2 className={styles.matrixTitle}>
          Engineered Without Bloat or Multi-Vendor Glue
        </h2>
        <p className={styles.matrixSubtitle}>
          Retriever integrates {BATTERIES.length} core production RAG capabilities into a single high-performance engine—eliminating brittle multi-vendor dependencies.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: "all", label: `All Capabilities (${BATTERIES.length})` },
          { key: "retrieval", label: "Core Retrieval (4)" },
          { key: "reasoning", label: "Cognitive & Graph (8)" },
          { key: "memory", label: "Agent Memory (1)" },
          { key: "multimodal", label: "Multimodal Vision (1)" },
          { key: "security", label: "Security & Platform (11)" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.filterBtn} ${activeCategory === tab.key ? styles.filterBtnActive : ""}`}
            onClick={() => setActiveCategory(tab.key as CategoryKey)}
          >
            {activeCategory === tab.key && (
              <m.span
                layoutId="batteryFilterPill"
                className={styles.filterPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <div className={styles.bentoGrid}>
        {filteredBatteries.map((battery) => (
          <div key={battery.id} className={styles.bentoCard}>
            <div className={styles.bentoCardTop}>
              <span className={styles.bentoIcon}>{battery.icon}</span>
              <span className={styles.bentoBadge}>{battery.badge}</span>
            </div>
            <h3 className={styles.bentoTitle}>{battery.title}</h3>
            <p className={styles.bentoDesc}>{battery.description}</p>
            <div className={styles.bentoFooter}>
              <span className={styles.bentoCategory}>{battery.categoryLabel}</span>
              <span className={styles.bentoId}>#{String(battery.id).padStart(2, "0")}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
