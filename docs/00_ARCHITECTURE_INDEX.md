# 🏛️ Master Architecture Knowledge Graph Index
**Total Registered Architecture Nodes:** 148 | **Visual Canvases:** 4 | **Standard SOP Runbooks:** 4

## ⚡ Quick Navigation
- [Master Architecture Visual Canvas](MASTER_ARCHITECTURE_MAP.canvas)
- [Commerce & Escrow Flow Canvas](COMMERCE_AND_ESCROW_FLOW.canvas)
- [RAG & Cognitive Pipeline Canvas](RAG_AND_COGNITIVE_PIPELINE.canvas)
- [Autonomous Outreach Engine Canvas](AUTONOMOUS_OUTREACH_ENGINE.canvas)
- **Standard Runbooks:**
  - [Runbook: New API Endpoint](runbooks/RUNBOOK_NEW_API_ENDPOINT.md)
  - [Runbook: New CPQ Feature or Engine](runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)
  - [Runbook: Database Schema Migration](runbooks/RUNBOOK_DATABASE_MIGRATION.md)
  - [Runbook: RAG Tenant Onboarding](runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)
---

### 🔹 1. FRONTEND: Portfolio & Adaptive Identity (18 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Route_analytics` | **Route: `/analytics` (Public Visitor Telemetry Dashboard)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Route_analytics.md](architecture_nodes/Route_analytics.md) |
| `Route_blog` | **Route: `/blog` & `/blog/[slug]` (Technical Markdown Publication)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Route_blog.md](architecture_nodes/Route_blog.md) |
| `Route_home` | **Route: `/` (Adaptive Portfolio Home)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Route_home.md](architecture_nodes/Route_home.md) |
| `Route_terminal` | **Route: `/terminal` (Interactive Diagnostics Console)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Route_terminal.md](architecture_nodes/Route_terminal.md) |
| `UI_AgentStudioPanel` | **UI Component: `AgentStudioPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_AgentStudioPanel.md](architecture_nodes/UI_AgentStudioPanel.md) |
| `UI_AnalyticsDashboard` | **UI: `AnalyticsDashboard.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_AnalyticsDashboard.md](architecture_nodes/UI_AnalyticsDashboard.md) |
| `UI_BlogEngine` | **UI: `BlogEngine.tsx` / `BlogPost.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_BlogEngine.md](architecture_nodes/UI_BlogEngine.md) |
| `UI_CachePanel` | **UI Component: `CachePanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_CachePanel.md](architecture_nodes/UI_CachePanel.md) |
| `UI_CapabilityStudioPanel` | **UI: `ScaffoldPanel.tsx` (Capability Studio & Metaprogrammer)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_CapabilityStudioPanel.md](architecture_nodes/UI_CapabilityStudioPanel.md) |
| `UI_EdgeSwarmPanel` | **UI: `EdgePanel.tsx` (Sovereign Edge Swarm Studio)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_EdgeSwarmPanel.md](architecture_nodes/UI_EdgeSwarmPanel.md) |
| `UI_GatewayPanel` | **UI Component: `GatewayPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_GatewayPanel.md](architecture_nodes/UI_GatewayPanel.md) |
| `UI_IntegrationsPanel` | **UI Component: `IntegrationsPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_IntegrationsPanel.md](architecture_nodes/UI_IntegrationsPanel.md) |
| `UI_NoirSkyline` | **UI: `NoirSkyline.tsx` (6-Layer Parallax Backdrop)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_NoirSkyline.md](architecture_nodes/UI_NoirSkyline.md) |
| `UI_PromptOptimizationPanel` | **UI Component: `PromptOptimizationPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_PromptOptimizationPanel.md](architecture_nodes/UI_PromptOptimizationPanel.md) |
| `UI_RlmStudioPanel` | **UI Component: `RlmStudioPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_RlmStudioPanel.md](architecture_nodes/UI_RlmStudioPanel.md) |
| `UI_TeamPanel` | **UI Component: `TeamPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_TeamPanel.md](architecture_nodes/UI_TeamPanel.md) |
| `UI_Terminal` | **UI: `Terminal.tsx` (Interactive CLI Engine)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_Terminal.md](architecture_nodes/UI_Terminal.md) |
| `UI_VectorVisualizerPanel` | **UI Component: `VectorVisualizerPanel`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_VectorVisualizerPanel.md](architecture_nodes/UI_VectorVisualizerPanel.md) |

### 🔹 2. DISCOVERY & COMMERCE: Multimodal CPQ & SOW Freeze (6 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Route_scoping` | **Route: `/scoping` (Project Scoping Lab)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Route_scoping.md](architecture_nodes/Route_scoping.md) |
| `UI_ArchitectureCartDrawer` | **UI: `ArchitectureCartDrawer.tsx`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/UI_ArchitectureCartDrawer.md](architecture_nodes/UI_ArchitectureCartDrawer.md) |
| `UI_MiddlemanAgreement` | **UI: `MiddlemanAgreement.tsx` & `MiddlemanAgreementPDF.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_MiddlemanAgreement.md](architecture_nodes/UI_MiddlemanAgreement.md) |
| `UI_PreDepositBridge` | **UI: `PreDepositBridge.tsx` & `DigitalSOWPreview.tsx`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/UI_PreDepositBridge.md](architecture_nodes/UI_PreDepositBridge.md) |
| `UI_ScopingLab` | **UI: `ScopingLab.tsx` / `IntakeForm.tsx`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/UI_ScopingLab.md](architecture_nodes/UI_ScopingLab.md) |
| `UI_TopologyMap` | **UI: `TopologyMap.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_TopologyMap.md](architecture_nodes/UI_TopologyMap.md) |

### 🔹 3. WORKSPACE & CONTROL: Client Dashboard, Admin & Studio (7 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Route_admin` | **Route: `/admin` (Master Admin Control Center)** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/Route_admin.md](architecture_nodes/Route_admin.md) |
| `Route_dashboard` | **Route: `/dashboard` (Client Workspace Dashboard)** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/Route_dashboard.md](architecture_nodes/Route_dashboard.md) |
| `Route_rag_app` | **Route: `/rag` & `/rag/app` (Retriever SaaS Studio)** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/Route_rag_app.md](architecture_nodes/Route_rag_app.md) |
| `Tool_Synchronizer` | **Tool: `synchronizer.py` (Local Streamlit Content CMS)** | 🟢 `MEDIUM` | `SERVICE_ROLE` | [architecture_nodes/Tool_Synchronizer.md](architecture_nodes/Tool_Synchronizer.md) |
| `UI_AdminPortal` | **UI: `AdminPortal.tsx` (Autonomous Outreach Cockpit)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_AdminPortal.md](architecture_nodes/UI_AdminPortal.md) |
| `UI_ClientWorkspaceDashboard` | **UI: `ClientWorkspaceDashboard.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_ClientWorkspaceDashboard.md](architecture_nodes/UI_ClientWorkspaceDashboard.md) |
| `UI_RAGLabPlayground` | **UI: `RAGLabPlayground.tsx` (Retriever SaaS Studio Views)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_RAGLabPlayground.md](architecture_nodes/UI_RAGLabPlayground.md) |

### 🔹 4. API GATEWAY: Next.js 16 Edge & REST Layer (38 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `API_analytics_summary` | **API: `GET /api/analytics-summary`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_analytics_summary.md](architecture_nodes/API_analytics_summary.md) |
| `API_blog_publish` | **API: `POST /api/blog/publish`** | 🟢 `MEDIUM` | `SERVICE_ROLE` | [architecture_nodes/API_blog_publish.md](architecture_nodes/API_blog_publish.md) |
| `API_certificates` | **API: `GET /api/certificates` & `[id]`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_certificates.md](architecture_nodes/API_certificates.md) |
| `API_client_change_orders` | **API: `GET/POST /api/client/change-orders`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_change_orders.md](architecture_nodes/API_client_change_orders.md) |
| `API_client_copilot` | **API: `POST /api/client/copilot`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_copilot.md](architecture_nodes/API_client_copilot.md) |
| `API_client_create_razorpay_invoice` | **API: `POST /api/client/create-razorpay-invoice`** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/API_client_create_razorpay_invoice.md](architecture_nodes/API_client_create_razorpay_invoice.md) |
| `API_client_create_razorpay_order` | **API: `POST /api/client/create-razorpay-order`** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/API_client_create_razorpay_order.md](architecture_nodes/API_client_create_razorpay_order.md) |
| `API_client_create_razorpay_subscription` | **API: `POST /api/client/create-razorpay-subscription`** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/API_client_create_razorpay_subscription.md](architecture_nodes/API_client_create_razorpay_subscription.md) |
| `API_client_delete_scope` | **API: `POST /api/client/delete-scope`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_delete_scope.md](architecture_nodes/API_client_delete_scope.md) |
| `API_client_get_invoices` | **API: `GET /api/client/get-invoices`** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/API_client_get_invoices.md](architecture_nodes/API_client_get_invoices.md) |
| `API_client_get_scopes` | **API: `GET /api/client/get-scopes`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_get_scopes.md](architecture_nodes/API_client_get_scopes.md) |
| `API_client_intake_draft` | **API: `POST /api/client/intake-draft`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_intake_draft.md](architecture_nodes/API_client_intake_draft.md) |
| `API_client_save_scope` | **API: `POST /api/client/save-scope`** | 🟢 `MEDIUM` | `BEARER_JWT` | [architecture_nodes/API_client_save_scope.md](architecture_nodes/API_client_save_scope.md) |
| `API_client_verify_razorpay_payment` | **API: `POST /api/client/verify-razorpay-payment`** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/API_client_verify_razorpay_payment.md](architecture_nodes/API_client_verify_razorpay_payment.md) |
| `API_contact` | **API: `POST /api/contact` (Contact Form Gateway)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_contact.md](architecture_nodes/API_contact.md) |
| `API_git_log` | **API: `GET /api/git-log`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_git_log.md](architecture_nodes/API_git_log.md) |
| `API_ml_classify_visitor` | **API: `POST /api/ml/classify-visitor`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_ml_classify_visitor.md](architecture_nodes/API_ml_classify_visitor.md) |
| `API_outreach_dispatch` | **API: `POST /api/outreach/dispatch`** | 🟠 `HIGH` | `BEARER_JWT` | [architecture_nodes/API_outreach_dispatch.md](architecture_nodes/API_outreach_dispatch.md) |
| `API_outreach_get_leads` | **API: `GET /api/outreach/get-leads`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_outreach_get_leads.md](architecture_nodes/API_outreach_get_leads.md) |
| `API_outreach_prospect` | **API: `POST /api/outreach/prospect`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_outreach_prospect.md](architecture_nodes/API_outreach_prospect.md) |
| `API_profile` | **API: `GET /api/profile`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_profile.md](architecture_nodes/API_profile.md) |
| `API_projects` | **API: `GET /api/projects` & `[slug]`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_projects.md](architecture_nodes/API_projects.md) |
| `API_rag_invite` | **API: `POST /api/rag/invite`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_rag_invite.md](architecture_nodes/API_rag_invite.md) |
| `API_rag_members` | **API: `GET /api/rag/members`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_rag_members.md](architecture_nodes/API_rag_members.md) |
| `API_rag_telemetry` | **API: `GET /api/rag/telemetry`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_rag_telemetry.md](architecture_nodes/API_rag_telemetry.md) |
| `API_rag_tenant` | **API: `POST /api/rag/tenant`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_rag_tenant.md](architecture_nodes/API_rag_tenant.md) |
| `API_revalidate` | **API: `POST /api/revalidate`** | 🟢 `MEDIUM` | `SERVICE_ROLE` | [architecture_nodes/API_revalidate.md](architecture_nodes/API_revalidate.md) |
| `API_scoping_estimate_timeline` | **API: `POST /api/scoping/estimate-timeline`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_scoping_estimate_timeline.md](architecture_nodes/API_scoping_estimate_timeline.md) |
| `API_scoping_parse_intent` | **API: `POST /api/scoping/parse-intent`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_scoping_parse_intent.md](architecture_nodes/API_scoping_parse_intent.md) |
| `API_scoping_parse_rfp` | **API: `POST /api/scoping/parse-rfp`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_scoping_parse_rfp.md](architecture_nodes/API_scoping_parse_rfp.md) |
| `API_scoping_validate_promo` | **API: `POST /api/scoping/validate-promo`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/API_scoping_validate_promo.md](architecture_nodes/API_scoping_validate_promo.md) |
| `API_skills` | **API: `GET /api/skills` & `[id]`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_skills.md](architecture_nodes/API_skills.md) |
| `API_terminal_qrcode` | **API: `POST /api/terminal/qrcode`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_terminal_qrcode.md](architecture_nodes/API_terminal_qrcode.md) |
| `API_terminal_query` | **API: `POST /api/terminal/query`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_terminal_query.md](architecture_nodes/API_terminal_query.md) |
| `API_terminal_snake_leaderboard` | **API: `GET /api/terminal/snake-leaderboard`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/API_terminal_snake_leaderboard.md](architecture_nodes/API_terminal_snake_leaderboard.md) |
| `API_webhooks_razorpay` | **API: `POST /api/webhooks/razorpay`** | 🔴 `CRITICAL` | `PUBLIC` | [architecture_nodes/API_webhooks_razorpay.md](architecture_nodes/API_webhooks_razorpay.md) |
| `Proxy_telemetry` | **Proxy: `src/proxy.ts` (Next.js 16 Edge Proxy & Telemetry)** | 🔴 `CRITICAL` | `SERVICE_ROLE` | [architecture_nodes/Proxy_telemetry.md](architecture_nodes/Proxy_telemetry.md) |
| `Route_auth_callback` | **Route: `/auth/callback` (PKCE OAuth Handler)** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/Route_auth_callback.md](architecture_nodes/Route_auth_callback.md) |

### 🔹 5. CORE DOMAIN & GUARDS: CPQ Pricing, Auth & PDF Suite (11 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Context_AuthContext` | **Context: `AuthContext.tsx` (Universal Supabase Auth)** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/Context_AuthContext.md](architecture_nodes/Context_AuthContext.md) |
| `Context_ThemeProvider_Lenis` | **Context: `ThemeProvider.tsx` & `LenisProvider.tsx`** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Context_ThemeProvider_Lenis.md](architecture_nodes/Context_ThemeProvider_Lenis.md) |
| `Lib_commission` | **Lib: `commission.ts` (Sales Partner Commission SSoT)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_commission.md](architecture_nodes/Lib_commission.md) |
| `Lib_data` | **Lib: `data.ts` (Cached Supabase Fetch Layer)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_data.md](architecture_nodes/Lib_data.md) |
| `Lib_markdown` | **Lib: `markdown.ts` (Blog Parser & Metadata Extractor)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_markdown.md](architecture_nodes/Lib_markdown.md) |
| `Lib_pricing` | **Lib: `pricing.ts` (Commercial Pricing SSoT)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Lib_pricing.md](architecture_nodes/Lib_pricing.md) |
| `Lib_rag_client` | **Lib: `rag-client.ts` (Retriever Backend Bridge)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_rag_client.md](architecture_nodes/Lib_rag_client.md) |
| `Lib_rateLimit` | **Lib: `rateLimit.ts` (Universal Edge AI Token Shield)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_rateLimit.md](architecture_nodes/Lib_rateLimit.md) |
| `Lib_sessionVerify` | **Lib: `sessionVerify.ts` (Universal PKCE Session Guard)** | 🔴 `CRITICAL` | `BEARER_JWT` | [architecture_nodes/Lib_sessionVerify.md](architecture_nodes/Lib_sessionVerify.md) |
| `Lib_skills` | **Lib: `skills.ts` (Persona Filter & Narrative Mapper)** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/Lib_skills.md](architecture_nodes/Lib_skills.md) |
| `UI_CommercialPDFSuite` | **UI: `pdfTheme.ts`, `pdfFonts.ts` & React-PDF Exporters** | 🟢 `MEDIUM` | `PUBLIC` | [architecture_nodes/UI_CommercialPDFSuite.md](architecture_nodes/UI_CommercialPDFSuite.md) |

### 🔹 6. RETRIEVER COGNITIVE CORE: Guardrails, Search & FastAPIs (53 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Engine_Autonomous_Metaprogrammer` | **Engine: Autonomous Metaprogrammer & Capability Studio (Milestone 97)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Autonomous_Metaprogrammer.md](architecture_nodes/Engine_Autonomous_Metaprogrammer.md) |
| `Engine_ColBERT_Late_Interaction` | **Engine Specification: PyTorch Late-Interaction ColBERT Token-Level MaxSim Engine (Milestone 80)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_ColBERT_Late_Interaction.md](architecture_nodes/Engine_ColBERT_Late_Interaction.md) |
| `Engine_ColBERT_MaxSim_Reranker` | **Engine: Late-Interaction (ColBERT) Token-Level MaxSim Reranker (Milestone 70)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_ColBERT_MaxSim_Reranker.md](architecture_nodes/Engine_ColBERT_MaxSim_Reranker.md) |
| `Engine_Confidential_Micro_Enclave` | **Engine: Zero-Trust Micro-Enclave Encryption & Hardware KMS Remote Attestation (Milestone 101)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Confidential_Micro_Enclave.md](architecture_nodes/Engine_Confidential_Micro_Enclave.md) |
| `Engine_Contextual_Retrieval` | **Engine: Pre-Chunk Contextual Retrieval Ingestion Engine (Milestone 69)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Contextual_Retrieval.md](architecture_nodes/Engine_Contextual_Retrieval.md) |
| `Engine_Corrective_RAG_Agentic_Loop` | **Engine: Corrective RAG (CRAG) & Agentic Reflection Loop (Milestone 71)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Corrective_RAG_Agentic_Loop.md](architecture_nodes/Engine_Corrective_RAG_Agentic_Loop.md) |
| `Engine_DSPy_Prompt_Compilation` | **Engine: DSPy Declarative Prompt Compilation (Milestone 92)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_DSPy_Prompt_Compilation.md](architecture_nodes/Engine_DSPy_Prompt_Compilation.md) |
| `Engine_Digital_SOW_Escrow_Freeze` | **Engine: Digital SOW & 50% Escrow Freeze** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Digital_SOW_Escrow_Freeze.md](architecture_nodes/Engine_Digital_SOW_Escrow_Freeze.md) |
| `Engine_Docling_Layout_OCR` | **Engine: Docling Layout OCR & Multimodal Ingestion (Milestone 42)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Docling_Layout_OCR.md](architecture_nodes/Engine_Docling_Layout_OCR.md) |
| `Engine_Durable_Workflow_Execution` | **Engine: Durable Asynchronous Execution & Background AI Workflow Engine (Milestone 95)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Durable_Workflow_Execution.md](architecture_nodes/Engine_Durable_Workflow_Execution.md) |
| `Engine_Embedding_Space_Projection` | **Engine Specification: Scikit-Learn 2D/3D Embedding Space Projection Pipeline & SaaS Studio 3D Vector Explorer (Milestone 82)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Embedding_Space_Projection.md](architecture_nodes/Engine_Embedding_Space_Projection.md) |
| `Engine_GraphRAG_Topology` | **Engine: GraphRAG Knowledge Graph & Dynamic Topology** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_GraphRAG_Topology.md](architecture_nodes/Engine_GraphRAG_Topology.md) |
| `Engine_LLM_Gateway_Smart_Router` | **Engine: Enterprise LLM Gateway & Smart Router (Milestone 93)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_LLM_Gateway_Smart_Router.md](architecture_nodes/Engine_LLM_Gateway_Smart_Router.md) |
| `Engine_LlamaGuard_Guardrails` | **Engine: Llama Guard 3 Prompt Injection Filter (Milestone 40)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_LlamaGuard_Guardrails.md](architecture_nodes/Engine_LlamaGuard_Guardrails.md) |
| `Engine_LongLLMLingua_Compression` | **Engine: LongLLMLingua Context Compression (Milestone 49)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_LongLLMLingua_Compression.md](architecture_nodes/Engine_LongLLMLingua_Compression.md) |
| `Engine_MultiAgent_Consensus` | **Engine: Multi-Agent Consensus & Reflection Loops (Milestone 48)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_MultiAgent_Consensus.md](architecture_nodes/Engine_MultiAgent_Consensus.md) |
| `Engine_MultiCloud_Replication` | **Engine: Multi-Cloud Active-Active LibSQL Failover (Milestone 99)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_MultiCloud_Replication.md](architecture_nodes/Engine_MultiCloud_Replication.md) |
| `Engine_NeMo_Conversational_Guardrails` | **Engine: NVIDIA NeMo Guardrails & Conversational Safety Rails (Milestone 94)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_NeMo_Conversational_Guardrails.md](architecture_nodes/Engine_NeMo_Conversational_Guardrails.md) |
| `Engine_OTel_AutoInstrumentation` | **Engine: Full-Stack OpenTelemetry Auto-Instrumentation (Milestone 75)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_OTel_AutoInstrumentation.md](architecture_nodes/Engine_OTel_AutoInstrumentation.md) |
| `Engine_RLM_Python_REPL` | **Engine: RLM Python REPL Sandbox (Milestone 47)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_RLM_Python_REPL.md](architecture_nodes/Engine_RLM_Python_REPL.md) |
| `Engine_RLM_Python_REPL_Studio` | **Engine: Interactive RLM Python REPL Sandbox Studio (Milestone 72)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_RLM_Python_REPL_Studio.md](architecture_nodes/Engine_RLM_Python_REPL_Studio.md) |
| `Engine_RealTime_Alerting_Telemetry` | **Engine: Real-Time Telemetry Live Aggregations & SLA Webhook Alerting (Milestone 76)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_RealTime_Alerting_Telemetry.md](architecture_nodes/Engine_RealTime_Alerting_Telemetry.md) |
| `Engine_Semantic_NLI_Evaluator` | **Engine: Semantic NLI & SLM-as-a-Judge Online Hallucination Engine (Milestone 74)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Semantic_NLI_Evaluator.md](architecture_nodes/Engine_Semantic_NLI_Evaluator.md) |
| `Engine_Serverless_GPU_vLLM_Serving` | **Engine: Serverless Dedicated GPU Serving & Dynamic vLLM / LoRA Pipeline (Milestone 96)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Serverless_GPU_vLLM_Serving.md](architecture_nodes/Engine_Serverless_GPU_vLLM_Serving.md) |
| `Engine_Sovereign_Edge_Sync` | **Engine: Sovereign Edge Vector Sync & CRDT SQLite Swarm (Milestone 98)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Sovereign_Edge_Sync.md](architecture_nodes/Engine_Sovereign_Edge_Sync.md) |
| `Engine_Sovereign_Edge_Voice` | **Engine: Sovereign Edge Voice Streaming & WebRTC (Milestone 100)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Sovereign_Edge_Voice.md](architecture_nodes/Engine_Sovereign_Edge_Voice.md) |
| `Engine_Sparse_Dense_LoRA` | **Sparse-Dense Hybrid Engine & Contrastive LoRA Domain Adapters** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Sparse_Dense_LoRA.md](architecture_nodes/Engine_Sparse_Dense_LoRA.md) |
| `Engine_Visual_Grounding_Observability` | **Engine: Visual Claim-by-Claim Grounding Diff & Retriever Admin Observability Cockpit (Milestone 78)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Visual_Grounding_Observability.md](architecture_nodes/Engine_Visual_Grounding_Observability.md) |
| `Retriever_API_v1_admin` | **Retriever API: `apps/api/src/routers/admin.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_admin.md](architecture_nodes/Retriever_API_v1_admin.md) |
| `Retriever_API_v1_agentic` | **Retriever API: `apps/api/src/routers/agentic.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_agentic.md](architecture_nodes/Retriever_API_v1_agentic.md) |
| `Retriever_API_v1_auth` | **Retriever API: `apps/api/src/routers/auth.py`** | 🔴 `CRITICAL` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_auth.md](architecture_nodes/Retriever_API_v1_auth.md) |
| `Retriever_API_v1_chat` | **Retriever API: `POST /v1/chat`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_chat.md](architecture_nodes/Retriever_API_v1_chat.md) |
| `Retriever_API_v1_consensus` | **Retriever API: `apps/api/src/routers/consensus.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_consensus.md](architecture_nodes/Retriever_API_v1_consensus.md) |
| `Retriever_API_v1_documents` | **Retriever API: `POST /v1/documents`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_documents.md](architecture_nodes/Retriever_API_v1_documents.md) |
| `Retriever_API_v1_edge` | **Retriever API: `apps/api/src/routers/edge.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_edge.md](architecture_nodes/Retriever_API_v1_edge.md) |
| `Retriever_API_v1_enclave` | **Retriever API: `apps/api/src/routers/enclave.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_enclave.md](architecture_nodes/Retriever_API_v1_enclave.md) |
| `Retriever_API_v1_estimation` | **Retriever API: `apps/api/src/routers/estimation.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_estimation.md](architecture_nodes/Retriever_API_v1_estimation.md) |
| `Retriever_API_v1_gateway` | **Retriever API: `apps/api/src/routers/gateway.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_gateway.md](architecture_nodes/Retriever_API_v1_gateway.md) |
| `Retriever_API_v1_health` | **Retriever API: `apps/api/src/routers/health.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_health.md](architecture_nodes/Retriever_API_v1_health.md) |
| `Retriever_API_v1_integrations` | **Retriever API: `apps/api/src/routers/integrations.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_integrations.md](architecture_nodes/Retriever_API_v1_integrations.md) |
| `Retriever_API_v1_multicloud` | **Retriever API: `apps/api/src/routers/multicloud.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_multicloud.md](architecture_nodes/Retriever_API_v1_multicloud.md) |
| `Retriever_API_v1_payments` | **Retriever API: `apps/api/src/routers/payments.py`** | 🔴 `CRITICAL` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_payments.md](architecture_nodes/Retriever_API_v1_payments.md) |
| `Retriever_API_v1_persona` | **Retriever API: `apps/api/src/routers/persona.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_persona.md](architecture_nodes/Retriever_API_v1_persona.md) |
| `Retriever_API_v1_pricing` | **Retriever API: `apps/api/src/routers/pricing.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_pricing.md](architecture_nodes/Retriever_API_v1_pricing.md) |
| `Retriever_API_v1_prompts` | **Retriever API: `apps/api/src/routers/prompts.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_prompts.md](architecture_nodes/Retriever_API_v1_prompts.md) |
| `Retriever_API_v1_rlm` | **Retriever API: `apps/api/src/routers/rlm.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_rlm.md](architecture_nodes/Retriever_API_v1_rlm.md) |
| `Retriever_API_v1_scaffold` | **Retriever API: `apps/api/src/routers/scaffold.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_scaffold.md](architecture_nodes/Retriever_API_v1_scaffold.md) |
| `Retriever_API_v1_search` | **Retriever API: `POST /v1/search`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_search.md](architecture_nodes/Retriever_API_v1_search.md) |
| `Retriever_API_v1_security_compression` | **Retriever API: `apps/api/src/routers/security_compression.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_security_compression.md](architecture_nodes/Retriever_API_v1_security_compression.md) |
| `Retriever_API_v1_serverless_gpu` | **Retriever API: `apps/api/src/routers/serverless_gpu.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_serverless_gpu.md](architecture_nodes/Retriever_API_v1_serverless_gpu.md) |
| `Retriever_API_v1_tenant` | **Retriever API: `apps/api/src/routers/tenant.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_tenant.md](architecture_nodes/Retriever_API_v1_tenant.md) |
| `Retriever_API_v1_voice` | **Retriever API: `apps/api/src/routers/voice.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_voice.md](architecture_nodes/Retriever_API_v1_voice.md) |
| `Retriever_API_v1_workflow` | **Retriever API: `apps/api/src/routers/workflow.py`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Retriever_API_v1_workflow.md](architecture_nodes/Retriever_API_v1_workflow.md) |

### 🔹 7. ASYNC INFRASTRUCTURE: Workers, Brokers & Security Envelopes (3 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Engine_Celery_RabbitMQ` | **Engine: Celery & RabbitMQ Distributed Async Queue** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Celery_RabbitMQ.md](architecture_nodes/Engine_Celery_RabbitMQ.md) |
| `Engine_Dogfooding_Tenant_prateeq_scoping` | **Engine: Dogfooding Tenant (`prateeq_scoping`)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Dogfooding_Tenant_prateeq_scoping.md](architecture_nodes/Engine_Dogfooding_Tenant_prateeq_scoping.md) |
| `Engine_Envelope_Encryption` | **Engine: Zero-Trust Envelope Encryption (Milestone 50)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Engine_Envelope_Encryption.md](architecture_nodes/Engine_Envelope_Encryption.md) |

### 🔹 8. DUAL PERSISTENCE: Supabase Relational + pgvector HNSW Store (12 Nodes)

| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |
| :--- | :--- | :---: | :---: | :--- |
| `Schema_blog_posts` | **Schema: `blog_posts` (Technical Articles)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_blog_posts.md](architecture_nodes/Schema_blog_posts.md) |
| `Schema_client_change_orders` | **Schema: `client_change_orders`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_client_change_orders.md](architecture_nodes/Schema_client_change_orders.md) |
| `Schema_client_scopes` | **Schema: `client_scopes`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_client_scopes.md](architecture_nodes/Schema_client_scopes.md) |
| `Schema_invoices` | **Schema: `invoices`** | 🔴 `CRITICAL` | `PUBLIC` | [architecture_nodes/Schema_invoices.md](architecture_nodes/Schema_invoices.md) |
| `Schema_outreach_leads` | **Schema: `outreach_leads` (Autonomous CRM)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_outreach_leads.md](architecture_nodes/Schema_outreach_leads.md) |
| `Schema_page_visits` | **Schema: `page_visits` (Visitor Telemetry)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_page_visits.md](architecture_nodes/Schema_page_visits.md) |
| `Schema_pgvector_store` | **Schema: `pgvector_embeddings` (HNSW Vector Index)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_pgvector_store.md](architecture_nodes/Schema_pgvector_store.md) |
| `Schema_projects` | **Schema: `projects` (Portfolio Work)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_projects.md](architecture_nodes/Schema_projects.md) |
| `Schema_promo_codes` | **Schema: `promo_codes`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_promo_codes.md](architecture_nodes/Schema_promo_codes.md) |
| `Schema_rag_tenants` | **Schema: `rag_tenants` (Multi-Tenant Workspaces)** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_rag_tenants.md](architecture_nodes/Schema_rag_tenants.md) |
| `Schema_retriever_inference_logs` | **Schema: `inference_logs` & `chat_feedback`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_retriever_inference_logs.md](architecture_nodes/Schema_retriever_inference_logs.md) |
| `Schema_skills` | **Schema: `skills` & `certificates`** | 🟠 `HIGH` | `PUBLIC` | [architecture_nodes/Schema_skills.md](architecture_nodes/Schema_skills.md) |
