import type { Metadata } from "next";
import Link from "next/link";
import ScrollSection from "@/components/ScrollSection/ScrollSection";
import { BenchmarkSection } from "@/components/rag/BenchmarkSection";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./benchmarks.module.css";

export const metadata: Metadata = {
  title: "Retriever AI — Empirical Load & Latency Benchmarks | Prateeq Sharma",
  description:
    "Verified empirical load testing and latency benchmarks for Retriever. 100% genuine network telemetry, microsecond timers, and Zero-Toy static AST compliance.",
  alternates: {
    canonical: "/rag/benchmarks",
  },
  openGraph: {
    title: "Retriever AI — Empirical Load & Latency Benchmarks",
    description:
      "Verified concurrent load sweeps (5–20 VUs) against production Oracle Cloud VPS and PostgreSQL 16 pgvector HNSW.",
    url: "https://prateeq.in/rag/benchmarks",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Retriever AI — Empirical Load & Latency Benchmarks",
    description:
      "Genuine network telemetry and microsecond load benchmarks for Retriever AI.",
  },
};

const benchmarksJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      "headline": "Retriever AI — Empirical Load & Latency Benchmarks",
      "description":
        "Verified empirical load testing and latency benchmarks for Retriever AI on Oracle Cloud VPS and PostgreSQL 16 pgvector.",
      "url": "https://prateeq.in/rag/benchmarks",
      "image": "https://prateeq.in/rag/benchmarks/opengraph-image",
      "datePublished": "2026-10-15",
      "dateModified": "2026-11-26",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://prateeq.in/rag/benchmarks",
      },
      "author": {
        "@type": "Person",
        "name": "Prateeq Sharma",
        "url": "https://prateeq.in",
      },
      "publisher": {
        "@type": "Person",
        "name": "Prateeq Sharma",
        "url": "https://prateeq.in",
      },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://prateeq.in" },
        { "@type": "ListItem", "position": 2, "name": "Retriever AI", "item": "https://prateeq.in/rag" },
        { "@type": "ListItem", "position": 3, "name": "Benchmarks", "item": "https://prateeq.in/rag/benchmarks" },
      ],
    },
  ],
};

export default function BenchmarksPage() {
  return (
    <div className={styles.pageWrapper}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(benchmarksJsonLd) }}
      />
      <ScrollSection gap={40} disableFade>
        {/* Navigation Bar */}
        <nav className={styles.navBar}>
          <Link href="/rag" className={styles.backLink}>
            ← Back to Retriever Overview
          </Link>
          <div className={styles.navActions}>
            <Link href="/rag/app" className={styles.studioLink}>
              Launch Studio →
            </Link>
          </div>
        </nav>

        {/* Main Benchmark Section */}
        <BenchmarkSection headingLevel="h1" />

        {/* Engineering Deep-Dive & Root-Cause Post-Mortem */}
        <section className={styles.deepDiveSection}>
          <div className={styles.deepDiveCard}>
            <h2 className={styles.deepDiveTitle}>
              🔍 Engineering Methodology & The 20-VU Breaking Point
            </h2>
            <p className={styles.deepDiveText}>
              Unlike typical AI portfolio projects that show static synthetic graphs, these numbers were captured live via
              concurrent asynchronous worker sweeps hitting our production Oracle Cloud VPS (<code>130.210.35.134</code>)
              across public internet HTTPS routing.
            </p>

            <div className={styles.insightGrid}>
              <div className={styles.insightCard}>
                <h3 className={styles.insightTitle}>1. Concurrency Stability (5–10 VUs)</h3>
                <p className={styles.insightText}>
                  Zero failures recorded (<code>0.0%</code> error rate across 30 requests at 5 VUs and 60 requests at 10 VUs). Edge ASGI liveness answered in <code>272.43ms</code>–<code>294.22ms</code> p50, and PostgreSQL 16 connection pool readiness (<code>SELECT 1</code>) completed in <code>2203.61ms</code>–<code>2789.13ms</code> p50 end-to-end HTTPS latency from client to VPS.
                </p>
              </div>

              <div className={styles.insightCard}>
                <h3 className={styles.insightTitle}>2. Sustained Burst Throughput (20 VUs)</h3>
                <p className={styles.insightText}>
                  At 20 concurrent virtual users generating 120 burst requests over 19.18s, 105 requests succeeded with a <code>12.5%</code> error rate under 1-OCPU Oracle VPS saturation (<code>2184.94ms</code> aggregated p50, <code>3722.89ms</code> p95, <code>6.3 req/s</code>), while PostgreSQL readiness probes stayed at <code>0.0%</code> errors (<code>2196.95ms</code> p50).
                </p>
              </div>

              <div className={styles.insightCard}>
                <h3 className={styles.insightTitle}>3. Gate 10 Zero-Toy Guarantee</h3>
                <p className={styles.insightText}>
                  Zero mocks, zero synthetic math boost formulas. All measurements are backed by genuine Python <code>time.perf_counter()</code> microsecond timers and verified by automated static AST linters.
                </p>
              </div>
            </div>

            <div className={styles.ctaRow}>
              <MagneticButton strength={0.25}>
                <Link href="/rag" className={styles.primaryCta}>
                  Explore Retriever Platform
                </Link>
              </MagneticButton>
              <Link href="/scoping?goal=ai_rag_app" className={styles.studioLink}>
                Scope Custom RAG Deployment →
              </Link>
            </div>
          </div>
        </section>
      </ScrollSection>
    </div>
  );
}
