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
)
from sync_git import commit_and_push_paths, run_safe_git_command


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
