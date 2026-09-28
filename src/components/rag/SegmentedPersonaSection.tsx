"use client";

import Link from "next/link";
import { useLenis } from "lenis/react";
import TiltCard from "@/components/ui/TiltCard";
import MagneticButton from "@/components/ui/MagneticButton";
import { NAVBAR_SCROLL_OFFSET } from "@/lib/constants";
import styles from "./SegmentedPersonaSection.module.css";

interface PersonaConfig {
  id: string;
  icon: string;
  tag: string;
  title: string;
  description: string;
  highlights: { strong: string; text: string }[];
  ctaText: string;
  ctaHref: string;
  isExternalOrHash?: boolean;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "website-owners",
    icon: "🛍️",
    tag: "No-Code & E-Commerce",
    title: "1-Line Embed Copilot",
    description:
      "Drop a single <script> tag onto Shopify, Webflow, WordPress, or Next.js. Turn stagnant FAQs, catalogs, and documentation into a 24/7 lead capture and support deflection assistant.",
    highlights: [
      { strong: "60-Second Drop-In:", text: "Zero code changes, paste anywhere in <head>" },
      { strong: "Intent Lead Capture:", text: "Gathers contact info & escalates hot leads" },
      { strong: "Zero Hallucinations:", text: "Strict vector grounding on your verified docs" },
      { strong: "Design Parity:", text: "Customizable fonts, colors, and prompt buttons" },
    ],
    ctaText: "Customize Embed Widget →",
    ctaHref: "#widget-customizer",
    isExternalOrHash: true,
  },
  {
    id: "developers",
    icon: "⚡",
    tag: "Developer-First Core",
    title: "Headless Vector & REST API",
    description:
      "Direct programmatic access with scoped API keys (ret_live_...). Full parity across TypeScript and Python SDKs, SSE streaming chat, and hybrid BM25 + HNSW + ColBERT MaxSim fusion.",
    highlights: [
      { strong: "REST & SSE Streaming:", text: "Clean /v1/tenants/{id}/search and /chat" },
      { strong: "$0 Embedding Cost:", text: "Built-in local Ollama nomic-embed-text engine" },
      { strong: "38 Production Batteries:", text: "Ebbinghaus memory, Graph-of-Thought, DSPy" },
      { strong: "Universal SDKs:", text: "Native TypeScript and Python client packages" },
    ],
    ctaText: "View API Keys & SDKs →",
    ctaHref: "/rag/app?tab=apikeys",
    isExternalOrHash: false,
  },
  {
    id: "enterprise",
    icon: "🛡️",
    tag: "Enterprise Compliance",
    title: "Sovereign Multi-Tenancy & Privacy",
    description:
      "PostgreSQL Row-Level Security (RLS) guarantees complete tenant isolation. Deploy in private VPCs, air-gapped enclaves, or dedicated Oracle Cloud VPS instances.",
    highlights: [
      { strong: "Strict DB Multi-Tenancy:", text: "PostgreSQL RLS prevents cross-tenant data leaks" },
      { strong: "Zero Data Retention:", text: "Your documents are never retained or trained on" },
      { strong: "Privacy Batteries:", text: "MPC enclave execution & ZKP proof attestation" },
      { strong: "Audit Posture:", text: "HIPAA, GDPR, and SOC2 aligned architecture" },
    ],
    ctaText: "Build Enterprise Scope →",
    ctaHref: "/scoping?engine=saas&goal=ai_rag_app",
    isExternalOrHash: false,
  },
];

export function SegmentedPersonaSection() {
  const lenis = useLenis();

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(href, { duration: 1.2, offset: NAVBAR_SCROLL_OFFSET });
      } else {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className={styles.personaSection} id="personas">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionBadge}>🎯 Built For Your Exact Stack</div>
        <h2 className={styles.sectionTitle}>One Sovereign Engine. Three Purpose-Built Workflows.</h2>
        <p className={styles.sectionSubtitle}>
          Whether you want an instant drop-in customer support bot, clean headless vector APIs for your microservices,
          or private VPC multi-tenant compliance, Retriever delivers without vendor lock-in.
        </p>
      </div>

      <div className={styles.personaGrid}>
        {PERSONAS.map((persona) => (
          <TiltCard key={persona.id} maxAngle={2} glare={false}>
            <div className={styles.personaCard}>
              <div>
                <div className={styles.cardHeader}>
                  <div className={styles.iconRow}>
                    <span className={styles.cardIcon}>{persona.icon}</span>
                    <span className={styles.personaTag}>{persona.tag}</span>
                  </div>
                  <h3 className={styles.cardHeading}>{persona.title}</h3>
                  <p className={styles.cardDesc}>{persona.description}</p>
                </div>

                <ul className={styles.featureList}>
                  {persona.highlights.map((h, i) => (
                    <li key={i} className={styles.featureItem}>
                      <span className={styles.featureCheck}>✓</span>
                      <span>
                        <strong>{h.strong}</strong> {h.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.cardAction}>
                <MagneticButton strength={0.25}>
                  {persona.isExternalOrHash ? (
                    <a
                      href={persona.ctaHref}
                      onClick={(e) => handleHashClick(e, persona.ctaHref)}
                      className={`comic-btn comic-btn-blue ${styles.actionBtn}`}
                    >
                      {persona.ctaText}
                    </a>
                  ) : (
                    <Link href={persona.ctaHref} className={`comic-btn comic-btn-blue ${styles.actionBtn}`}>
                      {persona.ctaText}
                    </Link>
                  )}
                </MagneticButton>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
