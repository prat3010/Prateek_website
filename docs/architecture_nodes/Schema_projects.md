---
id: Schema_projects
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
downstream:
  - ../10_Content_Platform_Architecture
  - Lib_data
  - API_projects
---

# Schema: `projects` (Portfolio Work)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #content #projects

> **Dual-Audience Project Case Studies (Developer & Business narratives).**

- **Fields:** `slug`, `title`, `tagline`, `description_dev`, `description_biz`, `tech_stack`, `metrics`, `github_url`, `live_url`, `is_featured`

---

## 🔗 Related Architecture & Cross-References
- [10_Content_Platform_Architecture](../10_Content_Platform_Architecture.md)
- [Lib: data.ts](Lib_data.md)
- [API: projects](API_projects.md)
