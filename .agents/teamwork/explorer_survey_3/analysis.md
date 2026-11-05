# In-Depth Audit Report: Security & RLS, Tenant Provisioning, and Payment Subsystems

**Audit Target Workspaces**: `/Users/prateeksharma/Developer/Prateek_website` & `/Users/prateeksharma/Developer/retriever`  
**Auditor**: Explorer 3 (Security & Provisioning Explorer)  
**Date**: 2026-11-05  
**Audit Scope**: Subsystem 6 (Security & Row-Level Security), Subsystem 8 (Tenant Provisioning), Subsystem 9 (Payment & Invoicing)

---

## 1. Executive Summary

This deep-dive architectural audit evaluated the account creation, multi-tenant isolation, tenant provisioning, and commercial checkout flows across `Prateek_website` (Next.js 16 App Router on Vercel), Supabase (PostgreSQL 16), and the `retriever` cognitive backend (FastAPI + pgvector on Oracle Cloud VPS).

### Key Architectural Strengths
- **Authentic Cryptographic Verification**: Session verification (`sessionVerify.ts`) delegates token validation directly to Supabase Auth's `getUser` API endpoint rather than naive client-side decoding, preventing forged JWT tokens.
- **Strict Anti-Tampering Payments**: Commercial checkout (`create-razorpay-order`) recalculates quotes canonically against system catalogs (`recalculateCanonicalScopeQuote`) rather than trusting client-provided prices.
- **Timing-Safe Webhook Signatures & Idempotency**: Razorpay webhooks enforce timing-safe HMAC-SHA256 signature verification and utilize an immutable idempotency ledger (`processed_webhooks`) backed by a database unique constraint to prevent replay attacks.
- **Retriever Engine RLS Hardening**: The Retriever backend utilizes PostgreSQL `ENABLE ROW LEVEL SECURITY` combined with `FORCE ROW LEVEL SECURITY` across 35+ customer tables, scoped via transactional `SET LOCAL app.current_tenant_id = '{valid_uuid}'`.

### Critical Vulnerabilities & High-Risk Architectural Gaps
1. **Unenforced RLS on Multiple Database Tables**:
   - `promo_codes` (created in `supabase/migrations/20260825_promo_codes.sql`) has **NO Row-Level Security enabled**. Anonymous public callers can query all discount codes, rates, partner IDs, and max usage counts.
   - `social_drafts`, `tenants`, `documents`, `document_chunks`, and `vector_records` declared in `supabase_schema.sql` (lines 879–933) have **NO RLS enabled**. If created in Supabase, they allow unrestricted anonymous public read/write access.
2. **Plaintext API Key Exposure in `rag_tenants`**:
   - `rag_tenants` stores unencrypted `api_key TEXT` values. The RLS policy `"Members can select matching rag_tenants"` permits any member (including standard `member` roles) to query `rag_tenants`, exposing live `ret_live_...` administrative workspace API keys to all tenant members.
3. **Scope Deposit Tenant Orphanage (Client Disconnect)**:
   - When a client pays a project deposit via Razorpay (`src/app/api/webhooks/razorpay/route.ts:285–324`), `ensureRetrieverEngineTenant` provisions an engine tenant and indexes the Statement of Work (SOW). However, the webhook **fails to insert a membership record into `rag_tenant_members`** for the client email. Consequently, when the client navigates to `/rag/app`, their project tenant is inaccessible and the app bootstraps an unrelated empty starter tenant.
4. **Service Role RLS Bypass as Single Point of Failure**:
   - All Next.js API routes use `@/data/supabase`, initialized with `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses all PostgreSQL RLS policies globally. Tenant isolation relies 100% on programmatic `.eq('client_email', email)` clauses in application code.

---

## 2. Subsystem 6: Security and Row-Level Security

### 2.1 Code and Schema References
- **Supabase Master Schema**: `supabase_schema.sql`
  - Telemetry RLS: lines 22–37 (`page_visits`)
  - Public content tables: lines 124–132 (`projects`), 154–161 (`skills`), 179–186 (`certificates`), 196–202 (`profile`), 606–613 (`posts`), 792–796 (`snake_leaderboard`)
  - Commercial tables: lines 218–223 (`clients`), 286–295 (`client_scopes`), 334–341 (`invoices`), 363–367 (`scope_change_orders`), 386–392 (`project_deliverables`), 410–416 (`rag_subscriptions`)
  - Multi-tenant tables: lines 431 (`rag_tenants`), 445–462 (`rag_tenant_members`)
  - Admin/System tables: lines 652–654 (`intake_leads`), 754 (`processed_webhooks`), 829–832 (`outreach_leads`), 866–869 (`scoping_chat_traces`)
  - Unprotected tables: lines 879–933 (`tenants`, `documents`, `document_chunks`, `vector_records`, `social_drafts`)
- **Database Migrations**:
  - `supabase/migrations/20260814000000_rag_tenants_and_members.sql`: lines 19–21, 35–37, 40–62
  - `supabase/migrations/20260819000000_payment_webhook_idempotency.sql`: line 11
  - `supabase/migrations/20260825_promo_codes.sql`: lines 1–27 (RLS omitted)
  - `supabase/migrations/20261013000000_rag_tenants_plan_tier_and_api_key.sql`: lines 9–26
- **Application Security Modules**:
  - `src/lib/sessionVerify.ts`: lines 9–25 (`getVerifiedSessionEmail`), lines 31–47 (`getVerifiedSessionUser`)
  - `src/data/supabase.ts`: lines 20–26 (service-role client instantiation)
  - `src/lib/auth.ts`: lines 7–15 (`ADMIN_EMAILS`, `isAdminEmail`)
- **Retriever Engine Security**:
  - `retriever/apps/api/src/adapters/database/setup.py`: lines 15–69 (`_enable_rls_on_tables`, `FORCE ROW LEVEL SECURITY`)
  - `retriever/apps/api/src/adapters/database/connection.py`: lines 28–59 (`tenant_session`, `SET LOCAL app.current_tenant_id`)
  - `retriever/apps/api/src/adapters/api/security.py`: lines 68–295 (`get_current_user`, OIDC/Supabase JWT validation)

### 2.2 Confirmed Capabilities
1. **Server-Side Token Verification**:
   `src/lib/sessionVerify.ts` extracts the Bearer token from the incoming HTTP `Authorization` header and invokes `supabase.auth.getUser(token)`. This validates the token's cryptographic signature against Supabase Auth's public keys, enforces expiry (`exp`), and ensures the account exists and is active.
2. **Tenant and Owner Isolation on Commercial Data**:
   - `client_scopes`: Authenticated users can only SELECT rows where `auth.jwt() ->> 'email' = client_email`. Users can only DELETE uncommitted scopes where `deposit_paid = false`.
   - `invoices`: Users can only SELECT rows matching `customer_email` or linked via `clients.id`.
   - `scope_change_orders`: Users can only SELECT rows where `requested_by_email` matches their verified JWT email.
   - `project_deliverables`: Accessible only if `client_scopes.client_email` matches the requester's JWT email.
3. **Default-Deny Protection on System Ledgers**:
   Tables `intake_leads`, `processed_webhooks`, `outreach_leads`, and `scoping_chat_traces` have RLS enabled with zero public/anonymous policies. Only calls made with the `SUPABASE_SERVICE_ROLE_KEY` can access or mutate these records.
4. **PostgreSQL RLS with FORCE in Retriever Backend**:
   In `retriever/apps/api`, every tenant-scoped table executes `ALTER TABLE <tbl> ENABLE ROW LEVEL SECURITY` AND `ALTER TABLE <tbl> FORCE ROW LEVEL SECURITY`. Table owners and superusers cannot bypass tenant isolation policies. Queries are executed inside `tenant_session()` which validates `uuid.UUID` and binds `SET LOCAL app.current_tenant_id = '{valid_uuid}'`.

### 2.3 Missing Gaps by Persona

#### Admin Persona Gaps
- **Missing Studio Admin RLS Policies in Supabase**:
  RLS policies on commercial tables (`client_scopes`, `invoices`, `clients`, `rag_tenants`) only check `auth.jwt() ->> 'email' = client_email`. There is no policy permitting Studio Administrators (emails in `ADMIN_EMAILS`) to read or query these tables via client-side Supabase tokens. Admin functionality works strictly because Next.js API routes use the master service-role key. If an administrator connects with their user JWT, queries return empty sets.
- **Inability for Workspace Owners to View Teammates via Supabase Client**:
  The policy on `rag_tenant_members` is:
  ```sql
  CREATE POLICY "Users can select own memberships" ON rag_tenant_members FOR SELECT
    USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');
  ```
  An owner cannot view other team members in their workspace via direct Supabase client queries. They must rely exclusively on `/api/rag/members`.
- **Absence of Database-Level Admin Audit Logs**:
  While the Retriever engine maintains an `audit_logs` table, `Prateek_website` has no audit log table in Supabase tracking administrative overrides (e.g. manually marking a deposit paid, advancing a delivery stage, or updating deliverables).

#### User Persona Gaps
- **Bearer Token Exclusivity (Cookie-Only Sessions Rejected)**:
  `src/lib/sessionVerify.ts` inspects exclusively `req.headers.get('authorization')`. Requests authenticated solely via HTTP cookies (`prateeq_active_user` or Supabase SSR cookies) return `null` (401 Unauthorized). If client-side JavaScript fails to retrieve the access token from storage, authenticated browser sessions are rejected.
- **Zero Client-Side Write Policies**:
  Authenticated users have no `INSERT` or `UPDATE` policies on `clients`, `client_scopes`, `invoices`, or `rag_tenants`. While this prevents unauthorized modifications, it forces all client updates to route through Next.js server endpoints.

### 2.4 Failure Modes and Edge Cases
1. **Unprotected Tables (RLS Disabled)**:
   - Migration `supabase/migrations/20260825_promo_codes.sql` creates `promo_codes` without `ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;`. Any anonymous user can read all promotional codes and partner commissions.
   - Tables `tenants`, `documents`, `document_chunks`, `vector_records`, and `social_drafts` in `supabase_schema.sql` (lines 879–933) omit RLS entirely.
2. **Plaintext API Key Leakage**:
   `rag_tenants` stores live `ret_live_...` API keys in plaintext (`api_key TEXT`). The `Members can select matching rag_tenants` policy allows any workspace member to read this column, granting regular members administrative access to the Retriever engine.
3. **Application-Level Filtering Dependency**:
   Because Next.js API routes query Supabase via `SUPABASE_SERVICE_ROLE_KEY`, PostgreSQL RLS policies are bypassed. A developer omission of `.eq('client_email', clientEmail)` in any endpoint would immediately leak cross-tenant data.

---

## 3. Subsystem 8: Tenant Provisioning

### 3.1 Code and Schema References
- **Tenant Management Routes**:
  - `src/app/api/rag/tenant/route.ts`: lines 18–90 (GET workspace & self-healing), lines 93–167 (bootstrap default workspace)
  - `src/app/api/rag/invite/route.ts`: lines 14–69 (role validation & authorization), lines 71–90 (upsert member), lines 92–145 (Resend invitation email), lines 147–167 (OCI backend user sync)
  - `src/app/api/rag/members/route.ts`: lines 19–61 (GET workspace members), lines 71–157 (DELETE member with last-owner protection)
- **Provisioning Engine**:
  - `src/lib/retrieverProvision.ts`: lines 4–13 (plan-to-engine tier mapping), lines 34–168 (`ensureRetrieverEngineTenant`)
  - `src/lib/rag-client.ts`: lines 61–110 (`RetrieverClient` HTTP client with `traceparent`, `X-Tenant-ID`, `X-User-ID`)
- **Database Tables**:
  - `rag_tenants`: `supabase_schema.sql` lines 418–430
  - `rag_tenant_members`: `supabase_schema.sql` lines 433–443
  - `rag_subscriptions`: `supabase_schema.sql` lines 394–408
- **Retriever OCI Backend**:
  - `retriever/apps/api/src/routers/tenant.py`: lines 65–104 (`POST /v1/tenants`)
  - `retriever/apps/api/src/routers/admin.py`: lines 222–268 (`GET/PATCH /v1/admin/tenants/{id}`), lines 304–331 (`POST /v1/admin/tenants/{id}/users`), lines 368–385 (`POST /v1/admin/tenants/{id}/api-keys`)
  - `retriever/apps/api/src/adapters/api/security.py`: lines 224–265 (auto-provisioning on OIDC JWT)

### 3.2 Confirmed Capabilities
1. **On-Demand Default Workspace Bootstrapping**:
   When an authenticated user accesses `/rag/app`, `GET /api/rag/tenant` checks for existing membership in `rag_tenant_members`. If none exists, it invokes `ensureRetrieverEngineTenant`, registers the tenant on the Retriever OCI backend, mints an administrative API key (`ret_live_...`), records the tenant in `rag_tenants`, assigns the user as `owner` in `rag_tenant_members`, and seeds a Starter plan with 250,000 monthly tokens and a 7-day trial in `rag_subscriptions`.
2. **Self-Healing Reconciliation**:
   If an existing workspace is detected with a missing API key or a legacy synthetic ID (e.g. `tenant_...`), `GET /api/rag/tenant` calls `ensureRetrieverEngineTenant` to reconcile the workspace on the OCI engine, mints an authentic API key, and cascades the updated tenant UUID across `rag_tenants` and `rag_subscriptions`.
3. **Role-Based Team Invitations and Deletions**:
   - `/api/rag/invite`: Only workspace owners or admins can invite teammates. Only owners can invite additional owners. Dispatches branded HTML invitation emails via Resend.
   - `/api/rag/members`: Enforces that non-owners cannot remove owners, and prevents the removal of the sole remaining owner of a workspace (returns 409 Conflict).
4. **Subscription Quota Synchronization**:
   Webhook handlers for `subscription.charged` and `subscription.activated` update `rag_tenants.plan_tier` and adjust `rag_subscriptions.monthly_token_limit` (Starter: 250k, Pro: 1.5M, Business: 10M tokens).

### 3.3 Missing Gaps by Persona

#### Admin Persona Gaps
- **Lack of Multi-Tenant Control Panel in `Prateek_website`**:
  The website `/admin` page has no interface to view active RAG tenants, inspect tenant storage/document counts, or view team rosters. (Management is isolated to the separate `admin.rag.prateeq.in` dashboard in `retriever/apps/web`).
- **No Manual API Key Revocation/Rotation Route**:
  Admins have no endpoint or UI action to revoke or regenerate a compromised tenant API key on demand.

#### User Persona Gaps
- **Scope Deposit Tenant Orphanage (Critical Functional Disconnect)**:
  In `src/app/api/webhooks/razorpay/route.ts` (lines 281–345), when a client pays a project deposit, `ensureRetrieverEngineTenant` is called and creates an OCI tenant linked to `client_scopes.retriever_tenant_id`. However, **it never inserts a row into `rag_tenant_members`** for the client email. When that client logs into `/rag/app`, `GET /api/rag/tenant` finds no membership and creates a separate, empty Starter tenant. The project workspace containing the client's Statement of Work is permanently inaccessible to the client.
- **Single Workspace Limitation (Missing Multi-Tenant Switcher)**:
  Although the database schema supports multi-tenancy (`rag_tenant_members` maps `tenant_id` to `user_id` / `email`), `GET /api/rag/tenant` executes `.limit(1).maybeSingle()`. A user who is invited to multiple workspaces can only ever access the first tenant they joined; there is no UI workspace switcher or endpoint to select active tenant context.
- **Missing 'Viewer' Role**:
  `rag_tenant_members.role` has a CHECK constraint allowing only `('owner', 'admin', 'member')`. Read-only audit roles (`viewer`) cannot be provisioned.

### 3.4 Failure Modes and Edge Cases
1. **Synthetic Key Fallback Leading to Permanent 401**:
   In `src/lib/retrieverProvision.ts` (lines 126–129), if `ADMIN_MASTER_KEY` is not configured or the Retriever OCI backend is offline, the code generates a synthetic key:
   ```ts
   resolvedApiKey = `ret_live_${crypto.randomBytes(16).toString('hex')}`;
   ```
   This synthetic key is saved in Supabase but **never registered in the Retriever PostgreSQL `api_keys` table**. Subsequent document ingestion or chat requests made by `RetrieverClient` immediately fail with `401 Unauthorized`.
2. **Tenant Creation Concurrency Race Condition**:
   If a new user triggers multiple concurrent requests to `GET /api/rag/tenant` (e.g. fast page reload), both requests observe `member == null` simultaneously. Both invoke `ensureRetrieverEngineTenant` and attempt to insert into `rag_tenants`, causing duplicate key errors on `tenant_id` or creating orphaned tenant entities in Retriever.
3. **Hardcoded User UUID in Webhook Document Upload**:
   In `webhooks/razorpay/route.ts` line 315, the SOW markdown upload passes:
   ```ts
   'X-User-ID': '00000000-0000-4000-a000-000000000001'
   ```
   If foreign key validation is enabled on `users.user_id` for document ingestion, the SOW document upload fails silently.

---

## 4. Subsystem 9: Payment and Invoicing

### 4.1 Code and Schema References
- **Pricing & Quoting Engine**:
  - `src/lib/pricing.ts`: lines 11–15 (`Currency`, `USD_TO_INR_RATE = 85`), lines 125–220 (`calcQuote`), lines 222–260 (`recalculateCanonicalScopeQuote`)
  - `src/lib/invoicing.ts`: lines 4–30 (`SELLER_CONFIG`), lines 81–187 (`calculateInvoiceTotals`), lines 192–207 (`formatCurrencyAmount`, `generateInvoiceNumber`)
- **Payment API Endpoints**:
  - `src/app/api/client/create-razorpay-order/route.ts`: lines 57–210 (direct invoice orders), lines 212–553 (scope deposit/balance orders)
  - `src/app/api/client/verify-razorpay-payment/route.ts`: lines 47–58 (signature verification), lines 169–301 (dev mock bypass), lines 302–309 (prod 202 webhook deferral)
  - `src/app/api/client/create-razorpay-subscription/route.ts`: lines 31–158 (`CANONICAL_PLANS`), lines 187–276 (`resolveOrCreateRazorpayPlanId`), lines 278–406 (subscription initiation)
  - `src/app/api/client/verify-razorpay-subscription/route.ts`: lines 58–77 (subscription signature verification), lines 81–185 (care plan activation), lines 187–355 (SaaS subscription activation)
  - `src/app/api/client/create-razorpay-invoice/route.ts`: lines 8–193 (admin custom invoice creation)
  - `src/app/api/client/get-invoices/route.ts`: lines 5–54 (client invoice retrieval)
  - `src/app/api/webhooks/razorpay/route.ts`: lines 28–39 (HMAC signature verification), lines 58–69 (idempotency ledger), lines 71–398 (one-time payment capture & ledger updates), lines 399–744 (subscription state transitions)
- **Database Tables**:
  - `invoices`: `supabase_schema.sql` lines 300–332
  - `processed_webhooks`: `supabase_schema.sql` lines 747–753, `supabase/migrations/20260819000000_payment_webhook_idempotency.sql` lines 4–9
  - `client_scopes`: `supabase_schema.sql` lines 226–263

### 4.2 Confirmed Capabilities
1. **Canonical Price Enforcement (Tamper Resistance)**:
   `create-razorpay-order` does not accept user-specified amounts. It retrieves the scope from `client_scopes` and calls `recalculateCanonicalScopeQuote`. If features and engine match the catalog, it recomputes totals canonically, preventing client-side price tampering.
2. **Dual-Currency Handling with Automatic Fallback**:
   Native INR (paise) and USD (cents) currencies are supported. If Razorpay rejects a USD transaction (e.g. international card processing disabled on merchant account), `create-razorpay-order` automatically converts the amount to INR at `USD_TO_INR_RATE = 85` and re-attempts order generation. For international clients desiring bank wire settlement, Wise ACH and SWIFT details are provided under Indian GST LUT rules.
3. **Cryptographic Webhook Signature & Idempotency**:
   - `webhooks/razorpay/route.ts` validates `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET` using timing-safe comparison.
   - All events are recorded in `processed_webhooks` with `event_id TEXT UNIQUE`. Retried webhook deliveries fail with unique constraint error `23505` and return `{ status: 'ok', duplicate: true }`, preventing double-crediting.
4. **Robust Commercial State Transitions**:
   - **One-Time Scopes**: `Draft Proposal` → (Deposit Paid) → `Deposit Paid — In Development` (stage: `engineering`, SOW hash recorded) → (Balance Paid) → `Project Settled — Production Live` (stage: `live`).
   - **Change Orders**: Feature additions/removals generate custom invoices. Payment merges features and updates `total_cost_inr` and `total_cost_usd`.
   - **Care Plan Subscriptions**: `subscription.activated`/`charged` transitions scope `maintenance_status = 'active'`, updates `maintenance_current_period_end`, and generates recurring `CARE-...` paid invoice records. `subscription.cancelled` or `halted` transitions status to `'cancelled'`.
   - **Retriever SaaS Subscriptions**: Updates `rag_subscriptions.is_active`, adjusts token limits, and logs paid `RET-...` invoices.
5. **GST Tax Calculation Engine**:
   `calculateInvoiceTotals` calculates CGST (9%) + SGST (9%) for intra-state (Delhi) vs IGST (18%) for inter-state transactions. USD transactions are zero-rated under Indian GST export rules with Letter of Undertaking (LUT) terms.

### 4.3 Missing Gaps by Persona

#### Admin Persona Gaps
- **No Refund / Credit Note Management**:
  There is no admin endpoint or UI to trigger a Razorpay refund or issue a credit note in the `invoices` table. Cancellations or refunds must be processed manually in the Razorpay dashboard and manually patched in Supabase via SQL.
- **No Invoice Cancellation / Voiding Action**:
  Admin can issue invoices via `/api/client/create-razorpay-invoice`, but there is no endpoint to void, cancel, or edit an issued invoice before payment.
- **No Webhook Failure Dead-Letter Queue or Manual Sync**:
  If the webhook endpoint returns 500 (e.g. database network timeout), Razorpay retries for 24 hours. There is no admin tool to manually reconcile an order from its Razorpay payment ID.

#### User Persona Gaps
- **Missing Self-Service Subscription Cancellation**:
  Users can subscribe to Retriever SaaS or Care Plans, but there is **no endpoint in `Prateek_website` allowing a user to cancel or pause their subscription**. Users must cancel through their UPI/card provider or request manual cancellation.
- **Inconsistent Receipt PDF Generation for Subscriptions**:
  While project invoices feature full PDF proposal/invoice downloads (`InvoicePDF.tsx`), recurring subscription rows (`RET-...` and `CARE-...`) are created with empty `line_items` JSON, causing PDF generation to fail or render blank line items.

### 4.4 Failure Modes and Edge Cases
1. **Production Payment Verification Race Condition (Webhook Latency)**:
   In production, `verify-razorpay-payment` returns `202 Accepted` and intentionally leaves ledger mutations to the signed webhook (`webhooks/razorpay/route.ts`). If the webhook delivery is delayed by Razorpay, the client is redirected to `/dashboard`, which continues to show "Unpaid / Pending Deposit", confusing the client into thinking the payment failed.
2. **Pending Invoice Accumulation on Modal Open**:
   Every time a client opens the checkout modal for a scope, `create-razorpay-order` creates a pending invoice row. While lines 378–410 attempt to reuse existing pending invoices, requests across different browsers or without a matched `scope_id` accumulate orphaned `pending` invoice records.
3. **Currency Inconsistency on International Fallback**:
   When a USD payment falls back to an INR Razorpay order, the invoice ledger stores `currency: 'USD'` and `amount: <usd_total>`, while the captured Razorpay payment record is in INR. Financial reconciliation queries comparing `invoices.amount` with Razorpay payout reports encounter discrepancies unless converted using `USD_TO_INR_RATE`.

---

## 5. Comprehensive Subsystem Capability Matrix

| Capability | Subsystem | Admin Persona | User Persona | Status | Exact Code / Schema Reference |
|---|---|---|---|---|---|
| Cryptographic Session Verification | Security | Confirmed | Confirmed | Implemented | `src/lib/sessionVerify.ts:9–47` |
| Row-Level Security on Commercial Tables | Security | Gap (Bypasses RLS) | Confirmed | Implemented | `supabase_schema.sql:218–416` |
| Row-Level Security on Promo Codes | Security | Missing | Missing | **Critical Gap** | `supabase/migrations/20260825_promo_codes.sql:2` |
| Row-Level Security on Vector / Docs Tables | Security | Missing | Missing | **Critical Gap** | `supabase_schema.sql:879–933` |
| Secret Masking on Tenant API Keys | Security | Missing | Missing | **Critical Gap** | `supabase_schema.sql:424`, `rag_tenants` |
| Cookie-Based Session Auth Support | Security | Missing | Missing | Gap | `src/lib/sessionVerify.ts:11` |
| Automatic Tenant Bootstrapping | Provisioning | Confirmed | Confirmed | Implemented | `src/app/api/rag/tenant/route.ts:93–167` |
| Self-Healing OCI Tenant Reconciliation | Provisioning | Confirmed | Confirmed | Implemented | `src/lib/retrieverProvision.ts:34–168` |
| Scope Deposit Tenant Member Linking | Provisioning | Confirmed | Missing | **High Gap** | `webhooks/razorpay/route.ts:281–352` |
| Multi-Workspace Tenant Switcher | Provisioning | Confirmed | Missing | Gap | `src/app/api/rag/tenant/route.ts:18–23` |
| Team Member Role Governance | Provisioning | Confirmed | Confirmed | Implemented | `src/app/api/rag/invite/route.ts:50–69` |
| Last Owner Removal Protection | Provisioning | Confirmed | Confirmed | Implemented | `src/app/api/rag/members/route.ts:121–145` |
| Anti-Tamper Canonical Order Quoting | Payments | Confirmed | Confirmed | Implemented | `src/app/api/client/create-razorpay-order/route.ts:302–325` |
| Dual-Currency Handling & INR Fallback | Payments | Confirmed | Confirmed | Implemented | `src/app/api/client/create-razorpay-order/route.ts:149–156` |
| Webhook Timing-Safe Signature Validation | Payments | Confirmed | Confirmed | Implemented | `src/app/api/webhooks/razorpay/route.ts:28–39` |
| Webhook Replay Protection (Idempotency) | Payments | Confirmed | Confirmed | Implemented | `src/app/api/webhooks/razorpay/route.ts:58–69` |
| Commercial Stage Progression (50/50 & SOW) | Payments | Confirmed | Confirmed | Implemented | `src/app/api/webhooks/razorpay/route.ts:251–351` |
| Recurring Subscription Ledger Lifecycle | Payments | Confirmed | Confirmed | Implemented | `src/app/api/webhooks/razorpay/route.ts:400–743` |
| Self-Service Subscription Cancellation | Payments | Missing | Missing | Gap | Missing endpoint `/api/client/cancel-subscription` |
| Refund & Credit Note Management | Payments | Missing | N/A | Gap | Missing admin refund routes |

---

## 6. Prioritized Remediation Plan

### Priority 0: Critical Security & Integrity Fixes
1. **Enable RLS on `promo_codes` and Schema Tables**:
   Add an immediate migration enabling Row-Level Security on `promo_codes`, `social_drafts`, `tenants`, `documents`, `document_chunks`, and `vector_records`, restricting writes to service-role only.
2. **Protect Plaintext API Keys in `rag_tenants`**:
   Alter `rag_tenants` RLS policy or create a view so that `api_key` is not returned to standard `member` roles, or store only `api_key_hash` in `rag_tenants` while keeping raw keys in a dedicated vault table accessible only to workspace owners.
3. **Fix Scope Deposit Tenant Orphanage**:
   In `src/app/api/webhooks/razorpay/route.ts` (lines 281–352), insert a record into `rag_tenant_members` linking the client email as `owner` of the newly provisioned project tenant.

### Priority 1: High-Value Architecture & UX Enhancements
1. **Support Cookie-Based Sessions in `sessionVerify.ts`**:
   Update `sessionVerify.ts` to check both the `Authorization` header and Supabase SSR cookies (`@supabase/ssr` / `prateeq_active_user`) so requests from browser tabs without manual Bearer injection succeed.
2. **Implement Self-Service Subscription Cancellation**:
   Create `POST /api/client/cancel-razorpay-subscription` to allow users to cancel active recurring SaaS or Care Plan subscriptions directly from `/dashboard` or `/rag/app`.
3. **Multi-Workspace Selector**:
   Update `GET /api/rag/tenant` to return all memberships for a user and accept an optional `?tenantId=` query param to allow switching between workspaces.
