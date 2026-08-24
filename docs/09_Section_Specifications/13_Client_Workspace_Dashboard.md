# **13. Client Workspace Dashboard (`/dashboard`)**

## **Purpose**

> 📌 **Master Product Requirements & v2 Architecture:** For the forward-looking SOTA Scoping Engine and Client Workspace PRD, see [`docs/25_SOTA_Scoping_Engine_PRD.md`](../25_SOTA_Scoping_Engine_PRD.md).

The **Client Workspace Dashboard** (`/dashboard`) serves as the client portal where authenticated clients manage active project scopes, customize scope features, track project delivery milestones, export commercial PDF proposals, delete draft proposals, and initiate 50% deposit lock payments via Razorpay.

---

## **Key Capabilities & User Flows**

1. **Client Authentication & Session Gate**:
   - Integrated with Supabase Google OAuth sign-in ([`AuthContext.tsx`](../../src/context/AuthContext.tsx)).
   - Session tokens are verified via [`getVerifiedSessionEmail`](../../src/lib/sessionVerify.ts) to restrict data access strictly to the authenticated client's scopes and invoices.

2. **Active Scope Management**:
   - Displays all scopes associated with the client (`client_scopes` table).
   - Shows scope details: `scope_code`, `company_name`, selected base engine, feature modules, total cost (INR/USD), and deposit status.

3. **Interactive Scope Feature Customizer**:
   - Clients can add or remove feature modules directly inside the dashboard.
   - Saves updates back to Supabase via `/api/client/save-scope`, maintaining live synchronized state between client edits and admin views.

4. **4-Stage Delivery Milestone Tracker**:
   - Tracks project progress across four stages:
     1. `architecture` — Scope definition & technical architecture sign-off (Default).
     2. `engineering` — Core feature implementation & backend development (Triggered upon 50% deposit payment).
     3. `staging` — Staging deployment, testing, and client sign-off.
     4. `live` — Production release & domain handover.

5. **Invoice & Payment Ledger**:
   - Renders itemized invoice records from the `invoices` table.
   - Shows payment status (`pending`, `paid`, `cancelled`, `refunded`), invoice number, milestone title, due date, and payment dates.

6. **Commercial PDF Exporters**:
   - Exports high-resolution commercial PDF documents client-side:
     - **Scoping Brief PDF** ([`ScopingBriefPDF.tsx`](../../src/components/pdf/ScopingBriefPDF.tsx))
     - **Services & Pricing Guide PDF** ([`ServicesAndPricingPDF.tsx`](../../src/components/pdf/ServicesAndPricingPDF.tsx))

7. **Scope Deletion & Draft Intake**:
   - Clients can delete unpaid scope drafts via [`/api/client/delete-scope`](../../src/app/api/client/delete-scope/route.ts) endpoint (session-gated, deriving identity via Bearer token, and strictly restricted to unpaid scopes where `deposit_paid = false`).
   - Unauthenticated wizard progress or preliminary scoping choices are saved via [`/api/client/intake-draft`](../../src/app/api/client/intake-draft/route.ts) to the `intake_leads` table, ensuring work is preserved across session redirects.

8. **Razorpay 50% Deposit Lock Trigger**:
   - Provides a direct action button: **"Pay 50% Scope Deposit (Razorpay)"**.
   - Invokes `/api/client/create-razorpay-order`, loads Razorpay Checkout modal (`checkout.js`), and initiates payment signature verification upon completion.

---

## **Interface Architecture**

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │ Client Profile Bar (Authenticated User Email & Logout)                 │
 ├────────────────────────────────────────────────────────────────────────┤
 │ Active Scopes Grid                                                     │
 │ ┌────────────────────────────────────────────────────────────────────┐ │
 │ │ Scope Code: SCOPE-10001 | Acme Corp                                │ │
 │ │ Base Engine: Multi-Page Web Platform                              │ │
 │ │ Features: Auth, DB, Search, Analytics                              │ │
 │ │ Total Cost: ₹175,000 / $2,500 | Deposit Status: Paid (50%)          │ │
 │ │ Milestone Progress Bar: [Architecture ▶ Engineering ▶ Staging ▶ Live] │
 │ │ Actions: [Edit Features] [Download PDF] [Pay Deposit (Razorpay)]   │ │
 │ └────────────────────────────────────────────────────────────────────┘ │
 ├────────────────────────────────────────────────────────────────────────┤
 │ Invoice & Payment Ledger Table                                          │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## **Acceptance Criteria**

- Non-authenticated visitors see Google OAuth login prompt when accessing `/dashboard`.
- Clients can view only their own scopes and invoices.
- Feature modifications immediately recalculate total cost and update Supabase.
- Unpaid scopes can be deleted by the client; paid scopes disable deletion.
- Clicking "Pay 50% Scope Deposit" opens Razorpay checkout and advances milestone to `engineering` upon payment verification.

---

## **Related Architecture & Cross-References**

- [SOTA Scoping & Scope Freeze PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Scoping Lab Wizard](12_Scoping_Lab.md)
- [Payments & Milestone Invoices](../14_Razorpay_Payments_and_Invoicing.md)
- [Client Dashboard Specification](../CLIENT_DASHBOARD_ROADMAP.md)
- [Supabase Auth PKCE Session Gate](../16_Security_and_Privacy.md)
- [Master Roadmap (Milestone 67)](../UNIFIED_MASTER_ROADMAP.md)
- [Architecture Node: Route /dashboard](../architecture_nodes/Route_dashboard.md)
- [Architecture Node: Dashboard UI](../architecture_nodes/UI_ClientWorkspaceDashboard.md)