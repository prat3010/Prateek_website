---
id: API_blog_publish
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: service_role
blast_radius: medium
file_path: src/app/api/blog/publish/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/blog/publish/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/blog/publish/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/service_role
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../AUTOMATED_AI_BLOGGING_ROADMAP
  - Schema_blog_posts
  - Route_blog
---

# API: `POST /api/blog/publish`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/blog/publish/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/blog/publish/route.ts)**

#api #blog #cms #automation

> **Automated AI Blog Post Ingestion & Next.js ISR Cache Revalidator.**

- **Endpoint:** `POST /api/blog/publish`
- **Path:** `src/app/api/blog/publish/route.ts`
- **Authentication:** `SYNC_API_KEY` Shared Secret Header
- **Post-Action:** Revalidates Next.js cache tags (`blog`, `portfolio-data`).

---

## 🔗 Related Architecture & Cross-References
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)
- [Schema: blog_posts](Schema_blog_posts.md)
- [Route: /blog](Route_blog.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

