---
id: API_profile
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/profile/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/profile/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/profile/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Lib_data
  - Tool_Synchronizer
---

# API: `GET /api/profile`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/profile/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/profile/route.ts)**

#api #content #profile #resume

> **Core Developer Resume Profile, Biography & Quotation Terms API.**

- **Path:** `src/app/api/profile/route.ts`
- **Data Source:** Supabase `profile` table with fallback to `resume.json`.

---

## 🔗 Related Architecture & Cross-References
- [Lib: data.ts](Lib_data.md)
- [Tool: Synchronizer](Tool_Synchronizer.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

