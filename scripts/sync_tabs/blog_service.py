import os
import json
import sys
from datetime import datetime

# Setup sys.path to resolve script directory modules properly
SCRIPTS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from sync_tabs.shared import (
    parse_resume_file,
    write_resume_file,
    atomic_write_text,
    trigger_revalidation,
    sync_blog_post,
    delete_blog_post,
    fetch_blog_posts,
    slugify,
    HAS_SYNC,
    run_safe_git_command,
)
from sync_git import commit_and_push_paths


import urllib.request
import xml.etree.ElementTree as ET
import html

DEFAULT_RSS_FEEDS = [
    {"name": "HackerNews", "url": "https://news.ycombinator.com/rss"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/"},
    {"name": "HuggingFace Blog", "url": "https://huggingface.co/blog/feed.xml"}
]

RSS_CONFIG_FILE = os.path.join("src", "data", "rss_feeds.json")

def get_rss_feeds() -> list[dict]:
    """Get active RSS feeds list from src/data/rss_feeds.json or fallback to defaults."""
    if os.path.exists(RSS_CONFIG_FILE):
        try:
            with open(RSS_CONFIG_FILE, "r", encoding="utf-8") as f:
                feeds = json.load(f)
                if isinstance(feeds, list) and feeds:
                    return feeds
        except Exception:
            pass
    return DEFAULT_RSS_FEEDS

def save_rss_feeds(feeds: list[dict]) -> bool:
    """Save active RSS feeds list to src/data/rss_feeds.json."""
    try:
        os.makedirs(os.path.dirname(RSS_CONFIG_FILE), exist_ok=True)
        with open(RSS_CONFIG_FILE, "w", encoding="utf-8") as f:
            f.write(json.dumps(feeds, indent=2))
        return True
    except Exception as e:
        print(f"Failed to save RSS feeds config: {e}", file=sys.stderr)
        return False

def fetch_rss_news(custom_feeds: list[dict] | None = None) -> list[dict]:
    """Fetch recent AI/tech items from RSS feeds for Streamlit preview & generation."""
    news_items = []
    headers = {"User-Agent": "Mozilla/5.0 (Python/AI-Blog-Generator)"}
    active_feeds = custom_feeds or get_rss_feeds()
    
    for feed in active_feeds:
        try:
            req = urllib.request.Request(feed["url"], headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                
                items = root.findall("./channel/item") or root.findall("./{http://www.w3.org/2005/Atom}entry")
                for item in items[:5]:
                    title_elem = item.find("title") or item.find("{http://www.w3.org/2005/Atom}title")
                    link_elem = item.find("link") or item.find("{http://www.w3.org/2005/Atom}link")
                    
                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                    if link_elem is not None:
                        link = link_elem.text.strip() if link_elem.text else link_elem.attrib.get("href", "")
                    else:
                        link = ""
                        
                    if title and link:
                        clean_title = html.unescape(title)
                        news_items.append({
                            "source": feed["name"],
                            "title": clean_title,
                            "url": link
                        })
        except Exception as e:
            print(f"Warning: Failed to fetch {feed['name']} RSS: {e}", file=sys.stderr)
            
    return news_items


def fetch_pending_ai_drafts() -> list[dict]:
    """Fetch all pending AI blog drafts stored in Supabase with status='draft'."""
    if not HAS_SYNC:
        return []
    try:
        all_posts = fetch_blog_posts() or []
        return [
            p for p in all_posts
            if p.get("status") == "draft" or p.get("slug", "").startswith("draft-")
        ]
    except Exception as e:
        print(f"Error fetching pending AI drafts: {e}", file=sys.stderr)
        return []


def publish_post_to_all_layers(
    post_data: dict,
    dry_run: bool = True,
    old_draft_slug: str | None = None,
    is_offline: bool = False
) -> tuple[bool, str]:
    """
    Publish a blog post across all data layers:
    1. Removes old draft record from Supabase if applicable.
    2. Upserts clean published record to Supabase (status='published').
    3. Writes local .md file under src/content/posts/.
    4. Updates src/data/resume.json lastSynced metadata.
    5. Triggers Next.js server cache revalidation (/api/revalidate).
    6. Pushes file changes to GitHub if dry_run=False.
    """
    try:
        raw_slug = post_data.get("slug") or post_data.get("title", "untitled")
        raw_title = post_data.get("title", "Untitled Post")

        clean_slug = slugify(raw_slug.replace("draft-", "").strip())
        clean_title = raw_title.replace("[DRAFT]", "").strip()

        raw_tags = post_data.get("tags", [])
        if isinstance(raw_tags, str):
            tags_list = [t.strip() for t in raw_tags.split(",") if t.strip()]
        else:
            tags_list = [str(t).strip() for t in raw_tags if str(t).strip()]

        date_str = post_data.get("date") or datetime.now().strftime("%Y-%m-%d")
        excerpt_str = post_data.get("excerpt", "").strip()
        content_str = post_data.get("content", "").strip()
        cover_image = post_data.get("coverImage", "/images/blog/default.jpg")

        clean_payload = {
            "slug": clean_slug,
            "title": clean_title,
            "excerpt": excerpt_str,
            "tags": tags_list,
            "content": content_str,
            "date": date_str,
            "coverImage": cover_image,
            "status": "published",
            "published_at": datetime.now().isoformat()
        }

        # 1. Sync to Supabase
        if HAS_SYNC and not is_offline:
            # Delete old draft record if slug had 'draft-' prefix or explicit old_draft_slug
            target_old_draft = old_draft_slug or (post_data.get("slug") if post_data.get("slug", "").startswith("draft-") else None)
            if target_old_draft and target_old_draft != clean_slug:
                delete_blog_post(target_old_draft)

            res = sync_blog_post(clean_payload)
            if res is None:
                return False, "Failed to sync blog post to Supabase database."

        # 2. Write local .md file
        posts_dir = os.path.join("src", "content", "posts")
        os.makedirs(posts_dir, exist_ok=True)
        file_path = os.path.join(posts_dir, f"{clean_slug}.md")

        file_md = f"""---
title: {json.dumps(clean_title)}
date: {json.dumps(date_str)}
excerpt: {json.dumps(excerpt_str)}
tags: {json.dumps(tags_list)}
coverImage: {json.dumps(cover_image)}
---

{content_str}
"""
        atomic_write_text(file_path, file_md)

        # 3. Update resume lastSynced metadata
        resume = parse_resume_file()
        if resume:
            if "lastSynced" not in resume:
                resume["lastSynced"] = {}
            resume["lastSynced"] = {
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "summary": f"Published blog post: {clean_title}"
            }
            write_resume_file(resume)

        # 4. Trigger cache revalidation
        if HAS_SYNC and not is_offline:
            trigger_revalidation()

        # 5. Optional Git remote push
        if not dry_run:
            git_ok, git_msg = commit_and_push_paths(
                run_safe_git_command,
                [file_path, "src/data/resume.json"],
                f"chore(blog): publish post - {clean_title}",
                cwd=os.getcwd(),
            )
            if not git_ok:
                return True, f"Published post locally and on DB, but Git push failed: {git_msg}"

        return True, f"Successfully published '{clean_title}' to all layers!"

    except Exception as e:
        return False, f"Failed to publish post: {str(e)}"


def delete_post_from_all_layers(slug: str, is_offline: bool = False) -> tuple[bool, str]:
    """
    Delete a blog post from all layers:
    1. Removes local .md file if present.
    2. Deletes DB record from Supabase.
    3. Triggers Next.js server cache revalidation.
    """
    try:
        clean_slug = slug.replace(".md", "")
        file_path = os.path.join("src", "content", "posts", f"{clean_slug}.md")

        # 1. Delete local file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not remove local file {file_path}: {e}", file=sys.stderr)

        # 2. Delete from Supabase
        if HAS_SYNC and not is_offline:
            delete_blog_post(clean_slug)
            trigger_revalidation()

        return True, f"Successfully deleted post '{clean_slug}' from all layers!"

    except Exception as e:
        return False, f"Failed to delete post: {str(e)}"
