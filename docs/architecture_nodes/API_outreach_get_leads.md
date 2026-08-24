---
id: API_outreach_get_leads
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/app/api/outreach/get-leads/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/get-leads/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/get-leads/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/outreach
  - platform/website
invariants:
  - "Outreach dispatch MUST strictly verify that caller email is an authorized operator (isAdminEmail)."
  - "AI pitch generation MUST be grounded in verified prospect company signals."
test_suites:
  - src/app/api/__tests__/admin-outreach.test.ts
downstream:
  - ../AI_OUTREACH_AGENT_ROADMAP
  - UI_AdminPortal
  - Schema_outreach_leads
---

# API: `GET /api/outreach/get-leads`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/get-leads/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/outreach/get-leads/route.ts)**

#api #outreach #admin #leads

> **Admin Lead Queue Query Endpoint with Filter & Status Sorting.**

- **Endpoint:** `GET /api/outreach/get-leads`
- **Path:** `src/app/api/outreach/get-leads/route.ts`
- **Function:** Returns paginated list of outreach leads (`staged`, `approved`, `sent`, `replied`, `converted`).

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Outreach dispatch MUST strictly verify that caller email is an authorized operator (isAdminEmail).**
2. **AI pitch generation MUST be grounded in verified prospect company signals.**

