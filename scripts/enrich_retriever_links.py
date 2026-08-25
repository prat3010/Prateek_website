#!/usr/bin/env python3
"""
enrich_retriever_links.py
Standardizes all internal links across retriever/ to relative vault paths,
creates root README.md, and enriches cross-references for a dense Knowledge Graph.
"""

import os
import re
from pathlib import Path

RETRIEVER_DIR = Path("/Users/prateeksharma/Developer/retriever")
WEBSITE_DIR = Path("/Users/prateeksharma/Developer/Prateek_website")

README_CONTENT = """# Retriever — Enterprise Multi-Tenant RAG Cognitive Platform

> **High-Performance Hybrid Vector Search, GraphRAG, Context Compression & Recursive Agentic Cognition.**
> 
> 📌 **Master Cross-Platform Roadmap (SSoT):** [`../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md`](../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md)  
> 📌 **Admin Dashboard Guide:** [`ADMIN_DASHBOARD_GUIDE.md`](ADMIN_DASHBOARD_GUIDE.md)  
> 📌 **Frontend Client Studio:** [`../Prateek_website/docs/24_RAG_App_Studio_PRD.md`](../Prateek_website/docs/24_RAG_App_Studio_PRD.md)

---

## 🚀 Architectural Vision & Hexagonal Core

Retriever is designed as an enterprise-grade, highly modular Retrieval-Augmented Generation (RAG) platform based on a strict **Ports and Adapters (Hexagonal)** architecture:

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ CLIENT FRONTEND & CONTROL PLANE                                                        │
 │ • prateeq.in/rag & prateeq.in/rag/app (Next.js 16 App Router)                          │
 │ • Supabase Auth PKCE Session Verification & Multi-Tenant Routing                       │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ REST / SSE API Streams (X-User-ID / Bearer)
                                            ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ FASTAPI APPLICATION GATEWAY (`apps/api`)                                               │
 │ • Routers: /v1/chat, /v1/search, /v1/documents, /v1/admin, /v1/auth                   │
 │ • Guardrails: Llama Guard 3 Injection Filter & PII Redactor                           │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ COGNITIVE DOMAIN CORE (`src/domain`)                                                   │
 │ • Hybrid Search (HNSW Dense + SPLADE/BM25 Sparse + RRF)                                │
 │ • GraphRAG Knowledge Graph Indexing & Neo4j/Pg Triples                                 │
 │ • Recursive Language Model (RLM) & Python REPL Sandbox (M47)                           │
 │ • Multi-Agent Generator-Critic Reflection Loops (M48)                                  │
 │ • LongLLMLingua Context Compression (M49) & Zero-Trust Envelope Encryption             │
 └──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ INFRASTRUCTURE ADAPTERS (`src/adapters`)                                               │
 │ • Database: PostgreSQL 16 + pgvector (Row-Level Security Tenant Isolation)              │
 │ • Vector: Dynamic Partitioning (768, 1536, 3072 dims)                                  │
 │ • Storage: S3 / Cloudflare R2 presigned documents                                      │
 │ • Broker / Cache: Redis Semantic Cache & RabbitMQ Celery workers                      │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Key Documentation & Navigation

| Document | Description |
|:---|:---|
| [`ROADMAP.md`](ROADMAP.md) | Backend engineering milestones (M1–M53) & implementation history |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Platform health indicators, test baselines & active milestone status |
| [`docs/RAG_2026_PRODUCT_ROADMAP.md`](docs/RAG_2026_PRODUCT_ROADMAP.md) | 2026 Architecture & cognitive engine specification |
| [`docs/ADMIN_DASHBOARD_ROADMAP.md`](docs/ADMIN_DASHBOARD_ROADMAP.md) | Admin dashboard control panel architecture (`admin.rag.prateeq.in`) |
| [`ADMIN_DASHBOARD_GUIDE.md`](ADMIN_DASHBOARD_GUIDE.md) | Operator guide for tenant management, API keys, and prompt presets |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) & [`ORACLE_DEPLOYMENT_REFERENCE.md`](ORACLE_DEPLOYMENT_REFERENCE.md) | Production Oracle VPS deployment, Nginx SSL & systemd service setup |
| [`docs/constitution/master-vision.md`](docs/constitution/master-vision.md) | Engineering Constitution & non-negotiable coding rules |
| [`docs/architecture.md`](docs/architecture.md) | Detailed logical architecture blueprint |
| [`docs/implementation/system-design.md`](docs/implementation/system-design.md) | Physical system design, DB schemas & API contracts |
| [`TECH_DEBT.md`](TECH_DEBT.md) | Resolved & deferred technical debt ledger |

---

## 🛠️ Quick Start (Local Development)

```bash
# 1. Start Postgres with pgvector, Redis & RabbitMQ
docker compose up -d

# 2. Setup Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# 3. Run Alembic Database Migrations
alembic upgrade head

# 4. Launch FastAPI Core Server
uvicorn apps.api.src.main:app --reload --port 8000
```

---

## 🧪 Automated Testing Baselines

```bash
# Run complete test suite (500+ unit tests)
pytest apps/api/tests/ -v

# Run linting & Hexagonal import boundaries verification
ruff check .
pytest apps/api/tests/test_architecture.py
```
"""


def clean_file_urls(content: str, current_dir: Path) -> str:
    """Replaces file:/// absolute paths with proper relative paths."""
    
    def replacer(match):
        raw_path = match.group(1)
        if raw_path.startswith("retriever/"):
            target_path = RETRIEVER_DIR / raw_path[len("retriever/"):]
        elif raw_path.startswith("Prateek_website/"):
            target_path = WEBSITE_DIR / raw_path[len("Prateek_website/"):]
        else:
            target_path = RETRIEVER_DIR / raw_path
        
        try:
            rel_path = os.path.relpath(target_path, current_dir)
            return f"({rel_path})"
        except ValueError:
            return match.group(0)

    pattern = r"\(file:///Users/prateeksharma/Developer/([^)]+)\)"
    return re.sub(pattern, replacer, content)


RETRIEVER_CROSS_REFS = {
    "ROADMAP.md": [
        ("../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md", "Master Cross-Platform Roadmap (SSoT)"),
        ("PROJECT_STATUS.md", "Project Health & Test Status"),
        ("docs/RAG_2026_PRODUCT_ROADMAP.md", "2026 RAG Engine Architecture Blueprint"),
        ("docs/ADMIN_DASHBOARD_ROADMAP.md", "Admin Dashboard Operational Roadmap"),
        ("../Prateek_website/docs/CLIENT_DASHBOARD_ROADMAP.md", "Client Dashboard & SaaS Studio Roadmap"),
        ("TECH_DEBT.md", "Technical Debt Ledger"),
    ],
    "PROJECT_STATUS.md": [
        ("ROADMAP.md", "Backend Engineering Roadmap"),
        ("../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (Phase G)"),
        ("docs/RAG_2026_PRODUCT_ROADMAP.md", "RAG Engine Architecture Specification"),
        ("TECH_DEBT.md", "Technical Debt & Deferred Items"),
        ("DEPLOYMENT.md", "Production Deployment Reference"),
    ],
    "ADMIN_DASHBOARD_GUIDE.md": [
        ("docs/ADMIN_DASHBOARD_ROADMAP.md", "Admin Dashboard Architecture Roadmap"),
        ("ONBOARDING_WORKFLOW.md", "Tenant Onboarding Workflow"),
        ("../Prateek_website/docs/CLIENT_DASHBOARD_ROADMAP.md", "Client SaaS Studio Specification"),
        ("ROADMAP.md", "Backend Engine Roadmap"),
    ],
    "DEPLOYMENT.md": [
        ("ORACLE_DEPLOYMENT_REFERENCE.md", "Oracle Ampere Deployment Reference"),
        ("ORACLE_AMPERE_CLAIM_GUIDE.md", "Oracle Ampere VM Provisioning Guide"),
        ("PROJECT_STATUS.md", "System Status & Production Hardening"),
    ],
    "SELF_AWARE_RAG_PLAN.md": [
        ("docs/RAG_2026_PRODUCT_ROADMAP.md", "2026 Cognitive Engine Roadmap"),
        ("docs/architecture.md", "System Architecture Blueprint"),
        ("TECH_DEBT.md", "Technical Debt Profiling"),
    ],
    "docs/ADMIN_DASHBOARD_ROADMAP.md": [
        ("ADMIN_DASHBOARD_GUIDE.md", "Admin Dashboard User Guide"),
        ("../../Prateek_website/docs/CLIENT_DASHBOARD_ROADMAP.md", "Client Dashboard Specification"),
        ("../ROADMAP.md", "Retriever Backend Roadmap"),
        ("../../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (SSoT)"),
    ],
    "docs/RAG_2026_PRODUCT_ROADMAP.md": [
        ("../../Prateek_website/docs/UNIFIED_MASTER_ROADMAP.md", "Unified Master Roadmap (SSoT)"),
        ("../../Prateek_website/docs/24_RAG_App_Studio_PRD.md", "RAG App Studio PRD"),
        ("../../Prateek_website/docs/25_SOTA_Scoping_Engine_PRD.md", "Scoping Dogfooding Tenant (`prateeq_scoping`)"),
        ("architecture.md", "Logical Architecture Blueprint"),
        ("implementation/system-design.md", "Physical System Design"),
    ],
    "docs/architecture.md": [
        ("constitution/master-vision.md", "Engineering Constitution"),
        ("implementation/system-design.md", "Physical System Design & Endpoints"),
        ("engineering/engineering-playbook.md", "Engineering Standards & Boundaries"),
        ("RAG_2026_PRODUCT_ROADMAP.md", "2026 Architecture Blueprint"),
    ],
    "docs/implementation/system-design.md": [
        ("architecture.md", "System Architecture Blueprint"),
        ("constitution/master-vision.md", "Engineering Constitution"),
        ("features/core-platform.md", "Core Platform Features"),
        ("engineering/rag-audit-report.md", "RAG Audit Report"),
        ("../infrastructure/database_and_schemas.md", "Database Schemas & Partitions"),
    ],
    "docs/features/core-platform.md": [
        ("../api/chat.md", "Chat & Grounded Inference API"),
        ("../api/search.md", "Hybrid Search API"),
        ("../api/document.md", "Document Management API"),
        ("../cognitive/hybrid_search_and_fusion.md", "Hybrid Search & RRF Deep Dive"),
        ("../cognitive/guardrails_and_safety.md", "LLM Safety Guardrails"),
        ("../infrastructure/database_and_schemas.md", "Database Schemas & pgvector"),
    ],
    "docs/cognitive/hybrid_search_and_fusion.md": [
        ("../api/search.md", "Search API Specification"),
        ("query_intelligence.md", "Query Intelligence & CRAG"),
        ("chunking_and_parsing.md", "Chunking & Vision OCR"),
        ("../infrastructure/database_and_schemas.md", "Database Vector Partitions"),
    ],
    "docs/cognitive/query_intelligence.md": [
        ("../api/search.md", "Search API Specification"),
        ("hybrid_search_and_fusion.md", "Hybrid Search & Fusion"),
        ("guardrails_and_safety.md", "LLM Safety Guardrails"),
    ],
    "docs/cognitive/chunking_and_parsing.md": [
        ("../api/document.md", "Document API Specification"),
        ("../infrastructure/async_workers_and_queues.md", "Async Workers & Celery Queues"),
        ("../infrastructure/storage_and_encryption.md", "Storage & S3 Integration"),
    ],
    "docs/cognitive/graphrag.md": [
        ("../api/admin.md", "Admin API: GraphRAG Endpoints"),
        ("hybrid_search_and_fusion.md", "Hybrid Search & Fusion"),
        ("../infrastructure/database_and_schemas.md", "Database Schema & Triples"),
    ],
    "docs/cognitive/agentic_workflows_and_repl.md": [
        ("../api/agentic.md", "Agentic API Specification"),
        ("../api/rlm.md", "RLM API Specification"),
        ("consensus_and_reflection.md", "Multi-Agent Consensus"),
    ],
    "docs/cognitive/consensus_and_reflection.md": [
        ("../api/consensus.md", "Consensus API Specification"),
        ("evaluation_and_hallucinations.md", "Evaluation & Hallucinations"),
        ("guardrails_and_safety.md", "LLM Safety Guardrails"),
    ],
    "docs/cognitive/context_compression.md": [
        ("../api/security_compression.md", "Security & Compression API"),
        ("hybrid_search_and_fusion.md", "Hybrid Search & Fusion"),
    ],
    "docs/cognitive/guardrails_and_safety.md": [
        ("../api/chat.md", "Chat API Specification"),
        ("../infrastructure/storage_and_encryption.md", "Compliance & Sovereignty"),
        ("../infrastructure/telemetry_and_observability.md", "Audit Logging"),
    ],
    "docs/cognitive/evaluation_and_hallucinations.md": [
        ("../api/admin.md", "Admin API: Evaluation Endpoints"),
        ("../infrastructure/async_workers_and_queues.md", "Async Workers & Queues"),
        ("consensus_and_reflection.md", "Consensus & Reflection"),
    ],
    "docs/infrastructure/database_and_schemas.md": [
        ("caching_and_performance.md", "Caching & Performance"),
        ("storage_and_encryption.md", "Storage & Encryption"),
        ("../implementation/system-design.md", "Master System Design"),
    ],
    "docs/infrastructure/async_workers_and_queues.md": [
        ("../api/document.md", "Document Management API"),
        ("../cognitive/evaluation_and_hallucinations.md", "Evaluation & Hallucinations"),
        ("../../DEPLOYMENT.md", "Deployment Guide"),
    ],
    "docs/integrations/typescript_sdk.md": [
        ("../api/chat.md", "Chat API Specification"),
        ("../api/search.md", "Search API Specification"),
        ("cloudflare_proxy_worker.md", "Cloudflare Edge Proxy"),
    ],
}


def enrich_document(file_path: Path, cross_refs: list):
    content = file_path.read_text(encoding="utf-8")
    content = clean_file_urls(content, file_path.parent)
    
    section_header = "## **Related Architecture & Cross-References**"
    alt_header = "## Related Architecture & Cross-References"
    
    cross_links_md = "\n\n---\n\n" + section_header + "\n\n"
    for target, label in cross_refs:
        cross_links_md += f"- [{label}]({target})\n"
    
    if section_header in content:
        content = re.sub(
            rf"{re.escape(section_header)}.*$",
            f"{section_header}\n\n" + "\n".join(f"- [{label}]({target})" for target, label in cross_refs),
            content,
            flags=re.DOTALL,
        )
    elif alt_header in content:
        content = re.sub(
            rf"{re.escape(alt_header)}.*$",
            f"{section_header}\n\n" + "\n".join(f"- [{label}]({target})" for target, label in cross_refs),
            content,
            flags=re.DOTALL,
        )
    else:
        content = content.rstrip() + cross_links_md
    
    file_path.write_text(content, encoding="utf-8")
    print(f"✓ Enriched {file_path.relative_to(RETRIEVER_DIR)} with {len(cross_refs)} cross-references.")


def main():
    print("🚀 Starting Retriever Docs & Links Deep Audit...")
    
    # 1. Create root README.md in retriever
    readme_path = RETRIEVER_DIR / "README.md"
    readme_path.write_text(README_CONTENT.strip() + "\n", encoding="utf-8")
    print("✓ Created comprehensive root README.md in retriever.")
    
    # 2. Enrich specified docs
    for filename, refs in RETRIEVER_CROSS_REFS.items():
        doc_path = RETRIEVER_DIR / filename
        if doc_path.exists():
            enrich_document(doc_path, refs)
        else:
            print(f"⚠️ Missing: {filename}")
            
    # 3. Clean all remaining markdown files in retriever/
    for md_file in RETRIEVER_DIR.rglob("*.md"):
        if "node_modules" in str(md_file) or ".venv" in str(md_file):
            continue
        content = md_file.read_text(encoding="utf-8")
        cleaned = clean_file_urls(content, md_file.parent)
        if cleaned != content:
            md_file.write_text(cleaned, encoding="utf-8")
            print(f"✓ Cleaned absolute URLs in {md_file.relative_to(RETRIEVER_DIR)}")
            
    print("\n✨ Retriever documentation links and Knowledge Mesh 100% synchronized!")


if __name__ == "__main__":
    main()
