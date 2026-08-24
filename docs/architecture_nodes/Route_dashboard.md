---
id: Route_dashboard
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/dashboard/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/page.tsx"
tags:
  - tier/3_workspace_control
  - security/bearer_jwt
  - domain/workspace
  - platform/website
downstream:
  - ../CLIENT_DASHBOARD_ROADMAP
  - ../09_Section_Specifications/13_Client_Workspace_Dashboard
  - UI_ClientWorkspaceDashboard
  - Schema_client_scopes
  - Schema_invoices
  - API_client_get_scopes
  - API_client_create_razorpay_order
---

# Route: `/dashboard` (Client Workspace Dashboard)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/dashboard/page.tsx)**

#route #frontend #client #workspace #auth

> **Authenticated Client Command Center for Active Projects, Milestones & Ledgers.**

- **Path:** `src/app/dashboard/page.tsx` & `src/components/dashboard/`
- **Key Features:**
  - Google OAuth / PKCE session restoration (`AuthContext.tsx`)
  - Active project milestone progress bars & deliverable review
  - Interactive Phase 2 Change Order re-scoping customizer
  - Financial ledger with one-click Razorpay checkout & invoice PDF downloads
  - Grounded project copilot (`/api/client/copilot`)

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [09_Section_Specifications/13_Client_Workspace_Dashboard](../09_Section_Specifications/13_Client_Workspace_Dashboard.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [API: client/get-scopes](API_client_get_scopes.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
