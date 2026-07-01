#!/usr/bin/env python3
"""
Pull live data from Supabase and backup into local JSON files inside src/data/
Usage: python3 scripts/backup_db.py
"""

import os
import json
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

def load_env():
    path = os.path.join(ROOT, '.env.local')
    if not os.path.exists(path):
        print(f"{RED}Error: .env.local not found. Cannot load credentials.{RESET}")
        return False
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k, v)
    return True

def supabase_get(table, params=""):
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + f'/rest/v1/{table}'
    if params:
        url += f"?{params}"
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
    }
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None
    except Exception as e:
        print(f'  Connection Error: {e}')
        return None

def main():
    print(f"\n{BOLD}Pulling live database records from Supabase...{RESET}\n")

    if not load_env():
        return 1

    # 1. Pull Projects
    print("Pulling Projects…")
    projects_db = supabase_get('projects')
    if projects_db is not None:
        projects_clean = []
        for p in projects_db:
            p['id'] = p.pop('slug') # Map slug back to id
            p.pop('created_at', None)
            p.pop('updated_at', None)
            projects_clean.append(p)
        
        # Sort deterministically by id to prevent random git diffs
        projects_clean.sort(key=lambda x: x['id'])
        
        output_path = os.path.join(ROOT, 'src', 'data', 'projects.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(projects_clean, f, indent=2, ensure_ascii=False)
        print(f"  [{GREEN}✓{RESET}] Saved {len(projects_clean)} projects to projects.json")
    else:
        print(f"  [{RED}✗{RESET}] Failed to fetch projects.")

    # 2. Pull Skills
    print("Pulling Skills…")
    skills_db = supabase_get('skills')
    if skills_db is not None:
        skills_clean = []
        for s in skills_db:
            s.pop('id', None) # Remove UUID PK
            s.pop('created_at', None)
            s.pop('updated_at', None)
            skills_clean.append(s)
        
        # Sort deterministically by name to prevent random git diffs
        skills_clean.sort(key=lambda x: x['name'])
        
        output_path = os.path.join(ROOT, 'src', 'data', 'skills.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(skills_clean, f, indent=2, ensure_ascii=False)
        print(f"  [{GREEN}✓{RESET}] Saved {len(skills_clean)} skills to skills.json")
    else:
        print(f"  [{RED}✗{RESET}] Failed to fetch skills.")

    # 3. Pull Certificates
    print("Pulling Certificates…")
    certs_db = supabase_get('certificates')
    if certs_db is not None:
        certs_clean = []
        for c in certs_db:
            c['id'] = c.pop('slug') # Map slug back to id
            c.pop('created_at', None)
            certs_clean.append(c)
        
        # Sort deterministically by id to prevent random git diffs
        certs_clean.sort(key=lambda x: x['id'])
        
        output_path = os.path.join(ROOT, 'src', 'data', 'certificates.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(certs_clean, f, indent=2, ensure_ascii=False)
        print(f"  [{GREEN}✓{RESET}] Saved {len(certs_clean)} certificates to certificates.json")
    else:
        print(f"  [{RED}✗{RESET}] Failed to fetch certificates.")

    # 4. Pull Profile (Resume)
    print("Pulling Resume Profile…")
    profile_db = supabase_get('profile', 'id=eq.1')
    if profile_db and len(profile_db) > 0:
        resume_data = profile_db[0].get('data', {})
        output_path = os.path.join(ROOT, 'src', 'data', 'resume.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(resume_data, f, indent=2, ensure_ascii=False)
        print(f"  [{GREEN}✓{RESET}] Saved resume data to resume.json")
    else:
        print(f"  [{RED}✗{RESET}] Failed to fetch resume profile.")

    # 5. Pull Blog Posts
    print("Pulling Blog Posts…")
    posts_db = supabase_get('posts')
    if posts_db is not None:
        posts_dir = os.path.join(ROOT, 'src', 'content', 'posts')
        os.makedirs(posts_dir, exist_ok=True)
        
        # Track slugs fetched to prune local files that were deleted in database
        fetched_slugs = set()
        for p in posts_db:
            slug = p.get('slug')
            if not slug:
                continue
            fetched_slugs.add(f"{slug}.md")
            
            # Format frontmatter and markdown body
            tags = p.get('tags', [])
            if isinstance(tags, str):
                try:
                    tags = json.loads(tags)
                except Exception:
                    tags = []
            
            file_content = f"""---
title: "{p.get('title', '')}"
date: "{p.get('date', '')}"
excerpt: "{p.get('excerpt', '')}"
tags: {json.dumps(tags)}
coverImage: "{p.get('coverImage', '/images/blog/default.jpg')}"
---

{p.get('content', '')}
"""
            file_path = os.path.join(posts_dir, f"{slug}.md")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_content)
        
        # Prune local markdown files that are not in the database
        if os.path.exists(posts_dir):
            for file_name in os.listdir(posts_dir):
                if file_name.endswith('.md') and file_name not in fetched_slugs:
                    try:
                        os.remove(os.path.join(posts_dir, file_name))
                        print(f"  [Pruned] Removed local post `{file_name}` because it was deleted in Supabase.")
                    except Exception:
                        pass
        
        print(f"  [{GREEN}✓{RESET}] Backed up {len(posts_db)} blog posts to src/content/posts/")
    else:
        print(f"  [{RED}✗{RESET}] Failed to fetch blog posts.")

    print(f"\n{GREEN}{BOLD}Sync complete!{RESET} All local backups have been updated to match Supabase.\n")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())

