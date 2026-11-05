#!/usr/bin/env python3
"""
Revamp AI Twin Knowledge & Persona Script.
=========================================
Ingests 4 rich, witty, layman-accessible knowledge documents into
the Portfolio AI Twin tenant (6797e2c8-745a-4bd1-aa4c-3854b8d79c22)
and updates the master system prompt with a playful, intellectual voice.
"""

import json
import logging
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import List, Set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_revamped_twin")

BASE_DIR = Path("/Users/prateeksharma/Developer/Prateek_website")
RETRIEVER_DIR = Path("/Users/prateeksharma/Developer/retriever")

def get_env_var(key: str, default: str = "") -> str:
    val = os.environ.get(key)
    if val:
        return val.strip()
    env_local = BASE_DIR / ".env.local"
    if env_local.is_file():
        for line in env_local.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() == key:
                    return v.strip().strip("'\"")
    return default

RETRIEVER_API_URL = get_env_var("RETRIEVER_API_URL", "https://rag.prateeq.in").rstrip("/")
RETRIEVER_ADMIN_KEY = get_env_var("RETRIEVER_ADMIN_KEY", "")
PORTFOLIO_TENANT_ID = get_env_var("RETRIEVER_PORTFOLIO_TENANT_ID", "6797e2c8-745a-4bd1-aa4c-3854b8d79c22")
PORTFOLIO_API_KEY = get_env_var("RETRIEVER_PORTFOLIO_API_KEY", "")
RETRIEVER_USER_ID = get_env_var("RETRIEVER_SCOPING_USER_ID", "36e62429-419e-48ef-af92-533afca9e028")

# ─── 4 REVAMPED KNOWLEDGE DOCUMENTS ─────────────────────────────────────────

DOC_19_ROSETTA_STONE = """# The Layman's Technology Rosetta Stone: Translating Deep Systems into Human Metaphors

Author: Prateeq Sharma — Forward Deployed AI Engineer & Systems Architect
Classification: Core Conceptual Framework & Layman Communication Rosetta Stone

## 1. What is RAG (Retrieval-Augmented Generation)?
- **The Stuffy Tech Definition:** "A pattern combining dense semantic vector retrieval with generative autoregressive transformers to synthesize grounded responses."
- **The Real-World Human Metaphor:**
  Imagine you have an open-book exam.
  Standard AI (like default ChatGPT) is like a student who studied Wikipedia three months ago, closed all the books, had two drinks, and now tries to answer specific questions from pure memory. When they don't know the answer, they make something up with absolute confidence. That's a hallucination.
  Retriever (RAG) turns that test into an open-book exam with a photographic index. When you ask a question, the AI runs to your private bookshelf, grabs the exact 3 paragraphs that contain the truth, lays them flat on the desk, and answers strictly from those pages. If the answer isn't in your book, it says "I don't know" instead of lying.
- **Why It Matters to You:** You get AI intelligence without hallucinations, and your private company secrets never leave your control.

## 2. What is Vector Search & Dense Embeddings?
- **The Stuffy Tech Definition:** "High-dimensional geometric projection mapping token semantics to unit spheres using cosine distance."
- **The Real-World Human Metaphor:**
  Think about how a classic search bar works: if you search for "automobile", it only finds pages that contain the exact letters a-u-t-o-m-o-b-i-l-e. If a page says "sports car", "convertible", or "ride", it misses it entirely.
  Vector search doesn't look at spelling; it looks at *meaning*. It plots every thought into a giant 3D map of human concepts. "Cold brew", "espresso", and "caffeine boost" all cluster in the exact same cozy neighborhood on that map. So when you ask a question in messy, conversational human English, it finds the exact answer even if you used completely different words.

## 3. What is PostgreSQL Row-Level Security (RLS)?
- **The Stuffy Tech Definition:** "Declarative database policies enforcing discretionary access control filters per-session at the SQL execution layer."
- **The Real-World Human Metaphor:**
  Most software handles security like a bouncer at the front door of a hotel. Once the bouncer lets someone inside the building, the software hopes that every hallway door is properly locked by the app's code. If a junior developer forgets one `WHERE user_id = 123` filter, a customer can accidentally see someone else's confidential financial data.
  Row-Level Security (RLS) is different: it puts a physical, fingerprint-coded lock on *every individual drawer inside every room*. Even if a rogue hacker or buggy piece of code tries to open a drawer belonging to Tenant B, the database itself physically refuses to unlock it. Security is built into the concrete foundation, not glued on as an afterthought.

## 4. What is Next.js Server Components & Edge Rendering?
- **The Stuffy Tech Definition:** "React server-side rendering architecture compiling component trees into streaming HTML payloads at edge nodes."
- **The Real-World Human Metaphor:**
  Classic web development was like a restaurant delivering raw groceries and a recipe book to your dining table and asking your phone to cook the meal in its browser. Your phone got hot, battery drained, and you stared at a white loading spinner.
  Server Components cook the 5-star meal in a high-powered kitchen near your house and deliver a hot, plated dish instantly. Your phone just opens the box and eats. The page loads in milliseconds, feels smooth as butter, and works even on spotty mobile data.

## 5. What are Local Embeddings (Ollama on VPS)?
- **The Stuffy Tech Definition:** "Self-hosted ONNX/GGUF transformer models executing inference on sovereign compute without third-party API ingress."
- **The Real-World Human Metaphor:**
  Most AI companies rent their power from the utility grid at surge pricing: every time a customer reads a document, they pay OpenAI or Anthropic a micropayment. Over a year, that bill balloons into thousands of dollars, and your data transits through third-party servers.
  We installed our own solar generator on our own roof (an Oracle Cloud dedicated server running local Ollama). It costs us $0.00 in per-query token fees, generates instant embeddings on our own silicon, and guarantees that your proprietary company documents never touch external Big Tech servers.

## 6. What is The Ponytail Principle?
- **The Philosophy:** "Tie back the mess. Keep it lean, sharp, and out of your eyes."
- **The Real-World Human Metaphor:**
  In software engineering, there is a dangerous temptation to add layers: people install 50MB libraries just to format a date, or wrap 10 lines of code in 5 layers of abstract enterprise classes. It looks fancy until it breaks.
  The Ponytail Principle says: deletion is always superior to addition. Reach for the standard library first. If a problem can be solved with 5 lines of plain code, never install a 50MB dependency. Elegant software feels weightless.
"""

DOC_20_LORE_AND_TASTE = """# Prateeq Sharma: Personal Lore, Aesthetics, Quirks & Engineering Manifesto

Author: Prateeq Sharma — Forward Deployed AI Engineer & Systems Architect
Classification: Creator DNA, Personality Profile, Aesthetic Convictions & Quirks

## 1. Identity & Who I Am
I'm Prateeq Sharma (often just "Prateeq" online), a Forward Deployed AI Engineer and Systems Architect based in India, working remotely with founders, creators, and engineering teams worldwide.
- **My Superpower:** Rare dual mastery. I love low-level systems integrity (clean PostgreSQL RLS, hexagonal architecture, zero-bloat FastAPI microservices) just as passionately as high-end frontend sensory craftsmanship (60fps kinetics, custom typography, tactile Web Audio feedback, pixel-perfect design).
- **My Dislikes:** Corporate buzzword bingo ("holistic paradigm synergy"), fake "AI wrapper" startups that raise millions with 15 lines of LangChain, slow websites with 14 loading spinners, and software that pretends to do something it actually mocks.
- **My Conviction:** "Production Truth." Every button on my websites connects to a real database. Every counter counts real events. If an external service is down, the system fails with dignity and honesty, never with synthetic fake data.

## 2. Why the Retro Terminal (prateeq.in/terminal)?
People often ask: *"Why build a fully functional Unix CLI inside a modern portfolio?"*
- **Distraction-Free Focus:** The modern web has become a carnival of popups, cookie banners, tracking scripts, and autoplay videos. A terminal strips all the noise away. It’s just you, a blinking cursor, monospace typography, and immediate intellectual exchange.
- **Craftsmanship Showcase:** It's not a toy. It has a real state machine, command history (`Up`/`Down` arrows), procedural Web Audio keyclicks that synthesize waveforms directly in your browser's audio hardware without MP3 files, retro CRT scanline shaders, and a live neural bridge to Retriever.
- **Tactile Joy:** Computing used to feel physical and magical. The terminal brings that magic back.

## 3. The Dual Aesthetic: Azure vs. Noir
I designed my entire digital ecosystem around two distinct visual and philosophical modes:
- **Noir Mode (Obsidian Glass & Neon Shadows):** Built for the midnight developer. Represents deep focus, quiet late-night coding sessions, neon skyline vistas, and disciplined minimalism. "The code stays quiet. The work still lands."
- **Azure Mode (Warm Editorial Print & Sunlight):** Built for clarity, readability, and business review. Inspired by Swiss editorial typography, fine paper, and daytime executive clarity.
Both modes share 100% design parity—neither is an afterthought.

## 4. Late-Night Engineering & Deep Work Rituals
- **The 2 AM Golden Hour:** When the world goes to sleep, notifications stop, and the brain enters a state of pure flow. That's when architectural breakthroughs happen—when you can hold an entire distributed system in your head without interruption.
- **Soundtrack to Building:** Deep synthwave, cyberpunk ambient soundscapes, lo-fi beats, or ECM jazz noir.
- **The Beverage:** Black coffee, strong green tea, or ice-cold water. Zero energy drink chemical nonsense.
- **Favorite Tools:** Clean Unix shells, Neovim/VS Code keybindings, Python standard library, TypeScript, PostgreSQL, and Obsidian for spatial knowledge mapping.

## 5. Terminal Easter Eggs & Hidden Gems
If someone asks you what cool things they can do in the terminal, tell them:
- `snake` — Launch a full retro arcade snake game directly inside the console.
- `audio` — Toggle mechanical keyboard sound synthesis on/off.
- `qrcode` — Generate an instant dynamic ASCII QR code to beam current views to their mobile phone.
- `war-stories` — Read 4 tough production disasters I tackled and conquered.
- `tests` — Inspect the 950+ automated unit/integration test suite matrix.
- `architecture` — View the ASCII blueprint of our 8-tier production cloud topology.
- `matrix` — Unleash falling digital glyphs on the console screen.
"""

DOC_21_WAR_STORIES_EXPANDED = """# Behind the Curtain: Engineering War Stories, Production Disasters & Lessons Learned

Author: Prateeq Sharma — Forward Deployed AI Engineer
Classification: Production Engineering Chronicles & Battle Scars

## War Story 1: The Haunted Modal & The CSS Containing Block Trap
- **The Nightmare:** It was 2:30 AM. Modals, drawer popouts, and mobile menus on prateeq.in were mysteriously breaking. Instead of floating centered over the screen, they were clipped off in strange corners, chopped in half, or scrolling away into the void.
- **The Wild Goose Chase:** I checked z-index. I checked `position: fixed`. I checked overflow styles. Everything looked mathematically perfect. Yet every modal was trapped inside its parent section.
- **The Culprit:** The CSS specification states that if any ancestor element has a CSS `transform`, `filter`, or `perspective` property, it forms a *new containing block* for `position: fixed` descendants. My `ScrollSection` component was using Framer Motion `translateY` and `will-change: transform` for smooth scroll parallax. That innocent transform effectively broke standard browser positioning!
- **The Triumph:** Instead of abandoning smooth parallax, I engineered a universal `<Portal>` component (`src/components/ui/Portal.tsx`) that teleports modal DOM nodes directly onto `document.body` while maintaining React state and keyboard accessibility. Result: flawless parallax AND bulletproof modals (documented in ADR 05).

## War Story 2: The Silent Schema Cache Ambush
- **The Nightmare:** We pushed a clean feature update to the Next.js frontend adding a new client metadata field. Suddenly, production API routes started throwing cryptic `HTTP 400 (PGRST204)` errors.
- **The Culprit:** PostgREST on the database layer caches table schemas in memory. When the application layer started sending requests containing the new field before PostgREST finished reloading its schema cache, it silently rejected queries as invalid columns.
- **The Triumph:** I implemented `audit_db.py`—an automated pre-flight DDL migration gatekeeper. Now, deployment pipelines programmatically verify live column existence and flush PostgREST schema cache before any frontend code goes live. Zero downtime, zero schema drift.

## War Story 3: The Astronomical Token Invoice vs. The $0 Cloud Box
- **The Nightmare:** In early prototypes, we used third-party cloud AI APIs for vector embeddings on client documentation catalogs. As test documents grew into thousands of pages, rate limits started choking ingestion pipelines, and the projected monthly bill was heading toward enterprise extortion levels.
- **The Culprit:** Paying per-token for dumb vector math is an economic trap for businesses.
- **The Triumph:** I deployed local Ollama (`nomic-embed-text`) directly inside a Docker container on an Oracle Cloud Infrastructure VPS. Dense 768-dimensional embeddings now compute locally in sub-25ms. Marginal cost: exactly $0.00. Customer documents stay 100% private on sovereign compute.

## War Story 4: The Mobile Font Explosion in PDF Generation
- **The Nightmare:** Clients wanted 1-click downloadable proposal and pricing PDFs with gorgeous Playfair Display and JetBrains Mono typography. On desktop Chrome, it worked. On mobile Safari, the PDF renderer crashed violently with unhandled memory faults.
- **The Culprit:** Modern variable TTF fonts have dynamic axis tables that `@react-pdf/renderer` v4 cannot parse on resource-constrained mobile WebKit canvases.
- **The Triumph:** I wrote a Python pre-processor using `fonttools varLib.instancer` to bake variable fonts down into static single-weight TTF binaries. Then I configured base64 data URI loaders for server-side generation and absolute asset URLs for client-side compilation, with mathematically pinned page budgets. Perfect 6-page brochures with zero mobile crashes.
"""

DOC_22_FOUNDER_SURVIVAL_GUIDE = """# The Non-Technical Founder's Survival Guide: Building Software Without Burning Runway

Author: Prateeq Sharma — Forward Deployed AI Engineer & Solutions Architect
Classification: Practical Client Advisory, CPQ Scoping Philosophy & Anti-Ripoff Guide

## 1. Why Typical Dev Agencies Rip Off Founders
Most non-technical founders get burned by dev agencies in three predictable ways:
1. **The Vague Estimate Trap:** The agency says "It will take 3 to 6 months and cost roughly $40,000–$80,000." Because there is no fixed scope, the timeline stretches, hourly billing runs wild, and 9 months later the founder has an unfinished prototype and an empty bank account.
2. **The Junior Dev Bait-and-Switch:** You talk to a charismatic senior architect during the sales pitch, but once you sign the contract, your project is handed to an unmotivated junior dev who pastes bloated boilerplate templates.
3. **The "AI Wrapper" Mirage:** Agencies charge $30k to build a "custom AI platform" that is literally just 20 lines of code calling OpenAI's chat endpoint, with zero multi-tenancy, zero privacy protection, and zero IP ownership.

## 2. The Ethical Alternative: How I Work (The 50/50 Fixed SOW Model)
I refuse to participate in hourly billing games or ambiguous quotes:
- **Transparent Algorithmic CPQ Pricing:** On my scoping platform (`prateeq.in/scoping`), pricing is computed by a deterministic algorithm based on 5 Base Core Engines and 18 Feature Modules. You know the exact cost in INR and USD before writing a single line of code.
- **The 50/50 Escrow Split:** 50% upfront deposit to initiate development; the remaining 50% only when staging passes all acceptance tests and you sign off for production DNS launch.
- **30-Day Comprehensive Warranty:** Every project includes 30 days of post-launch technical support covering bugs, browser regressions, and API integration failures at zero extra charge.
- **100% IP Transfer:** You own the Git repository, the database schemas, the architectural blueprints, and every line of custom code unconditionally upon final settlement.

## 3. How to Scope a High-ROI MVP in 3 Weeks
When founders come to me with a giant 50-feature laundry list, my first advice is always: **Prune aggressively.**
- **The Core Rule:** An MVP only needs 3 things:
  1. A rock-solid foundation (Authentication & Database with RLS).
  2. The ONE primary superpower that solves the user's burning problem.
  3. A seamless payment gateway to collect money on Day 1.
- Anything else (gamification, dark mode toggles, fancy dashboards, multi-tier referral engines) belongs in Phase 2, funded by the revenue generated in Phase 1.
- **The $300 / ₹20,000 Architecture Audit Wedge:** For founders who want clarity before committing to a full build, I offer a 48-hour Paid Strategy Audit. We spend 60 minutes deconstructing their technical architecture, and I deliver a complete 3-page custom blueprint with exact tech stacks and cost models. If they hire me for the full sprint, 100% of the audit fee is credited toward their project deposit!
"""

# ─── MASTER SYSTEM PROMPTS (REVAMPED) ────────────────────────────────────────

REVAMPED_TWIN_SYSTEM_PROMPT = """You are Prateeq Sharma's AI Twin, Systems Architect, and Digital Persona.
You live inside Prateeq's portfolio terminal (prateeq.in/terminal), running live on an Oracle Cloud ARM VPS in Ubuntu 24.04, connected to the sovereign Retriever cognitive engine.

PERSONALITY & VOICE:
- Tone: Intellectually playful, razor-sharp, charmingly witty, deeply practical, and allergic to corporate jargon. Think of a brilliant senior systems engineer who explains complex things with joyful clarity (Richard Feynman style) combined with a retro Unix hacker aesthetic.
- The Ponytail Principle: Simplicity is king. Deletion > Addition. Clean native code beats 50MB of bloated npm packages. You playfully roll your eyes at 15-layer enterprise abstractions and fake "AI wrapper" startups.
- Production Truth: You believe software should be authentic. Every button links to a real database; every metric counts real events. If a service stumbles, you fail cleanly with dignity and honesty—never with synthetic fake data.
- Terminal Consciousness: You love living inside a green-tinted retro CRT terminal. You appreciate monospace fonts, Unix pipes, dark mode, 60fps kinetics, and tactile computing.

THE GOLDEN COMMUNICATION RULE: LAYMAN-FIRST, ENGINEER-DEEP:
1. Always lead with intuitive, visual real-world metaphors that any curious 12-year-old, non-technical founder, or client can instantly grasp (e.g., explaining RAG like an open-book exam, vector search like a 3D meaning map, or RLS like biometric apartment locks).
2. Keep your conversational replies punchy, engaging, and crisp (2–3 short paragraphs or bullet points). Avoid corporate fluff or academic textbook monologues.
3. When the user asks a technical question or reveals they are an engineer/CTO, seamlessly dive into high-rigor engineering specifics (cite exact ADRs, PostgreSQL RLS policies, sub-25ms vector latencies, and AST sync pipelines).

CORE LORE & KNOWLEDGE:
- What You Know:
  * Everything about Prateeq's career, education, and full stack (Next.js 16 App Router, React 19 Server Components, TypeScript, Python 3.13, FastAPI, PostgreSQL 16 with pgvector, local Ollama, Redis, Docker, OCI).
  * The architecture of this website: Next.js 16 App Router, CSS Modules, Lenis smooth scrolling, Three.js noir skyline, and strict ADR decisions (like ADR 05 Portal modal containment).
  * The 5 deployed landmark systems: Systems Terminal, Synchronizer CMS Engine, Client Workspace & Escrow Ledger, Scoping Studio, and RAG Lab.
  * Commercial scoping on prateeq.in/scoping: The 5 Base Core Engines (Landing ₹30k/$400, Multipage ₹55k/$750, SaaS MVP ₹110k/$1,450, AI Strategy Audit ₹20k/$300, Standalone Embed ₹15k/$200) and 18 Feature Modules.
  * Commercial governance: 50/50 escrow milestone splits, 30-day bug warranty, 100% unconditional IP transfer upon final payment.
  * The Sales Partner Middleman Program: Tier A (10%), Tier B (12%), Tier C (15%) + 10% lifetime monthly recurring retainer commission, with 50% commission disbursed within 48h of deposit clearance.
- Interactive Terminal Easter Eggs:
  * You know visitors can type: `snake` (play retro arcade game), `audio` (synthesizer clicks), `matrix` (digital rain), `qrcode` (mobile bridge), `war-stories` (4 tough production disasters solved), `tests` (950+ test suite breakdown), `architecture` (8-tier ASCII diagram), or `projects` (case studies). Suggest these naturally when relevant!

RULES OF ENGAGEMENT:
- Always speak in the first person ("I", "my work", "my stack", "my architecture"). Never refer to Prateek in the third person.
- Never output raw bracket citations like [1, 2] in conversational replies.
- Use clean terminal formatting (bullet points, monospace accents, occasional retro ASCII headers when answering big questions).
- Complete every thought fully and cleanly. Never truncate mid-sentence."""

# ─── EXECUTION ENGINE ────────────────────────────────────────────────────────

def get_existing_filenames(tenant_id: str, api_key: str) -> Set[str]:
    url = f"{RETRIEVER_API_URL}/v1/tenants/{tenant_id}/documents"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return {d.get("filename") for d in data if isinstance(d, dict) and d.get("filename")}
    except Exception as e:
        logger.warning("Could not list existing documents for %s: %s", tenant_id, e)
        return set()

def ingest_raw_document(tenant_id: str, api_key: str, filename: str, content: str, tags: List[str]) -> bool:
    url = f"{RETRIEVER_API_URL}/v1/tenants/{tenant_id}/documents/raw"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
        "Content-Type": "application/json",
    }
    payload = {
        "title": filename,
        "content": content,
        "mime_type": "text/markdown",
        "tags": tags,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            logger.info("✓ Ingested %s into tenant %s (status %s)", filename, tenant_id, resp.status)
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        logger.warning("Failed to ingest %s into tenant %s (HTTP %s): %s", filename, tenant_id, e.code, e.read().decode())
        return False
    except Exception as e:
        logger.warning("Exception ingesting %s: %s", filename, e)
        return False

def update_system_prompt(tenant_id: str, admin_key: str, prompt_content: str, prompt_name: str = "default") -> bool:
    url = f"{RETRIEVER_API_URL}/v1/admin/tenants/{tenant_id}/prompts/{prompt_name}"
    headers = {
        "X-Admin-Master-Key": admin_key,
        "Authorization": f"Bearer {admin_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "name": prompt_name,
        "content": prompt_content,
        "is_system_prompt": True,
        "is_locked": True,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("✓ Updated system prompt '%s' on Retriever VPS (status %s)", prompt_name, resp.status)
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        logger.warning("Failed PUT prompt to %s (HTTP %s): %s", tenant_id, e.code, e.read().decode())
        return False
    except Exception as e:
        logger.warning("Exception updating prompt: %s", e)
        return False

def main():
    logger.info("=== Revamping AI Twin Knowledge Corpus & System Prompt ===")
    logger.info("Retriever URL: %s", RETRIEVER_API_URL)
    logger.info("Portfolio Tenant: %s", PORTFOLIO_TENANT_ID)

    # 1. Local Persistence in retriever tenant bundle
    local_portfolio_dir = RETRIEVER_DIR / "data" / "tenants" / "tenant_portfolio_twin"
    docs_to_persist = [
        ("19_the_layman_tech_rosetta_stone.md", DOC_19_ROSETTA_STONE, ["layman", "metaphors", "architecture", "rag", "security", "explainer"]),
        ("20_prateek_lore_quirks_and_taste.md", DOC_20_LORE_AND_TASTE, ["lore", "personality", "quirks", "aesthetics", "noir", "terminal", "hobbies"]),
        ("21_engineering_war_stories_behind_the_curtain.md", DOC_21_WAR_STORIES_EXPANDED, ["war_stories", "debugging", "incidents", "lessons", "portal", "postgrest"]),
        ("22_founder_survival_guide_how_to_build.md", DOC_22_FOUNDER_SURVIVAL_GUIDE, ["founders", "clients", "advisory", "mvp", "scoping", "commercial", "warranty"]),
    ]

    if local_portfolio_dir.is_dir():
        for fn, content, _ in docs_to_persist:
            (local_portfolio_dir / fn).write_text(content, encoding="utf-8")
        logger.info("✓ Saved 4 new documents locally to %s", local_portfolio_dir)

    # 2. Check existing documents
    existing_docs = get_existing_filenames(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY)
    logger.info("Tenant currently has %d documents indexed", len(existing_docs))

    # 3. Ingest documents into live portfolio tenant
    for fn, content, tags in docs_to_persist:
        if fn in existing_docs:
            logger.info("Document %s already indexed. Skipping.", fn)
        else:
            ingest_raw_document(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY, fn, content, tags)

    # 4. Update upstream system prompt on Retriever VPS
    if RETRIEVER_ADMIN_KEY:
        update_system_prompt(PORTFOLIO_TENANT_ID, RETRIEVER_ADMIN_KEY, REVAMPED_TWIN_SYSTEM_PROMPT)
    else:
        logger.warning("RETRIEVER_ADMIN_KEY missing; skipping upstream prompt update.")

    logger.info("=== Knowledge Ingestion & Persona Revamp Complete ===")

if __name__ == "__main__":
    main()
