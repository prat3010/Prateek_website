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
```

### 2. Next.js Web App

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **First time setup:** Run the SQL from `supabase_schema.sql` in your Supabase dashboard SQL Editor, then seed data with `python3 scripts/seed_supabase.py`.
> 
> **Backup/Pull live data:** If you edit data in the Supabase Dashboard directly, pull down live database entries and update local fallback JSON files by running `python3 scripts/backup_db.py`.

### 3. Local Synchronizer (Content-Management Helper)

The project includes a Streamlit-based local dashboard to manage resume details, upload certificates, sync GitHub repositories, update project photos, and write blog posts with Gemini AI assistance.

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

This ensures the terminal telemetry console on the portfolio site displays your actual git log.

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

### Required GitHub Secrets:
To enable this action, make sure to add these Repository Secrets in your GitHub repository configuration (`Settings > Secrets and variables > Actions`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
