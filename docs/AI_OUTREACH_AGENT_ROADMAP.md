# Autonomous AI Outreach & Social Content Agent — Technical Specification
 
> 📌 **Master Roadmap (SSoT):** For active platform milestone sequencing, see [`UNIFIED_MASTER_ROADMAP.md`](UNIFIED_MASTER_ROADMAP.md) (**Milestones 57 & 58**).  
> **Status:** Technical Specification Baseline (Completed M57–M58)  
> **Target Platform:** Next.js 16 App Router (`src/app/`), Supabase Database & RLS, Vercel Cloud Crons, Gemini 2.5 Flash AI Engine  
> **Channels:** Gmail Cold Email Outreach, X (Twitter), LinkedIn  
> **Primary Goal:** 24/7 hands-free lead discovery, hyper-personalized pitch generation, and build-in-public social content drafting with a zero-friction 1-click Web Control Center.

---

## Executive Summary

The **Autonomous AI Outreach & Content Agent** is an end-to-end cloud-hosted automation platform built directly into the `Prateek_website` Next.js 16 architecture. 

It eliminates the tedious manual labor of lead prospecting, cold outreach drafting, and social media posting. The agent runs silently 24/7 on **Vercel Cloud Crons** without requiring a laptop to stay open. To guarantee 100% social account safety and prevent platform bans or AI hallucinations, the agent operates on a **Human-in-the-Loop (HITL)** model: the AI discovers leads and drafts messages, while you review and dispatch them with a single click from your private Web Control Center (`/admin` or `/dashboard`).

---

## Key System Objectives & Constraints

1. **Zero-Laptop Reliance:** Runs on serverless cloud crons and database queues. No local background processes or open browser windows needed.
2. **Account Safety & Anti-Ban Throttling:** Strictly rate-limited (e.g., max 10–15 emails/day, max 2 posts/day) via official OAuth2 APIs (Google OAuth2, X API, Buffer API).
3. **Hyper-Personalization:** Leverages `gemini-3.6-flash` to parse lead bios, recent posts, or business websites to generate custom opening hooks rather than static templates.
4. **Positioning Mix (60/40):** 
   - **60% Technical & Build-in-Public:** Architecture highlights (Next.js 16, Supabase, RAG engine, vector search insights).
   - **40% Business Outcomes & Scoping CTAs:** Case studies, instant scoping lab previews, ROI metrics, and `/scoping` deep-links.
5. **No External Chat Apps Required:** Controlled 100% via a web interface accessible from mobile or desktop browsers.

---

## Architecture Diagram

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ☁️ VERCEL CLOUD CRON (24/7)                          │
 │                    (Runs 2x Daily at 09:00 IST & 17:00 IST)                │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      🤖 GEMINI 2.5 FLASH AI ENGINE                          │
 │  • Sources/Searches Leads (Web & Directory Search)                          │
 │  • Parses Lead Profile / Website → Drafts Personal Email Pitch              │
 │  • Parses Git Log / Projects → Drafts 60/40 Social Posts (X & LinkedIn)      │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      🗄️ SUPABASE PERSISTENCE LAYER                           │
 │  • `outreach_leads` (Target profiles, status, custom pitch, draft_json)     │
 │  • `social_drafts` (Platform, post_body, media_urls, scheduled_time, status)│
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                   💻 WEB CONTROL CENTER (`/admin`)                │
 │  • Pending Approvals Queue (Swipe/Click to Approve, Edit, or Dismiss)       │
 │  • Manual CSV Import Backup (Drag & Drop Lead Lists)                        │
 │  • Daily Quotas & Dispatch Telemetry Dashboard                              │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Upon 1-Click Approval)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       🚀 MULTI-CHANNEL DISPATCHERS                          │
 │  • Google Gmail API (OAuth2 Refresh Token) → Sends Email                    │
 │  • X (Twitter) API v2 / Buffer API → Publishes Social Post                  │
 │  • LinkedIn API / Buffer API → Publishes Professional Update                │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Implementation Phases

### Phase 1: Database Schema & Authentication Infrastructure
- [ ] **Supabase Tables & Security RLS:**
  - Create `outreach_leads` table: `id`, `lead_name`, `company`, `role`, `source_url`, `email`, `linkedin_url`, `twitter_handle`, `ai_generated_pitch`, `status` (`pending`, `approved`, `sent`, `rejected`), `created_at`, `updated_at`.
  - Create `social_drafts` table: `id`, `platform` (`twitter`, `linkedin`), `post_body`, `content_category` (`tech_insight`, `business_outcome`), `status` (`draft`, `approved`, `published`), `scheduled_time`, `published_at`.
  - Apply strict RLS policies (Server Role Key / Admin session only).
- [ ] **OAuth2 Credentials & Security Setup:**
  - Configure Google Cloud OAuth2 Client ID for Gmail API (`https://www.googleapis.com/auth/gmail.send`).
  - Store encrypted Refresh Tokens in Vercel Environment Variables (`GMAIL_OAUTH_REFRESH_TOKEN`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`).
  - Configure X API / Buffer API OAuth tokens for social publishing.

---

### Phase 2: AI Prospecting & Draft Generation Engine (Upgraded to Gemini 3.6 Flash)
- [x] **Centralized Prompt & Model Config (`src/data/outreach_defaults.json`):**
  - Standardized on `gemini-3.6-flash` across all synchronizer Python tools and Next.js routes.
  - Centralized target queries, system prompts, CTA deep links, and minimum quality score thresholds (`75/100`).
- [x] **Multi-Source Job Board & Web Scraper (`src/app/api/outreach/prospect/route.ts` & `scripts/sync_tabs/outreach.py`):**
  - Direct integration with open high-intent hiring feeds: Hacker News 'Who is Hiring' API, WeWorkRemotely RSS, and RemoteOK.
  - Positioned Prateek as Forward Deployed Engineer & AI Solutions Architect.
- [x] **2-Step AI Quality Evaluation & Pitch Generator:**
  - **Step 1 (AI Evaluator)**: Calls Gemini 3.6 Flash to evaluate web snippets, discard directory list sellers (`goodfirms`, `clutch`, `readycontacts`, `datacaptive`, `yellowpages`), and return quality scores.
  - **Step 2 (AI Pitcher)**: Generates 3-sentence tailored B2B pitches with targeted instant scoping CTA (`https://prateeq.in/scoping?engine=saas&goal=autonomous_agents`).
- [x] **Streamlit GUI Config Expander & Quality Badges (`scripts/sync_tabs/outreach.py`):**
  - Display quality score badges (`⭐ Score: 95/100 | Source: hn_whoishiring`).
  - Added "⚙️ Target Search Sources & AI Settings" GUI editor for live prompt & query customization.

---

### Phase 3: Web Control Center UI (`/admin` or `/dashboard/outreach`)
- [ ] **Pending Approvals Queue UI:**
  - Build responsive Next.js 16 React 19 Client Component with tabbed view: `Draft Emails`, `Social Posts`, `Dispatched History`.
  - Add inline rich-text editor for quick pitch modifications before sending.
  - Add **1-Click Actions**: `[ 🟢 Approve & Send ]`, `[ ✏️ Edit Draft ]`, `[ ❌ Dismiss ]`.
- [ ] **Manual CSV Import Component:**
  - Drag-and-drop CSV uploader for manual lead lists (fallback/hybrid support).
- [ ] **Daily Quota & Health Telemetry:**
  - Visual gauges for daily limits (e.g. 5/15 Emails Sent, 1/2 Social Posts Published).
  - Open & click tracking metrics.

---

### Phase 4: Cloud Cron Worker & Dispatchers
- [ ] **Vercel Cloud Cron Job (`src/app/api/cron/outreach-agent/route.ts`):**
  - Secure cron endpoint validated via `CRON_SECRET`.
  - Triggered 2x daily (09:00 IST & 17:00 IST) to execute lead scanning & draft generation.
- [ ] **Gmail API Dispatcher (`src/lib/agent/gmailDispatcher.ts`):**
  - Execute MIME message encoding and send via Google Gmail API.
- [ ] **Social Media Dispatcher (`src/lib/agent/socialDispatcher.ts`):**
  - Publish approved tweets and LinkedIn updates via Buffer API or official REST endpoints.

---

### Phase 5: Verification & Safety Guardrails
- [ ] **Deduplication Engine:** Check against previously contacted domain names and email addresses to avoid spamming the same contact.
- [ ] **Unsubscribe / Opt-Out Support:** Automatically append clean opt-out footers on outreach emails.
- [ ] **Error Handling & Fallbacks:** Fallback gracefully if API quotas are reached or network timeouts occur.

---

## File Architecture Map

```text
src/
├── app/
│   ├── admin/
│   │   └── outreach/
│   │       ├── page.tsx                    # Web Control Center Main View
│   │       └── outreach.module.css         # UI Styling
│   └── api/
│       ├── cron/
│       │   └── outreach-agent/
│       │       └── route.ts                # 24/7 Vercel Cloud Cron Endpoint
│       └── outreach/
│           ├── approve/route.ts            # 1-Click Dispatch API
│           ├── reject/route.ts             # Dismiss Lead API
│           └── import-csv/route.ts         # Hybrid CSV Lead Import API
├── lib/
│   └── agent/
│       ├── prospector.ts                   # Lead Discovery & Search
│       ├── pitcher.ts                      # Gemini Pitch Personalizer
│       ├── contentGenerator.ts             # 60/40 Social Post Generator
│       ├── gmailDispatcher.ts              # OAuth2 Gmail Email Sender
│       └── socialDispatcher.ts             # Buffer / X / LinkedIn Publisher
└── data/
    └── outreach_defaults.json              # Pitch templates & seed prompts
```

---

## Status & Execution Plan

- [x] **Requirements & Channel Alignment** (All 3 Channels: Gmail + X + LinkedIn, Hybrid Sourcing, 60/40 Content Mix, OAuth2 Auth)
- [x] **Roadmap Documentation Created** (`docs/AI_OUTREACH_AGENT_ROADMAP.md`)
- [ ] **Execution Phase 1–5:** To be started immediately after completing current primary portfolio & dashboard roadmap items.

---

## **Related Architecture & Cross-References**

- [Master Roadmap (Milestones 57–58)](UNIFIED_MASTER_ROADMAP.md)
- [Gemini 2.5 Flash Integration](12_AI_Integration_Strategy.md)
- [OAuth2 & Anti-Ban Rate Limiting](16_Security_and_Privacy.md)
- [Admin Control Center (`/admin`)](09_Section_Specifications/13_Client_Workspace_Dashboard.md)
- [Cold Outreach Conversion Scripts](REVENUE_EXECUTION_PLAN.md)
- [Architecture Node: Route /admin](architecture_nodes/Route_admin.md)
- [Architecture Node: Admin Portal](architecture_nodes/UI_AdminPortal.md)
- [Architecture Node: Outreach Dispatch API](architecture_nodes/API_outreach_dispatch.md)
- [Architecture Node: Outreach Leads Schema](architecture_nodes/Schema_outreach_leads.md)