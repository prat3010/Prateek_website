"use client";

import TiltCard from "@/components/ui/TiltCard";
import styles from "./ArchitectureComparisonCanvas.module.css";

export function ArchitectureComparisonCanvas() {
  return (
    <section className={styles.canvasSection} id="architecture">
      {/* Header */}
      <div className={styles.canvasHeader}>
        <div className={styles.canvasBadge}>
          🏛️ Architectural Decoupling • Clean Hexagonal Topology
        </div>
        <h2 className={styles.canvasTitle}>
          The Fragmented Stack vs. The Retriever Hexagonal Core
        </h2>
        <p className={styles.canvasSubtitle}>
          Compare the bloated, multi-vendor AI mesh of 2024 against Retriever&apos;s unified PostgreSQL pgvector engine.
        </p>
      </div>

      {/* Grid */}
      <div className={styles.comparisonGrid}>
        {/* Left: Fragmented 2024 Stack */}
        <TiltCard maxAngle={1.5} glare={false}>
          <div className={`${styles.stackBox} ${styles.fragmentedBox}`}>
            <div className={styles.boxHeader}>
              <h3 className={styles.boxTitle}>The Fragmented AI Stack</h3>
              <span className={styles.boxBadgeRed}>6+ Disconnected Vendors</span>
            </div>

            <div className={styles.itemsList}>
              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>❌</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>LangChain / LlamaIndex Abstraction Overhead</strong>
                  <span className={styles.itemDesc}>Hundreds of leaky wrapper layers, fragile monkey-patches, and sluggish debug traces.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>❌</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Pinecone / Weaviate Vector SaaS Bill</strong>
                  <span className={styles.itemDesc}>$70 to $500+/mo for closed-source vector pods with proprietary query syntax and zero SQL joins.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>❌</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>OpenAI Embedding API Rate Limits</strong>
                  <span className={styles.itemDesc}>Metered per token ($0.02 to $0.13/1M tokens) with external network latency on every query.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>❌</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Cohere Rerank API Paywall</strong>
                  <span className={styles.itemDesc}>$1.00 per 1,000 requests, adding $300+/month in additional reranking bills under production load.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>❌</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Shared Unencrypted Multi-Tenancy</strong>
                  <span className={styles.itemDesc}>Namespace filtering without true database-level Row-Level Security (RLS), risking data leakage.</span>
                </div>
              </div>
            </div>

            <div className={styles.metricsFooter}>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Monthly Cloud Cost</span>
                <span className={styles.metricValue} style={{ color: "#ef4444" }}>~$1,420 / mo</span>
              </div>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Cold-Start Latency</span>
                <span className={styles.metricValue}>350ms – 900ms</span>
              </div>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Data Sovereignty</span>
                <span className={styles.metricValue}>Zero (3rd Party)</span>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Right: Retriever Hexagonal Core */}
        <TiltCard maxAngle={1.5} glare={false}>
          <div className={`${styles.stackBox} ${styles.retrieverBox}`}>
            <div className={styles.boxHeader}>
              <h3 className={styles.boxTitle}>Retriever Hexagonal Core</h3>
              <span className={styles.boxBadgeGreen}>1 Unified Engine</span>
            </div>

            <div className={styles.itemsList}>
              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>✅</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Single FastAPI + pgvector Architecture</strong>
                  <span className={styles.itemDesc}>Pure Python domain core using hexagonal ports &amp; adapters. Full SQL relational queries alongside HNSW vector math.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>✅</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Local-First Ollama Embeddings ($0 Cost)</strong>
                  <span className={styles.itemDesc}>Runs nomic-embed-text locally on CPU or GPU with zero external API calls and unlimited token throughput.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>✅</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>PostgreSQL Row-Level Security (RLS)</strong>
                  <span className={styles.itemDesc}>Hard cryptographic tenant isolation at the database kernel level; zero vector cross-contamination guarantee.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>✅</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Sub-15ms In-Memory Semantic Cache</strong>
                  <span className={styles.itemDesc}>Pre-indexes query vectors in Redis/Memory, delivering 0.0ms responses and reducing LLM inference costs by 60%.</span>
                </div>
              </div>

              <div className={styles.itemRow}>
                <span className={styles.itemIcon}>✅</span>
                <div className={styles.itemText}>
                  <strong className={styles.itemTitle}>Native GraphRAG &amp; ColBERT MaxSim</strong>
                  <span className={styles.itemDesc}>Built-in entity triples and late-interaction token matching without external third-party reranking services.</span>
                </div>
              </div>
            </div>

            <div className={styles.metricsFooter}>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Monthly Cloud Cost</span>
                <span className={styles.metricValue} style={{ color: "var(--pop-green, #22c55e)" }}>$0 – $79 / mo</span>
              </div>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Cold-Start Latency</span>
                <span className={styles.metricValue}>14ms – 45ms</span>
              </div>
              <div className={styles.metricCol}>
                <span className={styles.metricLabel}>Data Sovereignty</span>
                <span className={styles.metricValue}>100% On-Prem / VPC</span>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
