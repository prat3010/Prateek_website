# Handoff Report: Subsystem 1 (Auth), Subsystem 4 (Emails), Subsystem 7 (Profile Management)

**From**: Explorer 1 (Auth and Profile Explorer)  
**To**: Orchestrator (Conversation ID: `81f6d55b-e0b9-404f-8c0e-b258eecf735a`)  
**Working Directory**: `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/explorer_survey_1/`  
**Date**: November 2026  
**Type**: Hard Handoff (Investigation & Synthesis Complete)

---

## 1. Observation

### Subsystem 1: User Signup & Authentication
- **`src/app/auth/callback/route.ts` lines 30–52**:
  Exchanges PKCE `code` or verifies OTP token:
  ```ts
  if (code) {
    const res = await supabase.auth.exchangeCodeForSession(code);
    data = res.data;
    exchangeErr = res.error;
  } else if (tokenHash && otpType) {
    const res = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    data = res.data;
    exchangeErr = res.error;
  }
  ```
- **`src/app/auth/callback/route.ts` lines 54–68**:
  Sets cookie `prateeq_active_user` with `JSON.stringify(user)` (30 days maxAge, SameSite: Lax). Calls `sendAdminSignupNotification` asynchronously.
- **`src/lib/auth.ts` lines 7–10**:
  Hardcoded admin emails:
  ```ts
  const ADMIN_EMAILS = [
    '3010prateeksharma@gmail.com',
    'prateeqsharma@gmail.com',
  ];
  ```
- **`src/lib/auth.ts` lines 18–97**:
  `universalStorage` splits values larger than 3000 bytes into chunked cookies (`${encKey}_chunk_${i}`) and writes to localStorage.
- **`src/context/AuthContext.tsx` lines 252–278**:
  `getAccessToken()` decodes JWT payload, checks `exp`, and calls `refreshSession()` if expired.
- **Grepping for `signInWithPassword` in `src/`**: Returned zero results (`No results found`). Email/Password authentication is completely absent.
- **`src/app/admin/page.tsx` lines 548–585**:
  Guards `/admin` with `if (!user)` and `if (!isAdminEmail(user.email))`. There is no UI to view or manage registered users in `auth.users`.

### Subsystem 4: Welcome & Transaction Emails
- **`src/lib/emailNotification.ts` lines 37–102**:
  `sendAdminSignupNotification` sends an alert to `client.recipient` (`CONTACT_EMAIL_TO`). There is no companion function `sendUserWelcomeNotification`.
- **`src/app/auth/callback/route.ts` lines 63–68**:
  Triggers `sendAdminSignupNotification` on every session code/OTP exchange regardless of whether the user is newly created or an existing returning user.
- **`src/app/api/contact/route.ts` lines 138–242**:
  Sends an email to `contactEmailTo`. No email is sent to the sender (`email`).
- **`src/lib/emailNotification.ts` lines 235–318, 433–511, 529–670, 690–787, 808–963**:
  Client-facing transactional templates are implemented for: payment receipt, subscription activation, milestone stage advancement, change order updates, and final balance settlement.
- **Database schema inspection**:
  No `email_logs`, `notification_logs`, or delivery status tracking tables exist in `supabase_schema.sql` or migrations.

### Subsystem 7: Profile Management
- **`supabase_schema.sql` lines 206–224**:
  ```sql
  CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT '',
    company_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    tax_id_gst TEXT DEFAULT '',
    country TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
  );
  ```
- **`supabase_schema.sql` lines 218–222**:
  RLS policy for clients: `CREATE POLICY "Clients can select own profile" ON clients FOR SELECT USING (auth.jwt() ->> 'email' = email);`. No public insert/update/delete policies.
- **`src/app/api/client/save-scope/route.ts` lines 74–109**:
  Upserts `clients` record (`company_name`, `phone`) ONLY when a scope is saved.
- **`src/components/ClientDashboard/OnboardingChecklistWidget.tsx` lines 102–118, 167–205**:
  UI enables editing Company / Project Name and Contact Phone under active scope.
- **`src/app/api/client/verify-razorpay-subscription/route.ts` lines 204–222 & `src/app/api/webhooks/razorpay/route.ts` lines 554–574**:
  ```ts
  const { data: clientData } = await supabase
    .from('clients')
    .upsert(
      {
        email: sessionUser.email,
        name: displayName,                                 // ❌ Column in clients is full_name
        company_name: workspaceName,
        notes: `[Retriever SaaS: ${planTier.toUpperCase()}]`, // ❌ Column notes does not exist in clients
        updated_at: nowIso,
      },
      { onConflict: 'email' }
    )
  ```
  Postgres rejects this insert due to missing columns `name` and `notes`. The error is caught and silenced by `console.warn`, leaving `clientId` null.
- **`src/app/admin/page.tsx` lines 248–261**:
  Admin "Clients" tab fetches from `client_scopes` via `/api/client/get-scopes?all=true`. It never queries the `clients` table.
- **Sync between `auth.users` and `clients`**:
  No database triggers or auth callback functions insert a `clients` record upon user signup.

---

## 2. Logic Chain

1. **Signup & Authentication**:
   - Observations show `route.ts` handles Google OAuth and Magic Link OTP token exchanges.
   - Observations show `signInWithPassword` is nowhere in the codebase.
   - Therefore, password-based authentication is missing; only Google OAuth and Magic Link exist.
   - Observations show `ADMIN_EMAILS` is an in-memory array in `src/lib/auth.ts:7-10`, and `admin/page.tsx` only renders tabs for Prospects, Clients (Scopes), Subscribers, and Leads.
   - Therefore, there is no administrative user management or database-driven RBAC.

2. **Welcome & Transaction Emails**:
   - Observations show `sendAdminSignupNotification` in `emailNotification.ts:37` is triggered in `route.ts:63` on every code/OTP exchange.
   - There is no companion function or trigger to email the user upon registration.
   - Therefore, no user welcome email exists; moreover, the admin is notified on routine returning user logins as well as new signups.
   - Observations show rich transactional emails for payments, subscriptions, change orders, stages, and handover.
   - However, no database table logs email delivery statuses.
   - Therefore, delivery visibility is restricted to Resend's external console.

3. **Profile Management**:
   - Observations show `supabase_schema.sql` defines `clients` with `full_name`, `company_name`, `phone`, `tax_id_gst`, `country`.
   - Observations show no trigger on `auth.users` creates a `clients` record upon signup.
   - Observations show `save-scope/route.ts` creates or updates a `clients` record when a scope is saved.
   - Therefore, users who sign up but never save a scope have no record in `clients` (orphan auth accounts).
   - Observations show `verify-razorpay-subscription/route.ts:209` and `webhooks/razorpay/route.ts:559` attempt to upsert `name` and `notes` into `clients`.
   - Because `name` and `notes` are not in the `clients` table schema, Postgres fails the upsert, which is caught and silenced, resulting in null `clientId`.
   - Observations show `OnboardingChecklistWidget.tsx` provides inputs for Company Name and Phone, but no inputs exist for `tax_id_gst`, `country`, or billing address.
   - Therefore, user-facing profile management is incomplete and tied entirely to scope onboarding.

---

## 3. Caveats

- **External Resend Console**: We examined the codebase's invocation of the Resend SDK. External delivery telemetry (e.g. bounce rates, spam complaints, domain reputation in Resend's dashboard) was not directly queried via external API.
- **Supabase Cloud Dashboard Settings**: We audited the local `supabase_schema.sql` and migrations. Any dashboard-only configurations (such as Supabase Auth email templates or SMTP overrides) are managed in the Supabase Cloud dashboard and not tracked in git.
- **Read-Only Investigation**: In compliance with strict explorer instructions, no code or database modifications were made during this investigation.

---

## 4. Conclusion

1. **Subsystem 1 (Auth)**: Google OAuth and Magic Link are fully operational with cookie chunking and auto-token refresh. Primary gaps are the complete lack of Email/Password auth, no admin user directory, and hardcoded admin authorization.
2. **Subsystem 4 (Emails)**: Transactional receipts are mature, branded, and resilient. Primary gaps are the absence of a user welcome email, lack of an auto-reply on contact form submissions, and absence of a database-backed email delivery audit log.
3. **Subsystem 7 (Profile)**: Client profile creation is deferred to scope saves rather than user registration. A critical schema mismatch bug silently drops client upserts on Retriever SaaS subscriptions. User profile editing lacks UI for billing address and tax ID.

---

## 5. Verification Method

To independently verify the observations and findings:

1. **Inspect Auth Callback & Email Triggers**:
   - Run `npx vitest run src/app/auth/__tests__/callback.test.ts`
   - Observe that `callback.test.ts` asserts `mockExchangeCodeForSession` and `sendAdminSignupNotification`, confirming the admin notification fires on session code exchange.
2. **Verify Absense of Email/Password**:
   - Run `grep -rn "signInWithPassword" src/` -> Confirms 0 matches.
3. **Verify Email Notification Coverage**:
   - Run `npx vitest run src/lib/__tests__/emailNotification.test.ts`
   - Observe tests covering all 10 notification functions in `src/lib/emailNotification.ts`. Notice that no test exists for a user welcome notification or contact form auto-reply.
4. **Inspect Schema Mismatch in Subscription Routes**:
   - Check `src/app/api/client/verify-razorpay-subscription/route.ts:208-214` and `src/app/api/webhooks/razorpay/route.ts:557-564`.
   - Compare payload keys (`name`, `notes`) with table columns in `supabase_schema.sql:206-216` (`full_name`, `company_name`, `phone`, `tax_id_gst`, `country`).
5. **Full Analysis Report**:
   - Comprehensive details, code references, capability matrix, and remediation roadmap are documented in `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/explorer_survey_1/analysis.md`.
