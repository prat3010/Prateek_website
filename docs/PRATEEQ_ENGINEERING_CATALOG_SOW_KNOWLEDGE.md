# PRATEEQ SHARMA — MASTER ENGINEERING CATALOG & SOW KNOWLEDGE BASE

> **Document Classification:** Official Production Knowledge Base for Retriever AI Scoping Engine (`prateeq_scoping`)  
> **Author & Lead Architect:** Prateek Sharma (`https://prateeq.in`)  
> **Target Audience:** High-Ticket Founders, CTOs, Enterprise Product Leaders, and B2B Clients  
> **Commercial SSoT:** All pricing in this document reflects standard base rates in INR (₹) and USD ($).

---

## 1. Core Engineering Philosophy & Delivery Standards

Prateek Sharma provides high-performance bespoke software architecture, full-stack product engineering, and cognitive AI systems. Every project built under this catalog adheres to strict enterprise standards:
1. **Production Tech Stack**: Next.js 16 App Router (React 19), TypeScript, Tailwind CSS / CSS Modules, Supabase PostgreSQL (RLS, pgvector), Vercel Serverless Edge, and Python FastAPI backend on Oracle Cloud.
2. **Speed & Accessibility**: Sub-second First Contentful Paint (LCP < 1.2s), 100% WCAG AA Accessibility, zero layout shift (CLS = 0), and Lenis smooth scrolling.
3. **Security by Design**: Row-Level Security (RLS) policies on every database table, cryptographic OAuth session verification (PKCE), rate limiting, and encrypted environment credentials.
4. **Transparent Economics**: Fixed-scope, productized deliverables with zero surprise invoices. Clear milestone structures (50% upfront deposit / 50% upon deployment sign-off, or 40/30/30 for enterprise builds).

---

## 2. Base Core Engines (Foundational Architecture SKUs)

Every project starts with exactly one Base Core Engine foundation:

### 2.1 Landing Page Core Engine (`id: landing`)
- **Tier:** Tier 1
- **Pricing:** ₹30,000 INR / $400 USD
- **Layman Description:** A single, ultra-fast, high-converting webpage built to capture leads, showcase your brand, and turn visitors into paying clients.
- **Technical Specifications:**
  - Next.js 16 App Router with React 19 Server Components
  - Responsive Framer Motion UI with subtle hardware-accelerated animations
  - Custom CSS Modules with responsive desktop/tablet/mobile layouts
  - Invisible Google reCAPTCHA v3 spam challenge protection
  - Server-side telemetry, daily visitor analytics logging, and JSON-LD SEO Schema
  - Turnaround: 5 to 7 business days

### 2.2 Multi-Page Web App Core Engine (`id: multipage`)
- **Tier:** Tier 2
- **Pricing:** ₹55,000 INR / $750 USD
- **Layman Description:** A complete multi-page business website (Home, About, Services, Case Studies, Pricing, Contact) with smooth page transitions and consistent branding.
- **Technical Specifications:**
  - Multi-page dynamic routing (3 to 6 dedicated pages)
  - Framer Motion page transitions and shared application layout shell
  - Server-cached metadata, dynamic OpenGraph image generation, and sitemap/robots.txt
  - Deep-linkable architecture and interactive client discovery forms
  - Turnaround: 10 to 14 business days

### 2.3 Full-Stack SaaS MVP Core Engine (`id: saas`)
- **Tier:** Tier 3
- **Pricing:** ₹1,75,000 INR / $2,400 USD
- **Layman Description:** A production software foundation connected to a cloud database for web applications where users create accounts, manage persistent data, and execute software workflows.
- **Technical Specifications:**
  - Full Web App Shell with authenticated client portal (`/dashboard`)
  - Supabase Encrypted PostgreSQL Architecture with Row-Level Security (RLS)
  - Next.js 16 Server Actions and high-speed `unstable_cache` layer
  - Production Vercel Wiring, CI/CD automated deployment, and audit logging
  - Turnaround: 3 to 4 weeks

### 2.4 Standalone Embed Script Engine (`id: standalone_embed`)
- **Tier:** Tier 0 (Widget Engine)
- **Pricing:** ₹15,000 INR / $200 USD
- **Layman Description:** Standalone script loader and widget host for embedding single-purpose tools (chatbots, calculators, booking widgets) onto existing third-party websites.
- **Technical Specifications:** Vanilla JS Shadow DOM isolation, CDN distribution (`widget.js`), CORS validation, postMessage iframe host.

---

## 3. Modular Feature Upgrades (Add-on Modules)

Clients customize their Base Engine with modular, productized add-ons:

### Category A: Security, Auth & Core Infrastructure
1. **User Auth & Client Portal (`id: auth`)**
   - Pricing: ₹25,000 INR / $350 USD
   - Description: Google OAuth 2.0 PKCE, Passwordless Magic Links, Supabase session persistence, private client workspace dashboard.
   - Prerequisites: Requires `multipage` or `saas` engine.
2. **Admin Dashboard & Role Access Control (`id: admin`)**
   - Pricing: ₹75,000 INR / $1,000 USD
   - Description: Master admin control center with multi-role permissions (Owner, Admin, Member), user management table, metric charts, and data export.
   - Prerequisites: Requires `auth`.
3. **Database Migration & Schema Pipeline (`id: migration`)**
   - Pricing: ₹40,000 INR / $550 USD
   - Description: Automated migration pipelines, data sanitization scripts, seed scripts, and zero-downtime schema migrations.

### Category B: Commerce, Booking & Monetization
4. **Payment Gateway Integration (`id: payments`)**
   - Pricing: ₹45,000 INR / $600 USD
   - Description: Razorpay / Stripe checkout, webhook handlers for instantaneous event capture, recurring subscriptions, and automatic PDF tax invoicing.
   - Prerequisites: Requires `auth` for subscriptions.
5. **Booking & Appointment Platform (`id: booking`)**
   - Pricing: ₹35,000 INR / $450 USD
   - Description: Real-time calendar synchronization, Google Calendar API integration, appointment slot management, automated confirmation emails, and upfront booking deposits.
6. **E-Commerce Storefront & Cart Module (`id: commerce`)**
   - Pricing: ₹60,000 INR / $800 USD
   - Description: Product catalog with SKU filtering, interactive slide-over cart drawer, discount coupon validation, inventory status, and automated packing slips.
7. **LMS & Course Portal Module (`id: lms`)**
   - Pricing: ₹70,000 INR / $950 USD
   - Description: Structured curriculum video player, student progress tracking, chapter quizzes, gated lesson access, and downloadable certificate generation.
   - Prerequisites: Requires `auth` and `payments`.

### Category C: AI Knowledge Base, Agents & Workflows
8. **Private AI Knowledge Base / Vector Search (`id: ai_rag`)**
   - Pricing: ₹1,25,000 INR / $1,700 USD
   - Description: Enterprise RAG copilot powered by Retriever platform. Multimodal PDF/document vector indexing (`nomic-embed-text`), semantic HNSW pgvector search, source citations with clickable presigned downloads, and telemetry feedback (thumbs up/down).
   - Recommended Care: Premium SLA Retainer.
9. **Autonomous AI Agents & Multi-Agent Workflows (`id: ai_agents`)**
   - Pricing: ₹1,35,000 INR / $1,800 USD
   - Description: Autonomous ReAct agents, tool-calling integration with external APIs, web scraping, multi-agent consensus reflection loops (Architect vs. Critic), and webhook execution.
10. **Autonomous Voice AI Agent (`id: ai_voice_agent`)**
    - Pricing: ₹1,50,000 INR / $2,000 USD
    - Description: Low-latency interactive conversational voice AI bot with real-time speech-to-text, LLM inference, and ElevenLabs / Deepgram neural voice synthesis.
    - Prerequisites: Requires `ai_rag`.
11. **Vision OCR & Document Parser (`id: ai_vision_ocr`)**
    - Pricing: ₹90,000 INR / $1,200 USD
    - Description: Layout-aware multimodal OCR parsing for PDF invoices, scanned receipts, and technical documents with JSON Schema structured data extraction.
12. **Automated Transactional Email Workflows (`id: email`)**
    - Pricing: ₹15,000 INR / $200 USD
    - Description: Resend / React-Email transactional notification templates for sign-ups, receipts, scope confirmations, and lead inquiries.
13. **CRM & Lead Capture Pipeline (`id: crm`)**
    - Pricing: ₹25,000 INR / $350 USD
    - Description: Automated webhook forwarding to HubSpot / Notion / Airtable, lead qualification scoring, and visitor intent logging.
14. **Custom Third-Party API Integrations (`id: integrations`)**
    - Pricing: ₹35,000 INR / $450 USD
    - Description: Custom bi-directional REST / GraphQL API webhooks, sync pipelines, and external SaaS connectors.

### Category D: Engagement, Search & Custom Analytics
15. **Instant Client-Side & Vector Search (`id: search`)**
    - Pricing: ₹20,000 INR / $250 USD
    - Description: Command palette (`Cmd+K`) instant search across site content and documents with fuzzy keyword filtering and vector search fallback.
16. **Headless Blog & CMS Content Management (`id: blog`)**
    - Pricing: ₹30,000 INR / $400 USD
    - Description: Markdown/MDX dynamic publishing engine with Supabase persistence, SEO tags, reading time, and on-demand cache revalidation.
17. **Client Feedback & Star Review System (`id: reviews`)**
    - Pricing: ₹15,000 INR / $200 USD
    - Description: Verified customer testimonials, 5-star rating submission, moderation queue, and Google Review schema markup.
18. **Multi-Language Internationalization (`id: multilingual`)**
    - Pricing: ₹30,000 INR / $400 USD
    - Description: Multi-locale routing (`/en`, `/es`, `/fr`, `/de`), translation key dictionaries, and automatic Geo-IP locale detection.
19. **Custom Visitor Analytics & Heatmap Dashboard (`id: analytics`)**
    - Pricing: ₹20,000 INR / $250 USD
    - Description: GDPR-compliant privacy-first daily IP hash visitor telemetry, page view aggregations, referrer graphs, and bounce rate tracking.

---

## 4. Architectural Goal Archetypes & Presets

The Scoping Lab groups typical project requirements into proven archetypes:

| Archetype ID | Archetype Label | Recommended Engine | Included Key Features | Typical Delivery |
| :--- | :--- | :--- | :--- | :--- |
| `landing_page` | 🚀 High-Converting Landing Page | `landing` | `email` | 1 Week |
| `business_multipage` | 🏢 Multi-Page Business Website | `multipage` | `email`, `blog`, `analytics` | 2 Weeks |
| `ecommerce` | 🛒 E-commerce & Digital Store | `multipage` | `commerce`, `payments`, `auth`, `email` | 2-3 Weeks |
| `booking_appointments` | 📅 Booking & Appointment Platform | `multipage` | `booking`, `payments`, `auth`, `email` | 2-3 Weeks |
| `saas_app` | 🚀 Full-Stack SaaS Web App | `saas` | `auth`, `payments`, `admin`, `email` | 4 Weeks |
| `lms_portal` | 🎓 LMS & Online Course Portal | `saas` | `lms`, `auth`, `payments`, `blog` | 4 Weeks |
| `crm_admin` | 📊 Internal CRM / Admin Center | `saas` | `admin`, `auth`, `crm`, `migration` | 3-4 Weeks |
| `ai_rag_app` | 🤖 AI Knowledge Base & RAG Copilot | `saas` | `ai_rag`, `auth`, `admin`, `search` | 4 Weeks |
| `autonomous_agents` | ⚡ Autonomous AI Agents Platform | `saas` | `ai_agents`, `ai_rag`, `auth`, `admin` | 4-5 Weeks |
| `voice_ai_agent_app` | 🎙️ Conversational Voice AI Platform | `saas` | `ai_voice_agent`, `ai_rag`, `auth` | 4-5 Weeks |
| `vision_ocr_saas` | 👁️ Vision OCR Document SaaS | `saas` | `ai_vision_ocr`, `auth`, `payments` | 3-4 Weeks |

---

## 5. Brand Identity & Creative Asset Tiers

1. **Client-Provided Brand Kit (`id: provided`)**: ₹0 INR / $0 USD — Client provides ready Figma designs, logos, typography, and copywriting.
2. **Essential Visual Identity Package (`id: basic`)**: ₹15,000 INR / $200 USD — Color palette tokens, typography pairing, logo vectorization, and responsive favicon suite.
3. **Full Custom Design System & Copywriting (`id: comprehensive`)**: ₹45,000 INR / $600 USD — Complete Figma design system, bespoke UI component library, professional B2B value-proposition copywriting, and custom illustrations.

---

## 6. Maintenance, Security & SLA Retainer Plans

1. **Zero Retainer (`id: none`)**: ₹0/month — 30-day post-launch bug warranty included on all projects.
2. **Standard Infrastructure & Security Care (`id: standard`)**: ₹10,000/month INR ($135/month USD) — 99.9% uptime monitoring, weekly dependency updates, database backups, and 24-hour SLA critical bug fixes.
3. **Growth SLA & Dedicated Feature Sprints (`id: growth`)**: ₹35,000/month INR ($475/month USD) — Includes Standard Care + 10 hours of monthly custom feature engineering and Priority 8-hour SLA.
4. **Enterprise Mission-Critical SLA & AI Retainer (`id: premium`)**: ₹75,000/month INR ($1,000/month USD) — 24/7 incident response (2-hour SLA), vector database fine-tuning, automated weekly RAG evaluation benchmarks, and continuous feature expansion.

---

## 7. Mathematical Pricing Rules & CPQ Calculation Formula

All commercial calculations adhere strictly to the following formula:
$$\text{Subtotal} = \text{Price}(\text{Base Engine}) + \sum \text{Price}(\text{Selected Features}) + \text{Price}(\text{Brand Kit}) + \text{Price}(\text{Maintenance Plan})$$

- **Transitive Dependency Resolution:** Selecting any module automatically selects all prerequisite dependencies (e.g., adding `admin` automatically includes `auth`).
- **Volume Bundle Discounts:**
  - 1–2 features: 0% discount.
  - 3–5 features (Growth Stack): 5% discount on feature subtotal.
  - 6+ features (Enterprise Suite): 10% discount on feature subtotal.
- **Deposit Split:** Standard 50% upfront deposit to initiate sprint; 50% upon final UAT approval prior to production handover.
