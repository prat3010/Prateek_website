"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { useLenis } from "lenis/react";
import ScrollSection from "@/components/ScrollSection/ScrollSection";
import MagneticButton from "@/components/ui/MagneticButton";
import TiltCard from "@/components/ui/TiltCard";
import { PricingSection } from "@/components/rag/PricingSection";
import { InteractiveWidgetCustomizer } from "@/components/rag/InteractiveWidgetCustomizer";
import { ComparisonSection } from "@/components/rag/ComparisonSection";
import { DeveloperApiSection } from "@/components/rag/DeveloperApiSection";
import { BenchmarkSection } from "@/components/rag/BenchmarkSection";
import { NAVBAR_SCROLL_OFFSET } from "@/lib/constants";
import styles from "@/components/rag/rag.module.css";

export default function RagLandingPage() {
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const copySnippet = () => {
    navigator.clipboard.writeText(
      `<script src="https://prateeq.in/widget.js" data-tenant="YOUR_TENANT_ID" data-key="YOUR_API_KEY"></script>`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo("#demo", { duration: 1.2, offset: NAVBAR_SCROLL_OFFSET });
    } else {
      const el = document.getElementById("demo");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [heroTab, setHeroTab] = useState<"embed" | "response" | "engine">("embed");

  return (
    <div className={styles.landingWrapper}>
      {/* 1. Hero & Product Overview Section */}
      <ScrollSection gap={80} disableFade>
        <section className={styles.heroSection} id="home">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem" }}>
            <div className={styles.heroBadge}>
              ✨ Multi-Model Enterprise RAG • Powered by Llama 3.3 70B, Gemini 3.6 Flash, GPT-4o & BYOK
            </div>
            <Link href="/rag/benchmarks" style={{ textDecoration: "none" }}>
              <div className={styles.heroBadge} style={{ cursor: "pointer", borderColor: "var(--color-link)" }}>
                ⚡ Empirical Benchmarks • Verified Production Telemetry →
              </div>
            </Link>
          </div>

          <h1 className={styles.heroTitle}>
            Turn Your Documents & Website into an AI Assistant in 60 Seconds
          </h1>

          <p className={styles.heroSubtitle}>
            Zero coding required. Embed a self-aware, hallucination-free AI chatbot onto any website, Shopify store, or app with 1 line of script.
          </p>

          <div className={styles.heroCtas}>
            <MagneticButton strength={0.25}>
              <Link href="/rag/app" className="comic-btn comic-btn-blue">
                🚀 Launch App Studio
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25}>
              <a href="#demo" onClick={scrollToDemo} className="comic-btn comic-btn-outline">
                💬 Try Live Demo Below
              </a>
            </MagneticButton>
          </div>

          {/* Interactive Hero Showcase Window */}
          <div className={styles.heroShowcaseWindow}>
            <div className={styles.heroWindowHeader}>
              <div className={styles.heroWindowDots}>
                <span className={styles.windowDotRed} />
                <span className={styles.windowDotYellow} />
                <span className={styles.windowDotGreen} />
              </div>

              <div className={styles.heroWindowTabs}>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "embed" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("embed")}
                >
                  {heroTab === "embed" && (
                    <m.span
                      layoutId="ragHeroTabPill"
                      className={styles.heroTabPill}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  ⚡ 1-Line Script
                </button>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "response" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("response")}
                >
                  {heroTab === "response" && (
                    <m.span
                      layoutId="ragHeroTabPill"
                      className={styles.heroTabPill}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  🎯 Verified PDF Response
                </button>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "engine" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("engine")}
                >
                  {heroTab === "engine" && (
                    <m.span
                      layoutId="ragHeroTabPill"
                      className={styles.heroTabPill}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  🛡️ Self-Aware Engine
                </button>
              </div>
            </div>

            <div className={styles.heroWindowBody}>
              {heroTab === "embed" && (
                <div className={styles.heroShowcaseContent}>
                  <div className={styles.codeSnippetHeader}>
                    <span>embed-widget.html</span>
                    <button className={`comic-btn ${styles.copyBtn}`} onClick={copySnippet}>
                      {copied ? "✓ Copied!" : "Copy Snippet"}
                    </button>
                  </div>
                  <pre className={styles.heroCodeBlock}>
                    <code>
                      {"<script\n  src=\"https://prateeq.in/widget.js\"\n  data-tenant=\"YOUR_TENANT_ID\"\n  data-key=\"YOUR_API_KEY\">\n</script>"}
                    </code>
                  </pre>
                </div>
              )}

              {heroTab === "response" && (
                <div className={styles.heroShowcaseContent}>
                  <div className={styles.mockChatBox}>
                    <div className={styles.mockUserMsg}>
                      <span>User:</span> How does retriever AI guarantee zero hallucinations?
                    </div>
                    <div className={styles.mockBotMsg}>
                      <span>Retriever AI:</span> Retriever AI uses a hybrid HNSW vector + BM25 keyword pipeline. Responses are strictly grounded in verified source documents.
                      <div className={styles.mockBadgeRow}>
                        <span className={styles.mockBadgeCache}>⚡ Cached (14ms)</span>
                        <span className={styles.mockBadgeCitation}>📄 Download Source: architecture_v2.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {heroTab === "engine" && (
                <div className={styles.heroShowcaseContent}>
                  <div className={styles.mockEngineBox}>
                    <div className={styles.engineMetricRow}>
                      <span>Query Relevance Score:</span>
                      <strong className={styles.metricValueGreen}>0.98 / 1.0 (High Confidence)</strong>
                    </div>
                    <div className={styles.engineMetricRow}>
                      <span>Retrieval Pipeline:</span>
                      <strong>pgvector HNSW (Semantic) + BM25 (Keyword) + Cohere Rerank</strong>
                    </div>
                    <div className={styles.engineMetricRow}>
                      <span>Corrective Guardrail:</span>
                      <strong className={styles.metricValueBlue}>ACTIVE — Rejects Unbacked Prompts</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* 2. Feature Grid Section */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <section className={styles.featureGridSection} id="features">
          <h2 className={styles.featureGridTitle}>Engineered for Zero-Hallucination Precision</h2>
          <p className={styles.featureGridSub}>
            Built on production-grade hybrid retrieval infrastructure trusted by mid-sized businesses.
          </p>

          <div className={styles.featureGrid}>
            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🛡️</div>
                <h3 className={styles.featureCardTitle}>Self-Aware CRAG</h3>
                <p className={styles.featureCardDesc}>
                  Evaluates relevance scores before generating responses. Rejects low-confidence queries instead of inventing fake answers.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔍</div>
                <h3 className={styles.featureCardTitle}>Hybrid Search & Reranking</h3>
                <p className={styles.featureCardDesc}>
                  Fuses pgvector HNSW semantic embeddings with BM25 full-text keyword search and Cohere reranking for exact line matches.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🕸️</div>
                <h3 className={styles.featureCardTitle}>GraphRAG Knowledge Engine</h3>
                <p className={styles.featureCardDesc}>
                  Traverses multi-hop entity relationships and knowledge triples (&quot;Subject &rarr; Predicate &rarr; Object&quot;) for complex analytical queries.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>👁️</div>
                <h3 className={styles.featureCardTitle}>Multi-Modal Vision & PP-OCRv4</h3>
                <p className={styles.featureCardDesc}>
                  Extracts text, charts, and image diagrams using Baidu PP-OCRv4 deep learning engine with LLM Vision API fallback.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📥</div>
                <h3 className={styles.featureCardTitle}>Presigned PDF Downloads</h3>
                <p className={styles.featureCardDesc}>
                  Every answer includes 1-click downloadable source citations so users can inspect original verification documents.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3 className={styles.featureCardTitle}>Sub-50ms Semantic Cache</h3>
                <p className={styles.featureCardDesc}>
                  Pre-indexes past query vectors to serve instant cached responses, lowering API costs and delivering sub-second speeds.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🌐</div>
                <h3 className={styles.featureCardTitle}>Live Web Search Grounding</h3>
                <p className={styles.featureCardDesc}>
                  Automatically falls back to Tavily &amp; Brave Search APIs for real-time web context when internal documents are silent.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🎯</div>
                <h3 className={styles.featureCardTitle}>Self-Querying Metadata Filters</h3>
                <p className={styles.featureCardDesc}>
                  Converts natural language queries (&quot;invoices from Q3 above $5,000&quot;) into structured PostgreSQL JSONB filters automatically.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔍</div>
                <h3 className={styles.featureCardTitle}>Parent-Child Context Expansion</h3>
                <p className={styles.featureCardDesc}>
                  Embeds precise small chunks while automatically restoring full parent document context during generation.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔌</div>
                <h3 className={styles.featureCardTitle}>Cloud Data Connectors</h3>
                <p className={styles.featureCardDesc}>
                  Background synchronization connectors for Notion, Google Drive, REST endpoints, and custom Webhooks.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxAngle={2} glare={false}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔐</div>
                <h3 className={styles.featureCardTitle}>Cryptographic Audit Chains</h3>
                <p className={styles.featureCardDesc}>
                  SHA-256 tamper-evident audit log chains with automated 90-day retention pruning for HIPAA &amp; GDPR compliance.
                </p>
              </div>
            </TiltCard>
          </div>
        </section>
      </ScrollSection>

      {/* 3. Interactive No-Code Widget Customizer */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <InteractiveWidgetCustomizer />
      </ScrollSection>

      {/* 4. Retriever AI vs Legacy Chatbots Comparison Matrix */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <ComparisonSection />
      </ScrollSection>

      {/* 5. Developer RAG REST API Showcase */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <DeveloperApiSection />
      </ScrollSection>

      {/* 6. Empirical Load & Latency Benchmarks */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <BenchmarkSection />
      </ScrollSection>

      {/* 7. Dynamic Geo-IP Pricing Section */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <PricingSection />
      </ScrollSection>

      {/* 7. Enterprise Custom Deployment Scoping Banner */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <div className={styles.scopingBanner}>
          <h2 className={styles.scopingBannerTitle}>Need a Dedicated or Private Cloud RAG Engine?</h2>
          <p className={styles.scopingBannerDesc}>
            We build custom on-premise RAG pipelines, multi-modal vector search systems, and HIPAA/GDPR-compliant enterprise knowledge hubs.
          </p>
          <MagneticButton strength={0.25}>
            <Link href="/scoping?engine=saas&goal=ai_rag_app" className="comic-btn comic-btn-blue">
              🛠️ Build Custom Scope in Scoping Lab →
            </Link>
          </MagneticButton>
        </div>
      </ScrollSection>

      {/* 8. Live Interactive Sandbox Demo */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <section className={styles.demoSection} id="demo">
          <h2 className={styles.demoSectionTitle}>Experience retriever AI Live</h2>
          <p className={styles.demoSectionSub}>
            Sign in to try a tenant-scoped workspace. Demo keys are not embedded in this public page.
          </p>

          <div className={styles.heroDemoSandbox}>
            <MagneticButton strength={0.25}>
              <Link href="/rag/login" className="comic-btn comic-btn-blue">
                🔐 Sign in to try Retriever AI
              </Link>
            </MagneticButton>
          </div>
        </section>
      </ScrollSection>
    </div>
  );
}
