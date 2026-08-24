---
id: Lib_markdown
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
file_path: src/lib/markdown.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/markdown.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/markdown.ts"
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
downstream:
  - Route_blog
  - Schema_blog_posts
---

# Lib: `markdown.ts` (Blog Parser & Metadata Extractor)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/markdown.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/markdown.ts)**

#lib #markdown #blog #content

> **Server-Side Markdown Parser with Frontmatter & Reading Time Calculator.**

- **Path:** `src/lib/markdown.ts`
- **Function:** Reads local markdown files from `src/content/posts/` and merges with Supabase database entries.

---

## 🔗 Related Architecture & Cross-References
- [Route: /blog](Route_blog.md)
- [Schema: blog_posts](Schema_blog_posts.md)
