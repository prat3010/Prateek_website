---
id: PRD_28_Automated_AI_Blogging_Engine
title: "PRD: Automated AI Blogging & Newsjacking Engine (/blog, /api/blog/*)"
tier: 5_content_platform
platform: Prateek_website
status: production
auth_level: public_read_admin_write
blast_radius: MEDIUM
file_path: src/app/blog/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/blog/"
runbook: docs/runbooks/RUNBOOK_BLOG_PUBLISHING.md
tags:
  - prd/blog
  - tier/5_content_platform
  - ai/newsjacking
  - seo/jsonld
  - platform/prateek_website
invariants:
  - "Unpublished drafts MUST remain invisible on the public /blog index (status must equal 'published' or be null)."
  - "Every generated article MUST incorporate at least one authoritative internal deep-link to /scoping, /rag, or a portfolio repository."
  - "Generated articles MUST strictly exclude LLM clichés (e.g., 'delve', 'tapestry', 'testament', 'game-changer')."
  - "Publishing route /api/blog/publish MUST revalidate Next.js cache tags 'blog' and 'portfolio-data' atomically."
test_suites:
  - src/app/api/__tests__/blog.test.ts
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/AUTOMATED_AI_BLOGGING_ROADMAP.md
  - docs/BLOG_DEEP_LINKING_MAP.md
  - docs/17_SEO_Strategy.md
---

# 28. Product Requirements Document: Automated AI Blogging & Newsjacking Engine

#prd #blog #ai_newsjacking #gemini #seo #deep_linking #content_platform #prateeq_website

> **Comprehensive system specification for the Automated Daily AI Newsjacking Pipeline, Brand Voice Calibration, Deep-Linking Project Cross-Referencing Taxonomy, 1-Click Email Publish Gate, and High-Intent SEO Content Platform.**

---

## 1. Executive Summary & Strategic Objectives

Traditional engineering portfolios suffer from static content decay; posts written during a launch become stale, while maintaining an active technical blog requires 8–10 hours per week of manual drafting.

The **Automated AI Blogging & Newsjacking Engine** turns daily technology news (breakthroughs in vector databases, LLM inference, Next.js architecture, and GPU orchestration) into high-authority, code-grounded case studies that directly feed Prateek's commercial consulting funnel:
1. **Automated News Ingestion:** Daily cron jobs evaluate HackerNews, arXiv, HuggingFace, and GitHub Trending to extract the top high-intent development story of the day.
2. **Prateek Voice & Tone Calibration:** Prompts configure Gemini 3.6 Flash to write in Prateek's authentic engineering style: technical, benchmark-driven, code-first, and devoid of corporate AI fluff.
3. **Internal Commercial Deep-Linking:** Automatically maps technical keywords to Prateek's production systems (e.g. vector databases ➔ `/rag`, Next.js 16/Supabase ➔ `/scoping`, local OCR ➔ `PrateeqSync AI`).
4. **Human-In-The-Loop 1-Click Publishing:** Eliminates Google *Scaled Content Abuse* penalties by sending an email preview with signed 1-click `[🚀 Publish to Live]` webhook links (`/api/blog/publish`), ensuring zero unvetted content goes live.

---

## 2. Architecture & Pipeline Sequence

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       1. NEWS MONITORING & SCRAPER                          │
 │      • scripts/ai_blog_generator.py (Triggered via GitHub Action Cron)      │
 │      • Sources: HackerNews, arXiv CS.AI, HuggingFace Daily, TechCrunch      │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Top Scored Story)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      2. GEMINI 3.6 SYNTHESIS ENGINE                         │
 │      • Prompt: Inject Banned-Words Filter & Prateek Brand Voice Persona     │
 │      • Deep-Linking Taxonomy: Automatically injects markdown internal links │
 │      • Output: Markdown with Frontmatter (title, slug, date, tags, excerpt) │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Draft Post with prefix "draft-")
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      3. SUPABASE BLOG DRAFT REPOSITORY                      │
 │      • Saved to `blog_posts` table with status: 'draft'                     │
 │      • Invisible to public /blog index queries                              │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      4. 1-CLICK EMAIL REVIEW (RESEND)                       │
 │      • Dispatches preview email to prateeqsharma@gmail.com                  │
 │      • Action Buttons: [🚀 Publish to Live] | [✏️ Edit in Synchronizer]     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Admin clicks [🚀 Publish to Live])
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     5. ATOMIC PUBLISH & CACHE PURGE                         │
 │      • GET /api/blog/publish?slug=draft-...&secret=...                      │
 │      • Strips "draft-" from slug, updates status: 'published'               │
 │      • Executes: revalidateTag('blog') & revalidateTag('portfolio-data')    │
 │      • Recompiles /feed.xml (RSS) and Next.js /sitemap.xml                  │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Brand Voice Matrix & Negative Keywords

### Tone & Style Rules
- **Direct & Opinionated:** Avoid hedge words ("it is important to note", "one might argue"). State engineering trade-offs authoritatively.
- **Code-First:** Every post must contain real, executable snippets (TypeScript, Python, SQL, or Dockerfile).
- **Metric Grounding:** Prefer empirical numbers ("reduced cold-start TTFT to 142ms") over abstract claims ("dramatically faster").

### Strictly Banned LLM Clichés
Prompts enforce a hard ban on the following words and phrases:
```text
["delve", "tapestry", "game-changer", "testament", "rapidly evolving", 
 "in conclusion", "beacon", "unleash", "demystify", "embark", 
 "it is worth noting", "at the end of the day", "revolutionize"]
```

---

## 4. Deep-Linking Commercial Taxonomy

The blog engine parses extracted entities against [`BLOG_DEEP_LINKING_MAP.md`](playbooks/BLOG_DEEP_LINKING_MAP.md) to insert high-intent contextual backlinks:

| Entity / Technology Topic | Portfolio Deep Link Target | Commercial Conversion Goal |
| :--- | :--- | :--- |
| **Vector DB, RAG, Ollama, pgvector, HNSW** | [`/rag`](../src/app/rag/page.tsx) & [`/rag/app`](../src/app/rag/app/page.tsx) | Drive RAG SaaS subscriptions and vector consulting audits. |
| **Next.js 16, React 19, Supabase, Tailwind** | [`/scoping?engine=fullstack`](../src/app/scoping/page.tsx) | Drive Full-Stack SaaS MVP scoping briefs. |
| **Edge Computing, WebRTC, Whisper, Voice** | [`/scoping?engine=saas&features=edge_voice`](../src/app/scoping/page.tsx) | Direct lead capture for sovereign edge AI builds. |
| **CLI Tools, QR Code Payments, Terminal UI** | [`/terminal`](../src/app/terminal/page.tsx) | Showcase engineering craftsmanship and headless checkout. |

---

## 5. API Specifications & Publish Route

### 5.1 1-Click Publish Webhook
* **Endpoint:** `GET /api/blog/publish`
* **Query Parameters:**
  - `slug`: Target draft slug (e.g. `draft-why-we-migrated-to-hnsw`)
  - `secret`: Shared secret key matching `process.env.SYNC_API_KEY`
* **Execution Flow:**
  1. Validate `secret === process.env.SYNC_API_KEY`.
  2. Query `blog_posts` for `slug = draft-slug`.
  3. Compute new clean slug: `slug.replace(/^draft-/, '')`.
  4. Strip `[DRAFT]` prefix from title if present.
  5. Update record: `status = 'published'`, `published_at = now()`.
  6. Call `revalidateTag('blog')` and `revalidateTag('portfolio-data')`.
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "published_slug": "why-we-migrated-to-hnsw",
    "public_url": "https://prateeq.in/blog/why-we-migrated-to-hnsw",
    "revalidated_tags": ["blog", "portfolio-data"]
  }
  ```

---

## 6. Database Schema & Supabase Table

```sql
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    cover_image TEXT,
    reading_time_minutes INTEGER DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[] DEFAULT '{}',
    author_name TEXT DEFAULT 'Prateek Sharma',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast search and listing
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- RLS: Public can only view published posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published' OR status IS NULL);

CREATE POLICY "Admin full write access to blog posts" ON blog_posts
    FOR ALL USING (auth.jwt() ->> 'email' = 'prateeqsharma@gmail.com');
```

---

## 7. SEO, Social & RSS Syndication

1. **JSON-LD Schema (`BlogPosting`):** Automatically rendered inside `<head>` with author, datePublished, publisher, image, and headline.
2. **RSS 2.0 & Atom (`/feed.xml`):** Generated dynamically by querying published posts, enabling syndication to Feedly, Substack readers, and RSS aggregators.
3. **OpenGraph & Twitter Card Generation:** Dynamic OG image generation combining post title, reading time, and dual-theme branding.

---

## 8. Verification & Automated Test Plan

1. **API Integration Tests (`src/app/api/__tests__/blog.test.ts`):**
   - Assert `publish` route rejects invalid or missing secret tokens with 401 Unauthorized.
   - Assert successful publish strips `draft-` prefix and updates database status to `published`.
   - Assert Next.js cache revalidation triggers.
2. **E2E Pipeline Test:**
   - Execute `python3 scripts/ai_blog_generator.py --dry-run` to test RSS ingestion and Gemini synthesis.
   - Assert generated Markdown contains valid internal links and zero banned keywords.
