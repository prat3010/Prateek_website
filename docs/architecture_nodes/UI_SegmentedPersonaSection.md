---
id: UI_SegmentedPersonaSection
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/SegmentedPersonaSection.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/SegmentedPersonaSection.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/SegmentedPersonaSection.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Route_rag
  - ../24_RAG_App_Studio_PRD
---

# UI: `SegmentedPersonaSection.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/SegmentedPersonaSection.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/SegmentedPersonaSection.tsx)**

#ui #frontend #marketing #persona #interactive

> **Segmented Target Persona Matrix Component on `/rag` Landing Page.**

- **Path:** `src/components/rag/SegmentedPersonaSection.tsx`
- **Function:** Renders interactive persona tabs for:
  1. Developers (FastAPI, pgvector, local embeddings, zero-bloat).
  2. B2B Founders (Rapid deployment, 1-line widget, zero infrastructure overhead).
  3. Enterprise Leads (Multi-tenancy RLS, RB-VAC, SOC2/GDPR compliance).

---

## 🔗 Related Architecture & Cross-References
- [Route: /rag](Route_rag.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

