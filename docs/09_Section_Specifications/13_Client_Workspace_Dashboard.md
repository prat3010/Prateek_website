# **13. Client Workspace Dashboard (`/dashboard`)**

## **Purpose**

The **Client Workspace Dashboard** (`/dashboard`) serves as the client portal where authenticated clients manage active project scopes, customize scope features, track project delivery milestones, export commercial PDF proposals, delete draft proposals, and initiate 50% deposit lock payments via Razorpay.

---

## **Key Capabilities & User Flows**

1. **Client Authentication & Session Gate**:
   - Integrated with Supabase Google OAuth sign-in ([`AuthContext.tsx`](file:///Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx)).
   - Session tokens are verified via [`getVerifiedSessionEmail`](file:///Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts) to restrict data access strictly to the authenticated client's scopes and invoices.

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
     - **Scoping Brief PDF** ([`ScopingBriefPDF.tsx`](file:///Users/prateeksharma/Developer/Prateek_website/src/components/pdf/ScopingBriefPDF.tsx))
     - **Services & Pricing Guide PDF** ([`ServicesAndPricingPDF.tsx`](file:///Users/prateeksharma/Developer/Prateek_website/src/components/pdf/ServicesAndPricingPDF.tsx))

7. **Scope Deletion**:
   - Clients can delete unpaid scope drafts via `/api/client/delete-scope` endpoint (session-gated and restricted to unpaid scopes).

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
