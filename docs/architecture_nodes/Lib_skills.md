---
id: Lib_skills
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/lib/skills.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/skills.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/skills.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../06_Adaptive_Identity_System
  - Route_home
  - Schema_skills
---

# Lib: `skills.ts` (Persona Filter & Narrative Mapper)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/skills.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/skills.ts)**

#lib #skills #persona #identity

> **Audience-Aware Skill Filtering (`Developer` vs `Business`).**

- **Path:** `src/lib/skills.ts`
- **Functions:** `getSkillsHighlight(skills, persona)` maps technical tools to quantifiable business ROI.

---

## 🔗 Related Architecture & Cross-References
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [Route: /](Route_home.md)
- [Schema: skills](Schema_skills.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

