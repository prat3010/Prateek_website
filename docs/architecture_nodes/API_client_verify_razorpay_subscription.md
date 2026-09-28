---
id: API_client_verify_razorpay_subscription
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: critical
file_path: src/app/api/client/verify-razorpay-subscription/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-subscription/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-subscription/route.ts"
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
  - ../24_RAG_App_Studio_PRD
  - Route_rag_app
  - Schema_rag_tenants
---

# API: `POST /api/client/verify-razorpay-subscription`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-subscription/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify-razorpay-subscription/route.ts)**

#api #payments #subscriptions #razorpay #verification

> **Client-Side Razorpay Subscription Checkout Signature Verification & Instant Paywall Unlock.**

- **Endpoint:** `POST /api/client/verify-razorpay-subscription`
- **Path:** `src/app/api/client/verify-razorpay-subscription/route.ts`
- **Function:** Validates HMAC-SHA256 signatures (`razorpay_payment_id|razorpay_subscription_id`) on checkout completion and immediately unlocks workspace quota.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
- [Schema: rag_tenants](Schema_rag_tenants.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Client email MUST be extracted from verified JWT session, NEVER accepted from request parameters.**
2. **Order amounts MUST match exact pricing rules (50% milestone deposit) computed server-side.**
3. **Payment signatures MUST be validated using crypto.timingSafeEqual HMAC-SHA256.**
4. **Webhook events MUST be deduplicated via processed_webhooks unique event_id ledger.**

