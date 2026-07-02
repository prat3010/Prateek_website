# **22. Implementation Guidelines for AI Agents**

## **Purpose**

This document serves as an instruction manual and styling contract for AI coding agents (such as ourselves) working on Adaptive Portfolio. It establishes boundaries for workspace safety, coding constraints, data persistence, and documentation updates.

---

# **Workspace Hygiene & Pre-flight Rules**

1. **Check Git Status**: Before making any code modifications or running test scripts, execute `git status --short`. Do not overwrite uncommitted work.
2. **Selective Replacements**: Use targeted line replacements (`replace_file_content` or `multi_replace_file_content`). Avoid full file overwrites (`write_to_file` with `Overwrite: true`) unless creating brand new files.
3. **No Lock File Tampering**: Do not edit `package-lock.json` directly unless dependencies have been added or removed via npm.

---

# **Coding Standards (React 19 & Next.js 16)**

1. **Verify Version Rules**: Before writing pages, routing configurations, metadata blocks, or server actions, consult local Next.js references located in `node_modules/next/dist/docs/` to verify API signatures.
2. **State Side-Effects Banned**: Do not call `setState` synchronously within a `useEffect` function body. Compute initial states lazily.
3. **Encapsulate Styling**: Components must use scoped CSS Modules (`.module.css`). Banned patterns include inline styles (unless dynamic variables are required) and styling utility definitions appended to `src/app/globals.css`.

---

# **Database & Key Safety Rules**

1. **Service Role Exclusion**: The `SUPABASE_SERVICE_ROLE_KEY` must never be referenced, imported, or logged inside client components or public layouts.
2. **Server-Only Verification**: All direct database queries (`supabase` client references) are server-only. Ensure files that fetch data declare `import 'server-only'` and throw window validation errors.
3. **Row-Level Security (RLS)**: Row-Level Security must remain enabled on all tables. Never create public write policies.

---

# **Data Fallback & Caching Contract**

1. **Dual-Write Support**: Any script, feature, or Synchronizer update writing to the database must sync the identical record to the local JSON files in `src/data/` as a fallback.
2. **Next.js Cache Tags**: Database queries fetched client-side are wrapped in Next.js `unstable_cache` declaring cache keys matching table references (`projects`, `skills`, etc.).
3. **Cache Purges**: Following a database modification, the cache must be revalidated by querying `/api/revalidate?secret=SYNC_API_KEY`.

---

# **Documentation Integrity Policy**

Whenever introducing new features, scripts, CLI terminal tools, database schema updates, or environment settings, the AI agent **must**:
* Update `README.md` to reflect configuration additions or installation details.
* Update `AGENTS.md` to add folder details or scripting notes.
* Update `docs/99_DECISIONS.md` if key architectural changes were introduced.

---

# **Acceptance Criteria**
- AI agents verify workspace states before starting work.
- Key safety guidelines are strictly followed.
- RLS boundaries are respected, and no client-side leaks occur.
- Modularity styling is maintained across additions.
- Documentation files are updated in parallel with code changes.
