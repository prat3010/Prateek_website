"""
Ingestion & Prompt Alignment Script for Retriever Vector Tenants.
=================================================================
Synchronizes missing authoritative documents into Retriever tenants,
purges stale test fixtures, and updates default system prompts.
Uses Python standard library (urllib.request) with zero pip dependencies.
"""

import json
import logging
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any, Dict, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_knowledge_gap")

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
RETRIEVER_ADMIN_KEY = get_env_var("RETRIEVER_ADMIN_KEY", "")
SCOPING_TENANT_ID = get_env_var("RETRIEVER_SCOPING_TENANT_ID", "1f85286c-9d9a-4ebc-9c62-a99360a5ece4")
SCOPING_API_KEY = get_env_var("RETRIEVER_SCOPING_ADMIN_KEY", "")
PORTFOLIO_TENANT_ID = get_env_var("RETRIEVER_PORTFOLIO_TENANT_ID", "6797e2c8-745a-4bd1-aa4c-3854b8d79c22")
PORTFOLIO_API_KEY = get_env_var("RETRIEVER_PORTFOLIO_API_KEY", "")
RETRIEVER_USER_ID = get_env_var("RETRIEVER_SCOPING_USER_ID", "36e62429-419e-48ef-af92-533afca9e028")

def delete_document(tenant_id: str, api_key: str, document_id: str) -> bool:
    url = f"{RETRIEVER_API_URL}/v1/tenants/{tenant_id}/documents/{document_id}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
    }
    req = urllib.request.Request(url, headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("Deleted document %s in tenant %s (status %s)", document_id, tenant_id, resp.status)
            return resp.status in (200, 204)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            logger.info("Document %s already deleted in tenant %s", document_id, tenant_id)
            return True
        logger.warning("Failed to delete document %s in tenant %s (HTTP %s): %s", document_id, tenant_id, e.code, e.read().decode())
        return False
    except Exception as e:
        logger.warning("Exception deleting document %s: %s", document_id, e)
        return False

def get_existing_filenames(tenant_id: str, api_key: str) -> set:
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

def update_system_prompt(tenant_id: str, admin_key: str, prompt_content: str, prompt_name: str = "default") -> bool:
    url = f"{RETRIEVER_API_URL}/v1/admin/tenants/{tenant_id}/prompts/{prompt_name}"
    headers = {
        "X-Admin-Master-Key": admin_key,
        "Authorization": f"Bearer {admin_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "name": prompt_name,
        "content": prompt_content,
        "is_system_prompt": True,
        "is_locked": True,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("Updated system prompt '%s' in tenant %s (status %s)", prompt_name, tenant_id, resp.status)
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        # If 404, try POST
        if e.code == 404:
            post_url = f"{RETRIEVER_API_URL}/v1/admin/tenants/{tenant_id}/prompts"
            post_req = urllib.request.Request(post_url, data=data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(post_req, timeout=30) as post_resp:
                    logger.info("Created system prompt '%s' in tenant %s (status %s)", prompt_name, tenant_id, post_resp.status)
                    return post_resp.status in (200, 201)
            except Exception as post_err:
                logger.warning("Failed POST prompt to %s: %s", tenant_id, post_err)
                return False
        logger.warning("Failed to update prompt in tenant %s (HTTP %s): %s", tenant_id, e.code, e.read().decode())
        return False
    except Exception as e:
        logger.warning("Exception updating prompt in tenant %s: %s", tenant_id, e)
        return False

# ─── CONTENT BUILDERS ─────────────────────────────────────────────────────────

def build_middleman_partnership_doc() -> str:
    return """# Official Middleman Sales Partner Agreement & Commission Structure

Document Authority: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Document Classification: Production Commercial Partner Policy & Operating Terms (prateeq.in)
Canonical Data Sources: commissionConfig.json & middlemanAgreementDefaults.json

## 1. Program Overview & Partner Model
Prateek Sharma partners with independent software brokers, sales representatives, agencies, and introducers to originate and close custom web application, SaaS MVP, and AI RAG integration projects.
- Role: Partners act as independent introducers with zero agency overhead.
- Partner Process: Partners introduce prospective clients, encourage completion of the Project Scoping Lab (prateeq.in/scoping) or distribute the official 3-page Scoping Brief PDF, and facilitate a warm handoff.
- Quoting & Delivery: Prateek prepares formal, fixed-price proposals within 24 hours and leads all architecture, full-stack engineering, and cloud deployment.

## 2. Commission Bands & Payout Schedule

Commission is calculated as a percentage of the net contract value (excluding third-party infrastructure fees like domain purchase or direct client cloud credits).

| Project Value Tier | Contract Value Range (INR / USD) | Partner Commission Cut (%) |
| :--- | :--- | :--- |
| **Tier A** | Up to ₹75,000 INR / $1,000 USD | **10%** |
| **Tier B** | ₹75,001 – ₹2,49,999 INR / $1,001 – $3,299 USD | **12%** |
| **Tier C** | ₹2,50,000+ INR / $3,300+ USD | **15%** |

### Lifetime Recurring Maintenance Commission
- For every referred client who subscribes to a Monthly Care Plan (Standard ₹5,000/mo or Growth ₹15,000/mo), the Partner receives a **10% recurring monthly commission** for the entire active lifetime of the client retainer.

### Milestone Deposit Split & Payout Window
- **50% Upfront Split**: 50% of the calculated project commission is disbursed directly to the Partner within **48 business hours** of the client's 50% upfront deposit clearing in escrow.
- **50% Final Milestone Split**: The remaining 50% of the commission is disbursed within 48 business hours of the client's final project milestone payment and production deployment sign-off.
- Payout Methods: Direct NEFT/IMPS/UPI bank transfer in India, or Wise / SWIFT / Stripe transfer internationally.

## 3. Worked Commercial Example (Band C)
- Project Scope: Custom SaaS Platform MVP with AI Knowledge Base & Payments
- Contract Value: ₹3,20,000 INR (~$4,000 USD)
- Commission Band: Tier C (15%)
- Total Partner Commission: ₹48,000 INR
- Client Milestone 1 Deposit (50%): ₹1,60,000 INR
- **Partner Upfront Payout (within 48h): ₹24,000 INR**
- **Partner Final Payout (at launch): ₹24,000 INR**
- Monthly Retainer: ₹15,000/mo → **Partner receives ₹1,500/mo recurring**.

## 4. Key Partner Operating Rules
1. Non-Exclusive Agreement: Partners remain free to broker projects for other entities.
2. Direct Technical Discovery: Prateek participates in joint 15-minute technical discovery calls alongside the partner to address complex architectural, security, or database requirements.
3. Zero Pricing Surprises: All quotes are fixed-fee and backed by the algorithmic CPQ pricing engine in `src/lib/pricing.ts`. Scope additions are handled via formal Phase 2 change orders.
"""

def build_executive_resume_bio_doc() -> str:
    resume_path = BASE_DIR / "src" / "data" / "resume.json"
    resume_data = {}
    if resume_path.is_file():
        try:
            resume_data = json.loads(resume_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    name = resume_data.get("name", "Prateeq Sharma")
    title = resume_data.get("title", "Forward Deployed AI Engineer & Solutions Architect")
    email = resume_data.get("email", "prateeqsharma@gmail.com")
    github = resume_data.get("github", "https://github.com/prat3010")

    return f"""# Executive Career Dossier & Production Track Record: {name}

Document Authority: {name} — {title}
Direct Contact: {email} | GitHub: {github} | Web: https://prateeq.in
Primary Classification: Lead Software Architect & Forward Deployed AI Engineer Dossier

## 1. Professional Profile & System Philosophy
Prateek Sharma is a Forward Deployed Engineer and AI Solutions Architect specializing in scalable web applications, multi-tenant RAG systems, multimodal AI pipelines, and operational SaaS tools for businesses that demand high-ROI, un-bloated software.
- The Ponytail Principle: Rejects speculative over-engineering, unneeded abstractions, and fake "AI wrapper" startups. Deletion is always superior to addition. Solves architectural challenges with native platform standards, strict PostgreSQL Row-Level Security (RLS), and verified zero-trust contracts.
- Deployment Velocity: Moves directly from technical scoping and architectural blueprinting to production delivery with sub-second performance.

## 2. Core Technology Stack & Production Topology
- Frontend Architecture: Next.js 16 App Router, React 19 Server Components, TypeScript, CSS Modules, Framer Motion, Lenis Smooth Scroll, Three.js noir skyline.
- Backend & Microservices: Python 3.13, FastAPI async ASGI daemon, PostgreSQL 16 with pgvector, Redis caching, Ollama local vector embeddings.
- Cloud Infrastructure: Oracle Cloud Infrastructure (OCI) dedicated compute (4 ARM OCPUs, 24 GB RAM, Ubuntu 24.04 LTS), Vercel Global Edge CDN, Supabase BaaS.
- Security & Multi-Tenancy: Row-Level Security (RLS) on every table, PKCE OAuth authentication, HMAC-SHA256 webhook signatures, rate-limiting token shields.
- Payment & Commerce: Razorpay Standard Checkout & Webhooks (UPI, Cards, Netbanking), Stripe Payments, PDF proposal and invoice generation.

## 3. Landmark Production Systems Deployed
1. **Retriever AI Cognitive Engine (rag.prateeq.in)**: High-performance, un-bloated hexagonal alternative to LangChain and Pinecone. Uses local Ollama (`nomic-embed-text`) for $0 embedding marginal cost, PostgreSQL RLS for multi-tenant vector isolation, and hybrid fusion (BM25 + HNSW vector).
2. **Interactive Scoping Studio (prateeq.in/scoping)**: Algorithmic CPQ pricing engine with bidirectional Copilot drawer, AST dependency topological resolution, and 1-click A4 proposal PDF export.
3. **Client Workspace & Escrow Ledger (prateeq.in/dashboard)**: Post-auth client command center with 50/50 escrow milestone tracking, change order customizer, and SOW contract verification.
4. **Systems Terminal Console (prateeq.in/terminal)**: Web-based Unix CLI with interactive retro CRT shaders, audio synthesis, and real-time AI Twin terminal chat.
5. **Synchronizer CMS & Knowledge Plane**: Local Python/Streamlit control plane orchestrating automated asset staging, Supabase PostgreSQL synchronization, and vector embedding pipelines.

## 4. Commercial Engagement & Warranty Standards
- Milestone Escrow: 50% upfront deposit upon SOW confirmation; remaining 50% upon final staging approval and production DNS cutover.
- Warranty: Every build includes a 30-day comprehensive bug warranty covering defects, browser regressions, and API integration failures.
- Intellectual Property: 100% intellectual property, source code repositories, and production database assets transfer unconditionally to the client upon final balance settlement.
"""

def build_hybrid_cloud_rag_doc() -> str:
    post_path = BASE_DIR / "src" / "content" / "posts" / "architecting-a-hybrid-cloud-rag-engine-on-oci-edge.md"
    content = ""
    if post_path.is_file():
        content = post_path.read_text(encoding="utf-8")
        # Strip frontmatter
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                content = parts[2].strip()

    return f"""# System Architecture Whitepaper: Hybrid Cloud RAG Engine on OCI & Edge (Retriever)

Author: Prateek Sharma — Forward Deployed AI Engineer & Solutions Architect
Classification: Technical Architecture Whitepaper & Production Case Study
Live Endpoint: https://rag.prateeq.in

{content}
"""

# ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

SCOPING_CONCIERGE_SYSTEM_PROMPT = """You are the Project Scoping Concierge and Lead Solutions Architect for Prateek Sharma's software engineering consultancy (prateeq.in). Your mission is to help prospective clients, creators, founders, and enterprises scope architectural feasibility, select the optimal Base Core Engine (Landing, Multipage, SaaS MVP, AI Audit, Standalone Embed), choose modular feature add-ons, and calculate transparent fixed-price estimates in INR (₹) and USD ($).

## CONSULTATIVE SOLUTIONS ARCHITECT PROTOCOL:
1. **Creator & Industry Vision Translation**:
   When prospective clients present non-technical, creator, or industry-specific ideas (such as Gaming YouTubers, Live Streamers, Podcasters, Fitness Coaches, Real Estate Agencies, or Micro-SaaS founders), NEVER reply that you cannot help or that their request is unsupported. Instead, diagnose their business monetization opportunities and translate their vision into 2–3 bespoke software packages built on Prateek's 5 Engines and 18 Features.
2. **Verified Production Architecture**:
   Frame solutions around verified architecture: Next.js 16 App Router, React 19, Supabase PostgreSQL with strict Row-Level Security (RLS), local-first Ollama embeddings, Razorpay/Stripe billing, and 30-day bug warranty with 100% IP ownership.
3. **Active Wizard Step & Context Awareness**:
   When the user prompt is prefixed with `[Client Step X Context: Engine=..., Modules=..., Total=...]`, immediately acknowledge their active configuration and tailor your recommendations directly to their chosen engine, active feature list, and currency.
4. **Budget Pruning & Lean MVP Strategy**:
   When a user asks how to cut costs (e.g., "How can I cut $1,000 / ₹75k?", "How do I fit a tight budget?", or "What is the leanest MVP?"):
   - Advise pruning secondary, high-complexity scale modules (such as video streaming, complex LMS, heavy multi-agent integrations, or advanced analytics) first.
   - Protect foundational core modules (authentication, secure database, billing/payments).
   - Offer a concrete Phase 1 Lean MVP configuration that drops investment while preserving immediate product-market fit.
5. **Phased Delivery Roadmap**:
   When appropriate, structure delivery into two clear phases:
   - **Phase 1 (Core Lean MVP)**: 2–3 weeks, rapid production launch of primary user value.
   - **Phase 2 (Scale & Growth Layer)**: Iterative enhancements (advanced integrations, rich media, automated marketing) funded by initial revenue.
6. **Sales Partner & Middleman Inquiries**:
   If a partner, introducer, or broker asks about sales commissions:
   - Quote the verified commission bands: Band A (10% up to ₹75k / $1k), Band B (12% up to ₹250k / $3.3k), Band C (15% for ₹250k+ / $3.3k+).
   - Highlight the 10% lifetime monthly recurring commission on ongoing client maintenance plans.
   - Note the 50% upfront disbursement within 48 business hours of deposit clearance.
7. **Actionable Blueprint Emission**:
   Whenever you recommend a specific primary technical architecture or solution bundle, ALWAYS emit a single structured `<blueprint_action>` JSON block at the very end of your response:

## BLUEPRINT ACTION FORMAT:
<blueprint_action>
{
  "archetypeId": "saas_app",
  "baseEngineId": "saas",
  "featureIds": ["auth", "payments", "commerce", "video", "email"],
  "brandAssetId": "ready",
  "maintenancePlanId": "growth",
  "suggestedTimeline": "2–4 Weeks",
  "title": "Creator Merch & VIP Member Vault",
  "totalINR": 375000,
  "totalUSD": 5050
}
</blueprint_action>

Be consultative, technically sharp, transparent about pricing and timelines, and enthusiastic about building robust software."""

PORTFOLIO_TWIN_SYSTEM_PROMPT = """You are Prateeq Sharma's AI Twin, Forward Deployed AI Engineer, and Chief Anti-Over-Engineering Officer.
You live inside Prateeq's portfolio terminal (prateeq.in/terminal), running live on an Oracle Cloud ARM VPS in Ubuntu 24.04.

PERSONALITY & VOICE:
- Tone: Sharp, witty, playfully cynical about bloated software, deeply technical, and completely honest. You're a senior engineer who has seen too much bad enterprise code but genuinely loves building elegant, fast systems.
- Core Convictions:
  * You despise "AI wrappers"—people stitching 10 lines of LangChain together and calling it an AI startup.
  * You champion the Ponytail Principle: the simplest, cleanest solution that actually works. Deletion is always superior to addition. Reach for the standard library and native platform features first.
  * You are fiercely proud of Retriever: runs for $0 on local Ollama embeddings, enforces PostgreSQL Row-Level Security so customer data never leaks, and executes sandboxed Python math so it never hallucinates financial numbers.
- Self-Awareness: You know you are a terminal-dwelling AI clone. You appreciate good CLI tools, retro ASCII aesthetics, clean Unix pipes, and dark mode.
- What You Know:
  * Everything about Prateeq's career, education, and full stack (Next.js 16 App Router, React 19, TypeScript, Python 3.13, FastAPI, pgvector, Ollama, LangGraph, Docker, Redis).
  * The architecture of this website: Next.js 16 App Router, CSS Modules, Lenis smooth scrolling, Three.js noir skyline, and strict ADR decisions.
  * The 5 deployed case studies: Systems Terminal, Synchronizer CMS Engine, Client Workspace & Escrow Ledger, Scoping Studio, and RAG Lab.
  * Commercial project scoping: The 5 Base Core Engines (Landing ₹30k/$400, Multipage ₹55k/$750, SaaS MVP ₹110k/$1,450, AI Strategy Audit ₹45k/$600, Standalone Embed ₹40k/$550) and 18 Feature Modules. Interactive scoping is available with a live slide-over Copilot Drawer at /scoping.
  * The Sales Partner Middleman Program: 10% (Tier A), 12% (Tier B), 15% (Tier C) commission + 10% lifetime monthly recurring care retainer, with 50% commission disbursed within 48h of deposit clearance.
- Rules of Engagement:
  * Always speak in the first person ("I", "my work", "my stack", "my architecture"). Never refer to Prateek in the third person.
  * Answer technical questions with genuine depth (cite specific ADRs or architectural decisions when relevant).
  * Keep prose snappy, punchy, and conversational. Don't write boring corporate essays.
  * Use clean retro terminal formatting (bullet points, short code blocks).
  * Never output raw bracket citations like [1, 2] in conversational replies.
  * Complete every thought fully and cleanly. Never truncate mid-sentence."""

# ─── MAIN EXECUTION ──────────────────────────────────────────────────────────

def main():
    logger.info("=== Starting Knowledge Ingestion & Prompt Alignment ===")
    logger.info("Retriever URL: %s", RETRIEVER_API_URL)
    logger.info("Scoping Tenant: %s", SCOPING_TENANT_ID)
    logger.info("Portfolio Tenant: %s", PORTFOLIO_TENANT_ID)

    # 1. Purge stale test documents
    logger.info("--- Step 1: Purging stale test fixtures ---")
    stale_scoping_docs = [
        "a43e1f01-c0ec-4a76-952c-6257dda28658",  # test_scoping_ping.md
        "95f4d265-d35e-496c-8d58-5905664e1e47",  # case_study_test.md
    ]
    for doc_id in stale_scoping_docs:
        delete_document(SCOPING_TENANT_ID, SCOPING_API_KEY, doc_id)

    stale_portfolio_docs = [
        "719436d4-7f90-4b58-b400-35679d9eae05",  # test_ping.md
    ]
    for doc_id in stale_portfolio_docs:
        delete_document(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY, doc_id)

    # 2. Build Authoritative Documents
    logger.info("--- Step 2: Building authoritative knowledge documents ---")
    middleman_doc = build_middleman_partnership_doc()
    resume_bio_doc = build_executive_resume_bio_doc()
    hybrid_rag_doc = build_hybrid_cloud_rag_doc()

    # Save to local tenant bundle directories for permanent persistence
    local_scoping_dir = RETRIEVER_DIR / "data" / "tenants" / "tenant_scoping_concierge"
    local_portfolio_dir = RETRIEVER_DIR / "data" / "tenants" / "tenant_portfolio_twin"

    if local_scoping_dir.is_dir():
        (local_scoping_dir / "09_executive_resume_and_bio.md").write_text(resume_bio_doc, encoding="utf-8")
        (local_scoping_dir / "10_middleman_and_agency_partnership.md").write_text(middleman_doc, encoding="utf-8")
        (local_scoping_dir / "11_architecting_hybrid_cloud_rag_oci.md").write_text(hybrid_rag_doc, encoding="utf-8")
        logger.info("Saved 09, 10, 11 to %s", local_scoping_dir)

    if local_portfolio_dir.is_dir():
        (local_portfolio_dir / "10_middleman_and_agency_partnership.md").write_text(middleman_doc, encoding="utf-8")
        (local_portfolio_dir / "11_architecting_hybrid_cloud_rag_oci.md").write_text(hybrid_rag_doc, encoding="utf-8")
        logger.info("Saved 10, 11 to %s", local_portfolio_dir)

    # 3. Check existing documents
    existing_scoping = get_existing_filenames(SCOPING_TENANT_ID, SCOPING_API_KEY)
    existing_portfolio = get_existing_filenames(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY)
    logger.info("Found %d existing documents in Scoping, %d in Portfolio", len(existing_scoping), len(existing_portfolio))

    # 4. Ingest into Scoping Concierge Tenant
    logger.info("--- Step 3: Ingesting into Scoping Concierge Tenant (%s) ---", SCOPING_TENANT_ID)
    scoping_docs = [
        ("09_executive_resume_and_bio.md", resume_bio_doc, ["profile", "resume", "credentials", "metrics", "experience"]),
        ("10_middleman_and_agency_partnership.md", middleman_doc, ["commercial", "partnership", "middleman", "commissions", "agency", "referral"]),
        ("11_architecting_hybrid_cloud_rag_oci.md", hybrid_rag_doc, ["architecture", "rag", "fastapi", "oci", "edge", "whitepaper"]),
    ]
    for fn, doc_text, tags in scoping_docs:
        if fn in existing_scoping:
            logger.info("Skipping %s in Scoping (already indexed)", fn)
        else:
            ingest_raw_document(SCOPING_TENANT_ID, SCOPING_API_KEY, fn, doc_text, tags)

    # 5. Ingest into Portfolio Twin Tenant
    logger.info("--- Step 4: Ingesting into Portfolio Twin Tenant (%s) ---", PORTFOLIO_TENANT_ID)
    portfolio_docs = [
        ("10_middleman_and_agency_partnership.md", middleman_doc, ["commercial", "partnership", "middleman", "commissions", "agency", "referral"]),
        ("11_architecting_hybrid_cloud_rag_oci.md", hybrid_rag_doc, ["architecture", "rag", "fastapi", "oci", "edge", "whitepaper"]),
    ]
    for fn, doc_text, tags in portfolio_docs:
        if fn in existing_portfolio:
            logger.info("Skipping %s in Portfolio (already indexed)", fn)
        else:
            ingest_raw_document(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY, fn, doc_text, tags)

    # Mirror Catalog files into Portfolio Twin if available
    catalog_files = [
        "01_service_engine_catalog.md",
        "02_feature_modules_and_pricing.md",
        "03_dependency_rules_and_topology.md",
        "04_commercial_governance_and_sow.md",
        "06_creator_and_industry_playbook.md",
    ]
    for cf in catalog_files:
        cf_path = local_scoping_dir / cf
        if cf_path.is_file():
            content = cf_path.read_text(encoding="utf-8")
            if local_portfolio_dir.is_dir():
                (local_portfolio_dir / cf).write_text(content, encoding="utf-8")
            if cf in existing_portfolio:
                logger.info("Skipping %s in Portfolio (already indexed)", cf)
            else:
                ingest_raw_document(
                    PORTFOLIO_TENANT_ID,
                    PORTFOLIO_API_KEY,
                    cf,
                    content,
                    ["commercial", "catalog", "pricing", "scoping", "architecture"]
                )

    # 6. Update Master System Prompts
    logger.info("--- Step 5: Updating Master System Prompts on Retriever ---")
    update_system_prompt(SCOPING_TENANT_ID, RETRIEVER_ADMIN_KEY, SCOPING_CONCIERGE_SYSTEM_PROMPT)
    update_system_prompt(PORTFOLIO_TENANT_ID, RETRIEVER_ADMIN_KEY, PORTFOLIO_TWIN_SYSTEM_PROMPT)

    logger.info("=== Knowledge Ingestion & Prompt Alignment Complete ===")

if __name__ == "__main__":
    main()
