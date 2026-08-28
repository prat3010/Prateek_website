# **13. Client Workspace Dashboard (`/dashboard`)**

## **Purpose**

> 📌 **Master Product Requirements & v2 Architecture:** For the forward-looking SOTA Scoping Engine and Client Workspace PRD, see [`docs/25_SOTA_Scoping_Engine_PRD.md`](../25_SOTA_Scoping_Engine_PRD.md).

The **Client Workspace Dashboard** (`/dashboard`) serves as the client portal where authenticated clients manage active project scopes, customize scope features, track project delivery milestones, export commercial PDF proposals, delete draft proposals, and initiate 50% deposit lock payments via Razorpay.

---

## **Key Capabilities & User Flows**

1. **Client Authentication & Session Gate**:
   - Integrated with Supabase Google OAuth sign-in ([`AuthContext.tsx`](../../src/context/AuthContext.tsx)).
   - Session tokens are verified via [`getVerifiedSessionEmail`](../../src/lib/sessionVerify.ts) to restrict data access strictly to the authenticated client's scopes and invoices.

2. **Dedicated Retriever SaaS 7-Day Trial Provisioning**:
   - Displays a prominent trial gateway card linking client directly to `/rag/app`.
   - Workspace AI copilot is pre-grounded in the client's confirmed scope/SOW baseline.

3. **Active Scope Management & SOW Cryptographic Seal**:
   - Displays all scopes associated with the client (`client_scopes` table).
   - Shows scope details: `scope_code`, `company_name`, selected base engine, feature modules, total cost (INR/USD), and deposit status.
   - For signed contracts, renders the **Cryptographic SHA-256 SOW Seal Badge** (`sow_hash`).

4. **SOTA Embedded Architecture Customizer & Phase 2 Change Orders**:
   - Replaced legacy text editing with an interactive modal embedded via `<Portal>`.
   - Supports real-time `calcQuote` math, volume bundle progress meters, promo code validation, and prerequisite auto-resolution with [`DependencyCascadeModal`](../../src/components/Intake/DependencyCascadeModal.tsx).
   - For paid scopes (`deposit_paid: true`), transitions into **Phase 2 Change Order Delta Mode**: computes added/removed feature cost deltas, creates change order records in `scope_change_orders`, and generates automated milestone invoices via `/api/client/change-orders`.

5. **4-Stage Delivery Milestone Tracker**:
   - Tracks project progress across four stages:
     1. `architecture` — Scope definition & technical architecture sign-off (Default).
     2. `engineering` — Core feature implementation & backend development (Triggered upon 50% deposit payment).
     3. `staging` — Staging deployment, testing, and client sign-off.
     4. `live` — Production release & domain handover.

6. **Invoice & Payment Ledger & Change Orders History**:
   - Renders itemized invoice records from the `invoices` table and change order audit trails from `scope_change_orders`.
   - Shows payment status (`pending`, `paid`, `cancelled`, `refunded`, `invoiced`), invoice number, milestone title, due date, and payment dates.

7. **Commercial PDF Exporters**:
   - Exports high-resolution commercial PDF documents client-side:
     - **Scoping Brief PDF** ([`ScopingBriefPDF.tsx`](../../src/components/pdf/ScopingBriefPDF.tsx))
     - **Services & Pricing Guide PDF** ([`ServicesAndPricingPDF.tsx`](../../src/components/pdf/ServicesAndPricingPDF.tsx))

8. **Scope Deletion & Draft Intake**:
   - Clients can delete unpaid scope drafts via [`/api/client/delete-scope`](../../src/app/api/client/delete-scope/route.ts) endpoint (session-gated, deriving identity via Bearer token, and strictly restricted to unpaid scopes where `deposit_paid = false`).
   - Unauthenticated wizard progress or preliminary scoping choices are saved via [`/api/client/intake-draft`](../../src/app/api/client/intake-draft/route.ts) to the `intake_leads` table, ensuring work is preserved across session redirects.

9. **Razorpay 50% Deposit Lock Trigger & Proposal Sign-off Modal**:
   - Provides a digital sign-off modal with milestone payment structure selection (`50/50` vs `40/30/30`) and IP transfer terms confirmation.
   - Invokes `/api/client/create-razorpay-order`, loads Razorpay Checkout modal (`checkout.js`), and initiates payment signature verification upon completion.

10. **Design System 2.0 & Typographic Hierarchy**:
    - Centralized CSS tokens in `globals.css` driving `dashboard.module.css`.
    - Headings and company titles use `var(--font-headline)` (`Playfair Display` in Azure, `JetBrains Mono` in Noir).
    - Data badges, scope codes, and milestone pills use `var(--font-code)` (`JetBrains Mono`).
    - Body text, inputs, and instructions use `var(--font-body)` (`Lora` in Azure, `JetBrains Mono` in Noir).
    - Status badges leverage unified semantic tokens (`--badge-draft-*`, `--badge-active-*`, `--badge-success-*`, `--badge-danger-*`).

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
- Typography and surface styling conform to Design System 2.0 without raw hardcoded hex codes.

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