---
id: API_client_create_razorpay_order
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/create/razorpay/order/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create/razorpay/order/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create/razorpay/order/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - Schema_invoices
  - Schema_client_scopes
  - Schema_promo_codes
  - UI_PreDepositBridge
---

# API: `POST /api/client/create-razorpay-order`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create/razorpay/order/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/create/razorpay/order/route.ts)**

#api #payments #razorpay #escrow

> **Server-Side SSoT 50% Milestone Deposit Order Generation.**

- **Endpoint:** `POST /api/client/create-razorpay-order`
- **Security:** Verified Supabase Session Token (`sessionVerify.ts`)
- **Calculation:** Recomputes package total from `intakeQuestionnaireDefaults.json`, applies promo code, calculates exact 50% deposit amount.
- **Output:** `{ orderId, amount, currency, keyId, clientScopeId }`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: promo_codes](Schema_promo_codes.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
