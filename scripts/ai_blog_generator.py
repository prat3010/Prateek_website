#!/usr/bin/env python3
"""
Automated AI Newsjacking & Content Generator Script
Parses trending AI/Tech RSS news feeds, dynamically discovers portfolio projects from src/data/projects.json,
synthesizes code-first technical case studies via Gemini 2.5 Flash, and generates structured draft blog posts.

Usage:
    python3 scripts/ai_blog_generator.py --dry-run
    python3 scripts/ai_blog_generator.py --publish
"""

import os
import sys
import json
import re
import random
import argparse
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env.local
def load_env():
    env_path = os.path.join(ROOT_DIR, '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k, v)

load_env()

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

RSS_FEEDS = [
    {"name": "HackerNews", "url": "https://news.ycombinator.com/rss"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/"},
    {"name": "HuggingFace Blog", "url": "https://huggingface.co/blog/feed.xml"}
]

def fetch_rss_news():
    """Fetch recent AI/tech items from RSS feeds."""
    news_items = []
    headers = {"User-Agent": "Mozilla/5.0 (Python/AI-Blog-Generator)"}
    
    for feed in RSS_FEEDS:
        try:
            req = urllib.request.Request(feed["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read()
                root = ET.fromstring(content)
                
                # Handle RSS 2.0 (channel/item) and Atom (entry)
                items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
                for item in items[:10]:
                    title_elem = item.find("title")
                    if title_elem is None:
                        title_elem = item.find("{http://www.w3.org/2005/Atom}title")
                    link_elem = item.find("link")
                    if link_elem is None:
                        link_elem = item.find("{http://www.w3.org/2005/Atom}link")
                    
                    title = title_elem.text if title_elem is not None else ""
                    if link_elem is not None:
                        link = link_elem.text if link_elem.text else link_elem.get("href", "")
                    else:
                        link = ""
                        
                    if title and ("AI" in title or "LLM" in title or "Model" in title or "Data" in title or "Python" in title or "Code" in title or "Web" in title or "Agent" in title):
                        news_items.append({
                            "source": feed["name"],
                            "title": title.strip(),
                            "url": link.strip()
                        })
        except Exception as e:
            print(f"Warning: Failed to fetch {feed['name']}: {e}", file=sys.stderr)
            
    return news_items

def load_local_projects():
    """Dynamically load projects from src/data/projects.json."""
    projects_path = os.path.join(ROOT_DIR, "src/data/projects.json")
    if os.path.exists(projects_path):
        try:
            with open(projects_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to read projects.json: {e}", file=sys.stderr)
    return []

def call_gemini_json(prompt: str):
    """Invoke Gemini 2.5 Flash API expecting JSON response."""
    if not GEMINI_API_KEY:
        raise ValueError("Missing GEMINI_API_KEY in environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.4
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)

def generate_blog_draft(news_items, projects):
    """Evaluate news items and synthesize a structured technical blog post."""
    projects_summary = [
        {
            "id": p.get("id"),
            "title": p.get("title"),
            "description": p.get("description"),
            "tags": p.get("tags", []),
            "githubUrl": p.get("githubUrl", ""),
            "liveUrl": p.get("liveUrl", "")
        }
        for p in projects
    ]

    prompt = f"""
You are Prateek Sharma, an independent Full-Stack Engineer and AI Solution Architect building web applications, vector search platforms (RAG Lab / Retriever), mobile tools, and automated pipelines.

BANNED LLM WORDS (STRICTLY PROHIBITED):
Do NOT use words like: "delve", "tapestry", "in today's rapidly evolving digital landscape", "game-changer", "revolutionary", "spearhead", "beacon", "testament to", "in conclusion", "to summarize".

YOUR TASK:
1. Review these recent tech news items:
{json.dumps(news_items, indent=2)}

2. Review Prateek's current live projects:
{json.dumps(projects_summary, indent=2)}

3. Select the SINGLE BEST news item with the highest technical relevance and commercial potential.

4. DUAL-MODE LINKING LOGIC:
- If the news relates to an existing project (e.g. vector search, RAG, Ollama, computer vision, isolates, OCR), set "mode" to "project_match", specify "matched_project_id", and link directly to that project's URL or case study.
- If the news is general AI/tech news with NO direct project match, set "mode" to "thought_leadership", set "matched_project_id" to null, and link directly to the AI Strategy & Architecture Audit (`/scoping?engine=ai_strategy_audit`) or SaaS MVP Engine (`/scoping?engine=saas`).

5. Generate a structured JSON response matching this schema:
{{
  "news_title": "Original news title selected",
  "news_url": "Original news URL",
  "mode": "project_match OR thought_leadership",
  "matched_project_id": "project-id OR null",
  "post_title": "Catchy, technical blog post title",
  "slug": "url-friendly-kebab-case-slug",
  "excerpt": "Compelling 2-sentence summary of the post",
  "tags": ["AI", "Architecture", "Python", "Next.js"],
  "content_markdown": "# Markdown Body...\\n\\nInclude technical analysis, realistic code snippet (Python/TypeScript/SQL), link to project/scoping, and end with a bold Call-To-Action (CTA) driving readers to book an AI Strategy Audit or scope a project at /scoping."
}}
"""
    return call_gemini_json(prompt)

def save_draft_to_supabase(draft_data):
    """Save generated blog draft to Supabase blog_posts table."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase credentials missing, skipping DB save.", file=sys.stderr)
        return False

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/blog_posts?on_conflict=slug"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }

    record = {
        "slug": draft_data["slug"],
        "title": draft_data["post_title"],
        "excerpt": draft_data["excerpt"],
        "content": draft_data["content_markdown"],
        "tags": draft_data.get("tags", ["AI", "Engineering"]),
        "status": "draft",
        "published_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }

    req = urllib.request.Request(endpoint, data=json.dumps([record]).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Successfully saved draft '{draft_data['post_title']}' to Supabase blog_posts!")
            return True
    except Exception as e:
        print(f"Failed to save draft to Supabase: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="Automated AI Newsjacking Blog Draft Generator")
    parser.add_argument("--dry-run", action="store_true", help="Generate draft without saving to database")
    parser.add_argument("--publish", action="store_true", help="Save draft directly to Supabase DB as draft")
    args = parser.parse_args()

    print("🔍 Fetching trending AI/Tech news feeds...")
    news_items = fetch_rss_news()
    if not news_items:
        # Fallback news items if feeds are unreachable
        news_items = [
            {"source": "Tech Feed", "title": "Scaling Local RAG Pipelines with Hybrid Vector Search and Ollama", "url": "https://huggingface.co/blog"},
            {"source": "Dev Feed", "title": "Next.js 16 Server Component Caching and On-Demand Revalidation Patterns", "url": "https://news.ycombinator.com"}
        ]
    print(f"✓ Found {len(news_items)} news candidates.")

    print("🔍 Loading local project portfolio...")
    projects = load_local_projects()
    print(f"✓ Loaded {len(projects)} projects from projects.json.")

    print("🤖 Synthesizing AI Newsjacking Draft with Gemini 2.5 Flash...")
    draft = generate_blog_draft(news_items, projects)

    print("\n" + "="*60)
    print(f"TITLE: {draft.get('post_title')}")
    print(f"SLUG: {draft.get('slug')}")
    print(f"MODE: {draft.get('mode')} (Matched Project: {draft.get('matched_project_id')})")
    print(f"EXCERPT: {draft.get('excerpt')}")
    print(f"TAGS: {', '.join(draft.get('tags', []))}")
    print("="*60)
    print(draft.get('content_markdown')[:500] + "\n...\n")

    if args.publish:
        save_draft_to_supabase(draft)
    else:
        print("💡 Dry run complete. Run with --publish to save draft to Supabase.")

if __name__ == "__main__":
    main()
