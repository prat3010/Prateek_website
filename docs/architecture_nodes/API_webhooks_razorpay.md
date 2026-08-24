---
id: API_webhooks_razorpay
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/webhooks/razorpay/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - Schema_invoices
  - Engine_Digital_SOW_Escrow_Freeze
---

# API: `POST /api/webhooks/razorpay`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/webhooks/razorpay/route.ts)**

#api #webhooks #security #razorpay

> **Asynchronous Server-to-Server Razorpay Webhook Event Processor.**

- **Endpoint:** `POST /api/webhooks/razorpay`
- **Path:** `src/app/api/webhooks/razorpay/route.ts`
- **Security:** Verifies `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`
- **Events Handled:** `payment.captured`, `payment.failed`, `subscription.charged`, `subscription.cancelled`

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: invoices](Schema_invoices.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
