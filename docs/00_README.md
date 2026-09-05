# **00. Documentation Directory Guide**

Welcome to the documentation folder for Version 2 (v2) of Prateek Sharma's personal portfolio website: **Adaptive Portfolio**.

This folder contains the complete vision, specifications, system designs, and engineering guidelines for the project. These documents are designed to serve as the single source of truth for the product's behavior and implementation.

---

# **Documentation Map**

Below is a summary of all documentation files, categorized by their domain.

## **Overview & Strategy**
* [00_README.md](00_README.md): You are here. A guide and navigation index for this folder.
* [MASTER_ARCHITECTURE_MAP.canvas](MASTER_ARCHITECTURE_MAP.canvas): **Visual Interactive Master Architecture Canvas** (Obsidian Whiteboard mapping Frontend, Next.js Edge APIs, Retriever Cognitive Core, Razorpay Escrow, and Postgres Persistence).
* [UNIFIED_MASTER_ROADMAP.md](UNIFIED_MASTER_ROADMAP.md): **Single Source of Truth (SSoT)** platform-wide sequential roadmap (M1–M78).
* [01_Vision_and_Philosophy.md](01_Vision_and_Philosophy.md): The underlying "why" of the website and non-negotiable product principles.
* [03_Product_Goals_Objectives_and_Success_Metrics.md](03_Product_Goals_Objectives_and_Success_Metrics.md): Measurable qualitative and quantitative goals for success.
* [04_Adaptive_Portfolio_Experience.md](04_Adaptive_Portfolio_Experience.md): Core mechanism of audience adaptation and journeys.
* [05_User_Experience_and_Interaction_Design.md](05_User_Experience_and_Interaction_Design.md): General motion, layout density, and timing principles.
* [06_Adaptive_Identity_System.md](06_Adaptive_Identity_System.md): Composition of Visual Themes and Communication Identities.
* [07_Content_Strategy.md](07_Content_Strategy.md): Copywriting tone of voice and positioning checklist.
* [08_Information_Architecture.md](08_Information_Architecture.md): How information relates and flows progressively.
* [REVENUE_EXECUTION_PLAN.md](commercial/REVENUE_EXECUTION_PLAN.md): Fast-track client acquisition, high-ticket pricing, social pitch scripts, and revenue roadmap.

## **Section & Product Specifications**
* [09_Section_Specifications/](09_Section_Specifications/README.md): Individual section specs for Hero, About, Skills, Projects, Playground, Resume, Pricing (Scoping Lab), Contact, Footer, Terminal, Blog, Scoping Lab (`12_Scoping_Lab.md`), and Client Workspace Dashboard (`13_Client_Workspace_Dashboard.md`).
* [24_RAG_App_Studio_PRD.md](24_RAG_App_Studio_PRD.md): Product Requirements Document (PRD) for the /rag/app SaaS Studio, including dual account architecture, 7-day trial engine, 6 core sub-views, team multi-tenancy, and live visual widget studio.
* [25_SOTA_Scoping_Engine_PRD.md](25_SOTA_Scoping_Engine_PRD.md): **Master Product Requirements Document (PRD)** for the SOTA Scoping Engine, Productized E-Commerce Cart Drawer, GraphRAG Upsells, Python REPL CPQ Math, and Client Workspace Bridge (Phase G: M63–M68).
* [26_Autonomous_Outreach_Engine_PRD.md](26_Autonomous_Outreach_Engine_PRD.md): **Master Product Requirements Document (PRD)** for Autonomous AI Lead Discovery, Gemini Cold Pitch Synthesis, Cloud Review Queue (`/admin`), and Resend SMTP Dispatch.
* [27_Client_Workspace_and_Escrow_Ledger_PRD.md](27_Client_Workspace_and_Escrow_Ledger_PRD.md): **Master Product Requirements Document (PRD)** for `/dashboard` Client Workspace, 50% Milestone Escrow Invoicing, Razorpay HMAC-SHA256 Verification, and Immutable Baseline SOW Contracts.
* [28_Automated_AI_Blogging_Engine_PRD.md](28_Automated_AI_Blogging_Engine_PRD.md): **Master Product Requirements Document (PRD)** for Automated Daily AI Newsjacking, Brand Voice Banned Clichés, AST Commercial Deep-Linking, and 1-Click Email Publish Gate.
* [29_Commercial_PDF_Generation_Engine_PRD.md](29_Commercial_PDF_Generation_Engine_PRD.md): **Master Product Requirements Document (PRD)** for `@react-pdf/renderer` v4 Commercial Document Suite, Dual-Theme Color Tokens, Pre-baked Variable Fonts, and Pinned Page Budgets.
* [30_Interactive_Diagnostics_Terminal_PRD.md](30_Interactive_Diagnostics_Terminal_PRD.md): **Master Product Requirements Document (PRD)** for `/terminal` Interactive Diagnostics Console, Headless Project Scoping Engine, Web Audio Synthesizer, and Retro Arcade Ecosystem.
* [31_Synchronizer_CMS_and_Local_Control_Plane_PRD.md](31_Synchronizer_CMS_and_Local_Control_Plane_PRD.md): **Master Product Requirements Document (PRD)** for Local Streamlit Synchronizer CMS (`scripts/synchronizer.py`), Multimodal Gemini OCR, Bidirectional Supabase Sync, and Next.js Cache Invalidation.
* [CLIENT_DASHBOARD_ROADMAP.md](CLIENT_DASHBOARD_ROADMAP.md): Client Dashboard & SaaS Studio Ecosystem Domain Architectural Specification.

## **System Architecture Specifications**
* [10_Content_Platform_Architecture.md](10_Content_Platform_Architecture.md): Tech specs of content database tables, client scopes, caches, and fallbacks.
* [11_Content_Management_System.md](11_Content_Management_System.md): The local Streamlit-based Content Synchronizer specifications.
* [12_AI_Integration_Strategy.md](12_AI_Integration_Strategy.md): Safe usage guidelines for Google Gemini in the local synchronizer.
* [13_Telemetry_and_Analytics.md](13_Telemetry_and_Analytics.md): GDPR-compliant, privacy-first session telemetry.
* [14_Razorpay_Payments_and_Invoicing.md](14_Razorpay_Payments_and_Invoicing.md): Razorpay Payment Gateway, 50% deposit lock, HMAC verification, and invoice ledger.
* [15_Performance_and_Accessibility.md](15_Performance_and_Accessibility.md): Core Web Vitals targets, Lighthouse metrics, and accessibility standards.
* [16_Security_and_Privacy.md](16_Security_and_Privacy.md): Row-Level Security (RLS), keys protection, session verification, and data privacy rules.
* [17_SEO_Strategy.md](17_SEO_Strategy.md): Search engine optimization rules, OG images, and structured metadata.
* [AI_OUTREACH_AGENT_ROADMAP.md](AI_OUTREACH_AGENT_ROADMAP.md): Technical specification for 24/7 Autonomous AI Lead Prospecting, Gmail & Social Media Content Agent (M57–M58).
* [AUTOMATED_AI_BLOGGING_ROADMAP.md](AUTOMATED_AI_BLOGGING_ROADMAP.md): Technical specification for Automated AI Newsjacking & Content Engine (M59).

## **Operational and Implementation Rules**
* [18_Codebase_Modernization_and_Refactoring.md](18_Codebase_Modernization_and_Refactoring.md): Guidelines on updating React/Next versions and refactoring rules.
* [19_Testing_and_Quality_Assurance.md](19_Testing_and_Quality_Assurance.md): Validation check scripts and deployment verification lists.
* [20_Deployment_Strategy.md](20_Deployment_Strategy.md): Host mappings (Vercel), domains routing (`prateeq.in`), and CDN cache invalidations.
* [21_Future_Roadmap.md](21_Future_Roadmap.md): Post-v2 milestones and future feature explorations (overview).
* [23_Glossary.md](23_Glossary.md): Alphabetical definitions of the technical and product terms used.
* [99_DECISIONS.md](99_DECISIONS.md): Architecture Decision Records (ADR) registry.

## **Archive**
Historical documents that have been superseded or merged into other files:
* [archive/00_EXECUTIVE_SUMMARY.md](archive/00_EXECUTIVE_SUMMARY.md): Superseded by 01_Vision_and_Philosophy.md and AGENTS.md.
* [archive/02_Existing_Product_Analysis_and_Discovery.md](archive/02_Existing_Product_Analysis_and_Discovery.md): Discovery phase completed.
* [archive/14_Engineering_Architecture.md](archive/14_Engineering_Architecture.md): Merged into AGENTS.md.
* [archive/22_Implementation_Guidelines_for_AI_Agents.md](archive/22_Implementation_Guidelines_for_AI_Agents.md): Merged into AGENTS.md.
* [archive/checklist.md](playbooks/MASTER_CODEBASE_AUDIT_CHECKLIST.md): Phase model outdated; superseded by current implementation.

---

# **How to Use and Maintain**

1. **Read Before Writing**: Any agent or developer working on the project must read these documents first to understand the boundaries, principles, and expected behaviors.
2. **Synchronous Updates**: When adding a new feature, database table, or capability to the codebase, the developer must update the corresponding specification file.
3. **Markdown Guidelines**: Use relative file schema paths for linking and clean headings to keep documents highly readable.
