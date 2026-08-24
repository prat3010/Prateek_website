---
id: Route_blog
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/blog/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/portfolio
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../09_Section_Specifications/11_Blog
  - ../BLOG_DEEP_LINKING_MAP
  - ../AUTOMATED_AI_BLOGGING_ROADMAP
  - UI_BlogEngine
  - Lib_markdown
  - Schema_blog_posts
  - API_blog_publish
---

# Route: `/blog` & `/blog/[slug]` (Technical Markdown Publication)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/page.tsx)**

#route #frontend #blog #seo #markdown

> **Dynamic SEO-Optimized Engineering Blog & Technical Case Studies.**

- **Path:** `src/app/blog/page.tsx` & `src/app/blog/[slug]/page.tsx`
- **Key Features:**
  - Markdown article rendering with syntax highlighting and frontmatter parsing
  - Supabase database persistence with local file fallback in `src/content/posts/`
  - Contextual deep linking into Project case studies and Scoping Wizard presets

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/11_Blog](../09_Section_Specifications/11_Blog.md)
- [BLOG_DEEP_LINKING_MAP](../BLOG_DEEP_LINKING_MAP.md)
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)
- [UI: BlogEngine](UI_BlogEngine.md)
- [Lib: markdown.ts](Lib_markdown.md)
- [Schema: blog_posts](Schema_blog_posts.md)
- [API: blog/publish](API_blog_publish.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

