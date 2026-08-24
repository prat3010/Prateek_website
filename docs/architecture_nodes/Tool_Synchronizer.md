---
id: Tool_Synchronizer
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: service_role
blast_radius: medium
file_path: scripts/synchronizer.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/3_workspace_control
  - security/service_role
  - domain/tooling
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../11_Content_Management_System
  - API_revalidate
  - ../MIDDLEMAN_PARTNERSHIP_AGREEMENT
---

# Tool: `synchronizer.py` (Local Streamlit Content CMS)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/scripts/synchronizer.py)**

#tool #cms #streamlit #content #admin

> **Local Multi-Tab Content Management Dashboard with Gemini AI Assistance.**

- **Path:** `scripts/synchronizer.py` & `scripts/sync_tabs/`
- **Tabs:** Resume, Projects, Certificates, Skills, Photos, Blog Editor, Scoping Questionnaire, Partner Agreement, Analytics.

---

## 🔗 Related Architecture & Cross-References
- [11_Content_Management_System](../11_Content_Management_System.md)
- [API: revalidate](API_revalidate.md)
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

