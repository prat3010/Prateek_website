"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import ScrollSection from "@/components/ScrollSection/ScrollSection";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { PricingSection } from "@/components/rag/PricingSection";
import { RetrieverClient } from "@/lib/rag-client";
import { NAVBAR_SCROLL_OFFSET } from "@/lib/constants";
import styles from "@/components/rag/rag.module.css";

const GUEST_CONFIG = {
  apiUrl: "https://rag.prateeq.in",
  tenantId: "00000000-0000-0000-0000-000000000000",
  apiKey: "ret_live_GuestAccessKey2026.ReadOnlyChat",
  userId: "00000000-0000-0000-0000-000000000001",
};

export default function RagLandingPage() {
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();

  const guestClient = useMemo(() => new RetrieverClient(GUEST_CONFIG), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const copySnippet = () => {
    navigator.clipboard.writeText(
      `<script src="https://rag.prateeq.in/widget.js" data-tenant="YOUR_TENANT_ID" data-key="YOUR_API_KEY"></script>`
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
      <ScrollSection gap={80}>
        <section className={styles.heroSection} id="home">
          <div className={styles.heroBadge}>
            ✨ Enterprise Hybrid RAG Engine • Powered by Meta Llama 3.3 70B
          </div>

          <h1 className={styles.heroTitle}>
            Turn Your Documents & Website into an AI Assistant in 60 Seconds
          </h1>

          <p className={styles.heroSubtitle}>
            Zero coding required. Embed a self-aware, hallucination-free AI chatbot onto any website, Shopify store, or app with 1 line of script.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/rag/login" className="comic-btn comic-btn-blue">
              🚀 Get Started Free
            </Link>
            <a href="#demo" onClick={scrollToDemo} className="comic-btn comic-btn-outline">
              💬 Try Live Demo Below
            </a>
          </div>

          {/* Interactive Hero Showcase Window */}
          <div className={styles.heroShowcaseWindow}>
            <div className={styles.heroWindowHeader}>
              <div className={styles.heroWindowDots}>
                <span style={{ background: "#ff5f56" }} />
                <span style={{ background: "#ffbd2e" }} />
                <span style={{ background: "#27c93f" }} />
              </div>

              <div className={styles.heroWindowTabs}>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "embed" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("embed")}
                >
                  ⚡ 1-Line Script
                </button>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "response" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("response")}
                >
                  🎯 Verified PDF Response
                </button>
                <button
                  className={`${styles.heroWindowTab} ${heroTab === "engine" ? styles.heroWindowTabActive : ""}`}
                  onClick={() => setHeroTab("engine")}
                >
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
                      {"<script\n  src=\"https://rag.prateeq.in/widget.js\"\n  data-tenant=\"YOUR_TENANT_ID\"\n  data-key=\"YOUR_API_KEY\">\n</script>"}
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
                      <strong style={{ color: "#22c55e" }}>0.98 / 1.0 (High Confidence)</strong>
                    </div>
                    <div className={styles.engineMetricRow}>
                      <span>Retrieval Pipeline:</span>
                      <strong>pgvector HNSW (Semantic) + BM25 (Keyword) + Cohere Rerank</strong>
                    </div>
                    <div className={styles.engineMetricRow}>
                      <span>Corrective Guardrail:</span>
                      <strong style={{ color: "#3b82f6" }}>ACTIVE — Rejects Unbacked Prompts</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* 2. Feature Grid Section */}
      <ScrollSection verticalOffset={120} gap={80}>
        <section className={styles.featureGridSection} id="features">
          <h2 className={styles.featureGridTitle}>Engineered for Zero-Hallucination Precision</h2>
          <p className={styles.featureGridSub}>
            Built on production-grade hybrid retrieval infrastructure trusted by mid-sized businesses.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3 className={styles.featureCardTitle}>Self-Aware CRAG</h3>
              <p className={styles.featureCardDesc}>
                Evaluates relevance scores before generating responses. Rejects low-confidence queries instead of inventing fake answers.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3 className={styles.featureCardTitle}>Hybrid Search & Reranking</h3>
              <p className={styles.featureCardDesc}>
                Fuses pgvector HNSW semantic embeddings with BM25 full-text keyword search and Cohere reranking for exact line matches.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📥</div>
              <h3 className={styles.featureCardTitle}>Presigned PDF Downloads</h3>
              <p className={styles.featureCardDesc}>
                Every answer includes 1-click downloadable source citations so users can inspect original verification documents.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3 className={styles.featureCardTitle}>Sub-50ms Semantic Cache</h3>
              <p className={styles.featureCardDesc}>
                Pre-indexes past query vectors to serve instant cached responses, lowering API costs and delivering sub-second speeds.
              </p>
            </div>
          </div>
        </section>
      </ScrollSection>

      {/* 3. Dynamic Geo-IP Pricing Section */}
      <ScrollSection verticalOffset={120} gap={80}>
        <PricingSection />
      </ScrollSection>

      {/* 5. Live Interactive Sandbox Demo (Shifted to End) */}
      <ScrollSection verticalOffset={120} gap={80}>
        <section className={styles.demoSection} id="demo">
          <h2 className={styles.demoSectionTitle}>Experience retriever AI Live</h2>
          <p className={styles.demoSectionSub}>
            Ask questions, test semantic caching, and download presigned citations in real time.
          </p>

          <div className={styles.heroDemoSandbox}>
            <ChatPanel client={guestClient} hidden={false} />
          </div>
        </section>
      </ScrollSection>
    </div>
  );
}
