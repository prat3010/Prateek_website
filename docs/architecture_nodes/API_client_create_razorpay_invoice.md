---
id: API_client_create_razorpay_invoice
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: critical
file_path: src/app/api/client/create-razorpay-invoice/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create-razorpay-invoice/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create-razorpay-invoice/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
invariants:
  - "Client email MUST be extracted from verified JWT session, NEVER accepted from request parameters."
  - "Order amounts MUST match exact pricing rules (50% milestone deposit) computed server-side."
  - "Payment signatures MUST be validated using crypto.timingSafeEqual HMAC-SHA256."
  - "Webhook events MUST be deduplicated via processed_webhooks unique event_id ledger."
test_suites:
  - src/app/api/__tests__/razorpay.test.ts
  - src/app/api/__tests__/invoicing.test.ts
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - Schema_invoices
---

# API: `POST /api/client/create-razorpay-invoice`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create-razorpay-invoice/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create-razorpay-invoice/route.ts)**

#api #payments #invoice #razorpay

> **Direct Invoice Generation for Milestone Deliverables & Phase 2 Change Orders.**

- **Endpoint:** `POST /api/client/create-razorpay-invoice`
- **Path:** `src/app/api/client/create-razorpay-invoice/route.ts`
- **Function:** Generates official GST-compliant tax invoices and payment links.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Client email MUST be extracted from verified JWT session, NEVER accepted from request parameters.**
2. **Order amounts MUST match exact pricing rules (50% milestone deposit) computed server-side.**
3. **Payment signatures MUST be validated using crypto.timingSafeEqual HMAC-SHA256.**
4. **Webhook events MUST be deduplicated via processed_webhooks unique event_id ledger.**

