# Handoff Report: Subsystems 6, 8, and 9 (Security & RLS, Tenant Provisioning, Payment & Invoicing)

**Author**: Explorer Survey 3  
**Working Directory**: `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/explorer_survey_3`  
**Date**: 2026-11-05  
**Handoff Type**: Hard (Investigation & Audit Complete)

---

## 1. Observation

### Subsystem 6: Security and Row-Level Security
1. **Unenforced RLS on Multiple Database Tables**:
   - `supabase/migrations/20260825_promo_codes.sql:2–14`:
     ```sql
     CREATE TABLE IF NOT EXISTS promo_codes (
         code VARCHAR(50) PRIMARY KEY,
         discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
         discount_value NUMERIC NOT NULL,
         currency VARCHAR(10) DEFAULT 'ALL',
         max_uses INTEGER DEFAULT NULL,
         used_count INTEGER DEFAULT 0,
         is_active BOOLEAN DEFAULT TRUE,
         expires_at TIMESTAMPTZ DEFAULT NULL,
         partner_id VARCHAR(100) DEFAULT NULL,
         created_at TIMESTAMPTZ DEFAULT NOW(),
         updated_at TIMESTAMPTZ DEFAULT NOW()
     );
     ```
     `ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;` is completely absent.
   - `supabase_schema.sql:879–933`:
     Tables `tenants`, `documents`, `document_chunks`, `vector_records`, and `social_drafts` have DDL definitions without `ENABLE ROW LEVEL SECURITY`.
2. **Plaintext API Key Storage and Exfiltration Risk**:
   - `supabase_schema.sql:424`:
     `api_key TEXT DEFAULT '',`
   - `supabase_schema.sql:454–461`:
     ```sql
     CREATE POLICY "Members can select matching rag_tenants" ON rag_tenants FOR SELECT
       USING (
         tenant_id IN (
           SELECT tenant_id FROM rag_tenant_members
           WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
         )
       );
     ```
     Any member with role `member` can execute `supabase.from('rag_tenants').select('*')` and retrieve the workspace's plaintext administrative API key.
3. **Session Verification Bearer-Only Requirement**:
   - `src/lib/sessionVerify.ts:11–13`:
     ```ts
     const authHeader = req.headers.get('authorization');
     const token = authHeader?.trim().replace(/^Bearer\s+/i, '');
     if (!token) return null;
     ```
     Cookies (`prateeq_active_user` and `@supabase/ssr` cookies) are not read.
4. **Service Role RLS Bypass**:
   - `src/data/supabase.ts:20–25`:
     ```ts
     export const supabase = (supabaseUrl && supabaseServiceKey)
       ? createClient(supabaseUrl, supabaseServiceKey, {
           auth: { persistSession: false },
         })
       : null;
     ```
     All Next.js API routes use this client, completely bypassing PostgreSQL RLS.

### Subsystem 8: Tenant Provisioning
1. **Scope Deposit Client Orphanage**:
   - `src/app/api/webhooks/razorpay/route.ts:285–345`:
     When a client pays a project scope deposit, `ensureRetrieverEngineTenant` is called, provisioning a new tenant and storing `provisionedTenantId` in `client_scopes.retriever_tenant_id`. However, no record is inserted into `rag_tenant_members` for the client email.
   - `src/app/api/rag/tenant/route.ts:18–24`:
     ```ts
     const { data: member } = await supabase
       .from('rag_tenant_members')
       .select('tenant_id, role, email')
       .or(`user_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
       .limit(1)
       .maybeSingle();
     ```
     Because the client has no entry in `rag_tenant_members`, navigating to `/rag/app` fails to find their project tenant and creates a new empty starter workspace.
2. **Synthetic API Key Fallback**:
   - `src/lib/retrieverProvision.ts:126–130`:
     ```ts
     if (!resolvedApiKey) {
       resolvedApiKey = `ret_live_${crypto.randomBytes(16).toString('hex')}`;
     }
     const apiKeyHash = crypto.createHash('sha256').update(resolvedApiKey).digest('hex');
     ```
     If the Retriever engine is offline or `ADMIN_MASTER_KEY` is missing, a random key is generated and saved in Supabase, but it is never added to the Retriever database's `api_keys` table. All future requests with this key fail with 401.
3. **Single Tenant Assumption in Route**:
   - `src/app/api/rag/tenant/route.ts:22`:
     `.limit(1).maybeSingle()` restricts users to only the first workspace they ever joined.

### Subsystem 9: Payment and Invoicing
1. **Timing-Safe Webhook Signature & Idempotency Ledger**:
   - `src/app/api/webhooks/razorpay/route.ts:28–36`:
     ```ts
     const expectedSignature = crypto
       .createHmac('sha256', WEBHOOK_SECRET)
       .update(rawBody)
       .digest('hex');
     if (expectedSignature.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) ...
     ```
   - `src/app/api/webhooks/razorpay/route.ts:58–69`:
     ```ts
     const { error: idempotencyError } = await supabase.from('processed_webhooks').insert({
       event_id: eventId,
       event_type: event,
       processed_at: new Date().toISOString(),
     });
     if (idempotencyError && idempotencyError.code === '23505') {
       return NextResponse.json({ status: 'ok', duplicate: true });
     }
     ```
2. **Canonical Anti-Tamper Quoting**:
   - `src/app/api/client/create-razorpay-order/route.ts:302–320`:
     Calls `recalculateCanonicalScopeQuote` and overrides client-supplied figures with canonical totals.
3. **Production 202 Deferral to Webhook**:
   - `src/app/api/client/verify-razorpay-payment/route.ts:306–309`:
     In production, the route does not mutate the commercial ledger; it responds with 202 Accepted and relies solely on the signed Razorpay webhook.
4. **Missing Self-Service Subscription Cancellation**:
   - No route exists in `src/app/api/client/` to cancel active Razorpay subscriptions (`sub_...`).

---

## 2. Logic Chain

1. **Observation 1.1** shows that `promo_codes` was created without `ENABLE ROW LEVEL SECURITY`.  
   → In PostgreSQL, tables without RLS permit full read/write access to roles with default schema grants (`anon` and `authenticated`).  
   → Therefore, unauthenticated anonymous users can view all promotional codes, partner tracking IDs, and discount rules.

2. **Observation 1.2** shows `rag_tenants.api_key` stores plaintext keys, and the RLS policy permits any workspace member to SELECT from `rag_tenants`.  
   → Anyone invited to a workspace as a standard `member` can extract the administrative `ret_live_...` key.  
   → With this key, that member can bypass application permission boundaries on the Retriever backend.

3. **Observation 1.3** shows `sessionVerify.ts` inspects only `req.headers.get('authorization')`.  
   → If a user's browser authenticates using HTTP cookies without attaching the Bearer header in JavaScript fetch calls, the request is rejected with 401 Unauthorized.

4. **Observation 1.4 & 2.1** show that the deposit webhook captures scope payments, provisions a Retriever tenant, and updates `client_scopes.retriever_tenant_id`, but does NOT insert a record into `rag_tenant_members`.  
   → When that client visits `/rag/app`, `GET /api/rag/tenant` checks `rag_tenant_members` by user email and finds no records.  
   → It falls back to bootstrapping a new Starter workspace, leaving the provisioned project workspace (and the indexed SOW document) unreachable.

5. **Observation 2.2** shows that synthetic API keys generated when the OCI backend is unavailable are saved to Supabase without being inserted into Retriever's `api_keys` table.  
   → Subsequent requests to Retriever will fail authentication.

6. **Observation 3.1 & 3.2** confirm that order creation recalculates canonical prices, webhooks verify HMAC signatures using timing-safe comparisons, and `processed_webhooks` enforces unique event IDs to prevent duplicate processing.  
   → The core payment rail is secure and resilient against replay attacks and client tampering.

---

## 3. Caveats

- **OCI Database Live Verification**: Inspection was performed on local code files and Alembic migrations. Direct SQL queries against the live Oracle Cloud VPS PostgreSQL instance (`130.210.35.134`) were not executed.
- **Supabase Live Database Extensions**: Did not execute direct SQL against the live Supabase database instance to inspect whether manual `ALTER TABLE ENABLE ROW LEVEL SECURITY` statements were applied out-of-band on `promo_codes`.
- **Payment Gateway Testing**: Live credit card transactions were not submitted to Razorpay's production gateway.

---

## 4. Conclusion

The security, provisioning, and payment subsystems demonstrate robust cryptographic foundations in token verification, anti-tampering quote calculation, timing-safe webhook authentication, and idempotency tracking.

However, three critical vulnerabilities require immediate remediation:
1. **Critical Security**: `promo_codes` lacks Row-Level Security in Supabase, and `rag_tenants` exposes plaintext administrative API keys to all workspace members.
2. **Critical Functional Defect**: Scope deposit payments provision an engine workspace but fail to grant the paying client membership in `rag_tenant_members`, permanently orphaning project tenants.
3. **UX / Self-Service Gap**: Clients have no mechanism to cancel recurring subscriptions or switch between multiple workspaces.

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Missing RLS on `promo_codes`**:
   Inspect `supabase/migrations/20260825_promo_codes.sql`:
   ```bash
   grep -i "row level security" supabase/migrations/20260825_promo_codes.sql
   ```
   *Expected result*: No matches found (confirming RLS is missing).

2. **Verify Plaintext API Key in `rag_tenants`**:
   Inspect `supabase_schema.sql` lines 424 and 454–461:
   ```bash
   sed -n '424p;454,461p' supabase_schema.sql
   ```
   *Expected result*: Column `api_key TEXT` is present, and SELECT policy permits any tenant member to read all columns.

3. **Verify Scope Deposit Tenant Orphanage**:
   Inspect `src/app/api/webhooks/razorpay/route.ts` lines 281–345:
   ```bash
   grep -n "rag_tenant_members" src/app/api/webhooks/razorpay/route.ts
   ```
   *Expected result*: `rag_tenant_members` is only referenced in the subscription handling block (lines 591, 637, 680), and is absent from the scope deposit block (lines 281–352).

4. **Verify Session Verification Bearer Header Exclusivity**:
   Inspect `src/lib/sessionVerify.ts` lines 9–14:
   ```bash
   sed -n '9,14p' src/lib/sessionVerify.ts
   ```
   *Expected result*: Only `req.headers.get('authorization')` is checked.

5. **Run Existing Test Suite for Regressions**:
   ```bash
   npm test src/app/api/__tests__/razorpay.test.ts src/app/api/__tests__/rag-tenant.test.ts
   ```
