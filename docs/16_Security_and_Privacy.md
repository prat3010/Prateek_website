# **16. Security and Privacy**

## **Purpose**

The Security and Privacy specification defines policies that safeguard keys, secure database access, prevent web spam, and protect visitor identity. It ensures that the Adaptive Portfolio acts as a secure, trustworthy digital product.

---

# **Database Security & Row-Level Security (RLS)**

The Supabase database holds sensitive metrics and content. RLS is enforced across all tables to prevent public tampering:

* **Tables**: `page_visits`, `projects`, `skills`, `certificates`, `profile`.
* **Public Read**: Allowed via anonymous SELECT policies on static content tables (`projects`, `skills`, `certificates`, `profile`).
* **Public Write**: Strictly **disabled**. No public INSERT, UPDATE, or DELETE policies may exist.
* **Server Writes**: All telemetry logs (`page_visits`) and content updates are run server-side or via local scripts using the `SUPABASE_SERVICE_ROLE_KEY`. This key bypasses RLS policies securely.

---

# **Service Key Protection (Server-Only Bounds)**

The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) has full administrative privileges:
1. **Import Restraints**: The client bundle must never import the service key. The file `src/data/supabase.ts` explicitly starts with `import 'server-only'` and throws a runtime exception if referenced by a client-side component:
   ```typescript
   if (typeof window !== 'undefined') {
     throw new Error('Security Error: This database module can only be executed on the server.');
   }
   ```
2. **Key Audits**: Periodic codebase scans check that no references to process variables housing the service key exist inside component files under `src/components/`.

---

# **Contact Form & Email Security**

The contact form connects to the Resend API to dispatch notification emails:
* **Server-Side Route**: Next.js route handlers process form inputs server-side. The client app has no contact with the `RESEND_API_KEY`.
* **Input Sanitization**: Content received from contact inputs is sanitized and HTML-escaped before inclusion in the email template. This prevents cross-site scripting (XSS) and injection payloads.
* **Anti-Abuse Limits**: The route handler implements basic rate-limiting metrics (based on the anonymized visitor IP hash) to prevent bot spam or API flooding.

---

# **GDPR-Compliant Telemetry Privacy**

The proxy telemetry pipeline is structured around strict privacy boundaries:

### **1. Zero PII Storage**
* No raw IP addresses, precise coordinates, regional data, or personal details are logged.
* Geolocation extracts Vercel's `x-vercel-ip-country` header. Region and city trackers are discarded to prevent ISP-based tracking errors.

### **2. Cryptographic Daily Hashing**
* User IPs are anonymized using a cryptographically secure hash formula that combines IP, User-Agent, and a daily rotating salt:
  $$\text{Hash} = \text{SHA-256}(\text{IP} + \text{UA} + \text{rotatingDailySalt})$$
* Because the salt changes daily, logs cannot be reconstructed to track a user's cross-day activity, meeting GDPR erasure requirements.

### **3. Automatic Log Purging**
* Visited page logs are stored for exactly 90 days.
* Probabilistic pruning logic (`purge_old_page_visits()`) deletes expired rows automatically on inserts, ensuring the database remains free of stale data footprints.

---

# **Client Session Verification & Bearer Auth**

To secure the Client Workspace (`/dashboard`) and REST APIs (`/api/client/*`):
* **Supabase JWT Verification**: Endpoints require `Authorization: Bearer <token>` headers. The server verifies tokens via [`getVerifiedSessionEmail`](file:///Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts) against Supabase Auth API.
* **Server-Side PKCE OAuth Callback Handler**: OAuth returns are handled server-side via [`/auth/callback`](file:///Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts) using `@supabase/ssr`. It exchanges the PKCE code for a session (`exchangeCodeForSession`), sets HTTP-only `prateeq_active_user` session cookies, handles OAuth errors, and canonicalizes redirects back to `/dashboard`.
* **Email Scope Binding**: Client emails are derived strictly from the verified JWT payload, never from request body parameters. A client can read or modify only their own scopes (`client_scopes`) and invoices (`invoices`).
* **Unpaid Scope Deletion**: Deletion `/api/client/delete-scope` is restricted to unpaid scopes (`deposit_paid = false`). Paid scopes are immutable via client APIs.

---

# **Razorpay Payment Security & Signature Verification**

* **Server-Side Price Calculation**: Order costs are retrieved strictly from database scope records in `/api/client/create-razorpay-order`. Client inputs cannot alter the payment amount.
* **HMAC-SHA256 Signature Verification**: Both synchronous payment verification (`verify-razorpay-payment`) and asynchronous webhooks (`webhooks/razorpay`) compute cryptographic SHA-256 HMAC signatures using `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`. Unverified signatures return HTTP 400 Bad Request.
* **Webhook Idempotency**: Webhook events check `processed_webhooks` by `event_id` to prevent duplicate processing or replay attacks.

---

# **Automated AI Penetration Testing (Strix Framework)**

Dynamic vulnerability scanning and proof-of-concept (PoC) security validation are performed using [Strix](https://github.com/usestrix/strix) (`usestrix/strix`), an open-source autonomous AI penetration testing framework:

* **Execution Script**: [`scripts/security_audit_strix.sh`](file:///Users/prateeksharma/Developer/Prateek_website/scripts/security_audit_strix.sh)
* **Target Scope**: Local Next.js 16 App Router dev server (`http://localhost:3000`), public & auth-gated API endpoints (`/api/client/*`, `/api/contact`, `/api/terminal/*`), PKCE callback handlers (`/auth/callback`), telemetry proxy (`src/proxy.ts`), and static codebase (`src/`).
* **LLM Orchestration**: Strix autonomous multi-agent security teams utilize OpenRouter (`openrouter/anthropic/claude-3.5-sonnet` or configured model) via `OPENROUTER_API_KEY` / `LLM_API_KEY`.
* **Report Generation**: Execution logs and validated vulnerability proof-of-concepts are output to `./strix_runs/`.

---

# **RAG Guest API Key & Session Security**

* **Seeded Guest API Key**: Public RAG chat requests on `prateeq.in/rag` authenticate using a dedicated guest key (`ret_live_GuestAccessKey2026.ReadOnlyChat`) seeded in the backend `api_keys` database table under guest tenant `00000000-0000-0000-0000-000000000000`.
* **Request-Level Identity Caching**: Backend API security checks (`get_current_user`) cache resolved `UserContext` on `request.state` to eliminate redundant database queries per request and prevent external OIDC JWKS lookup timeouts.
* **Fast-Path Session Isolation**: Chat session creation (`/v1/tenants/{tenantId}/chat/sessions`) uses isolated UUID generation and fast-path fallback handling to protect guest tenant boundaries without exposing user directory table locks.

---

# **Acceptance Criteria**
- Supabase Row-Level Security (RLS) is enabled on all tables.
- Public write access remains disabled across the database.
- Server-side files throwing runtime errors are never imported client-side.
- Client endpoints derive identity strictly from verified session JWT bearer tokens.
- Razorpay payment orders derive amounts from DB records and require HMAC SHA-256 signature verification.
- Telemetry logs contain no raw IP addresses or precise coordinates.
- Contact route input validation and HTML escaping prevent script injections.
- Strix AI penetration testing script (`scripts/security_audit_strix.sh`) is configured for local dynamic & static security audits.
- RAG guest API keys are seeded in the database and security contexts are cached per request to prevent auth timeouts.

