# **10. Content Platform Architecture**

## **Purpose**

The Content Platform Architecture defines how portfolio content is structured, queried, cached, and synced to serve the Adaptive Portfolio. The design guarantees a high-performance, resilient data flow with built-in offline fallbacks to prevent runtime crashes.

---

# **Unified Composed Data Model**

Content entities must resolve dynamically based on the active **Communication Identity** (Developer or Business) and **Visual Identity** (Azure or Noir). 

```text
               ┌───────────────────────┐
               │    Content Query      │
               └───────────┬───────────┘
                           ▼
             ┌───────────────────────────┐
             │ Composed Content Resolver │◄── [Audience State]
             └─────────────┬─────────────┘◄── [Theme State]
                           ▼
               ┌───────────────────────┐
               │   Resolved Output     │
               └───────────────────────┘
```

Rather than storing completely duplicated projects or skills, content records store structured variants directly in the schema (e.g., using JSONB fields or modular columns).

---

# **Database Schema Definitions (Supabase)**

The database is built on Supabase PostgreSQL. Below are the core schemas:

### **1. Projects (`projects` table)**
Stores project details and case studies. Storytelling details vary based on audience context.
```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "longDescription" TEXT NOT NULL DEFAULT '', -- Default markdown overview
  -- Adaptive fields for V2:
  description_business TEXT DEFAULT '',       -- Outcome-focused summary
  "longDescription_business" TEXT DEFAULT '', -- Business value case study markdown
  image TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]',
  "liveUrl" TEXT NOT NULL DEFAULT '',
  "githubUrl" TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#00E676',
  "isLive" BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'soon' CHECK (status IN ('live', 'soon', 'personal')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### **2. Skills & Services (`skills` table)**
Dual-purpose table. In developer mode, lists coding competencies. In business mode, translates competencies into client-focused services.
```sql
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  description TEXT NOT NULL DEFAULT '',        -- Technical scope
  description_business TEXT DEFAULT '',       -- Service value proposition
  category TEXT NOT NULL DEFAULT 'dynamic' CHECK (category IN ('orchestration', 'logic', 'product', 'dynamic')),
  color TEXT NOT NULL DEFAULT '#00E676',
  level TEXT,
  prereq TEXT,
  status TEXT,
  projects JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### **3. Certificates (`certificates` table)**
Holds credentials verified in technical profiles.
```sql
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date TEXT NOT NULL,
  "credentialId" TEXT,
  "verifyUrl" TEXT,
  image TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### **4. Profile (`profile` table)**
Singleton table (exactly 1 row) storing the resume fields and metadata.
```sql
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}', -- Composes resume items, contact copy, and standard settings
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

# **Dynamic Cache Subsystem**

To keep database queries to a minimum and maintain fast load speeds, Next.js page fetches utilize Next.js `unstable_cache`.

* **Unified Cache Tag**: `portfolio-data`
* **Entity Tags**: `projects`, `skills`, `certificates`, `profile`
* **Invalidation Strategy**: Cache is invalid on-demand using tag-based revalidation. The synchronizer calls the revalidation API when edits are published.

---

# **Server-Side Render (SSR) Resolution Path**

To prevent client-side layout shifts (CLS) and keep pages SEO-friendly:
1. **Cookie-Based Extraction**:
   - The Next.js server components or edge proxy middleware check for `theme` and `audience` cookies on incoming requests.
   - If present, data fetching is customized server-side, loading the matching visual variables and text variants into the initial server-rendered HTML.
2. **Dynamic Meta Tag Compilation**:
   - Page metadata (e.g. titles, descriptions) adapts server-side according to the extracted cookies, ensuring browser tabs and social sharing cards represent the user's active mode.
3. **Bot / Crawler Fallback**:
   - Crawlers lack cookie states. When no cookie is found, the server renders a canonical combination representing a balanced, comprehensive profile. This indexes technical skills and business offerings concurrently.

---

# **Graceful Offline Fallback Contract**

If connection to Supabase fails, or if keys are missing from local environments (`.env.local`), the app must degrade gracefully by falling back to local static JSON assets under `src/data/`:

* [projects.json](file:///Users/prateeksharma/Developer/Prateek_website/src/data/projects.json)
* [skills.json](file:///Users/prateeksharma/Developer/Prateek_website/src/data/skills.json)
* [certificates.json](file:///Users/prateeksharma/Developer/Prateek_website/src/data/certificates.json)
* [resume.json](file:///Users/prateeksharma/Developer/Prateek_website/src/data/resume.json)

The server data access layer (`src/lib/data.ts`) catches Supabase query exceptions, prints warning logs, and serves the corresponding JSON array. This guarantees that the portfolio remains fully active even in offline development or database outages.

---

# **CI/CD Push-to-Sync Pipeline**

To make manual JSON updates robust, the project maintains an automated GitHub Actions sync-on-push workflow:
* **Workflow Configuration**: Defined in `.github/workflows/db_sync.yml`.
* **Execution Boundary**: Runs automatically when changes to files under `src/data/` (such as `projects.json`, `skills.json`, `certificates.json`, or `resume.json`) are pushed to the `main` branch.
* **Sync Process**: The workflow launches a virtual environment, installs Python dependencies, and runs `python3 scripts/seed_supabase.py` using credentials configured under GitHub Repository Secrets (`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`). This automatically updates Supabase tables to match local parity.

---

# **Acceptance Criteria**
- Core tables match the SQL schema defined above.
- Adaptability columns or JSON properties support separate Developer/Business narratives.
- Server-side cookie extraction resolves initial HTML layouts and meta tags to prevent CLS.
- On-demand revalidation functions purge Next.js cached data.
- Fallback JSON files are loaded successfully when Supabase is offline.
- Push workflow seeds database tables automatically on commits to repository data files.
