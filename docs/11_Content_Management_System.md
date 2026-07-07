# **11. Content Management System**

## **Purpose**

The Content Management System (CMS) manages portfolio updates. Rather than relying on a heavy cloud-hosted editor, the project uses a Streamlit-based local dashboard (`scripts/synchronizer.py`) that synchronizes remote databases with local code repositories.

---

# **The Local Synchronizer**

The Synchronizer is built with Streamlit and executes locally on the developer's computer. It is structured into multiple functional tabs:

1. **Edit Resume Manually**: Directly modifies the resume json structure stored in the Supabase singleton `profile` row.
2. **Sync Projects**: Synchronizes GitHub repositories, reads tags, and pushes project details to Supabase.
3. **Sync Certificates**: Uploads certificates, saves image assets locally, and syncs metadata to the database.
4. **Manage Skills**: Edits skills, lists pending auto-scanned tags, and updates category mappings.
5. **Update Photos**: Manages visual variants of photos (Azure vs. Noir variants) stored in `public/images/`.
6. **Blog Editor**: A markdown composer that reads and writes posts directly to `src/content/posts/`.

---

# **Content Parity Flows**

To prevent divergence between the remote Supabase database and local JSON fallbacks, the system guarantees sync parity across two directions:

### **1. Local Synchronizer Tab Flow (CMS-First)**
Edits made via the Streamlit GUI follow a strict transaction pattern:
```text
       [Synchronizer Dashboard Edit]
                     │
                     ▼
       ┌───────────────────────────┐
       │   Write to DB (Supabase)  │
       └─────────────┬─────────────┘
                     ├─────────────────────────┐
                 (Success)                 (Failure)
                     ▼                         ▼
       ┌───────────────────────────┐     ┌───────────────────────────┐
       │   Write to Fallback JSON  │     │   Report DB Error to UI   │
       └─────────────┬─────────────┘     │  Rollback Local File Write│
                     │                   └───────────────────────────┘
                     ▼
       ┌───────────────────────────┐
       │ Trigger Cache Revalidate  │
       └───────────────────────────┘
```
- **DB Write First**: Updates are sent to Supabase using `SUPABASE_SERVICE_ROLE_KEY`.
- **Local JSON Sync**: If and only if the database write succeeds, the matching fallback JSON file under `src/data/` is updated.
- **Git Push Trigger**: Staging, committing, and pushing the updated JSON files updates the main branch.
- **Offline Mode**: A toggle in the Streamlit sidebar disables Supabase connectivity, allowing direct, offline modifications to local JSON fallback files only.

### **2. Direct Local JSON Commits Flow (Git-First)**
For offline edits or manual codebase changes where the developer modifies `src/data/*.json` directly:
- **Push to Main**: The developer commits and pushes changes to GitHub.
- **CI/CD Sync Action**: The GitHub Action `.github/workflows/db_sync.yml` catches the push event.
- **Supabase Seeder**: It automatically executes `python3 scripts/seed_supabase.py` using repository secrets, seeding the live Supabase tables to restore parity.

---

# **Asset Pipeline & Git Integration**

The **Update Photos** tab supports direct integration with Git:
* **Asset Location**: Image files are saved under `public/images/` (Azure variants are styled/colored; Noir variants are grayscale/monochrome).
* **Git Commit Path**: When a change to photos is finalized and **Dry-Run Mode** is disabled in the sidebar, the Python script executes git commands to:
  1. Stage the added/updated assets (`git add public/images/...`).
  2. Commit changes with a descriptive message (`git commit -m "chore: update portfolio image assets"`).
  3. Push to GitHub (`git push`), triggering the Vercel CI/CD deployment pipeline.

---

# **On-Demand Cache Purging**

After a successful DB write and local fallback update, the Synchronizer calls the Next.js cache revalidation endpoint:
* **Trigger call**: An HTTP POST request is sent to `https://prateeq.in/api/revalidate?secret=SYNC_API_KEY` (or the localhost dev equivalent).
* **Result**: The Next.js CDN and unstable_cache layers drop the stale cached items and fetch fresh records immediately.

---

# **Decoupling Constraints**

To maintain a clean separation of concerns, Python environments are kept local:
* **Zero Runtime Python**: Python scripts (`streamlit`, `Pillow`, `sync_supabase.py`, etc.) are developer tools only.
* **Build Exclusions**: Next.js production builds and Vercel deployments ignore Python files. No Python dependencies are installed during `npm run build`.
* **Zero Runtime Public Exposure**: No runtime code path, route handler, or public API within Next.js can invoke or depend on execution of Streamlit helpers.

---

# **Acceptance Criteria**
- Streamlit Synchronizer launches successfully using `streamlit run scripts/synchronizer.py`.
- Synchronizer enforces database-first writes before writing to fallback files.
- Offline Mode toggle skips Supabase connections, modifying local JSON fallback files only.
- Direct JSON modifications are seeded to Supabase automatically on pushing to GitHub.
- Image assets are staged and committed properly via Git integration when Dry-Run is disabled.
- Decoupling constraints prevent python utilities from being included in frontend bundle builds.
