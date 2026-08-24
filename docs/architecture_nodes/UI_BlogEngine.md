---
id: UI_BlogEngine
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/blog/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/"
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
  - ../09_Section_Specifications/11_Blog
  - Route_blog
  - Lib_markdown
  - Schema_blog_posts
---

# UI: `BlogEngine.tsx` / `BlogPost.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/)**

#ui #frontend #blog #markdown

> **Interactive Markdown Article Layout with Code Highlighting & Deep Links.**

- **Path:** `src/app/blog/` & `src/components/blog/`
- **Features:** Syntax highlighted code blocks, responsive typography, estimated reading time badge, and project case study deep linking.

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/11_Blog](../09_Section_Specifications/11_Blog.md)
- [Route: /blog](Route_blog.md)
- [Lib: markdown.ts](Lib_markdown.md)
- [Schema: blog_posts](Schema_blog_posts.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

