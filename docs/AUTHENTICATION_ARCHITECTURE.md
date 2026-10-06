---
id: Prateek_Website_Authentication_Architecture
title: "Authentication Architecture & Connection Blueprint"
category: architecture
platform: prateek_website
tier: 4_api_gateway
status: authoritative
tags:
  - security/auth
  - auth/oauth-pkce
  - security/supabase
  - architecture/dual-storage
---

# Authentication Architecture & Connection Blueprint

> **Authoritative guide on how authentication is connected across the Prateek Sharma Engineering Platform (`prateeq.in`), including Google OAuth PKCE flows, Safari ITP dual-storage persistence, server-side session verification, protected API gating, and Retriever AI integration.**

---

## 1. System Identity Topology

`prateeq.in` serves as the central identity control plane. One unified Google OAuth login connects four distinct user contexts:
1. **Public Prospects & Scoping Clients** (`/scoping` → `/dashboard`): Design, configure, and save custom software scopes with 1-click Fast Pass.
2. **Paying Clients & Escrow Ledgers** (`/dashboard`): Review active milestones, sign digital SOWs, track change orders, settle Razorpay invoices.
3. **Master Platform Operator** (`/admin`): Access autonomous outreach queues, prospect dispatchers, and administrative controls.
4. **Retriever AI Cognitive SaaS Studio** (`/rag`, `/rag/app`): Access vector workspaces, upload documents, inspect semantic search, and configure embed scripts.

```text
                                [ User Browser ]
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │ 1. 1-Click Google OAuth (Supabase Auth PKCE Flow)   │
            ▼                                                     ▼
   [ Client-Side State ]                                 [ Next.js 16 SSR ]
   AuthContext.tsx                                       src/app/auth/callback/route.ts
   ├── Universal Dual Storage                            ├── exchangeCodeForSession()
   │   • localStorage ('prateeq_active_user')           ├── Set HTTP-only Cookie
   │   • Lax Cookie ('prateeq_active_user')              ├── Send Resend Admin Alert
   ├── Direct Hash Parser (#access_token)                └── Redirect to Deep-Link (?next=)
   └── Fresh-Token Resolver (getAccessToken)                      │
            │                                                     ▼
            │ Authorization: Bearer <access_token>       [ Supabase Auth & DB ]
            ▼                                            ├── Cryptographic JWT Verification
   [ Gated API Routes (/api/client/*) ]                  └── Postgres Row-Level Security (RLS)
   src/lib/sessionVerify.ts                              (auth.jwt() ->> 'email' = client_email)
   └── Derives verified client_email
            │
            ├─────────────────────────────────────────────┐
            ▼                                             ▼
   [ Client Workspace & Escrow ]                 [ Retriever SaaS Engine ]
   • /dashboard Scope Sync & Persistence         • https://rag.prateeq.in
   • Razorpay 50% Deposit Billing                • 7-Day Trial Provisioning
   • Invoices with Inclusive GST                 • Tenant Isolation (Postgres RLS)
```

---

## 2. Layer 1: Client Auth State & Safari ITP Resilience

### The Safari ITP Challenge (ADR 13)
Safari's **Intelligent Tracking Prevention (ITP)** aggressively purges cross-site `localStorage` writes following external OAuth redirects (e.g. returning from `accounts.google.com` via Supabase Auth). Relying solely on `localStorage` causes sessions to drop when returning to the dashboard.

### Universal Dual-Storage Adapter (`src/lib/auth.ts`)
To achieve 100% session persistence across iOS, macOS Safari, Chrome, and Firefox, Supabase Auth is initialized with a custom dual-storage adapter:
- Writes tokens simultaneously to `localStorage` AND a root-level HTTP cookie (`prateeq_active_user`, `SameSite=Lax`, `path=/`, `maxAge=30 days`).
- If Safari clears `localStorage`, the cookie fallback hydrates the session immediately without layout shifts or unauthenticated flashes.

### Direct Hash Fragment Token Parser (`src/context/AuthContext.tsx`)
When Supabase Auth redirects with a token hash (`#access_token=...&refresh_token=...`):
1. `AuthContext` synchronously parses the fragment using `URLSearchParams(window.location.hash.substring(1))`.
2. Calls `supabaseAuth.auth.setSession(...)` immediately on mount.
3. Decodes the authentic payload (`email`, `user_metadata`).
4. Updates React state and persists the user to storage.
5. **Surgically cleans the URL**: Preserves all custom search parameters (`imported=true`, `scopeCode=...`) while stripping only the hash fragment and `code` parameters:
   ```typescript
   const cleanUrl = new URL(window.location.href);
   cleanUrl.searchParams.delete('code');
   window.history.replaceState(null, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
   ```

### Fresh-Token Resolution (`getAccessToken()`)
To prevent expired token errors on long-lived dashboard tabs (ADR 15):
- `useAuth()` exports `getAccessToken(): Promise<string | null>`.
- Checks the current session JWT expiration claim (`exp`).
- If expiring within 60 seconds, it calls `supabaseAuth.auth.refreshSession()` before returning the active token.
- Dashboard API requests await `getAccessToken()` at call time instead of borrowing stale React state.

---

## 3. Layer 2: Server-Side PKCE OAuth Callback (`src/app/auth/callback/route.ts`)

When Google OAuth redirects to the server-side callback:
```text
GET https://prateeq.in/auth/callback?code=...&next=/dashboard?imported=true
```

The route handler executes the following sequential steps:

1. **Origin Canonicalization:** Strips any unintended `www.` subdomain to match the production Supabase redirect whitelist.
2. **OAuth Code Exchange:** Initializes `@supabase/ssr` server client and executes:
   ```typescript
   const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
   ```
3. **Role Gating & Redirect Target Resolution:**
   - Reads the `?next=` parameter (defaults to `/dashboard`).
   - If the verified user matches administrative credentials (`isAdminEmail(user.email)`), they are redirected to `/admin`.
   - Otherwise, the user is redirected to their intended destination (e.g. `/dashboard?imported=true&scopeCode=...`).
4. **Session Cookie Issuance:** Writes the `prateeq_active_user` cookie for server-side middleware and layout checks.
5. **Asynchronous Admin Notification:** Fires `sendAdminSignupNotification(...)` via Resend to notify platform administrators of new client registrations.
6. **Error Forwarding:** If code exchange fails (e.g., expired token or user cancellation), redirects to `${destinationPath}?error=${encodeURIComponent(exchangeErr.message)}` rather than dropping the user onto a silent unauthenticated screen.

---

## 4. Layer 3: Server Session Verification & Protected APIs (`src/lib/sessionVerify.ts`)

All client mutation and retrieval routes under `/api/client/*` are session-gated:

```typescript
// Example: src/app/api/client/save-scope/route.ts
export async function POST(req: NextRequest) {
  const verifiedEmail = await getVerifiedSessionEmail(req);
  if (!verifiedEmail) {
    return NextResponse.json({ error: 'Unauthorized: Valid Supabase session required.' }, { status: 401 });
  }
  // verifiedEmail is derived strictly from the cryptographically verified JWT
  ...
}
```

### Key Security Invariants (`src/lib/sessionVerify.ts`)
1. **Bearer Header Extraction:** Extracts token from `Authorization: Bearer <access_token>`.
2. **Cryptographic Validation:** Calls `supabase.auth.getUser(token)` against the Supabase Auth server.
3. **Strict Email Scope Binding:** The client's email is derived **exclusively** from `user.email` in the verified JWT payload. Any email provided in the JSON request body or URL parameters is strictly ignored.
4. **Zero Horizontal Privilege Escalation (IDOR Prevention):** A user can only fetch, save, or delete scopes where `client_email = verifiedEmail`.
5. **Unpaid Scope Deletion Only:** `/api/client/delete-scope` restricts deletions to unpaid scopes (`deposit_paid = false`). Paid scopes are immutable via client-facing APIs.

---

## 5. Layer 4: Project Scoping & 1-Click Fast Pass Handover

The journey from prospective visitor to paying client is seamless:

```text
[/scoping Discovery Wizard]
       │
       │ 1. User configures Engine, Features & Brand Kit
       │ 2. Clicks "1-CLICK GOOGLE FAST-PASS"
       │
       ├── Saves draft scope to localStorage ('prateeq_pending_scope')
       ├── Disables button (submitting = true) to prevent double-click redirects
       │
       ▼
[Google OAuth PKCE Flow]
       │
       ▼
[/auth/callback Server Handler]
       │
       │ Redirects to /dashboard?imported=true&scopeCode=...
       ▼
[/dashboard Client Workspace]
       │
       ├── AuthContext cleans auth parameters, preserving imported=true
       ├── useDashboardScopes hydrates draft scope from storage/URL
       ├── Automatically saves scope to Supabase DB via saveScopeToDatabase()
       │
       ▼
[Confirm & Pay 50% Deposit]
       │
       ├── Awaits saveScopeToDatabase() to ensure DB record exists
       ├── Calls /api/client/create-razorpay-order
       ├── Creates invoice record with tax_type: 'inclusive' (preventing 18% GST overcharge)
       ├── Launches Razorpay Checkout modal
       └── modal.ondismiss resets loading states gracefully on close
```

---

## 6. Layer 5: Connection to Retriever AI SaaS (`https://rag.prateeq.in`)

Identity state connects `prateeq.in` to the Retriever Cognitive Engine:

1. **Dual Account SSO:** An authenticated session on `prateeq.in` authorizes the user to access both their custom engineering workspace (`/dashboard`) and the RAG SaaS App Studio (`/rag/app`).
2. **Automatic 7-Day Trial Provisioning:** When a client completes their scope and signs in, the platform provisions a dedicated tenant (`tn_client_<uuid>`) on Retriever with an automatic 7-day trial.
3. **Immutable SOW Grounding:** The agreed architecture, features, and milestones are compiled into an immutable system document (`is_system: true`, `is_deletable: false`) indexed into their Retriever tenant. This pre-grounds their dashboard AI Copilot on the exact project specifications.
4. **Public Guest Chat Mode:** For unauthenticated visitors exploring the interactive RAG sandbox on `/rag`, requests use a dedicated, rate-limited guest key (`ret_live_GuestAccessKey2026.ReadOnlyChat`) seeded in the backend `api_keys` table.

---

## 7. Environment Variables Reference

| Variable | Scope | Purpose |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Public Supabase endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Anonymous key for client-side Auth operations |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged key bypassing RLS for telemetry and sync tooling |
| `RESEND_API_KEY` | Server-Only | Sends admin notifications on new Google OAuth registrations |
| `CONTACT_EMAIL_TO` | Server-Only | Recipient email for admin registration and contact alerts |
| `RAZORPAY_KEY_ID` | Client + Server | Public Key ID for standard checkout modal |
| `RAZORPAY_KEY_SECRET` | Server-Only | HMAC-SHA256 signature verification key for payments |

---

## 8. Verification & Testing Checklist

- **Unit Tests:** `npm test` runs 74 test suites (510+ tests), including `src/lib/__tests__/security.test.ts` which asserts token gating, email extraction, and permission boundaries.
- **Type Safety:** `npx tsc --noEmit` verifies strict TypeScript typing across all session payloads.
- **Linting:** `npm run lint` ensures zero unused imports or styling anti-patterns.
- **Automated Security Verification:** `./scripts/verify.sh` runs credential leak detection, portal containment safety, and zero-mock verification.
