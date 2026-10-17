"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { useAuth } from "@/context/AuthContext";
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
import { SegmentedPersonaSection } from "@/components/rag/SegmentedPersonaSection";
import { FloatingChatWidget } from "@/components/rag/FloatingChatWidget";
import { NAVBAR_SCROLL_OFFSET } from "@/lib/constants";
import styles from "@/components/rag/rag.module.css";

const ANCHOR_LINKS = [
  { id: "sandbox-demo", label: "💬 Live Demo" },
  { id: "architecture", label: "⚡ Architecture" },
  { id: "benchmarks", label: "📊 Benchmarks" },
  { id: "widget-customizer", label: "🛠️ Embed Customizer" },
  { id: "pricing", label: "💳 Pricing" },
] as const;

export default function RagLandingPage() {
  const lenis = useLenis();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>("sandbox-demo");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash !== "#home" && hash !== "#main-content") {
      const targetId = hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          if (lenis) {
            lenis.scrollTo(`#${targetId}`, { duration: 1.0, offset: NAVBAR_SCROLL_OFFSET - 40 });
          } else {
            const top = el.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top, behavior: "smooth" });
          }
          setActiveSection(targetId);
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [lenis]);

  useEffect(() => {
    const sectionIds = ["sandbox-demo", "architecture", "benchmarks", "widget-customizer", "pricing"];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      let matched = sectionIds[0];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            matched = sectionIds[i];
            break;
          }
        }
      }
      setActiveSection(matched);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setActiveSection(targetId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${targetId}`);
    }
    if (lenis) {
      lenis.scrollTo(`#${targetId}`, { duration: 1.2, offset: NAVBAR_SCROLL_OFFSET - 40 });
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const ctaHref = user
    ? "/rag/app?onboarding=true"
    : `/login?context=rag&redirect_to=${encodeURIComponent("/rag/app?onboarding=true")}`;

  return (
    <div className={styles.landingWrapper}>
      {/* Sticky Glassmorphic Section Anchor Bar */}
      <div className={styles.anchorBarContainer}>
        <nav className={styles.anchorBar} aria-label="Quick Page Navigation">
          {ANCHOR_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={(e) => handleAnchorClick(e, link.id)}
              className={`${styles.anchorLink} ${activeSection === link.id ? styles.anchorLinkActive : ""}`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 1. Hero & Strategic Value Proposition */}
      <ScrollSection gap={80} disableFade>
        <section className={styles.heroSection} id="home">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginBottom: "1rem" }}>
            <div className={styles.heroBadge}>
              ⚡ Production-Grade Multi-Tenant RAG • PostgreSQL + pgvector
            </div>
            <Link href="/rag/benchmarks" style={{ textDecoration: "none" }}>
              <div className={styles.heroBadge} style={{ cursor: "pointer", borderColor: "var(--color-link)" }}>
                📊 Production Telemetry & Benchmarks →
              </div>
            </Link>
          </div>

          <h1 className={styles.heroTitle}>
            Turn Your Company Documents Into a Production AI Knowledge Engine in 60 Seconds
          </h1>

          <p className={styles.heroSubtitle}>
            Replace fragmented vector pipelines with a single high-performance PostgreSQL + pgvector engine.
            Grounded answers, $0 local embeddings via Ollama, hybrid BM25 + HNSW search, and a 1-line script embed for any website.
          </p>

          <div className={styles.heroCtas}>
            <MagneticButton strength={0.25}>
              <Link href={ctaHref} className="comic-btn comic-btn-blue">
                🚀 Start Free Sandbox (No Credit Card)
              </Link>
            </MagneticButton>
            <MagneticButton strength={0.25}>
              <a
                href="#sandbox-demo"
                onClick={(e) => handleAnchorClick(e, "sandbox-demo")}
                className="comic-btn comic-btn-outline"
              >
                💬 Test Live Dogfooding Sandbox
              </a>
            </MagneticButton>
          </div>

          {/* Hero Micro-Stats Strip */}
          <div className={styles.heroStatsStrip}>
            <span className={styles.heroStatItem}>⚡ 14.8ms Median Latency</span>
            <span className={styles.heroStatDivider}>•</span>
            <span className={styles.heroStatItem}>🔒 PostgreSQL RLS Multi-Tenancy</span>
            <span className={styles.heroStatDivider}>•</span>
            <span className={styles.heroStatItem}>💰 $0 Local Embedding Cost</span>
            <span className={styles.heroStatDivider}>•</span>
            <span className={styles.heroStatItem}>📦 1-Line Drop-In Script</span>
          </div>

          {/* Live Interactive Cognitive Sandbox directly in Hero */}
          <div id="sandbox-demo" style={{ width: "100%" }}>
            <HeroCognitiveSandbox />
          </div>
        </section>
      </ScrollSection>

      {/* 2. Segmented Buyer Workflows: E-Commerce, Developers, Enterprise */}
      <ScrollSection verticalOffset={120} gap={80} disableFade>
        <SegmentedPersonaSection />
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

      {/* Floating Dogfooding Chat Widget (Connected to live Scoping Tenant) */}
      <FloatingChatWidget />
    </div>
  );
}
