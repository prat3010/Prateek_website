# End-to-End Account Creation, Observability, and Lifecycle Flow Audit

**Document Reference**: `AUD-ACCOUNT-OBSERVABILITY-2026-11`  
**Audit Date**: November 2026  
**Author**: Systems Architecture & Security Audit Specialist  
**Target Codebase**: `Prateek_website` (Next.js 16 App Router, React 19, TypeScript), `Supabase` (PostgreSQL 16, pgvector, Supabase Auth), and `Retriever` (FastAPI, pgvector, Ollama on Oracle Cloud VPS)  
**Integrity Mode**: Strictly Read-Only Investigation (No modifications to existing code or database tables)

---

## Table of Contents

1. [Executive Summary & Audit Scope](#1-executive-summary--audit-scope)
2. [End-to-End Architecture Topology](#2-end-to-end-architecture-topology)
3. [Deep-Dive Subsystem Audits](#3-deep-dive-subsystem-audits)
   - [3.1 Subsystem 1: User Signup & Authentication](#31-subsystem-1-user-signup--authentication)
   - [3.2 Subsystem 2: Observability & Telemetry](#32-subsystem-2-observability--telemetry)
   - [3.3 Subsystem 3: Session Stitching](#33-subsystem-3-session-stitching)
   - [3.4 Subsystem 4: Welcome & Transaction Emails](#34-subsystem-4-welcome--transaction-emails)
   - [3.5 Subsystem 5: Error Handling & Resilience](#35-subsystem-5-error-handling--resilience)
   - [3.6 Subsystem 6: Security and Row-Level Security (RLS)](#36-subsystem-6-security-and-row-level-security-rls)
   - [3.7 Subsystem 7: Profile Management](#37-subsystem-7-profile-management)
   - [3.8 Subsystem 8: Tenant Provisioning](#38-subsystem-8-tenant-provisioning)
   - [3.9 Subsystem 9: Payment and Invoicing](#39-subsystem-9-payment-and-invoicing)
   - [3.10 Subsystem 10: Lifecycle Notifications and Alerts](#310-subsystem-10-lifecycle-notifications-and-alerts)
4. [Unified Capability Matrix](#4-unified-capability-matrix)
5. [Identified Failure Modes & Architectural Risk Catalog](#5-identified-failure-modes--architectural-risk-catalog)
6. [Prioritized Remediation Plan & Recommendations](#6-prioritized-remediation-plan--recommendations)
7. [Verification Commands & Independent Attestation](#7-verification-commands--independent-attestation)

---

## 1. Executive Summary & Audit Scope

This document provides the definitive, comprehensive end-to-end architectural and security audit of the user account creation, telemetry observability, and customer lifecycle management flow across the `Prateek_website` ecosystem. 

The audit evaluates the complete user journey from anonymous exploration and cognitive scoping through authentication, workspace provisioning, commercial checkout, and ongoing lifecycle management. It benchmarks existing capabilities against required administrative controls and client-facing interfaces across ten distinct operational subsystems.

### Key Audit Findings

#### Architectural Strengths
1. **Cryptographic Token Verification**: Session authentication on protected `/api/client/*` routes delegates directly to Supabase Auth's `getUser()` API, enforcing cryptographic signature validation and expiration checks.
2. **Anti-Tampering Payment Pipeline**: Razorpay order generation enforces canonical quote re-computation against catalog definitions (`recalculateCanonicalScopeQuote`), preventing client-side price manipulation.
3. **Webhook Idempotency & Signature Defense**: Razorpay webhooks enforce timing-safe HMAC-SHA256 signature verification and utilize a database-backed unique event ledger (`processed_webhooks`) to prevent double-crediting.
4. **Zero-Latency Edge Telemetry**: Edge proxy middleware (`src/proxy.ts`) logs visits asynchronously via `event.waitUntil()`, enforcing GDPR-compliant daily salt IP hashing (`SHA-256(ip + '-' + YYYY-MM-DD)`).
5. **Cognitive LLM Tracing**: Every conversational turn in the scoping copilot logs granular performance metrics (token counts, prompt latency, reasoning tags, model used, and country) to `scoping_chat_traces`.
6. **Heuristic Copilot Fallback**: The scoping copilot features a graceful streaming fallback mechanism (`buildFallbackResponseText`) that ensures zero-downtime service when the cognitive backend is offline.
7. **Retriever OCI PostgreSQL Hardening**: The Retriever backend enforces PostgreSQL `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` across all tenant-scoped tables, binding access to `SET LOCAL app.current_tenant_id`.

#### Critical Vulnerabilities & High-Risk Architectural Gaps
1. **Missing RLS on Public Schema Tables (RSK-05)**: Table `promo_codes` (created in `supabase/migrations/20260825_promo_codes.sql`) lacks Row-Level Security entirely, allowing anonymous users to query all discount codes, rates, and partner IDs. Additionally, tables `tenants`, `documents`, `document_chunks`, `vector_records`, and `social_drafts` in `supabase_schema.sql` omit RLS.
2. **Plaintext API Key Storage in `rag_tenants` (RSK-06)**: Column `api_key TEXT` in `rag_tenants` stores unencrypted administrative API keys (`ret_live_...`). Because the RLS SELECT policy permits any workspace member to query `rag_tenants`, standard members can extract administrative credentials.
3. **Scope Deposit Tenant Orphanage (RSK-03)**: When a client pays a project deposit via Razorpay (`src/app/api/webhooks/razorpay/route.ts`), the webhook provisions an engine tenant and uploads the Statement of Work (SOW), but **fails to insert a membership record into `rag_tenant_members`** for the client email. Consequently, navigating to `/rag/app` creates an empty starter workspace, permanently orphaning the project workspace.
4. **Subscription `clients` Upsert Schema Mismatch (RSK-04)**: Subscription activation handlers in `verify-razorpay-subscription` and `webhooks/razorpay` attempt to upsert columns `name` (instead of `full_name`) and non-existent `notes` into `clients`. PostgreSQL rejects the mutation, leaving `clientId` null and SaaS subscribers unrecorded in `clients`.
5. **Serverless Dangling Promise in Auth Callback (RSK-01)**: In `src/app/auth/callback/route.ts`, `stitchAnonymousSession` is dispatched without `await` and without `event.waitUntil()`. In Vercel serverless lambda environments, returning `NextResponse.redirect` immediately freezes or terminates the execution context, risking premature aborts during trace and lead stitching.
6. **Contact Form Data Loss & Zero Persistence for Standard Inquiries (RSK-02)**: In `src/app/api/contact/route.ts`, standard inquiries (`name`, `email`, `subject`, `message`) without `intakeDetails` have zero database persistence. Furthermore, for intake briefs, Resend email dispatch precedes database insertion into `intake_leads`. An email delivery failure causes an immediate HTTP 400 response, permanently discarding the contact inquiry.
7. **Missing User Welcome & Auto-Reply Communications**: While administrative alerts exist, **no welcome email is sent to newly registered users**, no confirmation email is sent upon contact form submission, and no scoping brief is delivered to unauthenticated prospects.
8. **Admin Alert Spam on Routine Logins (RSK-07)**: `src/app/auth/callback/route.ts` fires `sendAdminSignupNotification` unconditionally on every login, spamming the administrator whenever returning clients access the platform.
9. **Single-Tenant Assumption in SaaS Studio**: `GET /api/rag/tenant` uses `.limit(1).maybeSingle()`, preventing users invited to multiple workspaces from switching between them.
10. **Lack of Self-Service Subscription Management**: Users cannot cancel or pause recurring SaaS or Care Plan subscriptions from `/dashboard` or `/rag/app`.

---

## 2. End-to-End Architecture Topology

The platform operates across three distributed physical tiers:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRATEEK ECOSYSTEM TOPOLOGY                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [Client Browser / Mobile User]
                │
                ▼
  ┌────────────────────────────────────────────────────────────────────────────────────┐
  │ TIER 1: WEB APPLICATION & CONTROL PLANE (Vercel Edge / Node.js 20 - prateeq.in)    │
  │                                                                                    │
  │  • App Router (Next.js 16, React 19)                                               │
  │    ├── Public Portfolio: `/`, `/terminal`, `/playground`, `/blog`                  │
  │    ├── Scoping Engine: `/scoping` (Instant Quote Wizard, Architectural Cart)       │
  │    ├── Client Portal: `/dashboard` (Google Auth, Scopes, Invoices, Delivery)       │
  │    ├── SaaS App Studio: `/rag/app` (Document Library, Chat Studio, Visualizer)     │
  │    └── Admin Center: `/admin` (Hardcoded Auth Gate, Outreach Queue, Ledger)        │
  │                                                                                    │
  │  • Edge Proxy (`src/proxy.ts`): Honeypot Filter, Geo-IP, GDPR Salted Hashing       │
  │  • Universal Storage Adapter (`universalStorage`): 3000-byte Cookie Chunking       │
  │  • Session Verification (`sessionVerify.ts`): Cryptographic Bearer Token Check     │
  └───────────────┬──────────────────────────────────┬─────────────────────────────────┘
                  │                                  │
                  ▼                                  ▼
  ┌─────────────────────────────────┐  ┌───────────────────────────────────────────────┐
  │ TIER 2: PERSISTENCE & IDENTITY  │  │ TIER 3: COGNITIVE RAG ENGINE                  │
  │ (Supabase PostgreSQL 16)        │  │ (Oracle Cloud VPS 130.210.35.134 Ubuntu 24.04)│
  │                                 │  │                                               │
  │  • Supabase Auth (`auth.users`) │  │  • FastAPI Core (`https://rag.prateeq.in`)    │
  │  • Commercial Core:             │  │  • Local Ollama (`nomic-embed-text`)          │
  │    `clients`, `client_scopes`,  │  │  • Pgvector Vector Store                      │
  │    `invoices`, `change_orders`  │  │  • Hybrid Fusion Search:                      │
  │  • Telemetry & Intelligence:    │  │    HNSW + BM25 + ColBERT MaxSim               │
  │    `page_visits`,               │  │  • Multi-Tenancy Engine:                      │
  │    `scoping_chat_traces`,       │  │    FORCE ROW LEVEL SECURITY                   │
  │    `intake_leads`,              │  │    `SET LOCAL app.current_tenant_id`          │
  │    `processed_webhooks`         │  │  • Dedicated Web Studio:                      │
  │  • Multi-Tenant SaaS:           │  │    `https://admin.rag.prateeq.in`             │
  │    `rag_tenants`,               │  │    (`/onboard`, API Keys, System Prompts)     │
  │    `rag_tenant_members`,        │  └───────────────────────────────────────────────┘
  │    `rag_subscriptions`          │
  └─────────────────────────────────┘
```

---

## 3. Deep-Dive Subsystem Audits

### 3.1 Subsystem 1: User Signup & Authentication

#### Architecture & Implementation Blueprint
Authentication utilizes Supabase Auth via `@supabase/ssr` on the server and a browser client configured with a custom storage adapter in `src/lib/auth.ts`.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW MAP                              │
└────────────────────────────────────────────────────────────────────────────────┘
 [Client: /login or /dashboard]
        │
        ├──> signInWithGoogle(redirectTo) ────> Google OAuth 2.0 (select_account)
        │                                              │
        └──> signInWithMagicLink(email)   ────> Supabase Auth OTP Email (token_hash)
                                                       │
                                                       ▼
                                          [Server Callback Route]
                                          /auth/callback/route.ts
                                                       │
                                      ┌────────────────┴────────────────┐
                                      ▼                                 ▼
                         exchangeCodeForSession(code)      verifyOtp({ token_hash, type })
                                      │                                 │
                                      └────────────────┬────────────────┘
                                                       ▼
                                            [Session Established]
                                                       │
                                ┌──────────────────────┼──────────────────────┐
                                ▼                      ▼                      ▼
                     Set Cookie:              Trigger Admin Alert:    Trigger Async Stitching:
                 'prateeq_active_user'     sendAdminSignupNotification  stitchAnonymousSession
                 (JSON user, MaxAge 30d)     (Resend async alert)      (Traces & Draft Leads)
                                                       │
                                                       ▼
                                     [Destination Redirect Resolution]
                                        - Admin User -> /admin
                                        - Client User -> /dashboard (or `next` param)
```

#### Exact Code and Schema References
- `src/app/auth/callback/route.ts`: Lines 8–114. Handles PKCE session code exchange, OTP verification, cookie configuration, admin alerts, and redirect routing.
- `src/lib/auth.ts`: Lines 7–15. Defines `ADMIN_EMAILS` array (`3010prateeksharma@gmail.com`, `prateeqsharma@gmail.com`) and `isAdminEmail(email)`.
- `src/lib/auth.ts`: Lines 18–97. Implements `universalStorage` dual LocalStorage + cookie chunking adapter (splits values > 3000 bytes into `${key}_chunk_${i}` with `maxAge: 30 days`, `SameSite: Lax`).
- `src/lib/auth.ts`: Lines 105–174. Exports client initiators: `signInWithGoogle()`, `signOut()`, and `signInWithMagicLink()`.
- `src/context/AuthContext.tsx`: Lines 50–295. Hydrates `prateeq_active_user`, listens to `onAuthStateChange`, and manages client fallback PKCE/hash token exchange.
- `src/context/AuthContext.tsx`: Lines 32–48, 252–278. Implements `isJwtExpired()` and `getAccessToken()` for automatic token refresh prior to API requests.
- `src/app/login/page.tsx`: Lines 10–166. Unified login interface for Google OAuth and Magic Link dispatch.
- `src/app/rag/login/page.tsx`: Lines 18–20. Redirects `/rag/login` to `/login?context=rag&redirect_to=/rag/app`.
- `src/lib/supabase/server.ts`: Lines 8–28. Configures `@supabase/ssr` `createServerClient` reading/writing cookies via Next.js `cookies()`.

#### Confirmed Capabilities
1. **Google OAuth (PKCE Flow)**: Supports full PKCE flow with `access_type: 'offline'` and `prompt: 'select_account'` ensuring refresh token minting. Normalizes origins (`www.prateeq.in` → `prateeq.in`) to prevent cookie stripping across domains.
2. **Passwordless Magic Link**: Dispatches Supabase OTP magic links, verified securely on the server via `token_hash` and `type=email`.
3. **Safari ITP Cookie Chunking**: `universalStorage` divides tokens larger than 3000 bytes into separate chunk cookies (`_chunk_0`, `_chunk_1`), preventing the 4096-byte mobile Safari cookie truncation bug.
4. **Proactive JWT Refresh**: `getAccessToken()` decodes JWT expiration (`exp`) and automatically invokes `supabaseAuth.auth.refreshSession()` before dispatching requests to protected endpoints.
5. **Admin Routing Gate**: Authenticated users matching `ADMIN_EMAILS` are automatically routed to `/admin` instead of `/dashboard`.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No User Management Interface**: The `/admin` dashboard has zero capabilities to list, inspect, filter, disable, or delete user accounts registered in `auth.users`.
  - **Hardcoded Authorization**: Admin access is governed by an in-memory string array in `src/lib/auth.ts:7–10`. There is no database-backed role-based access control (RBAC).
  - **No Account Impersonation**: Admin cannot securely inspect a client's workspace dashboard without client credentials or manipulating URL preview flags (`?preview=client`).
- **User Persona**:
  - **Email & Password Authentication Absent**: Completely missing from codebase. Users in enterprise networks where security filters intercept magic link tokens cannot authenticate.
  - **No Self-Service Account Deletion**: Users cannot delete their account or download a data export (GDPR compliance gap).
  - **No Multi-Factor Authentication (MFA)**: No TOTP or WebAuthn support.
  - **Client-Only Logout**: `handleLogout` removes cookies client-side without calling a dedicated server logout route (`/api/auth/signout`) to guarantee revocation on edge proxies.

#### Failure Modes and Edge Cases
- **Admin Alert Spam on Routine Logins**: `route.ts:63` calls `sendAdminSignupNotification` whenever code/OTP exchange succeeds, sending a "New User Sign-Up Alert" email on **every routine login** by returning clients.
- **Uncaught Fire-and-Forget Callback Errors**: `sendAdminSignupNotification` and `stitchAnonymousSession` run asynchronously with `.catch(console.warn)`. If an error occurs, the callback redirects silently, leaving traces unstitched.
- **Duplicate Account Linking Errors**: If a user logs in via Magic Link and later attempts Google OAuth with the same email, Supabase Auth throws an identity conflict if automatic account linking is disabled in project settings.

---

### 3.2 Subsystem 2: Observability & Telemetry

#### Architecture & Implementation Blueprint
Observability operates at the edge via `src/proxy.ts`, within the database via stored procedures and triggers, and inside the cognitive scoping copilot via `src/lib/scopingObservability.ts`.

#### Exact Code and Schema References
- `src/proxy.ts`: Lines 1–137. Edge proxy middleware executing visit logging asynchronously via `event.waitUntil()`. Matcher configuration on lines 123–136 explicitly excludes `/api/*`.
- `src/lib/security.ts`: Lines 4–11 (`getIpHash` rotating daily salt), lines 23–32 (`HONEYPOT_PATTERNS`).
- `src/lib/tracing.ts`: Lines 13–23. Generates W3C-compliant `traceparent` headers (`00-{traceId}-{spanId}-01`).
- `supabase_schema.sql`: Lines 7–20 (`page_visits` DDL), lines 23–36 (RLS policies), lines 40–55 (`trg_purge_old_visits` & `purge_old_page_visits()`), lines 72–73 (composite index `idx_page_visits_dashboard`), lines 506–584 (`get_analytics_summary(cutoff_time)` RPC).
- `src/app/api/analytics-summary/route.ts`: Lines 1–131. Executes `get_analytics_summary` with in-memory fallback.
- `src/app/analytics/page.tsx` & `src/app/analytics/_lib/analytics.ts`: Lines 28–100. Aggregates and renders analytics charts.
- `src/lib/scopingObservability.ts`: Lines 37–119. `logScopingChatTrace` writes cognitive telemetry to `scoping_chat_traces`.
- `supabase/migrations/20261025000000_scoping_chat_traces.sql`: Lines 13–48. Schema, indexes, and RLS for scoping traces.
- `src/app/api/rag/telemetry/route.ts`: Lines 6–180. Upstream proxy to Retriever OCI `/v1/admin/tenants/{tenantId}/telemetry/live`.

#### Confirmed Capabilities
1. **Zero-Latency Edge Visit Ingestion**: Offloads `page_visits` database inserts to `event.waitUntil()`, ensuring zero impact on HTTP response time.
2. **GDPR-Compliant Rotating Salt Hashing**: Hashes IP addresses using `SHA-256(ip + '-' + YYYY-MM-DD)`. This enables daily unique visitor deduplication without storing persistent PII.
3. **Automated Bot & Honeypot Filtering**: Evaluates user agents via `@next/server` `userAgent()`. Drops traffic matching bots or `HONEYPOT_PATTERNS` (`/\.php$/`, `/wp-admin/`, `/\.env/`, `/actuator/`, `/setup/`) before triggering database operations.
4. **Geo-IP Location Privacy Guard**: Ingests Vercel's `x-vercel-ip-country` header while explicitly setting city and region to `null`, preventing inaccurate ISP-derived geolocation and reducing storage bloat.
5. **High-Performance Analytics RPC**: `get_analytics_summary` computes views, bots, unique visitors, devices, referrers, and a 14-day timeline in a single database pass.
6. **Turn-Level Cognitive Tracing**: Records model identifier, prompt/completion token counts, reasoning tags, latency, fallback status, quotes, and visitor country for every scoping conversation turn.
7. **RAG Studio SLA Telemetry**: Integrates with Retriever OCI to display token usage, document counts, faithfulness metrics, precision, and p99 latency in `/rag/app`.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **API Route Observability Gap**: The proxy matcher explicitly excludes `/api/*`. API endpoint latencies, error spikes, and usage patterns are not logged to `page_visits`.
  - **Exploit Telemetry Black Hole**: Requests matching `HONEYPOT_PATTERNS` are silently dropped without incrementing an attack counter or logging an audit entry in `/admin`.
  - **Admin UI Discarding of Scoping Traces**: In `src/app/api/admin/intake-leads/route.ts:21–30, 60`, the backend queries the last 200 conversational turns from `scoping_chat_traces` and returns `{ leads: enrichedLeads, traces: rawTraces }`. However, in `src/app/admin/page.tsx:204`, the frontend client state handler executes `setIntakeLeads(data.leads || [])`, completely ignoring `data.traces`. Furthermore, line 1448 strictly iterates over `intakeLeads.map(...)`. There is zero UI in `/admin` to display unattached traces. High-intent prospects who engage in extensive technical scoping conversations with the copilot but bounce before submitting an intake brief remain 100% invisible to the administrator in `/admin`.
- **User Persona**:
  - **No Account Activity Log**: Verified clients in `/dashboard` have no interface to review past login history, active sessions, or access logs.

#### Failure Modes and Edge Cases
- **Silent Telemetry Dropping on DB Outage**: In `src/proxy.ts:112`, database insertion errors are caught and logged only to `console.error`. Page visits are dropped without buffering or retry queues.
- **UTC Salt Transition Splitting**: Because the IP salt rotates at 00:00:00 UTC, a visitor browsing across the midnight boundary registers as two unique visitors.
- **Admin Visits Inflate Diagnostic Telemetry**: While `src/proxy.ts:59` skips logging for `/admin`, it does not skip tracking for `/analytics` or `/terminal`.

---

### 3.3 Subsystem 3: Session Stitching

#### Architecture & Implementation Blueprint
Session stitching reconciles anonymous pre-login exploratory state with verified user accounts upon authentication completion.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                           SESSION STITCHING MAP                                │
└────────────────────────────────────────────────────────────────────────────────┘
 [Anonymous Exploration]
   ├── Scoping Copilot (Chat)    ──> Sets Cookie: `prateeq_chat_session_id` (30 days)
   ├── Instant Quote Wizard      ──> Sets LocalStorage + Cookie: `prateeq_pending_scope` (24 hrs)
   └── Draft Intake Brief        ──> Sets Cookies: `prateeq_draft_token`, `prateeq_pending_scope_code` (7 days)
                                                │
                                                ▼
                                    [User Completes OAuth]
                                    /auth/callback/route.ts
                                                │
                                                ▼
                                 stitchAnonymousSession(...)
                                                │
                      ┌─────────────────────────┴─────────────────────────┐
                      ▼                                                   ▼
         [scoping_chat_traces]                                     [intake_leads]
   Update `user_email` from NULL                             Update `contact_email` from
   to authenticated user email                               'lead@unauthenticated.client'
                                                             to authenticated user email
```

#### Exact Code and Schema References
- `src/app/api/scoping/chat/route.ts`: Lines 1225, 1308–1312, 1483, 1623. Sets and refreshes cookie `prateeq_chat_session_id`.
- `src/app/api/scoping/session/route.ts`: Lines 7–54. Mints and validates `prateeq_chat_session_id`.
- `src/app/api/client/intake-draft/route.ts`: Lines 29–48, 141–151, 236–249. Sets `prateeq_draft_token` and `prateeq_pending_scope_code`.
- `src/components/Intake/useIntakeFormState.ts`: Lines 243, 878–879, 910–911, 967–968. Synchronizes `prateeq_pending_scope` to `localStorage` and cookies.
- `src/lib/terminalScoping.ts`: Lines 75–142. Hydrates scoping sessions from `localStorage['prateeq_pending_scope']`.
- `src/app/auth/callback/route.ts`: Lines 70–100. Reads tracking cookies and dispatches `stitchAnonymousSession`.
- `src/lib/scopingObservability.ts`: Lines 124–175. Implements `stitchAnonymousSession()`.
- `supabase_schema.sql`: Lines 622–652 (`intake_leads` DDL), lines 664–740 (`convert_draft_lead_to_scope` stored procedure).
- `src/hooks/dashboard/useDashboardScopes.ts`: Lines 15–95 (`parsePendingScopeFromStorageOrUrl`).
- `src/app/api/client/save-scope/route.ts`: Lines 80–122. Converts `intake_leads` record to status `'converted'`.

#### Confirmed Capabilities
1. **Four-Key State Machine**: Maintains state across four coordinated storage keys:
   - `prateeq_chat_session_id`: Cookie, 30 days (`Max-Age=2592000`), SameSite=Lax.
   - `prateeq_draft_token`: Cookie, 7 days (`Max-Age=604800`), SameSite=Lax.
   - `prateeq_pending_scope_code`: Cookie, 7 days (`Max-Age=604800`), SameSite=Lax.
   - `prateeq_pending_scope`: LocalStorage + Cookie, 24 hours (`max-age=86400`).
2. **IDOR-Protected Draft Mutations**: Updates to existing `intake_leads` rows require proof of ownership: either matching `prateeq_draft_token` or matching verified session email (`getVerifiedSessionEmail`). Unauthorized updates return 403 Forbidden.
3. **Automated Trace & Lead Stitching**: Upon authentication callback, `stitchAnonymousSession` updates all associated records in `scoping_chat_traces` and `intake_leads` to the authenticated email.
4. **Safari Private Browsing Resilience**: `useDashboardScopes.ts` cascades through LocalStorage, cookie fallback, and URL parameters (`?imported=true&scopeCode=...`), surviving Safari cookie suppression.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **Dead Code Stored Procedure**: Stored procedure `convert_draft_lead_to_scope` in `supabase_schema.sql:664–740` is never called by the application; conversion logic was re-implemented in TypeScript in `save-scope/route.ts`.
- **User Persona**:
  - **Cross-Device Scoping Disconnect**: If a user scopes a project on mobile Safari and completes Google OAuth on desktop, cookies do not bridge devices. The desktop workspace appears empty.
  - **Chat Transcript Invisible to Client & Partial Admin Visibility**: Clients in `/dashboard` cannot view their prior AI scoping conversation transcripts. Furthermore, while the administrator can view transcripts attached to submitted intake leads in `/admin`, unattached conversational traces (prospects who chatted with the copilot but bounced before generating a lead) are discarded by `src/app/admin/page.tsx:204` and cannot be viewed in `/admin`.

#### Failure Modes and Edge Cases
- **Vercel Serverless Dangling Promise Failure (RSK-01)**:
  In `src/app/auth/callback/route.ts:92–99`:
  ```typescript
  Promise.resolve(
    stitchAnonymousSession(effectiveSessionId, user.email, pendingScopeCode, pendingDraftToken)
  ).catch(err => console.warn('Session stitching warning in auth callback:', err));
  return response; // Immediate 302 redirect
  ```
  Because `route.ts` lacks `event.waitUntil()`, returning `NextResponse.redirect` terminates the serverless lambda execution context immediately. As a result, database updates to `scoping_chat_traces` and `intake_leads` may be abruptly aborted before completion.
- **Insecure Cookie Configuration (RSK-08)**: Cookies `prateeq_chat_session_id`, `prateeq_draft_token`, and `prateeq_pending_scope_code` lack `HttpOnly: true` and omit `Secure: true` in development and fallback headers, exposing them to XSS exfiltration.

---

### 3.4 Subsystem 4: Welcome & Transaction Emails

#### Architecture & Implementation Blueprint
Email operations are centralized in `src/lib/emailNotification.ts` using the official Resend SDK (`resend` package). The sender domain is verified as `prateeq.in`.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                         EMAIL NOTIFICATION DISPATCH MAP                        │
└────────────────────────────────────────────────────────────────────────────────┘
 [Trigger Event]                                             [Recipient & Format]
       │
       ├──> User Login/Signup (/auth/callback) ────────────> Admin Alert ONLY (No User Email!)
       │
       ├──> Contact Form (/api/contact) ───────────────────> Admin Alert ONLY (No User Confirmation!)
       │
       ├──> Scoping Intake Lead (architecture_nodes/Route_scoping.md) ────────────────> Admin Alert ONLY (sendAdminIntakeLeadNotification)
       │
       ├──> Scope Saved/Updated (/api/client/save-scope) ──> Admin Alert ONLY (sendAdminScopeSavedNotification)
       │
       ├──> Milestone Payment (Razorpay Webhook) ──────────> DUAL: Admin Alert + Client Official Receipt
       │
       ├──> Retainer/SaaS Subscription (Webhook) ──────────> DUAL: Admin Alert + Subscriber Receipt & Onboarding
       │
       ├──> Change Order Approved/Paid (/admin) ───────────> Client Alert (sendClientChangeOrderUpdateNotification)
       │
       ├──> Stage Advanced: Engineering/Staging/Live ──────> Client Alert (sendClientMilestoneStageAdvancedNotification)
       │
       └──> 100% Zero-Balance Settlement (Webhook) ────────> DUAL: Admin Handover Due + Client IP Transfer Receipt
```

#### Exact Code and Schema References
- `src/lib/emailNotification.ts`: Lines 1–1098. Implements all 11 email notification templates.
- `src/lib/emailNotification.ts`: Lines 37–100 (`sendAdminSignupNotification`).
- `src/lib/emailNotification.ts`: Lines 118–175 (`sendAdminIntakeLeadNotification`).
- `src/lib/emailNotification.ts`: Lines 180–230 (`sendAdminScopeSavedNotification`).
- `src/lib/emailNotification.ts`: Lines 235–330 (`sendPaymentConfirmationNotifications`).
- `src/lib/emailNotification.ts`: Lines 334–378 (`sendAdminChangeOrderNotification`).
- `src/lib/emailNotification.ts`: Lines 382–428 (`sendAdminOnboardingCompletedNotification`).
- `src/lib/emailNotification.ts`: Lines 433–511 (`sendRetrieverSubscriptionNotifications`).
- `src/lib/emailNotification.ts`: Lines 529–668 (`sendClientMilestoneStageAdvancedNotification`).
- `src/lib/emailNotification.ts`: Lines 690–804 (`sendClientChangeOrderUpdateNotification`).
- `src/lib/emailNotification.ts`: Lines 808–964 (`sendFinalBalanceSettlementNotifications`).
- `src/lib/emailNotification.ts`: Lines 985–1098 (`sendHotLeadAlertNotification`).
- `src/app/api/contact/route.ts`: Lines 138–242. Admin alert for contact submissions.
- `src/app/api/rag/invite/route.ts`: Lines 101–145. Resend workspace team invitation dispatch.
- `src/app/api/admin/draft-pitch/route.ts`: Lines 117–160. Manual admin pitch dispatch.

#### Confirmed Capabilities
1. **Commercial Lifecycle Receipts**: Dispatches branded, responsive HTML receipts for all financial events (deposit, balance, change order, subscription), formatting currency (`INR` vs `USD`) and providing direct workspace links.
2. **Automated Stage Progression Notices**: Automatically notifies clients with tailored copy and deep links when their project advances to `engineering`, `staging`, or `live`.
3. **Escrow & Hot Lead Alerts**: Dispatches real-time executive alerts to `CONTACT_EMAIL_TO` for high-value scopes (≥ $2,500 / ₹2,00,000) or escrow inquiries.
4. **Sanitized HTML Rendering**: Strictly sanitizes dynamic inputs with `escapeHtml()` and validates URLs with `sanitizeUrl()`, mitigating HTML injection and email phishing risks.
5. **Webhook Idempotency Protection**: Webhook-triggered emails verify `processed_webhooks`, preventing duplicate receipts on Razorpay retries.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Email Audit & Delivery Ledger**: There is **no database table (e.g. `email_logs`, `notification_history`)** tracking dispatched emails, Resend message IDs, timestamps, or delivery statuses.
  - **No Bounce / Drop Webhook**: Resend delivery webhooks are not configured; invalid addresses and spam complaints fail silently.
  - **Hardcoded Fallback Admin Email**: Falls back to `3010prateeksharma@gmail.com` if `CONTACT_EMAIL_TO` is unset.
- **User Persona**:
  - **MISSING USER WELCOME EMAIL**: When a new user registers via Google OAuth or Magic Link, **no welcome email is sent to the user**. Only the admin gets an alert.
  - **MISSING CONTACT FORM AUTO-REPLY**: Visitors submitting `/api/contact` receive no confirmation receipt.
  - **MISSING SCOPING INTAKE CONFIRMATION**: Prospects submitting a scoping brief receive no email copy of their configuration.
  - **No Notification Preference Management**: Users have no UI in `/dashboard` to configure communication preferences.

#### Failure Modes and Edge Cases
- **Silent Degradation on Missing API Key**: When `RESEND_API_KEY` is missing, functions return `false` or log `console.warn` without database logging or admin escalation.
- **Placeholder Domain Delivery Hazards**: Intake leads created anonymously use placeholder emails (`lead@unauthenticated.client`). Routes dispatching emails must guard against attempting to send to fake domains.
- **Resend Rate-Limit Exhaustion**: Resend standard tiers enforce a limit of 10 requests/second. High-volume webhook spikes could fail with HTTP 429 without exponential backoff.

---

### 3.5 Subsystem 5: Error Handling & Resilience

#### Architecture & Implementation Blueprint
Error handling employs a three-tier React error boundary hierarchy, standardized JSON API error responses, and cryptographic webhook idempotency.

#### Exact Code and Schema References
- `src/app/global-error.tsx`: Lines 1–127. Standalone HTML error boundary with inline CSS for root layout crashes.
- `src/app/error.tsx`: Lines 1–60. Root route segment error boundary with Next.js `error.digest`, "Retry Operation", and "Return to Base".
- `src/components/rag/ErrorBoundary.tsx`: Lines 1–49. Class component error boundary wrapping `/rag/app`.
- `src/app/auth/callback/route.ts`: Lines 23–28, 103–111. Auth exception handling and redirect mapping.
- `src/app/api/webhooks/razorpay/route.ts`: Lines 18–40 (HMAC signature verification), lines 58–69 (idempotency ledger insert and `23505` catch), lines 747–753 (exception handling).
- `src/app/api/scoping/chat/route.ts`: Lines 1466–1486. Heuristic streaming fallback `buildFallbackResponseText()`.
- `src/lib/retrieverProvision.ts`: Lines 121–128. OCI backend offline fallback handling.
- `src/app/api/contact/route.ts`: Lines 244–247, 281–288. Contact exception handling.

#### Confirmed Capabilities
1. **Three-Tier Hierarchical Error Boundaries**:
   - `global-error.tsx`: Renders when the root layout itself crashes; operates with zero external stylesheet dependencies.
   - `error.tsx`: Catches route-level rendering errors, rendering an accessible error card with reload capabilities.
   - `RagErrorBoundary`: Isolates chat and document library crashes within `/rag/app` without breaking the global layout.
2. **Standardized API Error Schemas**: All API endpoints enforce consistent JSON error contracts (`{ error: string, ... }`) matching semantic HTTP status codes.
3. **Cryptographic Webhook Idempotency**: Webhook events verify HMAC-SHA256 signatures via `crypto.timingSafeEqual` and check `processed_webhooks(event_id)`. Code `23505` returns `{ status: 'ok', duplicate: true }`, preventing replay attacks.
4. **Heuristic Scoping Copilot Fallback**: If Retriever OCI is unreachable, `/api/scoping/chat` falls back to `buildFallbackResponseText()`, delivering a rule-based solutions architecture response with `X-Fallback-Mode: true`.
5. **Upstream Timeout Isolation**: `/api/rag/guest/[...path]` enforces `AbortSignal.timeout(55_000)`, converting hung upstream requests into clean 502 Bad Gateway responses.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Centralized Crash Logging**: No integration with Sentry, Logflare, or a database `system_errors` table. Application errors exist solely in Vercel console logs.
  - **No Webhook Dead-Letter Queue (DLQ)**: Failed webhook executions log warnings to console and fail silently without an administrative retry queue.
  - **Zero Database Persistence for Standard Contact Inquiries**: Standard contact form submissions (`name`, `email`, `subject`, `message`) without `intakeDetails` have zero database persistence. In `src/app/api/contact/route.ts:250`, the database insertion is gated behind `if (supabase && body.intakeDetails)` which targets `intake_leads`. General inquiries that lack scoping brief details are sent exclusively via Resend. If Resend fails, encounters API rate limits, or experiences downtime, general inquiries are permanently dropped with zero database audit trail or recovery path.
- **User Persona**:
  - **Unbounded Page Views in Core Workspaces**: `/scoping`, `/dashboard`, and `/admin` lack localized React error boundaries. A rendering crash in a single drawer or card crashes the entire page to `error.tsx`.

#### Failure Modes and Edge Cases
- **Contact Form Data Loss on Resend Error & Standard Inquiry Discard (RSK-02)**:
  In `src/app/api/contact/route.ts:244–255`, two severe data-loss vulnerabilities exist:
  1. *Premature Abort Before Database Insert*: For inquiries with `intakeDetails`, `resend.emails.send()` is executed on line 244 *before* the database insertion on line 253:
     ```typescript
     if (error) {
       console.error('Resend API Error:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
     }
     // Database insertion into intake_leads is on line 253!
     ```
     If Resend fails or rejects an email, the endpoint aborts before inserting the lead into `intake_leads`. Client inquiries are permanently lost.
  2. *Total Absence of Database Persistence for Standard Inquiries*: Standard inquiries (`name`, `email`, `subject`, `message`) without `intakeDetails` bypass database storage entirely. Line 250 strictly evaluates `if (supabase && body.intakeDetails)`. General inquiries without scoping briefs are never inserted into any database table. If Resend delivery fails or drops, the inquiry is permanently lost.
- **Retriever OCI Desynchronization During Provisioning (RSK-09)**: In `src/lib/retrieverProvision.ts:121–128`, if the OCI engine is down during onboarding, synthetic tenant IDs and keys are minted in Supabase but never registered in Retriever's `api_keys` table, failing subsequent searches with 401.

---

### 3.6 Subsystem 6: Security and Row-Level Security (RLS)

#### Architecture & Implementation Blueprint
Database security is enforced via PostgreSQL Row-Level Security policies in Supabase and `FORCE ROW LEVEL SECURITY` in the Retriever backend.

#### Exact Code and Schema References
- `supabase_schema.sql`:
  - Lines 22–37: `page_visits` RLS.
  - Lines 124–202, 606–613, 792–796: Public read-only tables (`projects`, `skills`, `certificates`, `profile`, `posts`, `snake_leaderboard`).
  - Lines 218–223: `clients` RLS (`auth.jwt() ->> 'email' = email`).
  - Lines 286–295: `client_scopes` RLS (`auth.jwt() ->> 'email' = client_email`).
  - Lines 334–341: `invoices` RLS (`customer_email = auth.jwt() ->> 'email'`).
  - Lines 363–367: `scope_change_orders` RLS (`requested_by_email = auth.jwt() ->> 'email'`).
  - Lines 386–392: `project_deliverables` RLS.
  - Lines 410–416: `rag_subscriptions` RLS.
  - Lines 431, 445–462: `rag_tenants` and `rag_tenant_members` RLS.
  - Lines 652–654, 754, 829–832, 866–869: System tables (`intake_leads`, `processed_webhooks`, `outreach_leads`, `scoping_chat_traces`) with RLS enabled and zero public policies.
  - Lines 879–933: Tables lacking RLS (`tenants`, `documents`, `document_chunks`, `vector_records`, `social_drafts`).
- `supabase/migrations/20260825_promo_codes.sql`: Lines 1–27. Creates `promo_codes` with RLS omitted.
- `src/lib/sessionVerify.ts`: Lines 9–47 (`getVerifiedSessionEmail`, `getVerifiedSessionUser`).
- `src/data/supabase.ts`: Lines 20–26. Service-role Supabase client.
- `retriever/apps/api/src/adapters/database/setup.py`: Lines 15–69 (`FORCE ROW LEVEL SECURITY`).
- `retriever/apps/api/src/adapters/database/connection.py`: Lines 28–59 (`tenant_session`, `SET LOCAL app.current_tenant_id`).

#### Confirmed Capabilities
1. **Cryptographic Server-Side Token Verification**: `sessionVerify.ts` extracts the Bearer token from the `Authorization` header and verifies it via `supabase.auth.getUser(token)`, checking signature validity and account status.
2. **Owner-Scoped Commercial Isolation**: Authenticated clients can only SELECT commercial rows matching their verified email (`auth.jwt() ->> 'email'`). Users can only DELETE uncommitted scopes where `deposit_paid = false`.
3. **Default-Deny on System Ledgers**: Tables `intake_leads`, `processed_webhooks`, `outreach_leads`, and `scoping_chat_traces` enforce RLS with zero public policies, accessible only via `SUPABASE_SERVICE_ROLE_KEY`.
4. **PostgreSQL FORCE RLS in Retriever**: The Retriever backend applies `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` across 35+ tenant tables, binding queries to `SET LOCAL app.current_tenant_id = '{valid_uuid}'`.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Studio Admin RLS Policies**: RLS policies on commercial tables only check `auth.jwt() ->> 'email' = client_email`. Administrators connecting with their user JWT receive empty sets; admin views function solely because Next.js routes use `SUPABASE_SERVICE_ROLE_KEY`.
  - **Workspace Owners Cannot Query Members Directly**: `rag_tenant_members` SELECT policy checks `user_id = auth.uid() OR email = auth.jwt() ->> 'email'`. An owner cannot query their team roster via the client Supabase SDK; they must use `/api/rag/members`.
  - **No Administrative Mutation Audit Log**: No database audit table records administrative overrides (e.g. marking deposits paid, advancing stages).
- **User Persona**:
  - **Bearer-Only Requirement**: `sessionVerify.ts` checks only `req.headers.get('authorization')`. Cookie-authenticated requests without explicit Bearer token attachment return 401 Unauthorized.
  - **Zero Direct Client Write Policies**: Authenticated clients cannot perform direct INSERT or UPDATE operations on `clients` or `client_scopes`; all updates must route through Next.js server endpoints.

#### Failure Modes and Edge Cases
- **Unprotected Database Tables (RSK-05)**:
  - `promo_codes` lacks RLS in `supabase/migrations/20260825_promo_codes.sql`. Anonymous users can query all discount codes, rates, and partner IDs.
  - Tables `tenants`, `documents`, `document_chunks`, `vector_records`, and `social_drafts` in `supabase_schema.sql:879–933` lack RLS.
- **Plaintext API Key Storage in `rag_tenants` (RSK-06)**: Column `api_key TEXT` stores live administrative keys in plaintext. The RLS SELECT policy permits any workspace member to read `rag_tenants`, exposing administrative credentials to all members.
- **Application-Level Filtering Dependency**: Because Next.js API routes use `SUPABASE_SERVICE_ROLE_KEY`, PostgreSQL RLS policies are bypassed. An accidental omission of `.eq('client_email', clientEmail)` would result in cross-tenant data leakage.

---

### 3.7 Subsystem 7: Profile Management

#### Architecture & Implementation Blueprint
User identity is split between Supabase Auth (`auth.users`) and the application schema (`clients` table).

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                         PROFILE DATA ARCHITECTURE                              │
└────────────────────────────────────────────────────────────────────────────────┘
 [Supabase Auth]                                       [Application Database]
  auth.users                                            public.clients
 ┌───────────────────────────┐                         ┌───────────────────────────┐
 │ id (UUID)                 │                         │ id (UUID, gen_random_uuid)│
 │ email (unique)            │ ═════ (Weak Link) ════> │ email (TEXT UNIQUE)       │
 │ user_metadata:            │   Matched only by       │ full_name (TEXT)          │
 │   - full_name             │   JWT email claim!      │ company_name (TEXT)       │
 │   - avatar_url            │                         │ phone (TEXT)              │
 │   - name                  │   NO Foreign Key to     │ tax_id_gst (TEXT)         │
 └───────────────────────────┘   auth.users.id!        │ country (TEXT)            │
                                                       └─────────────┬─────────────┘
                                                                     │
                                                       ┌─────────────┴─────────────┐
                                                       ▼                           ▼
                                              public.client_scopes         public.invoices
                                              (client_id FK)               (client_id FK)
```

#### Exact Code and Schema References
- `supabase_schema.sql`: Lines 206–224 (`clients` DDL: `id`, `email`, `full_name`, `company_name`, `phone`, `tax_id_gst`, `country`, `created_at`, `updated_at`).
- `supabase_schema.sql`: Lines 218–222 (`clients` RLS policy).
- `src/app/api/client/save-scope/route.ts`: Lines 74–109. Upserts `clients` record when saving a scope.
- `src/app/api/client/get-scopes/route.ts`: Lines 24–36. Queries `client_scopes` by `client_email`.
- `src/app/api/client/get-invoices/route.ts`: Lines 18–36. Queries `invoices` matching `customer_email` or `client_id`.
- `src/app/api/client/verify-razorpay-subscription/route.ts`: Lines 201–223. Upserts `clients` upon subscription.
- `src/app/api/webhooks/razorpay/route.ts`: Lines 550–574. Upserts `clients` upon subscription webhook.
- `src/components/ClientDashboard/OnboardingChecklistWidget.tsx`: Lines 102–118, 167–205. UI for updating Company Name and Phone.
- `src/app/dashboard/page.tsx`: Lines 1054–1073. Renders user avatar and metadata.
- `src/app/admin/page.tsx`: Lines 248–261, 780–820. Renders scopes from `client_scopes`.

#### Confirmed Capabilities
1. **Scope-Driven Client Upsert**: When an authenticated user saves a scope, the server upserts their record in `clients` with `company_name` and `phone`, linking `client_scopes.client_id`.
2. **Organization Detail Editing**: The Onboarding tab in `/dashboard` allows users to edit Company Name and Contact Phone, saving to both `client_scopes` and `clients`.
3. **RLS Data Isolation**: `clients` restricts SELECT operations to matching JWT emails (`auth.jwt() ->> 'email' = email`).
4. **Dual Invoice Mapping**: `/api/client/get-invoices` resolves invoices matching either `customer_email = clientEmail` OR `client_id = client.id`, preventing invoice detachment.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Direct Client CRM**: The "Clients" tab in `/admin` lists records from `client_scopes`, **NOT the `clients` table**. SaaS subscribers or prospects who never saved a bespoke development scope do not appear.
  - **Admin Cannot Edit Client Profiles**: Admin has no interface to update a client's company details or tax ID outside of creating an invoice.
  - **No Multi-User Client Support**: `clients.email` has a UNIQUE constraint. An organization cannot have multiple team members access the same client scopes or invoices.
- **User Persona**:
  - **No Dedicated Profile / Settings View**: There is no `/dashboard/profile` tab. Profile editing is located inside the Onboarding Checklist tab under an active scope.
  - **Missing Billing Address & GSTIN Inputs**: While `clients` contains `tax_id_gst` and `country`, and `invoices` contains `billing_address`, **the client UI provides zero inputs to view or edit their billing address or GSTIN**.
  - **Avatar Upload Absent**: Avatar is inherited strictly from Google OAuth (`avatar_url`); Magic Link users receive a generic letter fallback.

#### Failure Modes and Edge Cases
- **Critical Schema Mismatch in Subscription Routes (RSK-04)**:
  In `verify-razorpay-subscription/route.ts:208–214` and `webhooks/razorpay/route.ts:557–564`:
  ```typescript
  await supabase.from('clients').upsert({
    email: sessionUser.email,
    name: displayName,                                 // ❌ Column in clients is `full_name`!
    company_name: workspaceName,
    notes: `[Retriever SaaS: ${planTier.toUpperCase()}]`, // ❌ Column `notes` does NOT exist!
    updated_at: nowIso,
  }, { onConflict: 'email' })
  ```
  PostgreSQL rejects the upsert due to missing columns `name` and `notes`. The error is caught and silenced by `catch (clientErr) { console.warn(...) }`. As a result, **`clientId` remains null, and SaaS subscribers are never recorded in `clients`**.
- **Orphan Auth Accounts (No Signup Trigger)**: Neither `auth/callback/route.ts` nor Supabase contains a trigger on `auth.users` to insert a row into `clients`. Users who sign up but never save a scope remain completely unrepresented in `clients`.
- **Weak Email Linkage (No Foreign Key)**: `clients` lacks a `user_id UUID REFERENCES auth.users(id)` column. If a user updates their email in Supabase Auth, their connection to `clients`, `client_scopes`, and `invoices` is severed.

---

### 3.8 Subsystem 8: Tenant Provisioning

#### Architecture & Implementation Blueprint
Tenant provisioning coordinates between Supabase and the Retriever OCI cognitive backend (`https://rag.prateeq.in`).

#### Exact Code and Schema References
- `src/app/api/rag/tenant/route.ts`: Lines 18–90 (GET workspace & self-healing), lines 93–167 (bootstrap default workspace).
- `src/app/api/rag/invite/route.ts`: Lines 14–69 (role validation), lines 71–90 (upsert member), lines 92–145 (invitation email), lines 147–167 (OCI backend sync).
- `src/app/api/rag/members/route.ts`: Lines 19–61 (GET members), lines 71–157 (DELETE member with last-owner protection).
- `src/lib/retrieverProvision.ts`: Lines 4–13 (tier mapping), lines 34–168 (`ensureRetrieverEngineTenant`).
- `src/lib/rag-client.ts`: Lines 61–110 (`RetrieverClient` HTTP client).
- `supabase_schema.sql`: Lines 418–430 (`rag_tenants`), lines 433–443 (`rag_tenant_members`), lines 394–408 (`rag_subscriptions`).
- `retriever/apps/api/src/routers/tenant.py`: Lines 65–104 (`POST /v1/tenants`).
- `retriever/apps/api/src/routers/admin.py`: Lines 222–268 (`GET/PATCH /v1/admin/tenants/{id}`), lines 304–331 (`POST /v1/admin/tenants/{id}/users`), lines 368–385 (`POST /v1/admin/tenants/{id}/api-keys`).

#### Confirmed Capabilities
1. **On-Demand Default Workspace Bootstrapping**: When an authenticated user accesses `/rag/app`, `GET /api/rag/tenant` checks `rag_tenant_members`. If none exists, it provisions an OCI engine tenant, mints an API key (`ret_live_...`), assigns the user as `owner`, and seeds a Starter plan with 250k monthly tokens and a 7-day trial.
2. **Self-Healing Reconciliation**: If an existing workspace has a missing API key or synthetic ID, `GET /api/rag/tenant` calls `ensureRetrieverEngineTenant` to reconcile the workspace on OCI, minting an authentic key and updating Supabase.
3. **Role-Based Team Governance**: Owners/admins can invite teammates. Only owners can invite additional owners. Non-owners cannot remove owners, and the last remaining owner cannot be removed (returns 409 Conflict).
4. **Subscription Quota Sync**: Webhook events update `rag_tenants.plan_tier` and adjust `rag_subscriptions.monthly_token_limit` (Starter: 250k, Pro: 1.5M, Business: 10M tokens).

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Multi-Tenant Control Panel in Portfolio `/admin`**: Admin cannot view active RAG tenants, inspect storage usage, or manage team rosters from `Prateek_website` (isolated to separate dashboard at `admin.rag.prateeq.in`).
  - **No API Key Revocation/Rotation Action**: Admin cannot manually revoke or regenerate a compromised tenant key via API or UI.
- **User Persona**:
  - **Scope Deposit Tenant Orphanage (RSK-03)**: In `src/app/api/webhooks/razorpay/route.ts:285–345`, when a client pays a project deposit, `ensureRetrieverEngineTenant` provisions an OCI tenant linked to `client_scopes.retriever_tenant_id`. However, **it never inserts a row into `rag_tenant_members`** for the client email. When that client logs into `/rag/app`, `GET /api/rag/tenant` finds no membership and creates a separate, empty Starter tenant. The project workspace containing their SOW document is permanently inaccessible.
  - **Single Workspace Limitation**: `GET /api/rag/tenant` executes `.limit(1).maybeSingle()`. A user invited to multiple workspaces can only access the first tenant they joined; there is no UI workspace switcher.
  - **Missing 'Viewer' Role**: `rag_tenant_members.role` allows only `('owner', 'admin', 'member')`; read-only audit roles cannot be provisioned.

#### Failure Modes and Edge Cases
- **Synthetic Key Fallback (RSK-09)**: In `src/lib/retrieverProvision.ts:126–129`, if `ADMIN_MASTER_KEY` is missing or OCI is offline, the code generates a synthetic key (`ret_live_${randomHex}`). This key is saved in Supabase but **never added to Retriever's `api_keys` table**, causing subsequent ingestion and search requests to fail with 401.
- **Tenant Creation Concurrency Race**: Rapid concurrent calls to `GET /api/rag/tenant` can cause both requests to observe `member == null`, triggering duplicate tenant provisioning calls.
- **Hardcoded User UUID in Webhook Upload**: In `webhooks/razorpay/route.ts:315`, the SOW upload passes `'X-User-ID': '00000000-0000-4000-a000-000000000001'`. If foreign key validation is enabled on `users.user_id`, document upload fails.

---

### 3.9 Subsystem 9: Payment and Invoicing

#### Architecture & Implementation Blueprint
Payments utilize Razorpay for INR and USD processing, backed by canonical price calculation and timing-safe webhook reconciliation.

#### Exact Code and Schema References
- `src/lib/pricing.ts`: Lines 11–15 (`USD_TO_INR_RATE = 85`), lines 125–220 (`calcQuote`), lines 222–260 (`recalculateCanonicalScopeQuote`).
- `src/lib/invoicing.ts`: Lines 4–30 (`SELLER_CONFIG`), lines 81–187 (`calculateInvoiceTotals`), lines 192–207 (`formatCurrencyAmount`, `generateInvoiceNumber`).
- `src/app/api/client/create-razorpay-order/route.ts`: Lines 57–210 (invoices), lines 212–553 (scope deposit/balance).
- `src/app/api/client/verify-razorpay-payment/route.ts`: Lines 47–58 (signature verification), lines 302–309 (production 202 deferral).
- `src/app/api/client/create-razorpay-subscription/route.ts`: Lines 31–158 (`CANONICAL_PLANS`), lines 278–406 (subscription initiation).
- `src/app/api/client/verify-razorpay-subscription/route.ts`: Lines 58–77 (signature verification), lines 81–355 (care & SaaS plans).
- `src/app/api/client/create-razorpay-invoice/route.ts`: Lines 8–193 (admin custom invoice creation).
- `src/app/api/client/get-invoices/route.ts`: Lines 5–54 (client invoice retrieval).
- `src/app/api/webhooks/razorpay/route.ts`: Lines 28–39 (HMAC signature verification), lines 58–69 (idempotency ledger), lines 71–398 (one-time payments), lines 399–744 (subscriptions).
- `supabase_schema.sql`: Lines 300–332 (`invoices`), lines 747–753 (`processed_webhooks`), lines 226–263 (`client_scopes`).

#### Confirmed Capabilities
1. **Canonical Anti-Tampering Quoting**: `create-razorpay-order` recalculates quotes canonically via `recalculateCanonicalScopeQuote`, preventing client-side price tampering.
2. **Dual-Currency Support with INR Fallback**: Supports native INR (paise) and USD (cents). If Razorpay rejects USD orders (e.g. international card processing disabled), it automatically converts to INR at `USD_TO_INR_RATE = 85` and retries. Wise ACH and SWIFT details are provided for international bank wires under Indian GST LUT rules.
3. **Cryptographic Webhook Idempotency**: `webhooks/razorpay/route.ts` verifies `x-razorpay-signature` using `crypto.timingSafeEqual`. Events are recorded in `processed_webhooks(event_id)`; retries trigger unique constraint `23505` and return `{ status: 'ok', duplicate: true }`.
4. **Commercial State Progression**:
   - One-Time Scopes: `Draft Proposal` → (Deposit Paid) → `Deposit Paid — In Development` (stage: `engineering`, SOW hash recorded) → (Balance Paid) → `Project Settled — Production Live` (stage: `live`).
   - Change Orders: Feature adjustments generate custom invoices; payment merges features into the active scope.
   - Care & SaaS Subscriptions: `subscription.activated`/`charged` transitions status to `active` and generates recurring `CARE-...` or `RET-...` paid invoices.
5. **GST Tax Calculation**: `calculateInvoiceTotals` computes CGST (9%) + SGST (9%) for intra-state (Delhi) vs IGST (18%) for inter-state transactions. USD exports are zero-rated under Indian GST export rules.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **Invoices Isolation & Blindness to Subscriptions and Standalone Invoices in `/admin`**: In `src/app/admin/page.tsx:251`, the Clients view loads scopes via `/api/client/get-scopes?all=true`. In `src/app/api/client/get-scopes/route.ts:88`, invoices are queried strictly via `invSelect.in('scope_id', scopeIds)`. In `src/app/admin/page.tsx:1253–1280`, invoices are rendered strictly as nested children (`c.invoices`) under individual scope cards. Consequently, any invoice where `scope_id IS NULL`—including all recurring SaaS subscription invoices (`RET-...`), Care Plan retainer invoices (`CARE-...`), and standalone custom billing invoices—never appears anywhere in `/admin`. The administrator has zero central financial ledger in `/admin` to monitor recurring revenue or unattached invoices.
  - **No Refund / Credit Note Action**: No admin endpoint or UI exists to issue a Razorpay refund or create a credit note in `invoices`.
  - **No Invoice Cancellation / Voiding Action**: Admin cannot void or edit an issued invoice before payment.
  - **No Webhook Failure Dead-Letter Queue**: If the webhook returns 500, Razorpay retries for 24 hours, but there is no admin tool to manually reconcile an order from its payment ID.
- **User Persona**:
  - **Missing Self-Service Subscription Cancellation**: Users have no UI or endpoint to cancel active SaaS or Care Plan subscriptions.
  - **Inconsistent Receipt PDF Generation for Subscriptions**: Project invoices support PDF download (`InvoicePDF.tsx`), but recurring subscription rows (`RET-...`, `CARE-...`) are created with empty `line_items` JSON, causing PDF generation to fail or render blank.

#### Failure Modes and Edge Cases
- **Production Payment Verification Latency**: In production, `verify-razorpay-payment` returns `202 Accepted` and leaves ledger mutations to the webhook. If webhook delivery is delayed, the redirected client sees "Pending Deposit" in `/dashboard`, causing confusion.
- **Pending Invoice Accumulation**: Every checkout modal open creates a pending invoice row. Cross-browser attempts or sessions without a matched `scope_id` accumulate orphaned `pending` records.
- **Currency Inconsistency on International Fallback**: When USD payments fall back to INR, the invoice ledger records `currency: 'USD'` while Razorpay captures INR, creating reconciliation discrepancies.

---

### 3.10 Subsystem 10: Lifecycle Notifications and Alerts

#### Architecture & Implementation Blueprint
Lifecycle notifications are driven by `src/lib/emailNotification.ts`, triggered by scoping interactions, administrative stage updates, and webhook events.

#### Exact Code and Schema References
- `src/lib/emailNotification.ts`: Lines 1–1098 (11 notification templates).
- `src/lib/scopingObservability.ts`: Lines 73–115 (hot-lead alert triggers and in-memory deduplication `alertedHotLeadSessions`).
- `src/app/api/client/intake-draft/route.ts`: Lines 101–114, 199–234 (intake draft lead alerts).
- `src/app/api/client/save-scope/route.ts`: Lines 266, 270–290, 293–311 (scope saved & stage progression alerts).
- `src/app/api/client/change-orders/route.ts`: Lines 190–200, 269–285 (change order alerts).
- `src/app/api/outreach/prospect/route.ts`: Lines 1–351 (automated prospecting via Gemini 3.6 Flash).
- `src/app/api/outreach/dispatch/route.ts`: Lines 1–118 (manual outreach approval & dispatch).
- `src/app/api/rag/tenant/route.ts`: Lines 44–59 (7-day trial calculation).

#### Confirmed Capabilities
1. **11 Production-Ready Email Pipelines**: Fully implemented templates generating responsive, dark-themed HTML emails via Resend.
2. **Real-Time Hot Lead Scoping Alerts**: Immediately alerts `CONTACT_EMAIL_TO` when:
   - `quoteUSD >= 2500` or `quoteINR >= 200000`, OR
   - `turnIndex >= 3` and `quoteUSD >= 1500`, OR
   - Model activates escrow escalation (`modelUsed === 'escrow-escalation-router'`).
3. **Lead Qualification Defense**: In `intake-draft/route.ts:101–114`, casual 1-turn bounces are suppressed. Alerts fire only if the lead has a real contact email, a custom company name, or a transcript with >= 6 messages.
4. **Client Milestone Progression Alerts**: Updating `delivery_stage` in `/admin` dispatches stage-tailored emails for `engineering` (kickoff), `staging` (review ready with staging URL), and `live` (launch notice with production URL and GitHub repo).
5. **Bi-Directional Change Order Alerts**: Client submission alerts admin; admin approval or payment alerts client.
6. **Dual Payment Receipts**: Deposit and final balance payments dispatch confirmations to both client and admin.
7. **Autonomous Outreach Engine**: Dispatches AI-generated pitches referencing verified Retriever builds upon one-click admin approval.

#### Missing Gaps by Persona
- **Admin Persona**:
  - **No Real-Time Push / Chat Alerts**: No integration with Slack, Discord, or Telegram webhooks. Hot leads can sit unread if email is not monitored.
- **User Persona**:
  - **No Trial Expiration Lifecycle Alerts**: Users receive no email warning when their 7-day RAG trial is expiring (e.g. at 3 days or 1 day remaining) or has transitioned to read-only mode.
  - **No Invoice Reminders or Overdue Notices**: No automated emails alert clients of pending or overdue invoices.
  - **No User Welcome Email**: New signups receive no introductory email or workspace walkthrough.

#### Failure Modes and Edge Cases
- **Serverless Ephemeral Memory Deduplication Breach**: In `src/lib/scopingObservability.ts:6`, `alertedHotLeadSessions` is an in-memory `Set<string>()`. In serverless runtimes, memory is not shared across lambda instances; subsequent turns routing to different instances can trigger duplicate hot-lead emails.
- **Missing Cron Engine for Lifecycle Scheduling**: Trial expirations and invoice due dates are evaluated only on active client HTTP requests. There is no scheduled cron job (GitHub Actions cron or systemd timer) scanning the database daily.
- **Fire-and-Forget Email Failures**: Dispatches use unawaited `.catch(err => console.warn(...))` without retry queues or database status persistence.

---

## 4. Unified Capability Matrix

The following matrix benchmarks capabilities across all 10 subsystems for both Admin and User personas:

| Subsystem | Specific Capability | Admin Persona Status | User Persona Status | Implementation / Code Reference |
| :--- | :--- | :--- | :--- | :--- |
| **1. Signup & Auth** | Google OAuth Sign-In (PKCE) | ✅ Confirmed | ✅ Confirmed | `src/app/auth/callback/route.ts:30–52` |
| | Passwordless Magic Link | ✅ Confirmed | ✅ Confirmed | `src/app/auth/callback/route.ts:37–44` |
| | Email / Password Authentication | ❌ Missing | ❌ Missing | Absent from codebase (`signInWithPassword`) |
| | Safari ITP Cookie Chunking (3000B) | ✅ Confirmed | ✅ Confirmed | `src/lib/auth.ts:18–97` (`universalStorage`) |
| | JWT Expiration & Auto-Refresh | ✅ Confirmed | ✅ Confirmed | `src/context/AuthContext.tsx:252–278` |
| | Admin User Directory / Management | ❌ Missing | N/A | `/admin` lacks user directory |
| | Self-Service Account Deletion | N/A | ❌ Missing | No account deletion route |
| **2. Observability** | Zero-Latency Edge Visit Logging | ✅ Confirmed | N/A | `src/proxy.ts:95–116` (`event.waitUntil`) |
| | GDPR Daily Rotating Salt IP Hashing | ✅ Confirmed | ✅ Confirmed | `src/lib/security.ts:4–11` (`getIpHash`) |
| | Honeypot & Bot Exploit Filtering | ✅ Confirmed | N/A | `src/proxy.ts:64–67` (`HONEYPOT_PATTERNS`) |
| | Single-Pass Database Analytics RPC | ✅ Confirmed | N/A | `supabase_schema.sql:506–584` |
| | Granular Scoping Chat Traces | ✅ Confirmed | N/A | `src/lib/scopingObservability.ts:37–119` |
| | RAG Studio Live SLA Telemetry | ✅ Confirmed | ✅ Confirmed | `src/app/api/rag/telemetry/route.ts:103–128` |
| | API Route Response Observability | ❌ Missing | N/A | `src/proxy.ts:134` (excludes `/api/*`) |
| | Exploit / Attack Dashboard Ledger | ❌ Missing | N/A | Honeypot discards are unrecorded |
| | Unattached Scoping Chat Traces in Admin UI | ⚠️ Flawed (UI Discards) | N/A | `src/app/admin/page.tsx:204` (discards `data.traces`) |
| **3. Session Stitching**| 4-Key Anonymous Tracking Matrix | ✅ Confirmed | ✅ Confirmed | `src/lib/scopingObservability.ts:124–175` |
| | IDOR-Hardened Draft Lead Updates | ✅ Confirmed | ✅ Confirmed | `src/app/api/client/intake-draft/route.ts:59–75` |
| | Auth Callback Trace & Lead Stitching | ⚠️ Flawed (Dangling) | ⚠️ Flawed (Dangling)| `src/app/auth/callback/route.ts:92–99` |
| | Cross-Device Scoping Continuation | ❌ Missing | ❌ Missing | Cookies do not bridge devices |
| | Client Historical Scoping Chat View | ⚠️ Partial (Admin leads only) | ❌ Missing (User) | Clients cannot view chat history; `/admin` discards unattached traces |
| **4. Emails** | Milestone Payment Receipts | ✅ Confirmed | ✅ Confirmed | `src/lib/emailNotification.ts:235–330` |
| | Milestone Stage Progression Alerts | ✅ Confirmed | ✅ Confirmed | `src/lib/emailNotification.ts:529–668` |
| | Final Balance Clearance Receipts | ✅ Confirmed | ✅ Confirmed | `src/lib/emailNotification.ts:808–964` |
| | Hot Lead Executive Alerts | ✅ Confirmed | N/A | `src/lib/emailNotification.ts:985–1098` |
| | New User Welcome Email | N/A | ❌ Missing | **No welcome email exists for user** |
| | Contact Form Submitter Auto-Reply | N/A | ❌ Missing | Submitter gets no confirmation |
| | Email Delivery Audit Ledger | ❌ Missing | N/A | No `email_logs` database table |
| **5. Error Handling** | 3-Tier React Error Boundaries | ✅ Confirmed | ✅ Confirmed | `global-error.tsx`, `error.tsx`, `RagErrorBoundary` |
| | Standardized JSON Error Schemas | ✅ Confirmed | ✅ Confirmed | All endpoints enforce `{ error: string }` |
| | Webhook Cryptographic Idempotency | ✅ Confirmed | ✅ Confirmed | `src/app/api/webhooks/razorpay/route.ts:58–69` |
| | Heuristic Scoping Chat Fallback | ✅ Confirmed | ✅ Confirmed | `src/app/api/scoping/chat/route.ts:1466–1486` |
| | Standard Contact Inquiries Persistence | ❌ Missing (Dropped) | ❌ Missing (Dropped) | `src/app/api/contact/route.ts:250` (skips DB insert) |
| | Contact Lead Preservation on Error | ⚠️ Flawed (Lead Loss) | ⚠️ Flawed (Lead Loss)| `src/app/api/contact/route.ts:244–247` (pre-insert abort) |
| | Local Boundaries in `/dashboard` & `/scoping`| N/A | ❌ Missing | Entire page crashes on component fault |
| **6. Security & RLS** | Cryptographic Session Verification | ✅ Confirmed | ✅ Confirmed | `src/lib/sessionVerify.ts:9–47` |
| | Row-Level Security on Commercial Tables| ⚠️ Bypassed (Service) | ✅ Confirmed | `supabase_schema.sql:218–416` |
| | Row-Level Security on Promo Codes | ❌ Missing (Critical) | ❌ Missing (Critical) | `supabase/migrations/20260825_promo_codes.sql` |
| | Secret Masking on Tenant API Keys | ❌ Missing (Critical) | ❌ Missing (Critical) | `supabase_schema.sql:424` (plaintext) |
| | Cookie-Based Session Auth Support | ❌ Missing | ❌ Missing | `src/lib/sessionVerify.ts:11` (Bearer only) |
| **7. Profile Mgmt** | Scope-Driven Client Record Upsert | ✅ Confirmed | ✅ Confirmed | `src/app/api/client/save-scope/route.ts:74–109` |
| | Client Org Editing (Company/Phone) | ❌ Missing | ✅ Confirmed | `OnboardingChecklistWidget.tsx:102–118` |
| | Billing Address & GSTIN Management | ✅ (Invoices only) | ❌ Missing | User has no UI to edit address/tax ID |
| | Subscription Client Record Upsert | ⚠️ Broken (Schema) | ⚠️ Broken (Schema) | `verify-razorpay-subscription/route.ts:208` |
| | Foreign Key `auth.users` → `clients` | ❌ Missing | ❌ Missing | Linked solely by volatile email string |
| **8. Tenant Prov.** | Automatic Starter Workspace Bootstrap| ✅ Confirmed | ✅ Confirmed | `src/app/api/rag/tenant/route.ts:93–167` |
| | Self-Healing OCI Reconciliation | ✅ Confirmed | ✅ Confirmed | `src/lib/retrieverProvision.ts:34–168` |
| | Scope Deposit Tenant Member Linking | ✅ Confirmed (OCI) | ❌ Missing (Orphaned)| `webhooks/razorpay/route.ts:285–345` |
| | Multi-Workspace Tenant Switcher | ✅ Confirmed (Engine) | ❌ Missing (UI) | `src/app/api/rag/tenant/route.ts:22` (`.limit(1)`) |
| | Team Role Governance (Owner/Admin) | ✅ Confirmed | ✅ Confirmed | `src/app/api/rag/invite/route.ts:50–69` |
| **9. Payments** | Anti-Tamper Canonical Quoting | ✅ Confirmed | ✅ Confirmed | `src/app/api/client/create-razorpay-order:302` |
| | Dual-Currency Support with INR Fallback| ✅ Confirmed | ✅ Confirmed | `src/app/api/client/create-razorpay-order:149` |
| | Timing-Safe Webhook HMAC Verification | ✅ Confirmed | ✅ Confirmed | `src/app/api/webhooks/razorpay/route.ts:28–39` |
| | Commercial Stage Progression (50/50 SOW)| ✅ Confirmed | ✅ Confirmed | `src/app/api/webhooks/razorpay/route.ts:251–351` |
| | Central Admin Financial Ledger (Subscriptions & Standalone) | ⚠️ Flawed (Scope-gated) | N/A | `src/app/admin/page.tsx:1253` & `get-scopes:88` (omits `scope_id IS NULL`) |
| | Self-Service Subscription Cancellation | ❌ Missing | ❌ Missing | No cancellation route in `/api/client/` |
| | Refund & Credit Note Management | ❌ Missing | N/A | Manual Razorpay dashboard intervention |
| **10. Notifications**| 11 Resend HTML Email Pipelines | ✅ Confirmed | ✅ Confirmed | `src/lib/emailNotification.ts:1–1098` |
| | Hot Lead Real-Time Executive Alerts | ✅ Confirmed | N/A | `src/lib/scopingObservability.ts:80–87` |
| | Milestone Stage Progression Alerts | ✅ Confirmed | ✅ Confirmed | `src/app/api/client/save-scope/route.ts:295` |
| | Change Order Bi-Directional Alerts | ✅ Confirmed | ✅ Confirmed | `src/app/api/client/change-orders/route.ts:190` |
| | Autonomous B2B Outreach Pipeline | ✅ Confirmed | N/A | `src/app/api/outreach/prospect/route.ts:1–351` |
| | Trial Expiration Email Notifications | ❌ Missing | ❌ Missing | No automated warning at T-3 / T-1 days |
| | Automated Overdue Invoice Reminders | ❌ Missing | ❌ Missing | No scheduled invoice reminder emails |
| | Slack / Discord Real-Time Webhooks | ❌ Missing | N/A | Zero chat webhooks in web runtime |

---

## 5. Identified Failure Modes & Architectural Risk Catalog

This section consolidates and classifies the 12 primary architectural failure modes and security risks identified across the audit:

### [RSK-01] Vercel Serverless Dangling Promise in Auth Callback (Severity: HIGH)
- **Subsystem**: 3 (Session Stitching)
- **Code Reference**: `src/app/auth/callback/route.ts:92–99`
- **Mechanism**: `stitchAnonymousSession()` is dispatched as an unawaited Promise without `event.waitUntil()`. Returning `NextResponse.redirect` terminates the serverless lambda execution context immediately, abruptly aborting asynchronous database updates to `scoping_chat_traces` and `intake_leads`.
- **Impact**: Scoping traces and intake leads remain orphaned under anonymous IDs; marketing attribution is lost.

### [RSK-02] Contact Form Lead Discard on Resend Outage & Zero Standard Inquiry Persistence (Severity: HIGH)
- **Subsystem**: 5 (Error Handling)
- **Code Reference**: `src/app/api/contact/route.ts:244–255`
- **Mechanism**: Standard contact form submissions (`name`, `email`, `subject`, `message`) without `intakeDetails` have zero database persistence because the database insertion is gated behind `if (supabase && body.intakeDetails)`. Furthermore, for inquiries containing `intakeDetails`, `resend.emails.send()` is invoked before inserting into `intake_leads`, returning HTTP 400 upon Resend failure before any database row is created.
- **Impact**: All general contact inquiries lack database persistence; any failure in Resend (rate limits, misconfigured API key, network downtime) results in permanent, unrecoverable data loss. High-intent intake leads are also discarded if Resend encounters transient errors.
- **Remediation Proposal**: Create a dedicated `contact_submissions` table (or persist all submissions into `intake_leads` with `lead_type = 'general_inquiry'`) and ensure the database insertion executes *before* calling Resend.

### [RSK-03] Scope Deposit Tenant Orphanage (Severity: HIGH)
- **Subsystem**: 8 (Tenant Provisioning)
- **Code Reference**: `src/app/api/webhooks/razorpay/route.ts:285–345`
- **Mechanism**: When a client pays a project deposit, `ensureRetrieverEngineTenant` provisions an OCI tenant and stores `retriever_tenant_id` in `client_scopes`. However, it fails to insert a record into `rag_tenant_members` for the client.
- **Impact**: When the client navigates to `/rag/app`, the app finds no membership and creates a separate, empty Starter tenant. The project workspace containing their SOW document is permanently inaccessible.

### [RSK-04] Schema Mismatch in Subscription `clients` Upsert (Severity: HIGH)
- **Subsystem**: 7 (Profile Management)
- **Code Reference**: `src/app/api/client/verify-razorpay-subscription/route.ts:208–214` & `src/app/api/webhooks/razorpay/route.ts:557–564`
- **Mechanism**: The mutation attempts to insert keys `name` (column in schema is `full_name`) and non-existent column `notes` into `clients`. PostgreSQL rejects the mutation. The error is silenced by `catch (clientErr) { console.warn(...) }`.
- **Impact**: `clientId` remains null, no client record is created or updated, and SaaS subscribers are never recorded in `clients`.

### [RSK-05] Missing Row-Level Security on Promo Codes & Schema Tables (Severity: HIGH)
- **Subsystem**: 6 (Security & RLS)
- **Code Reference**: `supabase/migrations/20260825_promo_codes.sql:2–14` & `supabase_schema.sql:879–933`
- **Mechanism**: Table `promo_codes` was created without `ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;`. Tables `tenants`, `documents`, `document_chunks`, `vector_records`, and `social_drafts` also omit RLS.
- **Impact**: Anonymous public users can query all promotional codes, partner tracking IDs, and discount rules. Note that because promo code validation is handled strictly server-side in `/api/scoping/validate-promo` using `SUPABASE_SERVICE_ROLE_KEY`, `promo_codes` must have RLS enabled with ZERO public SELECT policies (restricting access to `service_role` only). Exposing any public SELECT policy would allow users with `NEXT_PUBLIC_SUPABASE_ANON_KEY` to dump all promo codes.

### [RSK-06] Plaintext Administrative API Key Storage in `rag_tenants` (Severity: HIGH)
- **Subsystem**: 6 (Security & RLS)
- **Code Reference**: `supabase_schema.sql:424, 454–461`
- **Mechanism**: `rag_tenants` stores unencrypted `api_key TEXT`. The RLS SELECT policy permits any workspace member to query `rag_tenants`, exposing live `ret_live_...` administrative workspace API keys to all tenant members.
- **Impact**: Standard members can extract administrative API keys and bypass application permissions directly against the Retriever backend.

### [RSK-07] Admin Signup Alert Spam on Routine Logins (Severity: MEDIUM)
- **Subsystem**: 2 & 4 (Observability & Emails)
- **Code Reference**: `src/app/auth/callback/route.ts:62–68`
- **Mechanism**: The callback route dispatches `sendAdminSignupNotification` whenever code or OTP exchange succeeds, without checking whether `user.created_at` matches current time or whether a profile already exists.
- **Impact**: Administrator receives "New User Sign-Up Alert" emails on every single routine login by returning clients, causing alert fatigue.

### [RSK-08] Insecure Session Cookie Attributes (Severity: MEDIUM)
- **Subsystem**: 3 (Session Stitching)
- **Code Reference**: `src/app/api/scoping/chat/route.ts:1303` & `src/app/api/client/intake-draft/route.ts:239–248`
- **Mechanism**: Tracking cookies `prateeq_chat_session_id`, `prateeq_draft_token`, and `prateeq_pending_scope_code` lack `HttpOnly: true` and omit `Secure: true` in fallback headers.
- **Impact**: Client-side scripts can access tracking tokens, creating XSS session tampering vulnerabilities.

### [RSK-09] Synthetic API Key Desynchronization on OCI Downtime (Severity: MEDIUM)
- **Subsystem**: 8 (Tenant Provisioning)
- **Code Reference**: `src/lib/retrieverProvision.ts:126–130`
- **Mechanism**: If Retriever OCI is offline, the provisioner generates a random synthetic key (`ret_live_${randomHex}`) and saves it in Supabase, but never inserts it into Retriever's `api_keys` table.
- **Impact**: Subsequent document ingestion or chat requests made by `RetrieverClient` immediately fail with `401 Unauthorized`.

### [RSK-10] Lack of Localized React Error Boundaries in Core Views (Severity: MEDIUM)
- **Subsystem**: 5 (Error Handling)
- **Code Reference**: `src/app/scoping/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/admin/page.tsx`
- **Mechanism**: While `/rag/app` is wrapped in `RagErrorBoundary`, `/scoping` and `/dashboard` lack localized error boundaries.
- **Impact**: A minor rendering error in an interactive pricing drawer or scope card crashes the entire page view to the generic `error.tsx` fallback.

### [RSK-11] Absence of Proactive Lifecycle Alerts for Trials & Invoices (Severity: MEDIUM)
- **Subsystem**: 10 (Lifecycle Notifications)
- **Code Reference**: `src/app/api/rag/tenant/route.ts:44–59`
- **Mechanism**: Trial expiration is evaluated purely lazily on incoming HTTP requests. There is no background cron job scanning for expiring trials or overdue invoices.
- **Impact**: Clients receive zero advance warning before their workspace transitions into read-only soft paywall mode.

### [RSK-12] Single-Tenant Limitation & Missing Workspace Switcher (Severity: MEDIUM)
- **Subsystem**: 8 (Tenant Provisioning)
- **Code Reference**: `src/app/api/rag/tenant/route.ts:22`
- **Mechanism**: `GET /api/rag/tenant` executes `.limit(1).maybeSingle()`.
- **Impact**: A user invited to multiple workspaces can only ever access the first tenant they joined; there is no UI workspace switcher.

---

## 6. Prioritized Remediation Plan & Recommendations

### Phase 0: Critical Security & Reliability (P0 — Immediate Execution)

1. **Enable RLS on Unprotected Tables with Zero Public SELECT on `promo_codes` (Fix for RSK-05)**:
   - Create migration `supabase/migrations/20261106_enable_missing_rls.sql`:
     ```sql
     ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
     -- CRITICAL SECURITY REQUIREMENT: ZERO public SELECT policies!
     -- Promo code validation is handled strictly server-side via /api/scoping/validate-promo using the service-role client.
     -- Adding a public SELECT policy would allow any user or attacker with NEXT_PUBLIC_SUPABASE_ANON_KEY to dump all active promotion codes, discount rates, and partner tracking IDs.
     CREATE POLICY "Service role manages promo codes" ON promo_codes
       FOR ALL USING (auth.role() = 'service_role');

     ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
     ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
     ALTER TABLE IF EXISTS document_chunks ENABLE ROW LEVEL SECURITY;
     ALTER TABLE IF EXISTS vector_records ENABLE ROW LEVEL SECURITY;
     ALTER TABLE IF EXISTS social_drafts ENABLE ROW LEVEL SECURITY;
     ```
2. **Protect Plaintext API Keys in `rag_tenants` with Correct UUID Foreign Key (Fix for RSK-06)**:
   - Separate raw administrative API keys into a dedicated table `rag_tenant_credentials` accessible only by `role = 'owner'` and service-role.
   - **Schema Type Constraint**: `rag_tenants.tenant_id` in `supabase_schema.sql:420` is defined as `UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()`. The foreign key in `rag_tenant_credentials` must be defined as `UUID` (not `VARCHAR(100)`), otherwise PostgreSQL throws a fatal foreign key type incompatibility error (`character varying` and `uuid`):
     ```sql
     ALTER TABLE rag_tenants DROP COLUMN IF EXISTS api_key;
     CREATE TABLE IF NOT EXISTS rag_tenant_credentials (
       tenant_id UUID PRIMARY KEY REFERENCES rag_tenants(tenant_id) ON DELETE CASCADE,
       api_key TEXT NOT NULL,
       created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
     );
     ALTER TABLE rag_tenant_credentials ENABLE ROW LEVEL SECURITY;
     CREATE POLICY "Owners can view credentials" ON rag_tenant_credentials
       FOR SELECT USING (
         tenant_id IN (
           SELECT tenant_id FROM rag_tenant_members
           WHERE (user_id = auth.uid() OR email = auth.jwt() ->> 'email') AND role = 'owner'
         )
       );
     ```
3. **Fix Scope Deposit Tenant Orphanage with Valid Member Columns (Fix for RSK-03)**:
   - In `src/app/api/webhooks/razorpay/route.ts:325–345`, insert a membership record linking the client email as `owner`.
   - **Column Name Constraint**: Use `created_at` and `updated_at`. Column `joined_at` does not exist in `rag_tenant_members` (`supabase_schema.sql:433–443`); attempting to insert `joined_at` causes PostgreSQL to throw `column "joined_at" of relation "rag_tenant_members" does not exist`:
     ```typescript
     const nowIso = new Date().toISOString();
     await supabase.from('rag_tenant_members').insert({
       tenant_id: provisionedTenantId,
       user_id: clientUserId || null,
       email: clientEmail,
       role: 'owner',
       created_at: nowIso,
       updated_at: nowIso,
     });
     ```
4. **Fix Schema Mismatch in Subscription Routes (Fix for RSK-04)**:
   - In `src/app/api/client/verify-razorpay-subscription/route.ts:208` and `src/app/api/webhooks/razorpay/route.ts:557`:
     - Replace `name: displayName` with `full_name: displayName`.
     - Remove column `notes` (or add migration adding `notes TEXT` to `clients`).
5. **Persist Contact Form Submissions & Invert Resend Sequence (Fix for RSK-02)**:
   - In `supabase_schema.sql`, create a dedicated `contact_submissions` table (or expand `intake_leads` to record general inquiries with `lead_type = 'general_inquiry'`):
     ```sql
     CREATE TABLE IF NOT EXISTS contact_submissions (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       name TEXT NOT NULL,
       email TEXT NOT NULL,
       subject TEXT,
       message TEXT NOT NULL,
       ip_hash TEXT,
       has_intake BOOLEAN DEFAULT false,
       status TEXT DEFAULT 'received' CHECK (status IN ('received', 'emailed', 'failed')),
       created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
     );
     ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
     -- Service role only: zero public policies (writes handled via /api/contact)
     CREATE POLICY "Service role manages contact submissions" ON contact_submissions
       FOR ALL USING (auth.role() = 'service_role');
     ```
   - In `src/app/api/contact/route.ts`:
     1. Persist ALL submissions (both general inquiries and intake briefs) to `contact_submissions` (and `intake_leads` if `body.intakeDetails` is present) *before* attempting `resend.emails.send()`.
     2. If Resend dispatch fails, mark the submission status as `'failed'`, log the error, and return HTTP 202/502 without discarding the captured lead.
6. **Await Session Stitching in Auth Callback (Fix for RSK-01)**:
   - In `src/app/auth/callback/route.ts`, await `stitchAnonymousSession()` before returning `NextResponse.redirect`:
     ```typescript
     await stitchAnonymousSession(
       effectiveSessionId,
       user.email || '',
       pendingScopeCode,
       pendingDraftToken
     ).catch(err => console.warn('Session stitching warning in auth callback:', err));
     ```

---

### Phase 1: Functional Defect Resolution & Lifecycle Fundamentals (P1 — Next Sprint)

1. **Implement User Welcome Email**:
   - In `src/lib/emailNotification.ts`, author `sendUserWelcomeNotification({ email, fullName })`.
   - In `src/app/auth/callback/route.ts`, check whether `user.created_at` was within the last 60 seconds (or whether a `clients` record already exists) to send the welcome email only on first registration.
2. **Deduplicate Admin Signup Notifications (Fix for RSK-07)**:
   - In `src/app/auth/callback/route.ts`, guard `sendAdminSignupNotification` so that it fires only if `user.created_at === user.last_sign_in_at` (new user registration), eliminating spam on routine logins.
3. **Implement Contact Form & Scoping Lead Auto-Replies**:
   - In `/api/contact/route.ts`, send an automatic confirmation email back to the visitor acknowledging receipt.
   - In `/api/client/intake-draft/route.ts`, send a proposal confirmation email with the scope link when an authenticated or verified email is provided.
4. **Implement Self-Service Subscription Cancellation**:
   - Create `POST /api/client/cancel-razorpay-subscription` verifying the session email against `rag_subscriptions` / `client_scopes`, calling Razorpay API `subscriptions.cancel()`, and updating database status.
5. **Harden Anonymous Tracking Cookies (Fix for RSK-08)**:
   - Configure cookies `prateeq_chat_session_id`, `prateeq_draft_token`, and `prateeq_pending_scope_code` with `secure: process.env.NODE_ENV === 'production'` and evaluate `httpOnly` feasibility.
6. **Render Unattached Scoping Chat Traces in `/admin`**:
   - In `src/app/admin/page.tsx:204`, store `data.traces` in local state (`setScopingTraces(data.traces || [])`).
   - Add an "Unattached Scoping Traces" drawer or accordion in the Leads tab grouping conversations by `session_id`, allowing the administrator to inspect high-intent prospects who engaged with the AI copilot without submitting an intake brief.
7. **Direct Invoices Ledger in `/admin` (Subscriptions & Standalone Observability)**:
   - Decouple admin invoice observability from `client_scopes`. Add a dedicated "Ledger / Invoices" view in `/admin` querying `invoices` directly.
   - Render all invoice records, specifically surfacing recurring SaaS subscription invoices (`RET-...`), Care Plan invoices (`CARE-...`), and standalone custom billing invoices where `scope_id IS NULL`.

---

### Phase 2: Observability, Settings & Lifecycle Enhancements (P2 — Mid-Term)

1. **Client Profile Settings & Billing Address UI**:
   - Provide a dedicated "Profile & Billing Settings" section in `/dashboard` allowing clients to view and update `company_name`, `phone`, `tax_id_gst`, and `billing_address`.
2. **Proactive RAG Trial Expiration Alerts (Fix for RSK-11)**:
   - Author daily cron endpoint `/api/cron/lifecycle-checks` authenticated by `CRON_SECRET` to scan `rag_subscriptions` and send trial warning emails at T-3 days, T-1 day, and on expiration.
3. **Automated Invoice Reminders**:
   - Extend the daily lifecycle cron job to query `invoices` where `status = 'issued'` and `due_date < now()`, sending overdue payment reminder emails to clients.
4. **Email Delivery Audit Ledger**:
   - Create database table `email_logs` (`id`, `message_id`, `template_name`, `recipient_email`, `status`, `error_message`, `created_at`) and log all Resend SDK dispatches.
5. **Localized React Error Boundaries (Fix for RSK-10)**:
   - Wrap the major sections of `/scoping` (wizard, chat bar) and `/dashboard` (scope cards, invoices, change orders) in localized error boundaries.

---

### Phase 3: Multi-Channel Alerts, RBAC & Advanced Admin Features (P3 — Future Roadmap)

1. **Multi-Workspace Selector (Fix for RSK-12)**:
   - Update `GET /api/rag/tenant` to return all memberships for a user and accept an optional `?tenantId=` query parameter to allow switching between workspaces.
2. **Slack / Discord Real-Time Webhook Alerting**:
   - Add optional `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` environment variable support to `src/lib/emailNotification.ts` so that high-priority Hot-Lead and Escrow alerts ping the administrator in real-time.
3. **Admin User Directory in `/admin`**:
   - Add an authenticated admin view in `/admin` to list registered users in `auth.users`, displaying associated scopes, tenants, token consumption, and activity status.
4. **Database-Level Administrative Mutation Audit Logs**:
   - Create table `admin_audit_logs` in Supabase to track manual state mutations, deliverable approvals, and stage advancements.

---

## 7. Verification Commands & Independent Attestation

To independently verify the observations, line numbers, and findings documented in this report:

### 1. Verify Missing RLS on `promo_codes`
```bash
grep -i "row level security" /Users/prateeksharma/Developer/Prateek_website/supabase/migrations/20260825_promo_codes.sql
# Result: 0 matches (Confirms RLS is absent)
```

### 2. Verify Plaintext API Key in `rag_tenants`
```bash
sed -n '424p;454,461p' /Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql
# Result: api_key TEXT DEFAULT '', and policy allows all members to SELECT
```

### 3. Verify Scope Deposit Tenant Orphanage
```bash
grep -n "rag_tenant_members" /Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts
# Result: Only referenced in subscription handling (lines 591, 637, 680); absent from scope deposit handling (lines 281-352)
```

### 4. Verify Schema Mismatch in Subscription Routes
```bash
sed -n '208,214p' /Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-subscription/route.ts
# Result: Upsert specifies `name` and `notes` which do not exist in `clients` schema
```

### 5. Verify Contact Form Lead Loss Bug
```bash
sed -n '244,254p' /Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts
# Result: Returns error 400 at line 247 on Resend failure, before database insert at line 253
```

### 6. Verify Unawaited Dangling Promise in Auth Callback
```bash
sed -n '92,99p' /Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts
# Result: stitchAnonymousSession called with unawaited Promise.resolve()
```

### 7. Verify Admin Discards Unattached Traces
```bash
grep -n "setIntakeLeads" /Users/prateeksharma/Developer/Prateek_website/src/app/admin/page.tsx
# Result: Line 204 sets intakeLeads(data.leads || []) and ignores data.traces
```

### 8. Verify Admin Invoices Scoped Strictly by `scope_id`
```bash
sed -n '85,92p' /Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-scopes/route.ts
# Result: Queries invSelect.in('scope_id', scopeIds), excluding scope_id IS NULL subscriptions/standalone invoices
```

### 9. Verify `rag_tenants.tenant_id` Schema Type is UUID
```bash
sed -n '418,421p' /Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql
# Result: tenant_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
```

### 10. Verify `rag_tenant_members` Column Names
```bash
sed -n '433,443p' /Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql
# Result: Columns are created_at and updated_at; joined_at does not exist
```

### 11. Verify Contact Route Skips Database Persistence on Standard Inquiries
```bash
sed -n '248,255p' /Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts
# Result: Line 250 gates database insertion behind `if (supabase && body.intakeDetails)`
```

### 12. Run Verification Test Suite
```bash
npm test src/app/auth/__tests__/callback.test.ts \
         src/lib/__tests__/emailNotification.test.ts \
         src/lib/__tests__/scopingObservability.test.ts \
         src/app/api/__tests__/razorpay.test.ts \
         src/app/api/__tests__/rag-tenant.test.ts
```

---
*End of Audit Report.*
