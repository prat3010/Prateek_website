# 🗺️ Master Documentation & System Architecture Map

Welcome to the **Prateek Sharma Engineering Platform Documentation Map**. This catalog serves as the central directory navigating all technical specifications, product requirements documents (PRDs), architecture nodes, commercial playbooks, and operational runbooks.

---

## 🏛️ 1. Master Strategy & Roadmaps (Single Source of Truth)

| Document | Scope & Purpose |
| :--- | :--- |
| 📌 **[`UNIFIED_MASTER_ROADMAP.md`](UNIFIED_MASTER_ROADMAP.md)** | **Sole SSoT for Platform Milestones (M1–M102)** across Frontend, CPQ Scoping, Escrow, and RAG. |
| 🏛️ **[`00_ARCHITECTURE_INDEX.md`](00_ARCHITECTURE_INDEX.md)** | AST-generated index of all 97 live system architecture nodes and API endpoints. |
| 🗺️ **[`ARCHITECTURE_DEPENDENCY_MAP.md`](ARCHITECTURE_DEPENDENCY_MAP.md)** | Complete component-to-data dependency matrix across Data, Web App, PDF, and CMS layers. |
| 📜 **[`99_DECISIONS.md`](99_DECISIONS.md)** | Architecture Decision Records (ADRs 01–23) governing Next.js 16, theme state, and escrows. |
| 💼 **[`CLIENT_DASHBOARD_ROADMAP.md`](CLIENT_DASHBOARD_ROADMAP.md)** | Technical specification for the Client Workspace Dashboard (`/dashboard`) and SaaS Studio (`/rag/app`). |
| 🤖 **[`AI_OUTREACH_AGENT_ROADMAP.md`](AI_OUTREACH_AGENT_ROADMAP.md)** | Technical specification for the Autonomous AI Lead Prospecting & Outreach engine. |
| ✍️ **[`AUTOMATED_AI_BLOGGING_ROADMAP.md`](AUTOMATED_AI_BLOGGING_ROADMAP.md)** | Technical specification for the automated SEO newsjacking and technical blogging engine. |

---

## 📋 2. Product Requirements Documents (PRDs)

| PRD | Title | Key Platform Capability |
| :---: | :--- | :--- |
| **24** | **[`24_RAG_App_Studio_PRD.md`](24_RAG_App_Studio_PRD.md)** | RAG SaaS Studio (`/rag/app`), Document Library, Citations, and Embed Customizer. |
| **25** | **[`25_SOTA_Scoping_Engine_PRD.md`](25_SOTA_Scoping_Engine_PRD.md)** | Instant CPQ Scoping Lab, Cart Drawer, Algorithmic Pricing, and RFP Vision Parser. |
| **26** | **[`26_Autonomous_Outreach_Engine_PRD.md`](26_Autonomous_Outreach_Engine_PRD.md)** | Lead scraping, ICP classification, Resend dispatching, and mobile admin review. |
| **27** | **[`27_Client_Workspace_and_Escrow_Ledger_PRD.md`](27_Client_Workspace_and_Escrow_Ledger_PRD.md)** | Client Portal, 50% escrow billing, Razorpay orders, and SHA-256 digital SOWs. |
| **28** | **[`28_Automated_AI_Blogging_Engine_PRD.md`](28_Automated_AI_Blogging_Engine_PRD.md)** | Automated technical blog generation, Markdown publishing, and RSS syndication. |
| **29** | **[`29_Commercial_PDF_Generation_Engine_PRD.md`](29_Commercial_PDF_Generation_Engine_PRD.md)** | React-PDF engine generating pixel-perfect Scoping Briefs, Invoices, and Agreements. |
| **30** | **[`30_Interactive_Diagnostics_Terminal_PRD.md`](30_Interactive_Diagnostics_Terminal_PRD.md)** | Interactive diagnostics terminal (`/terminal`), QR code billing, and hacker CLI. |
| **31** | **[`31_Synchronizer_CMS_and_Local_Control_Plane_PRD.md`](31_Synchronizer_CMS_and_Local_Control_Plane_PRD.md)** | Local Streamlit control plane (`scripts/synchronizer.py`) for live database management. |
| **32** | **[`32_Universal_Model_Context_Protocol_PRD.md`](32_Universal_Model_Context_Protocol_PRD.md)** | Universal Model Context Protocol (MCP) Server (SSE + JSON-RPC 2.0) with 20-battery tool registry. |
| **33** | **[`33_Empirical_Load_Benchmarking_and_Production_Stress_Testing_PRD.md`](33_Empirical_Load_Benchmarking_and_Production_Stress_Testing_PRD.md)** | Automated empirical load benchmarks, P50-P99 latency distribution, and public showcase (`/rag/benchmarks`). |

---

## 📐 3. Core System Specifications (00–23)

- **Foundation & Identity:**
  - [`01_Vision_and_Philosophy.md`](01_Vision_and_Philosophy.md) • [`03_Product_Goals_Objectives_and_Success_Metrics.md`](03_Product_Goals_Objectives_and_Success_Metrics.md)
  - [`04_Adaptive_Portfolio_Experience.md`](04_Adaptive_Portfolio_Experience.md) • [`05_User_Experience_and_Interaction_Design.md`](05_User_Experience_and_Interaction_Design.md)
  - [`06_Adaptive_Identity_System.md`](06_Adaptive_Identity_System.md) • [`07_Content_Strategy.md`](07_Content_Strategy.md) • [`08_Information_Architecture.md`](08_Information_Architecture.md)
- **Architecture & Infrastructure:**
  - [`10_Content_Platform_Architecture.md`](10_Content_Platform_Architecture.md) • [`11_Content_Management_System.md`](11_Content_Management_System.md)
  - [`12_AI_Integration_Strategy.md`](12_AI_Integration_Strategy.md) • [`13_Telemetry_and_Analytics.md`](13_Telemetry_and_Analytics.md)
  - [`14_Razorpay_Payments_and_Invoicing.md`](14_Razorpay_Payments_and_Invoicing.md) • [`15_Performance_and_Accessibility.md`](15_Performance_and_Accessibility.md)
  - [`16_Security_and_Privacy.md`](16_Security_and_Privacy.md) • [`17_SEO_Strategy.md`](17_SEO_Strategy.md)
  - [`18_Codebase_Modernization_and_Refactoring.md`](18_Codebase_Modernization_and_Refactoring.md) • [`19_Testing_and_Quality_Assurance.md`](19_Testing_and_Quality_Assurance.md)
  - [`20_Deployment_Strategy.md`](20_Deployment_Strategy.md) • [`21_Future_Roadmap.md`](21_Future_Roadmap.md) • [`23_Glossary.md`](23_Glossary.md)
- **Section Specifications:** [`09_Section_Specifications/`](09_Section_Specifications/) (Hero, About, Skills, Projects, Pricing, Terminal, Scoping, etc.)

---

## 💰 4. Commercial & Legal Suite (`docs/commercial/`)

- 🤝 **[`commercial/MIDDLEMAN_PARTNERSHIP_AGREEMENT.md`](commercial/MIDDLEMAN_PARTNERSHIP_AGREEMENT.md):** Default terms and commission splits for agency sales partners.
- 📚 **[`commercial/PRATEEQ_ENGINEERING_CATALOG_SOW_KNOWLEDGE.md`](commercial/PRATEEQ_ENGINEERING_CATALOG_SOW_KNOWLEDGE.md):** Complete SOW deliverables knowledge base for client contracts.
- 📈 **[`commercial/REVENUE_EXECUTION_PLAN.md`](commercial/REVENUE_EXECUTION_PLAN.md):** High-ticket service pricing, sales cadence, and target revenue milestones.
- 💼 **[`commercial/HIGH_TICKET_COMMERCIAL_PLAYBOOK.md`](commercial/HIGH_TICKET_COMMERCIAL_PLAYBOOK.md):** Algorithmic CPQ pricing strategy, 50% escrow milestones, and change-order governance.

---

## 🛠️ 5. Operational Playbooks & Quality Assurance (`docs/playbooks/`)

- 🎨 **[`playbooks/BRAND_TONE_GUIDELINES.md`](playbooks/BRAND_TONE_GUIDELINES.md):** Dual-theme brand voice (Azure vs. Noir) and copywriting guidelines.
- 🎬 **[`playbooks/DEMO_PLAYBOOK_AND_SHOWCASE_GUIDE.md`](playbooks/DEMO_PLAYBOOK_AND_SHOWCASE_GUIDE.md):** Step-by-step interactive demo script for client calls and video tours.
- ✅ **[`playbooks/MASTER_CODEBASE_AUDIT_CHECKLIST.md`](playbooks/MASTER_CODEBASE_AUDIT_CHECKLIST.md):** Comprehensive production deployment audit checklist.
- 🔗 **[`playbooks/BLOG_DEEP_LINKING_MAP.md`](playbooks/BLOG_DEEP_LINKING_MAP.md):** Semantic deep-linking rules connecting blog articles to commercial scoping engines.
- 🧪 **[`playbooks/rag-lab.md`](playbooks/rag-lab.md):** Interactive RAG Lab test scenarios and visual widget QA.

---

## 🚀 6. SRE & Operational Runbooks (`docs/runbooks/`)

- 🗄️ **[`runbooks/RUNBOOK_DATABASE_MIGRATION.md`](runbooks/RUNBOOK_DATABASE_MIGRATION.md):** Supabase PostgreSQL schema migration workflow.
- 🔌 **[`runbooks/RUNBOOK_NEW_API_ENDPOINT.md`](runbooks/RUNBOOK_NEW_API_ENDPOINT.md):** Adding and testing a new Next.js 16 API route handler.
- ⚙️ **[`runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md`](runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md):** Adding a new engine or feature module to the Scoping Lab.
- 🏢 **[`runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md`](runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md):** Provisioning a client tenant on the Retriever AI platform.

---

## 🧠 7. Open-Source Cognitive Core (`retriever`)

- 🚀 **Repository:** [`github.com/prat3010/retriever`](https://github.com/prat3010/retriever)
- 🗺️ **Retriever Open-Source Roadmap:** [`../../retriever/ROADMAP.md`](../../retriever/ROADMAP.md)
- 🔒 **Enterprise Security Whitepaper:** [`../../retriever/docs/security/ENTERPRISE_RAG_SECURITY_WHITEPAPER.md`](../../retriever/docs/security/ENTERPRISE_RAG_SECURITY_WHITEPAPER.md)
- 🛡️ **Sovereign Edge Swarm Handbook:** [`../../retriever/docs/cognitive/SOVEREIGN_EDGE_SWARM_HANDBOOK.md`](../../retriever/docs/cognitive/SOVEREIGN_EDGE_SWARM_HANDBOOK.md)
- 🤝 **Contributing Guide:** [`../../retriever/CONTRIBUTING.md`](../../retriever/CONTRIBUTING.md)
