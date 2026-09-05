---
id: PRD_27_Client_Workspace_and_Escrow_Ledger
title: "PRD: Client Workspace & Escrow Ledger Engine (/dashboard, /api/client/*)"
tier: 4_api_gateway
platform: Prateek_website
status: production
auth_level: authenticated_client
blast_radius: CRITICAL
file_path: src/app/dashboard/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/"
runbook: docs/runbooks/RUNBOOK_CLIENT_ONBOARDING.md
tags:
  - prd/client_dashboard
  - tier/4_api_gateway
  - commerce/escrow
  - payments/razorpay
  - auth/supabase_pkce
  - platform/prateek_website
invariants:
  - "Client identity MUST strictly be resolved via getVerifiedSessionEmail from the Supabase JWT (never trusted from request payloads)."
  - "Invoice amounts MUST be calculated strictly server-side from client_scopes in PostgreSQL to prevent price-tampering."
  - "Milestone 1 deposits MUST be locked at 50% of confirmed scope total prior to kick-off."
  - "Razorpay payment signatures MUST be verified using HMAC-SHA256 before updating invoice ledger status."
  - "Confirmed scopes MUST be automatically indexed as immutable system documents in the client's Retriever tenant."
test_suites:
  - src/app/api/__tests__/razorpay.test.ts
  - src/lib/__tests__/pricing.test.ts
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/CLIENT_DASHBOARD_ROADMAP.md
  - docs/14_Razorpay_Payments_and_Invoicing.md
  - docs/99_DECISIONS.md#adr-31
---

# 27. Product Requirements Document: Client Workspace & Escrow Ledger Engine

#prd #client_workspace #escrow #razorpay #invoicing #supabase_auth #prateeq_website

> **Comprehensive system specification for the `/dashboard` Client Workspace, Supabase Auth Google PKCE SSO, 50% Upfront Milestone Escrow Billing, Razorpay HMAC-SHA256 Verification, Immutable SOW Contract Snapshotting, and Phase 2 Change Order Architecture.**

---

## 1. Executive Summary & Value Proposition

Engineering service engagements frequently collapse due to scope creep, vague verbal deliverables, unsecured payment disputes, and fractured communication channels. 

The **Client Workspace & Escrow Ledger Engine** (`/dashboard`) transforms custom engineering into a productized, transparent, and financially secured SaaS-like engagement:
1. **Frictionless Google OAuth PKCE Login:** 1-click authentication creates or links a central `clients` record, restoring scope configurations saved during `/scoping` discovery.
2. **Interactive Feature Customizer:** Allows clients to toggle optional feature modules, inspect architecture topologies, and view real-time dependency cascade warnings.
3. **Escrow Milestone Billing:** Enforces a 50% upfront deposit to initiate development, creating an official invoice in `invoices` and verifying Razorpay checkout via cryptographic HMAC-SHA256 signatures.
4. **Immutable Baseline SOW Provisioning:** Upon payment confirmation, the agreed architecture, features, and milestones are compiled into a permanent system document (`is_system = true`, `is_deletable = false`) in a dedicated Retriever cognitive tenant (`tn_client_<uuid>`), provisioning an instant 7-day trial of the AI SaaS studio.
5. **Phase 2 Change Order Workflow:** Out-of-scope feature requests generate formal, versioned change orders with dedicated milestone invoicing, eliminating uncompensated scope creep.

---

## 2. System Architecture & Escrow Sequence

```text
  [ Client Browser (/dashboard) ]               [ Prateek Website Control Plane ]            [ Razorpay / Retriever ]
                 │                                              │                                       │
                 │ 1. Sign In via Google OAuth (PKCE)           │                                       │
                 ├─────────────────────────────────────────────►│ (Exchange code for JWT session)       │
                 │                                              │                                       │
                 │ 2. GET /api/client/get-scopes                │                                       │
                 │    Authorization: Bearer <JWT>               │                                       │
                 ├─────────────────────────────────────────────►│ (Derive email from token)             │
                 │◄─────────────────────────────────────────────┤                                       │
                 │    { scopes: [ { code, total, status } ] }   │                                       │
                 │                                              │                                       │
                 │ 3. POST /api/client/create-razorpay-order    │                                       │
                 │    { scopeCode: "SCP-2026-09" }              │                                       │
                 ├─────────────────────────────────────────────►│                                       │
                 │                                              │ 4. POST /v1/orders                    │
                 │                                              ├──────────────────────────────────────►│
                 │                                              │◄──────────────────────────────────────┤
                 │                                              │    { order_id: "order_99a", ... }     │
                 │◄─────────────────────────────────────────────┤                                       │
                 │    { orderId, amountInSubunits, keyId }      │                                       │
                 │                                              │                                       │
                 │ 5. Razorpay Standard Web Checkout Modal      │                                       │
                 │    (Client enters UPI/Card credentials)      │                                       │
                 ├──────────────────────────────────────────────┼──────────────────────────────────────►│
                 │◄─────────────────────────────────────────────┼──────────────────────────────────────┤
                 │    { razorpay_payment_id, signature }        │                                       │
                 │                                              │                                       │
                 │ 6. POST /api/client/verify-razorpay-payment  │                                       │
                 ├─────────────────────────────────────────────►│ (Verify crypto HMAC-SHA256)           │
                 │                                              │                                       │
                 │                                              │ 7. Provision Retriever Tenant & SOW   │
                 │                                              ├──────────────────────────────────────►│
                 │                                              │    POST /v1/tenants/provision         │
                 │◄─────────────────────────────────────────────┤                                       │
                 │    { verified: true, invoice_number }        │                                       │
```

---

## 3. Non-Negotiable Invariants & Anti-Tampering Rules

| Invariant ID | Rule Description | Technical Safeguard |
| :--- | :--- | :--- |
| **INV-ESC-01** | **Strict Token-Derived Identity** | `/api/client/*` endpoints invoke `getVerifiedSessionEmail(req)`. Client email parameters from JSON payloads or URL parameters are strictly ignored to prevent account impersonation. |
| **INV-ESC-02** | **Server-Side Price Calculation** | Invoice deposit amounts are computed via `calcQuote()` in `src/lib/pricing.ts` based on database items in `client_scopes`. Client-submitted totals are rejected. |
| **INV-ESC-03** | **Cryptographic Payment Verification** | `verify-razorpay-payment` asserts `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET) === razorpay_signature`. Any mismatch immediately throws `400 Invalid Signature`. |
| **INV-ESC-04** | **Dual Webhook Idempotency** | Webhook route `/api/webhooks/razorpay` verifies signature and checks if `invoices.status === 'paid'`. If already marked paid, it exits with 200 OK without double-processing. |
| **INV-ESC-05** | **Immutable Baseline Contract** | When scope is locked, the generated SOW document is ingested into Retriever with `is_system: true` and `is_deletable: false`. Clients cannot delete their contract. |

---

## 4. API Route Contracts

### 4.1 Create Razorpay Milestone Escrow Order
* **Endpoint:** `POST /api/client/create-razorpay-order`
* **Auth:** Bearer Supabase JWT
* **Request Body:**
  ```json
  {
    "scopeCode": "SCP-2026-X89",
    "milestoneIndex": 0
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "orderId": "order_NX8829410A",
    "amount": 12500000,
    "currency": "INR",
    "keyId": "rzp_live_xxxxxxxx",
    "invoiceNumber": "INV-2026-09-001"
  }
  ```

### 4.2 Verify Razorpay Payment Signature
* **Endpoint:** `POST /api/client/verify-razorpay-payment`
* **Auth:** Bearer Supabase JWT
* **Request Body:**
  ```json
  {
    "razorpay_order_id": "order_NX8829410A",
    "razorpay_payment_id": "pay_NX8839019B",
    "razorpay_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "scopeCode": "SCP-2026-X89",
    "invoiceNumber": "INV-2026-09-001"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "verified": true,
    "scopeStatus": "in_development",
    "milestoneStatus": "deposit_locked",
    "tenant_id": "tn_client_8f3b2810"
  }
  ```

### 4.3 Phase 2 Change Orders
* **Endpoint:** `POST /api/client/change-orders`
* **Auth:** Bearer Supabase JWT
* **Request Body:**
  ```json
  {
    "scopeCode": "SCP-2026-X89",
    "title": "Add Real-time WebRTC Audio Streaming",
    "description": "Integration of Cartesia neural TTS and Whisper voice streaming.",
    "estimatedDays": 5,
    "priceInr": 45000,
    "priceUsd": 600
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "changeOrderId": "co_881023",
    "status": "pending_client_approval",
    "invoiceRequired": true
  }
  ```

---

## 5. Database Schema & Tables

```sql
-- Client Scopes Master Table
CREATE TABLE IF NOT EXISTS client_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_code TEXT NOT NULL UNIQUE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    company_name TEXT,
    engine_id TEXT NOT NULL,
    selected_features TEXT[] DEFAULT '{}',
    selected_brand_asset TEXT,
    maintenance_plan_id TEXT,
    total_inr NUMERIC(12,2) NOT NULL,
    total_usd NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'scope_confirmed', 'in_development', 'milestone_review', 'completed', 'cancelled')),
    deposit_paid BOOLEAN DEFAULT FALSE,
    retriever_tenant_id TEXT,
    sow_document_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices & Escrow Ledger
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    scope_code TEXT REFERENCES client_scopes(scope_code) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    amount_inr NUMERIC(12,2) NOT NULL,
    amount_usd NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    milestone_name TEXT NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Change Orders
CREATE TABLE IF NOT EXISTS client_change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_code TEXT REFERENCES client_scopes(scope_code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_inr NUMERIC(12,2) NOT NULL,
    price_usd NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'declined', 'invoiced', 'paid')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Enforcement
ALTER TABLE client_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own scopes" ON client_scopes
    FOR SELECT USING (auth.jwt() ->> 'email' = client_email);

CREATE POLICY "Clients can view own invoices" ON invoices
    FOR SELECT USING (auth.jwt() ->> 'email' = client_email);

CREATE POLICY "Clients can view own change orders" ON client_change_orders
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM client_scopes WHERE client_scopes.scope_code = client_change_orders.scope_code AND client_scopes.client_email = auth.jwt() ->> 'email'
    ));
```

---

## 6. Client UX & Sensory Standards

1. **Dual-Theme Fidelity:** Full visual parity across cold-press paper Azure and obsidian glass Noir themes.
2. **Interactive Financials:** Milestone payments and totals rendered with `@number-flow/react` for smooth numeric roll-ups.
3. **Responsive Sticky Bar:** Sticky actions bar on mobile (<640px) ensuring "Pay 50% Deposit" and "Download PDF Brief" buttons remain within ergonomic thumb zone.
4. **Instant Executive Brief Download:** 1-click generation of `ProposalExecutiveBriefPDF` using client-side `@react-pdf/renderer` v4.

---

## 7. Verification & Automated Test Plan

1. **API Integration Tests (`src/app/api/__tests__/razorpay.test.ts`):**
   - Assert HMAC-SHA256 signature calculation rejects corrupted signatures.
   - Assert `verify-razorpay-payment` marks invoice status as `paid` and advances `client_scopes.status` to `in_development`.
   - Assert webhook idempotency prevents multiple deposit recordings for the same order ID.
2. **Pricing Integrity Tests (`src/lib/__tests__/pricing.test.ts`):**
   - Assert quote calculation matches server-side constraints for all base engines and feature add-ons.
