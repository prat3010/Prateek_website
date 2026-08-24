---
id: API_outreach_dispatch
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/outreach/dispatch/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/dispatch/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/dispatch/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/outreach
  - platform/website
downstream:
  - ../AI_OUTREACH_AGENT_ROADMAP
  - Schema_outreach_leads
  - Route_admin
---

# API: `POST /api/outreach/dispatch`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/dispatch/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/dispatch/route.ts)**

#api #outreach #email #resend

> **One-Click Autonomous Outreach Campaign Email Dispatcher.**

- **Endpoint:** `POST /api/outreach/dispatch`
- **Path:** `src/app/api/outreach/dispatch/route.ts`
- **Authentication:** Admin Google OAuth Session Gate
- **Function:** Dispatches personalized cold outreach emails with deep-linked Scoping Lab configurations via Resend.

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [Route: /admin](Route_admin.md)
