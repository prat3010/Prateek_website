---
id: PRD_26_Autonomous_Outreach_Engine
title: "PRD: Autonomous AI Outreach & Cold Pitch Engine (/admin, /api/outreach/*)"
tier: 4_api_gateway
platform: Prateek_website
status: production
auth_level: admin_only
blast_radius: HIGH
file_path: src/app/admin/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/"
runbook: docs/runbooks/RUNBOOK_OUTREACH_DISPATCH.md
tags:
  - prd/outreach
  - tier/4_api_gateway
  - ai/gemini
  - platform/prateek_website
  - email/resend
  - admin/hitl
invariants:
  - "Outreach dispatches MUST strictly require authenticated administrative Google OAuth sessions."
  - "Daily outbound email limits MUST NOT exceed 15 recipients/day to prevent ISP reputation degradation."
  - "Every generated cold pitch MUST cite verifiable production systems (e.g. Retriever RAG, pgvector, Next.js 16)."
  - "Dispatches MUST be recorded in outreach_audit_log with idempotent SHA-256 message signatures."
test_suites:
  - src/app/api/__tests__/outreach.test.ts
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/AI_OUTREACH_AGENT_ROADMAP.md
  - docs/99_DECISIONS.md#adr-32
---

# 26. Product Requirements Document: Autonomous AI Outreach & Cold Pitch Engine

#prd #outreach #gemini #resend #lead_gen #hitl #admin #prateeq_website

> **Comprehensive system specification for the 24/7 Autonomous AI Lead Discovery, Gemini Cold Pitch Synthesis, Cloud-Hosted Human-In-The-Loop Review Queue (`/admin`), and Resend SMTP Dispatch Engine.**

---

## 1. Executive Summary & Problem Statement

Client acquisition and enterprise AI consulting discovery typically require dozens of hours of manual LinkedIn stalking, company scraping, and cold drafting. Existing outbound sales tools (Apollo, Lemlist) send generic template-based spam that burns domain reputation and converts at less than 1%.

The **Autonomous AI Outreach Engine** replaces manual prospecting with an authentic, code-grounded, multi-channel outreach agent:
1. **Target Discovery:** Autonomous daemons ingest high-intent startup founders, CTOs, and product leads seeking RAG pipelines, Next.js 16 modernizations, and custom AI agents.
2. **Context-Grounding via Gemini:** Ingests the prospect's public engineering blog, recent GitHub commits, or open job requisitions, combining it with Prateek's live codebases (`retriever`, `PaintMix AI`, `MetaWipe`) to draft 100% bespoke, technically substantive pitches.
3. **Human-In-The-Loop (HITL) Gate:** Zero automated spray-and-pray. Every drafted pitch flows into the mobile-responsive `/admin` review cockpit on `prateeq.in` for 1-tap review, inline editing, or instant dismissal.
4. **Deliverability & Safety Guardrails:** Strict 15 email/day caps, authenticated Resend SMTP with SPF/DKIM/DMARC alignment, anti-bounce validation, and automatic unsubscribe links.

---

## 2. System Architecture & Information Flow

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       1. PROSPECTING & INGESTION DAEMON                     │
 │      • scripts/run_outreach.py  &  scripts/sync_tabs/outreach.py            │
 │      • Sources: HackerNews Who's Hiring, GitHub Trending, Startup RSS       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Target URL & Spec)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      2. COGNITIVE SYNTHESIS ENGINE                          │
 │      • Gemini 3.6 Flash (gemini-3.6-flash) via /api/outreach/prospect       │
 │      • Inputs: Prospect Bio, Pain Points, Prateek Engineering Catalog       │
 │      • Outputs: Bespoke Subject Line, Opening Hook, Architecture Proposal   │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Draft Payload)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      3. SUPABASE PERSISTENCE LAYER                          │
 │      • `outreach_leads`: (email, company, lead_score, custom_pitch, status) │
 │      • `social_drafts`: (platform, body_text, scheduled_at, status)         │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Status: PENDING_REVIEW)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                 4. MOBILE-FIRST CLOUD COCKPIT (`/admin`)                    │
 │      • Route: prateeq.in/admin (Google OAuth + PKCE Admin Gate)            │
 │      • Features: 1-Tap Approve/Dismiss, Live Draft Editor, Quota Gauges     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (User Action: 1-Tap "Dispatch")
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     5. SECURE DISPATCH & REPUTATION ENGINE                  │
 │      • Route: POST /api/outreach/dispatch (Service Role Guarded)            │
 │      • Resend SMTP API: Injects Custom Reply-To, Tracking & Headers        │
 │      • Ledger: Updates status ➔ 'SENT', logs event in `outreach_audit_log`  │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Non-Negotiable Invariants & Security Guardrails

| Invariant ID | Rule Description | Enforcement Mechanism |
| :--- | :--- | :--- |
| **INV-OUT-01** | **Strict Admin Authentication** | All routes under `/api/outreach/*` and `/admin` require authenticated Supabase sessions where `user.email == process.env.ADMIN_EMAIL`. Unauthenticated requests return 401 Unauthorized. |
| **INV-OUT-02** | **Daily Outbound Quota Ceiling** | Maximum 15 emails per 24-hour UTC window. Hard check in `/api/outreach/dispatch` aborts with `429 Too Many Requests` if `count(sent_today) >= 15`. |
| **INV-OUT-03** | **Zero Generic Template Spam** | Every prompt sent to Gemini enforces strict ban on buzzwords (`synergy`, `game-changer`, `delve`, `hope this finds you well`) and requires linking to at least one concrete production metric or GitHub commit. |
| **INV-OUT-04** | **Idempotent Dispatch Signature** | Dispatches compute `SHA-256(recipient_email + subject + date)`. Duplicate dispatches within 7 days are blocked with `409 Conflict`. |
| **INV-OUT-05** | **Opt-Out Compliance** | All outgoing emails automatically append compliant footer with sender identity and immediate 1-click unsubscribe route (`/api/outreach/unsubscribe`). |

---

## 4. API Specifications & Contracts

### 4.1 Dispatch Outreach Email
* **Endpoint:** `POST /api/outreach/dispatch`
* **Auth:** Bearer JWT (Session Admin) or Service Role Key
* **Request Body:**
  ```json
  {
    "lead_id": "8f3b2810-74aa-4921-995c-9c3a37b30101",
    "recipient_email": "alex@acmeai.io",
    "recipient_name": "Alex Vance",
    "subject": "Quick architecture thought on Acme's hybrid search latency",
    "html_content": "<p>Hey Alex,</p><p>Noticed your post on migrating to pgvector...</p>",
    "source_channel": "cold_email"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "dispatch_id": "msg_9941a80c",
    "dispatched_at": "2026-09-05T14:32:00Z",
    "daily_quota_remaining": 11
  }
  ```

### 4.2 Prospect Lead & Generate Pitch
* **Endpoint:** `POST /api/outreach/prospect`
* **Auth:** Admin Session JWT
* **Request Body:**
  ```json
  {
    "company_name": "Acme AI",
    "website_url": "https://acmeai.io",
    "contact_name": "Alex Vance",
    "role": "Head of Engineering",
    "context_notes": "Currently scaling pgvector to 5M docs; experiencing slow HNSW index builds."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "lead_id": "8f3b2810-74aa-4921-995c-9c3a37b30101",
    "subject_lines": [
      "Benchmarking pgvector HNSW vs BM25 hybrid indexing at 5M scale",
      "Quick question on Acme's vector index build latency"
    ],
    "draft_pitch": "Hey Alex, noticed Acme's recent engineering update on scaling vector search...",
    "suggested_cta": "Review the live RAG benchmark sandbox on prateeq.in/rag",
    "lead_score": 92
  }
  ```

### 4.3 Get Leads Queue
* **Endpoint:** `GET /api/outreach/get-leads?status=pending&limit=20`
* **Auth:** Admin Session JWT
* **Response (200 OK):**
  ```json
  {
    "leads": [
      {
        "id": "8f3b2810-74aa-4921-995c-9c3a37b30101",
        "company_name": "Acme AI",
        "contact_email": "alex@acmeai.io",
        "contact_name": "Alex Vance",
        "status": "pending_review",
        "lead_score": 92,
        "pitch_draft": "Hey Alex, noticed Acme's recent engineering update...",
        "created_at": "2026-09-05T09:00:00Z"
      }
    ],
    "daily_stats": {
      "sent_today": 4,
      "quota_limit": 15,
      "pending_review": 8
    }
  }
  ```

---

## 5. Database Schema & Tables

```sql
-- Outreach Leads
CREATE TABLE IF NOT EXISTS outreach_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    website_url TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL UNIQUE,
    role_title TEXT,
    lead_score INTEGER DEFAULT 50 CHECK (lead_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'pending_review' 
        CHECK (status IN ('pending_review', 'approved', 'sent', 'opened', 'replied', 'dismissed', 'unsubscribed')),
    subject_line TEXT,
    pitch_draft TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ,
    resend_message_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Outreach Audit Log
CREATE TABLE IF NOT EXISTS outreach_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES outreach_leads(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('generated', 'approved', 'dispatched', 'bounced', 'dismissed')),
    actor_email TEXT NOT NULL,
    signature_hash TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Security Policies
ALTER TABLE outreach_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to outreach_leads" ON outreach_leads
    FOR ALL USING (auth.jwt() ->> 'email' = 'prateeqsharma@gmail.com');

CREATE POLICY "Admin full access to outreach_audit_log" ON outreach_audit_log
    FOR ALL USING (auth.jwt() ->> 'email' = 'prateeqsharma@gmail.com');
```

---

## 6. Cloud Admin Cockpit UX (`/admin`)

The `/admin` interface is engineered for rapid mobile triage:
1. **Swipeable Cards:** Mobile cards with swipe-left (dismiss) and swipe-right (dispatch).
2. **Inline Markdown Preview:** Visual syntax highlighting showing exact email formatting, typography, and live CTA links.
3. **Daily Quota Gauge:** Visual radial chart showing daily sent count vs. the 15-email safety cap.
4. **Direct ATS Links:** Quick action to launch pre-filled career application portals or LinkedIn message threads if email bounces.

---

## 7. Verification & Automated Test Plan

1. **Unit & API Tests (`src/app/api/__tests__/outreach.test.ts`):**
   - Assert unauthenticated requests receive 401.
   - Assert daily quota limits trigger 429 when cap is reached.
   - Assert SHA-256 signature deduplication prevents replay attacks.
   - Assert Resend mock returns compliant message headers.
2. **End-to-End Verification:**
   - Execute test prospect generation through `scripts/run_outreach.py --dry-run`.
   - Inspect draft formatting in `/admin` UI on both Azure and Noir themes.
   - Verify audit log insertion in Supabase.
