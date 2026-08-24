---
id: Lib_data
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
file_path: src/lib/data.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/data.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/data.ts"
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
downstream:
  - ../10_Content_Platform_Architecture
  - Route_home
  - Schema_projects
  - Schema_skills
---

# Lib: `data.ts` (Cached Supabase Fetch Layer)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/data.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/data.ts)**

#lib #database #cache #server-only

> **Server-Only Content Fetching Layer with Aggressive Next.js `unstable_cache`.**

- **Path:** `src/lib/data.ts`
- **Tags:** `portfolio-data`, `projects`, `skills`, `certificates`, `profile`.
- **Fallbacks:** Seamlessly falls back to local JSON files (`src/data/*.json`) if database is unreachable.

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Route: /](Route_home.md)
- [Schema: projects](Schema_projects.md)
- [Schema: skills](Schema_skills.md)
