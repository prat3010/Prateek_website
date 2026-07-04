# Prateek Sharma's Portfolio

A highly interactive, storyteller-driven personal portfolio website designed with a custom **comic-book / noir visual aesthetic**. Features include responsive layouts, dynamic paper texture overlays, smooth scrolling, custom cursor trails, and a live 3D skyline theme transition.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router) & React 19
- **Logic & Types:** TypeScript
- **Styling:** CSS Modules & global comic theme system (Vanilla CSS variables)
- **Database / Analytics:** Supabase (portfolio content storage + custom telemetry logging via Next.js Proxy)
- **Contact Service:** Resend Email API
- **Animations & Scrolling:** Framer Motion & Lenis smooth scroll
- **3D & Visual Effects:** Three.js (Gremlin Parade) and SVG filter distortions

---

## 🛠️ Getting Started

### 1. Environment Setup

Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase (Analytics + Portfolio Data)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Contact Form
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL_TO=your_recipient_email

# Gemini AI (for local Synchronizer engine)
GEMINI_API_KEY=your_gemini_api_key

# Shared secret for synchronizer / API route writes (any string)
SYNC_API_KEY=your_sync_api_key

# Optional GitHub Token (to avoid anonymous rate limit on status tracker)
GITHUB_TOKEN=your_github_token
```

### 2. Next.js Web App

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **First time setup:** Run the SQL from `supabase_schema.sql` in your Supabase dashboard SQL Editor (this creates all tables, indexes, and stored procedures for analytics aggregation), then seed data with `python3 scripts/seed_supabase.py`.
> 
> **Backup/Pull live data:** If you edit data in the Supabase Dashboard directly, pull down live database entries and update local fallback JSON files by running `python3 scripts/backup_db.py`.

### 3. Local Synchronizer (Content-Management Helper)

The project includes a Streamlit-based local dashboard to manage resume details, upload certificates, sync GitHub repositories, update project photos, and write blog posts with Gemini AI assistance.

> 💡 **Offline Mode:** By default, saving changes commits to the Supabase database first and updates local JSON files only on success. Deletes are propagated to Supabase explicitly, generated AI payloads are validated before writes, local JSON/Markdown writes are atomic, certificate files are staged before being moved into public assets, and Git publishing only commits intended synchronizer paths. If you are developing offline or without a database connection, check the **Offline Mode (Local JSON Only)** toggle in the sidebar to bypass database writes and modify local files directly.

The synchronizer entry point is `scripts/synchronizer.py`. Shared safety helpers live in `scripts/sync_supabase.py`, `scripts/sync_json.py`, `scripts/sync_validation.py`, `scripts/sync_assets.py`, and `scripts/sync_git.py`.

#### Run the Synchronizer:

```bash
# Install Python dependencies
pip install streamlit pillow

# Run the local server
streamlit run scripts/synchronizer.py
```

---

## 📦 Production Builds

When compiling the web app for deployment, the build process automatically executes a script to generate your commit history and writes it to `src/data/git-log.json`:

```bash
npm run build
```

This ensures the terminal telemetry console on the portfolio site (accessible at `/terminal`) displays your actual git log. The interactive terminal console also supports a `qrcode` command to render a payment/donation QR code inline.

The public `/api/git-log` route reads only the generated `src/data/git-log.json` artifact and does not execute `git` commands at request time.

### Skyline Wobbly Path Cache

The noir skyline keeps its hand-drawn SVG detail lines by prebaking the expensive wobble displacement math into `src/components/effects/wobblyPaths.generated.ts`. After changing any `WobblyPath`, `WobblyLine`, `WobblyRect`, or `WobblyPolygon` usage under `src/components/effects/skyline/`, refresh the generated cache:

```bash
npm run generate:wobbly-paths
```

Runtime rendering uses the generated cache first and falls back to live wobble generation only for uncached dynamic paths.

---

## 🌐 Deployment & Hosting

The website is fully deployed and hosted on **Vercel**.
- **Production Domain:** [https://prateeq.in](https://prateeq.in)
- **Domain Registry:** GoDaddy (configured with DNS records pointing to Vercel)
- **Automatic Deploys:** Vercel automatically deploys updates on every push to the `main` branch.

---

## 🤖 CI/CD Database Sync

The project includes an automated GitHub Actions workflow (`.github/workflows/db_sync.yml`) that triggers on pushes to the `main` branch. 

If any changes are made to the fallback JSON data files (`src/data/*.json`), this workflow will automatically execute `scripts/seed_supabase.py` in the runner to update your live database records on Supabase.

Content tables expose public read policies only. Runtime API routes and local tooling perform writes with `SUPABASE_SERVICE_ROLE_KEY`; do not add anonymous insert/update/delete policies when applying `supabase_schema.sql`. Authenticated content write API routes revalidate the relevant Next.js cache tags after successful mutations.

### Required GitHub Secrets:
To enable this action, make sure to add these Repository Secrets in your GitHub repository configuration (`Settings > Secrets and variables > Actions`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
