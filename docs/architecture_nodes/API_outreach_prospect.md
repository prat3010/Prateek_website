---
id: API_outreach_prospect
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/outreach/prospect/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/prospect/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/prospect/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/outreach
  - platform/website
downstream:
  - ../AI_OUTREACH_AGENT_ROADMAP
  - Schema_outreach_leads
  - UI_AdminPortal
---

# API: `POST /api/outreach/prospect`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/prospect/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/prospect/route.ts)**

#api #outreach #ai #leads

> **Autonomous AI Prospect Ingestion & ICP Scoring Engine.**

- **Endpoint:** `POST /api/outreach/prospect`
- **Path:** `src/app/api/outreach/prospect/route.ts`
- **Function:** Parses potential lead profiles, computes Ideal Customer Profile (ICP) match scores, and stages leads in `outreach_leads`.

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [UI: AdminPortal](UI_AdminPortal.md)
