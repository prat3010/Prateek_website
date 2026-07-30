"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ScrollSection from "@/components/ScrollSection/ScrollSection";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { PricingSection } from "@/components/rag/PricingSection";
import { RetrieverClient } from "@/lib/rag-client";
import styles from "@/components/rag/rag.module.css";

const GUEST_CONFIG = {
  apiUrl: "https://rag.prateeq.in",
  tenantId: "00000000-0000-0000-0000-000000000000",
  apiKey: "ret_live_GuestAccessKey2026.ReadOnlyChat",
  userId: "guest_visitor_user",
};

export default function RagLandingPage() {
  const [copied, setCopied] = useState(false);
  const guestClient = new RetrieverClient(GUEST_CONFIG);

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

  return (
    <div className={styles.landingWrapper}>
      {/* Hero & Sandbox Section */}
      <ScrollSection gap={80}>
        <section className={styles.heroSection} id="home">
          <div className={styles.heroBadge}>
            <span>✨</span> Powered by Meta Llama 3.3 70B & Local Hybrid RAG Engine
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
            <a href="#demo" className="comic-btn comic-btn-outline">
              💬 Try Live Demo Below
            </a>
          </div>

          {/* Embedded Interactive Live Demo Sandbox */}
          <div className={styles.heroDemoSandbox} id="demo">
            <ChatPanel client={guestClient} hidden={false} />
          </div>
        </section>
      </ScrollSection>

      {/* Feature Grid Section */}
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

      {/* 1-Line Embed Script Box */}
      <ScrollSection verticalOffset={120} gap={80}>
        <section className={styles.embedBoxSection}>
          <div>
            <h2 className={styles.embedTitle}>Embed on Any Website in 10 Seconds</h2>
            <p className={styles.embedDesc}>
              Works seamlessly with WordPress, Shopify, Webflow, Framer, React, and custom HTML sites. Simply copy-paste the snippet into your site header.
            </p>
          </div>

          <div className={styles.codeSnippetCard}>
            <button className={`comic-btn ${styles.copyBtn}`} onClick={copySnippet}>
              {copied ? "✓ Copied!" : "Copy Snippet"}
            </button>
            <code>
              {"<script"}
              <br />
              &nbsp;&nbsp;{"src=\"https://rag.prateeq.in/widget.js\""}
              <br />
              &nbsp;&nbsp;{"data-tenant=\"YOUR_TENANT_ID\""}
              <br />
              &nbsp;&nbsp;{"data-key=\"YOUR_API_KEY\">"}
              <br />
              {"</script>"}
            </code>
          </div>
        </section>
      </ScrollSection>

      {/* Dynamic Geo-IP Pricing Section */}
      <ScrollSection verticalOffset={120} gap={80}>
        <PricingSection />
      </ScrollSection>
    </div>
  );
}
