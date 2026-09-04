# PRD: Retriever RAG SaaS App Studio Revamp (`/rag/app`)

**Status:** ✅ Fully Implemented, Audited & Certified  
**Version:** 2.2 (Audited & Expanded Multi-Feature Suite)  
**Target Release:** Q3 2026  
**Platform:** Next.js 16 (App Router), React 19, TypeScript, Supabase Auth & RLS, Razorpay Subscriptions, FastAPI (`retriever` engine)

---

## 1. Executive Summary & Vision

The **Retriever RAG SaaS App Studio** (`/rag/app`) is being completely revamped from the ground up to transform it into an enterprise-grade, multi-tenant B2B AI knowledge management and evaluations studio.

While the existing landing page (`/rag`) serves as the product marketing engine, the new `/rag/app` will serve as a unified, high-performance workspace where businesses, developers, and teams can ingest documents, test multi-model RAG pipelines, inspect keyword/semantic vector search results, visualize GraphRAG entity triples, run automated Ragas quality benchmarks, fine-tune semantic caches, customize embeddable widgets with live previews, manage team permissions, and monitor token financial spend.

### Core Value Propositions
1. **Zero Hallucination Guarantee:** Built on hybrid HNSW vector + BM25 keyword search, Cohere reranking, and Self-Aware Corrective RAG (CRAG).
2. **GraphRAG & Knowledge Graphs:** Multi-hop entity traversal and triple extraction (`Subject ➔ Predicate ➔ Object`).
3. **Automated RAG Benchmarks:** Ragas & DeepEval scoring for Faithfulness, Relevancy, and Recall metrics.
4. **Instant 1-Line Deployment:** Embed fully custom AI chatbots on any website, Shopify store, or app with 1 line of script.
5. **Seamless Dual Account Identity:** One unified login via Google OAuth on `prateeq.in` gives users access to both their **Client Project Tracking** (`/dashboard`) and their **RAG SaaS Workspaces** (`/rag/app`).
6. **No-Risk 7-Day Trial:** Automatic 7-day trial of the Starter tier without upfront credit card requirements.

---

## 2. User Personas & Dual Account Architecture

The `prateeq.in` ecosystem caters to two distinct user journeys. Authentication and profile identity are unified under the central `clients` table and Supabase Auth.

```
                         [User Authentication (Google OAuth)]
                                        │
                                        ▼
                             [Central `clients` Profile]
                                        │
          ┌─────────────────────────────┴─────────────────────────────┐
          ▼                                                           ▼
  【Scoping & Dev Clients】                                  【RAG SaaS Subscribers】
  • Access: `/dashboard`                                     • Access: `/rag/app`
  • Purpose: Project tracking, interactive customizer,        • Purpose: Ingest knowledge, test chat,
    milestones, invoices, PDF proposals.                       configure widgets, evaluate RAG, manage keys.
  • Data Model: `client_scopes`, `invoices`                  • Data Model: `rag_tenants`, `rag_subscriptions`
```

### Account Interaction Rules
1. **Single Sign-On (SSO):** A user logging in with Google OAuth receives a single session cookie (`prateeq_active_user`).
2. **Auto-Workspace Provisioning:** Accessing `/rag/app` for the first time checks for existing membership in `rag_tenant_members`. If none exists, a default workspace (`<Name>'s Workspace`) is auto-provisioned in `rag_tenants` and linked to `clients.id`.
3. **Workspace Switcher:** A persistent topbar component (`<WorkspaceSwitcher />`) allows 1-click toggling between **Client Progress Dashboard** (`/dashboard`) and **RAG SaaS Studio** (`/rag/app`).

---

## 3. 7-Day Trial & Subscription Paywall Engine

### Trial Lifecycle
1. **Day 1–7 (Instant Starter Trial):** Upon initial login to `/rag/app`, the workspace is assigned `plan_tier: starter_trial`. No payment details are requested. Users receive full access to Starter features (up to 20 documents, 1,000 chat queries/month, 1 workspace).
2. **Countdown Telemetry:** A top bar banner displays active trial status (e.g. `⏱️ 5 Days Remaining on Free Trial — Upgrade to Pro`).
3. **Day 8 (Soft Paywall Lockout):** If no active Razorpay subscription is linked by Day 8:
   - Document upload forms are disabled.
   - Chat playground sends enter read-only mode (`Trial Expired — Please upgrade to continue`).
   - Widget script requests return standard 402 Payment Required status.
   - Read-only data inspection (viewing uploaded files, reading search logs, inspecting widget configuration) remains open.
4. **Subscription Activation:** Users can upgrade to **Starter**, **Pro**, or **Business** at any time via Razorpay checkout integration (supporting both INR ₹ and USD $ pricing).

---

## 4. App Shell & Navigation Architecture

The revamped `/rag/app` uses a modern **SaaS Left Sidebar + Dedicated Sub-Views Shell**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] RETRIEVER AI   [ Workspace Switcher: RAG Studio ▾ ]  [ Active Workspace: Acme Corp ▾ ] [⏱️ Trial] │
├──────────────┬──────────────────────────────────────────────────────────────────────────────────┤
│ 📊 Overview  │                                                                                  │
│ 💬 Chat      │                                                                                  │
│ 📄 Knowledge │                              ACTIVE SUB-VIEW PANEL                               │
│ 🔍 Search/Eval│                                                                                  │
│ ⚡ Cache      │                                                                                  │
│ ⚙️ Widget    │                                                                                  │
│ 👥 Team/Audit│                                                                                  │
└──────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

### The 6 Core Sub-Views (Expanded Feature Suite)

#### View 1: Overview & Financial Analytics Dashboard (`OverviewView`)
- **Key Metrics Cards:** Total Documents Ingested, Monthly Query Usage Progress Bar, Semantic Cache Hit Rate (%), Average Latency (ms).
- **Token Financial Spend Chart:** Financial breakdown showing token consumption and dollar spend grouped by model provider (*Gemini 3.6 Flash*, *Llama 3.3 70B*, *GPT-4o*, *Claude 3.5 Sonnet*) and API Key tags.
- **Quickstart Checklist:** Upload document -> Test chat -> Evaluate RAG -> Customize widget -> Embed on website.
- **Query Volume & Cache Latency Charts:** Real-time time-series telemetry.

#### View 2: Multi-Model Chat Studio (`ChatStudioView`)
- **Interactive Chat Interface:** Streaming SSE responses with character-by-character token rendering.
- **Model Selector Dropdown:** Toggle dynamically between `Llama 3.3 70B`, `Gemini 3.6 Flash`, `GPT-4o`, and `Claude 3.5 Sonnet`.
- **System Prompt Profile Switcher:** Select default system prompt preset (`default`, `strict_factual`, `customer_support`, `developer_docs`).
- **Citation Cards & Download Links:** Each assistant response lists source document citations with 1-click presigned PDF download buttons.
- **Feedback Logging:** Thumbs up/down buttons logging feedback directly to `chat_message_feedback` database.

#### View 3: Knowledge Base, GraphRAG & Cloud Connectors (`KnowledgeBaseView`)
- **Drag-and-Drop Uploader:** Supports PDF, DOCX, TXT, MD, CSV, and code files.
- **🕸️ GraphRAG Entity Traversal Visualizer:** An interactive node-link graph UI displaying extracted knowledge triples (`Subject ➔ Predicate ➔ Object`). Traces multi-hop relationships across indexed documents.
- **📋 Structured Schema Extractor (Doc-to-JSON):** Upload unstructured files (invoices, contracts, medical reports) and specify a JSON Schema to transform document contents into validated JSON with 1-click export.
- **👁️ Multi-Modal OCR & Chart Inspector:** View extracted tables, charts, and image diagrams parsed by Baidu PP-OCRv4 and LLM Vision fallback.
- **Interactive Chunking Auditor:** Preview document chunking algorithms (`sliding`, `semantic`, `hierarchical`) and character offsets before indexing.
- **🔌 Cloud Data Connectors & Web Crawler:** Configure background sync for Notion, Google Drive, automated website crawling (`https://docs.example.com`), and REST webhooks.

#### View 4: Search Inspector, Experiments & RAG Evaluator (`SearchInspectorView`)
- **Hybrid Search Debugger:** Enter natural language test queries to inspect raw retrieval results side-by-side.
- **Score Breakdown:** View HNSW dense vector cosine similarity scores, BM25 sparse keyword scores, and Cohere rerank confidence scores.
- **🧪 Ragas & DeepEval Automated Benchmark Suite:** Run automated benchmark test suites against uploaded document sets to measure:
  - **Faithfulness Score** (Is the answer strictly backed by source documents?)
  - **Answer Relevancy Score** (Does the answer directly address the prompt?)
  - **Context Recall Score** (Did retrieval pull all relevant text chunks?)
- **⚖️ A/B Testing & Variant Playground:** Create experiment variants comparing 2 retrieval configurations (e.g. *Hybrid Search + Cohere Rerank* vs *GraphRAG + BM25*) or system prompt presets with side-by-side latency, cost, and accuracy metrics.
- **Self-Querying Metadata Inspector:** Test how natural language temporal/category filters parse into PostgreSQL JSONB filters.

#### View 5: Semantic Cache & Performance Fine-Tuning (`CachePerformanceView`)
- **⚡ Sub-50ms Semantic Cache Management:** Real-time cache hit ratio telemetry.
- **Cosine Similarity Threshold Slider:** Fine-tune vector cache hit sensitivity ($0.90 - 0.99$ cosine similarity).
- **1-Click Cache Flush:** Purge cached vector responses on demand when knowledge documents are updated.

#### View 6: Live Visual Widget Studio & API Deployment (`WidgetStudioView`)
- **Live Visual Customizer Panel:**
  - Brand Theme Color Picker (primary color, background mode).
  - Launcher Icon & Position (bottom-right vs bottom-left).
  - Bot Avatar Image & Display Title.
  - Initial Welcome Greeting & Suggested Starter Questions.
- **Side-by-Side Live Widget Preview:** Real-time mock preview reflecting style edits instantly.
- **Multi-Platform Snippet Generator:**
  - 1-Line Script Tag (`<script src="https://prateeq.in/widget.js" ...>`)
  - React / Next.js Component Snippet (`<RetrieverWidget tenantId="..." />`)
  - cURL & REST API Examples
- **Domain CORS Whitelisting:** Security input to restrict widget script execution to verified domain origins (e.g. `https://mysite.com`).

#### View 7: Team Multi-Tenancy, Billing & Compliance Audit (`TeamBillingView`)
- **Team Member Management:** Invite team members by email with role assignment (`Owner`, `Admin`, `Member`).
- **Role Permissions:**
  - `Owner`: Billing control, workspace deletion, full admin settings.
  - `Admin`: Document uploads, API key generation, widget customizer.
  - `Member`: Chat playground testing, document inspection.

#### View 8: Ecosystem Plugins & Integrations (`IntegrationsPanel` — Milestone 90)
- **💬 Native Slack Workspace Bot:**
  - `/ask-retriever <query>` slash command for team channels.
  - Cryptographic HMAC-SHA256 signature verification (`v0={hash}`).
  - Grounded Block Kit message format with clickable citation link pills and interactive `👍 Helpful` / `👎 Inaccurate` telemetry buttons.
- **🌐 1-Click Chrome Ingestion Extension (Manifest V3):**
  - Instant `.zip` bundle download link (`/v1/integrations/extension/bundle`).
  - Active browser DOM reader-mode extraction with tag stripping (`<script>`, `<nav>`, `<footer>`).
  - Fast-path ingestion directly into tenant document library via `POST /v1/tenants/{tenantId}/documents/raw`.
- **📁 Google Drive 2-Way Sync:**
  - Google Drive v3 REST API folder synchronization.
  - Automatic Google Docs (`application/vnd.google-apps.document`) to plain text conversion.
  - Differential change detection via `modifiedTime` and MD5 checksums.
- **📝 Notion Workspace Connector:**
  - Notion API v1 recursive block children tree traversal (`/v1/blocks/{id}/children`).
  - Conversion of headings, lists, quotes, and code blocks to clean GitHub Flavored Markdown.
  - Differential sync using `last_edited_time`.
- **Razorpay Plan Subscription & Invoices:** Upgrade/downgrade subscription tiers (Starter, Pro, Business), view billing history, and download tax invoices.
- **📜 Cryptographic SHA-256 Audit Log Exporter:** Download verifiable, tamper-evident audit logs of all queries, document uploads, and configuration changes for HIPAA/GDPR compliance audits.

---

## 5. Hybrid LLM Key & Billing Strategy

To give subscribers flexibility, Retriever SaaS supports two operational billing modes:

1. **Managed Platform Credits (Default):**
   - Platform provides LLM inference (Gemini 3.6 Flash, Llama 3.3 70B, GPT-4o, Claude 3.5 Sonnet).
   - Queries are capped per subscription tier (Starter: 1,000/mo, Pro: 5,000/mo, Business: 20,000/mo).
2. **BYOK (Bring Your Own Key) Uncapped Mode:**
   - Subscribers can enter their own API key (Gemini, OpenAI, or Anthropic) in workspace settings.
   - Keys are encrypted server-side using **AES-256-GCM** before persistence and never exposed in client bundles or log outputs.
   - When BYOK is enabled, query usage does NOT count against monthly platform query quotas, unlocking uncapped inference.
3. **Multi-Currency Geo-IP Checkout & Webhook Engine:**
   - Detects user region via Vercel headers (`x-vercel-ip-country`) to dynamically select **INR (₹)** or **USD ($)** pricing.
   - Subscriptions and paywall status are synchronized asynchronously via Razorpay webhooks directly updating `rag_subscriptions`.

---

## 6. Architecture, Database Schema & Security Guardrails

### Architectural & Security Boundaries
1. **API Gateway Scoping:** The Next.js web application interacts exclusively with the FastAPI `retriever` engine via HTTPS and Server-Sent Events (SSE) using the `RetrieverClient` adapter (`src/lib/rag-client.ts`).
2. **Multi-Tenancy Isolation:** The backend strictly enforces `tenant_id` scoping across all PostgreSQL database queries and pgvector indices. Direct client-side vector database queries are prohibited.
3. **Audit Log Verifiability:** Cryptographic SHA-256 hash chains (`entry_hash = HASH(previous_hash + payload)`) guarantee tamper-evident audit trails for regulatory compliance (GDPR/HIPAA).

### Database Schema Readiness
- **Supabase Core Tables & RLS (Active Migration: `20260814000000_rag_tenants_and_members.sql`):**
  - `clients`: Central user profiles (email, name, company, tax ID).
  - `rag_tenants`: SaaS workspace records (`tenant_id`, `client_id`, `name`, `plan_tier`, `is_active`).
  - `rag_tenant_members`: Team membership mapping (`tenant_id`, `user_id`, `email`, `role`). Row-Level Security policies active.
  - `rag_subscriptions`: Razorpay subscription state (`tenant_id`, `plan_tier`, `current_period_end`, `razorpay_subscription_id`).

- **Retriever Engine Tables (PostgreSQL / pgvector):**
  - `documents` & `document_chunks`: Stored chunks with pgvector embeddings (768-dim).
  - `semantic_cache`: Sub-50ms vector query cache.
  - `graph_triples`: Knowledge graph triples for GraphRAG traversal (`Subject ➔ Predicate ➔ Object`).
  - `eval_datasets`, `eval_questions`, `eval_runs`: Ragas & DeepEval evaluation test benchmarks.
  - `chat_message_feedback`: Thumbs up/down feedback log.
  - `audit_logs`: SHA-256 tamper-evident compliance audit chain (`entry_hash`, `previous_hash`).

---

## 7. Verification & Implementation Roadmap

| Phase | Description | Deliverables | Status |
|-------|-------------|--------------|--------|
| **Phase 1** | Architecture & PRD Alignment | Master PRD (`docs/24_RAG_App_Studio_PRD.md`) & Dependency Mapping | ✅ Complete |
| **Phase 2** | App Shell & Workspace Switcher | Revamped `/rag/app` shell with 7-view left sidebar, topbar switcher, and trial banner | ✅ Complete |
| **Phase 3** | Core & Advanced Sub-Views | Implementation of all 7 sub-views (Overview, Chat, Knowledge+Graph, Search+Eval, Cache, Widget, Team+Audit) | ✅ Complete |
| **Phase 4** | Subscription & Trial Integration | 7-day trial countdown engine & Razorpay soft paywall lockout | ✅ Complete |
| **Phase 5** | End-to-End Verification | Build verification, contract audits, unit tests, and final certification | ✅ Complete |

---

## **Related Architecture & Cross-References**

- [RAG Lab Showcase Overview](rag-lab.md)
- [Scoping Lab Dogfooding Tenant (`prateeq_scoping`)](25_SOTA_Scoping_Engine_PRD.md)
- [Client Workspace & RAG Studio Auth](CLIENT_DASHBOARD_ROADMAP.md)
- [SaaS Plan Subscriptions](14_Razorpay_Payments_and_Invoicing.md)
- [Multi-Tenant Isolation & RLS](16_Security_and_Privacy.md)
- [Master Roadmap (Phases B, D, G)](UNIFIED_MASTER_ROADMAP.md)
- [Architecture Node: SaaS Studio](architecture_nodes/Route_rag_app.md)
- [Architecture Node: RAG Client SDK](architecture_nodes/Lib_rag_client.md)
- [Architecture Node: /v1/chat](architecture_nodes/Retriever_API_v1_chat.md)
- [Architecture Node: Tenants Schema](architecture_nodes/Schema_rag_tenants.md)