"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import ScrollSection from "@/components/ScrollSection/ScrollSection";
import MagneticButton from "@/components/ui/MagneticButton";
import { HeroCognitiveSandbox } from "@/components/rag/HeroCognitiveSandbox";
import { ArchitectureComparisonCanvas } from "@/components/rag/ArchitectureComparisonCanvas";
import { BatteriesBentoMatrix } from "@/components/rag/BatteriesBentoMatrix";
import { TcoCalculator } from "@/components/rag/TcoCalculator";
import { BenchmarkSection } from "@/components/rag/BenchmarkSection";
import { InteractiveWidgetCustomizer } from "@/components/rag/InteractiveWidgetCustomizer";
import { ComparisonSection } from "@/components/rag/ComparisonSection";
import { DeveloperApiSection } from "@/components/rag/DeveloperApiSection";
import { PricingSection } from "@/components/rag/PricingSection";
import { NAVBAR_SCROLL_OFFSET } from "@/lib/constants";
import styles from "@/components/rag/rag.module.css";

export default function RagLandingPage() {
  const lenis = useLenis();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo("#sandbox-demo", { duration: 1.2, offset: NAVBAR_SCROLL_OFFSET });
    } else {
      const el = document.getElementById("sandbox-demo");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.landingWrapper}>
      {/* 1. Hero & Strategic Value Proposition */}
      <ScrollSection gap={80} disableFade>
        <section className={styles.heroSection} id="home">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem" }}>
            <div className={styles.heroBadge}>
              ⚡ 38 Production Batteries • Sovereign Multi-Tenant Cognitive Engine
            </div>
            <Link href="/rag/benchmarks" style={{ textDecoration: "none" }}>
              <div className={styles.heroBadge} style={{ cursor: "pointer", borderColor: "var(--color-link)" }}>
                🛡️ Verified Production Telemetry on Oracle VPS →
              </div>
            </Link>
          </div>

          <h1 className={styles.heroTitle}>
            The Hexagonal Alternative to the Fragmented AI Stack
          </h1>

          <p className={styles.heroSubtitle}>
            Replace the bloated LangChain + Pinecone + Cohere mesh with a single, high-performance PostgreSQL pgvector engine.
            Local-first Ollama embeddings ($0 token cost), hybrid BM25 + HNSW + ColBERT MaxSim fusion, GraphRAG community detection, and verified zero-hallucination guardrails.
          </p>

          <div className={styles.heroCtas}>
            <MagneticButton strength={0.25}>
              <Link href="/rag/app" className="comic-btn comic-btn-blue">
                🚀 Launch App Studio (7-Day Trial)
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25}>
              <a href="#sandbox-demo" onClick={scrollToDemo} className="comic-btn comic-btn-outline">
                💬 Test Live Cognitive Sandbox
              </a>
            </MagneticButton>
          </div>

          {/* Live Interactive Cognitive Sandbox directly in Hero */}
          <div id="sandbox-demo" style={{ width: "100%" }}>
            <HeroCognitiveSandbox />
          </div>
        </section>
      </ScrollSection>

      {/* 2. The Fragmented Stack vs. The Retriever Hexagonal Core */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <ArchitectureComparisonCanvas />
      </ScrollSection>

      {/* 3. The 38 Production Batteries Bento Grid */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <BatteriesBentoMatrix />
      </ScrollSection>

      {/* 4. Infrastructure Economics & TCO Calculator */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <TcoCalculator />
      </ScrollSection>

      {/* 5. Empirical Load & Latency Benchmarks */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <BenchmarkSection />
      </ScrollSection>

      {/* 6. Interactive No-Code Widget Customizer */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <InteractiveWidgetCustomizer />
      </ScrollSection>

      {/* 7. Retriever AI vs Legacy Chatbots Comparison Matrix */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <ComparisonSection />
      </ScrollSection>

      {/* 8. Developer RAG REST API & SDK Showcase */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <DeveloperApiSection />
      </ScrollSection>

      {/* 9. Dynamic Geo-IP Pricing Section */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <PricingSection />
      </ScrollSection>

      {/* 10. Enterprise Custom Deployment Scoping Banner */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <div className={styles.scopingBanner}>
          <h2 className={styles.scopingBannerTitle}>Need a Dedicated or Private Cloud Cognitive Engine?</h2>
          <p className={styles.scopingBannerDesc}>
            We engineer custom on-premise RAG pipelines, multi-modal vector search systems, and HIPAA/GDPR-compliant enterprise knowledge hubs tailored to your compliance boundaries.
          </p>
          <MagneticButton strength={0.25}>
            <Link href="/scoping?engine=saas&goal=ai_rag_app" className="comic-btn comic-btn-blue">
              🛠️ Build Custom Scope in Scoping Lab →
            </Link>
          </MagneticButton>
        </div>
      </ScrollSection>
    </div>
  );
}
