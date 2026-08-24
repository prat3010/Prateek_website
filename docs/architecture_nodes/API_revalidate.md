---
id: API_revalidate
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: service_role
file_path: src/app/api/revalidate/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/revalidate/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/revalidate/route.ts"
tags:
  - tier/4_api_gateway
  - security/service_role
  - domain/content_api
  - platform/website
downstream:
  - ../10_Content_Platform_Architecture
  - Tool_Synchronizer
---

# API: `POST /api/revalidate`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/revalidate/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/revalidate/route.ts)**

#api #cache #isr #security

> **Secret-Gated Next.js On-Demand Cache Purge & Revalidation Endpoint.**

- **Path:** `src/app/api/revalidate/route.ts`
- **Authentication:** `secret=SYNC_API_KEY`
- **Tags Revalidated:** `portfolio-data`, `projects`, `skills`, `certificates`, `profile`, `blog`

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Tool: Synchronizer](Tool_Synchronizer.md)
