#!/usr/bin/env python3
"""
Automated AI Newsjacking & Content Generator Script
Parses trending AI/Tech RSS news feeds, dynamically discovers portfolio projects from src/data/projects.json,
synthesizes code-first technical case studies via Gemini 2.5 Flash, saves to Supabase, and sends Resend notifications with 1-click publishing.

Usage:
    python3 scripts/ai_blog_generator.py --dry-run
    python3 scripts/ai_blog_generator.py --publish
    python3 scripts/ai_blog_generator.py --publish --auto-publish
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

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
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
CONTACT_EMAIL_TO = os.environ.get('CONTACT_EMAIL_TO', 'prateeqsharma@gmail.com')
SYNC_API_KEY = os.environ.get('SYNC_API_KEY', 'secret_key')

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

def save_to_supabase(draft_data, status="draft"):
    """Save generated blog post to Supabase posts table."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase credentials missing, skipping DB save.", file=sys.stderr)
        return False

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/posts?on_conflict=slug"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }

    now_iso = datetime.now(timezone.utc).isoformat()
    today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = {
        "slug": draft_data["slug"],
        "title": draft_data["post_title"],
        "date": today_date,
        "excerpt": draft_data["excerpt"],
        "content": draft_data["content_markdown"],
        "tags": draft_data.get("tags", ["AI", "Engineering"]),
        "status": status,
        "published_at": now_iso,
        "created_at": now_iso
    }

    req = urllib.request.Request(endpoint, data=json.dumps([record]).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Successfully saved post '{draft_data['post_title']}' to Supabase posts!")
            return True
    except Exception as e:
        print(f"Failed to save post to Supabase: {e}", file=sys.stderr)
        return False

def send_resend_notification(draft_data, is_auto_publish=False):
    """Send formatted email notification via Resend API."""
    if not RESEND_API_KEY:
        print("RESEND_API_KEY missing, skipping email notification.", file=sys.stderr)
        return False

    title = draft_data.get("post_title", "Untitled Draft")
    slug = draft_data.get("slug", "")
    mode = draft_data.get("mode", "thought_leadership")
    excerpt = draft_data.get("excerpt", "")

    publish_url = f"https://prateeq.in/api/blog/publish?slug={slug}&secret={SYNC_API_KEY}"
    live_url = f"https://prateeq.in/blog/{slug}"

    if is_auto_publish:
        subject = f"✅ [AUTO-PUBLISHED] AI Blog: {title}"
        action_button_html = f"""
            <a href="{live_url}" style="background:#10b981; color:#ffffff; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:6px; display:inline-block;">View Live Blog Post →</a>
            <p style="font-size:12px; color:#9ca3af; margin-top:12px;">If you want to unpublish or delete this post, open your local Streamlit Synchronizer (Blog tab).</p>
        """
    else:
        subject = f"📝 [DRAFT READY] AI Blog: {title}"
        action_button_html = f"""
            <a href="{publish_url}" style="background:#2563eb; color:#ffffff; padding:14px 28px; text-decoration:none; font-weight:bold; border-radius:6px; display:inline-block;">🚀 1-Click Approve & Publish Live</a>
            <p style="font-size:12px; color:#9ca3af; margin-top:12px;">Clicking this link will update status to 'published' and purge the Next.js production cache.</p>
        """

    html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:600px; margin:0 auto; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background-color:#ffffff;">
            <div style="border-bottom:2px solid #2563eb; padding-bottom:12px; margin-bottom:16px;">
                <h2 style="color:#111827; margin:0; font-size:20px;">🤖 Automated AI Newsjacking Engine</h2>
                <span style="font-size:12px; color:#6b7280; font-weight:bold;">Mode: {mode.upper()}</span>
            </div>

            <h3 style="color:#1f2937; margin:0 0 12px 0;">{title}</h3>
            <p style="color:#4b5563; line-height:1.6; background-color:#f9fafb; padding:12px; border-radius:8px; border-left:4px solid #2563eb;">
                {excerpt}
            </p>

            <div style="margin:24px 0; text-align:center;">
                {action_button_html}
            </div>

            <div style="border-top:1px solid #f3f4f6; padding-top:16px; font-size:12px; color:#9ca3af; text-align:center;">
                Prateeq Studio Content Engine • Scheduled Newsjacking Runner
            </div>
        </div>
    """

    payload = {
        "from": "Prateeq Studio <onboarding@resend.dev>",
        "to": [CONTACT_EMAIL_TO],
        "subject": subject,
        "html": html_body
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✓ Resend notification email sent to {CONTACT_EMAIL_TO}!")
            return True
    except Exception as e:
        print(f"Failed to send Resend email: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description="Automated AI Newsjacking Blog Generator Engine")
    parser.add_argument("--dry-run", action="store_true", help="Generate draft without saving to database")
    parser.add_argument("--publish", action="store_true", help="Save draft to Supabase DB and send Resend notification")
    parser.add_argument("--auto-publish", action="store_true", help="Publish directly live without waiting for manual email approval")
    args = parser.parse_args()

    is_auto = args.auto_publish or (os.environ.get('AUTO_PUBLISH', 'false').lower() in ('true', '1', 'yes'))
    target_status = "published" if is_auto else "draft"

    print("🔍 Fetching trending AI/Tech news feeds...")
    news_items = fetch_rss_news()
    if not news_items:
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
    print(f"PUBLISH MODE: {'AUTO-PUBLISHED LIVE' if is_auto else 'MANUAL DRAFT APPROVAL'}")
    print(f"EXCERPT: {draft.get('excerpt')}")
    print(f"TAGS: {', '.join(draft.get('tags', []))}")
    print("="*60)
    print(draft.get('content_markdown')[:400] + "\n...\n")

    if args.publish:
        save_to_supabase(draft, status=target_status)
        send_resend_notification(draft, is_auto_publish=is_auto)
    else:
        print("💡 Dry run complete. Run with --publish to save draft & send Resend email.")

if __name__ == "__main__":
    main()
