import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Server,
  EyeOff,
  Cookie,
  CreditCard,
  Cpu,
  Database,
  Globe,
  Scale,
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Terminal,
  Clock,
  FileText,
  UserCheck,
} from 'lucide-react';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Privacy & Telemetry Architecture | Prateeq Sharma',
  description:
    'Comprehensive disclosure of our zero-tracking commitments, GDPR-compliant SHA-256 daily salt IP hashing, multi-tenant PostgreSQL Row-Level Security, and sub-processor directory.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy & Telemetry Architecture | Prateeq Sharma',
    description:
      'Engineered privacy by default: Zero ad trackers, daily rotating salt telemetry, zero-knowledge payments, and strict PostgreSQL Row-Level Security.',
    type: 'article',
    url: 'https://prateeq.in/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy & Telemetry Architecture | Prateeq Sharma',
    description:
      'Engineered privacy by default: Zero ad trackers, daily rotating salt telemetry, zero-knowledge payments, and strict PostgreSQL Row-Level Security.',
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PrivacyPolicy',
    name: 'Prateeq Sharma Privacy & Telemetry Architecture',
    url: 'https://prateeq.in/privacy',
    description:
      'Privacy and telemetry data policy governing prateeq.in, Project Scoping Lab, Client Workspace, and Retriever AI SaaS platform.',
    datePublished: '2024-01-01',
    dateModified: '2026-10-20',
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Person',
      name: 'Prateek Sharma',
      jobTitle: 'Forward Deployed AI Engineer & Solutions Architect',
      url: 'https://prateeq.in',
      email: 'prateeqsharma@gmail.com',
    },
  };

  return (
    <div className={styles.wrapper}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.container}>
        {/* Navigation & Header */}
        <header className={styles.header}>
          <div className={styles.topNav}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Return to Base</span>
            </Link>
            <div className={styles.statusPill}>
              <span className={styles.statusDot} />
              <span>AUDITED SPEC // v2.4</span>
            </div>
          </div>

          <h1 className={styles.title}>Privacy &amp; Telemetry Architecture</h1>
          <p className={styles.subtitle}>
            Engineered transparency, zero third-party surveillance, and mathematical guarantees of visitor anonymity.
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Last Revision
              </span>
              <span className={styles.metaValue}>October 20, 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <Globe size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Governing Frameworks
              </span>
              <span className={styles.metaValue}>GDPR • DPDP Act 2023 • CCPA</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Data Controller</span>
              <span className={styles.metaValue}>Prateek Sharma (Prateeq Studio)</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Security Posture</span>
              <span className={styles.metaValue}>Zero Cross-Site Tracking • TLS 1.3</span>
            </div>
          </div>
        </header>

        {/* Executive Highlights Grid */}
        <section className={styles.highlightsSection}>
          <div className={styles.sectionHeaderCompact}>
            <ShieldCheck size={18} className={styles.sectionIcon} />
            <h2 className={styles.highlightsHeading}>Architecture at a Glance</h2>
          </div>
          <p className={styles.highlightsLead}>
            Most privacy policies are lengthy legal shields designed to excuse invasive tracking. This document describes the architectural controls engineered directly into our codebase to make user surveillance technically impossible.
          </p>

          <div className={styles.highlightsGrid}>
            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <EyeOff size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Zero Ad Trackers</h3>
              </div>
              <p className={styles.cardBody}>
                No Meta Pixel, Google Ads, TikTok beacons, or marketing scripts. We do not track you across the web or monetize your behavior.
              </p>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <Lock size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Daily SHA-256 Salt</h3>
              </div>
              <p className={styles.cardBody}>
                Raw IP addresses are never written to disk or database. Every IP is salted with the current calendar date and hashed, unlinking records every 24h.
              </p>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <Cookie size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>No Cookie Banner Needed</h3>
              </div>
              <p className={styles.cardBody}>
                100% compliant with the ePrivacy Directive and GDPR Recital 30. We only use strictly functional preference cookies (<code className={styles.inlineCode}>theme</code>, <code className={styles.inlineCode}>audience</code>, <code className={styles.inlineCode}>region</code>).
              </p>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <CreditCard size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Zero-Knowledge Payments</h3>
              </div>
              <p className={styles.cardBody}>
                Invoicing and payments execute directly via Razorpay&apos;s PCI-DSS Level 1 vault. We never intercept, transmit, or store card or UPI numbers.
              </p>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <Database size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>PostgreSQL RLS Isolation</h3>
              </div>
              <p className={styles.cardBody}>
                Client workspaces and Retriever RAG embeddings are isolated via Row-Level Security (RLS). Cross-tenant queries are blocked at the database engine level.
              </p>
            </div>

            <div className={styles.highlightCard}>
              <div className={styles.cardHeader}>
                <Trash2 size={18} className={styles.cardIcon} />
                <h3 className={styles.cardTitle}>Automated 90-Day Purge</h3>
              </div>
              <p className={styles.cardBody}>
                Anonymous telemetry visits are automatically evicted from Supabase storage after 90 days by probabilistic database maintenance triggers.
              </p>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <nav aria-label="Table of Contents" className={styles.tocNav}>
          <div className={styles.tocTitle}>
            <FileText size={16} />
            <span>Table of Contents</span>
          </div>
          <div className={styles.tocGrid}>
            <a href="#section-scope" className={styles.tocLink}>
              <span className={styles.tocNum}>01</span> Scope &amp; Core Philosophy
            </a>
            <a href="#section-telemetry" className={styles.tocLink}>
              <span className={styles.tocNum}>02</span> Edge Telemetry &amp; IP Hashing
            </a>
            <a href="#section-cookies" className={styles.tocLink}>
              <span className={styles.tocNum}>03</span> Cookies &amp; Local Preferences
            </a>
            <a href="#section-contact" className={styles.tocLink}>
              <span className={styles.tocNum}>04</span> Contact &amp; Scoping Inquiries
            </a>
            <a href="#section-workspace" className={styles.tocLink}>
              <span className={styles.tocNum}>05</span> Client Workspace &amp; Razorpay
            </a>
            <a href="#section-retriever" className={styles.tocLink}>
              <span className={styles.tocNum}>06</span> Retriever AI SaaS &amp; Vector Data
            </a>
            <a href="#section-subprocessors" className={styles.tocLink}>
              <span className={styles.tocNum}>07</span> Sub-Processors Directory
            </a>
            <a href="#section-legal-bases" className={styles.tocLink}>
              <span className={styles.tocNum}>08</span> Legal Bases for Processing
            </a>
            <a href="#section-frameworks" className={styles.tocLink}>
              <span className={styles.tocNum}>09</span> GDPR, DPDP 2023 &amp; CCPA
            </a>
            <a href="#section-rights" className={styles.tocLink}>
              <span className={styles.tocNum}>10</span> Data Rights &amp; Erasure Protocol
            </a>
            <a href="#section-security" className={styles.tocLink}>
              <span className={styles.tocNum}>11</span> Technical &amp; Engineering Security
            </a>
            <a href="#section-controller" className={styles.tocLink}>
              <span className={styles.tocNum}>12</span> Governance &amp; Controller Contact
            </a>
          </div>
        </nav>

        {/* Content Sections */}
        <main className={styles.content}>
          {/* 01. Scope & Philosophy */}
          <section id="section-scope" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>01</span>
              <h2 className={styles.sectionTitle}>Foundational Commitment &amp; Scope</h2>
            </div>
            <p className={styles.text}>
              This Privacy &amp; Telemetry Architecture governs the digital properties operated by <strong>Prateek Sharma</strong> (trading as <strong>Prateeq Studio</strong>), including:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <strong>Portfolio &amp; Engineering Lab:</strong> <code className={styles.inlineCode}>https://prateeq.in</code>
              </li>
              <li className={styles.listItem}>
                <strong>Project Scoping Lab &amp; Instant Quote Engine:</strong> <code className={styles.inlineCode}>https://prateeq.in/scoping</code>
              </li>
              <li className={styles.listItem}>
                <strong>Client Workspace &amp; Dashboard:</strong> <code className={styles.inlineCode}>https://prateeq.in/dashboard</code>
              </li>
              <li className={styles.listItem}>
                <strong>Interactive Diagnostics Terminal:</strong> <code className={styles.inlineCode}>https://prateeq.in/terminal</code>
              </li>
              <li className={styles.listItem}>
                <strong>Retriever AI SaaS Engine &amp; Admin Studio:</strong> <code className={styles.inlineCode}>https://rag.prateeq.in</code> &amp; <code className={styles.inlineCode}>https://admin.rag.prateeq.in</code>
              </li>
            </ul>
            <p className={styles.text}>
              Our foundational design principle is <strong>Privacy by Architecture</strong>: we minimize data ingestion at the network perimeter, enforce mathematical irreversibility on analytics data, and eliminate cross-site tracking entirely.
            </p>
          </section>

          {/* 02. Edge Telemetry & IP Hashing */}
          <section id="section-telemetry" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>02</span>
              <h2 className={styles.sectionTitle}>Edge Telemetry &amp; Cryptographic Anonymization</h2>
            </div>
            <p className={styles.text}>
              To monitor site availability, prevent distributed denial-of-service (DDoS) attacks, detect malicious scanning probes, and evaluate real-world performance, requests are processed server-side via Next.js proxy middleware (<code className={styles.inlineCode}>src/proxy.ts</code>).
            </p>

            <div className={styles.architectureBox}>
              <div className={styles.archTitle}>
                <Terminal size={15} />
                <span>The Cryptographic Daily Salt Pipeline (<code className={styles.inlineCode}>src/lib/security.ts</code>)</span>
              </div>
              <div className={styles.codeSnippet}>
                {`Incoming Request (IP: 203.0.113.42)
  │
  ▼ Next.js Proxy Middleware (Edge Execution)
  ├── 1. Read ephemeral IP from x-forwarded-for
  ├── 2. Generate daily salt: YYYY-MM-DD (e.g., "2026-10-20")
  ├── 3. SHA-256 Digest: crypto.subtle.digest("SHA-256", "203.0.113.42-2026-10-20")
  ├── 4. Store 64-char hex hash (ip_hash) in Supabase page_visits
  └── 5. PURGE raw IP from memory. Zero raw IPs ever touch database or disk.`}
              </div>
              <p className={styles.archCaption}>
                <strong>Mathematical Guarantee:</strong> Because the salt rotates automatically at 00:00 UTC each day, the resulting hash rotates. It is mathematically impossible to correlate a visit made on Monday with a visit on Tuesday, eliminating persistent user tracking while maintaining accurate daily unique visitor counts.
              </p>
            </div>

            <h3 className={styles.subHeading}>Telemetry Fields Recorded vs. Deliberately Discarded</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Data Field</th>
                    <th>Action</th>
                    <th>Purpose &amp; Engineering Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Raw IP Address</strong></td>
                    <td><span className={styles.badgeDanger}>Never Stored</span></td>
                    <td>Cryptographically hashed with rotating daily salt; raw IP discarded immediately.</td>
                  </tr>
                  <tr>
                    <td><strong>Path Visited</strong></td>
                    <td><span className={styles.badgeSuccess}>Stored</span></td>
                    <td>Aggregated to identify high-traffic pages and broken 404 routes.</td>
                  </tr>
                  <tr>
                    <td><strong>Country Code</strong></td>
                    <td><span className={styles.badgeSuccess}>Stored (Coarse)</span></td>
                    <td>Read from Vercel edge header (<code className={styles.inlineCode}>x-vercel-ip-country</code>) to serve regional currency (INR/USD).</td>
                  </tr>
                  <tr>
                    <td><strong>City &amp; Sub-Region</strong></td>
                    <td><span className={styles.badgeDanger}>Deliberately Discarded</span></td>
                    <td>Headers (<code className={styles.inlineCode}>x-vercel-ip-city</code>, <code className={styles.inlineCode}>x-vercel-ip-country-region</code>) are discarded and stored as <code className={styles.inlineCode}>null</code> to prevent intrusive ISP geolocation.</td>
                  </tr>
                  <tr>
                    <td><strong>Referrer URL</strong></td>
                    <td><span className={styles.badgeWarning}>Sanitized Domain Only</span></td>
                    <td>Stripped down strictly to root hostname (<code className={styles.inlineCode}>url.hostname</code>). Private paths, query tokens, and session IDs in referrers are destroyed before saving.</td>
                  </tr>
                  <tr>
                    <td><strong>Device &amp; Browser Engine</strong></td>
                    <td><span className={styles.badgeSuccess}>Stored</span></td>
                    <td>Coarse device type (desktop/mobile/tablet), OS family, and browser name to guide responsive CSS rendering budgets.</td>
                  </tr>
                  <tr>
                    <td><strong>Exploits &amp; Bot Probes</strong></td>
                    <td><span className={styles.badgeDanger}>Bypassed &amp; Discarded</span></td>
                    <td>Known vulnerability scans (<code className={styles.inlineCode}>.php</code>, <code className={styles.inlineCode}>wp-admin</code>, <code className={styles.inlineCode}>.env</code>, <code className={styles.inlineCode}>actuator</code>) and search crawlers are filtered before database writes.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.text} style={{ marginTop: '1.25rem' }}>
              <strong>Public Transparency:</strong> You do not need to take our word for it. You can inspect live aggregate visitor numbers, country distributions, and device stats on our publicly accessible <Link href="/analytics" className={styles.textLink}>Telemetry Dashboard (/analytics)</Link> or by querying <code className={styles.inlineCode}>system-info</code> in the <Link href="/terminal" className={styles.textLink}>Diagnostics Terminal (/terminal)</Link>.
            </p>
          </section>

          {/* 03. Cookies & Local Preferences */}
          <section id="section-cookies" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>03</span>
              <h2 className={styles.sectionTitle}>Cookies, Edge Headers &amp; Local State</h2>
            </div>
            <p className={styles.text}>
              Under Article 5(3) of the EU ePrivacy Directive and Recital 30 of the GDPR, cookies that are strictly necessary for the technical provision of a service or solely store user-initiated preferences do not require an intrusive consent banner.
            </p>

            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Classification</th>
                    <th>Lifespan</th>
                    <th>Exact Function</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className={styles.inlineCode}>theme</code></td>
                    <td><span className={styles.badgeInfo}>Functional Preference</span></td>
                    <td>1 Year</td>
                    <td>Remembers your visual style preference (<code className={styles.inlineCode}>light</code> [Azure Comic Paper] or <code className={styles.inlineCode}>noir</code> [Tactical Obsidian]) to prevent flashes of unstyled content (CLS).</td>
                  </tr>
                  <tr>
                    <td><code className={styles.inlineCode}>audience</code></td>
                    <td><span className={styles.badgeInfo}>Functional Preference</span></td>
                    <td>1 Year</td>
                    <td>Remembers your preferred communication persona (<code className={styles.inlineCode}>developer</code> or <code className={styles.inlineCode}>business</code>) to personalize technical depth.</td>
                  </tr>
                  <tr>
                    <td><code className={styles.inlineCode}>region</code></td>
                    <td><span className={styles.badgeInfo}>Functional Preference</span></td>
                    <td>1 Year</td>
                    <td>Stores resolved geography (<code className={styles.inlineCode}>india</code> or <code className={styles.inlineCode}>global</code>) to display relevant currency (₹ INR vs $ USD) across scoping calculators.</td>
                  </tr>
                  <tr>
                    <td><code className={styles.inlineCode}>prateeq_active_user</code></td>
                    <td><span className={styles.badgeWarning}>Strictly Necessary</span></td>
                    <td>Session / 30 Days</td>
                    <td>HttpOnly cookie confirming active session authentication for the Client Workspace Dashboard (<code className={styles.inlineCode}>/dashboard</code>).</td>
                  </tr>
                  <tr>
                    <td><code className={styles.inlineCode}>sb-*-auth-token</code></td>
                    <td><span className={styles.badgeWarning}>Strictly Necessary</span></td>
                    <td>Session / 30 Days</td>
                    <td>Cryptographic JWT token managed by Supabase Auth for PKCE session persistence and secure API communication.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={styles.text} style={{ marginTop: '1.25rem' }}>
              <strong>Browser Local Storage:</strong> We store minimal non-identifying keys in your browser&apos;s <code className={styles.inlineCode}>localStorage</code>:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <code className={styles.inlineCode}>lenis-scroll-preference</code>: Preserves smooth scrolling accessibility settings.
              </li>
              <li className={styles.listItem}>
                <code className={styles.inlineCode}>theme-fallback</code>: Client-side hydration backup to guarantee smooth offline-first rendering.
              </li>
            </ul>
          </section>

          {/* 04. Contact & Scoping Inquiries */}
          <section id="section-contact" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>04</span>
              <h2 className={styles.sectionTitle}>Contact Inquiries &amp; Scoping Lab Submissions</h2>
            </div>
            <p className={styles.text}>
              When you submit a message through the contact form or configure a custom technical build in the <strong>Project Scoping Lab</strong> (<code className={styles.inlineCode}>/scoping</code>), we collect only the information required to evaluate your requirements and generate an itemized quote:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <strong>Identity &amp; Contact:</strong> Full name, organizational email address, and optional phone number.
              </li>
              <li className={styles.listItem}>
                <strong>Technical Specifications:</strong> Selected base engine (Landing, Multi-page, SaaS), architectural feature modules, brand asset selections, and ongoing maintenance tiers.
              </li>
              <li className={styles.listItem}>
                <strong>Project Artifacts:</strong> Optional uploaded Request for Proposal (RFP) documents, design briefs, or inspiration links.
              </li>
            </ul>

            <div className={styles.calloutCard}>
              <div className={styles.calloutHeader}>
                <Server size={16} />
                <span>Security Protections for Inbound Signals</span>
              </div>
              <ul className={styles.list} style={{ marginBottom: 0 }}>
                <li className={styles.listItem}>
                  <strong>Rate Limiting:</strong> Inbound contact submissions are limited to a maximum of 5 requests per 60 seconds per IP to mitigate spam flooding.
                </li>
                <li className={styles.listItem}>
                  <strong>Google reCAPTCHA v3:</strong> Submissions are score-evaluated server-side. Requests scoring below 0.3 are automatically rejected to block automated bots without forcing human visitors through friction-heavy puzzles.
                </li>
                <li className={styles.listItem}>
                  <strong>Encrypted Transmission:</strong> Messages and attached PDFs are transmitted via Resend&apos;s TLS-encrypted API directly to our administrative inbox (<code className={styles.inlineCode}>notifications@prateeq.in</code>).
                </li>
                <li className={styles.listItem}>
                  <strong>Zero List-Selling:</strong> Your contact information is never added to automated marketing drip campaigns, shared with recruiters, or sold to third parties.
                </li>
              </ul>
            </div>
          </section>

          {/* 05. Client Workspace & Razorpay */}
          <section id="section-workspace" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>05</span>
              <h2 className={styles.sectionTitle}>Client Workspace, Authentication &amp; Razorpay Invoicing</h2>
            </div>
            <p className={styles.text}>
              Clients who engage Prateeq Studio for engineering advisory or custom software development access the private <strong>Client Workspace Dashboard</strong> (<code className={styles.inlineCode}>/dashboard</code>).
            </p>

            <h3 className={styles.subHeading}>Authentication Security</h3>
            <p className={styles.text}>
              Workspace accounts authenticate using <strong>Google OAuth 2.0 PKCE</strong> via Supabase Auth. We receive and store only your verified Google email address, display name, and avatar picture URL. We never access your Google password, contacts, Google Drive files, or broader Google Account data.
            </p>

            <h3 className={styles.subHeading}>Zero-Knowledge Financial Architecture (Razorpay)</h3>
            <p className={styles.text}>
              When you pay milestone invoices, retainers, or SaaS subscriptions on prateeq.in, all financial transactions are processed directly by <strong>Razorpay Software Private Limited</strong>, an authorized payment aggregator compliant with Reserve Bank of India (RBI) mandates.
            </p>

            <div className={styles.architectureBox}>
              <div className={styles.archTitle}>
                <CreditCard size={15} />
                <span>Zero-Knowledge Payment Pipeline</span>
              </div>
              <p className={styles.text} style={{ margin: 0, fontSize: '0.92rem' }}>
                Payment credentials (credit/debit card numbers, CVVs, expiration dates, UPI PINs, netbanking passwords) are collected directly within Razorpay&apos;s PCI-DSS Level 1 compliant secure iframe. <strong>Prateeq Studio never touches, transmits, logs, or stores raw payment instrument data on any server.</strong>
              </p>
            </div>

            <p className={styles.text} style={{ marginTop: '1.25rem' }}>
              <strong>Accounting &amp; Tax Compliance Data:</strong> Under Indian tax regulations (Goods and Services Tax Act) and SAC Code <strong>998314</strong> (Information Technology Software Consulting and Development Services), we are legally obligated to retain records of completed transactions, including:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>Invoice number, date of issue, and settlement timestamp.</li>
              <li className={styles.listItem}>Client billing name, billing address, and GSTIN (for Indian commercial entities).</li>
              <li className={styles.listItem}>Razorpay order ID, payment ID, and currency amount (INR or USD equivalent).</li>
            </ul>
            <p className={styles.text}>
              These commercial accounting records are retained for the statutory period of <strong>7 years</strong> as mandated by law.
            </p>
          </section>

          {/* 06. Retriever AI SaaS */}
          <section id="section-retriever" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>06</span>
              <h2 className={styles.sectionTitle}>Retriever AI SaaS &amp; Vector Data Isolation</h2>
            </div>
            <p className={styles.text}>
              Users and enterprise clients leveraging the <strong>Retriever Cognitive Engine</strong> (<code className={styles.inlineCode}>rag.prateeq.in</code>) and its Web Admin Studio (<code className={styles.inlineCode}>admin.rag.prateeq.in</code>) are protected by strict tenant boundary enforcement:
            </p>

            <div className={styles.highlightsGrid} style={{ margin: '1.5rem 0' }}>
              <div className={styles.highlightCard}>
                <div className={styles.cardHeader}>
                  <Database size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Strict Tenant RLS</h3>
                </div>
                <p className={styles.cardBody}>
                  Every document chunk, vector embedding, and chat thread is tagged with a cryptographically generated <code className={styles.inlineCode}>tenant_id</code>. PostgreSQL Row-Level Security policies physically prevent cross-tenant vector leakage.
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.cardHeader}>
                  <Cpu size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Zero Public Model Training</h3>
                </div>
                <p className={styles.cardBody}>
                  Uploaded enterprise knowledge, proprietary PDFs, and chat queries are <strong>never</strong> used to train, tune, or improve public foundation models (OpenAI, Anthropic, Gemini, or Ollama).
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.cardHeader}>
                  <Server size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Local-First Embeddings</h3>
                </div>
                <p className={styles.cardBody}>
                  Embeddings run locally by default via self-hosted Ollama (<code className={styles.inlineCode}>nomic-embed-text</code>) on our dedicated Oracle Cloud infrastructure, preventing vector data transmission to external APIs.
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.cardHeader}>
                  <Trash2 size={16} className={styles.cardIcon} />
                  <h3 className={styles.cardTitle}>Immediate Tenant Purge</h3>
                </div>
                <p className={styles.cardBody}>
                  When a tenant deletes a document or tears down a workspace, all associated vector chunks and OCR text are immediately purged from database indexes.
                </p>
              </div>
            </div>
          </section>

          {/* 07. Sub-Processors Directory */}
          <section id="section-subprocessors" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>07</span>
              <h2 className={styles.sectionTitle}>Third-Party Sub-Processors Directory</h2>
            </div>
            <p className={styles.text}>
              We partner exclusively with enterprise infrastructure providers that meet rigorous security benchmarks (SOC 2 Type II, ISO 27001, and GDPR compliance):
            </p>

            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Sub-Processor</th>
                    <th>Role &amp; Service</th>
                    <th>Data Transferred</th>
                    <th>Data Region</th>
                    <th>Privacy &amp; Security</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Supabase Inc.</strong></td>
                    <td>Managed PostgreSQL Database, Auth &amp; Storage</td>
                    <td>Encrypted client scopes, telemetry hashes, auth sessions</td>
                    <td>AWS Global (ap-south-1 / us-east-1)</td>
                    <td>
                      <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Supabase Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Vercel Inc.</strong></td>
                    <td>Edge CDN, Next.js Hosting &amp; Cookieless Web Analytics</td>
                    <td>Incoming HTTP headers, edge routing requests</td>
                    <td>Global Edge Network</td>
                    <td>
                      <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Vercel Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Resend Inc.</strong></td>
                    <td>Transactional Email Delivery</td>
                    <td>Contact form messages, inbound client briefs</td>
                    <td>United States (AWS)</td>
                    <td>
                      <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Resend Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Razorpay Software Pvt. Ltd.</strong></td>
                    <td>Payment Gateway &amp; Billing Settlement</td>
                    <td>Payment instrument tokens, invoice settlements</td>
                    <td>India (RBI Regulated)</td>
                    <td>
                      <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Razorpay Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Google LLC</strong></td>
                    <td>reCAPTCHA v3 &amp; OAuth Authentication</td>
                    <td>Client IP (transient), OAuth user profile</td>
                    <td>Global</td>
                    <td>
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Google Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Oracle Cloud Infrastructure</strong></td>
                    <td>Dedicated VPS Hosting for Retriever Engine</td>
                    <td>Encrypted pgvector database, local Ollama embeddings</td>
                    <td>India / Singapore</td>
                    <td>
                      <a href="https://www.oracle.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className={styles.subLink}>
                        Oracle Privacy <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 08. Legal Bases */}
          <section id="section-legal-bases" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>08</span>
              <h2 className={styles.sectionTitle}>Legal Bases for Data Processing</h2>
            </div>
            <p className={styles.text}>
              Under Article 6 of the General Data Protection Regulation (GDPR) and Section 4 of the Digital Personal Data Protection Act (DPDP Act 2023), our processing activities are grounded on clear statutory legal bases:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <strong>Legitimate Interests (Art. 6(1)(f) GDPR):</strong> Operating server-side anonymous telemetry, detecting honeypot attacks and unauthorized scraping, measuring performance budgets, and maintaining server stability.
              </li>
              <li className={styles.listItem}>
                <strong>Performance of a Contract (Art. 6(1)(b) GDPR):</strong> Authenticating client workspace accounts, generating tailored engineering proposals in the Scoping Lab, delivering technical milestone deliverables, and processing invoices.
              </li>
              <li className={styles.listItem}>
                <strong>Explicit Consent (Art. 6(1)(a) GDPR):</strong> When you voluntarily submit personal information through the contact form or opt into email correspondence.
              </li>
              <li className={styles.listItem}>
                <strong>Legal &amp; Statutory Obligation (Art. 6(1)(c) GDPR):</strong> Retaining financial transaction ledgers, GST invoices, and settlement proofs for mandatory statutory audits.
              </li>
            </ul>
          </section>

          {/* 09. Global Regulatory Compliance */}
          <section id="section-frameworks" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>09</span>
              <h2 className={styles.sectionTitle}>Global Regulatory Compliance (GDPR, DPDP 2023, CCPA)</h2>
            </div>
            <p className={styles.text}>
              Regardless of your geographic location, we adhere to the world&apos;s strictest privacy protections:
            </p>

            <h3 className={styles.subHeading}>Digital Personal Data Protection Act, 2023 (India)</h3>
            <p className={styles.text}>
              Prateek Sharma acts as the <strong>Data Fiduciary</strong> under the DPDP Act 2023. We ensure that personal data is processed solely for lawful purposes for which you have provided consent or for legitimate uses recognized by the Act. Data Principals in India enjoy statutory rights of grievance redressal, correction, and erasure.
            </p>

            <h3 className={styles.subHeading}>General Data Protection Regulation (EU / UK GDPR)</h3>
            <p className={styles.text}>
              European Union and United Kingdom visitors enjoy full data protection rights, including the right not to be subjected to automated profiling, the right to data portability, and the right to lodge complaints with a supervisory authority (such as the DPC in Ireland or the ICO in the UK).
            </p>

            <h3 className={styles.subHeading}>California Consumer Privacy Act (CCPA / CPRA)</h3>
            <p className={styles.text}>
              We do <strong>NOT</strong> sell personal information, nor do we share personal information for cross-context behavioral advertising. We have not sold or shared any consumer personal information in the preceding 12 months.
            </p>
          </section>

          {/* 10. Data Subject Rights & Erasure */}
          <section id="section-rights" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>10</span>
              <h2 className={styles.sectionTitle}>Your Rights &amp; Data Erasure Protocol</h2>
            </div>
            <p className={styles.text}>
              You hold complete sovereignty over your data. You may exercise any of the following statutory rights at any time without fees or discrimination:
            </p>

            <div className={styles.rightsGrid}>
              <div className={styles.rightItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <div>
                  <strong>Right of Access &amp; Portability:</strong> Request a complete, machine-readable JSON copy of all personal records, intake leads, or workspace data linked to your email.
                </div>
              </div>
              <div className={styles.rightItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <div>
                  <strong>Right to Rectification:</strong> Request correction of outdated company details, phone numbers, or billing addresses in active client agreements.
                </div>
              </div>
              <div className={styles.rightItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <div>
                  <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request immediate, permanent deletion of your intake leads, email messages, and workspace credentials (subject only to non-derogable statutory tax retention rules).
                </div>
              </div>
              <div className={styles.rightItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <div>
                  <strong>Right to Restriction &amp; Objection:</strong> Object to any processing based on legitimate interests or withdraw consent for ongoing communications.
                </div>
              </div>
            </div>

            <div className={styles.erasureCard}>
              <div className={styles.erasureHeader}>
                <UserCheck size={18} />
                <h3 className={styles.erasureTitle}>How to Exercise Your Rights</h3>
              </div>
              <p className={styles.text} style={{ fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                To submit an access, correction, or erasure request, send an email directly to the Data Controller. Please specify the email address used during your inquiry or client engagement. Requests are confirmed and fulfilled within <strong>30 calendar days</strong>.
              </p>
              <a
                href="mailto:prateeqsharma@gmail.com?subject=Data%20Subject%20Request%20-%20prateeq.in&body=Hi%20Prateek%2C%0A%0AI%20would%20like%20to%20submit%20a%20formal%20Data%20Subject%20Request%20for%20my%20records%20at%20prateeq.in.%0A%0ARequest%20Type%20%28Access%20%2F%20Erasure%20%2F%20Rectification%29%3A%20%0AMy%20Email%20Address%3A%20%0ADetails%3A%20%0A%0AThank%20you."
                className={styles.erasureButton}
              >
                <Mail size={16} />
                <span>Submit Data Rights Request</span>
              </a>
            </div>
          </section>

          {/* 11. Security Architecture */}
          <section id="section-security" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>11</span>
              <h2 className={styles.sectionTitle}>Technical &amp; Engineering Security Controls</h2>
            </div>
            <p className={styles.text}>
              Security is enforced using defensive architectural controls rather than relying solely on administrative policies:
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <strong>Cryptographic Transport Security:</strong> Mandatory TLS 1.3 encryption across all public web and API endpoints, enforced by modern HSTS policies.
              </li>
              <li className={styles.listItem}>
                <strong>Service Role Key Isolation:</strong> Privileged database credentials (<code className={styles.inlineCode}>SUPABASE_SERVICE_ROLE_KEY</code>) are strictly confined to server-side Node.js execution environments and are never shipped in client-side bundles.
              </li>
              <li className={styles.listItem}>
                <strong>Database Row-Level Security (RLS):</strong> Direct public anonymous write access to telemetry and intake tables is blocked at the database engine level.
              </li>
              <li className={styles.listItem}>
                <strong>Input Sanitization:</strong> All user inputs across contact endpoints, terminal query parsers, and scoping wizards are sanitized against Cross-Site Scripting (XSS), SQL Injection, and CRLF injection.
              </li>
            </ul>
          </section>

          {/* 12. Policy Governance & Contact */}
          <section id="section-controller" className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionBadge}>12</span>
              <h2 className={styles.sectionTitle}>Governance &amp; Controller Contact Information</h2>
            </div>
            <p className={styles.text}>
              This policy is reviewed quarterly or upon the launch of new technical capabilities. Material revisions will be highlighted on this page with updated version numbers and change summaries.
            </p>

            <div className={styles.controllerCard}>
              <div className={styles.controllerHeader}>
                <Scale size={18} />
                <span>Designated Data Controller</span>
              </div>
              <div className={styles.controllerDetails}>
                <div><strong>Controller Name:</strong> Prateek Sharma</div>
                <div><strong>Business Entity:</strong> Prateeq Studio</div>
                <div><strong>Physical Jurisdiction:</strong> Connaught Place, New Delhi, Delhi 110001, India</div>
                <div><strong>Primary Email:</strong> <a href="mailto:prateeqsharma@gmail.com" className={styles.textLink}>prateeqsharma@gmail.com</a></div>
                <div><strong>Portfolio Hub:</strong> <Link href="/" className={styles.textLink}>https://prateeq.in</Link></div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer Navigation */}
        <footer className={styles.footerNav}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Return to Base</span>
          </Link>
          <a href="#main-content" className={styles.backToTop}>
            <span>Jump to Top ↑</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
