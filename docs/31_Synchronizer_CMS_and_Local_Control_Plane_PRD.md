---
id: PRD_31_Synchronizer_CMS_and_Local_Control_Plane
title: "PRD: Synchronizer CMS & Local Control Plane Architecture (scripts/synchronizer.py)"
tier: 2_operator_control_plane
platform: Prateek_website
status: production
auth_level: local_service_role
blast_radius: HIGH
file_path: scripts/synchronizer.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py"
runbook: docs/runbooks/RUNBOOK_SYNCHRONIZER_OPERATIONS.md
tags:
  - prd/synchronizer
  - tier/2_operator_control_plane
  - cms/streamlit
  - supabase/service_role
  - isr/cache_revalidation
  - platform/prateek_website
invariants:
  - "The Synchronizer MUST operate strictly as a local developer tool using SUPABASE_SERVICE_ROLE_KEY (never deployed to public endpoints)."
  - "Every content mutation MUST maintain bidirectional parity between Supabase PostgreSQL and local fallback JSON files."
  - "Successful database mutations MUST automatically revalidate Next.js cache tags via /api/revalidate."
  - "Commercial client scopes, invoices, and leads MUST be managed in the Synchronizer, leaving Retriever Admin exclusively for cognitive vector infrastructure."
test_suites:
  - scripts/tests/test_synchronizer_contracts.py
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/11_Content_Management_System.md
  - docs/99_DECISIONS.md#adr-20
  - docs/ARCHITECTURE_DEPENDENCY_MAP.md
---

# 31. Product Requirements Document: Synchronizer CMS & Local Control Plane

#prd #synchronizer #cms #streamlit #supabase #cache_invalidation #control_plane #prateeq_website

> **Comprehensive system specification for the local Streamlit Synchronizer CMS (`scripts/synchronizer.py`), Multi-Tab Architecture, Gemini Certificate OCR, Bidirectional Supabase Sync, and Next.js Cache Invalidation Engine.**

---

## 1. Executive Summary & Architectural Philosophy

Headless commercial CMS solutions (Sanity, Strapi, Contentful) introduce recurring subscription costs, third-party vendor lock-in, and fragile API boundaries. Conversely, committing raw JSON files by hand invites syntax errors, broken schema contracts, and sluggish content editing.

The **Synchronizer CMS & Local Control Plane** (`scripts/synchronizer.py`) is an autonomous, Python-powered administrative cockpit built on Streamlit:
1. **Local-First Security:** Operates strictly on the developer's workstation using `SUPABASE_SERVICE_ROLE_KEY`. It is completely decoupled from the public web app, eliminating CMS attack surfaces.
2. **Bidirectional Data Parity:** All mutations simultaneously write to live Supabase PostgreSQL tables and update version-controlled JSON fallback files in `src/data/`, guaranteeing that the website never crashes if database connections are disrupted.
3. **Automated Cache Invalidation:** Content updates issue authenticated revalidation webhooks (`/api/revalidate?secret=SYNC_API_KEY`) to purge Next.js `unstable_cache` tags instantly without site redeployments.
4. **AI-Assisted Certificate Ingestion:** Incorporates multimodal Gemini 3.6 Flash OCR to scan uploaded diploma/certificate PDFs, auto-extracting metadata and linking verified skills.

---

## 2. System Architecture & Sync Lifecycle

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       DEVELOPER WORKSTATION (LOCAL)                         │
 │                                                                             │
 │   ┌─────────────────────────────────────────────────────────────────────┐   │
 │   │         Streamlit Synchronizer (scripts/synchronizer.py)            │   │
 │   │  • 12 Dedicated Tabs: Projects, Skills, Certificates, Clients, ...  │   │
 │   └──────────────────┬───────────────────────────────┬──────────────────┘   │
 │                      │                               │                      │
 │       (Read/Write)   ▼                               ▼   (Multimodal OCR)   │
 │   ┌─────────────────────────────┐         ┌─────────────────────────────┐   │
 │   │ Local JSON Fallback Files   │         │ Gemini 3.6 Flash AI Engine  │   │
 │   │ src/data/*.json             │         │ (Certificate extraction)    │   │
 │   └─────────────────────────────┘         └─────────────────────────────┘   │
 └──────────────────────┼──────────────────────────────────────────────────────┘
                        │
                        │ 1. Atomic Database Mutation (SUPABASE_SERVICE_ROLE_KEY)
                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         SUPABASE CLOUD POSTGRESQL                           │
 │   • Tables: projects, skills, certificates, client_scopes, invoices, blog   │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        │ 2. HTTP POST /api/revalidate?secret=...
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      VERCEL NEXT.JS 16 CONTROL PLANE                        │
 │   • Revalidates cache tags: 'portfolio-data', 'projects', 'skills', etc.    │
 │   • Edge CDN serves fresh content instantly to global visitors              │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dedicated Subsystem Tabs & Capabilities

The Synchronizer partitions platform operations into 12 specialized modules in [`scripts/sync_tabs/`](../scripts/sync_tabs):

| Subsystem Module | File Path | Primary Operations & Capabilities |
| :--- | :--- | :--- |
| **Projects** | [`projects.py`](../scripts/sync_tabs/projects.py) | Manage portfolio projects, architecture diagrams, GitHub URLs, live links, technology badges, and case study markdown. |
| **Skills** | [`skills.py`](../scripts/sync_tabs/skills.py) | Edit categorical skill matrix (Languages, Frameworks, Cloud, AI/ML), proficiency meters, and certificate links. |
| **Certificates** | [`certificates.py`](../scripts/sync_tabs/certificates.py) | Upload credentials; multimodal Gemini OCR automatically extracts issuer, credential ID, date, and mapped skills. |
| **Clients & Scopes** | [`clients.py`](../scripts/sync_tabs/clients.py) | Review client scopes submitted from `/scoping`, track Razorpay escrow deposits, view invoices, and manage Retriever tenants. |
| **Scoping Config** | [`questionnaire.py`](../scripts/sync_tabs/questionnaire.py) | Configure base engines, feature add-ons, pricing formulas, and dependency cascades in `intakeQuestionnaireDefaults.json`. |
| **AI Outreach** | [`outreach.py`](../scripts/sync_tabs/outreach.py) | Deep developer cockpit for configuring web scraper search terms, inspecting lead scores, and testing cold pitch prompts. |
| **Blog CMS** | [`blog.py`](../scripts/sync_tabs/blog.py) | Author and edit blog articles, live markdown preview, readability analysis, tag management, and Supabase synchronization. |
| **Resume Profile** | [`resume.py`](../scripts/sync_tabs/resume.py) | Update career timeline, education, awards, contact information, and biography in `resume.json`. |
| **Analytics** | [`analytics.py`](../scripts/sync_tabs/analytics.py) | Inspect visitor telemetry, country distribution charts, device types, top landing pages, and API query volumes. |
| **RAG Pricing** | [`rag_pricing.py`](../scripts/sync_tabs/rag_pricing.py) | Adjust Geo-IP SaaS subscription pricing bands (INR/USD) for Retriever Starter, Pro, and Enterprise tiers. |
| **Retriever Probe** | [`retriever_query.py`](../scripts/sync_tabs/retriever_query.py) | Execute administrative queries against the Oracle Cloud VPS RAG cognitive engine (`rag.prateeq.in`). |
| **Photography** | [`photos.py`](../scripts/sync_tabs/photos.py) | Manage visual photography portfolio, metadata, and WebP compression pipeline. |

---

## 4. Multimodal Gemini OCR Pipeline (`certificates.py`)

When a developer uploads a certificate PDF or image:
1. **Base64 Payload Formulation:** The file is encoded and dispatched to Google AI Gemini (`gemini-3.6-flash`).
2. **Structured Extraction Prompt:** Gemini extracts title, issuing authority, issue date, credential ID, and expiration date in strict JSON format.
3. **Automated Skill Tagging:** The extracted credential is cross-referenced with `src/data/skills.json` to link the credential directly to verified proficiency tags.
4. **Instant Commit:** Upon developer confirmation, the record is inserted into `certificates` and appended to `src/data/certificates.json`.

---

## 5. Non-Negotiable Invariants & Safety Constraints

| Invariant ID | Rule Description | Enforcement Mechanism |
| :--- | :--- | :--- |
| **INV-SYNC-01** | **Local Execution Exclusivity** | The Synchronizer relies on local environment variables and is never packaged into Next.js production builds. |
| **INV-SYNC-02** | **Bidirectional Schema Parity** | Writes to Supabase must immediately trigger write-throughs to local JSON fallback files to prevent state drift. |
| **INV-SYNC-03** | **Next.js Cache Revalidation** | Every mutation calls `shared.revalidate_cache(tags)` with `SYNC_API_KEY`, purging stale ISR caches within 500ms. |
| **INV-SYNC-04** | **Commercial Separation** | The Synchronizer manages commercial leads and invoices, leaving `admin.rag.prateeq.in` reserved for cognitive RAG infrastructure. |

---

## 6. Verification & Automated Test Plan

1. **Schema & Contract Audits:**
   - Execute `python3 scripts/audit_contracts.py` to verify that all data fields in local JSON match Supabase table schemas.
   - Execute `python3 scripts/audit_db.py` to assert live database table connectivity and column presence.
2. **Cache Purge Verification:**
   - Modify a test skill via the Synchronizer and verify that `/api/revalidate` returns `{ revalidated: true }`.
   - Inspect public `/api/skills` endpoint to confirm updated data appears without restarting the Next.js server.
