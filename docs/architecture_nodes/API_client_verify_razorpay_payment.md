---
id: API_client_verify_razorpay_payment
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/verify/razorpay/payment/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify/razorpay/payment/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify/razorpay/payment/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - Engine_Digital_SOW_Escrow_Freeze
  - Schema_invoices
  - Schema_client_scopes
---

# API: `POST /api/client/verify-razorpay-payment`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify/razorpay/payment/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/verify/razorpay/payment/route.ts)**

#api #payments #webhook #security

> **HMAC-SHA256 Payment Verification & SOW Scope Immutability Lock.**

- **Endpoint:** `POST /api/client/verify-razorpay-payment`
- **Verification:** Generates `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')`
- **Post-Verification Actions:**
  1. Updates `client_scopes.status = 'deposit_paid'`
  2. Generates immutable `sow_hash`
  3. Inserts invoice receipt into `invoices`
  4. Triggers Resend email confirmation with PDF attachment

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
- [Schema: invoices](Schema_invoices.md)
- [Schema: client_scopes](Schema_client_scopes.md)
