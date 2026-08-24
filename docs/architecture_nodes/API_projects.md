---
id: API_projects
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/projects/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/projects/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/projects/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
downstream:
  - Schema_projects
  - Lib_data
---

# API: `GET /api/projects` & `[slug]`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/projects/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/projects/route.ts)**

#api #content #projects #cache

> **Portfolio Case Studies REST Endpoint with Dual-Persona Payload.**

- **Path:** `src/app/api/projects/route.ts` & `src/app/api/projects/[slug]/route.ts`
- **Cache Invalidation:** Revalidates tag `projects`.

---

## 🔗 Related Architecture & Cross-References
- [Schema: projects](Schema_projects.md)
- [Lib: data.ts](Lib_data.md)
