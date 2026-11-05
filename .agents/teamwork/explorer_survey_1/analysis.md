# Subsystem Deep-Dive Audit: Auth, Emails & Profile Management
**Audit Date**: November 2026  
**Auditor**: Explorer 1 (Auth and Profile Explorer)  
**Target Codebase**: `Prateek_website` (Next.js 16 App Router, React 19, Supabase Auth/DB, Resend API)  
**Scope**: Subsystem 1 (User Signup & Authentication), Subsystem 4 (Welcome & Transaction Emails), Subsystem 7 (Profile Management)

---

## Executive Summary

This audit performs an architectural and source-code investigation of user account creation, lifecycle communications, and client profile management across `Prateek_website`. 

Key findings across the three evaluated subsystems:
1. **Subsystem 1 (Signup & Auth)**: Production-grade Google OAuth and passwordless Magic Link flows are implemented with robust Safari ITP-safe chunked cookie persistence (`universalStorage`), PKCE verification, and token auto-refresh. However, **Email/Password authentication is completely absent**, and there is **no administrative user directory** in `/admin`.
2. **Subsystem 4 (Welcome & Transaction Emails)**: Transactional receipts (milestone payments, balance settlements, change order updates, SaaS subscriptions, stage advancements) are implemented via Resend with dark-mode/azure HTML templates. However, **there is NO user welcome email upon registration**, **no auto-reply/receipt for contact form submissions**, and **no database audit ledger for email delivery tracking**.
3. **Subsystem 7 (Profile Management)**: Client profile creation is deferred and decoupled—there is **no database trigger or callback action syncing `auth.users` to `clients` upon signup**. A `clients` record is only created when a user saves a scope. Additionally, a **schema mismatch bug** in subscription routes (`name` vs `full_name`, non-existent `notes` column) silently fails client upserts on SaaS checkouts, and **users have no UI to manage billing addresses, tax IDs, or company details outside of scope onboarding**.

---

# Subsystem 1: User Signup & Authentication

### 1.1 Architecture & Implementation Blueprint
Authentication is built on Supabase Auth leveraging `@supabase/ssr` on the server and a browser client with fallback token exchange mechanisms on the client.

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW MAP                              │
└────────────────────────────────────────────────────────────────────────────────┘
 [Client: /login or /dashboard]
        │
        ├──> signInWithGoogle(redirectTo) ────> Google OAuth 2.0 (Prompt: select_account)
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

### 1.2 Exact Code & Schema References

| Component | File Path | Lines | Key Functions / Entities |
| :--- | :--- | :--- | :--- |
| **Auth Callback Route** | `src/app/auth/callback/route.ts` | 8–114 | `GET(request: Request)`: Handles PKCE exchange, OTP verification, cookie setting, admin signup alert trigger, session stitching, and admin path routing. |
| **Auth Client Utilities** | `src/lib/auth.ts` | 7–15 | `ADMIN_EMAILS`, `isAdminEmail(email)`: Hardcoded admin email array (`3010prateeksharma@gmail.com`, `prateeqsharma@gmail.com`). |
| **Universal Storage Adapter** | `src/lib/auth.ts` | 18–97 | `universalStorage`: Dual LocalStorage + document.cookie chunking adapter (3000 byte chunks: `${key}_chunks`, `${key}_chunk_${i}`, 30-day max age, SameSite=Lax). |
| **Client Auth Initiators** | `src/lib/auth.ts` | 105–174 | `signInWithGoogle()`, `signOut()`, `signInWithMagicLink()`: Supabase auth triggers. |
| **Auth Context Provider** | `src/context/AuthContext.tsx` | 50–295 | `AuthProvider`, `useAuth()`: Hydrates `prateeq_active_user`, listens to `onAuthStateChange`, executes client fallback PKCE / hash token exchange. |
| **JWT Expiration & Auto-Refresh** | `src/context/AuthContext.tsx` | 32–48, 252–278 | `isJwtExpired()`, `getAccessToken()`: Decodes JWT payload, refreshes session via `refreshSession()` if expired before API calls. |
| **Unified Login Page** | `src/app/login/page.tsx` | 10–166 | `LoginPage`: Unified UI for Google OAuth and passwordless magic link dispatch. |
| **Retriever Login Redirector** | `src/app/rag/login/page.tsx` | 18–20 | `useEffect`: Forwards `/rag/login` immediately to `/login?context=rag&redirect_to=/rag/app`. |
| **Server Supabase SSR Client** | `src/lib/supabase/server.ts` | 8–28 | `createClient()`: Server-side `@supabase/ssr` `createServerClient` reading/writing cookies via Next.js `cookies()`. |
| **Proxy Middleware Check** | `src/proxy.ts` | 22–32 | Edge middleware inspecting `prateeq_active_user`, `sb-access-token`, or `*-auth-token` cookies to populate `x-user-authenticated` header. |
| **Bearer Session Verification** | `src/lib/sessionVerify.ts` | 9–25, 31–47 | `getVerifiedSessionEmail()`, `getVerifiedSessionUser()`: Cryptographically validates Bearer token on protected API routes via `supabase.auth.getUser(token)`. |

### 1.3 Confirmed Capabilities
1. **Google OAuth (PKCE Flow)**: Supports full PKCE flow with `access_type: 'offline'` and `prompt: 'select_account'` ensuring consent and refresh token generation. Origin normalization (`www.prateeq.in` -> `prateeq.in`) prevents cross-domain cookie stripping.
2. **Passwordless Magic Link**: Allows email-only authentication via Supabase `signInWithOtp()`, verified securely on the server via `token_hash` and `type=email`.
3. **Safari ITP-Resilient Session Storage**: `universalStorage` splits large cookie payloads into 3000-byte chunks (`_chunk_0`, `_chunk_1`), preventing the 4096-byte mobile Safari cookie truncation bug.
4. **Token Expiration Prevention**: `getAccessToken()` dynamically inspects JWT `exp` claims and triggers `supabaseAuth.auth.refreshSession` before sending requests to protected `/api/client/*` endpoints.
5. **Session Stitching Trigger**: On auth callback, any anonymous session ID (`prateeq_chat_session_id`, `prateeq_draft_token`, `prateeq_pending_scope_code`) is stitched to the verified email in `scoping_chat_traces` and `intake_leads`.
6. **Admin Routing Protection**: If an authenticated email matches `ADMIN_EMAILS`, callback redirects them to `/admin` instead of `/dashboard` (unless explicit query params are present).

### 1.4 Missing Gaps by Persona

#### Admin Persona Gaps:
- **No User Management Console**: The `/admin` dashboard has tabs for Prospects, Clients (Scopes), Subscribers (RAG), and Leads, but **ZERO interface to list, inspect, search, or ban user accounts from `auth.users`**.
- **Hardcoded Admin Access**: Admin privileges are hardcoded in an in-memory array in `src/lib/auth.ts:7-10`. There is no database-backed role-based access control (RBAC), team permission system, or admin invitation mechanism.
- **No Account Impersonation / "Login As"**: Admin cannot securely inspect a client's workspace dashboard without client credentials or manipulating URL preview query flags (`?preview=client`).

#### User Persona Gaps:
- **Email & Password Authentication Absent**: Neither `signUp` nor `signInWithPassword` is implemented in UI or backend. Users in enterprise environments where corporate mail gateways intercept magic link tokens have no password alternative.
- **No Self-Service Account Deletion**: Users cannot delete their account, revoke sessions across other devices, or download an export of their stored data (GDPR / CCPA gap).
- **No MFA / 2FA / WebAuthn Configuration**: No multi-factor authentication (TOTP or Passkeys) is supported in the frontend auth flow.
- **Client-Only Logout**: `handleLogout` removes cookies and calls `supabaseAuth.auth.signOut()` client-side, but does not invoke a dedicated server endpoint (`/api/auth/signout`) to guarantee server-side cookie deletion or token revocation on edge proxies.

### 1.5 Failure Modes & Edge Cases
- **Admin Alert Spam on Routine Logins**: `src/app/auth/callback/route.ts:63` calls `sendAdminSignupNotification` whenever `exchangeCodeForSession` or `verifyOtp` succeeds. It does **not** check whether `user.created_at` matches current time or whether a user profile already exists. Consequently, the admin receives a "New User Sign-Up Alert" email on **every single login** by returning users.
- **Uncaught Fire-and-Forget Callback Errors**: `sendAdminSignupNotification` and `stitchAnonymousSession` run asynchronously in `route.ts` with `.catch(console.warn)`. If an error occurs, the callback succeeds silently, leaving traces unstitched and alerts dropped with no audit trail.
- **Duplicate Account Linking Errors**: If a user previously logged in via Magic Link and later logs in with Google OAuth using the same email (or vice versa), Supabase Auth throws an identity collision error if automatic account linking is disabled in project settings. The callback forwards `?error=OAuth+authentication+failed`, but `/login` does not guide the user to resolve the conflict.

---

# Subsystem 4: Welcome & Transaction Emails

### 2.1 Architecture & Implementation Blueprint
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
       ├──> Scoping Intake Lead (/scoping) ────────────────> Admin Alert ONLY (sendAdminIntakeLeadNotification)
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

### 2.2 Exact Code & Schema References

| Email Function | Source File & Line | Trigger Route / Context | Recipient | Subject / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `sendAdminSignupNotification` | `src/lib/emailNotification.ts:37` | `src/app/auth/callback/route.ts:63` | Admin (`CONTACT_EMAIL_TO`) | `🔔 New User Sign-Up Alert: {email}` |
| `sendAdminIntakeLeadNotification` | `src/lib/emailNotification.ts:118` | `src/app/api/client/intake-draft/route.ts` | Admin (`CONTACT_EMAIL_TO`) | `🎯 New Intake Lead: {company} ({scopeCode})` |
| `sendAdminScopeSavedNotification` | `src/lib/emailNotification.ts:180` | `src/app/api/client/save-scope/route.ts:281` | Admin (`CONTACT_EMAIL_TO`) | `⚡ Client Scope Confirmed: {company} ({scopeCode})` |
| `sendPaymentConfirmationNotifications` | `src/lib/emailNotification.ts:235` | `src/app/api/webhooks/razorpay/route.ts:356` | **Dual**: Admin + Client (`clientEmail`) | Admin: `💰 Payment Received` / Client: `✅ Payment Receipt ({amount})` |
| `sendAdminChangeOrderNotification` | `src/lib/emailNotification.ts:334` | `src/app/api/client/change-orders/route.ts` | Admin (`CONTACT_EMAIL_TO`) | `🔄 Change Order Submitted: {coNumber} ({company})` |
| `sendAdminOnboardingCompletedNotification` | `src/lib/emailNotification.ts:382` | `src/app/api/client/save-scope/route.ts:266` | Admin (`CONTACT_EMAIL_TO`) | `✅ Onboarding Checklist 100% Complete: {company}` |
| `sendRetrieverSubscriptionNotifications` | `src/lib/emailNotification.ts:433` | `src/app/api/webhooks/razorpay/route.ts:727` | **Dual**: Admin + Subscriber (`subscriberEmail`) | Admin: `⚡ Subscription Activated` / User: `⚡ Your Retriever Workspace is Live` |
| `sendClientMilestoneStageAdvancedNotification` | `src/lib/emailNotification.ts:529` | `src/app/api/client/save-scope/route.ts:301` | Client (`clientEmail`) | `🚀 Engineering Sprint Started` / `👀 Staging Preview Ready` / `🎉 Production Live` |
| `sendClientChangeOrderUpdateNotification` | `src/lib/emailNotification.ts:690` | `src/app/admin/page.tsx:328` via API | Client (`clientEmail`) | `✅ Change Order Approved` / `⚠️ Declined` / `🎉 Settled` |
| `sendFinalBalanceSettlementNotifications` | `src/lib/emailNotification.ts:808` | `src/app/api/webhooks/razorpay/route.ts:382` | **Dual**: Admin + Client (`clientEmail`) | Admin: `🏆 Full Balance Settled — Handover Due` / Client: `🏆 Project Fully Settled & Handover Complete` |
| `sendHotLeadAlertNotification` | `src/lib/emailNotification.ts:985` | `src/lib/scopingObservability.ts:100` | Admin (`CONTACT_EMAIL_TO`) | `🔥 HOT SCOPING LEAD: {quote}` / `🚨 ESCROW ESCALATION` |
| `POST /api/contact` | `src/app/api/contact/route.ts:138` | Contact form submission | Admin (`CONTACT_EMAIL_TO`) | `New Portfolio Signal from {name}` (with PDF attachment) |
| `POST /api/rag/invite` | `src/app/api/rag/invite/route.ts:101` | Workspace member invitation | Invitee (`inviteeEmail`) | `You've been invited to join an RAG SaaS Workspace` |
| `POST /api/admin/draft-pitch` | `src/app/api/admin/draft-pitch/route.ts:117` | Manual admin proposal dispatch | Prospect (`contact_email`) | Custom subject generated by Gemini AI |

### 2.3 Confirmed Capabilities
1. **Comprehensive Commercial Lifecycle Receipts**: Every financial transaction (deposit payment, retainer subscription, change order fee, final balance settlement) sends automated, branded receipts to clients with currency formatting (`INR` vs `USD`), transaction IDs, milestone summaries, and next-step links.
2. **Automated Stage Progression Alerts**: When admin updates a project's `delivery_stage` to `engineering`, `staging`, or `live`, the client receives stage-tailored emails with live staging URLs, GitHub repository links, and production links.
3. **Escrow & Hot Lead Telemetry Alerts**: Real-time evaluation in `scopingObservability.ts` triggers immediate executive alert emails when an anonymous visitor interacts with high-value architecture scopes (≥ $2,500 / ₹2,00,000) or triggers escrow queries.
4. **HTML & URL Sanitization**: All email templates strictly sanitize inputs with `escapeHtml()` and validate URLs using `sanitizeUrl()`, mitigating email-based XSS or HTML injection.
5. **Webhook Idempotency Protection**: Webhook-triggered emails check `processed_webhooks` table before processing, preventing duplicate emails on Razorpay webhook retries.

### 2.4 Missing Gaps by Persona

#### Admin Persona Gaps:
- **No Email Audit & Delivery Ledger**: There is **no database table (e.g. `email_logs`, `notification_history`)** storing dispatched emails, Resend message IDs, timestamps, or delivery statuses. If an email fails or bounces, admin has no way to see it in `/admin`.
- **No Webhook for Email Bounces / Drops**: Resend webhooks are not configured. Bounces, spam complaints, and invalid addresses fail silently.
- **Hardcoded Fallback Admin Email**: `getResendClient()` in `emailNotification.ts:7` falls back to `3010prateeksharma@gmail.com` if `CONTACT_EMAIL_TO` is not set in `.env.local`.

#### User Persona Gaps:
- **MISSING USER WELCOME EMAIL**: When a new user registers or signs in via Google OAuth or Magic Link, **no welcome email is sent to the user**. Only the admin gets an alert. The user receives zero introductory communication or workspace walkthrough.
- **MISSING CONTACT FORM AUTO-REPLY**: When a visitor submits the contact form (`/api/contact`), an email is sent to Prateek, but **no confirmation receipt is emailed back to the visitor**.
- **MISSING SCOPING INTAKE CONFIRMATION**: When a prospect submits a scoping questionnaire or generates a blueprint on `/scoping`, an admin alert is sent, but **no copy or link is emailed to the prospect**.
- **No Unsubscribe / Preference Management**: Users have no UI in `/dashboard` to manage email notification preferences.

### 2.5 Failure Modes & Edge Cases
- **Silent Degradation on Missing API Key**: When `RESEND_API_KEY` is missing or invalid, all functions return `false` or log `console.warn`. No error is thrown and no fallback logging exists in the database.
- **Unauthenticated Placeholder Email Hazards**: Intake leads generated anonymously use placeholder emails (`lead@unauthenticated.client`). While `draft-pitch/route.ts` guards against this, other routes calling `clientEmail` directly must guard against attempting to deliver to fake placeholder domains.
- **Resend Rate-Limit Exhaustion**: Resend free/standard tiers enforce a rate limit of 10 requests per second. Simultaneous webhooks or batch notifications could fail with HTTP 429 without exponential backoff or retry queues.

---

# Subsystem 7: Profile Management

### 3.1 Architecture & Implementation Blueprint
User identity and client profiles are bifurcated between Supabase Auth (`auth.users`) and the application schema (`clients` table).

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

### 3.2 Exact Code & Schema References

| Component | File Path | Lines | Key Details |
| :--- | :--- | :--- | :--- |
| **`clients` Table Definition** | `supabase_schema.sql` | 206–224 | Columns: `id` (UUID PK), `email` (TEXT UNIQUE), `full_name`, `company_name`, `phone`, `tax_id_gst`, `country`, `created_at`, `updated_at`. |
| **`clients` RLS Policy** | `supabase_schema.sql` | 218–222 | `FOR SELECT USING (auth.jwt() ->> 'email' = email)`. Direct public writes are blocked. |
| **Scope Client Upsert** | `src/app/api/client/save-scope/route.ts` | 74–109 | Upserts `clients` record (`company_name`, `phone`) when saving a scope. |
| **Client Scopes Fetch** | `src/app/api/client/get-scopes/route.ts` | 24–36 | Selects scopes from `client_scopes` matching `client_email`. |
| **Client Invoices Fetch** | `src/app/api/client/get-invoices/route.ts` | 18–36 | Looks up `clients.id` by email, then queries `invoices` matching `customer_email` OR `client_id`. |
| **Admin Invoice Creation** | `src/app/api/client/create-razorpay-invoice/route.ts` | 85–96, 147–156 | Admin sets `customer_name`, `customer_email`, `customer_phone`, `customer_gstin`, `billing_address`, `shipping_address`, and `place_of_supply`. |
| **Subscription Client Upsert** | `src/app/api/client/verify-razorpay-subscription/route.ts` | 201–223 | Upserts `clients` record upon SaaS subscription activation. |
| **Webhook Client Upsert** | `src/app/api/webhooks/razorpay/route.ts` | 550–574 | Upserts `clients` record upon subscription payment event. |
| **Client Organization UI** | `src/components/ClientDashboard/OnboardingChecklistWidget.tsx` | 102–118, 167–205 | Client inputs for Company / Project Name and Contact Phone. |
| **Workspace Header UI** | `src/app/dashboard/page.tsx` | 1054–1073 | Displays user avatar (`avatar_url`), full name (`full_name`), and email from `user.user_metadata`. |
| **Admin Clients View** | `src/app/admin/page.tsx` | 248–261, 780–820 | Displays scopes from `client_scopes` via `/api/client/get-scopes?all=true`. |

### 3.3 Confirmed Capabilities
1. **Deferred Client Entity Creation**: When an authenticated user saves a scope via `/api/client/save-scope`, the server automatically creates or updates their record in `clients` with `company_name` and `phone`, linking `client_scopes.client_id`.
2. **Client Organization Detail Editing**: In the Dashboard's Onboarding tab (`OnboardingChecklistWidget.tsx`), the user can update their Company Name and Contact Phone. Clicking "Save Profile" persists changes to both `client_scopes` and `clients`.
3. **RLS Data Isolation**: The `clients` table is secured via Supabase RLS so authenticated clients can only view their own record (`auth.jwt() ->> 'email' = email`). Public writes are forbidden.
4. **Dual Mapping on Invoices**: `/api/client/get-invoices` resolves invoices matching either `customer_email = clientEmail` OR `client_id = client.id`, preventing invoice detachment if an email format varies slightly.

### 3.4 Missing Gaps by Persona

#### Admin Persona Gaps:
- **No Direct Client CRM / Directory**: The "Clients" tab in `/admin` lists records from `client_scopes`, **NOT the `clients` table**. If a user registers, subscribes to Retriever SaaS, or submits a general inquiry without saving a bespoke development scope, they do not appear in the Admin "Clients" ledger.
- **Admin Cannot Edit Client Profiles**: Admin has no interface to edit a client's company name, tax ID, or billing details outside of issuing a custom invoice.
- **No Team / Multi-User Support for Clients**: `clients` has a 1:1 email constraint (`email TEXT UNIQUE`). An organization cannot have multiple team members access the same client scopes or invoices (unlike `rag_tenant_members` which supports multi-tenant roles).

#### User Persona Gaps:
- **No Dedicated Profile / Settings Page**: There is no `/dashboard/profile` or `/dashboard/settings` tab. Company Name and Phone are tucked inside the "Onboarding Checklist" tab under an active scope.
- **Missing Billing Address & Tax ID Input for User**: Even though `clients` has `tax_id_gst` and `country`, and `invoices` has `billing_address` and `customer_gstin`, **the client UI provides ZERO inputs or settings to view, enter, or update their billing address or GSTIN**.
- **No Avatar / Profile Picture Management**: Avatar is strictly inherited from Google OAuth (`user.user_metadata.avatar_url`). Magic link users get a generic letter avatar fallback with no upload capability.

### 3.5 Database & Code Failure Modes
1. **Critical Schema Mismatch in Subscription Routes (Silent DB Failure)**:
   - In `verify-razorpay-subscription/route.ts:208-214` and `webhooks/razorpay/route.ts:557-564`, the code executes:
     ```ts
     await supabase.from('clients').upsert({
       email: sessionUser.email,
       name: displayName,                                 // ❌ Column in clients table is `full_name`!
       company_name: workspaceName,
       notes: `[Retriever SaaS: ${planTier.toUpperCase()}]`, // ❌ Column `notes` does NOT exist in clients!
       updated_at: nowIso,
     }, { onConflict: 'email' })
     ```
   - **Result**: Postgres rejects the upsert because columns `name` and `notes` do not exist on `clients`. The error is caught by `catch (clientErr) { console.warn(...) }`. As a result, **`clientId` remains null, no client record is created or updated, and SaaS subscribers are never recorded in `clients`**.
2. **Missing Signup Trigger (Orphan Auth Accounts)**:
   - Neither `auth/callback/route.ts` nor Supabase DB contains a trigger on `auth.users` to insert a row into `clients`. Users who sign up but do not save a scope remain completely unrepresented in `clients`.
3. **No Foreign Key Between `auth.users` and `clients`**:
   - `clients.id` is an independent UUID (`gen_random_uuid()`). The table lacks a `user_id UUID REFERENCES auth.users(id)` column. The linkage relies entirely on matching `email` strings. If a user updates their email in Supabase Auth, their connection to `clients`, `client_scopes`, and `invoices` is severed.
4. **Metadata Desynchronization**:
   - Updates to Google profile metadata (`full_name`, `avatar_url`) in Supabase Auth never propagate to `clients.full_name`.

---

## Consolidated Capability Matrix

| Capability | Subsystem | Admin Status | User Status | Notes & References |
| :--- | :--- | :--- | :--- | :--- |
| Google OAuth Sign-In (PKCE) | 1 (Auth) | ✅ Supported | ✅ Supported | `src/app/auth/callback/route.ts`, `src/lib/auth.ts` |
| Passwordless Magic Link | 1 (Auth) | ✅ Supported | ✅ Supported | `signInWithOtp`, verified via `verifyOtp` |
| Email / Password Auth | 1 (Auth) | ❌ Missing | ❌ Missing | Completely absent from codebase |
| Safari ITP Cookie Chunking | 1 (Auth) | ✅ Implemented | ✅ Implemented | `universalStorage` splits tokens into 3000B chunks |
| Token Refresh & Auto-Refresh | 1 (Auth) | ✅ Implemented | ✅ Implemented | `getAccessToken()` refreshes expired JWTs |
| Admin User Directory / Management | 1 (Auth) | ❌ Missing | N/A | `/admin` has no view into `auth.users` |
| User Self-Service Account Deletion | 1 (Auth) | N/A | ❌ Missing | No account deletion or data export route |
| New Signup Alert Email | 4 (Emails) | ✅ Implemented | N/A | `sendAdminSignupNotification` (fires on every login) |
| User Welcome Email on Signup | 4 (Emails) | N/A | ❌ Missing | **No welcome email exists for the user** |
| Payment Confirmation Receipt | 4 (Emails) | ✅ Implemented | ✅ Implemented | `sendPaymentConfirmationNotifications` |
| Milestone Stage Advanced Alert | 4 (Emails) | ✅ Implemented | ✅ Implemented | `sendClientMilestoneStageAdvancedNotification` |
| Final Balance Clearance Receipt | 4 (Emails) | ✅ Implemented | ✅ Implemented | `sendFinalBalanceSettlementNotifications` |
| Contact Form Auto-Reply | 4 (Emails) | N/A | ❌ Missing | Submitter gets no confirmation email |
| Email Delivery Audit Table | 4 (Emails) | ❌ Missing | N/A | No `email_logs` table or status tracking |
| Client Record Creation on Signup | 7 (Profile) | ❌ Missing | ❌ Missing | **No trigger on `auth.users`**; deferred to scope save |
| Client Profile Edit (Company/Phone) | 7 (Profile) | ❌ Missing | ✅ Implemented | Implemented in Onboarding tab of dashboard |
| Billing Address & GSTIN Management | 7 (Profile) | ✅ (Invoices only) | ❌ Missing | User has no UI to set address or GSTIN |
| Subscription Upsert to `clients` | 7 (Profile) | ⚠️ Broken | ⚠️ Broken | **Schema mismatch (`name`, `notes`) silently fails** |
| Foreign Key `auth.users` -> `clients` | 7 (Profile) | ❌ Missing | ❌ Missing | Linked solely by volatile email string |

---

## Prioritized Remediation Roadmap

1. **Fix Subscription `clients` Upsert Bug (Immediate Priority)**:
   - In `src/app/api/client/verify-razorpay-subscription/route.ts:208` and `src/app/api/webhooks/razorpay/route.ts:557`, change `name` to `full_name`, and remove `notes` (or add a migration adding `notes TEXT` to `clients`).
2. **Implement User Welcome Email (High Priority)**:
   - In `src/lib/emailNotification.ts`, create `sendUserWelcomeNotification({ email, fullName })`.
   - In `src/app/auth/callback/route.ts`, check whether the user was created within the last 60 seconds (or whether a `clients` record already exists) to send the welcome email only on first signup, while eliminating duplicate admin alerts on returning logins.
3. **Database-Level Profile Synchronization (High Priority)**:
   - Add a PostgreSQL trigger on `auth.users` (or handle in `/auth/callback/route.ts`) to automatically upsert into `clients` on user signup.
   - Add `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE` to `clients` table.
4. **User Profile Settings & Billing Address UI (Medium Priority)**:
   - Provide a dedicated "Profile & Billing Settings" section in `/dashboard` allowing clients to persist `company_name`, `phone`, `tax_id_gst`, and `billing_address`.
5. **Contact Form & Scoping Lead Auto-Replies (Medium Priority)**:
   - In `/api/contact/route.ts`, send an automatic confirmation email back to the submitter acknowledging receipt.
   - In `/api/client/intake-draft/route.ts`, send a proposal confirmation email with the scope link.
6. **Email Delivery Audit Ledger (Medium Priority)**:
   - Create an `email_logs` table in Supabase to track message IDs, recipient, template type, and Resend delivery status.
7. **Admin User Directory (Future Priority)**:
   - Add an authenticated admin view in `/admin` to list registered users and their associated scopes, tenants, and activity.
