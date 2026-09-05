#!/usr/bin/env python3
"""
generate_architecture_nodes.py (Master Ultra SOTA Edition - 93 Nodes)
Generates atomic, high-fidelity architecture nodes covering the ENTIRE stack:
- 1. Web Routes & Layouts (App Router + Proxy + Callback)
- 2. Next.js 16 Edge & REST API Gateway Matrix (31 Endpoints)
- 3. Core Domain Libraries & Identity Providers (pricing.ts, sessionVerify.ts, rag-client.ts, AuthContext)
- 4. UI Systems & Interactive Components (NoirSkyline, Cart Drawer, Terminal, Scoping Lab, RAG Playground)
- 5. Database Schemas (Supabase Postgres + pgvector + Telemetry + CRM + Logs)
- 6. Retriever FastAPI Routers (Chat, Search, Documents, Admin, Auth, Tenant, Workflow, Consensus, etc.)
- 7. Retriever Cognitive Engines & Agentic Systems (RLM, GraphRAG, Docling OCR, LlamaGuard, LongLLMLingua)
- 8. Async Infrastructure, Message Brokers & Security Envelopes (Celery, RabbitMQ, S3, KMS)
"""

from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
NODES_DIR = DOCS_DIR / "architecture_nodes"
NODES_DIR.mkdir(exist_ok=True)

NODES = {
    # -------------------------------------------------------------
    # 1. FRONTEND APP ROUTER ROUTES & LAYOUTS (10 Nodes)
    # -------------------------------------------------------------
    "Route_home.md": """# Route: `/` (Adaptive Portfolio Home)

#route #frontend #ui #identity

> **Core Multi-Audience Portfolio Experience with Azure/Noir Skyline & Lenis Smooth Scroll.**

- **Path:** `src/app/page.tsx` & `src/components/`
- **Key Features:**
  - NoirSkyline 6-layer parallax backdrop (`isMobile` & `reducedMotion` decoupled)
  - Audience Identity Switcher (`Developer` vs `Business`)
  - Server-First Cookie Extraction (`theme`, `audience`) in `RootLayout`
  - Lenis smooth scroll container (`LenisProvider.tsx`)
  - Sections: Hero, About, Skills, Projects, Playground, Resume, Scoping, Contact, Footer

---

## 🔗 Related Architecture & Cross-References
- [04_Adaptive_Portfolio_Experience](../04_Adaptive_Portfolio_Experience.md)
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [08_Information_Architecture](../08_Information_Architecture.md)
- [UI: NoirSkyline](UI_NoirSkyline.md)
- [Context: ThemeProvider & Lenis](Context_ThemeProvider_Lenis.md)
- [Lib: data.ts](Lib_data.md)
""",

    "Route_scoping.md": """# Route: `/scoping` (Project Scoping Lab)

#route #frontend #scoping #cpq #phase_g

> **Interactive Discovery Wizard, Multimodal RFP Dropzone & Instant CPQ Estimate.**

- **Path:** `src/app/scoping/page.tsx` & `src/components/Intake/IntakeForm.tsx`
- **Key Features:**
  - Deep-linkable via `?engine=landing|multipage|saas` or `?goal=<archetype_id>`
  - Sticky Cart Drawer with real-time currency conversion (`INR` / `USD`)
  - Transitive feature dependency resolution (`pricing.ts`)
  - PDF proposal & SOW export (`ScopingBriefPDF.tsx`)
  - Live Retriever proof badge (`⚡ Powered by Retriever Engine`)

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [09_Section_Specifications/12_Scoping_Lab](../09_Section_Specifications/12_Scoping_Lab.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Lib: pricing.ts](Lib_pricing.md)
""",

    "Route_dashboard.md": """# Route: `/dashboard` (Client Workspace Dashboard)

#route #frontend #client #workspace #auth

> **Authenticated Client Command Center for Active Projects, Milestones & Ledgers.**

- **Path:** `src/app/dashboard/page.tsx` & `src/components/dashboard/`
- **Key Features:**
  - Google OAuth / PKCE session restoration (`AuthContext.tsx`)
  - Active project milestone progress bars & deliverable review
  - Interactive Phase 2 Change Order re-scoping customizer
  - Financial ledger with one-click Razorpay checkout & invoice PDF downloads
  - Grounded project copilot (`/api/client/copilot`)

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [09_Section_Specifications/13_Client_Workspace_Dashboard](../09_Section_Specifications/13_Client_Workspace_Dashboard.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [API: client/get-scopes](API_client_get_scopes.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
""",

    "Route_admin.md": """# Route: `/admin` (Master Admin Control Center)

#route #frontend #admin #leads #scopes

> **Operator Command Center for Autonomous Outreach Queue & Client Scopes.**

- **Path:** `src/app/admin/page.tsx` & `src/components/admin/`
- **Key Features:**
  - Google OAuth admin auth gate
  - Autonomous AI Outreach lead approval queue
  - Master client scope revisions & invoice ledger
  - One-click outreach dispatch trigger (`/api/outreach/dispatch`)

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [API: outreach/dispatch](API_outreach_dispatch.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [Schema: client_scopes](Schema_client_scopes.md)
""",

    "Route_rag_app.md": """# Route: `/rag` & `/rag/app` (Retriever SaaS Studio)

#route #frontend #rag #saas #retriever

> **Commercial RAG SaaS Product Landing Page & Multi-Tenant Studio Workspace.**

- **Paths:** `src/app/rag/page.tsx` & `src/app/rag/app/page.tsx`
- **Key Features:**
  - Mini-RAG live interactive sandbox (`ChatPanel.tsx`, `UploadPanel.tsx`, `SearchPanel.tsx`)
  - Geo-IP pricing calculator (INR/USD)
  - 1-line script embed configurator (`<script src=".../widget.js">`)
  - SaaS Studio sub-views: Chat Studio, Document Library, Search Inspector, Embed Configurator

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [UI: RAGLabPlayground](UI_RAGLabPlayground.md)
- [Lib: rag-client.ts](Lib_rag_client.md)
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Retriever_API: v1/search](Retriever_API_v1_search.md)
""",

    "Route_terminal.md": """# Route: `/terminal` (Interactive Diagnostics Console)

#route #frontend #cli #diagnostics

> **Retro-Futuristic Interactive Diagnostics Terminal Console.**

- **Path:** `src/app/terminal/page.tsx` & `src/components/terminal/`
- **Key Features:**
  - Custom CLI commands: `help`, `git-info`, `qrcode`, `skills`, `projects`, `theme`, `snake`, `clear`
  - Real-time Git commit log inspector via `/api/git-log`
  - Dynamic QR code generator via `/api/terminal/qrcode`
  - Retro Snake Easter egg with global high-score leaderboard

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/10_Terminal](../09_Section_Specifications/10_Terminal.md)
- [UI: Terminal](UI_Terminal.md)
- [API: terminal/qrcode](API_terminal_qrcode.md)
- [API: terminal/snake-leaderboard](API_terminal_snake_leaderboard.md)
- [API: git-log](API_git_log.md)
""",

    "Route_analytics.md": """# Route: `/analytics` (Public Visitor Telemetry Dashboard)

#route #frontend #analytics #telemetry

> **Privacy-Preserving Public Visitor Analytics & Geolocation Telemetry Dashboard.**

- **Path:** `src/app/analytics/page.tsx` & `src/components/analytics/`
- **Key Features:**
  - Real-time unique visitor counts, country distribution, and page visit breakdown
  - Fast-path SQL RPC aggregation via `get_analytics_summary()`
  - Zero-cookie GDPR compliant telemetry via daily SHA-256 IP hashing

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [UI: AnalyticsDashboard](UI_AnalyticsDashboard.md)
- [API: analytics-summary](API_analytics_summary.md)
- [Schema: page_visits](Schema_page_visits.md)
- [Proxy: Telemetry](Proxy_telemetry.md)
""",

    "Route_blog.md": """# Route: `/blog` & `/blog/[slug]` (Technical Markdown Publication)

#route #frontend #blog #seo #markdown

> **Dynamic SEO-Optimized Engineering Blog & Technical Case Studies.**

- **Path:** `src/app/blog/page.tsx` & `src/app/blog/[slug]/page.tsx`
- **Key Features:**
  - Markdown article rendering with syntax highlighting and frontmatter parsing
  - Supabase database persistence with local file fallback in `src/content/posts/`
  - Contextual deep linking into Project case studies and Scoping Wizard presets

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/11_Blog](../09_Section_Specifications/11_Blog.md)
- [BLOG_DEEP_LINKING_MAP](../BLOG_DEEP_LINKING_MAP.md)
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)
- [UI: BlogEngine](UI_BlogEngine.md)
- [Lib: markdown.ts](Lib_markdown.md)
- [Schema: blog_posts](Schema_blog_posts.md)
- [API: blog/publish](API_blog_publish.md)
""",

    "Route_auth_callback.md": """# Route: `/auth/callback` (PKCE OAuth Handler)

#route #security #auth #pkce #oauth

> **Server-Side PKCE OAuth Authorization Code Exchange & Session Cookie Gate.**

- **Path:** `src/app/auth/callback/route.ts` & `src/lib/supabase/server.ts`
- **Key Features:**
  - Exchanges PKCE code for Supabase JWT session via `exchangeCodeForSession`
  - Sets HTTP-only `prateeq_active_user` session cookies for Safari ITP compliance
  - Canonicalizes redirects back to `/dashboard` or intended deep-link target

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Context: AuthContext](Context_AuthContext.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
- [Route: /dashboard](Route_dashboard.md)
""",

    "Proxy_telemetry.md": """# Proxy: `src/proxy.ts` (Next.js 16 Edge Proxy & Telemetry)

#proxy #edge #security #telemetry #middleware

> **Edge Request Interceptor, Bot Spam Filter & Daily Hashed Visitor Telemetry.**

- **Path:** `src/proxy.ts`
- **Key Features:**
  - Next.js 16 Proxy intercepting all incoming HTTP traffic
  - Extracts Vercel Geo-IP country header (`x-vercel-ip-country`)
  - Filters crawler bots and malicious vulnerability probes (`.php`, `wp-admin`, `.env`)
  - Hashes client IP with daily rotating salt for GDPR compliance

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Schema: page_visits](Schema_page_visits.md)
- [Route: /analytics](Route_analytics.md)
""",

    # -------------------------------------------------------------
    # 2. NEXT.JS 16 EDGE & REST API GATEWAY MATRIX (31 Nodes)
    # -------------------------------------------------------------
    "API_scoping_parse_intent.md": """# API: `POST /api/scoping/parse-intent`

#api #edge #nlp #intent #phase_g

> **Edge Intent Classifier streaming Natural Language queries to Retriever Cognitive Core.**

- **Endpoint:** `POST /api/scoping/parse-intent`
- **Gateway:** Next.js 16 App Router Route Handler (`src/app/api/scoping/parse-intent/route.ts`)
- **Backend Target:** FastAPI `https://rag.prateeq.in/v1/chat` (Tenant: `prateeq_scoping`)
- **Payload:** `{ prompt: string, currency: "INR" | "USD" }`
- **Output:** `{ engineId, selectedFeatures: string[], suggestedAddons: string[], confidence: number, mathVerification: string }`

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
- [Engine: RLM Python REPL Sandbox](Engine_RLM_Python_REPL.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
""",

    "API_scoping_parse_rfp.md": """# API: `POST /api/scoping/parse-rfp`

#api #multimodal #ocr #pdf #phase_g

> **Multimodal RFP & Wireframe Ingestion Stream using Docling Layout OCR (M42).**

- **Endpoint:** `POST /api/scoping/parse-rfp`
- **Gateway:** Next.js 16 Route Handler with `multipart/form-data`
- **Processing Engine:** Docling Layout OCR + PyMuPDF AST Chunker
- **Payload:** `FormData` containing `.pdf`, `.docx`, or image wireframes
- **Output:** Extracted functional specifications, automatically checked cart features, and estimate matrix.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Engine: Docling Layout OCR](Engine_Docling_Layout_OCR.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
""",

    "API_client_copilot.md": """# API: `POST /api/client/copilot`

#api #copilot #rag #client #ai

> **Context-Aware Client Project Assistant grounded in verified active project scopes.**

- **Endpoint:** `POST /api/client/copilot`
- **Path:** `src/app/api/client/copilot/route.ts`
- **Authentication:** `getVerifiedSessionEmail` via Bearer Token or HTTP cookie
- **Function:** Queries client's active `client_scopes` record and synthesizes answers regarding features, timeline, maintenance, and payment schedules.

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [Route: /dashboard](Route_dashboard.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
""",

    "API_client_create_razorpay_order.md": """# API: `POST /api/client/create-razorpay-order`

#api #payments #razorpay #escrow

> **Server-Side SSoT 50% Milestone Deposit Order Generation.**

- **Endpoint:** `POST /api/client/create-razorpay-order`
- **Security:** Verified Supabase Session Token (`sessionVerify.ts`)
- **Calculation:** Recomputes package total from `intakeQuestionnaireDefaults.json`, applies promo code, calculates exact 50% deposit amount.
- **Output:** `{ orderId, amount, currency, keyId, clientScopeId }`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: promo_codes](Schema_promo_codes.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
""",

    "API_client_verify_razorpay_payment.md": """# API: `POST /api/client/verify-razorpay-payment`

#api #payments #webhook #security

> **HMAC-SHA256 Payment Verification & SOW Scope Immutability Lock.**

- **Endpoint:** `POST /api/client/verify-razorpay-payment`
- **Verification:** Generates `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`
- **Post-Verification Actions:**
  1. Updates `client_scopes.status = 'deposit_paid'`
  2. Generates immutable `sow_hash`
  3. Inserts invoice receipt into `invoices`
  4. Triggers Resend email confirmation with PDF attachment

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
- [Schema: invoices](Schema_invoices.md)
- [Schema: client_scopes](Schema_client_scopes.md)
""",

    "API_client_create_razorpay_subscription.md": """# API: `POST /api/client/create-razorpay-subscription`

#api #payments #subscriptions #razorpay

> **Recurring Retainer & Maintenance Care Plan Subscription Generator.**

- **Endpoint:** `POST /api/client/create-razorpay-subscription`
- **Path:** `src/app/api/client/create-razorpay-subscription/route.ts`
- **Function:** Creates recurring billing plans for Managed and Enterprise care tiers via Razorpay Subscriptions API.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Route: /dashboard](Route_dashboard.md)
- [Schema: invoices](Schema_invoices.md)
""",

    "API_client_create_razorpay_invoice.md": """# API: `POST /api/client/create-razorpay-invoice`

#api #payments #invoice #razorpay

> **Direct Invoice Generation for Milestone Deliverables & Phase 2 Change Orders.**

- **Endpoint:** `POST /api/client/create-razorpay-invoice`
- **Path:** `src/app/api/client/create-razorpay-invoice/route.ts`
- **Function:** Generates official GST-compliant tax invoices and payment links.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)
""",

    "API_client_get_invoices.md": """# API: `GET /api/client/get-invoices`

#api #financial #ledger #client

> **Authenticated Client Financial Ledger & Receipt Exporter.**

- **Endpoint:** `GET /api/client/get-invoices`
- **Path:** `src/app/api/client/get-invoices/route.ts`
- **Authentication:** Verified Supabase JWT session
- **Output:** List of payment history, timestamps, PDF receipts, and status.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Route: /dashboard](Route_dashboard.md)
- [Schema: invoices](Schema_invoices.md)
""",

    "API_client_save_scope.md": """# API: `POST /api/client/save-scope`

#api #persistence #client #session

> **Session-Gated Client Scope Revision & Draft State Persistence.**

- **Endpoint:** `POST /api/client/save-scope`
- **Path:** `src/app/api/client/save-scope/route.ts`
- **Authentication:** `Authorization: Bearer <supabase_access_token>`
- **Identity Derivation:** Client email derived strictly from verified JWT claims.
- **Database Target:** Supabase table `client_scopes`.

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
""",

    "API_client_get_scopes.md": """# API: `GET /api/client/get-scopes`

#api #persistence #client #session

> **Authenticated Scope Retrieval for Client Dashboard & Scoping History.**

- **Endpoint:** `GET /api/client/get-scopes`
- **Path:** `src/app/api/client/get-scopes/route.ts`
- **Authentication:** Session JWT bearer token via `sessionVerify.ts`

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [Route: /dashboard](Route_dashboard.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
""",

    "API_client_delete_scope.md": """# API: `POST /api/client/delete-scope`

#api #persistence #client

> **Draft Scope Cleanup & Cancellation Lifecycle Endpoint.**

- **Endpoint:** `POST /api/client/delete-scope`
- **Path:** `src/app/api/client/delete-scope/route.ts`
- **Guard:** Only allows deleting scopes in `'draft'` status belonging to the authenticated client.

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [Route: /dashboard](Route_dashboard.md)
""",

    "API_client_intake_draft.md": """# API: `POST /api/client/intake-draft`

#api #scoping #draft #anonymous

> **Anonymous Scoping Questionnaire Auto-Save & Magic Link Resumption.**

- **Endpoint:** `POST /api/client/intake-draft`
- **Path:** `src/app/api/client/intake-draft/route.ts`
- **Function:** Persists partial questionnaire state to allow prospects to resume scoping across browser sessions.

---

## 🔗 Related Architecture & Cross-References
- [UI: ScopingLab](UI_ScopingLab.md)
- [Schema: client_scopes](Schema_client_scopes.md)
""",

    "API_webhooks_razorpay.md": """# API: `POST /api/webhooks/razorpay`

#api #webhooks #security #razorpay

> **Asynchronous Server-to-Server Razorpay Webhook Event Processor.**

- **Endpoint:** `POST /api/webhooks/razorpay`
- **Path:** `src/app/api/webhooks/razorpay/route.ts`
- **Security:** Verifies `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`
- **Events Handled:** `payment.captured`, `payment.failed`, `subscription.charged`, `subscription.cancelled`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
""",

    "API_outreach_prospect.md": """# API: `POST /api/outreach/prospect`

#api #outreach #ai #leads

> **Autonomous AI Prospect Ingestion & ICP Scoring Engine.**

- **Endpoint:** `POST /api/outreach/prospect`
- **Path:** `src/app/api/outreach/prospect/route.ts`
- **Function:** Parses potential lead profiles, computes Ideal Customer Profile (ICP) match scores, and stages leads in `outreach_leads`.

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [UI: AdminPortal](UI_AdminPortal.md)
""",

    "API_outreach_dispatch.md": """# API: `POST /api/outreach/dispatch`

#api #outreach #email #resend

> **One-Click Autonomous Outreach Campaign Email Dispatcher.**

- **Endpoint:** `POST /api/outreach/dispatch`
- **Path:** `src/app/api/outreach/dispatch/route.ts`
- **Authentication:** Admin Google OAuth Session Gate
- **Function:** Dispatches personalized cold outreach emails with deep-linked Scoping Lab configurations via Resend.

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [Route: /admin](Route_admin.md)
""",

    "API_outreach_get_leads.md": """# API: `GET /api/outreach/get-leads`

#api #outreach #admin #leads

> **Admin Lead Queue Query Endpoint with Filter & Status Sorting.**

- **Endpoint:** `GET /api/outreach/get-leads`
- **Path:** `src/app/api/outreach/get-leads/route.ts`
- **Function:** Returns paginated list of outreach leads (`staged`, `approved`, `sent`, `replied`, `converted`).

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
""",

    "API_rag_tenant.md": """# API: `POST /api/rag/tenant`

#api #rag #multitenancy #saas

> **Retriever SaaS Multi-Tenant Provisioning & Configuration Manager.**

- **Endpoint:** `POST /api/rag/tenant` & `GET /api/rag/tenant`
- **Path:** `src/app/api/rag/tenant/route.ts`
- **Function:** Creates isolated tenant workspaces, assigns embedding models, and provisions API keys.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Schema: rag_tenants](Schema_rag_tenants.md)
- [Route: /rag/app](Route_rag_app.md)
""",

    "API_rag_invite.md": """# API: `POST /api/rag/invite`

#api #rag #auth #invites

> **Workspace Member Invitation & Role-Based Access Control (RBAC).**

- **Endpoint:** `POST /api/rag/invite`
- **Path:** `src/app/api/rag/invite/route.ts`
- **Roles:** `owner`, `admin`, `editor`, `viewer`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
""",

    "API_rag_members.md": """# API: `GET /api/rag/members`

#api #rag #rbac #team

> **Workspace Team Member Management & Revocation Endpoint.**

- **Endpoint:** `GET /api/rag/members`
- **Path:** `src/app/api/rag/members/route.ts`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
""",

    "API_rag_telemetry.md": """# API: `GET /api/rag/telemetry`

#api #rag #telemetry #tokens

> **SaaS Studio Token Consumption, Query Latency & Cost Analytics.**

- **Endpoint:** `GET /api/rag/telemetry`
- **Path:** `src/app/api/rag/telemetry/route.ts`
- **Metrics:** Queries per second, token usage breakdown, semantic cache hit ratios.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Schema: retriever_inference_logs](Schema_retriever_inference_logs.md)
""",

    "API_blog_publish.md": """# API: `POST /api/blog/publish`

#api #blog #cms #automation

> **Automated AI Blog Post Ingestion & Next.js ISR Cache Revalidator.**

- **Endpoint:** `POST /api/blog/publish`
- **Path:** `src/app/api/blog/publish/route.ts`
- **Authentication:** `SYNC_API_KEY` Shared Secret Header
- **Post-Action:** Revalidates Next.js cache tags (`blog`, `portfolio-data`).

---

## 🔗 Related Architecture & Cross-References
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)
- [Schema: blog_posts](Schema_blog_posts.md)
- [Route: /blog](Route_blog.md)
""",

    "API_analytics_summary.md": """# API: `GET /api/analytics-summary`

#api #analytics #rpc #telemetry

> **Fast-Path Visitor Metrics API backed by PostgreSQL RPC Function.**

- **Path:** `src/app/api/analytics-summary/route.ts`
- **SQL Fast-Path:** `get_analytics_summary(cutoff_time)`

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [Schema: page_visits](Schema_page_visits.md)
- [Route: /analytics](Route_analytics.md)
""",

    "API_contact.md": """# API: `POST /api/contact` (Contact Form Gateway)

#api #email #resend #recaptcha

> **Inbound Lead Submission with Invisible Google reCAPTCHA v3 & Resend Email Delivery.**

- **Path:** `src/app/api/contact/route.ts`
- **Services:** Google reCAPTCHA score verification + Resend API
- **Recipient:** `prateeqsharma@gmail.com`

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/08_Contact](../09_Section_Specifications/08_Contact.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
""",

    "API_terminal_qrcode.md": """# API: `POST /api/terminal/qrcode`

#api #terminal #cli #qrcode

> **SVG / PNG QR Code Generation for Diagnostics Terminal.**

- **Path:** `src/app/api/terminal/qrcode/route.ts`
- **Function:** Encodes URLs, vCards, or text into downloadable SVG/PNG matrix.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: Terminal](UI_Terminal.md)
""",

    "API_terminal_snake_leaderboard.md": """# API: `GET /api/terminal/snake-leaderboard`

#api #terminal #easteregg #gaming

> **Global High-Score Leaderboard for Retro Terminal Snake Easter Egg.**

- **Path:** `src/app/api/terminal/snake-leaderboard/route.ts`
- **Features:** Rate-limited score submissions with cryptographic anti-tamper hash.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: Terminal](UI_Terminal.md)
""",

    "API_git_log.md": """# API: `GET /api/git-log`

#api #git #terminal #diagnostics

> **Pre-baked Git Commit History & Build Telemetry Endpoint.**

- **Path:** `src/app/api/git-log/route.ts`
- **Data Source:** `src/data/git-log.json` generated at build time.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: Terminal](UI_Terminal.md)
""",

    "API_projects.md": """# API: `GET /api/projects` & `[slug]`

#api #content #projects #cache

> **Portfolio Case Studies REST Endpoint with Dual-Persona Payload.**

- **Path:** `src/app/api/projects/route.ts` & `src/app/api/projects/[slug]/route.ts`
- **Cache Invalidation:** Revalidates tag `projects`.

---

## 🔗 Related Architecture & Cross-References
- [Schema: projects](Schema_projects.md)
- [Lib: data.ts](Lib_data.md)
""",

    "API_certificates.md": """# API: `GET /api/certificates` & `[id]`

#api #content #certificates

> **Verified Technical Certifications Metadata & Credential Exporter.**

- **Path:** `src/app/api/certificates/route.ts` & `src/app/api/certificates/[id]/route.ts`

---

## 🔗 Related Architecture & Cross-References
- [Schema: skills](Schema_skills.md)
- [Lib: data.ts](Lib_data.md)
""",

    "API_skills.md": """# API: `GET /api/skills` & `[id]`

#api #content #skills

> **Competency Inventory & Business Outcome Metrics REST API.**

- **Path:** `src/app/api/skills/route.ts` & `src/app/api/skills/[id]/route.ts`

---

## 🔗 Related Architecture & Cross-References
- [Schema: skills](Schema_skills.md)
- [Lib: skills.ts](Lib_skills.md)
""",

    "API_profile.md": """# API: `GET /api/profile`

#api #content #profile #resume

> **Core Developer Resume Profile, Biography & Quotation Terms API.**

- **Path:** `src/app/api/profile/route.ts`
- **Data Source:** Supabase `profile` table with fallback to `resume.json`.

---

## 🔗 Related Architecture & Cross-References
- [Lib: data.ts](Lib_data.md)
- [Tool: Synchronizer](Tool_Synchronizer.md)
""",

    "API_revalidate.md": """# API: `POST /api/revalidate`

#api #cache #isr #security

> **Secret-Gated Next.js On-Demand Cache Purge & Revalidation Endpoint.**

- **Path:** `src/app/api/revalidate/route.ts`
- **Authentication:** `secret=SYNC_API_KEY`
- **Tags Revalidated:** `portfolio-data`, `projects`, `skills`, `certificates`, `profile`, `blog`

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Tool: Synchronizer](Tool_Synchronizer.md)
""",

    # -------------------------------------------------------------
    # 3. CORE DOMAIN LIBRARIES & IDENTITY PROVIDERS (10 Nodes)
    # -------------------------------------------------------------
    "Lib_pricing.md": """# Lib: `pricing.ts` (Commercial Pricing SSoT)

#lib #domain #pricing #cpq #ecommerce

> **Single Source of Truth for Client Estimations, Math Formulas & Dependency Trees.**

- **Path:** `src/lib/pricing.ts`
- **Core Functions:**
  - `calcQuote(engineId, featureIds, brandTier, careTier, currency)`
  - `resolveFeatureDependencies(featureIds, allFeatures)`: Recursive topological resolution of prerequisite modules.
  - `resolveDefaultCurrency(regionCookie)`: Geo-IP currency resolver (`INR` vs `USD`).
  - `formatMoney(amount, currency)`: Locale-aware price formatting.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Route: /scoping](Route_scoping.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
""",

    "Lib_commission.md": """# Lib: `commission.ts` (Sales Partner Commission SSoT)

#lib #domain #commission #middleman #legal

> **Single Source of Truth for Middleman Sales Partner Commission Calculations.**

- **Path:** `src/lib/commission.ts` & `src/data/commissionConfig.json`
- **Tiers:** Band A (10% on < ₹1.5L / $2k), Band B (12.5% on ₹1.5L–₹3L / $2k–$4k), Band C (15% on > ₹3L / $4k), Recurring Retainer (10%).

---

## 🔗 Related Architecture & Cross-References
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
- [UI: MiddlemanAgreement](UI_MiddlemanAgreement.md)
- [REVENUE_EXECUTION_PLAN](../REVENUE_EXECUTION_PLAN.md)
""",

    "Lib_sessionVerify.md": """# Lib: `sessionVerify.ts` (Universal PKCE Session Guard)

#lib #security #auth #pkce #session

> **Server-Side Session Verification extracting verified identities from JWTs.**

- **Path:** `src/lib/sessionVerify.ts`
- **Security Invariant:** Client email and tenant UUID are derived strictly from cryptographically verified Supabase tokens—NEVER from user request query parameters.
- **Support:** Handles both `Authorization: Bearer <token>` headers and `prateeq_active_user` HTTP-only cookies.

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [API: client/save-scope](API_client_save_scope.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [Schema: client_scopes](Schema_client_scopes.md)
""",

    "Lib_rag_client.md": """# Lib: `rag-client.ts` (Retriever Backend Bridge)

#lib #rag #api #stream #retriever

> **TypeScript Client SDK communicating with FastAPI Cognitive Backend (`rag.prateeq.in`).**

- **Path:** `src/lib/rag-client.ts`
- **Methods:**
  - `streamChat(message, tenantId, options)`: Server-Sent Events (SSE) streaming chat.
  - `searchDocuments(query, tenantId, filters)`: Hybrid dense+sparse search.
  - `submitFeedback(messageId, score)`: 👍/👎 telemetry collection.
  - `getDownloadUrl(documentId)`: Presigned S3 citation downloads.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
""",

    "Lib_data.md": """# Lib: `data.ts` (Cached Supabase Fetch Layer)

#lib #database #cache #server-only

> **Server-Only Content Fetching Layer with Aggressive Next.js `unstable_cache`.**

- **Path:** `src/lib/data.ts`
- **Tags:** `portfolio-data`, `projects`, `skills`, `certificates`, `profile`.
- **Fallbacks:** Seamlessly falls back to local JSON files (`src/data/*.json`) if database is unreachable.

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Route: /](Route_home.md)
- [Schema: projects](Schema_projects.md)
- [Schema: skills](Schema_skills.md)
""",

    "Lib_markdown.md": """# Lib: `markdown.ts` (Blog Parser & Metadata Extractor)

#lib #markdown #blog #content

> **Server-Side Markdown Parser with Frontmatter & Reading Time Calculator.**

- **Path:** `src/lib/markdown.ts`
- **Function:** Reads local markdown files from `src/content/posts/` and merges with Supabase database entries.

---

## 🔗 Related Architecture & Cross-References
- [Route: /blog](Route_blog.md)
- [Schema: blog_posts](Schema_blog_posts.md)
""",

    "Lib_skills.md": """# Lib: `skills.ts` (Persona Filter & Narrative Mapper)

#lib #skills #persona #identity

> **Audience-Aware Skill Filtering (`Developer` vs `Business`).**

- **Path:** `src/lib/skills.ts`
- **Functions:** `getSkillsHighlight(skills, persona)` maps technical tools to quantifiable business ROI.

---

## 🔗 Related Architecture & Cross-References
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [Route: /](Route_home.md)
- [Schema: skills](Schema_skills.md)
""",

    "Context_ThemeProvider_Lenis.md": """# Context: `ThemeProvider.tsx` & `LenisProvider.tsx`

#context #provider #theme #scroll #lenis

> **Global Client Providers for Dual-Theme Hydration & Lenis Smooth Scrolling.**

- **Paths:** `src/context/ThemeContext.tsx` & `src/context/LenisContext.tsx`
- **Contracts:**
  - Server-first cookie parsing in `RootLayout` eliminates layout shifts (CLS-free).
  - Visual Theme (`Azure` vs `Noir`) and Communication Identity (`Dev` vs `Business`) are strictly independent.
  - Lenis scroll container isolates interactive sub-windows via `data-lenis-prevent`.

---

## 🔗 Related Architecture & Cross-References
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [Route: /](Route_home.md)
- [Route: /rag/app](Route_rag_app.md)
""",

    "Context_AuthContext.md": """# Context: `AuthContext.tsx` (Universal Supabase Auth)

#context #auth #pkce #session #security

> **Universal Client Auth State, Dual-Storage Persistence & Hash Token Parser.**

- **Path:** `src/context/AuthContext.tsx` & `src/lib/auth.ts`
- **Features:**
  - Syncs Supabase session with both `localStorage` and `prateeq_active_user` cookie
  - Directly extracts and persists access tokens on OAuth redirects
  - Provides `user`, `session`, `loginWithGoogle`, and `logout` hooks to all client routes

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Route: /dashboard](Route_dashboard.md)
- [Route: /auth/callback](Route_auth_callback.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
""",

    "UI_CommercialPDFSuite.md": """# UI: `pdfTheme.ts`, `pdfFonts.ts` & React-PDF Exporters

#ui #pdf #theme #typography #commercial

> **Client & Server Commercial PDF Export Infrastructure with Azure/Noir Tokens.**

- **Paths:** `src/components/pdf/pdfTheme.ts`, `pdfFonts.ts`, `ScopingBriefPDF.tsx`, `MiddlemanAgreementPDF.tsx`
- **Features:**
  - Pinned page counts enforced by automated smoke tests
  - Playfair Display, Lora, and JetBrains Mono typography tokens
  - `getPdfTheme(isNoir)` dynamically toggles light/dark document styling

---

## 🔗 Related Architecture & Cross-References
- [99_DECISIONS (ADR 11 & 12)](../99_DECISIONS.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: MiddlemanAgreement](UI_MiddlemanAgreement.md)
""",

    # -------------------------------------------------------------
    # 4. UI SYSTEMS & INTERACTIVE COMPONENTS (10 Nodes)
    # -------------------------------------------------------------
    "UI_NoirSkyline.md": """# UI: `NoirSkyline.tsx` (6-Layer Parallax Backdrop)

#ui #effects #graphics #svg #parallax

> **Fixed 6-Layer Deterministic Hand-Drawn Skyline with Decoupled Mobile Parallax.**

- **Path:** `src/components/effects/NoirSkyline.tsx` & `wobblyPaths.generated.ts`
- **Performance Contracts:**
  - `isMobile` (width ≤ 768px or coarse pointer) and `reducedMotion` (OS preference or < 4 cores) are tracked separately.
  - Mobile preserves scroll parallax while switching `preserveAspectRatio` to `xMidYMax meet` with seamless sky extension (`var(--skyline-sky-bg)`).
  - Prebaked SVG wobble paths prevent runtime main-thread polygon displacement.

---

## 🔗 Related Architecture & Cross-References
- [99_DECISIONS (ADR 10)](../99_DECISIONS.md)
- [Route: /](Route_home.md)
- [05_User_Experience_and_Interaction_Design](../05_User_Experience_and_Interaction_Design.md)
""",

    "UI_ScopingLab.md": """# UI: `ScopingLab.tsx` / `IntakeForm.tsx`

#ui #frontend #discovery #scoping

> **Interactive Discovery Wizard & Instant Estimation Engine.**

- **Path:** `src/components/Intake/IntakeForm.tsx` & `src/app/scoping/page.tsx`
- **Features:** Multimodal prompt input, RFP dropzone, base engine selector, live currency switcher (`INR` / `USD`).

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
""",

    "UI_ArchitectureCartDrawer.md": """# UI: `ArchitectureCartDrawer.tsx`

#ui #frontend #cpq #cart #ecommerce

> **Productized E-Commerce Drawer with Real-Time CPQ Pricing & Topology Map.**

- **Features:**
  - Sticky bottom action bar (`⚡ Instant Estimate: ₹3,75,000 / $4,500`)
  - Transitive feature dependency enforcement (`resolveFeatureDependencies`)
  - Compulsory vs optional module toggles
  - Embedded `TopologyMap.tsx` live SVG circuit
  - Dynamic promo code re-computation

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
- [Schema: client_scopes](Schema_client_scopes.md)
""",

    "UI_TopologyMap.md": """# UI: `TopologyMap.tsx`

#ui #frontend #graph #visualization

> **Dynamic Architecture SVG Circuit Blueprint displaying selected system architecture.**

---

## 🔗 Related Architecture & Cross-References
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [Engine: GraphRAG Topology](Engine_GraphRAG_Topology.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
""",

    "UI_PreDepositBridge.md": """# UI: `PreDepositBridge.tsx` & `DigitalSOWPreview.tsx`

#ui #frontend #auth #pkce #sow

> **Pre-Deposit Client Workspace Provisioning & Digital SOW Modal.**

---

## 🔗 Related Architecture & Cross-References
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
""",

    "UI_ClientWorkspaceDashboard.md": """# UI: `ClientWorkspaceDashboard.tsx`

#ui #frontend #dashboard #client #workspace

> **Client Command Center (`prateeq.in/dashboard`).**

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [API: client/save-scope](API_client_save_scope.md)
""",

    "UI_AdminPortal.md": """# UI: `AdminPortal.tsx` (Autonomous Outreach Cockpit)

#ui #admin #outreach #crm

> **Master Operator Control Center for Lead Verification & Email Campaigns.**

- **Path:** `src/app/admin/page.tsx` & `src/components/admin/`
- **Features:** Table of prospective leads, qualification score threshold sliders, one-click email dispatch.

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [Route: /admin](Route_admin.md)
- [API: outreach/dispatch](API_outreach_dispatch.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
""",

    "UI_Terminal.md": """# UI: `Terminal.tsx` (Interactive CLI Engine)

#ui #terminal #cli #diagnostics

> **Interactive Diagnostics Terminal with Command Autocompletion & CRT Shader.**

- **Path:** `src/components/terminal/Terminal.tsx`
- **Commands:** `help`, `git-info`, `qrcode`, `skills`, `projects`, `theme`, `snake`, `clear`

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [API: terminal/qrcode](API_terminal_qrcode.md)
- [API: terminal/snake-leaderboard](API_terminal_snake_leaderboard.md)
""",

    "UI_RAGLabPlayground.md": """# UI: `RAGLabPlayground.tsx` (Retriever SaaS Studio Views)

#ui #rag #playground #studio

> **Interactive Client Chat Studio, Document Library & Search Inspector Panels.**

- **Path:** `src/components/rag/` (`ChatPanel.tsx`, `UploadPanel.tsx`, `SearchPanel.tsx`, `ConfigPanel.tsx`)

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
- [Lib: rag-client.ts](Lib_rag_client.md)
""",

    "UI_AnalyticsDashboard.md": """# UI: `AnalyticsDashboard.tsx`

#ui #frontend #analytics #telemetry

> **Interactive Visitor Geolocation & Path Metric Telemetry Cockpit.**

- **Path:** `src/app/analytics/page.tsx` & `src/components/analytics/`
- **Features:** Real-time visitor counts, country distribution charts, hourly traffic graphs, and bot vs human filters.

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [Route: /analytics](Route_analytics.md)
- [API: analytics-summary](API_analytics_summary.md)
- [Schema: page_visits](Schema_page_visits.md)
""",

    "UI_BlogEngine.md": """# UI: `BlogEngine.tsx` / `BlogPost.tsx`

#ui #frontend #blog #markdown

> **Interactive Markdown Article Layout with Code Highlighting & Deep Links.**

- **Path:** `src/app/blog/` & `src/components/blog/`
- **Features:** Syntax highlighted code blocks, responsive typography, estimated reading time badge, and project case study deep linking.

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/11_Blog](../09_Section_Specifications/11_Blog.md)
- [Route: /blog](Route_blog.md)
- [Lib: markdown.ts](Lib_markdown.md)
- [Schema: blog_posts](Schema_blog_posts.md)
""",

    "Tool_Synchronizer.md": """# Tool: `synchronizer.py` (Local Streamlit Content CMS)

#tool #cms #streamlit #content #admin

> **Local Multi-Tab Content Management Dashboard with Gemini AI Assistance.**

- **Path:** `scripts/synchronizer.py` & `scripts/sync_tabs/`
- **Tabs:** Resume, Projects, Certificates, Skills, Photos, Blog Editor, Scoping Questionnaire, Partner Agreement, Analytics.

---

## 🔗 Related Architecture & Cross-References
- [11_Content_Management_System](../11_Content_Management_System.md)
- [API: revalidate](API_revalidate.md)
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
""",

    "UI_EdgeSwarmPanel.md": """# UI: `EdgePanel.tsx` (Sovereign Edge Swarm Studio)

#ui #edge #crdt #swarm #retriever #m98 #m101

> **Edge Device Swarm Observability, SQLite Snapshots & Enclave Attestation Status.**

- **Path:** `retriever/apps/web/src/app/edge/page.tsx` & `src/components/rag/EdgePanel.tsx`
- **Features:**
  - Real-time display of registered edge peer devices and health status
  - 1-click SQLite replica snapshot distribution and delta sync metrics
  - Hardware KMS remote attestation status and emergency memory sanitization trigger

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/edge](Retriever_API_v1_edge.md)
- [Retriever_API: v1/enclave](Retriever_API_v1_enclave.md)
- [Engine: Sovereign Edge Sync](Engine_Sovereign_Edge_Sync.md)
- [Engine: Confidential Micro-Enclave](Engine_Confidential_Micro_Enclave.md)
""",

    "UI_CapabilityStudioPanel.md": """# UI: `ScaffoldPanel.tsx` (Capability Studio & Metaprogrammer)

#ui #scaffold #metaprogramming #ast #retriever #m97

> **Autonomous AST Capability Scaffolding Studio & Hot-Reload Playground.**

- **Path:** `retriever/apps/web/src/app/scaffold/page.tsx` & `src/components/rag/ScaffoldPanel.tsx`
- **Features:**
  - Natural language specification input for new cognitive capabilities
  - AST preview of synthesized FastAPI routers, domain abstractions, and Pytest suites
  - Non-destructive dry-run syntax verification and 1-click hot-reloaded disk application

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/scaffold](Retriever_API_v1_scaffold.md)
- [Engine: Autonomous Metaprogrammer](Engine_Autonomous_Metaprogrammer.md)
""",

    # -------------------------------------------------------------
    # 5. DATABASE SCHEMAS (12 Nodes)
    # -------------------------------------------------------------
    "Schema_client_scopes.md": """# Schema: `client_scopes`

#db #persistence #scoping #phase_g

> **Primary Storage Entity for Scoping Wizard Drafts, Confirmed Packages & SOW Configurations.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS client_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_email TEXT NOT NULL,
    engine_id TEXT NOT NULL,                -- 'landing' | 'multipage' | 'saas'
    selected_features JSONB NOT NULL,       -- Array of feature module IDs with parameters
    brand_tier TEXT,                        -- 'none' | 'starter' | 'complete' | 'system'
    care_tier TEXT,                         -- 'self' | 'managed' | 'enterprise'
    status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'deposit_paid' | 'active' | 'completed'
    total_price_inr NUMERIC(12, 2) NOT NULL,
    total_price_usd NUMERIC(12, 2) NOT NULL,
    sow_hash TEXT,                          -- SHA-256 hash of immutable agreed scope
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [API: client/save-scope](API_client_save_scope.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
""",

    "Schema_client_change_orders.md": """# Schema: `client_change_orders`

#db #persistence #commerce #change_orders #phase_2

> **Scope Amendment & Phase 2 Feature Ledger for Active Client Engagements.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS client_change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_code TEXT REFERENCES client_scopes(scope_code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_inr NUMERIC(12,2) NOT NULL,
    price_usd NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'approved', 'declined', 'invoiced', 'paid')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 🔗 Related Architecture & Cross-References
- [27_Client_Workspace_and_Escrow_Ledger_PRD](../27_Client_Workspace_and_Escrow_Ledger_PRD.md)
- [API: client/change-orders](API_client_change_orders.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
""",

    "Schema_invoices.md": """# Schema: `invoices`

#db #payments #razorpay #financial

> **Financial Transaction Ledger for Escrow Milestone Payments & Retainers.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID REFERENCES client_scopes(id),
    client_email TEXT NOT NULL,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    amount_paid NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',   -- 'INR' | 'USD'
    payment_status TEXT NOT NULL,           -- 'created' | 'paid' | 'failed'
    milestone_type TEXT NOT NULL,          -- 'deposit_50' | 'final_50' | 'change_order' | 'retainer'
    pdf_receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [API: client/verify-razorpay-payment](API_client_verify_razorpay_payment.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
""",

    "Schema_promo_codes.md": """# Schema: `promo_codes`

#db #ecommerce #cpq #marketing

> **Dynamic Discount & Campaign Allocation Engine.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    max_uses INT DEFAULT 10,
    times_used INT DEFAULT 0,
    valid_until TIMESTAMPTZ,
    applicable_engines TEXT[] DEFAULT '{"landing","multipage","saas"}',
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
""",

    "Schema_page_visits.md": """# Schema: `page_visits` (Visitor Telemetry)

#db #analytics #telemetry #privacy

> **GDPR-Compliant Daily Hashed Telemetry Ledger.**

- **Path:** `supabase_schema.sql` & `src/proxy.ts`
- **Fields:** `ip_hash`, `country_code`, `path`, `user_agent_type`, `visited_at`
- **Pruning:** Automated probabilistic 90-day retention trigger.
- **Fast-Path:** `get_analytics_summary(cutoff_time)` custom SQL RPC function.

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [API: analytics-summary](API_analytics_summary.md)
- [Route: /analytics](Route_analytics.md)
""",

    "Schema_projects.md": """# Schema: `projects` (Portfolio Work)

#db #content #projects

> **Dual-Audience Project Case Studies (Developer & Business narratives).**

- **Fields:** `slug`, `title`, `tagline`, `description_dev`, `description_biz`, `tech_stack`, `metrics`, `github_url`, `live_url`, `is_featured`

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Lib: data.ts](Lib_data.md)
- [API: projects](API_projects.md)
""",

    "Schema_skills.md": """# Schema: `skills` & `certificates`

#db #content #skills #certs

> **Categorized Competencies, Business Outcomes & Verified Certifications.**

- **Fields:** `name`, `category`, `proficiency`, `business_narrative`, `years_experience`, `highlight_order`

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Lib: data.ts](Lib_data.md)
- [API: skills](API_skills.md)
""",

    "Schema_blog_posts.md": """# Schema: `blog_posts` (Technical Articles)

#db #blog #content #seo

> **SEO-Indexed Technical Case Studies & Markdown Article Persistence.**

- **Fields:** `slug`, `title`, `excerpt`, `content`, `tags`, `read_time`, `is_published`, `published_at`

---

## 🔗 Related Architecture & Cross-References
- [Route: /blog](Route_blog.md)
- [API: blog/publish](API_blog_publish.md)
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)
""",

    "Schema_outreach_leads.md": """# Schema: `outreach_leads` (Autonomous CRM)

#db #outreach #crm #leads

> **Autonomous AI Prospect Ingestion, ICP Scores & Outreach Status Ledger.**

- **Fields:** `prospect_name`, `company`, `email`, `linkedin_url`, `icp_score`, `custom_pitch`, `status`, `sent_at`

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [API: outreach/dispatch](API_outreach_dispatch.md)
""",

    "Schema_rag_tenants.md": """# Schema: `rag_tenants` (Multi-Tenant Workspaces)

#db #rag #multitenancy #retriever

> **Workspace Isolation, Dynamic Dimension Partitioning & Quota Allocation.**

- **Fields:** `tenant_id`, `name`, `plan`, `monthly_token_quota`, `embedding_model`, `created_at`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [API: rag/tenant](API_rag_tenant.md)
""",

    "Schema_pgvector_store.md": """# Schema: `pgvector_embeddings` (HNSW Vector Index)

#db #vector #hnsw #pgvector #retriever

> **High-Performance Dense Embedding Storage partitioned by tenant.**

- **Path:** `apps/api/alembic/` in `retriever`
- **Indexes:** Cosine distance `vector_cosine_ops` with HNSW `m=16, ef_construction=64`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Retriever_API: v1/search](Retriever_API_v1_search.md)
""",

    "Schema_retriever_inference_logs.md": """# Schema: `inference_logs` & `chat_feedback`

#db #retriever #logs #telemetry #feedback

> **Token Consumption, Cost USD, Latency & User Feedback Metrics.**

- **Fields:** `tenant_id`, `prompt_tokens`, `completion_tokens`, `cost_usd`, `latency_ms`, `feedback_score`

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [API: rag/telemetry](API_rag_telemetry.md)
""",

    # -------------------------------------------------------------
    # 6. RETRIEVER FASTAPI ROUTERS (11 Nodes)
    # -------------------------------------------------------------
    "Retriever_API_v1_chat.md": """# Retriever API: `POST /v1/chat`

#retriever #api #rag #fastapi #stream

> **FastAPI Streaming RAG Endpoint with SSE, Citations & Semantic Caching.**

- **Path:** `apps/api/src/routers/chat.py`
- **Features:**
  - Token-by-token Server-Sent Events (SSE) streaming
  - Citation injection with bounding boxes & page offsets
  - Redis Semantic Caching (`PgSemanticCacheAdapter`)
  - Llama Guard 3 injection filter

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
- [Lib: rag-client.ts](Lib_rag_client.md)
""",

    "Retriever_API_v1_search.md": """# Retriever API: `POST /v1/search`

#retriever #api #search #hybrid #fastapi

> **High-Performance Hybrid Dense + Sparse Search Gateway.**

- **Path:** `apps/api/src/routers/search.py`
- **Features:** Dense HNSW pgvector + Sparse SPLADE / BM25 with Reciprocal Rank Fusion (RRF).

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Schema: pgvector_embeddings](Schema_pgvector_store.md)
""",

    "Retriever_API_v1_documents.md": """# Retriever API: `POST /v1/documents`

#retriever #api #ingestion #storage

> **Multi-Format Document Upload, Background Chunking & Presigned S3 Storage.**

- **Path:** `apps/api/src/routers/document.py`
- **Processing:** Celery async worker queue for AST token chunking & vector embedding.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Engine: Celery RabbitMQ](Engine_Celery_RabbitMQ.md)
""",

    "Retriever_API_v1_admin.md": """# Retriever API: `apps/api/src/routers/admin.py`

#retriever #api #admin #quotas

> **Platform Administration, System Health, Prompt Presets & Key Management.**

- **Endpoints:** `/v1/admin/tenants`, `/v1/admin/keys`, `/v1/admin/prompts`, `/v1/admin/quotas`

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Admin Dashboard Roadmap](../../../retriever/docs/ADMIN_DASHBOARD_ROADMAP.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
""",

    "Retriever_API_v1_auth.md": """# Retriever API: `apps/api/src/routers/auth.py`

#retriever #api #auth #jwt

> **Tenant API Key Authentication & Cryptographic Verification.**

- **Endpoints:** `/v1/auth/token`, `/v1/auth/verify`
- **Security:** SHA-256 key hashing with dynamic rate limiting per tier.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
""",

    "Retriever_API_v1_tenant.md": """# Retriever API: `apps/api/src/routers/tenant.py`

#retriever #api #tenant #saas

> **Tenant Lifecycle Management & Storage Quota Allocation.**

- **Endpoints:** `/v1/tenants`, `/v1/tenants/{id}/settings`

---

## 🔗 Related Architecture & Cross-References
- [Schema: rag_tenants](Schema_rag_tenants.md)
""",

    "Retriever_API_v1_payments.md": """# Retriever API: `apps/api/src/routers/payments.py`

#retriever #api #payments #subscriptions

> **SaaS Plan Subscriptions & Webhook Synchronization.**

- **Endpoints:** `/v1/payments/plans`, `/v1/payments/webhook`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
""",

    "Retriever_API_v1_pricing.md": """# Retriever API: `apps/api/src/routers/pricing.py`

#retriever #api #pricing #saas

> **Multi-Currency SaaS Tier Pricing Engine & Plan Catalog.**

- **Endpoints:** `/v1/pricing`, `/v1/pricing` (Admin)

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Lib: pricing](Lib_pricing.md)
""",

    "Retriever_API_v1_agentic.md": """# Retriever API: `apps/api/src/routers/agentic.py`

#retriever #api #agentic #react #reasoning

> **Agentic ReAct Reasoning Loops, Tool Calling & Multi-Step Planning.**

- **Endpoints:** `/v1/agentic/reason`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Engine: RLM Python REPL Sandbox](Engine_RLM_Python_REPL.md)
- [Engine: MultiAgent Consensus](Engine_MultiAgent_Consensus.md)
""",

    "Retriever_API_v1_workflow.md": """# Retriever API: `apps/api/src/routers/workflow.py`

#retriever #api #agentic #workflow

> **Multi-Step Agentic Graph Execution & Stateful Planning.**

- **Endpoints:** `/v1/workflow/execute`, `/v1/workflow/status`

---

## 🔗 Related Architecture & Cross-References
- [Engine: MultiAgent Consensus](Engine_MultiAgent_Consensus.md)
""",

    "Retriever_API_v1_consensus.md": """# Retriever API: `apps/api/src/routers/consensus.py`

#retriever #api #consensus #reflection

> **Generator-Critic Multi-Agent Reflection & Verification Gateway (Milestone 48).**

---

## 🔗 Related Architecture & Cross-References
- [Engine: MultiAgent Consensus](Engine_MultiAgent_Consensus.md)
""",

    "Retriever_API_v1_rlm.md": """# Retriever API: `apps/api/src/routers/rlm.py`

#retriever #api #rlm #repl

> **Recursive Language Model & Python REPL Sandbox Execution Router (Milestone 47).**

---

## 🔗 Related Architecture & Cross-References
- [Engine: RLM Python REPL Sandbox](Engine_RLM_Python_REPL.md)
""",

    "Retriever_API_v1_health.md": """# Retriever API: `apps/api/src/routers/health.py`

#retriever #api #health #monitoring

> **Liveness, Readiness & Dependency Health Check Endpoint.**

- **Checks:** PostgreSQL, pgvector extension, Redis cache, RabbitMQ broker.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
""",

    "Retriever_API_v1_security_compression.md": """# Retriever API: `apps/api/src/routers/security_compression.py`

#retriever #api #security #compression #encryption #m49

> **Context Window Token Compression & Zero-Trust Field Envelope Encryption Router (Milestone 49).**

- **Endpoints:**
  - `POST /v1/tenants/{tenantId}/context/compress` — LongLLMLingua prompt token compression
  - `POST /v1/tenants/{tenantId}/security/encrypt` — AES-256-GCM field encryption
  - `POST /v1/tenants/{tenantId}/security/decrypt` — AES-256-GCM field decryption

---

## 🔗 Related Architecture & Cross-References
- [Engine: LongLLMLingua Compression](Engine_LongLLMLingua_Compression.md)
- [Engine: Envelope Encryption](Engine_Envelope_Encryption.md)
""",

    "Retriever_API_v1_edge.md": """# Retriever API: `apps/api/src/routers/edge.py`

#retriever #api #edge #crdt #sqlite #m98

> **Sovereign Edge Vector Sync & CRDT SQLite Swarm Router (Milestone 98).**

- **Endpoints:**
  - `POST /v1/edge/peers/register` — Register edge peer device
  - `GET /v1/edge/tenants/{tenantId}/snapshot` — Download SQLite replica snapshot
  - `POST /v1/edge/tenants/{tenantId}/delta` — Push / pull CRDT change vectors
  - `GET /v1/edge/tenants/{tenantId}/status` — Peer sync health & vector clock status

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API edge.md](../../../retriever/docs/api/edge.md)
- [Engine: Sovereign Edge Sync](Engine_Sovereign_Edge_Sync.md)
- [UI: EdgeSwarmPanel](UI_EdgeSwarmPanel.md)
""",

    "Retriever_API_v1_multicloud.md": """# Retriever API: `apps/api/src/routers/multicloud.py`

#retriever #api #multicloud #libsql #failover #m99

> **Multi-Cloud Failover & Distributed LibSQL Active-Active Replication Router (Milestone 99).**

- **Endpoints:**
  - `GET /v1/admin/multicloud/status` — Cluster replication health & primary region
  - `POST /v1/admin/multicloud/failover` — Trigger manual or automated Raft failover
  - `POST /v1/admin/multicloud/probe` — Latency ping probe across cloud regions

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API multicloud.md](../../../retriever/docs/api/multicloud.md)
- [Engine: MultiCloud Replication](Engine_MultiCloud_Replication.md)
""",

    "Retriever_API_v1_voice.md": """# Retriever API: `apps/api/src/routers/voice.py`

#retriever #api #voice #webrtc #whisper #cartesia #m100

> **Sovereign Edge Voice Streaming & Whisper WebRTC Router (Milestone 100).**

- **Endpoints:**
  - `POST /v1/voice/session` — WebRTC session negotiation & SDP exchange
  - `POST /v1/voice/transcribe` — Whisper edge audio transcription
  - `POST /v1/voice/synthesize` — Cartesia neural low-latency TTS stream

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API voice.md](../../../retriever/docs/api/voice.md)
- [Engine: Sovereign Edge Voice](Engine_Sovereign_Edge_Voice.md)
""",

    "Retriever_API_v1_enclave.md": """# Retriever API: `apps/api/src/routers/enclave.py`

#retriever #api #enclave #kms #attestation #confidential #m101

> **Micro-Enclave KMS & Remote Attestation Router (Milestone 101).**

- **Endpoints:**
  - `GET /v1/admin/edge/attestation/nonce` — Issue anti-replay attestation challenge
  - `POST /v1/admin/edge/attestation/verify` — Validate PCR0 hardware evidence & signature
  - `POST /v1/tenants/{tenantId}/edge/seal` — AES-256-GCM memory sealing with HKDF key derivation
  - `POST /v1/tenants/{tenantId}/edge/unseal` — Authenticated payload decryption
  - `POST /v1/admin/edge/enclave/wipe` — Zero-knowledge volatile memory wipe

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API enclave.md](../../../retriever/docs/api/enclave.md)
- [Engine: Confidential Micro-Enclave](Engine_Confidential_Micro_Enclave.md)
""",

    "Retriever_API_v1_scaffold.md": """# Retriever API: `apps/api/src/routers/scaffold.py`

#retriever #api #scaffold #metaprogramming #ast #m97

> **Autonomous Metaprogrammer & Capability Studio Router (Milestone 97).**

- **Endpoints:**
  - `POST /v1/scaffold/generate` — Synthesize AST router, adapter, and test files
  - `POST /v1/scaffold/validate` — AST syntax & forbidden import validation
  - `POST /v1/scaffold/apply` — Atomic disk write & hot-reload injection

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API scaffold.md](../../../retriever/docs/api/scaffold.md)
- [Engine: Autonomous Metaprogrammer](Engine_Autonomous_Metaprogrammer.md)
- [UI: CapabilityStudioPanel](UI_CapabilityStudioPanel.md)
""",

    "Retriever_API_v1_serverless_gpu.md": """# Retriever API: `apps/api/src/routers/serverless_gpu.py`

#retriever #api #serverless #gpu #vllm #lora #m96

> **Serverless Dedicated GPU & Dynamic Multi-LoRA Serving Router (Milestone 96).**

- **Endpoints:**
  - `GET /v1/admin/serverless/status` — Cluster scale, active containers, GPU memory
  - `POST /v1/admin/serverless/probe` — Measure cold-start vs warm-boot TTFT latencies
  - `POST /v1/tenants/{tenantId}/lora-adapters` — Register dynamic low-rank weights

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API serverless_gpu.md](../../../retriever/docs/api/serverless_gpu.md)
- [Engine: Serverless GPU vLLM Serving](Engine_Serverless_GPU_vLLM_Serving.md)
""",

    # -------------------------------------------------------------
    # 7. RETRIEVER COGNITIVE ENGINES & AGENTIC SYSTEMS (10 Nodes)
    # -------------------------------------------------------------
    "Engine_RLM_Python_REPL.md": """# Engine: RLM Python REPL Sandbox (Milestone 47)

#engine #repl #sandbox #math #retriever #m47

> **Deterministic Python AST Execution Sandbox for Mathematical CPQ Calculations.**

- **Implementation:** `RestrictedPythonSandboxAdapter` in `apps/api/src/adapters/sandbox/python_sandbox_adapter.py`
- **Security:** Strict AST NodeVisitor blocking prohibited imports, private attributes, and infinite loops.
- **Role:** Verifies pricing tier combinations, transitive dependency formulas, and milestone splits with 0 hallucination.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
""",

    "Engine_GraphRAG_Topology.md": """# Engine: GraphRAG Knowledge Graph & Dynamic Topology

#engine #graph #graphrag #retriever #m46

> **Entity-Relation Extraction & Dynamic Architecture Graph Generation.**

- **Implementation:** `PgGraphRepository` & Neo4j Cypher Adapters in `apps/api/src/adapters/graph/`
- **Role:** Maps high-level functional features into concrete architectural nodes (Postgres, Redis, Celery, Vector Store, CDN) for the live `TopologyMap.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
""",

    "Engine_Docling_Layout_OCR.md": """# Engine: Docling Layout OCR & Multimodal Ingestion (Milestone 42)

#engine #ocr #multimodal #pdf #retriever #m42

> **High-Fidelity Document Layout Parsing & Visual Element Extraction.**

- **Role:** Parses uploaded RFP PDFs, invoices, and wireframes into structured markdown AST tokens.

---

## 🔗 Related Architecture & Cross-References
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
""",

    "Engine_LlamaGuard_Guardrails.md": """# Engine: Llama Guard 3 Prompt Injection Filter (Milestone 40)

#engine #guardrails #security #retriever #m40

> **Zero-Trust Input & Output Content Moderation and Prompt Injection Defense.**

- **Role:** Filters harmful intent, jailbreak attempts, and PII leaks before reaching cognitive LLMs.

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Retriever: Constitution](../../../retriever/docs/constitution/master-vision.md)
""",

    "Engine_LongLLMLingua_Compression.md": """# Engine: LongLLMLingua Context Compression (Milestone 49)

#engine #compression #tokens #retriever #m49

> **Dynamic Context Compression saving up to 60% Token Costs while preserving RAG recall.**

- **Role:** Compresses massive multi-document prompt contexts before invoking generation models.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
""",

    "Engine_MultiAgent_Consensus.md": """# Engine: Multi-Agent Consensus & Reflection Loops (Milestone 48)

#engine #agentic #reflection #consensus #m48

> **Generator-Critic Self-Correction Loop for RAG Groundedness & Faithfulness.**

- **Mechanism:** Answers undergo automated evaluation for hallucination and attribution before streaming to the client.

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/consensus](Retriever_API_v1_consensus.md)
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
""",

    # -------------------------------------------------------------
    # 8. ASYNC INFRASTRUCTURE & SECURITY ENVELOPES (4 Nodes)
    # -------------------------------------------------------------
    "Engine_Digital_SOW_Escrow_Freeze.md": """# Engine: Digital SOW & 50% Escrow Freeze

#engine #escrow #sow #legal #security #phase_g

> **Cryptographic SOW Immutability Locking on Deposit Capture.**

- **Mechanism:** When a client pays the 50% deposit via Razorpay, the backend calculates an SHA-256 hash of the exact JSON configuration snapshot (`engine`, `features`, `brand`, `care`, `pricing`, `timestamp`).
- **Immutability:** Locks the agreed scope to prevent scope creep while allowing flexible Phase 2 Change Orders.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [API: client/verify-razorpay-payment](API_client_verify_razorpay_payment.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
""",

    "Engine_Dogfooding_Tenant_prateeq_scoping.md": """# Engine: Dogfooding Tenant (`prateeq_scoping`)

#engine #tenant #dogfooding #retriever #phase_g

> **Public System Cognitive Tenant in Retriever hosting full portfolio knowledge.**

- **Tenant UUID:** `prateeq_scoping`
- **Knowledge Base:** All 37 PRDs, technical specs, past client project metrics, and architecture patterns.
- **Function:** Powers the real-time AI Scoping Lab, chat assistant, and RFP PDF parser on `prateeq.in`.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Schema: rag_tenants](Schema_rag_tenants.md)
""",

    "Engine_Envelope_Encryption.md": """# Engine: Zero-Trust Envelope Encryption (Milestone 50)

#engine #security #encryption #kms #m50

> **Per-Tenant Data-At-Rest Key Management & Envelope Cryptography.**

- **Mechanism:** Every tenant document chunk is encrypted using a unique DEK wrapped by master KMS.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
""",

    "Engine_Celery_RabbitMQ.md": """# Engine: Celery & RabbitMQ Distributed Async Queue

#engine #workers #rabbitmq #celery #async

> **Background Document Ingestion, Token Chunking & Vector Embedding Worker Pool.**

- **Broker:** RabbitMQ AMQP message broker
- **Worker Daemon:** Celery multiprocessing worker queue for asynchronous OCR & dense embedding.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Retriever_API: v1/documents](Retriever_API_v1_documents.md)
""",

    "Engine_Sovereign_Edge_Sync.md": """# Engine: Sovereign Edge Vector Sync & CRDT SQLite Swarm (Milestone 98)

#engine #edge #crdt #sqlite #swarm #m98

> **Peer-to-Peer Edge Vector Synchronization, SQLite Replica Snapshots & CRDT State Merging.**

- **Domain Core:** `apps/api/src/domain/abstractions/edge.py` (`EdgePeer`, `CrdtVectorClock`, `EdgeSnapshotDelta`)
- **Adapters:** `apps/api/src/adapters/edge/sqlite_sync_adapter.py`
- **Role:** Enables mobile, embedded, and remote edge runtimes to query local vector stores offline and synchronize deltas with the central pgvector primary upon reconnection.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API edge.md](../../../retriever/docs/api/edge.md)
- [Retriever_API: v1/edge](Retriever_API_v1_edge.md)
- [UI: EdgeSwarmPanel](UI_EdgeSwarmPanel.md)
- [99_DECISIONS (ADR 35)](../99_DECISIONS.md#adr-35-sovereign-edge-vector-synchronization-offline-first-sqlite-crdt-swarms)
""",

    "Engine_MultiCloud_Replication.md": """# Engine: Multi-Cloud Active-Active LibSQL Failover (Milestone 99)

#engine #multicloud #libsql #failover #disaster_recovery #m99

> **Zero-Downtime Distributed Database Replication & Autonomous Raft Leader Election.**

- **Domain Core:** `apps/api/src/domain/abstractions/multicloud.py` (`CloudRegion`, `LibsqlReplicaStatus`, `RaftClusterState`)
- **Adapters:** `apps/api/src/adapters/multicloud/libsql_failover_adapter.py`
- **Role:** Synchronizes transactions across Oracle Cloud VPS, Fly.io, and AWS edge nodes with automatic sub-5-second failover.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API multicloud.md](../../../retriever/docs/api/multicloud.md)
- [Retriever_API: v1/multicloud](Retriever_API_v1_multicloud.md)
- [99_DECISIONS (ADR 36)](../99_DECISIONS.md#adr-36-multi-cloud-distributed-libsql-active-active-replication-and-automated-failover)
""",

    "Engine_Sovereign_Edge_Voice.md": """# Engine: Sovereign Edge Voice Streaming & WebRTC (Milestone 100)

#engine #voice #webrtc #whisper #cartesia #vad #m100

> **Sub-300ms Real-Time Voice Assistant Pipeline with On-Device Whisper & Neural TTS.**

- **Domain Core:** `apps/api/src/domain/abstractions/voice.py` (`AudioStreamFrame`, `VoiceSessionConfig`, `VadState`)
- **Adapters:** `apps/api/src/adapters/voice/webrtc_stream_adapter.py`
- **Role:** Orchestrates WebRTC peer-to-peer audio channels, local Silero VAD, Whisper edge transcription, and streaming Cartesia voice synthesis.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API voice.md](../../../retriever/docs/api/voice.md)
- [Retriever_API: v1/voice](Retriever_API_v1_voice.md)
- [99_DECISIONS (ADR 37)](../99_DECISIONS.md#adr-37-sovereign-edge-voice-streaming-sub-300ms-webrtc-audio-pipelines)
""",

    "Engine_Autonomous_Metaprogrammer.md": """# Engine: Autonomous Metaprogrammer & Capability Studio (Milestone 97)

#engine #metaprogramming #ast #scaffold #retriever #m97

> **Deterministic Python AST Code Synthesis, Architectural Linter Validation & Capability Scaffolding.**

- **Domain Core:** `apps/api/src/domain/abstractions/scaffold.py` (`AstCapabilitySpec`, `ScaffoldGeneratedFile`, `AstValidationReport`)
- **Adapters:** `apps/api/src/adapters/scaffold/python_ast_generator.py`
- **Role:** Dynamically synthesizes clean hexagonal domain protocols, FastAPI routers, mock adapters, and Pytest suites from high-level capability specifications.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API scaffold.md](../../../retriever/docs/api/scaffold.md)
- [Retriever_API: v1/scaffold](Retriever_API_v1_scaffold.md)
- [UI: CapabilityStudioPanel](UI_CapabilityStudioPanel.md)
- [99_DECISIONS (ADR 34)](../99_DECISIONS.md#adr-34-autonomous-metaprogramming-and-self-scaffolding-capability-engine)
"""
}


def main():
    print(f"🚀 Generating Master Ultra architecture nodes ({len(NODES)} nodes)...")
    for filename, content in NODES.items():
        node_path = NODES_DIR / filename
        node_path.write_text(content.strip() + "\n", encoding="utf-8")
        print(f"✓ Created {filename}")
    print(f"\n✨ Generated {len(NODES)} full-spectrum architecture specification nodes!")

    # Auto-enrich with YAML frontmatter & IDE deep links
    import subprocess
    subprocess.run(["python3", str(DOCS_DIR.parent / "scripts" / "upgrade_architecture_nodes.py")], check=True)


if __name__ == "__main__":
    main()
