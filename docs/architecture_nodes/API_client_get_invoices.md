---
id: API_client_get_invoices
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/get-invoices/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-invoices/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-invoices/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - Route_dashboard
  - Schema_invoices
---

# API: `GET /api/client/get-invoices`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-invoices/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-invoices/route.ts)**

#api #financial #ledger #client

> **Authenticated Client Financial Ledger & Receipt Exporter.**

- **Endpoint:** `GET /api/client/get-invoices`
- **Path:** `src/app/api/client/get-invoices/route.ts`
- **Authentication:** Verified Supabase JWT session
- **Output:** List of payment history, timestamps, PDF receipts, and status.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Route: /dashboard](Route_dashboard.md)
- [Schema: invoices](Schema_invoices.md)
