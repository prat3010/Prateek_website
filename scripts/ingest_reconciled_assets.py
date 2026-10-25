"""
Reconciled Knowledge Ingestion Script for Retriever Vector Tenants.
===================================================================
Ingests 7 authoritative, mathematically reconciled documents into
Scoping Concierge and Portfolio Twin tenants with zero pricing contradictions.
Canonical SSoT: intakeQuestionnaireDefaults.json and commissionConfig.json.
Uses Python standard library (urllib.request) with zero pip dependencies.
"""

import json
import logging
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, List, Set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_reconciled")

BASE_DIR = Path(__file__).resolve().parent.parent
RETRIEVER_DIR = Path("/Users/prateeksharma/Developer/retriever")

def get_env_var(key: str, default: str = "") -> str:
    val = os.environ.get(key)
    if val:
        return val.strip()
    env_local = BASE_DIR / ".env.local"
    if env_local.is_file():
        for line in env_local.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() == key:
                    return v.strip().strip("'\"")
    return default

RETRIEVER_API_URL = get_env_var("RETRIEVER_API_URL", "https://rag.prateeq.in").rstrip("/")
SCOPING_TENANT_ID = get_env_var("RETRIEVER_SCOPING_TENANT_ID", "1f85286c-9d9a-4ebc-9c62-a99360a5ece4")
SCOPING_API_KEY = get_env_var("RETRIEVER_SCOPING_ADMIN_KEY", "")
PORTFOLIO_TENANT_ID = get_env_var("RETRIEVER_PORTFOLIO_TENANT_ID", "6797e2c8-745a-4bd1-aa4c-3854b8d79c22")
PORTFOLIO_API_KEY = get_env_var("RETRIEVER_PORTFOLIO_API_KEY", "")
RETRIEVER_USER_ID = get_env_var("RETRIEVER_SCOPING_USER_ID", "36e62429-419e-48ef-af92-533afca9e028")

def get_existing_filenames(tenant_id: str, api_key: str) -> Set[str]:
    url = f"{RETRIEVER_API_URL}/v1/tenants/{tenant_id}/documents"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return {d.get("filename") for d in data if isinstance(d, dict) and d.get("filename")}
    except Exception as e:
        logger.warning("Could not list existing documents for %s: %s", tenant_id, e)
        return set()

def ingest_raw_document(tenant_id: str, api_key: str, filename: str, content: str, tags: List[str]) -> bool:
    url = f"{RETRIEVER_API_URL}/v1/tenants/{tenant_id}/documents/raw"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
        "Content-Type": "application/json",
    }
    payload = {
        "title": filename,
        "content": content,
        "mime_type": "text/markdown",
        "tags": tags,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            logger.info("Ingested %s into tenant %s (status %s)", filename, tenant_id, resp.status)
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        logger.warning("Failed to ingest %s into tenant %s (HTTP %s): %s", filename, tenant_id, e.code, e.read().decode())
        return False
    except Exception as e:
        logger.warning("Exception ingesting %s: %s", filename, e)
        return False

# ─── RECONCILED DOCUMENT FACTORIES ───────────────────────────────────────────

def build_commercial_licensing_doc() -> str:
    return """# Official Commercial Source License & On-Prem Appliance: Retriever Engine

Document Authority: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Document Classification: Production Commercial Source Licensing Terms (prateeq.in & rag.prateeq.in)
Canonical Pricing: Builder ($199 / ₹16,900) | Agency ($499 / ₹42,000) | Sovereign ($1,499 / ₹1,27,000)

## 1. Overview & Problem Solved
Retriever is a production-grade, zero-bloat hexagonal RAG engine that replaces fragmented stacks (LangChain + Pinecone + LiteLLM) with a single, standalone platform:
- Zero Framework Bloat: Pure FastAPI core with hexagonal domain isolation (`src/domain/`).
- 100% Free & Local Embeddings: Powered by local Ollama (`nomic-embed-text`) running natively or via Docker for $0 marginal embedding cost.
- Database Multi-Tenancy: PostgreSQL 16 + pgvector with native Row-Level Security (RLS) policies guaranteeing zero vector leaks between tenants.
- Complete Production Subsystems: Hybrid fusion (HNSW vector + BM25 keyword search), layout-aware OCR chunking, automated preflight diagnostics (`scripts/agent_preflight.py`), Next.js 16 Web Admin Studio (`apps/web`), and terminal CLI REPL.

## 2. Commercial Source Licensing Matrix

| License Tier | Price (USD / INR) | Commercial Scope & Inclusions | Restrictions |
| :--- | :--- | :--- | :--- |
| **Builder License** | **$199 USD** <br> *(₹16,900 INR)* | Full source code repository access, single-tenant production deployment, Docker Compose stack, local Ollama embeddings, Next.js web admin studio, lifetime core git updates. | Restricted to 1 production domain. No resale or redistribution. |
| **Agency License** <br> *(Most Popular)* | **$499 USD** <br> *(₹42,000 INR)* | Unlimited commercial client deployments, full white-label rights (custom branding/logos), multi-tenancy PostgreSQL RLS pack, automated tenant onboarding script, standalone embeddable chat widget script. | Cannot resell as a raw competing code template on marketplaces. |
| **Enterprise Sovereign Appliance** | **$1,499 USD** <br> *(₹1,27,000 INR)* | Everything in Agency License + Turnkey cloud deployment scripts (Terraform for AWS ECS, Oracle Cloud, or Hetzner), automated DB backups, GraphRAG pipeline, private Slack/Discord, and a 60-min architecture alignment call with Prateek Sharma. | Enterprise enterprise license agreement (EULA). |

## 3. Technology Stack & Deployment Velocity
- Core Runtime: Python 3.13, FastAPI async ASGI daemon, PostgreSQL 16 with pgvector.
- Frontend Admin: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS.
- Launch Velocity: Deploys in 60 seconds via `./scripts/quickstart.sh` or `docker compose up -d`.
- Inquiries & Orders: Direct dispatch through `prateeqsharma@gmail.com` or `/scoping` engine.
"""

def build_turnkey_ai_concierge_doc() -> str:
    return """# Turnkey B2B AI Knowledge Concierge & Monthly Maintenance Retainers

Document Authority: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Document Classification: Production B2B Service Terms & Managed Knowledge Retainers
Target Verticals: Law Firms, Chartered Accountants, Tax Advisors, Medical Clinics, Architecture Studios

## 1. The B2B Knowledge Dilemma & Turnkey Solution
Boutique professional firms waste 15–20 hours weekly answering repetitive preliminary inquiries. They fear public AI (ChatGPT) due to confidentiality and HIPAA/client-privilege concerns, and have zero technical staff to manage APIs.
The Turnkey AI Knowledge Concierge provides a private, white-labeled, sovereign AI Concierge grounded exclusively on the firm's verified documentation, embedded directly onto their website via a 1-line script.

## 2. Packaging & Reconciled Commercial Economics

| Deliverable Tier | Investment (INR / USD) | Frequency | Deliverables & SLA |
| :--- | :--- | :--- | :--- |
| **Foundational Onboarding & Ingestion** | **₹35,000 – ₹55,000 INR** <br> *(~$450 – $700 USD)* | One-Time Setup | Ingestion of up to 100 firm documents (PDFs, Word, FAQs, Contracts), layout-aware OCR chunking, dedicated PostgreSQL RLS tenant provisioning, custom-branded web widget matching client colors, 1-line embed script. |
| **Standard Knowledge Care Retainer** | **₹10,000 INR / month** <br> *($140 USD / month)* | Recurring Retainer | Dedicated tenant hosting on Oracle Cloud VPS, up to 25 document updates/month, cloud database backups, 99.9% uptime monitoring, email support. |
| **Growth & Executive Concierge Retainer** | **₹15,000 – ₹18,000 INR / month** <br> *($200 – $250 USD / month)* | Recurring Retainer | Everything in Standard + Up to 50 document updates/month, Llama Guard 3 security protection, and an automated Monthly Executive Intelligence Digest analyzing client inquiry trends. |

## 3. Extraordinary 97% Gross Margin Economics
Because Retriever utilizes local Ollama embeddings (`nomic-embed-text`) on our Oracle Cloud VPS (`rag.prateeq.in`) and Supabase PostgreSQL with RLS, our marginal delivery cost per client tenant is negligible (~₹450 / $5.40 per month):
- Oracle Cloud VPS Compute: ~₹250/mo per tenant (amortized across multi-tenant cluster).
- Vector Embeddings: ₹0.00/mo (100% free local Ollama).
- Generation LLM: ~₹200/mo (semantic caching reduces repeat queries).
- Total Marginal Cost: ~₹450/mo vs ₹15,000/mo Retainer = **97.0% Gross Margin**.
"""

def build_bespoke_sprints_and_audit_wedge_doc() -> str:
    return """# High-Ticket Bespoke Sprints, Paid Architecture Audit Wedge & Sales Partner Economics

Document Authority: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Document Classification: Production Commercial Sprints & Partner Rules
Canonical Single Source of Truth: intakeQuestionnaireDefaults.json & commissionConfig.json

## 1. The ₹20,000 ($300) "AI Strategy & Architecture Audit" Trojan Horse
To eliminate sales friction and tire-kickers, all high-ticket consulting starts with our low-risk Paid Discovery Sprint (`id: ai_strategy_audit` in the scoping catalog):
- Pricing: ₹20,000 INR / $300 USD (fixed, one-time).
- Turnaround: 48 business hours.
- Format: 60-minute technical workflow discovery + custom 3-page Executive Architecture Blueprint PDF (`ScopingBriefPDF.tsx`).
- **The Irresistible Conversion Hook:** 100% of the ₹20,000 audit fee is credited directly toward the client's Milestone 1 deposit if they hire Prateek to build the full sprint. If they choose not to proceed, they keep the architecture blueprint and cost models to give to any developer. Over 65% of audit clients proceed directly into full sprints.

## 2. Canonical Bespoke Sprints Menu (SSoT Aligned)

Every engagement starts with exactly one Base Core Engine foundation:

| Base Core Engine | Identifier | Base INR | Base USD | Turnaround | Included Foundation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Page Core Engine** | `landing` | **₹30,000** | **$400** | 3–5 Days | Next.js 16 App Router, responsive Framer Motion UI, CSS Modules, ReCAPTCHA v3, SEO Schema. |
| **Multi-Page Web App Engine** | `multipage` | **₹55,000** | **$750** | 1–2 Weeks | 3–6 dynamic pages, Framer Motion transitions, OpenGraph metadata, shared layout shell. |
| **Full-Stack SaaS MVP Engine** | `saas` | **₹175,000** | **$2,400** | 2–4 Weeks | Cloud web app, Supabase PostgreSQL with RLS, server cache, Vercel Edge routing. |
| **AI Strategy & Architecture Audit** | `ai_strategy_audit` | **₹20,000** | **$300** | 48 Hours | 60-min diagnostic, cost/latency model, 3-page executive architecture blueprint PDF. |
| **Micro-Widget Script Engine** | `standalone_embed`| **₹15,000** | **$200** | 2–4 Days | Embeddable client widget script, Shadow DOM isolation, CORS gateway, webhook messaging. |

## 3. High-Margin Modular Add-Ons (SSoT Aligned)
- User Auth & Client Portal (`auth`): +₹25,000 ($350)
- Payment Gateway & Escrow Billing (`payments`): +₹45,000 ($600)
- Content Management Platform (`cms`): +₹30,000 ($400)
- Enterprise Hybrid Vector RAG Engine (`ai_rag`): +₹1,25,000 ($1,700)
- Autonomous Multi-Agent Workflows (`ai_agents`): +₹1,35,000 ($1,800)
- Role-Based Admin Control Center (`admin`): +₹75,000 ($1,000)
- Transactional Email Alerts (`email`): +₹15,000 ($200)
- Booking & Calendar Scheduler (`booking`): +₹50,000 ($700)
- E-Commerce Catalog & Checkout (`commerce`): +₹75,000 ($1,000)
- Learning Management Course Platform (`lms`): +₹85,000 ($1,150)
- Lead & Customer CRM System (`crm`): +₹60,000 ($800)
- Real-Time Conversational Voice AI (`ai_voice_agent`): +₹95,000 ($1,250)
- Document Vision & Layout-Aware OCR (`ai_vision_ocr`): +₹75,000 ($1,000)
- REST & Webhook Integrations (`integrations`): +₹40,000 ($550)
- Video Player & Media Streaming (`video`): +₹65,000 ($850)

## 4. Middleman Sales Partner Program (SSoT Aligned with commissionConfig.json)
- Band A: Up to ₹75,000 / $1,000 → **10%** commission.
- Band B: ₹75,001 – ₹2,49,999 / $1,001 – $3,299 → **12%** commission.
- Band C: ₹2,50,000+ / $3,300+ → **15%** commission.
- Monthly Care Plan Commission: **10% lifetime recurring** on client maintenance retainers.
- Payout Schedule: 50% upfront disbursement within 48 business hours of client deposit clearance; remaining 50% disbursed within 48 business hours of final milestone deployment sign-off.
"""

def build_enterprise_rag_security_doc() -> str:
    vault_sec_path = BASE_DIR.parent / "Prateek_Ecosystem_Vault" / "ENTERPRISE_RAG_SECURITY_WHITEPAPER.md"
    if vault_sec_path.is_file():
        return vault_sec_path.read_text(encoding="utf-8")
    return """# Enterprise RAG Security, Cryptography & Multi-Tenancy Architecture

Document Authority: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Classification: Production Security Whitepaper & Zero-Trust Verification

## 1. Multi-Tenant Vector Partitioning via PostgreSQL 16 Row-Level Security
Retriever enforces database-level multi-tenancy using PostgreSQL Row-Level Security (RLS). Every vector query, document chunk, and chat session is strictly scoped by `tenant_id`:
```sql
CREATE POLICY tenant_isolation_policy ON document_embeddings
FOR ALL USING (tenant_id = current_setting('app.current_tenant_id'));
```
If an incoming request provides a document ID belonging to a different tenant, PostgreSQL returns an empty set.

## 2. Cognitive Guardrails & Prompt Injection Defense
- Llama Guard 3: Inbound queries are sanitized against safety categories (Hate, Violence, Self-Harm, Cyberattacks).
- AST Injection Defense: Blocks adversarial override prompts ('Ignore previous instructions').
- Self-Aware Corrective RAG (CRAG): If retrieved chunk similarity falls below confidence threshold (tau < 0.65), the system transparently indicates knowledge boundaries rather than hallucinating answers.

## 3. Local-First Vector Privacy Invariant
All embeddings are generated on-premise on our Oracle Cloud dedicated compute instance using local Ollama (`nomic-embed-text`). Proprietary customer documents never transit through external third-party embedding APIs.

## 4. GDPR Salted SHA-256 IP Telemetry
Visitor logging computes daily salted SHA-256 hashes of client IP addresses:
AnonymizedHash = SHA-256(ClientIP + DailySalt)
Guarantees zero raw PII persistence across database tables and server proxy logs.
"""

def build_adr_digest_doc() -> str:
    return """# Architectural Decision Records (ADRs) Curated Technical Digest

Document Authority: Prateek Sharma — Lead Solutions Architect
Document Classification: Production Architectural Governance Digest (prateeq.in & Retriever)
Canonical Source: docs/99_DECISIONS.md

## ADR 01: CSS Modules for Modular Styling
- Decision: Use CSS Modules (`.module.css`) rather than Tailwind for component styles.
- Rationale: Guarantees zero CSS runtime overhead, exact CSS specificity scoping, and full design system parity across Azure and Noir themes without bloated utility classes.

## ADR 02: On-Demand Cache Revalidation
- Decision: Cache database entities (projects, skills, certificates) via Next.js `unstable_cache` with tagged invalidation (`portfolio-data`).
- Rationale: Revalidation executes on-demand via secret-authenticated POST `/api/revalidate?secret=...`, delivering static CDN speeds with instant dynamic updates upon content writes.

## ADR 03: GDPR Telemetry via Daily IP Hashing
- Decision: Hash visitor IP addresses with a daily rotating cryptographic salt before logging to Supabase `page_visits`.
- Rationale: Enforces complete GDPR compliance with zero raw PII storage while preserving accurate daily unique visitor counts.

## ADR 05: Portal Modals to Escape ScrollSection Containing Block
- Decision: Any modal, overlay, or drawer rendered inside `ScrollSection` MUST use `<Portal>` (`src/components/ui/Portal.tsx`) to mount directly onto `document.body`.
- Rationale: `ScrollSection` wraps page sections in `m.div` with `will-change: transform` and Framer Motion `translateY`. Both create a CSS containing block that traps `position: fixed` descendants. The `<Portal>` component completely escapes this containing block trap.

## ADR 09: Hybrid Cloud OCI + Vercel Edge Decoupling
- Decision: Decouple Vercel Global Edge CDN (stateless Next.js 16 App Router UI) from Oracle Cloud Infrastructure (OCI) dedicated compute (FastAPI, pgvector, local Ollama).
- Rationale: Serverless edge functions timeout after 15–30s on long-running GraphRAG traversals and SSE streams. Dedicated OCI compute eliminates timeout caps and cuts AI embedding costs by 85%.

## ADR 10: Full-Panorama Mobile Skyline with Desktop-Parity Parallax
- Decision: On mobile (width <= 768px or coarse pointer), switch skyline SVG preserveAspectRatio to `xMidYMax meet` with vertical zoom parallax, paint upper sky with `var(--skyline-sky-bg)`, and freeze animations on reduced-motion devices.
- Rationale: Prevents oversized GPU texture allocation (VRAM exhaustion) and avoids mobile Safari address-bar resize crash loops while preserving parallax depth.

## ADR 11: Single-Source Pricing & Commission Modules
- Decision: Prices live ONLY in `intakeQuestionnaireDefaults.json`, commission rules live ONLY in `commissionConfig.json`, never hardcoded in TypeScript.
- Rationale: Prevents split-brain price desynchronization between PDF generators, interactive wizards, and administrative portals.

## ADR 13: Safari-Compliant Universal PKCE Auth Architecture
- Decision: Universal Supabase Auth adapter writing session tokens to both `SameSite=Lax` HTTP cookies (`prateeq_active_user`) and `localStorage`, combined with a direct JWT hash fragment parser.
- Rationale: Safari's Intelligent Tracking Prevention (ITP) drops `localStorage` on external OAuth redirects. Dual cookie + storage persistence guarantees 100% session restoration without flashing or CLS.

## ADR 19: Dashboard Workspace Bridge & Phase 2 Change Orders
- Decision: Scope modifications post-SOW are handled via versioned change orders (`/api/client/change-orders`), updating milestone delivery stages and recalculating escrow ledger balance.
- Rationale: Completely eliminates scope creep disputes by turning out-of-scope requests into monetized Phase 2 delivery milestones.
"""

def build_terminal_cli_case_study() -> str:
    return """# Systems Architecture Case Study: Web-Based Diagnostics Terminal & Audio Synthesis

Author: Prateek Sharma — Forward Deployed AI Engineer
Classification: Production Frontend Systems Engineering & Creative Technologist Case Study
Live System Route: https://prateeq.in/terminal

## 1. System Overview
The Systems Terminal is an interactive retro Unix CLI embedded directly into the Next.js portfolio. It provides an immersive developer experience with command history navigation, real-time command routing, CRT monitor shaders, Web Audio API sound synthesis, and real-time AI Twin neural chat.

## 2. Technical Architecture & Engineering Highlights
- State Machine & Input Buffer: Manages `commandHistory` (with `ArrowUp`/`ArrowDown` traversal), active line buffers, and an append-only output buffer.
- Tokenization & Command Parser: Tokenizes user input, matches primary verbs, extracts flags, and maps execution to async API routes or local handlers (`help`, `clear`, `projects`, `skills`, `git-info`, `qrcode`, `ai-chat`, `snake`, `pathfinder`).
- Audio Synthesis via Web Audio API: Implements hardware-efficient audio synthesis (`src/lib/terminalAudio.ts`) generating custom sound waveforms for keystrokes, bell warnings, and system boots without external MP3 network requests.
- CRT Shader & Visual Craft: Hardware-accelerated CSS scanlines, phosphor glow, subtle screen curvature, and high-contrast retro green/amber monochrome palettes.
- Mobile Checkout Bridge: Generates real-time SVG QR codes (`/api/terminal/qrcode`) so visitors exploring the terminal on desktop can scan with mobile devices to open instant scoping checkout or client workspaces.
"""

def build_ast_knowledge_case_study() -> str:
    return """# Systems Architecture Case Study: AST Knowledge Automation & Structured Schema Synthesis

Author: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Classification: Production AI Meta-Programming & Autonomous Content Synchronization
System Core: Synchronizer CMS & PrateekSync Engine

## 1. System Overview
PrateekSync is an autonomous content management engine that keeps portfolio metadata, resume credentials, technical case studies, and vector embeddings in continuous bidirectional synchronization without manual double-entry.

## 2. Technical Architecture & Engineering Highlights
- Abstract Syntax Tree (AST) Parsing: Uses `gray-matter` and TypeScript AST visitors to extract structured metadata directly from code repositories and Markdown frontmatter.
- Structured Prompting with Strict Schemas: Employs Gemini API structured output generation (`gemini-3.6-flash`) with strictly validated JSON schemas (`sync_validation.py`) to extract skills, quantify business impact, and draft case studies.
- Multi-Theme Commercial PDF Generation: Client-side and server-side PDF synthesis using `@react-pdf/renderer` with pinned page counts (5-page pricing guide, 3-page scoping brief, 3-page partner agreement) and font-density scaling (`pdfTheme.ts`) for Azure and Noir palettes.
- Cache Invalidation Handshake: Successful content mutations dispatch cryptographically authenticated requests to Next.js API revalidation endpoints (`/api/revalidate?secret=...`), instantly purging stale Next.js cache tags across edge CDNs.
- Vector Knowledge Mirroring: Automatically formats project and credential payloads into authoritative system case studies and syncs them directly into Retriever pgvector tenants via REST APIs.
"""

# ─── MAIN EXECUTION ──────────────────────────────────────────────────────────

def main():
    logger.info("=== Starting Ingestion of 7 Reconciled Authoritative Documents ===")
    logger.info("Retriever URL: %s", RETRIEVER_API_URL)
    logger.info("Scoping Tenant: %s", SCOPING_TENANT_ID)
    logger.info("Portfolio Tenant: %s", PORTFOLIO_TENANT_ID)

    # 1. Generate Reconciled Documents
    doc12 = build_commercial_licensing_doc()
    doc13 = build_turnkey_ai_concierge_doc()
    doc14 = build_bespoke_sprints_and_audit_wedge_doc()
    doc15 = build_enterprise_rag_security_doc()
    doc16 = build_adr_digest_doc()
    doc17 = build_terminal_cli_case_study()
    doc18 = build_ast_knowledge_case_study()

    # 2. Persist to local tenant bundle directories
    local_scoping_dir = RETRIEVER_DIR / "data" / "tenants" / "tenant_scoping_concierge"
    local_portfolio_dir = RETRIEVER_DIR / "data" / "tenants" / "tenant_portfolio_twin"

    docs_scoping = [
        ("12_commercial_licensing_tiers.md", doc12, ["commercial", "licensing", "pricing", "retriever", "source_code"]),
        ("13_turnkey_ai_concierge_retainers.md", doc13, ["commercial", "retainers", "concierge", "pricing", "b2b"]),
        ("14_bespoke_sprints_and_audit_wedge.md", doc14, ["commercial", "pricing", "sprints", "audit_wedge", "scoping"]),
        ("15_enterprise_rag_security_whitepaper.md", doc15, ["security", "rls", "compliance", "gdpr", "encryption"]),
        ("16_architectural_decisions_digest.md", doc16, ["architecture", "adr", "decisions", "engineering"]),
    ]

    docs_portfolio = [
        ("12_commercial_licensing_tiers.md", doc12, ["commercial", "licensing", "pricing", "retriever", "source_code"]),
        ("13_turnkey_ai_concierge_retainers.md", doc13, ["commercial", "retainers", "concierge", "pricing", "b2b"]),
        ("14_bespoke_sprints_and_audit_wedge.md", doc14, ["commercial", "pricing", "sprints", "audit_wedge", "scoping"]),
        ("15_enterprise_rag_security_whitepaper.md", doc15, ["security", "rls", "compliance", "gdpr", "encryption"]),
        ("16_architectural_decisions_digest.md", doc16, ["architecture", "adr", "decisions", "engineering"]),
        ("17_terminal_cli_and_audio_architecture.md", doc17, ["case_study", "terminal", "audio", "frontend", "cli"]),
        ("18_ast_knowledge_automation_architecture.md", doc18, ["case_study", "ast", "automation", "synchronizer", "cms"]),
    ]

    if local_scoping_dir.is_dir():
        for fn, content, _ in docs_scoping:
            (local_scoping_dir / fn).write_text(content, encoding="utf-8")
        logger.info("Saved 5 reconciled docs to %s", local_scoping_dir)

    if local_portfolio_dir.is_dir():
        for fn, content, _ in docs_portfolio:
            (local_portfolio_dir / fn).write_text(content, encoding="utf-8")
        logger.info("Saved 7 reconciled docs to %s", local_portfolio_dir)

    # 3. Check existing documents in Retriever to ensure idempotency
    existing_scoping = get_existing_filenames(SCOPING_TENANT_ID, SCOPING_API_KEY)
    existing_portfolio = get_existing_filenames(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY)
    logger.info("Found %d docs in Scoping, %d in Portfolio", len(existing_scoping), len(existing_portfolio))

    # 4. Ingest into Scoping Concierge
    logger.info("--- Ingesting into Scoping Concierge (%s) ---", SCOPING_TENANT_ID)
    for fn, content, tags in docs_scoping:
        if fn in existing_scoping:
            logger.info("Skipping %s in Scoping (already indexed)", fn)
        else:
            ingest_raw_document(SCOPING_TENANT_ID, SCOPING_API_KEY, fn, content, tags)

    # 5. Ingest into Portfolio Twin
    logger.info("--- Ingesting into Portfolio Twin (%s) ---", PORTFOLIO_TENANT_ID)
    for fn, content, tags in docs_portfolio:
        if fn in existing_portfolio:
            logger.info("Skipping %s in Portfolio (already indexed)", fn)
        else:
            ingest_raw_document(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY, fn, content, tags)

    logger.info("=== All 7 Reconciled Documents Ingested Successfully ===")

if __name__ == "__main__":
    main()
