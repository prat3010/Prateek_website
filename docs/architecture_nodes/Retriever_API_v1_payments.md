---
id: Retriever_API_v1_payments
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: critical
file_path: apps/api/src/routers/payments.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/payments.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/payments.py"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
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
---

# Retriever API: `apps/api/src/routers/payments.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/payments.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/payments.py)**

#retriever #api #payments #subscriptions

> **SaaS Plan Subscriptions & Webhook Synchronization.**

- **Endpoints:** `/v1/payments/plans`, `/v1/payments/webhook`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Client email MUST be extracted from verified JWT session, NEVER accepted from request parameters.**
2. **Order amounts MUST match exact pricing rules (50% milestone deposit) computed server-side.**
3. **Payment signatures MUST be validated using crypto.timingSafeEqual HMAC-SHA256.**
4. **Webhook events MUST be deduplicated via processed_webhooks unique event_id ledger.**

