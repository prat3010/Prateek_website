# End-to-End Investigation & Audit: Subsystems 2, 3, 5, and 10

**Audit Date:** November 2026  
**Auditor:** Explorer 2 (Observability and Lifecycle Explorer)  
**Workspace:** `/Users/prateeksharma/Developer/Prateek_website`  
**Integrity Mode:** Strictly Read-Only Investigation  

---

## Table of Contents
1. [Executive Summary & Scope Overview](#1-executive-summary--scope-overview)
2. [Subsystem 2: Observability & Telemetry](#2-subsystem-2-observability--telemetry)
3. [Subsystem 3: Session Stitching](#3-subsystem-3-session-stitching)
4. [Subsystem 5: Error Handling](#4-subsystem-5-error-handling)
5. [Subsystem 10: Lifecycle Notifications and Alerts](#5-subsystem-10-lifecycle-notifications-and-alerts)
6. [Cross-Subsystem Risk Matrix](#6-cross-subsystem-risk-matrix)
7. [Synthesis & Actionable Remediation Plan](#7-synthesis--actionable-remediation-plan)

---

## 1. Executive Summary & Scope Overview

This audit investigates four core operational subsystems across the `Prateek_website` portfolio platform, its integration with Supabase PostgreSQL, and the Retriever OCI cognitive backend:
- **Subsystem 2: Observability & Telemetry** (Edge proxy, GDPR IP hashing, visit aggregation, RAG SLA metrics, Turn-level chat tracing, admin signup alerts).
- **Subsystem 3: Session Stitching** (Anonymous-to-authenticated session linking, scoping chat trace association, intake lead draft persistence, cookie lifecycle).
- **Subsystem 5: Error Handling** (Multi-tier React error boundaries, API error consistency, third-party resilience for Resend, Razorpay, Supabase, and Retriever).
- **Subsystem 10: Lifecycle Notifications and Alerts** (Hot lead alerts, milestone progression updates, invoice status updates, trial management, outreach pipeline).

All findings are backed by verified line-by-line codebase inspection and schema definitions.

---

## 2. Subsystem 2: Observability & Telemetry

### 2.1 Exact Code and Schema References
- **Edge Proxy Middleware:** `src/proxy.ts` (lines 1–137, function `proxy(request, event)`, matcher configuration lines 123–136).
- **GDPR IP Hashing & Security Utilities:** `src/lib/security.ts` (lines 4–11 `getIpHash`, lines 23–32 `HONEYPOT_PATTERNS`).
- **Distributed Tracing:** `src/lib/tracing.ts` (lines 13–23 `generateTraceparent`, W3C traceparent standard `00-{traceId}-{spanId}-01`).
- **Telemetry Schema & Pruning Trigger:** `supabase_schema.sql`:
  - `page_visits` table definition (lines 7–20).
  - Row-Level Security policies (lines 23–36).
  - Probabilistic 90-day pruning trigger `trg_purge_old_visits` & function `purge_old_page_visits()` (lines 40–55).
  - Composite partial index `idx_page_visits_dashboard` (lines 72–73).
  - High-performance aggregation stored procedure `get_analytics_summary(cutoff_time)` (lines 506–584).
- **Analytics Aggregation API:** `src/app/api/analytics-summary/route.ts` (lines 1–131, `GET`).
- **Visitor Analytics Dashboard View:** `src/app/analytics/page.tsx` & `src/app/analytics/_lib/analytics.ts` (lines 28–55 `fetchVisits`, lines 60–100 `aggregateVisits`).
- **Cognitive Scoping Trace Telemetry:** `src/lib/scopingObservability.ts` (lines 37–119 `logScopingChatTrace`).
- **Scoping Chat Traces Schema:** `supabase/migrations/20261025000000_scoping_chat_traces.sql` (lines 13–38 `scoping_chat_traces` DDL, lines 40–48 indexes & RLS).
- **RAG Studio Live SLA & Token Telemetry:** `src/app/api/rag/telemetry/route.ts` (lines 6–180, `GET`, upstream query to `/v1/admin/tenants/{tenantId}/telemetry/live`).
- **Admin Signup Notification Alert:** `src/app/auth/callback/route.ts` (lines 62–68) calling `sendAdminSignupNotification` in `src/lib/emailNotification.ts` (lines 37–100).

### 2.2 Confirmed Capabilities
1. **Zero-Latency Edge Telemetry Dispatch:**
   - In `src/proxy.ts` line 95, page visit logging executes via `event.waitUntil((async () => { ... })())`. This offloads database inserts to the Edge worker's background task without blocking the client's HTTP response.
2. **GDPR-Compliant Daily Salt Hashing:**
   - `getIpHash(ip)` in `src/lib/security.ts` hashes the client IP with a daily rotating salt: `SHA-256(ip + '-' + YYYY-MM-DD)`. This allows unique daily visitor tracking without persisting raw PII or enabling multi-day user surveillance.
3. **Automated Bot & Honeypot Filtering:**
   - User agents are evaluated using `@next/server`'s `userAgent(request)`. If `isBot` is true, database logging is bypassed (line 89).
   - `HONEYPOT_PATTERNS` regex test (`/\.php$/`, `/wp-admin/`, `/\.env/`, `/actuator/`, `/setup/`, etc.) blocks malicious exploit scanners before triggering database writes (lines 64–67).
4. **Geo-IP Ingestion & Location Privacy Guard:**
   - Vercel's edge header `x-vercel-ip-country` is captured (line 13). Region and city fields are intentionally set to `null` (lines 103–104) to prevent inaccurate ISP routing geolocation and reduce database bloat.
5. **High-Performance RPC Fast-Path with Client-Side Fallback:**
   - `/api/analytics-summary` executes `get_analytics_summary(cutoff_time)` in PostgreSQL, computing total views, bot counts, unique visitors, popular pages, referrers, and a 14-day timeline in a single query pass.
   - If the RPC is missing or fails, lines 64–110 execute a fallback query selecting up to 5,000 rows for in-memory aggregation.
6. **Granular Turn-Level Scoping Traces:**
   - Every scoping conversation turn in `/api/scoping/chat` logs a record to `scoping_chat_traces` capturing: `session_id`, `scope_code`, `turn_index`, `user_query`, `assistant_response`, `agent_intent`, `agent_reasoning`, `model_used`, `latency_ms`, `tokens_prompt`, `tokens_completion`, `is_fallback`, `currency`, `quote_inr`, `quote_usd`, `visitor_ip_hash`, and `visitor_country`.
7. **RAG Live Telemetry Integration:**
   - `/api/rag/telemetry` connects to Retriever OCI (`/v1/admin/tenants/{tenantId}/telemetry/live`), computing quota utilization (tokens, document count, storage bytes) and SLA metrics (faithfulness, precision, hallucination index, p99 latency).

### 2.3 Missing Gaps by Persona

| Area | Admin Persona Impact | User Persona Impact |
|---|---|---|
| **API Route Observability** | **Missing:** `src/proxy.ts` matcher explicitly excludes `/api/*` (`((?!api|_next/...).*)`). API endpoint response latencies, error spikes, and endpoint usage patterns are not logged to `page_visits` or any edge telemetry table. | **None directly**, but users suffer when API latency degrades without administrator awareness. |
| **Signup Notification Granularity** | **Flawed:** `sendAdminSignupNotification` in `auth/callback/route.ts` fires unconditionally on EVERY authentication callback. Returning clients logging in generate false "New User Registered" alert emails to the admin. | **None.** |
| **Exploit / Attack Telemetry** | **Missing:** Requests matching `HONEYPOT_PATTERNS` are silently discarded with no incrementing metric or security ledger. The admin cannot view scanning activity or blocked attack attempts in `/admin`. | **None.** |
| **User Activity Observability** | **N/A** | **Missing:** Verified users in `/dashboard` have no view of their account history, session logs, or past login activity. Only RAG studio users see quota metrics. |

### 2.4 Failure Modes and Edge Cases
1. **Silent Telemetry Dropping on Database Outage:**
   - In `src/proxy.ts` line 112, database insert errors are caught and logged only to `console.error`. If Supabase experiences an outage or connection pool exhaustion, page visits are silently dropped with no local buffering or retry queue.
2. **Double Counter on Rapid Client Reconnection:**
   - If a visitor refreshes the page within the same UTC day, `total_views` increments while `unique_visitors` remains deduplicated. However, if a user crosses the 00:00:00 UTC boundary, the daily salt changes, causing the same visitor to register as two unique visitors across adjacent days.
3. **Admin Telemetry Loop Protection Scope:**
   - `src/proxy.ts` line 59 skips logging for paths starting with `/admin`. However, it does NOT skip tracking for `/analytics` or `/terminal`, so admin visits to these diagnostic views inflate live visitor counts.

---

## 3. Subsystem 3: Session Stitching

### 3.1 Exact Code and Schema References
- **Scoping Chat Route:** `src/app/api/scoping/chat/route.ts` (lines 1225, 1308–1312, 1483, 1623: managing cookie `prateeq_chat_session_id`).
- **Scoping Session Pre-Warming:** `src/app/api/scoping/session/route.ts` (lines 7–54: checking and minting `prateeq_chat_session_id`).
- **Intake Lead Draft Persistence:** `src/app/api/client/intake-draft/route.ts` (lines 29–48, 141–151, 236–249: cookies `prateeq_draft_token`, `prateeq_pending_scope_code`, table `intake_leads`).
- **Wizard State Management:** `src/components/Intake/useIntakeFormState.ts` (lines 243, 878–879, 910–911, 967–968: syncing `prateeq_pending_scope` to `localStorage` and cookies).
- **Terminal Scoping Session Hydration:** `src/lib/terminalScoping.ts` (lines 75–142: reading/writing `localStorage['prateeq_pending_scope']`).
- **Auth Callback Session Stitcher:** `src/app/auth/callback/route.ts` (lines 70–100: reading cookies and dispatching `stitchAnonymousSession`).
- **Session Stitching Logic:** `src/lib/scopingObservability.ts` (lines 124–175: function `stitchAnonymousSession`).
- **Database Schema & Draft Lead Conversion:** `supabase_schema.sql`:
  - `intake_leads` table definition with `chat_session_id`, `chat_transcript`, `draft_token`, `ip_hash` (lines 622–652).
  - Stored procedure `convert_draft_lead_to_scope(p_draft_token, p_client_email, p_full_name)` (lines 664–740).
- **Client Workspace Scope Hydration:** `src/hooks/dashboard/useDashboardScopes.ts` (lines 15–95 `parsePendingScopeFromStorageOrUrl`, lines 160–161 clearing pending scope).
- **Scope Conversion Route:** `src/app/api/client/save-scope/route.ts` (lines 80–122: upserting `clients` and updating `intake_leads` status to `'converted'`).

### 3.2 Confirmed Capabilities
1. **Comprehensive 4-Key Anonymous Tracking Matrix:**
   The platform tracks anonymous user intent across four dedicated storage keys:
   - `prateeq_chat_session_id`: Cookie, 30 days (`Max-Age=2592000`), SameSite=Lax. Tracks cognitive LLM conversation turns.
   - `prateeq_draft_token`: Cookie, 7 days (`Max-Age=604800`), SameSite=Lax. Tracks unauthenticated scoping brief drafts in `intake_leads`.
   - `prateeq_pending_scope_code`: Cookie, 7 days (`Max-Age=604800`), SameSite=Lax. Binds generated `SCOPE-XXXXX` codes across page navigations.
   - `prateeq_pending_scope`: Dual `localStorage` + Cookie, 24 hours (`max-age=86400`). Stores the full JSON configuration of selected base engine, features, brand assets, and care plans.
2. **IDOR-Hardened Draft Updates:**
   - In `src/app/api/client/intake-draft/route.ts` lines 59–75, updates to existing `intake_leads` rows require proof of ownership: either matching `prateeq_draft_token` or matching verified session email (`getVerifiedSessionEmail`). Unauthorized mutations are rejected with 403 Forbidden.
3. **Automated Trace & Lead Stitching Upon OAuth / Magic Link Completion:**
   - In `src/app/auth/callback/route.ts`, upon successful auth exchange, the handler extracts `prateeq_pending_scope_code`, `prateeq_draft_token`, and `prateeq_chat_session_id`.
   - It invokes `stitchAnonymousSession(effectiveSessionId, user.email, pendingScopeCode, pendingDraftToken)`:
     - All matching rows in `scoping_chat_traces` have their `user_email` updated from `NULL` to the verified user email.
     - All matching rows in `intake_leads` with `contact_email = 'lead@unauthenticated.client'` have their email updated to the verified user email.
4. **Safari ITP / Private Browsing Resilience:**
   - `src/hooks/dashboard/useDashboardScopes.ts` implements a multi-tier fallback hierarchy:
     1. LocalStorage (`prateeq_pending_scope`)
     2. Cookie fallback (`prateeq_pending_scope`)
     3. URL query parameter fallback (`?imported=true&scopeCode=...&engine=...`)

### 3.3 Missing Gaps by Persona

| Area | Admin Persona Impact | User Persona Impact |
|---|---|---|
| **Cross-Device Scoping Continuation** | **Missing:** If an anonymous user scopes a project on mobile Safari and completes Google OAuth on their desktop Mac, cookies do not bridge devices. Historical scoping chat traces remain orphaned under `user_email: null`. | **Grave Friction:** User on desktop opens `/dashboard` and sees an empty workspace instead of their mobile-configured scoping proposal. |
| **Historical Chat Transcript Visibility** | **Confirmed:** Admin can inspect all turns in `/admin` via `/api/admin/intake-leads`. | **Missing:** In `/dashboard`, clients can see converted scopes and invoices, but CANNOT view their historical AI scoping conversation or architecture Q&A transcript. |
| **Dead Code Stored Procedure** | **Technical Debt:** `convert_draft_lead_to_scope` in `supabase_schema.sql` (lines 664–740) is never called by the application. Instead, conversion logic was duplicated in TypeScript in `save-scope/route.ts`. | **None.** |

### 3.4 Failure Modes and Edge Cases
1. **Critical Vercel Serverless Dangling Promise Failure:**
   - In `src/app/auth/callback/route.ts` lines 92–99:
     ```typescript
     Promise.resolve(
       stitchAnonymousSession(effectiveSessionId, user.email, pendingScopeCode, pendingDraftToken)
     ).catch(err => console.warn('Session stitching warning in auth callback:', err));
     return response; // Immediate 302 redirect
     ```
   - Because `GET(request: Request)` lacks `NextFetchEvent` and does NOT invoke `event.waitUntil()`, returning `NextResponse.redirect` terminates/freezes the Vercel serverless lambda execution context immediately. As a result, the asynchronous updates to `scoping_chat_traces` and `intake_leads` may be abruptly aborted by the runtime before finishing!
2. **Insecure Cookie Flags:**
   - None of `prateeq_chat_session_id`, `prateeq_draft_token`, `prateeq_pending_scope_code`, or `prateeq_pending_scope` are configured with `HttpOnly: true`. They are accessible to client-side scripts (`document.cookie`), making them susceptible to exfiltration via cross-site scripting (XSS).
   - In `src/app/api/scoping/chat/route.ts` lines 1303, 1483, 1623, `Set-Cookie: prateeq_chat_session_id=...` omits the `Secure` flag.
3. **Session ID Collision & Overwriting:**
   - If an anonymous user starts scoping, closes the browser, and another user opens the same shared device within 30 days, the subsequent scoping turns are attributed to the previous session ID unless the cookie is explicitly cleared.

---

## 4. Subsystem 5: Error Handling

### 4.1 Exact Code and Schema References
- **Root App Error Boundary:** `src/app/error.tsx` (lines 1–60, component `RootError`).
- **Global Kernel Error Boundary:** `src/app/global-error.tsx` (lines 1–127, component `GlobalError`).
- **RAG Studio Component Error Boundary:** `src/components/rag/ErrorBoundary.tsx` (lines 1–49, class `RagErrorBoundary`).
- **Auth Callback Error Catching:** `src/app/auth/callback/route.ts` (lines 23–28 error redirect, lines 103–111 exception handling).
- **Payment Webhook Resilience & Idempotency:** `src/app/api/webhooks/razorpay/route.ts`:
  - HMAC signature timing-safe validation (lines 18–40).
  - Idempotency ledger insert with unique constraint handling (`23505`) (lines 58–69).
  - Top-level exception handling (lines 747–753).
- **Order & Subscription API Validation:**
  - `src/app/api/client/create-razorpay-order/route.ts` (lines 28, 33, 40, 73, 77, 81, 89).
  - `src/app/api/client/verify-razorpay-payment/route.ts` (lines 24–28, 31–33, 53–58, 65–68).
- **Public RAG Guest Proxy Error Handling:** `src/app/api/rag/guest/[...path]/route.ts` (lines 190–225, 55s upstream timeout and 502 Bad Gateway mapping).
- **Heuristic Scoping Chat Fallback:** `src/app/api/scoping/chat/route.ts` (lines 1466–1486 `buildFallbackResponseText`).
- **Retriever OCI Engine Offline Fallback:** `src/lib/retrieverProvision.ts` (lines 121–128).
- **Contact Form Exception Handling:** `src/app/api/contact/route.ts` (lines 244–247, 281–288).

### 4.2 Confirmed Capabilities
1. **Three-Tier Hierarchical Error Boundaries:**
   - `global-error.tsx`: Self-contained HTML/body boundary that handles fatal root layout crashes with zero CSS stylesheet dependencies and inline CSS.
   - `error.tsx`: Root route segment boundary providing user-facing "System Interruption Detected", displaying the Next.js `error.digest`, and rendering accessible "Retry Operation" and "Return to Base" buttons.
   - `RagErrorBoundary`: Class-based component boundary wrapping `src/app/rag/app/page.tsx`, isolating internal chat and document widget errors so the overall app shell remains usable.
2. **Standardized API Error Schemas:**
   - All API endpoints across `/api/auth/`, `/api/client/`, `/api/rag/`, and `/api/webhooks/` enforce uniform JSON error payloads: `{ error: string, ... }` accompanied by strict semantic HTTP status codes (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable).
3. **Cryptographic Webhook Idempotency & Replay Defense:**
   - In `src/app/api/webhooks/razorpay/route.ts`, incoming payloads are verified using `crypto.timingSafeEqual` against HMAC-SHA256 signatures.
   - Events are recorded into `processed_webhooks(event_id)`. If Razorpay retries an event, PostgreSQL unique constraint `23505` intercepts it and returns `{ status: 'ok', duplicate: true }`, preventing double-crediting invoices or re-triggering notifications.
4. **Graceful Zero-Downtime Fallback in Scoping Copilot:**
   - If the Retriever OCI cognitive backend is unreachable or times out, `src/app/api/scoping/chat/route.ts` seamlessly activates `buildFallbackResponseText()`. It delivers a streamed rule-based solutions architecture response with `X-Fallback-Mode: true` and logs the fallback trace without dropping the user's connection.
5. **Upstream Timeout Isolation:**
   - Guest proxy requests in `src/app/api/rag/guest/[...path]/route.ts` enforce `AbortSignal.timeout(55_000)`, converting hung upstream OCI requests into clean 502 Bad Gateway JSON responses rather than stalling the client indefinitely.

### 4.3 Missing Gaps by Persona

| Area | Admin Persona Impact | User Persona Impact |
|---|---|---|
| **Centralized Error Ingestion** | **Missing:** No centralized crash reporting or error logging service (e.g. Sentry, Logflare, or Supabase `system_errors` table). Application errors are dumped solely to server `console.error` and Vercel runtime logs. | **None directly**, but bugs remain unaddressed until reported by users. |
| **Granular Boundary Isolation** | **N/A** | **Missing:** `/scoping`, `/dashboard`, and `/admin` lack isolated React error boundaries. A rendering error in an interactive pricing drawer or kanban board crashes the entire page view to `error.tsx`. |
| **Dead-Letter Queue (DLQ)** | **Missing:** Failed webhook executions or failed email dispatches log warnings to console and fail silently without an administrative retry queue. | **Risk of Delayed Onboarding:** If a webhook fails midway, client status is not updated until manually reconciled. |

### 4.4 Failure Modes and Edge Cases
1. **Contact Form Data Loss on Resend Outage:**
   - In `src/app/api/contact/route.ts` lines 244–247:
     ```typescript
     if (error) {
       console.error('Resend API Error:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
     }
     // Supabase intake_leads insertion is on line 250!
     ```
   - If Resend experiences an outage, has an invalid API key, or rejects an email, the endpoint aborts immediately and NEVER reaches the `intake_leads` database insert. Prospective client leads are permanently lost.
2. **Retriever OCI Desynchronization During Tenant Provisioning:**
   - In `src/lib/retrieverProvision.ts` lines 121–128, if the OCI engine is down during user onboarding or subscription verification, the function generates a synthetic tenant ID and API key and updates Supabase. However, because the tenant does not exist on the OCI engine, all subsequent search and ingestion requests fail with 404 until self-healing reconciliation executes.

---

## 5. Subsystem 10: Lifecycle Notifications and Alerts

### 5.1 Exact Code and Schema References
- **Centralized Email Notification Service:** `src/lib/emailNotification.ts` (1,098 lines):
  - `sendAdminSignupNotification` (lines 37–100)
  - `sendAdminIntakeLeadNotification` (lines 118–175)
  - `sendAdminScopeSavedNotification` (lines 180–230)
  - `sendPaymentConfirmationNotifications` (lines 235–330)
  - `sendAdminChangeOrderNotification` (lines 334–378)
  - `sendAdminOnboardingCompletedNotification` (lines 382–428)
  - `sendRetrieverSubscriptionNotifications` (lines 433–511)
  - `sendClientMilestoneStageAdvancedNotification` (lines 529–668)
  - `sendClientChangeOrderUpdateNotification` (lines 690–804)
  - `sendFinalBalanceSettlementNotifications` (lines 808–964)
  - `sendHotLeadAlertNotification` (lines 985–1098)
- **Scoping Copilot Hot-Lead Trigger:** `src/lib/scopingObservability.ts` (lines 73–115, in-memory deduplication `alertedHotLeadSessions`).
- **Intake Draft Lead Alert Trigger:** `src/app/api/client/intake-draft/route.ts` (lines 101–114, 199–234).
- **Scope Saved & Milestone Advancement Triggers:** `src/app/api/client/save-scope/route.ts` (lines 266, 270–290, 293–311).
- **Change Order Notification Triggers:** `src/app/api/client/change-orders/route.ts` (lines 190–200, 269–285).
- **Autonomous B2B Outreach Engine:**
  - `src/app/api/outreach/prospect/route.ts` (lines 1–351, live web prospecting + Gemini 3.6 Flash evaluation & pitch generation).
  - `src/app/api/outreach/dispatch/route.ts` (lines 1–118, manual admin approval & Resend cold dispatch).
  - `src/app/api/outreach/get-leads/route.ts` (lines 1–55, fetching outreach leads).
- **RAG 7-Day Trial Calculation:** `src/app/api/rag/tenant/route.ts` (lines 44–59).

### 5.2 Confirmed Capabilities
1. **11 Production-Ready Branded Email Notification Pipelines:**
   - All notifications in `src/lib/emailNotification.ts` generate responsive, dark-themed HTML emails with consistent branding, sanitized URLs, and direct workspace CTAs via Resend.
2. **Real-Time Hot Lead Scoping Alerts:**
   - In `src/lib/scopingObservability.ts`, an immediate high-priority alert is dispatched to `CONTACT_EMAIL_TO` (`3010prateeksharma@gmail.com`) when:
     - `quoteUSD >= 2500` or `quoteINR >= 200000`, OR
     - `turnIndex >= 3` and `quoteUSD >= 1500`, OR
     - Model activates escrow escalation (`modelUsed === 'escrow-escalation-router'`).
   - The alert includes quote total, selected features, turn count, visitor country, and reasoning.
3. **Meaningful Lead Qualification Defense:**
   - In `src/app/api/client/intake-draft/route.ts` lines 101–114, alerts are suppressed for casual 1-turn bounces. Emails are dispatched only if the lead has a real contact email, a custom company name, or a chat transcript with >= 6 messages.
4. **Client Milestone Progression Alerts:**
   - When an admin updates a client's project stage in `/admin` via `/api/client/save-scope`, `sendClientMilestoneStageAdvancedNotification` alerts the client with customized copy for:
     - `engineering`: Sprint kicked off notification.
     - `staging`: Review ready notification with deep link to staging URL.
     - `live`: Production launch notification with deep link to live production URL and GitHub repository.
5. **Bi-Directional Change Order Workflows:**
   - Client submission triggers `sendAdminChangeOrderNotification` with itemized feature additions/removals and cost impact.
   - Admin approval, rejection, or payment status change triggers `sendClientChangeOrderUpdateNotification` to the client.
6. **Dual Payment Receipts (Deposit & Final Balance):**
   - On 50% deposit payment: Both client and admin receive itemized confirmations.
   - On final 50% balance payment: Both parties receive final settlement receipts confirming project sign-off.
7. **Autonomous Outreach Cold Outreach Pipeline:**
   - `/api/outreach/prospect` searches live web sources, evaluates leads via Gemini (`evaluateLeadWithGemini`), generates custom architectural pitches citing verified Retriever builds, and stages them in `outreach_leads` for one-click admin approval in `/admin`.

### 5.3 Missing Gaps by Persona

| Area | Admin Persona Impact | User Persona Impact |
|---|---|---|
| **Real-Time Chat/Push Alerts** | **Missing:** No integration with Slack, Discord, or Telegram webhooks. If the administrator is away from email, hot leads or urgent escrow escalations can sit unread for hours. | **None.** |
| **Trial Expiration Lifecycle Alerts** | **Missing:** No alerts are sent when a user's 7-day RAG trial expires or when their account is restricted. | **High Friction:** Users receive NO email warning that their trial is expiring (e.g., at 3 days or 1 day remaining) or that their workspace has transitioned into read-only soft paywall mode. |
| **Invoice Reminders & Overdue Alerts** | **Missing:** No automated reminders for pending or overdue milestone invoices. | **Missing:** Clients receive no automated notification when an invoice is issued or when a payment deadline approaches. |
| **New User Welcome Email** | **N/A** | **Missing:** When a new user authenticates via Google OAuth or Magic Link, ONLY the admin receives an email alert. The user receives NO welcome onboarding email or guide to their workspace. |

### 5.4 Failure Modes and Edge Cases
1. **Serverless Ephemeral Memory Deduplication Breach:**
   - In `src/lib/scopingObservability.ts` line 6:
     ```typescript
     const alertedHotLeadSessions = new Set<string>();
     ```
   - In serverless runtimes (Vercel Edge/Serverless Lambdas), memory is not shared across instances. If subsequent turns in a high-value scoping session route to different lambda instances, duplicate hot lead emails can be dispatched to the admin.
2. **Missing Cron Engine for Lifecycle Scheduling:**
   - RAG trial expirations and invoice due dates are evaluated ONLY when a client actively makes an HTTP request. There is no scheduled cron job (such as a GitHub Actions cron or systemd timer) that scans the database daily to dispatch reminder emails for expiring trials or overdue invoices.
3. **Fire-and-Forget Email Failures:**
   - All lifecycle notification dispatches in `save-scope`, `scopingObservability`, `intake-draft`, and `auth/callback` use unawaited `.catch(err => console.warn(...))`. If the Resend API quota is exceeded or network delivery fails, no retry is attempted, and no notification status is persisted in the database.

---

## 6. Cross-Subsystem Risk Matrix

| Risk ID | Subsystem | Severity | Description | Persona Impact |
|---|---|---|---|---|
| **RSK-01** | Subsystem 3 | **HIGH** | `stitchAnonymousSession` in `src/app/auth/callback/route.ts` is called as an unawaited Promise without `event.waitUntil()`, risking premature process termination and incomplete database stitching. | **User & Admin:** Scoping traces and intake leads remain orphaned under anonymous IDs. |
| **RSK-02** | Subsystem 5 | **HIGH** | In `src/app/api/contact/route.ts`, Resend email dispatch precedes `intake_leads` database persistence; email delivery failure permanently discards the contact lead. | **Admin:** Lost client revenue and zero record of inquiry. |
| **RSK-03** | Subsystem 10 | **MEDIUM** | Complete absence of automated email notifications for RAG trial expiration, invoice issuance, and overdue payments. | **User:** Sudden workspace lockout without prior email warning. |
| **RSK-04** | Subsystem 2 | **MEDIUM** | `sendAdminSignupNotification` lacks user registration vs login distinction, triggering false "New User Registered" alerts on every returning authentication. | **Admin:** Inbox alert fatigue leading to overlooked genuine leads. |
| **RSK-05** | Subsystem 3 | **MEDIUM** | Cookies `prateeq_chat_session_id`, `prateeq_draft_token`, and `prateeq_pending_scope_code` lack `HttpOnly` and `Secure` attributes, exposing session tokens to XSS. | **User:** Potential session tampering in shared or compromised environments. |
| **RSK-06** | Subsystem 5 | **MEDIUM** | Lack of localized React error boundaries in `/scoping`, `/dashboard`, and `/admin`; component crashes bubble up to the root error boundary. | **User:** Entire workspace view replaced by generic 500 error card on single component failure. |
| **RSK-07** | Subsystem 10 | **LOW** | In-memory `alertedHotLeadSessions` Set resets across serverless lambda instances, causing occasional duplicate hot lead alerts. | **Admin:** Duplicate email alerts for the same scoping session. |

---

## 7. Synthesis & Actionable Remediation Plan

### Phase 1: High-Priority Fixes (Reliability & Data Preservation)
1. **Fix Serverless Lifecycle in Auth Callback (`auth/callback/route.ts`):**
   - Await `stitchAnonymousSession(...)` or pass `NextFetchEvent` with `event.waitUntil()` before returning the redirect response.
2. **Re-order Contact Route Persistence (`api/contact/route.ts`):**
   - Insert into `intake_leads` BEFORE attempting Resend email dispatch. If email fails, the lead record remains preserved in the database.
3. **Harden Session Cookies:**
   - Update `prateeq_chat_session_id`, `prateeq_draft_token`, and `prateeq_pending_scope_code` cookies to enforce `secure: process.env.NODE_ENV === 'production'` and evaluate `httpOnly` feasibility.

### Phase 2: Observability & Notification Enhancements
1. **Deduplicate Admin Signup Alerts:**
   - In `auth/callback/route.ts`, check `user.created_at` against `user.last_sign_in_at` (or check if `clients` row exists) so that `sendAdminSignupNotification` only fires for first-time signups.
2. **Implement User Welcome Email (`sendUserWelcomeNotification`):**
   - Send an automated welcome email to the newly registered client with links to `/dashboard` and `/scoping`.
3. **Implement RAG Trial Expiration Alerts:**
   - Create a daily cron endpoint (`/api/cron/lifecycle-checks`) authenticated by `CRON_SECRET` to scan `rag_subscriptions` and send trial expiration warning emails (at T-3 days, T-1 day, and expired).
4. **Local React Error Boundaries:**
   - Wrap the major sections of `/scoping` (wizard, chat bar) and `/dashboard` (scope cards, invoices, change orders) in localized error boundaries to prevent full-page crashes.

### Phase 3: Multi-Channel Real-Time Alerting
1. **Slack / Discord Webhook Alerting:**
   - Add optional `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL` environment variable support to `src/lib/emailNotification.ts` so that high-priority Hot-Lead and Escrow alerts ping the administrator in real-time.
