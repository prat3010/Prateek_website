#!/usr/bin/env python3
"""
Automated AI Newsjacking & Blog Generator Script for Prateek Sharma's Portfolio (prateeq.in)
Scrapes trending tech news stories, synthesizes code-first technical case studies via Gemini 3.6 Flash,
applies an LLM Banned-Words Filter, and outputs Markdown articles to src/content/posts/.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.parse
from datetime import datetime

# Path Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
POSTS_DIR = os.path.join(PROJECT_ROOT, "src", "content", "posts")
ENV_FILE = os.path.join(PROJECT_ROOT, ".env.local")

# LLM Banned Words List to prevent AI clichés
BANNED_WORDS = [
    "delve", "tapestry", "game-changer", "rapidly evolving",
    "in conclusion", "beacon", "testament", "spearhead", "realm"
]

def load_env_vars():
    """Load environment variables from .env.local if present."""
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

def fetch_hn_top_story():
    """Fetch top trending AI/tech story from HackerNews API."""
    try:
        req = urllib.request.Request(
            "https://hacker-news.firebaseio.com/v0/topstories.json",
            headers={"User-Agent": "PrateeqAI/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            story_ids = json.loads(resp.read().decode("utf-8"))

        for story_id in story_ids[:15]:
            story_req = urllib.request.Request(
                f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json",
                headers={"User-Agent": "PrateeqAI/1.0"}
            )
            with urllib.request.urlopen(story_req, timeout=10) as story_resp:
                item = json.loads(story_resp.read().decode("utf-8"))
                title = item.get("title", "")
                url = item.get("url", "")
                if url and any(kw in title.lower() for kw in ["ai", "llm", "model", "rag", "code", "python", "rust", "database", "agent", "gpu", "vibe"]):
                    return {"title": title, "url": url, "id": story_id}

        # Fallback to first story
        if story_ids:
            story_req = urllib.request.Request(
                f"https://hacker-news.firebaseio.com/v0/item/{story_ids[0]}.json",
                headers={"User-Agent": "PrateeqAI/1.0"}
            )
            with urllib.request.urlopen(story_req, timeout=10) as story_resp:
                item = json.loads(story_resp.read().decode("utf-8"))
                return {"title": item.get("title", "Modern AI Architecture Patterns"), "url": item.get("url", "https://news.ycombinator.com"), "id": story_ids[0]}
    except Exception as err:
        print(f"⚠️ HackerNews API fetch warning: {err}", file=sys.stderr)
        return {
            "title": "Scaling Hybrid Vector Search with pgvector & Next.js 16",
            "url": "https://prateeq.in/rag",
            "id": 0
        }

def sanitize_banned_words(text: str) -> str:
    """Sanitize text by replacing prohibited AI clichés."""
    sanitized = text
    for word in BANNED_WORDS:
        pattern = re.compile(re.escape(word), re.IGNORECASE)
        if word in ["in conclusion"]:
            sanitized = pattern.sub("Summary & Next Steps", sanitized)
        elif word in ["game-changer"]:
            sanitized = pattern.sub("major architectural shift", sanitized)
        elif word in ["rapidly evolving"]:
            sanitized = pattern.sub("fast-moving", sanitized)
        elif word in ["delve"]:
            sanitized = pattern.sub("explore", sanitized)
        else:
            sanitized = pattern.sub("key component", sanitized)
    return sanitized

def generate_article_gemini(story: dict) -> dict:
    """Generate markdown article via Gemini 3.6 Flash API."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    today_str = datetime.now().strftime("%Y-%m-%d")
    clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', story['title']).strip()
    slug = clean_title.lower().replace(' ', '-')[:50] or "ai-architecture-insights"

    fallback_article = {
        "slug": f"{slug}-{today_str}",
        "title": story['title'],
        "date": today_str,
        "excerpt": f"An architectural deep-dive into {story['title']} and practical implementation implications for high-throughput RAG systems.",
        "tags": ["AI", "Architecture", "RAG", "Next.js"],
        "content": f"""
# {story['title']}

## Architectural Breakdown

Recent developments in modern software systems have highlighted the importance of resilient, high-performance data retrieval pipelines. When evaluating **{story['title']}**, engineering teams must balance throughput latency against indexing cost.

### Key Implementation Patterns

1. **Decoupled Control Planes**: Separating presentation UI state from core AI resource servers.
2. **Hybrid Retrieval**: Combining dense vector embeddings with sparse BM25 keyword matching for optimal recall.
3. **Strict Type Safety**: Enforcing backend schemas across TypeScript client boundaries.

For a live demonstration of these patterns in action, check out our [Retriever SaaS Lab](/rag) or explore our [Instant Project Scoping Lab](/scoping?engine=saas).

---
*Source & Discussion:* [{story['title']}]({story['url']})
"""
    }

    if not api_key:
        print("ℹ️ GEMINI_API_KEY not found in env. Using fallback structured article payload.")
        return fallback_article

    try:
        prompt_text = f"""
Write an authoritative 600-word developer blog post in Markdown format analyzing this tech news story:
Title: {story['title']}
URL: {story['url']}

Rules:
1. Tone: Direct, concise, technical, code-heavy, slightly humorous.
2. Structure:
   - Catchy Title (# H1)
   - Architectural Deep-Dive (## H2)
   - Code snippet or technical pattern comparison (```python or ```typescript)
   - Summary with CTAs to [Retriever SaaS Lab](/rag) and [Instant Project Scoping Lab](/scoping?engine=saas).
3. PROHIBITED WORDS (Do NOT use under any circumstances): {", ".join(BANNED_WORDS)}.
4. Do NOT include markdown frontmatter codeblocks; return raw markdown content only.
"""

        req_data = json.dumps({
            "contents": [{"parts": [{"text": prompt_text}]}]
        }).encode("utf-8")

        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            raw_output = res_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

        if raw_output:
            sanitized_content = sanitize_banned_words(raw_output)
            return {
                "slug": f"{slug}-{today_str}",
                "title": story['title'],
                "date": today_str,
                "excerpt": f"An architectural deep-dive into {story['title']} and practical implementation implications.",
                "tags": ["AI", "Architecture", "RAG", "Engineering"],
                "content": sanitized_content
            }
    except Exception as err:
        print(f"⚠️ Gemini API synthesis warning: {err}", file=sys.stderr)

    return fallback_article

def main():
    dry_run = "--dry-run" in sys.argv
    load_env_vars()

    print("📰 Fetching trending tech story...")
    story = fetch_hn_top_story()
    print(f"✅ Target Story: '{story['title']}' ({story['url']})")

    print("🤖 Synthesizing technical case-study with Gemini...")
    article = generate_article_gemini(story)

    frontmatter = f"""---
title: "{article['title']}"
date: "{article['date']}"
excerpt: "{article['excerpt']}"
tags: {json.dumps(article['tags'])}
coverImage: "/images/projects/retriever.jpg"
---

{article['content'].strip()}
"""

    if dry_run:
        print("\n--- DRY RUN OUTPUT PREVIEW ---")
        print(frontmatter[:500] + "\n...\n")
        print("✅ Dry run completed successfully!")
        return

    os.makedirs(POSTS_DIR, exist_ok=True)
    target_filepath = os.path.join(POSTS_DIR, f"{article['slug']}.md")

    with open(target_filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter)

    print(f"🎉 Published new AI newsjacking article to: {target_filepath}")

if __name__ == "__main__":
    main()
