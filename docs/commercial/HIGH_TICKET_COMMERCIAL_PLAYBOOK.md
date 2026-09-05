# 💰 High-Ticket Commercial Playbook & Escrow Operations

> **Operational Playbook for High-Ticket Enterprise Consulting, Productized Scoping, 50% Milestone Escrow Billing, Phase 2 Change Orders, and Middleman Sales Partnerships.**

---

## 1. Executive Commercial Philosophy

Custom software consulting fails when pricing is ambiguous, scopes are renegotiated during active sprints, and developers act as uncompensated project managers.

This playbook documents the productized commercial framework embedded across `prateeq.in`:
1. **Zero Estimation Guesswork (CPQ Engine):** Project costs are computed algorithmically via `calcQuote()` in `src/lib/pricing.ts`, linking concrete architectural choices (base engine, feature modules, brand assets, maintenance tier) directly to mathematically verified prices.
2. **50% Upfront Milestone Escrow Lock:** Zero lines of production code are deployed until Milestone 1 (50% deposit) is settled via Razorpay Standard Checkout.
3. **Immutable Baseline SOW Contract:** Upon payment confirmation, the agreed architecture is permanently indexed into a dedicated Retriever tenant (`tn_client_<uuid>`), pre-grounding the client's AI copilot and freezing the baseline deliverables.
4. **Phase 2 Change Order Monetization:** Scope creep is redirected into versioned change orders (`/api/client/change-orders`), turning feature requests into incremental revenue milestones.

---

## 2. Commercial Engagement Pipeline

```text
 [ Step 1: Discovery & Scoping ]
 • Route: prateeq.in/scoping
 • Client selects base engine + feature add-ons
 • Live CPQ price bar displays INR / USD totals
 • 1-Click download of ScopingBriefPDF (3 Pages, Pinned)
                 │
                 ▼
 [ Step 2: Client Authentication ]
 • 1-Click Google OAuth PKCE SSO on prateeq.in
 • Automatically links or creates client record in `clients`
 • Preserves cart configuration into `client_scopes` (status: 'draft')
                 │
                 ▼
 [ Step 3: Workspace Dashboard (/dashboard) ]
 • Interactive feature toggle customizer & architecture topology inspection
 • Client clicks [Confirm Scope & Lock 50% Deposit]
                 │
                 ▼
 [ Step 4: Razorpay Escrow Settlement ]
 • POST /api/client/create-razorpay-order (Amount computed server-side)
 • Standard Web Checkout modal (UPI, Netbanking, International Credit Cards)
 • POST /api/client/verify-razorpay-payment (HMAC-SHA256 signature check)
                 │
                 ▼
 [ Step 5: SOW Snapshotting & Provisioning ]
 • Marks invoice 'paid' and advances scope status to 'in_development'
 • Provisions dedicated Retriever AI SaaS tenant with 7-Day Starter Trial
 • Indexes immutable SOW contract into tenant's document library
```

---

## 3. High-Ticket Pricing Matrix & Packaging

### Foundational Engines (`src/data/intakeQuestionnaireDefaults.json`)

| Engine Architecture | Target Engagement | INR Price | USD Price | Delivery Window |
| :--- | :--- | :--- | :--- | :--- |
| **High-Conversion Landing Page** | Single-page product launch, 3D Canvas skyline, lead capture. | ₹45,000 | $600 | 5–7 Days |
| **Multi-Page Corporate Platform** | Enterprise CMS, blog newsjacking, dynamic case studies, team portal. | ₹95,000 | $1,250 | 10–14 Days |
| **Full-Stack SaaS MVP** | Supabase Auth, Razorpay subscriptions, PostgreSQL RLS, dashboard workspace. | ₹1,85,000 | $2,400 | 21–28 Days |
| **Autonomous AI RAG Engine** | Multi-tenant hybrid search, pgvector, GraphRAG, local Ollama embeddings. | ₹2,80,000 | $3,600 | 30–45 Days |

### Feature Add-On Pricing Rules
- **Transitive Dependency Resolution:** Adding advanced features automatically includes necessary infrastructure prerequisites (e.g. `vector_db` ➔ requires `postgresql_persistence`).
- **Currency Parity:** Fixed conversion exchange rate of 85 INR per USD enforced across all calculation endpoints to eliminate international credit card checkout friction.

---

## 4. Phase 2 Change Order Discipline

When a client requests out-of-scope enhancements during development (e.g., adding WebRTC voice streaming or custom ERP connectors):
1. **Do Not Say No — Quote Instantly:** Acknowledge the requirement and formalize it via `/api/client/change-orders`.
2. **Independent Escrow Milestones:** Change orders generate a separate invoice in `invoices` with milestone type `change_order`.
3. **No SOW Contamination:** Baseline milestone timelines remain protected; change order execution begins strictly after the primary deliverable is accepted.

---

## 5. Sales Partner (Middleman) Partnership Structure

External consultants, agencies, and network connectors earn recurring revenue by referring qualified high-ticket clients:

| Commission Band | Deal Size Range (INR) | Commission Rate | Payout Schedule |
| :--- | :--- | :--- | :--- |
| **Band A** | Up to ₹1,00,000 ($1,250) | **10%** of gross deal value | 50% on client deposit, 50% on final delivery |
| **Band B** | ₹1,00,001 to ₹3,00,000 ($3,600) | **12%** of gross deal value | 50% on client deposit, 50% on final delivery |
| **Band C** | ₹3,00,001 and above | **15%** of gross deal value | 50% on client deposit, 50% on final delivery |
| **Recurring Care** | Monthly retainer maintenance | **10% recurring** monthly | Disbursed on the 1st of every calendar month |

- **Legal Framework:** Governed by the formal 3-page [`MiddlemanAgreementPDF.tsx`](../../src/components/pdf/MiddlemanAgreementPDF.tsx) with non-circumvention and non-disclosure covenants.

---

## 6. Cross-References & Documents

- **Master Product Requirements Document:** [[Prateek_Website/docs/27_Client_Workspace_and_Escrow_Ledger_PRD|PRD: Client Workspace & Escrow Ledger]]
- **Payment Gateway Architecture:** [[Prateek_Website/docs/14_Razorpay_Payments_and_Invoicing|Razorpay Payments & Invoicing]]
- **Legal Sales Agreement:** [[Prateek_Website/docs/MIDDLEMAN_PARTNERSHIP_AGREEMENT|Middleman Partnership Agreement]]
- **Commercial PDF Exporters:** [[Prateek_Website/docs/29_Commercial_PDF_Generation_Engine_PRD|PRD: Commercial PDF Suite]]
