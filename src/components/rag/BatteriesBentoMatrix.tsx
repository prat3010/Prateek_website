"use client";

import { useState } from "react";
import { m } from "framer-motion";
import TiltCard from "@/components/ui/TiltCard";
import styles from "./BatteriesBentoMatrix.module.css";

type CategoryKey = "all" | "retrieval" | "reasoning" | "memory" | "multimodal" | "security";

interface BatteryItem {
  id: number;
  icon: string;
  title: string;
  category: "retrieval" | "reasoning" | "memory" | "multimodal" | "security";
  categoryLabel: string;
  badge: string;
  description: string;
}

const BATTERIES: BatteryItem[] = [
  // 1. Core Retrieval (1-8)
  {
    id: 1,
    icon: "⚡",
    title: "Dense pgvector HNSW",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Sub-5ms",
    description: "Hierarchical Navigable Small World graph indexing directly in PostgreSQL for ultra-fast approximate nearest neighbor vector search.",
  },
  {
    id: 2,
    icon: "🔍",
    title: "BM25 Okapi Sparse Search",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Lexical Match",
    description: "Exact term frequency and inverse document frequency scoring for precise acronyms, code identifiers, and SKU matching.",
  },
  {
    id: 3,
    icon: "🎯",
    title: "ColBERT MaxSim Multi-Vector",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Token-Level",
    description: "Fine-grained token-level late interaction computing maximum cosine similarity across all query tokens.",
  },
  {
    id: 4,
    icon: "⚖️",
    title: "Reciprocal Rank Fusion (RRF)",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "k=60 Constant",
    description: "Rank-based score normalization combining sparse and dense candidate lists without arbitrary score-scale distortion.",
  },
  {
    id: 5,
    icon: "📊",
    title: "Cross-Encoder Re-ranking",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "High Precision",
    description: "Deep transformer cross-attention scoring between query and top retrieved chunks for optimal context ranking.",
  },
  {
    id: 6,
    icon: "📂",
    title: "Parent-Child Chunk Expansion",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Context Window",
    description: "Indexes granular child chunks for precise vector hits while restoring full parent document context during generation.",
  },
  {
    id: 7,
    icon: "🚀",
    title: "Sub-15ms Semantic Vector Cache",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "60% Token Savings",
    description: "Pre-indexes query vector embeddings with cosine similarity gating to instantly serve cached responses at zero LLM cost.",
  },
  {
    id: 8,
    icon: "🔀",
    title: "Hybrid Dense-Sparse Fusion",
    category: "retrieval",
    categoryLabel: "Core Retrieval",
    badge: "Alpha Weighting",
    description: "Dynamically balances semantic vector embeddings and exact keyword tokens based on query intent classification.",
  },

  // 2. Cognitive Reasoning & Planning (9-15)
  {
    id: 9,
    icon: "🕸️",
    title: "GraphRAG Leiden Clustering",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Unsupervised",
    description: "Extracts entity-relation triples and clusters global knowledge communities for multi-hop analytical reasoning.",
  },
  {
    id: 10,
    icon: "🧠",
    title: "Graph-of-Thought (GoT) Planning",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Backtrackable",
    description: "Generates non-linear reasoning graphs allowing thoughts to branch, merge, and backtrack when dead ends are hit.",
  },
  {
    id: 11,
    icon: "🐍",
    title: "Recursive Language Modeling (RLM)",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Python REPL",
    description: "Sandboxed Python execution environment allowing LLMs to run code, verify mathematical calculations, and iterate autonomously.",
  },
  {
    id: 12,
    icon: "🗳️",
    title: "Multi-Agent Consensus Arbitration",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Debate & Vote",
    description: "Orchestrates multi-model debate between heterogeneous LLMs with automated majority voting and referee arbitration.",
  },
  {
    id: 13,
    icon: "✨",
    title: "DSPy Automated Prompt Optimization",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Self-Compiling",
    description: "Algorithmic prompt compilation and bootstrap few-shot optimization maximizing downstream assertion metrics.",
  },
  {
    id: 14,
    icon: "🛡️",
    title: "Self-Aware Corrective RAG (CRAG)",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "Zero Hallucination",
    description: "Evaluates document retrieval confidence before generation; rejects unbacked prompts instead of inventing answers.",
  },
  {
    id: 15,
    icon: "🔄",
    title: "Agentic Workflow DAG Orchestration",
    category: "reasoning",
    categoryLabel: "Cognitive Reasoning",
    badge: "State Machine",
    description: "Directed acyclic graphs for complex multi-step enterprise workflows with deterministic state transitions and checkpoints.",
  },

  // 3. Long-Horizon Memory & State (16-20)
  {
    id: 16,
    icon: "📈",
    title: "Ebbinghaus Spacing Memory",
    category: "memory",
    categoryLabel: "Long-Horizon Memory",
    badge: "Exponential Decay",
    description: "Mathematically models human memory retention curves, prioritizing reinforced knowledge while gradually decaying stale state.",
  },
  {
    id: 17,
    icon: "🪟",
    title: "Dynamic Working Context Window",
    category: "memory",
    categoryLabel: "Long-Horizon Memory",
    badge: "Adaptive Token Budget",
    description: "Dynamically allocates prompt token budgets between system constraints, active chat turns, and retrieved knowledge.",
  },
  {
    id: 18,
    icon: "📦",
    title: "Episodic Memory Buffers",
    category: "memory",
    categoryLabel: "Long-Horizon Memory",
    badge: "Session Replay",
    description: "Stores key user preferences, historical outcomes, and resolved edge cases across asynchronous conversation threads.",
  },
  {
    id: 19,
    icon: "💾",
    title: "Cross-Session Context Persistence",
    category: "memory",
    categoryLabel: "Long-Horizon Memory",
    badge: "Encrypted RLS",
    description: "Preserves user agent memory across browser restarts and device transitions with strict tenant database isolation.",
  },
  {
    id: 20,
    icon: "🧹",
    title: "Semantic Vector State Eviction",
    category: "memory",
    categoryLabel: "Long-Horizon Memory",
    badge: "LRU + Relevance",
    description: "Automatically cleans outdated and superseded document embeddings to maintain high index hygiene and low latency.",
  },

  // 4. Multimodal Ingestion & Vision (21-26)
  {
    id: 21,
    icon: "📄",
    title: "Docling Layout-Aware OCR",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "SOTA Parser",
    description: "Parses complex multi-column PDFs, extracting bounding boxes, headings, and semantic hierarchy.",
  },
  {
    id: 22,
    icon: "👁️",
    title: "Baidu PP-OCRv4 Vision Pipeline",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "Deep Learning",
    description: "High-accuracy text and character recognition on low-resolution scanned documents and photographic inputs.",
  },
  {
    id: 23,
    icon: "📊",
    title: "Structured Table & Markdown Extraction",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "Cell-Level Precision",
    description: "Converts tabular data into structured Markdown and JSON representations, preserving column relationships.",
  },
  {
    id: 24,
    icon: "📥",
    title: "Presigned Source PDF Citations",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "1-Click Download",
    description: "Generates secure, expiring download URLs allowing users to audit exact source documents directly from answers.",
  },
  {
    id: 25,
    icon: "🔌",
    title: "Cloud Data Ingestion Connectors",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "Drive / Notion",
    description: "Background synchronization pipelines for Google Drive, Notion, REST endpoints, and custom event webhooks.",
  },
  {
    id: 26,
    icon: "🌐",
    title: "Live Web Grounding Fallback",
    category: "multimodal",
    categoryLabel: "Multimodal & Ingestion",
    badge: "Tavily / Brave",
    description: "Automatically queries real-time web search APIs when internal tenant knowledge is silent on breaking topics.",
  },

  // 5. Enterprise Scale, Security & Sovereignty (27-38)
  {
    id: 27,
    icon: "🔒",
    title: "PostgreSQL RLS Multi-Tenancy",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Database-Level",
    description: "Enforces PostgreSQL Row-Level Security on every query; vectors and documents never leak across tenant boundaries.",
  },
  {
    id: 28,
    icon: "🛡️",
    title: "Deterministic Grounding & Citations",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Page-Level Match",
    description: "Extracts exact character ranges and page coordinates so every answer can be audited against original source text.",
  },
  {
    id: 29,
    icon: "📜",
    title: "SHA-256 Merkle Audit Verification",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Tamper-Evident",
    description: "Builds cryptographic hash trees across document chunks to verify dataset integrity and detect unauthorized document edits.",
  },
  {
    id: 30,
    icon: "☁️",
    title: "Resilient Circuit Breaker & Failover",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "High Availability",
    description: "Monitors upstream LLM and embedding latency, automatically failing over to backup providers when thresholds exceed SLA.",
  },
  {
    id: 31,
    icon: "🐇",
    title: "Celery & RabbitMQ Task Swarm",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Distributed Queue",
    description: "Processes massive document ingestion batches concurrently without blocking synchronous chat API requests.",
  },
  {
    id: 32,
    icon: "🆓",
    title: "Local-First Ollama ($0 Embeddings)",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "100% Free",
    description: "Generates high-dimensional vector embeddings locally using nomic-embed-text with zero external API fees or token limits.",
  },
  {
    id: 33,
    icon: "🔐",
    title: "SHA-256 Tamper-Evident Audit Chains",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "HIPAA / GDPR",
    description: "Cryptographic hash-linked audit logging with automated 90-day retention pruning for enterprise compliance.",
  },
  {
    id: 34,
    icon: "📡",
    title: "Real-Time SSE Streaming API",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Sub-100ms TTFT",
    description: "Streams tokens immediately via Server-Sent Events with structured citation events emitted dynamically during generation.",
  },
  {
    id: 35,
    icon: "💻",
    title: "1-Line Embeddable Script Widget",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "widget.js",
    description: "Drop a single script tag onto any website, Shopify store, or web portal to deploy a production AI concierge in seconds.",
  },
  {
    id: 36,
    icon: "⏱️",
    title: "Microsecond Structured Telemetry",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "W3C Traceparent",
    description: "Distributed trace IDs and microsecond latency tracking logged for every retrieval step and LLM token generation.",
  },
  {
    id: 37,
    icon: "🧪",
    title: "Automated Regression Benchmark",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "NDCG / Recall",
    description: "Statistical regression test suite asserting retrieval quality and relevance thresholds before releases.",
  },
  {
    id: 38,
    icon: "🏷️",
    title: "Self-Querying JSONB Metadata Filters",
    category: "security",
    categoryLabel: "Enterprise & Security",
    badge: "Natural Language -> SQL",
    description: "Automatically translates conversational constraints into PostgreSQL JSONB queries for precise filtered retrieval.",
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
          ⚡ Unified Architecture • High-Performance Core
        </div>
        <h2 className={styles.matrixTitle}>
          Engineered Without Bloat or Multi-Vendor Glue
        </h2>
        <p className={styles.matrixSubtitle}>
          Retriever integrates core production RAG capabilities into a single high-performance engine—eliminating brittle multi-vendor dependencies.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: "all", label: "All Capabilities (38)" },
          { key: "retrieval", label: "Core Retrieval (8)" },
          { key: "reasoning", label: "Cognitive Reasoning (7)" },
          { key: "memory", label: "Long-Horizon Memory (5)" },
          { key: "multimodal", label: "Multimodal & Vision (6)" },
          { key: "security", label: "Enterprise Scale & Security (12)" },
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
          <TiltCard key={battery.id} maxAngle={2} glare={false}>
            <div className={styles.batteryCard}>
              <div>
                <div className={styles.cardTop}>
                  <span className={styles.batteryIcon}>{battery.icon}</span>
                  <span className={styles.batteryNum}>#{String(battery.id).padStart(2, "0")}</span>
                </div>
                <h3 className={styles.batteryTitle}>{battery.title}</h3>
                <p className={styles.batteryDesc}>{battery.description}</p>
              </div>

              <div className={styles.cardBottom}>
                <span className={styles.categoryTag}>{battery.categoryLabel}</span>
                <span className={styles.badgeHighlight}>{battery.badge}</span>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
