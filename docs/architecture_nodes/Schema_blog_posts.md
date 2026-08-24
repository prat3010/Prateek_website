---
id: Schema_blog_posts
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
runbook: docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
invariants:
  - "All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS."
  - "Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies."
  - "Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables."
test_suites:
  - scripts/audit_contracts.py
  - scripts/audit_db.py
downstream:
  - Route_blog
  - API_blog_publish
  - ../AUTOMATED_AI_BLOGGING_ROADMAP
---

# Schema: `blog_posts` (Technical Articles)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #blog #content #seo

> **SEO-Indexed Technical Case Studies & Markdown Article Persistence.**

- **Fields:** `slug`, `title`, `excerpt`, `content`, `tags`, `read_time`, `is_published`, `published_at`

---

## 🔗 Related Architecture & Cross-References
- [Route: /blog](Route_blog.md)
- [API: blog/publish](API_blog_publish.md)
- [AUTOMATED_AI_BLOGGING_ROADMAP](../AUTOMATED_AI_BLOGGING_ROADMAP.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_DATABASE_MIGRATION](docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md)

1. **All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.**
2. **Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.**
3. **Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables.**

