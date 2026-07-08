#!/usr/bin/env python3
import os
import sys
import re
import json
import base64
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

# Import the Supabase sync helper
try:
    from sync_supabase import (
        sync_projects,
        sync_skills,
        sync_certificates,
        sync_resume,
        call_rpc,
        fetch_page_visits,
        sync_blog_post,
        delete_blog_post,
        delete_project,
        delete_skill,
        delete_certificate,
    )
    HAS_SYNC = True
except ImportError:
    HAS_SYNC = False

from sync_assets import cleanup_staged_file, copy_to_staged_file, delete_existing_files, finalize_staged_file
from sync_git import commit_and_push_paths
from sync_json import atomic_write_json, atomic_write_text
from sync_validation import (
    validate_blog_fields,
    validate_certificate_response,
    validate_project_response,
)

# Import Streamlit - will fail gracefully if not installed
try:
    import streamlit as st
except ImportError:
    print("Error: Streamlit is not installed. Run 'pip install streamlit' to run this manager.")
    sys.exit(1)

# Try importing PIL (Pillow) for image conversions
try:
    from PIL import Image as PILImage
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

st.set_page_config(
    page_title="Resume & Portfolio Manager",
    page_icon="💼",
    layout="wide",
)

# ==========================================
# Env Loader & API Helpers
# ==========================================
def load_env():
    env_vars = dict(os.environ)
    env_path = ".env.local"
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip()
    return env_vars

env = load_env()
GEMINI_API_KEY = env.get("GEMINI_API_KEY")

def trigger_revalidation():
    secret = env.get("SYNC_API_KEY")
    if secret:
        urls = [
            f"http://localhost:3000/api/revalidate?secret={secret}",
            f"https://prateeq.in/api/revalidate?secret={secret}"
        ]
        for u in urls:
            try:
                req = urllib.request.Request(u, method="POST")
                with urllib.request.urlopen(req, timeout=3) as resp:
                    pass
            except Exception:
                pass

# Helper to send API request to Gemini
def call_gemini(prompt, file_data=None, file_mime=None):
    def show_api_error(msg, detail=None):
        print(f"[Gemini API Error] {msg}")
        if detail:
            print(f"Details: {detail}")
        import threading
        if threading.current_thread() is threading.main_thread():
            st.error(msg)
            if detail:
                st.code(detail, language="json")
        else:
            raise ValueError(f"{msg} | {detail}" if detail else msg)

    if not GEMINI_API_KEY:
        show_api_error("Missing GEMINI_API_KEY in .env.local. Please add your key first.")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    
    parts = [{"text": prompt}]
    if file_data and file_mime:
        parts.append({
            "inlineData": {
                "mimeType": file_mime,
                "data": file_data
            }
        })
        
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            response_data = json.loads(res.read().decode("utf-8"))
            candidates = response_data.get("candidates", [])
            if candidates:
                text_content = candidates[0]["content"]["parts"][0]["text"]
                text = text_content.strip()
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    # 1. Attempt to extract JSON from markdown block
                    pattern = r"```(?:json)?\s*(.*?)\s*```"
                    match = re.search(pattern, text, re.DOTALL)
                    if match:
                        try:
                            return json.loads(match.group(1).strip())
                        except json.JSONDecodeError:
                            pass
                    
                    # 2. Attempt brace-matching fallback for raw JSON inside conversational text
                    first_brace = text.find('{')
                    last_brace = text.rfind('}')
                    if first_brace != -1 and last_brace != -1:
                        try:
                            return json.loads(text[first_brace:last_brace+1])
                        except json.JSONDecodeError:
                            pass
                    raise
            else:
                show_api_error("Error: Empty candidates response from Gemini")
                return None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        show_api_error(f"Gemini API Error {e.code}: {e.reason}", err_msg)
        return None
    except Exception as e:
        show_api_error(f"API Connection Error: {e}")
        return None

# Helper to safely render local images from filesystem without triggering Streamlit MediaFileStorage KeyError bugs
def st_image_safe(image_path_or_bytes, **kwargs):
    if isinstance(image_path_or_bytes, str):
        if os.path.exists(image_path_or_bytes):
            try:
                with open(image_path_or_bytes, "rb") as f:
                    data = f.read()
                st.image(data, **kwargs)
            except Exception as e:
                st.error(f"Error loading image {image_path_or_bytes}: {e}")
        else:
            st.warning(f"No image currently found at path: {image_path_or_bytes}")
    else:
        st.image(image_path_or_bytes, **kwargs)

# Fallback database of common tech skills to avoid calling Gemini API entirely for standard tags (prevents 429 errors)
FALLBACK_SKILLS = {
    "excel": {
        "name": "Microsoft Excel",
        "icon": "file-text",
        "description": "Analyzing data, building spreadsheets, and organizing complex datasets.",
        "category": "logic",
        "color": "#107C41"
    },
    "spreadsheet": {
        "name": "Spreadsheets",
        "icon": "layout",
        "description": "Structuring tabular data, utilizing formulas, and modeling numeric information.",
        "category": "logic",
        "color": "#107C41"
    },
    "data analysis": {
        "name": "Data Analysis",
        "icon": "bar-chart",
        "description": "Extracting insights from raw records, cleaning datasets, and visualizing metrics.",
        "category": "logic",
        "color": "#00897B"
    },
    "microsoft office": {
        "name": "Microsoft Office",
        "icon": "briefcase",
        "description": "Utilizing productivity applications to document workflows and present reports.",
        "category": "dynamic",
        "color": "#D83B01"
    },
    "business intelligence": {
        "name": "Business Intelligence",
        "icon": "trending-up",
        "description": "Synthesizing operational data into dashboards and strategic insights.",
        "category": "logic",
        "color": "#F2C811"
    },
    "supabase": {
        "name": "Supabase",
        "icon": "database",
        "description": "Orchestrating backend authentication, building postgres databases, and managing real-time data flow.",
        "category": "logic",
        "color": "#3ECF8E"
    },
    "fastapi": {
        "name": "FastAPI",
        "icon": "server",
        "description": "Building async REST APIs with data serialization and endpoint design.",
        "category": "logic",
        "color": "#059669"
    },
    "react": {
        "name": "React / Next.js",
        "icon": "atom",
        "description": "Building component-driven web apps with server/client architecture.",
        "category": "dynamic",
        "color": "#61DAFB"
    },
    "python": {
        "name": "Python",
        "icon": "terminal",
        "description": "Writing utility scripts, automation pipelines, and backend services.",
        "category": "logic",
        "color": "#3776AB"
    },
    "framer motion": {
        "name": "Framer Motion",
        "icon": "sparkles",
        "description": "Orchestrating fluid React transitions, micro-animations, and viewport-driven scroll effects.",
        "category": "product",
        "color": "#E10098"
    },
    "sqlite": {
        "name": "SQLite",
        "icon": "database",
        "description": "Managing light, relational databases for local automation and offline mobile data storage.",
        "category": "logic",
        "color": "#003B57"
    },
    "flutter": {
        "name": "Flutter / Dart",
        "icon": "smartphone",
        "description": "Building cross-platform mobile apps, designing reactive layouts, and compiled state systems.",
        "category": "dynamic",
        "color": "#02569B"
    },
    "next.js": {
        "name": "React / Next.js",
        "icon": "atom",
        "description": "Building full-stack web apps with React and Next.js App Router.",
        "category": "dynamic",
        "color": "#000000"
    },
    "git": {
        "name": "Git & GitHub",
        "icon": "git-branch",
        "description": "Managing branch workflows, commit history, and deployment sync.",
        "category": "dynamic",
        "color": "#F05032"
    },
    "github": {
        "name": "Git & GitHub",
        "icon": "git-branch",
        "description": "Managing branch workflows, commit history, and deployment sync.",
        "category": "dynamic",
        "color": "#181717"
    }
}

# Helper to generate skill proposals from a list of technology tags in a single batch call to avoid 429 rate limits
def generate_skills_from_tags_batch(tags_list):
    if not tags_list:
        return []
    tags_str = ", ".join([f'"{t}"' for t in tags_list])
    prompt = f"""
    You are a technical portfolio writer. Generate a list of structured Skill entries for the following technology tags: {tags_str}.
    
    For each tag, output a structured JSON object. The response must be a JSON array of objects, where each object matches this format:
    {{
      "tag": "the original lowercase tag name that was passed",
      "name": "Formatted capitalization of the technology (e.g. 'react' -> 'React / Next.js', 'fastapi' -> 'FastAPI', 'excel' -> 'Microsoft Excel', 'supabase' -> 'Supabase', etc.)",
      "icon": "A lowercase string representing a relevant Lucide icon (e.g. 'atom', 'server', 'database', 'terminal', 'layout', 'paintbrush', 'sparkles', 'brain', 'bot', 'git-branch', 'cloud', 'figma', 'zap', 'image', 'file-text')",
      "description": "A short 1-sentence description of the skill focusing on what it enables the developer to build or accomplish (e.g., 'Building component-driven web apps with server/client architecture.', 'Writing utility scripts and automation pipelines.', 'Crafting responsive layouts and design systems.'). Maximum 15 words.",
      "category": "One of 'orchestration', 'logic', 'product', or 'dynamic'",
      "color": "A hex color code suitable for the technology brand"
    }}
    
    Do not return any conversational text, markdown packaging, or backticks. Only return the raw JSON array of objects.
    """
    try:
        res = call_gemini(prompt)
        if isinstance(res, list):
            return res
        elif isinstance(res, dict):
            for key in ["skills", "list", "array"]:
                if key in res and isinstance(res[key], list):
                    return res[key]
            return [res]
    except Exception as e:
        st.error(f"Error generating skills in batch: {e}")
    return []

# Helper to check a list of tags and generate pending skills for new ones using batch processing & local fallbacks
def check_and_add_pending_skills(tags_list):
    current_skills = parse_skills_file()
    existing_skill_names = {s.get("name", "").lower() for s in current_skills}
    
    # Also fetch existing pending list to avoid duplicates
    if 'pending_skills' not in st.session_state:
        st.session_state.pending_skills = []
    pending_names = {s.get("name", "").lower() for s in st.session_state.pending_skills}
    
    new_tags = []
    for tag in tags_list:
        tag_clean = tag.strip().lower()
        if not tag_clean:
            continue
            
        # Check if the tag matches any existing or pending skill name
        is_existing = False
        for name in existing_skill_names:
            if tag_clean == name or tag_clean in name or name in tag_clean:
                is_existing = True
                break
        for name in pending_names:
            if tag_clean == name or tag_clean in name or name in tag_clean:
                is_existing = True
                break
                
        if not is_existing:
            new_tags.append(tag_clean)
            
    if new_tags:
        # Resolve tags locally using fallback database first (bypasses Gemini completely)
        tags_needing_gemini = []
        for tag in new_tags:
            if tag in FALLBACK_SKILLS:
                st.session_state.pending_skills.append(FALLBACK_SKILLS[tag])
                st.toast(f"💡 Resolved new tag '{tag}' locally from database!")
            else:
                tags_needing_gemini.append(tag)
                
        # If there are still unknown tags needing Gemini, request in batch
        if tags_needing_gemini:
            batch_tags = tags_needing_gemini[:5]
            st.toast(f"🔍 New unknown tags: {', '.join(batch_tags)}. Calling Gemini (Batch)...")
            proposals = generate_skills_from_tags_batch(batch_tags)
            
            if proposals:
                added_count = 0
                for prop in proposals:
                    if prop.get("name"):
                        st.session_state.pending_skills.append(prop)
                        added_count += 1
                st.toast(f"💡 Generated {added_count} skill proposals!")
            else:
                # If Gemini fails (rate limits/quota exhausted), populate with a generic fallback template to keep the app working
                st.warning("⚠️ Gemini API limit reached or key exhausted. Created template proposals for missing tags.")
                for tag in batch_tags:
                    fallback_prop = {
                        "name": tag.capitalize(),
                        "icon": "sparkles",
                        "description": f"Building with {tag} for project development and implementation.",
                        "category": "dynamic",
                        "color": "#00E676"
                    }
                    st.session_state.pending_skills.append(fallback_prop)

# ==========================================
# Safe Subprocess & Input Sanitization Helpers
# ==========================================
def run_async_task(task_func, key_prefix):
    """
    Executes a task function in a background thread.
    Maintains status in session state:
      - st.session_state[f'{key_prefix}_status']: "idle", "running", "success", "error"
      - st.session_state[f'{key_prefix}_result']: Return value on success
      - st.session_state[f'{key_prefix}_error']: Error message on failure
    """
    import threading
    try:
        from streamlit.runtime.scriptrunner import add_script_run_ctx, get_script_run_ctx
    except ImportError:
        try:
            from streamlit.scriptrunner import add_script_run_ctx, get_script_run_ctx
        except ImportError:
            add_script_run_ctx = None
            get_script_run_ctx = None

    status_key = f"{key_prefix}_status"
    result_key = f"{key_prefix}_result"
    error_key = f"{key_prefix}_error"
    
    if status_key not in st.session_state:
        st.session_state[status_key] = "idle"
        
    if st.session_state[status_key] == "running":
        return

    st.session_state[status_key] = "running"
    st.session_state[error_key] = None

    # Capture session ID from main thread context to trigger a server-side rerun
    session_id = None
    if get_script_run_ctx:
        try:
            ctx = get_script_run_ctx()
            if ctx:
                session_id = ctx.session_id
        except Exception:
            pass

    def worker():
        try:
            res = task_func()
            st.session_state[result_key] = res
            st.session_state[status_key] = "success"
        except Exception as e:
            st.session_state[error_key] = str(e)
            st.session_state[status_key] = "error"
        finally:
            # Trigger Streamlit to rerun the script to update the UI
            try:
                if session_id:
                    from streamlit.runtime import Runtime
                    runtime = Runtime.instance()
                    session_info = runtime._session_mgr.get_active_session_info(session_id)
                    if session_info:
                        session_info.session.request_rerun(None)
                    else:
                        st.rerun()
                else:
                    st.rerun()
            except BaseException:
                try:
                    st.rerun()
                except BaseException:
                    pass

    thread = threading.Thread(target=worker)
    thread.daemon = True
    if add_script_run_ctx:
        add_script_run_ctx(thread)
    thread.start()
def run_safe_git_command(args, cwd=None):
    """
    Safely execute a git subprocess command.
    Returns (success, output_text_or_error_msg)
    """
    import subprocess
    if not args or args[0] != "git":
        return False, "Invalid command program: only 'git' is allowed."
        
    # Hardened check: Ensure git subcommand is strictly whitelisted and no root options are passed
    if len(args) < 2:
        return False, "Git command is missing subcommand."
        
    allowed_subcommands = {"log", "status", "add", "commit", "push", "diff"}
    subcommand = args[1]
    if subcommand not in allowed_subcommands:
        return False, f"Access denied: Git subcommand '{subcommand}' is not whitelisted."
        
    # Prevent flag/config injection flags anywhere in command arguments (e.g. --config, --exec-path)
    banned_substrings = {"--config", "--exec-path", "--upload-pack", "--receive-pack"}
    for arg in args[2:]:
        for banned in banned_substrings:
            if banned in arg:
                return False, f"Access denied: Dangerous parameter '{banned}' detected in command arguments."
    
    if cwd:
        cwd = os.path.realpath(cwd)
        if not os.path.isdir(cwd):
            return False, f"Directory does not exist: {cwd}"
            
        # For safety, ensure cwd is inside the user's home directory or project directory
        home_dir = os.path.expanduser("~")
        if not cwd.startswith(home_dir) and not cwd.startswith(os.getcwd()):
            return False, "Access denied: Working directory must be inside home directory or project directory."
            
    try:
        output = subprocess.check_output(
            args,
            cwd=cwd,
            stderr=subprocess.STDOUT
        ).decode("utf-8")
        return True, output
    except subprocess.CalledProcessError as e:
        err_msg = e.output.decode("utf-8", errors="ignore") if e.output else str(e)
        return False, f"Git command failed: {err_msg.strip()}"
    except FileNotFoundError:
        return False, "System executable 'git' not found in PATH."
    except Exception as e:
        return False, f"Process execution error: {str(e)}"

def fetch_github_repo_metadata(github_url):
    """
    Fetches README and recent commits from a given GitHub repository URL.
    Returns a dictionary of context data or None.
    """
    if not github_url or "github.com" not in github_url:
        return None
    
    parts = github_url.split("github.com/")
    if len(parts) < 2:
        return None
    slug = parts[1].strip().strip("/")
    if slug.endswith(".git"):
        slug = slug[:-4]
    slug_parts = slug.split("/")
    if len(slug_parts) < 2:
        return None
        
    owner, repo = slug_parts[0], slug_parts[1]
    
    # 1. Look for local checkout fallback first (sister directories in Developer directory)
    parent_dir = os.path.dirname(os.path.abspath(os.getcwd()))
    local_dir = None
    
    candidates = [
        repo,
        repo.replace("-", "_"),
        repo + "_Antigravity",
        repo.replace("-", "_") + "_Antigravity"
    ]
    for candidate in candidates:
        path = os.path.join(parent_dir, candidate)
        if os.path.isdir(path):
            local_dir = path
            break
            
    if not local_dir and os.path.isdir(parent_dir):
        try:
            norm_repo = repo.lower().replace("-", "").replace("_", "")
            for entry in os.listdir(parent_dir):
                entry_path = os.path.join(parent_dir, entry)
                if os.path.isdir(entry_path):
                    norm_entry = entry.lower().replace("-", "").replace("_", "")
                    if norm_entry == norm_repo or norm_entry == norm_repo + "antigravity":
                        local_dir = entry_path
                        break
        except Exception:
            pass

    if local_dir:
        # Fetch README locally
        readme = ""
        for filename in ["README.md", "readme.md", "README.markdown", "README.txt"]:
            readme_path = os.path.join(local_dir, filename)
            if os.path.isfile(readme_path):
                try:
                    with open(readme_path, "r", encoding="utf-8") as f:
                        readme = f.read(1500)
                    break
                except Exception:
                    pass
                    
        # Fetch recent commits locally using run_safe_git_command
        commits_text = ""
        try:
            success, logs = run_safe_git_command(["git", "log", "-n", "3", "--oneline"], cwd=local_dir)
            if success:
                commits_text = logs.strip()
        except Exception:
            pass
            
        return {
            "slug": f"{owner}/{repo} (Local fallback)",
            "readme": readme if readme else "No README found.",
            "recent_commits": commits_text if commits_text else "No recent commits fetched."
        }

    
    # Helper to fetch file from raw content
    def fetch_file_content(resolved_repo, url_path):
        url = f"https://raw.githubusercontent.com/{owner}/{resolved_repo}/{url_path}"
        headers = {"User-Agent": "Mozilla/5.0"}
        token = env.get("GITHUB_TOKEN") or env.get("GITHUB_PAT") or env.get("GH_TOKEN")
        if token:
            headers["Authorization"] = f"token {token}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as res:
                return res.read().decode("utf-8")
        except Exception:
            return ""

    # Check case-insensitive match for the repo
    resolved_repo = repo
    commits_url = f"https://api.github.com/repos/{owner}/{resolved_repo}/commits"
    headers = {"User-Agent": "Mozilla/5.0"}
    token = env.get("GITHUB_TOKEN") or env.get("GITHUB_PAT") or env.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"
        
    req = urllib.request.Request(commits_url, headers=headers)
    try:
        # Check if the repo name resolves directly
        with urllib.request.urlopen(req, timeout=5) as res:
            pass
    except urllib.error.HTTPError as e:
        if e.code == 404:
            # Query user repositories to resolve naming discrepancies (casing, underscores, hyphens)
            repos_url = f"https://api.github.com/users/{owner}/repos"
            req_repos = urllib.request.Request(repos_url, headers=headers)
            try:
                with urllib.request.urlopen(req_repos, timeout=5) as res:
                    repos_list = json.loads(res.read().decode("utf-8"))
                    for r in repos_list:
                        clean_r_name = r["name"].lower().replace("-", "").replace("_", "")
                        clean_repo_name = repo.lower().replace("-", "").replace("_", "")
                        if clean_r_name == clean_repo_name:
                            resolved_repo = r["name"]
                            break
            except Exception:
                pass

    # Fetch commits with resolved repo name
    commits_text = ""
    commits_url = f"https://api.github.com/repos/{owner}/{resolved_repo}/commits"
    req = urllib.request.Request(commits_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            commits = json.loads(res.read().decode("utf-8"))
            commits_text = "\n".join([f"- {c['sha'][:7]} {c['commit']['message'].splitlines()[0]}" for c in commits[:3]])
    except Exception:
        pass

    # Fetch README with resolved repo name and multiple fallbacks
    readme = ""
    for branch in ["main", "master", "dev", "develop"]:
        for filename in ["README.md", "readme.md", "README.markdown", "README.txt"]:
            readme = fetch_file_content(resolved_repo, f"{branch}/{filename}")
            if readme:
                break
        if readme:
            break

    if readme:
        readme = readme[:1500]  # Limit to avoid huge prompt sizes

    return {
        "slug": f"{owner}/{resolved_repo}",
        "readme": readme if readme else "No README found.",
        "recent_commits": commits_text if commits_text else "No recent commits fetched."
    }

def sanitize_local_path(path_input):
    """
    Sanitize and validate a local directory path.
    Returns (is_safe, resolved_path, error_message)
    """
    import os
    if not path_input:
        return False, None, "Path cannot be empty."
        
    path_input = path_input.strip()
    
    # Prevent flag injection
    if path_input.startswith("-"):
        return False, None, "Path cannot start with '-' to prevent CLI flag injection."
        
    # Check for invalid characters (null byte, control characters, newlines)
    if "\x00" in path_input or "\n" in path_input or "\r" in path_input:
        return False, None, "Path contains invalid control characters."
        
    # Resolve real path (expands relative elements like . and .. and symlinks)
    try:
        resolved = os.path.realpath(path_input)
    except Exception as e:
        return False, None, f"Failed to resolve path: {str(e)}"
        
    # Ensure it exists and is a directory
    if not os.path.exists(resolved):
        return False, None, "Directory does not exist."
    if not os.path.isdir(resolved):
        return False, None, "Path is not a valid directory."
        
    # Check if path is within home directory or project directory
    home_dir = os.path.expanduser("~")
    if not resolved.startswith(home_dir) and not resolved.startswith(os.getcwd()):
        return False, None, "Access denied: Path must be inside home directory or project directory."
        
    # Check if a .git directory exists inside it
    git_dir = os.path.join(resolved, ".git")
    if not os.path.exists(git_dir) or not os.path.isdir(git_dir):
        return False, None, "Path is not a Git repository (missing '.git' folder)."
        
    # All checks passed
    return True, resolved, None

# ==========================================
# TS Data Parsers (Projects, Resume, Certs)
# ==========================================

# Parse projects.json (Now reads projects.json + Supabase)
def parse_projects_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_projects
            data = fetch_projects()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch projects from Supabase: {e}")
            
    path = "src/data/projects.json"
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local projects.json: {e}")
    return []

# Write projects.json (Now writes projects.json + Supabase)
def write_projects_file(projects):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_projects(projects)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = "src/data/projects.json"
    try:
        atomic_write_json(path, projects)
    except Exception as e:
        raise Exception(f"Failed to write projects to local file: {str(e)}")
        
    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

# Parse resume.json
def extract_literal(content, start_sig):
    idx = content.find(start_sig)
    if idx == -1:
        return None
    # Find first opening bracket or brace
    start_char_idx = -1
    start_char = None
    for i in range(idx + len(start_sig), len(content)):
        if content[i] in ['{', '[']:
            start_char_idx = i
            start_char = content[i]
            break
    if start_char_idx == -1:
        return None
    
    end_char = '}' if start_char == '{' else ']'
    brace_count = 0
    in_string = False
    quote_char = None
    escaped = False
    
    for i in range(start_char_idx, len(content)):
        char = content[i]
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if in_string:
            if char == quote_char:
                in_string = False
                quote_char = None
            continue
        else:
            if char in ["'", '"', '`']:
                in_string = True
                quote_char = char
                continue
            elif char == start_char:
                brace_count += 1
            elif char == end_char:
                brace_count -= 1
                if brace_count == 0:
                    return content[start_char_idx : i + 1]
    return None

def parse_js_object(js_str):
    idx = 0
    length = len(js_str)
    
    def skip_whitespace_and_comments():
        nonlocal idx
        while idx < length:
            if js_str[idx].isspace():
                idx += 1
            elif js_str[idx:idx+2] == '//':
                idx = js_str.find('\n', idx)
                if idx == -1:
                    idx = length
            elif js_str[idx:idx+2] == '/*':
                end = js_str.find('*/', idx + 2)
                if end == -1:
                    idx = length
                else:
                    idx = end + 2
            else:
                break
                
    def parse_value():
        skip_whitespace_and_comments()
        if idx >= length:
            raise ValueError("Unexpected end of input")
        
        char = js_str[idx]
        if char == '{':
            return parse_object()
        elif char == '[':
            return parse_array()
        elif char in ['"', "'", '`']:
            return parse_string(char)
        else:
            return parse_primitive()
            
    def parse_string(quote):
        nonlocal idx
        start = idx
        idx += 1
        val_chars = []
        while idx < length:
            char = js_str[idx]
            if char == '\\':
                if idx + 1 < length:
                    esc_char = js_str[idx+1]
                    if esc_char == 'n':
                        val_chars.append('\n')
                    elif esc_char == 't':
                        val_chars.append('\t')
                    elif esc_char == 'r':
                        val_chars.append('\r')
                    else:
                        val_chars.append(esc_char)
                    idx += 2
                else:
                    idx += 1
            elif char == quote:
                idx += 1
                return "".join(val_chars)
            else:
                val_chars.append(char)
                idx += 1
        raise ValueError(f"Unterminated string starting at {start}")
        
    def parse_object():
        nonlocal idx
        idx += 1
        obj = {}
        while True:
            skip_whitespace_and_comments()
            if idx >= length:
                raise ValueError("Unterminated object")
            if js_str[idx] == '}':
                idx += 1
                return obj
                
            key = parse_key()
            skip_whitespace_and_comments()
            if idx >= length or js_str[idx] != ':':
                raise ValueError(f"Expected ':' after key at {idx}")
            idx += 1
            
            val = parse_value()
            obj[key] = val
            
            skip_whitespace_and_comments()
            if idx >= length:
                raise ValueError("Unterminated object")
            if js_str[idx] == ',':
                idx += 1
            elif js_str[idx] == '}':
                idx += 1
                return obj
            else:
                pass
                
    def parse_key():
        nonlocal idx
        skip_whitespace_and_comments()
        char = js_str[idx]
        if char in ['"', "'"]:
            return parse_string(char)
        start = idx
        while idx < length:
            c = js_str[idx]
            if c.isalnum() or c in ['_', '$', '-']:
                idx += 1
            else:
                break
        if start == idx:
            raise ValueError(f"Expected key at {start}")
        return js_str[start:idx]
        
    def parse_array():
        nonlocal idx
        idx += 1
        arr = []
        while True:
            skip_whitespace_and_comments()
            if idx >= length:
                raise ValueError("Unterminated array")
            if js_str[idx] == ']':
                idx += 1
                return arr
            
            val = parse_value()
            arr.append(val)
            
            skip_whitespace_and_comments()
            if idx >= length:
                raise ValueError("Unterminated array")
            if js_str[idx] == ',':
                idx += 1
            elif js_str[idx] == ']':
                idx += 1
                return arr
                
# Parse resume.json + Supabase
def parse_resume_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_resume
            data = fetch_resume()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch resume from Supabase: {e}")

    path = "src/data/resume.json"
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local resume.json: {e}")
    return None

# Parse skills.json + Supabase
def parse_skills_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_skills
            data = fetch_skills()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch skills from Supabase: {e}")

    path = "src/data/skills.json"
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local skills.json: {e}")
    return []

# Write skills.json + Supabase
def write_skills_file(skills_list):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_skills(skills_list)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = "src/data/skills.json"
    try:
        atomic_write_json(path, skills_list)
    except Exception as e:
        raise Exception(f"Failed to write skills to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

# Write resume.json + Supabase
def write_resume_file(resume):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_resume(resume)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = "src/data/resume.json"
    try:
        atomic_write_json(path, resume)
    except Exception as e:
        raise Exception(f"Failed to write resume to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

# Parse certificates.json + Supabase
def parse_certificates_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_certificates
            data = fetch_certificates()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch certificates from Supabase: {e}")

    path = "src/data/certificates.json"
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local certificates.json: {e}")
    return []

# Write certificates.json + Supabase
def write_certificates_file(certificates):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_certificates(certificates)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = "src/data/certificates.json"
    try:
        atomic_write_json(path, certificates)
    except Exception as e:
        raise Exception(f"Failed to write certificates to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

# Helpers
def get_mime_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return "application/pdf"
    elif ext in [".png", ".webp"]:
        return f"image/{ext[1:]}"
    elif ext in [".jpg", ".jpeg"]:
        return "image/jpeg"
    return None

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

# Image save helper used globally
def save_uploaded_image(uploaded_file, target_path, target_format):
    try:
        # Ensure target directory exists
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        if HAS_PIL:
            image = PILImage.open(uploaded_file)
            # Keep RGBA for PNG and WEBP if they have transparency
            if target_format.upper() == 'WEBP':
                image.save(target_path, format='WEBP', quality=90)
            elif target_format.upper() == 'PNG':
                image.save(target_path, format='PNG')
            else:
                if image.mode in ('RGBA', 'LA'):
                    image = image.convert('RGB')
                image.save(target_path, format=target_format.upper())
            return True, f"Successfully converted and saved image to `{target_path}`!"
        else:
            file_ext = os.path.splitext(uploaded_file.name)[1].lower()
            # Treat jpeg and jpg as same
            clean_ext = file_ext.replace('jpeg', 'jpg')
            clean_target = f".{target_format.lower()}".replace('jpeg', 'jpg')
            if clean_ext == clean_target:
                with open(target_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                return True, f"Successfully saved raw `{uploaded_file.name}` directly!"
            else:
                return False, f"Format mismatch! Uploaded `{file_ext}` but target needs `.{target_format.lower()}`. Install `pillow` or upload a matching file."
    except Exception as e:
        return False, f"Failed to save: {e}"

def git_commit_push_file(file_path, commit_message):
    try:
        return commit_and_push_paths(run_safe_git_command, [file_path], commit_message, cwd=os.getcwd())
    except Exception as e:
        return False, f"Git operations failed: {str(e)}"

# ==========================================
# Streamlit Interface Layout
# ==========================================

# Custom CSS for Premium UI Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=JetBrains+Mono:wght@400;700&family=Quicksand:wght@300..700&display=swap');
    
    /* Font overrides */
    html, body, [class*="css"], .stWidgetFormContainer {
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    
    h1, h2, h3, h4, h5, h6, .section-header {
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 700 !important;
    }
    
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Core Page Styling with sweet gradients, candy violet background, and sugar grid texture */
    .stApp {
        background-color: #1a162b !important;
        background-image: 
            linear-gradient(rgba(255, 117, 151, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 117, 151, 0.03) 1px, transparent 1px),
            radial-gradient(at 10% 10%, rgba(255, 117, 151, 0.18) 0px, transparent 50%),
            radial-gradient(at 90% 20%, rgba(90, 214, 255, 0.16) 0px, transparent 50%),
            radial-gradient(at 50% 80%, rgba(220, 181, 255, 0.18) 0px, transparent 50%) !important;
        background-size: 32px 32px, 32px 32px, auto, auto, auto !important;
        background-attachment: fixed !important;
        color: #e2dff0 !important;
    }
    
    /* Hide the Streamlit Deploy button specifically */
    .stAppDeployButton,
    [data-testid="stAppDeployButton"],
    .stDeployButton,
    [data-testid="stHeaderDeployButton"],
    header button[class*="deploy"],
    header a[href*="share.streamlit.io"],
    header [class*="AppDeployButton"] {
        display: none !important;
    }

    /* Make the header bar background transparent with default height and prevent cropping */
    header[data-testid="stHeader"],
    header[data-testid="stHeader"] > div,
    header[data-testid="stHeader"] [class*="st-emotion-cache"] {
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* Style the header toggle and settings menu icons to fit the Candy Theme */
    header[data-testid="stHeader"] button,
    header[data-testid="stHeader"] button svg,
    header[data-testid="stHeader"] button svg * {
        color: #ff7597 !important;
        fill: #ff7597 !important;
    }

    /* Maintain comfortable top padding for content */
    .block-container {
        padding-top: 3.5rem !important;
    }
    
    /* Section Headers */
    .section-header {
        font-size: 1.5rem;
        font-weight: 700;
        color: #ff7597; /* Cotton candy pink */
        margin-top: 0.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 2px dashed rgba(255, 117, 151, 0.25);
        padding-bottom: 8px;
        display: inline-block;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-family: 'Fredoka', sans-serif !important;
    }

    /* Rounded Bouncy Containers */
    div[data-testid="stVerticalBlockBorder"] {
        background: rgba(38, 32, 69, 0.6) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        margin-bottom: 24px !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25) !important;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }
    div[data-testid="stVerticalBlockBorder"]:hover {
        border-color: rgba(255, 117, 151, 0.35) !important;
        box-shadow: 0 8px 32px 0 rgba(255, 117, 151, 0.12) !important;
        transform: translateY(-2px) scale(1.005) !important;
    }

    /* Sweet Expanders */
    details[data-testid="stExpander"] {
        background: rgba(38, 32, 69, 0.4) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        border: 1px solid rgba(255, 117, 151, 0.12) !important;
        border-radius: 12px !important;
        margin-bottom: 12px !important;
        box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15) !important;
        transition: all 0.25s ease !important;
    }
    details[data-testid="stExpander"]:hover {
        border-color: rgba(255, 117, 151, 0.25) !important;
        background: rgba(38, 32, 69, 0.6) !important;
    }
    summary[data-testid="stExpanderSummary"] {
        font-weight: 700 !important;
        color: #ffffff !important;
        font-family: 'Fredoka', sans-serif !important;
    }

    /* Glossy Bouncy buttons */
    button[data-testid="baseButton-primary"] {
        background: linear-gradient(135deg, #ff7597 0%, #dcb5ff 100%) !important; /* Sweet bubblegum gradient */
        color: #100a21 !important;
        font-weight: 700 !important;
        font-family: 'Fredoka', sans-serif !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        border: none !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 15px 0 rgba(255, 117, 151, 0.3) !important;
        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        padding: 0.5rem 1.5rem !important;
    }
    button[data-testid="baseButton-primary"]:hover {
        transform: translateY(-2px) scale(1.03) !important;
        box-shadow: 0 6px 20px 0 rgba(255, 117, 151, 0.45) !important;
    }
    button[data-testid="baseButton-primary"]:active {
        transform: translateY(1px) scale(0.98) !important;
    }

    button[data-testid="baseButton-secondary"] {
        background: rgba(255, 255, 255, 0.04) !important;
        color: #e2dff0 !important;
        font-weight: 600 !important;
        font-family: 'Quicksand', sans-serif !important;
        border: 1px solid rgba(255, 117, 151, 0.2) !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1) !important;
        transition: all 0.2s ease !important;
    }
    button[data-testid="baseButton-secondary"]:hover {
        background: rgba(255, 117, 151, 0.08) !important;
        border-color: rgba(255, 117, 151, 0.4) !important;
        color: #ffffff !important;
        transform: translateY(-1px) !important;
    }

    /* Danger delete buttons */
    button[id^="del_exp_"]:hover, button[id^="del_edu_"]:hover, button[id^="rem_bul_"]:hover, button[id^="delete_"]:hover {
        border-color: rgba(255, 90, 95, 0.6) !important;
        color: #ff5a5f !important;
        background-color: rgba(255, 90, 95, 0.08) !important;
    }

    /* Glassmorphic inputs */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea, .stSelectbox>div>div>div {
        background-color: rgba(28, 22, 52, 0.8) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        border-radius: 10px !important;
        transition: all 0.25s !important;
        font-family: 'Quicksand', sans-serif !important;
        font-weight: 500 !important;
    }
    .stTextInput>div>div>input:focus, .stTextArea>div>div>textarea:focus {
        border-color: #5ad6ff !important;
        box-shadow: 0 0 10px 0 rgba(90, 214, 255, 0.3) !important;
        background-color: rgba(34, 26, 62, 0.8) !important;
    }
    
    /* Labels */
    label[data-testid="stWidgetLabel"] p {
        color: #ffb7c5 !important;
        font-weight: 600 !important;
        font-family: 'Fredoka', sans-serif !important;
    }

    /* Sidebar Glassmorphic Candy Styling */
    section[data-testid="stSidebar"] {
        background-color: #120e20 !important;
        border-right: 1px solid rgba(255, 117, 151, 0.1) !important;
    }
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] li, section[data-testid="stSidebar"] span {
        color: #e2dff0 !important;
    }
    section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] h3 {
        color: #ffffff !important;
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 700 !important;
    }
    section[data-testid="stSidebar"] .stButton>button {
        background: rgba(255, 117, 151, 0.05) !important;
        color: #ffb7c5 !important;
        border: 1px solid rgba(255, 117, 151, 0.2) !important;
    }
    section[data-testid="stSidebar"] .stButton>button:hover {
        background: rgba(255, 117, 151, 0.12) !important;
        border-color: rgba(255, 117, 151, 0.4) !important;
    }

    /* Floating Candy Tabs list */
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px !important;
        background: rgba(38, 32, 69, 0.8) !important;
        padding: 8px !important;
        border-radius: 16px !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        margin-bottom: 24px !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2) !important;
    }
    .stTabs [data-baseweb="tab"] {
        height: 40px !important;
        border-radius: 12px !important;
        background-color: transparent !important;
        color: #ffb7c5 !important;
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 600 !important;
        padding: 0px 18px !important;
        transition: all 0.25s !important;
    }
    .stTabs [data-baseweb="tab"]:hover {
        color: #ffffff !important;
        background-color: rgba(255, 117, 151, 0.08) !important;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #ff7597 0%, #dcb5ff 100%) !important;
        color: #100a21 !important;
        box-shadow: 0 4px 12px 0 rgba(255, 117, 151, 0.3) !important;
    }

    /* Custom scrollbars */
    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    ::-webkit-scrollbar-track {
        background: #1a162b;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(255, 117, 151, 0.25);
        border-radius: 10px;
        border: 3px solid #1a162b;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 117, 151, 0.45);
    }

    /* Telemetry cards */
    .telemetry-card {
        border: 1px solid rgba(255, 117, 151, 0.15);
        box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.25);
        background: rgba(38, 32, 69, 0.6);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 16px;
        text-align: center;
        transition: all 0.3s ease;
    }
    .telemetry-card:hover {
        border-color: rgba(255, 117, 151, 0.35);
        background: rgba(38, 32, 69, 0.8);
        transform: translateY(-2px);
        box-shadow: 0 12px 28px 0 rgba(255, 117, 151, 0.15);
    }
    .telemetry-card-val {
        font-size: 2.4rem;
        font-weight: 700;
        color: #5ad6ff;
        font-family: 'Fredoka', sans-serif !important;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
    }
    .telemetry-card-lbl {
        font-size: 0.75rem;
        font-weight: 700;
        color: #ffb7c5;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Quicksand', sans-serif !important;
    }

    /* Custom progress bar graphs */
    .bar-container {
        margin-bottom: 14px;
    }
    .bar-label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 0.85rem;
        font-family: 'Quicksand', sans-serif !important;
        font-weight: 700;
    }
    .bar-label {
        color: #e2dff0;
    }
    .bar-count {
        color: #ffb7c5;
    }
    .bar-track {
        background-color: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 117, 151, 0.12);
        height: 12px;
        border-radius: 6px;
        overflow: hidden;
    }
    .bar-fill {
        height: 100%;
        border-radius: 6px;
    }

    /* Skill capsules visual preview styling */
    .skill-capsule-preview {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border: 1px solid rgba(255, 117, 151, 0.15);
        border-radius: 20px;
        background: rgba(38, 32, 69, 0.6);
        font-family: 'Quicksand', sans-serif !important;
        font-weight: 700;
        font-size: 0.8rem;
        margin-right: 8px;
        margin-bottom: 8px;
        transition: all 0.2s ease;
    }
    .skill-capsule-preview:hover {
        border-color: rgba(255, 117, 151, 0.35);
        background: rgba(38, 32, 69, 0.8);
    }
    .skill-capsule-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    /* Status badge */
    .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-family: 'Fredoka', sans-serif;
        font-weight: 700;
        text-transform: uppercase;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .status-badge-bot {
        background-color: rgba(255, 90, 95, 0.12) !important;
        color: #ff767a !important;
        border-color: rgba(255, 90, 95, 0.25) !important;
    }
    .status-badge-user {
        background-color: rgba(90, 214, 255, 0.12) !important;
        color: #5ad6ff !important;
        border-color: rgba(90, 214, 255, 0.25) !important;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.markdown("""
<div style="background: rgba(38, 32, 69, 0.8); border: 1px solid rgba(255, 117, 151, 0.15); border-radius: 16px; padding: 20px; margin-bottom: 25px; text-align: center; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);">
    <div style="width: 76px; height: 76px; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center; background: rgba(255, 117, 151, 0.08); border: 1px solid rgba(255, 117, 151, 0.2); border-radius: 50%; padding: 10px;">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
            <circle cx="50" cy="50" r="38" fill="#5A8EB6" opacity="0.15" />
            <path d="M 26,45 L 32,50 L 26,55" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            <line x1="35" y1="55" x2="43" y2="55" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
            <line x1="15" y1="72" x2="85" y2="72" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
            <path d="M 32,72 C 32,46 68,46 68,72" fill="#FAF9F6" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round" />
            <path d="M 32,48 L 12,38 Q 24,53 36,55" fill="#D95D67" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" />
            <path d="M 68,48 L 88,38 Q 76,53 64,55" fill="#D95D67" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" />
            <circle cx="43" cy="58" r="6.5" fill="#2B2B36" />
            <circle cx="45" cy="55.5" r="2.5" fill="#FAF9F6" />
            <circle cx="57" cy="58" r="6.5" fill="#2B2B36" />
            <circle cx="59" cy="55.5" r="2.5" fill="#FAF9F6" />
            <ellipse cx="37" cy="63" rx="3.5" ry="2" fill="#DF8B98" opacity="0.6" />
            <ellipse cx="63" cy="63" rx="3.5" ry="2" fill="#DF8B98" opacity="0.6" />
        </svg>
    </div>
    <h3 style="color: #ffffff; margin: 0; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 1.35rem; letter-spacing: 0.5px; text-transform: uppercase;">SWEET SYNC</h3>
    <span style="display: block; color: #ffb7c5; font-size: 0.75rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; margin-top: 4px;">LOLLIPOP ENGINE</span>
    <code style="display: inline-block; background-color: rgba(255, 117, 151, 0.08); color: #ffffff; border: 1px solid rgba(255, 117, 151, 0.25); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: bold; margin-top: 10px; font-family: 'JetBrains Mono', monospace;">v1.3.0 // ACTIVE</code>
</div>
""", unsafe_allow_html=True)
# CI/CD Deployment & Status Monitor
st.sidebar.markdown("### CI/CD Deployment Status")

# Helper to fetch GitHub deployment status
def fetch_deployment_status():
    url = "https://api.github.com/repos/prat3010/Prateek_website/commits/main/status"
    headers = {"User-Agent": "Python/Streamlit-Synchronizer"}
    gh_token = env.get("GITHUB_TOKEN") or env.get("GITHUB_PAT") or env.get("GH_TOKEN")
    if gh_token:
        headers["Authorization"] = f"token {gh_token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode("utf-8"))
            state = data.get("state", "unknown")
            statuses = data.get("statuses", [])
            vercel_status = None
            for status in statuses:
                if status.get("context") == "Vercel":
                    vercel_status = status
                    break
            
            if vercel_status:
                return {
                    "state": vercel_status.get("state", "unknown"),
                    "description": vercel_status.get("description", "No description"),
                    "url": vercel_status.get("target_url", ""),
                    "updated_at": vercel_status.get("updated_at", "")
                }
            else:
                return {
                    "state": state,
                    "description": "Latest commit status fetched",
                    "url": "",
                    "updated_at": ""
                }
    except Exception as e:
        return {"error": str(e)}

# Session state cache for status to avoid hitting rate limits
if "deploy_status" not in st.session_state:
    st.session_state.deploy_status = None
if "last_checked" not in st.session_state:
    st.session_state.last_checked = None

task_status = st.session_state.get("deploy_status_task_status", "idle")

if st.session_state.deploy_status is None or task_status == "running":
    if task_status == "idle":
        run_async_task(fetch_deployment_status, "deploy_status_task")
        status = {"state": "pending", "description": "Fetching latest status in background..."}
        last_checked = "Fetching..."
    elif task_status == "running":
        status = {"state": "pending", "description": "Fetching latest status in background..."}
        last_checked = "Fetching..."
    elif task_status == "error":
        status = {"error": st.session_state.get("deploy_status_task_error", "Failed to fetch")}
        last_checked = "Error"
else:
    status = st.session_state.deploy_status
    last_checked = st.session_state.last_checked

if st.session_state.get("deploy_status_task_status") == "success":
    st.session_state.deploy_status = st.session_state.deploy_status_task_result
    st.session_state.last_checked = datetime.now().strftime("%H:%M:%S")
    st.session_state.deploy_status_task_status = "idle"
    st.rerun()

with st.sidebar.container(border=True):
    if "error" in status:
        st.error("Offline or API limit reached")
    else:
        state = status.get("state", "unknown").lower()
        desc = status.get("description", "")
        url = status.get("url", "")
        updated_at = status.get("updated_at", "")
        
        # State styling & display
        if state == "success":
            st.markdown("🟢 **STATUS: SUCCESS**")
            st.success("✅ Vercel Completed")
        elif state == "pending":
            st.markdown("🟡 **STATUS: BUILDING**")
            st.warning("🔄 Build Running...")
        elif state in ["failure", "error"]:
            st.markdown("🔴 **STATUS: FAILED**")
            st.error("❌ Build Failed")
        else:
            st.markdown(f"⚪ **STATUS: {state.upper()}**")
            st.info(desc)
            
        st.markdown(f"<small>**Description:** {desc}</small>", unsafe_allow_html=True)
        if url:
            st.markdown(f"[🔗 View Vercel logs]({url})")
            
        if updated_at:
            # Parse ISO date string
            try:
                dt = datetime.strptime(updated_at, "%Y-%m-%dT%H:%M:%SZ")
                # Convert UTC to IST (UTC + 5:30)
                ist_dt = dt + timedelta(hours=5, minutes=30)
                formatted_time = ist_dt.strftime("%b %d, %I:%M %p IST")
                st.markdown(f"<small style='color: #8A8A93;'>Deployed: {formatted_time}</small>", unsafe_allow_html=True)
            except:
                pass

    st.markdown(f"<small style='color: #8A8A93;'>Checked at: {last_checked}</small>", unsafe_allow_html=True)
    if st.button("Refresh Status", key="btn_refresh_deploy_status", width="stretch"):
        st.session_state.deploy_status = None
        st.session_state.deploy_status_task_status = "idle"
        st.rerun()


if GEMINI_API_KEY:
    st.sidebar.success("Gemini API Key loaded from .env.local")
else:
    st.sidebar.error("GEMINI_API_KEY not found in .env.local")

# Offline Mode Switcher
st.sidebar.checkbox("Offline Mode (Local JSON Only)", value=not HAS_SYNC, key="offline_mode")

# Manual button to scan for missing skills
if st.sidebar.button("Scan for Missing Skills", width="stretch"):
    all_tags = []
    if 'projects' in st.session_state and st.session_state.projects:
        for p in st.session_state.projects:
            all_tags.extend(p.get("tags", []))
    if 'certificates' in st.session_state and st.session_state.certificates:
        for c in st.session_state.certificates:
            all_tags.extend(c.get("tags", []))
    if all_tags:
        check_and_add_pending_skills(list(set(all_tags)))
        st.rerun()
    else:
        st.sidebar.info("No projects or certificates found to scan.")

# Pending Skill Approvals Sidebar UI
if 'pending_skills' in st.session_state and st.session_state.pending_skills:
    st.sidebar.markdown("---")
    st.sidebar.markdown("### Pending Skill Approvals")
    st.sidebar.info(f"You have **{len(st.session_state.pending_skills)}** pending skill(s) waiting for approval.")
    
    skill = st.session_state.pending_skills[0]
    skill_name_sanitized = skill.get('name', 'default').replace(' ', '_').lower()
    
    with st.sidebar.container(border=True):
        st.markdown(f"**Suggested Tag:** `{skill.get('name')}`")
        name = st.text_input("Name", value=skill.get('name'), key=f"pend_name_{skill_name_sanitized}")
        icon = st.text_input("Icon (Lucide)", value=skill.get('icon', 'sparkles'), key=f"pend_icon_{skill_name_sanitized}")
        desc = st.text_area("Description", value=skill.get('description', ''), key=f"pend_desc_{skill_name_sanitized}")
        
        categories_opts = ['orchestration', 'logic', 'product', 'dynamic']
        default_cat = skill.get('category', 'dynamic')
        if default_cat not in categories_opts:
            default_cat = 'dynamic'
        category = st.selectbox("Category", options=categories_opts, index=categories_opts.index(default_cat), key=f"pend_cat_{skill_name_sanitized}")
        
        color = st.text_input("Hex Color", value=skill.get('color', '#00E676'), key=f"pend_color_{skill_name_sanitized}")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Approve", key="approve_skill_btn", type="primary"):
                current_skills = parse_skills_file()
                if any(s.get("name", "").lower() == name.lower() for s in current_skills):
                    st.sidebar.error("Skill already exists!")
                else:
                    new_skill = {
                        "name": name,
                        "name_business": name,
                        "icon": icon,
                        "description": desc,
                        "category": category,
                        "color": color
                    }
                    current_skills.append(new_skill)
                    try:
                        write_skills_file(current_skills)
                        st.sidebar.success(f"Added {name}!")
                        st.session_state.pending_skills.pop(0)
                        st.session_state.skills = current_skills
                        st.rerun()
                    except Exception as e:
                        st.sidebar.error(f"Failed to save: {e}")
        with col2:
            if st.button("Dismiss", key="dismiss_skill_btn", type="secondary"):
                st.session_state.pending_skills.pop(0)
                st.rerun()

# Custom Title Header
st.markdown("""
<div style="text-align: center; padding: 32px 24px; margin-bottom: 32px; background: rgba(38, 32, 69, 0.8); border-radius: 16px; border: 1px solid rgba(255, 117, 151, 0.15); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
    <h1 style="color: #ffffff; font-family: 'Fredoka', sans-serif; font-weight: 700; margin: 0; font-size: 2.4rem; letter-spacing: -0.5px; text-transform: uppercase;">🍬 CANDY SYNC STUDIO 🍬</h1>
    <p style="color: #ffb7c5; margin: 8px 0 0 0; font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 0.8rem; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; background-color: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399;"></span>
        ENGINE STATUS: SWEET & ACTIVE  //  LOCAL RESUME & CONTENT ORCHESTRATOR
    </p>
</div>
""", unsafe_allow_html=True)

# Load static data in session state so edits aren't lost on rerun
if 'resume' not in st.session_state:
    st.session_state.resume = parse_resume_file()
if 'projects' not in st.session_state:
    st.session_state.projects = parse_projects_file()
if 'skills' not in st.session_state:
    st.session_state.skills = parse_skills_file()
if 'certificates' not in st.session_state:
    st.session_state.certificates = parse_certificates_file()
if 'pending_skills' not in st.session_state:
    st.session_state.pending_skills = []
if 'blog_draft_raw_notes' not in st.session_state:
    st.session_state.blog_draft_raw_notes = ""
if 'blog_draft_title' not in st.session_state:
    st.session_state.blog_draft_title = ""
if 'blog_draft_excerpt' not in st.session_state:
    st.session_state.blog_draft_excerpt = ""
if 'blog_draft_tags' not in st.session_state:
    st.session_state.blog_draft_tags = "Next.js, Python, AI"
if 'blog_draft_content' not in st.session_state:
    st.session_state.blog_draft_content = ""


# Set up tabs
tab_analytics, tab_edit, tab_project, tab_cert, tab_skills, tab_photos, tab_blog = st.tabs([
    "Analytics & Telemetry",
    "Edit Resume Manually", 
    "Sync Projects", 
    "Sync Certificates",
    "Manage Skills",
    "Update Photos",
    "Blog Editor"
])

# ──────────────────────────────────────────
# TAB: ANALYTICS & TELEMETRY
# ──────────────────────────────────────────
with tab_analytics:
    st.markdown('<div class="section-header">Live Telemetry & Analytics Dashboard</div>', unsafe_allow_html=True)
    st.write("Real-time telemetry aggregated directly from Supabase DB `page_visits` logs.")

    if not HAS_SYNC:
        st.warning("⚠️ Supabase sync configuration not found or database offline. Telemetry is unavailable.")
    else:
        # Timeframe selector
        timeframe_opts = {
            "Last 24 Hours": timedelta(days=1),
            "Last 7 Days": timedelta(days=7),
            "Last 30 Days": timedelta(days=30),
            "Last 90 Days": timedelta(days=90),
        }
        selected_timeframe = st.selectbox("Select Timeframe Filter:", list(timeframe_opts.keys()), index=1)
        
        # Calculate cutoff time in ISO format
        cutoff_dt = datetime.now() - timeframe_opts[selected_timeframe]
        cutoff_iso = cutoff_dt.isoformat() + "Z"
        
        # Fetch summary data via RPC
        with st.spinner("Fetching analytics summary..."):
            summary_res = call_rpc("get_analytics_summary", {"cutoff_time": cutoff_iso})
            
        if not summary_res:
            st.error("Could not load analytics summary. Please check database permissions or stored procedures.")
        else:
            # Structuring summary details
            total_views = summary_res.get("total_views", 0)
            total_bots = summary_res.get("total_bots", 0)
            unique_visitors = summary_res.get("unique_visitors", 0)
            desktop_count = summary_res.get("desktop_count", 0)
            mobile_count = summary_res.get("mobile_count", 0)
            tablet_count = summary_res.get("tablet_count", 0)
            
            # Key stats layout
            c1, c2, c3, c4 = st.columns(4)
            with c1:
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{total_views}</div>
                    <div class="telemetry-card-lbl">Page Views</div>
                </div>
                """, unsafe_allow_html=True)
            with c2:
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{unique_visitors}</div>
                    <div class="telemetry-card-lbl">Unique Visitors</div>
                </div>
                """, unsafe_allow_html=True)
            with c3:
                bot_percent = round((total_bots / (total_views + total_bots) * 100)) if (total_views + total_bots) > 0 else 0
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{total_bots} <span style="font-size: 1rem; color: #8A8A93;">({bot_percent}%)</span></div>
                    <div class="telemetry-card-lbl">Bot Blocks</div>
                </div>
                """, unsafe_allow_html=True)
            with c4:
                # Desktop/Mobile breakdown
                total_dev = desktop_count + mobile_count + tablet_count
                mob_percent = round((mobile_count / total_dev * 100)) if total_dev > 0 else 0
                st.markdown(f"""
                <div class="telemetry-card">
                    <div class="telemetry-card-val">{mob_percent}%</div>
                    <div class="telemetry-card-lbl">Mobile Visitors</div>
                </div>
                """, unsafe_allow_html=True)
                
            # Helper function to render visual progress bars with gradients
            def render_bar_chart(items, title, value_suffix="", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)"):
                st.markdown(f"#### {title}")
                if not items:
                    st.info("No records found in timeframe.")
                    return
                max_val = max([item.get("count", 1) for item in items])
                for item in items:
                    name = item.get("path") or item.get("name") or item.get("country") or item.get("region") or item.get("city") or "Unknown"
                    count = item.get("count", 0)
                    fill_percent = (count / max_val * 100) if max_val > 0 else 0
                    st.markdown(f"""
                    <div class="bar-container">
                        <div class="bar-label-row">
                            <span class="bar-label">{name}</span>
                            <span class="bar-count">{count}{value_suffix}</span>
                        </div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {fill_percent}%; background: {color_gradient} !important;"></div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

            st.markdown("---")
            
            # Split breakdowns in two columns
            col_left, col_right = st.columns(2)
            with col_left:
                popular_pages = summary_res.get("popular_pages", [])
                render_bar_chart(popular_pages, "Popular Paths / Routes", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)")
                
                st.markdown("<br>", unsafe_allow_html=True)
                top_referrers = summary_res.get("top_referrers", [])
                # Filter out empty referrers
                top_referrers = [r for r in top_referrers if r.get("name")]
                render_bar_chart(top_referrers[:6], "Top Referrers", color_gradient="linear-gradient(90deg, #e10098 0%, #2979ff 100%)")
                
            with col_right:
                top_countries = summary_res.get("countries", [])
                render_bar_chart(top_countries[:6], "Geographic - Countries", color_gradient="linear-gradient(90deg, #2979ff 0%, #00e676 100%)")
                
                st.markdown("<br>", unsafe_allow_html=True)
                top_cities = summary_res.get("cities", [])
                render_bar_chart(top_cities[:6], "Geographic - Cities", color_gradient="linear-gradient(90deg, #2979ff 0%, #00e676 100%)")
                
        # Recent logs section
        st.markdown("---")
        st.markdown("### Recent Page Visits (Last 50)")
        
        with st.spinner("Fetching latest visits..."):
            recent_visits = fetch_page_visits([('order', 'created_at.desc'), ('limit', '50')])
            
        if not recent_visits:
            st.info("No page visits found in log history.")
        else:
            # Let's render as a clean retro brutalist monospaced table or custom lines
            # Columns: Timestamp (IST), Path, Country, OS/Browser, Referrer, Bot?
            headers_col = st.columns([1.5, 2, 1.2, 1.5, 1.8, 1])
            with headers_col[0]: st.markdown("**Timestamp (IST)**")
            with headers_col[1]: st.markdown("**Route**")
            with headers_col[2]: st.markdown("**Location**")
            with headers_col[3]: st.markdown("**Platform**")
            with headers_col[4]: st.markdown("**Referrer**")
            with headers_col[5]: st.markdown("**Type**")
            
            st.markdown("<hr style='margin: 8px 0; border-color: #ffffff; border-width: 1.5px;'>", unsafe_allow_html=True)
            
            for visit in recent_visits:
                # Convert UTC timestamp to IST
                timestamp_str = visit.get("created_at", "")
                ist_str = "N/A"
                if timestamp_str:
                    try:
                        # Clean fractional seconds if any
                        clean_time_str = timestamp_str.split(".")[0].replace("Z", "")
                        if "+" in clean_time_str:
                            clean_time_str = clean_time_str.split("+")[0]
                        dt = datetime.strptime(clean_time_str, "%Y-%m-%dT%H:%M:%S")
                        ist_dt = dt + timedelta(hours=5, minutes=30)
                        ist_str = ist_dt.strftime("%b %d, %I:%M:%S %p")
                    except Exception as ex:
                        ist_str = timestamp_str[:19]
                        
                route = visit.get("path", "/")
                country = visit.get("country", "")
                city = visit.get("city", "")
                location = f"📍 {city}, {country}" if city and country else (country or "Unknown")
                
                browser = visit.get("browser", "")
                os_name = visit.get("os", "")
                platform = f"{browser} / {os_name}" if browser and os_name else (browser or os_name or "Unknown")
                
                ref = visit.get("referrer", "")
                ref_display = ref if ref else "-"
                
                is_bot = visit.get("is_bot", False)
                type_badge = '<span class="status-badge status-badge-bot">BOT</span>' if is_bot else '<span class="status-badge status-badge-user">USER</span>'
                
                row_col = st.columns([1.5, 2, 1.2, 1.5, 1.8, 1])
                with row_col[0]: st.code(ist_str)
                with row_col[1]: st.code(route)
                with row_col[2]: st.markdown(f"<span style='font-size:0.85rem;'>{location}</span>", unsafe_allow_html=True)
                with row_col[3]: st.markdown(f"<span style='font-size:0.85rem;'>{platform}</span>", unsafe_allow_html=True)
                with row_col[4]: st.markdown(f"<span style='font-size:0.85rem;'>{ref_display}</span>", unsafe_allow_html=True)
                with row_col[5]: st.markdown(type_badge, unsafe_allow_html=True)
                
                st.markdown("<hr style='margin: 4px 0; opacity: 0.15;'>", unsafe_allow_html=True)

# ──────────────────────────────────────────
# TAB 1: RESUME EDITOR
# ──────────────────────────────────────────
with tab_edit:
    if st.session_state.resume is None:
        st.error("Could not load resume.json. Please verify the file is present.")
    else:
        res = st.session_state.resume
        
        # 1. Profile section
        with st.container(border=True):
            st.markdown('<div class="section-header">Profile Details</div>', unsafe_allow_html=True)
            col1, col2 = st.columns(2)
            with col1:
                res['name'] = st.text_input("Name", res.get('name', ''))
                res['title'] = st.text_input("Title / Role", res.get('title', ''))
                res['email'] = st.text_input("Email Address", res.get('email', ''))
                res['phone'] = st.text_input("Phone Number", res.get('phone', ''))
            with col2:
                res['website'] = st.text_input("Website Link", res.get('website', ''))
                res['github'] = st.text_input("GitHub Profile", res.get('github', ''))
                res['linkedin'] = st.text_input("LinkedIn Profile", res.get('linkedin', ''))
                res['twitter'] = st.text_input("Twitter / X Profile", res.get('twitter', ''))
                res['instagram'] = st.text_input("Instagram Profile", res.get('instagram', ''))

        # 2. Summaries section
        with st.container(border=True):
            st.markdown('<div class="section-header">Persona Summaries</div>', unsafe_allow_html=True)
            st.info("Write a different bio description tailored for each engineering archetype.")
            summ = res.get('summary', {})
            res['summary']['general'] = st.text_area("General Summary", summ.get('general', ''), height=100)
            res['summary']['fullstack'] = st.text_area("Full-Stack Summary", summ.get('fullstack', ''), height=100)
            res['summary']['ai'] = st.text_area("AI Orchestration Summary", summ.get('ai', ''), height=100)
            res['summary']['creative'] = st.text_area("Creative Designer Summary", summ.get('creative', ''), height=100)

        # 2b. Biography Details (Origin Story / About Section)
        with st.container(border=True):
            st.markdown('<div class="section-header">Origin Story Biography & Facts</div>', unsafe_allow_html=True)
            about_data = res.get('about', {})
            
            # Sub-tabs for Developer and Business
            tab_about_dev, tab_about_biz = st.tabs(["Developer Mode Copy", "Business Mode Copy"])
            
            with tab_about_dev:
                dev_copy = about_data.get('developer', {})
                st.markdown("##### Biography Narrative")
                dev_light = st.text_area("Developer Bio (Light / Azure)", value=dev_copy.get('light', ''), height=80, key="about_dev_light")
                dev_noir = st.text_area("Developer Bio (Dark / Noir)", value=dev_copy.get('noir', ''), height=80, key="about_dev_noir")
                
                st.markdown("##### Fun Facts (One per line)")
                dev_facts_str = "\n".join(dev_copy.get('facts', []))
                dev_facts_edit = st.text_area("Developer Facts (Light / Azure)", value=dev_facts_str, height=80, key="about_dev_facts")
                dev_facts_list = [f.strip() for f in dev_facts_edit.split("\n") if f.strip()]
                
                dev_facts_noir_str = "\n".join(dev_copy.get('factsNoir', []))
                dev_facts_noir_edit = st.text_area("Developer Facts (Dark / Noir)", value=dev_facts_noir_str, height=80, key="about_dev_facts_noir")
                dev_facts_noir_list = [f.strip() for f in dev_facts_noir_edit.split("\n") if f.strip()]
                
                about_data['developer'] = {
                    "light": dev_light.strip(),
                    "noir": dev_noir.strip(),
                    "facts": dev_facts_list,
                    "factsNoir": dev_facts_noir_list
                }
                
            with tab_about_biz:
                biz_copy = about_data.get('business', {})
                st.markdown("##### Biography Narrative")
                biz_light = st.text_area("Business Bio (Light / Azure)", value=biz_copy.get('light', ''), height=80, key="about_biz_light")
                biz_noir = st.text_area("Business Bio (Dark / Noir)", value=biz_copy.get('noir', ''), height=80, key="about_biz_noir")
                
                st.markdown("##### Service Facts (One per line)")
                biz_facts_str = "\n".join(biz_copy.get('facts', []))
                biz_facts_edit = st.text_area("Business Facts (Light / Azure)", value=biz_facts_str, height=80, key="about_biz_facts")
                biz_facts_list = [f.strip() for f in biz_facts_edit.split("\n") if f.strip()]
                
                biz_facts_noir_str = "\n".join(biz_copy.get('factsNoir', []))
                biz_facts_noir_edit = st.text_area("Business Facts (Dark / Noir)", value=biz_facts_noir_str, height=80, key="about_biz_facts_noir")
                biz_facts_noir_list = [f.strip() for f in biz_facts_noir_edit.split("\n") if f.strip()]
                
                about_data['business'] = {
                    "light": biz_light.strip(),
                    "noir": biz_noir.strip(),
                    "facts": biz_facts_list,
                    "factsNoir": biz_facts_noir_list
                }
            
            res['about'] = about_data

        # 3. Work Experience section
        with st.container(border=True):
            st.markdown('<div class="section-header">Work Experience</div>', unsafe_allow_html=True)
            
            # Add new job experience button
            if st.button("Add Job Experience"):
                new_job = {
                    "id": f"new-job-{datetime.now().strftime('%M%S')}",
                    "company": "Company Name",
                    "role": "Software Engineer",
                    "period": "Start - End",
                    "location": "City, Country",
                    "bullets": [{"general": "Key achievement bullet point."}],
                    "tags": ["React"]
                }
                res['experience'].append(new_job)
                st.rerun()

            for exp_idx, exp in enumerate(res.get('experience', [])):
                with st.expander(f"{exp.get('company')} — {exp.get('role')} ({exp.get('period')})", expanded=False):
                    col_c1, col_c2 = st.columns(2)
                    with col_c1:
                        exp['company'] = st.text_input(f"Company Name", exp.get('company'), key=f"comp_{exp_idx}")
                        exp['role'] = st.text_input(f"Role Title", exp.get('role'), key=f"role_{exp_idx}")
                    with col_c2:
                        exp['period'] = st.text_input(f"Period (Dates)", exp.get('period'), key=f"per_{exp_idx}")
                        exp['location'] = st.text_input(f"Location", exp.get('location'), key=f"loc_{exp_idx}")
                    
                    # Tags comma-separated
                    tags_str = ", ".join(exp.get('tags', []))
                    edited_tags = st.text_input(f"Tags / Skills (comma-separated)", tags_str, key=f"tags_{exp_idx}")
                    exp['tags'] = [t.strip() for t in edited_tags.split(",") if t.strip()]
                    
                    # Bullets sub-section
                    st.write("**Bullet Points**")
                    
                    # Add bullet point
                    if st.button(f"Add Bullet Point", key=f"add_bullet_btn_{exp_idx}"):
                        exp['bullets'].append({
                            "general": "Accomplished [X], measured by [Y], by doing [Z].",
                            "fullstack": "",
                            "ai": "",
                            "creative": ""
                        })
                        st.rerun()
                    
                    bullets_to_remove = []
                    for b_idx, bullet in enumerate(exp.get('bullets', [])):
                        st.markdown(f"**Bullet #{b_idx + 1}**")
                        
                        # Archetype variant selection tabs
                        tab_g, tab_f, tab_a, tab_c = st.tabs([
                            "General / Core", 
                            "Full-Stack / Backend", 
                            "AI / Agents", 
                            "Creative / UI"
                        ])
                        
                        with tab_g:
                            bullet['general'] = st.text_area("General Description", bullet.get('general', ''), key=f"bul_g_{exp_idx}_{b_idx}", height=80)
                        with tab_f:
                            bullet['fullstack'] = st.text_area("Full-Stack Description", bullet.get('fullstack', ''), key=f"bul_f_{exp_idx}_{b_idx}", height=80)
                        with tab_a:
                            bullet['ai'] = st.text_area("AI/Agent Description", bullet.get('ai', ''), key=f"bul_a_{exp_idx}_{b_idx}", height=80)
                        with tab_c:
                            bullet['creative'] = st.text_area("Creative/Animation Description", bullet.get('creative', ''), key=f"bul_c_{exp_idx}_{b_idx}", height=80)
                        
                        if st.button(f"Remove Bullet #{b_idx+1}", key=f"rem_bul_{exp_idx}_{b_idx}"):
                            bullets_to_remove.append(b_idx)
                            
                    if bullets_to_remove:
                        for idx in sorted(bullets_to_remove, reverse=True):
                            exp['bullets'].pop(idx)
                        st.rerun()
                    
                    if st.button(f"Delete Job Experience Block", key=f"del_exp_{exp_idx}", type="secondary"):
                        res['experience'].pop(exp_idx)
                        st.rerun()

        # 4. Education section
        with st.container(border=True):
            st.markdown('<div class="section-header">Education</div>', unsafe_allow_html=True)
            if st.button("Add Education Block"):
                new_edu = {
                    "school": "University / School",
                    "degree": "Degree",
                    "period": "Start - End",
                    "location": "City, Country"
                }
                res['education'].append(new_edu)
                st.rerun()

            for edu_idx, edu in enumerate(res.get('education', [])):
                with st.expander(f"{edu.get('school')} — {edu.get('degree')}", expanded=False):
                    col_e1, col_e2 = st.columns(2)
                    with col_e1:
                        edu['school'] = st.text_input(f"University / School", edu.get('school'), key=f"school_{edu_idx}")
                        edu['degree'] = st.text_input(f"Degree / Program", edu.get('degree'), key=f"deg_{edu_idx}")
                    with col_e2:
                        edu['period'] = st.text_input(f"Period", edu.get('period'), key=f"edu_per_{edu_idx}")
                        edu['location'] = st.text_input(f"Location", edu.get('location'), key=f"edu_loc_{edu_idx}")
                    
                    if st.button(f"Delete Education Block", key=f"del_edu_{edu_idx}", type="secondary"):
                        res['education'].pop(edu_idx)
                        st.rerun()

        # 4b. Freelance Quotation Details
        with st.container(border=True):
            st.markdown('<div class="section-header">Freelance Quotation Rate Sheet</div>', unsafe_allow_html=True)
            quote_data = res.get('quotation', {})
            
            col_q1, col_q2 = st.columns(2)
            with col_q1:
                q_hourly = st.text_input("Estimated Hourly Rate", value=quote_data.get('hourlyRate', ''), placeholder="e.g. $50", key="quote_hourly")
                q_day = st.text_input("Standard Day Rate (8 hours)", value=quote_data.get('dayRate', ''), placeholder="e.g. $350", key="quote_day")
            with col_q2:
                q_terms = st.text_area("Standard Payment Terms", value=quote_data.get('paymentTerms', ''), key="quote_terms", height=70)
                
            q_deliv_str = "\n".join(quote_data.get('deliverables', []))
            q_deliv_edit = st.text_area("Service Deliverables Checklist (One per line)", value=q_deliv_str, height=100, key="quote_deliv")
            q_deliv_list = [d.strip() for d in q_deliv_edit.split("\n") if d.strip()]
            
            res['quotation'] = {
                "hourlyRate": q_hourly.strip(),
                "dayRate": q_day.strip(),
                "paymentTerms": q_terms.strip(),
                "deliverables": q_deliv_list
            }

        # 4c. Pricing Plans & Packages
        with st.container(border=True):
            st.markdown('<div class="section-header">Pricing Plans & Packages Grid</div>', unsafe_allow_html=True)
            pricing_data = res.get('pricing', {})
            
            tab_price_dev, tab_price_biz = st.tabs(["Developer (Mentorship/Audits) Tiers", "Business (Website/Support) Tiers"])
            
            with tab_price_dev:
                dev_tiers = pricing_data.get('developer', [])
                # Ensure we have exactly 3 tiers for layout consistency
                while len(dev_tiers) < 3:
                    dev_tiers.append({"title": "", "price": "", "description": "", "features": [], "cta": ""})
                
                updated_dev_tiers = []
                for t_idx in range(3):
                    tier = dev_tiers[t_idx]
                    st.markdown(f"**Tier #{t_idx + 1}**")
                    col_t1, col_t2 = st.columns(2)
                    with col_t1:
                        t_title = st.text_input("Tier Title", value=tier.get('title', ''), key=f"p_dev_title_{t_idx}")
                        t_price = st.text_input("Price / Rate Label", value=tier.get('price', ''), key=f"p_dev_price_{t_idx}")
                    with col_t2:
                        t_cta = st.text_input("CTA Code (pre-populates dropdown value)", value=tier.get('cta', ''), key=f"p_dev_cta_{t_idx}")
                        t_desc = st.text_input("Short Tier Description", value=tier.get('description', ''), key=f"p_dev_desc_{t_idx}")
                        
                    t_feat_str = "\n".join(tier.get('features', []))
                    t_feat_edit = st.text_area("Features (One per line)", value=t_feat_str, height=70, key=f"p_dev_feat_{t_idx}")
                    t_feat_list = [f.strip() for f in t_feat_edit.split("\n") if f.strip()]
                    
                    updated_dev_tiers.append({
                        "title": t_title.strip(),
                        "price": t_price.strip(),
                        "description": t_desc.strip(),
                        "features": t_feat_list,
                        "cta": t_cta.strip()
                    })
                pricing_data['developer'] = updated_dev_tiers
                
            with tab_price_biz:
                biz_tiers = pricing_data.get('business', [])
                while len(biz_tiers) < 3:
                    biz_tiers.append({"title": "", "price": "", "description": "", "features": [], "cta": ""})
                
                updated_biz_tiers = []
                for t_idx in range(3):
                    tier = biz_tiers[t_idx]
                    st.markdown(f"**Tier #{t_idx + 1}**")
                    col_tb1, col_tb2 = st.columns(2)
                    with col_tb1:
                        t_title = st.text_input("Tier Title", value=tier.get('title', ''), key=f"p_biz_title_{t_idx}")
                        t_price = st.text_input("Price Range / Rate Label", value=tier.get('price', ''), key=f"p_biz_price_{t_idx}")
                    with col_tb2:
                        t_cta = st.text_input("CTA Code (pre-populates dropdown value)", value=tier.get('cta', ''), key=f"p_biz_cta_{t_idx}")
                        t_desc = st.text_input("Short Tier Description", value=tier.get('description', ''), key=f"p_biz_desc_{t_idx}")
                        
                    t_feat_str = "\n".join(tier.get('features', []))
                    t_feat_edit = st.text_area("Features (One per line)", value=t_feat_str, height=70, key=f"p_biz_feat_{t_idx}")
                    t_feat_list = [f.strip() for f in t_feat_edit.split("\n") if f.strip()]
                    
                    updated_biz_tiers.append({
                        "title": t_title.strip(),
                        "price": t_price.strip(),
                        "description": t_desc.strip(),
                        "features": t_feat_list,
                        "cta": t_cta.strip()
                    })
                pricing_data['business'] = updated_biz_tiers
                
            res['pricing'] = pricing_data

        # Save Button & Live JSON View
        st.markdown("---")
        dry_run_resume = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_resume")
        if st.button("Save Resume Changes", type="primary", width="stretch"):
            try:
                write_resume_file(res)
                st.success("Resume updated and saved successfully directly in src/data/resume.json!")
                if not dry_run_resume:
                    st.info("🚀 Pushing changes to GitHub...")
                    git_ok, git_msg = git_commit_push_file("src/data/resume.json", "chore(resume): manual resume update")
                    if git_ok:
                        st.toast(f"📝 Resume saved and {git_msg}")
                    else:
                        st.error(f"❌ Git failed: {git_msg}")
            except Exception as e:
                st.error(f"Failed to write file: {e}")
                
        with st.expander("🔍 Live JSON Code View (Resume Object)", expanded=False):
            st.code(json.dumps(res, indent=2), language="json")

# ──────────────────────────────────────────
# TAB 2: SYNC PROJECTS
# ──────────────────────────────────────────
with tab_project:
    with st.container(border=True):
        st.markdown('<div class="section-header">Import & Sync Project Showcase</div>', unsafe_allow_html=True)
        st.write("Extract descriptions, tags, and custom resume bullet points from your repos using the Gemini API.")

        project_mode = st.radio("Choose Project Input Type:", ["Local Directory", "GitHub Repository"])

        proj_input = ""
        if project_mode == "Local Directory":
            proj_input = st.text_input("Absolute Local Folder Path:", placeholder="/Users/prateeksharma/Developer/my-app")
        else:
            proj_input = st.text_input("GitHub Repository URL / Slug:", placeholder="username/repo or just repo-name")

        dry_run_proj = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True)

        # Check task states
        proj_status = st.session_state.get("project_sync_task_status", "idle")
        
        if proj_status == "success":
            res = st.session_state.get("project_sync_task_result")
            if res:
                st.success("✅ Success! Gemini generated the entry structure and updated local files.")
                st.markdown("### AI-Generated Showcase Entry Preview")
                st.json(res["project_data"])
                if res.get("warnings"):
                    for warning in res["warnings"]:
                        st.warning(warning)
                if res["git_logs_output"]:
                    st.info(res["git_logs_output"])
            st.session_state.project_sync_task_status = "idle"
            
        elif proj_status == "error":
            err_msg = st.session_state.get("project_sync_task_error", "Unknown error")
            st.error(f"❌ Synchronization failed: {err_msg}")
            st.session_state.project_sync_task_status = "idle"
            
        if proj_status == "running":
            st.info("🔄 Syncing project showcase in the background...")
            st.markdown(
                '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
                '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
                '<span>Extracting repository info, generating tags, and updating showcase database with Gemini. You can switch tabs or edit other fields!</span>'
                '</div>'
                '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
                unsafe_allow_html=True
            )

        btn_disabled = (proj_status == "running")
        if st.button("Sync Project Now", type="primary", disabled=btn_disabled, key="btn_sync_project"):
            if not proj_input:
                st.error("Please provide a path or repository link.")
            else:
                def run_project_sync():
                    readme_content = ""
                    package_content = ""
                    git_logs = ""
                    
                    if project_mode == "Local Directory":
                        is_safe, project_path, err_msg = sanitize_local_path(proj_input)
                        if not is_safe:
                            raise ValueError(err_msg)
                        
                        readme_path = os.path.join(project_path, "README.md")
                        if os.path.exists(readme_path):
                            with open(readme_path, "r", encoding="utf-8") as f:
                                readme_content = f.read()[:6000]
                                
                        package_path = os.path.join(project_path, "package.json")
                        if os.path.exists(package_path):
                            with open(package_path, "r", encoding="utf-8") as f:
                                package_content = f.read()
                                
                        success, logs_or_err = run_safe_git_command(
                            ["git", "log", "-n", "5", "--oneline"],
                            cwd=project_path
                        )
                        if success:
                            git_logs = logs_or_err
                    else:
                        repo = proj_input.strip()
                        if "/" not in repo:
                            repo = f"prat3010/{repo}"
                        
                        def fetch_github(url_path, is_api=False):
                            url = f"https://api.github.com/repos/{repo}{url_path}" if is_api else f"https://raw.githubusercontent.com/{repo}/{url_path}"
                            headers = {"User-Agent": "Mozilla/5.0"}
                            req = urllib.request.Request(url, headers=headers)
                            try:
                                with urllib.request.urlopen(req) as res:
                                    return res.read().decode("utf-8")
                            except Exception as e:
                                if not is_api and "main" in url_path:
                                    fallback_path = url_path.replace("main/", "master/")
                                    return fetch_github(fallback_path, is_api=False)
                                return ""
                                
                        readme_content = fetch_github("main/README.md")
                        package_content = fetch_github("main/package.json")
                        
                        commits_json = fetch_github("/commits", is_api=True)
                        if commits_json:
                            try:
                                commits = json.loads(commits_json)
                                git_logs = "\n".join([f"{c['sha'][:7]} {c['commit']['message'].splitlines()[0]}" for c in commits[:5]])
                            except:
                                pass
                    
                    prompt = f"""
                    Analyze the following project code artifacts (README, package config, and git logs).
                    Use these details to formulate a showcase entry matching our Next.js Project schema.
                    
                    [README CONTENT]
                    {readme_content}
                    
                    [CONFIG CONTENT]
                    {package_content}
                    
                    [GIT COMMITS]
                    {git_logs}
                    
                    Generate and return strictly the following JSON structure:
                    {{
                      "title": "Catchy, polished title of the project",
                      "description": "Short, 1-sentence summary of what the project does",
                      "longDescription": "Detailed 3-4 sentence paragraph describing the architecture, core algorithms, libraries, databases used, and interesting implementation details. Highlight the technical engineering complexities.",
                      "tags": ["3 to 6 programming languages, database names, or key frameworks used (capitalize appropriately, e.g. React, Next.js, FastAPI, SQLite)"],
                      "color": "A neo-brutalist pop-art hex color (e.g. #FF9100, #00E676, #2979FF, #E040FB) that matches this project's visual branding",
                      "resumeBullet": {{
                        "general": "A concise, active resume bullet point (Accomplished [X], measured by [Y], by doing [Z]). Make it professional.",
                        "fullstack": "An alternative version of the bullet point focused strictly on APIs, databases, servers, and backend logic.",
                        "ai": "An alternative version of the bullet point focused strictly on prompts, LLMs, pipelines, RAG, and AI agents.",
                        "creative": "An alternative version of the bullet point focused strictly on UI responsiveness, animations, visual layouts, and styling."
                      }}
                    }}
                    Do not return any conversational text, markdown formatting, or backticks. Return only the raw JSON.
                    """
                    
                    project_data = call_gemini(prompt)
                    if not project_data:
                        raise ValueError("Gemini failed to generate project data. Verify API key, logs, or format.")
                    project_data = validate_project_response(project_data)
                    
                    project_id = re.sub(r'[^a-zA-Z0-9]', '-', project_data['title'].lower())
                    current_projects = parse_projects_file()
                    current_projects = [p for p in current_projects if p['id'] != project_id]
                    
                    new_project = {
                        "id": project_id,
                        "title": project_data["title"],
                        "description": project_data["description"],
                        "longDescription": project_data["longDescription"],
                        "image": f"/images/project-{project_id}.webp", 
                        "tags": project_data["tags"],
                        "liveUrl": "",
                        "githubUrl": f"https://github.com/{repo}" if project_mode != "Local Directory" else "",
                        "color": project_data["color"],
                        "isLive": False,
                        "status": "soon"
                    }
                    
                    current_projects.append(new_project)
                    write_projects_file(current_projects)
                    st.session_state.projects = current_projects
                    check_and_add_pending_skills(project_data["tags"])
                    
                    resume = parse_resume_file()
                    warnings = []
                    if resume:
                        found_experience = False
                        for exp in resume.get('experience', []):
                            if exp['id'] == 'freelance-developer':
                                found_experience = True
                                exp['bullets'].append({
                                    "general": project_data['resumeBullet']['general'],
                                    "fullstack": project_data['resumeBullet'].get('fullstack', ''),
                                    "ai": project_data['resumeBullet'].get('ai', ''),
                                    "creative": project_data['resumeBullet'].get('creative', '')
                                })
                                for tag in project_data['tags']:
                                    if tag not in exp['tags']:
                                        exp['tags'].append(tag)
                        
                        if not found_experience:
                            warnings.append("⚠️ Resume experience entry with ID 'freelance-developer' was not found. Bullet points and tags were not added to the resume.")
                        
                        resume['lastSynced'] = {
                            "timestamp": datetime.now().isoformat(),
                            "status": "success",
                            "summary": f"Synchronized new project: {new_project['title']}."
                        }
                        write_resume_file(resume)
                        st.session_state.resume = resume
                    
                    git_logs_output = ""
                    if not dry_run_proj:
                        commit_msg = f"chore(sync): publish project sync - {new_project['title']}"
                        success, git_msg = commit_and_push_paths(
                            run_safe_git_command,
                            ["src/data/projects.json", "src/data/resume.json", "src/data/skills.json"],
                            commit_msg,
                            cwd=os.getcwd(),
                        )
                        if not success:
                            raise ValueError(git_msg)
                        git_logs_output = git_msg
                            
                    return {
                        "project_data": project_data,
                        "new_project": new_project,
                        "git_logs_output": git_logs_output,
                        "warnings": warnings
                    }
                
                run_async_task(run_project_sync, "project_sync_task")
                st.rerun()

    # 2. Manage & Edit Active Projects Section
    st.markdown('<div class="section-header" style="margin-top: 2rem;">Manage & Edit Active Projects</div>', unsafe_allow_html=True)
    
    current_projects = st.session_state.projects or []
    if not current_projects:
        st.info("No active projects found in projects.json.")
    else:
        st.write(f"Currently showing **{len(current_projects)}** project(s):")
        
        for idx, project in enumerate(current_projects):
            p_id = project.get("id")
            p_title = project.get("title", "Untitled Project")
            
            with st.expander(f"📁 {p_title} (ID: {p_id})"):
                # Visual project card preview
                tags_html = " ".join([f'<span class="skill-capsule-preview" style="box-shadow: 0 4px 10px rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.08); padding: 2px 10px; font-size: 0.7rem; margin-right: 4px; margin-bottom: 4px;"><span class="skill-capsule-dot" style="background-color: {project.get("color", "#00E676")};"></span>{t}</span>' for t in project.get("tags", [])])
                status_style = {
                    "live": "background-color: rgba(16, 185, 129, 0.15) !important; color: #34d399 !important; border-color: rgba(16, 185, 129, 0.3) !important;",
                    "soon": "background-color: rgba(245, 158, 11, 0.15) !important; color: #fbbf24 !important; border-color: rgba(245, 158, 11, 0.3) !important;",
                    "personal": "background-color: rgba(59, 130, 246, 0.15) !important; color: #60a5fa !important; border-color: rgba(59, 130, 246, 0.3) !important;"
                }
                curr_status = project.get("status", "live" if project.get("isLive") else "soon")
                status_badge_html = f'<span class="status-badge" style="{status_style.get(curr_status, "")}">{curr_status.upper()}</span>'
                st.markdown(f"""
                <div style="border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid {project.get("color", "#00E676")}; border-radius: 12px; padding: 20px; background: rgba(20, 20, 20, 0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); margin-bottom: 25px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.75rem; color: #a1a1aa; font-weight: 700; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif;">Card Preview</span>
                        {status_badge_html}
                    </div>
                    <h3 style="margin: 0 0 8px 0; color: #ffffff; font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 1.45rem; letter-spacing: 0.2px;">{p_title}</h3>
                    <p style="font-size: 0.85rem; color: #D1D1D6; margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; line-height: 1.4;">{project.get("description", "")}</p>
                    <div style="display: flex; flex-wrap: wrap;">{tags_html}</div>
                </div>
                """, unsafe_allow_html=True)
                
                col_p1, col_p2 = st.columns([1, 2])
                
                with col_p1:
                    # 1. Azure Mode (Comic/Light) Image
                    st.markdown("### Azure Mode (Comic)")
                    img_path = project.get("image", "")
                    local_img_path = os.path.join("public", img_path.lstrip("/")) if img_path else ""
                    if local_img_path and os.path.exists(local_img_path):
                        st_image_safe(local_img_path, caption="Current Azure Image", width="stretch")
                    else:
                        st.warning("No Azure image currently found at: " + (img_path or "N/A"))
                        
                    up_img = st.file_uploader(f"Upload Azure image for {p_title}", type=["png", "jpg", "jpeg", "webp"], key=f"up_img_{p_id}")
                    if up_img is not None:
                        if st.button(f"Save Azure Photo", key=f"btn_save_img_{p_id}", type="primary"):
                            target_img_filename = f"project-{p_id}.webp"
                            target_img_path = os.path.join("public", "images", target_img_filename)
                            success, msg = save_uploaded_image(up_img, target_img_path, "WEBP")
                            if success:
                                project['image'] = f"/images/{target_img_filename}"
                                write_projects_file(current_projects)
                                st.session_state.projects = current_projects
                                st.success("Updated Azure project image successfully!")
                                
                                if not dry_run_proj:
                                    st.info("🚀 Pushing image and data to GitHub...")
                                    git_ok, git_msg = commit_and_push_paths(
                                        run_safe_git_command,
                                        ["src/data/projects.json", target_img_path],
                                        f"chore(sync): update project photo - {p_title}",
                                        cwd=os.getcwd(),
                                    )
                                    if git_ok:
                                        st.success(git_msg)
                                    else:
                                        st.error(f"Git failed: {git_msg}")
                                st.rerun()
                            else:
                                st.error(msg)
                                
                    st.markdown("---")
                    
                    # 2. Noir Mode (Dark) Image
                    st.markdown("### Noir Mode (Dark)")
                    if img_path:
                        noir_img_path = img_path.replace(".webp", "-noir.webp")
                        local_noir_img_path = os.path.join("public", noir_img_path.lstrip("/"))
                    else:
                        noir_img_path = ""
                        local_noir_img_path = ""
                        
                    if local_noir_img_path and os.path.exists(local_noir_img_path):
                        st_image_safe(local_noir_img_path, caption="Current Noir Image", width="stretch")
                    else:
                        st.warning("No Noir image currently found at: " + (noir_img_path or "N/A"))
                        
                    up_img_noir = st.file_uploader(f"Upload Noir image for {p_title}", type=["png", "jpg", "jpeg", "webp"], key=f"up_img_noir_{p_id}")
                    if up_img_noir is not None:
                        if st.button(f"Save Noir Photo", key=f"btn_save_img_noir_{p_id}", type="primary"):
                            target_noir_filename = f"project-{p_id}-noir.webp"
                            target_noir_path = os.path.join("public", "images", target_noir_filename)
                            success, msg = save_uploaded_image(up_img_noir, target_noir_path, "WEBP")
                            if success:
                                if not project.get('image'):
                                    project['image'] = f"/images/project-{p_id}.webp"
                                    write_projects_file(current_projects)
                                    st.session_state.projects = current_projects
                                st.success("Updated Noir project image successfully!")
                                
                                if not dry_run_proj:
                                    st.info("🚀 Pushing image to GitHub...")
                                    git_ok, git_msg = commit_and_push_paths(
                                        run_safe_git_command,
                                        ["src/data/projects.json", target_noir_path],
                                        f"chore(sync): update project noir photo - {p_title}",
                                        cwd=os.getcwd(),
                                    )
                                    if git_ok:
                                        st.success(git_msg)
                                    else:
                                        st.error(f"Git failed: {git_msg}")
                                st.rerun()
                            else:
                                st.error(msg)
                                
                with col_p2:
                    edit_title = st.text_input("Project Title", value=project.get("title", ""), key=f"edit_title_{p_id}")
                    
                    st.markdown("#### Developer Mode Copy")
                    edit_desc = st.text_input("Short Description (Dev)", value=project.get("description", ""), key=f"edit_desc_{p_id}")
                    edit_long_desc = st.text_area("Detailed Description (Dev) (Markdown-supported)", value=project.get("longDescription", ""), height=100, key=f"edit_long_desc_{p_id}")
                    
                    st.markdown("#### Business Mode Copy")
                    edit_desc_biz = st.text_input("Short Description (Biz)", value=project.get("description_business", ""), key=f"edit_desc_biz_{p_id}")
                    edit_long_desc_biz = st.text_area("Detailed Description (Biz) (Markdown-supported)", value=project.get("longDescription_business", ""), height=100, key=f"edit_long_desc_biz_{p_id}")
                    
                    col_p2_1, col_p2_2 = st.columns(2)
                    with col_p2_1:
                        edit_color = st.text_input("Hex Color Code", value=project.get("color", "#00E676"), key=f"edit_color_{p_id}")
                        edit_live_url = st.text_input("Live URL Link", value=project.get("liveUrl", ""), key=f"edit_live_url_{p_id}")
                    with col_p2_2:
                        edit_github_url = st.text_input("GitHub Repo Link", value=project.get("githubUrl", ""), key=f"edit_github_url_{p_id}")
                        # Determine current index for selectbox
                        status_opts = ["COMING SOON", "LIVE NOW", "PERSONAL"]
                        curr_status = project.get("status", "live" if project.get("isLive") else "soon")
                        if curr_status == 'live':
                            status_idx = 1
                        elif curr_status == 'personal':
                            status_idx = 2
                        else:
                            status_idx = 0
                        edit_status = st.selectbox("Project Status", options=status_opts, index=status_idx, key=f"edit_status_{p_id}")
                    
                    curr_tags = ", ".join(project.get("tags", []))
                    edit_tags_str = st.text_input("Tags / Technologies (comma separated)", value=curr_tags, key=f"edit_tags_{p_id}")
                    edit_tags = [t.strip() for t in edit_tags_str.split(",") if t.strip()]
                    
                    col_pb1, col_pb2 = st.columns(2)
                    
                    with col_pb1:
                        if st.button("Save Project Changes", key=f"btn_save_proj_{p_id}", type="primary", width="stretch"):
                            if not edit_title.strip():
                                st.error("Project Title is required!")
                            else:
                                project["title"] = edit_title.strip()
                                project["description"] = edit_desc.strip()
                                project["longDescription"] = edit_long_desc.strip()
                                project["description_business"] = edit_desc_biz.strip()
                                project["longDescription_business"] = edit_long_desc_biz.strip()
                                project["color"] = edit_color.strip()
                                project["liveUrl"] = edit_live_url.strip()
                                project["githubUrl"] = edit_github_url.strip()
                                project["isLive"] = edit_status == "LIVE NOW"
                                if edit_status == "LIVE NOW":
                                    project["status"] = "live"
                                elif edit_status == "PERSONAL":
                                    project["status"] = "personal"
                                else:
                                    project["status"] = "soon"
                                project["tags"] = edit_tags
                                
                                try:
                                    write_projects_file(current_projects)
                                    st.session_state.projects = current_projects
                                    st.success(f"Successfully saved project changes locally!")
                                    
                                    if not dry_run_proj:
                                        st.info("🚀 Pushing changes to GitHub...")
                                        git_ok, git_msg = commit_and_push_paths(
                                            run_safe_git_command,
                                            ["src/data/projects.json"],
                                            f"chore(sync): update project - {project['title']}",
                                            cwd=os.getcwd(),
                                        )
                                        if git_ok:
                                            st.success(git_msg)
                                        else:
                                            st.error(f"Git failed: {git_msg}")
                                            
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Failed to write file: {e}")
                                    
                    with col_pb2:
                        if st.button("Delete Project", key=f"btn_del_proj_{p_id}", type="secondary", width="stretch"):
                            updated_projects = [p for p in current_projects if p.get("id") != p_id]
                            
                            try:
                                is_offline = st.session_state.get("offline_mode", False)
                                if HAS_SYNC and not is_offline and not delete_project(p_id):
                                    raise Exception("Database delete failed. Local files were not changed.")
                                write_projects_file(updated_projects)
                                deleted_assets = []
                                if img_path and "project-" in img_path:
                                    target_img = os.path.join("public", img_path.lstrip("/"))
                                    target_img_noir = target_img.replace(".webp", "-noir.webp")
                                    deleted_assets = delete_existing_files([target_img, target_img_noir])
                                    for deleted_asset in deleted_assets:
                                        st.toast(f"Deleted image file: `{deleted_asset}`")
                                st.session_state.projects = updated_projects
                                st.success(f"Successfully deleted project: **{p_title}**!")
                                
                                if not dry_run_proj:
                                    st.info("🚀 Pushing deletion to GitHub...")
                                    git_ok, git_msg = commit_and_push_paths(
                                        run_safe_git_command,
                                        ["src/data/projects.json", *deleted_assets],
                                        f"chore(sync): delete project - {p_title}",
                                        cwd=os.getcwd(),
                                    )
                                    if git_ok:
                                        st.success(git_msg)
                                    else:
                                        st.error(f"Git failed: {git_msg}")
                                        
                                st.rerun()
                            except Exception as e:
                                st.error(f"Failed to delete project: {e}")

# ──────────────────────────────────────────
# TAB 3: SYNC CERTIFICATES
# ──────────────────────────────────────────
with tab_cert:
    with st.container(border=True):
        st.markdown('<div class="section-header">Scan & Sync Certificates</div>', unsafe_allow_html=True)
        st.write("Analyze raw credentials using Gemini Multimodal OCR and add them directly to your verified badges.")

        raw_cert_dir = "src/data/certificates/raw"
        public_cert_dir = "public/certificates"
        os.makedirs(raw_cert_dir, exist_ok=True)
        os.makedirs(public_cert_dir, exist_ok=True)

        raw_certs = [f for f in os.listdir(raw_cert_dir) if get_mime_type(f) is not None]

        st.markdown(f"**Raw folder location:** `src/data/certificates/raw/`")
        st.markdown(f"📁 Currently **{len(raw_certs)}** raw certificate file(s) waiting in folder.")

        if raw_certs:
            for c in raw_certs:
                st.code(f"• {c}", language="text")

            dry_run_cert = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_cert")

            # Check task states
            cert_status = st.session_state.get("cert_sync_task_status", "idle")
            
            if cert_status == "success":
                res = st.session_state.get("cert_sync_task_result")
                if res:
                    st.success("✅ Success! Processed and synced certificates successfully.")
                    if res["sync_logs"]:
                        for log in res["sync_logs"]:
                            st.info(f"• {log}")
                    if res["git_logs_output"]:
                        st.info(res["git_logs_output"])
                st.session_state.cert_sync_task_status = "idle"
                st.rerun()
                
            elif cert_status == "error":
                err_msg = st.session_state.get("cert_sync_task_error", "Unknown error")
                st.error(f"❌ Certificate Sync failed: {err_msg}")
                st.session_state.cert_sync_task_status = "idle"
                
            if cert_status == "running":
                st.info("🔄 Processing certificate uploads in the background...")
                st.markdown(
                    '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
                    '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
                    '<span>Performing Gemini OCR on raw certificates, moving files to public assets, and updating databases. You can switch tabs or edit other fields!</span>'
                    '</div>'
                    '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
                    unsafe_allow_html=True
                )

            btn_disabled = (cert_status == "running")
            if st.button("Sync Certificates Now", type="primary", disabled=btn_disabled, key="btn_sync_certs"):
                def run_cert_sync():
                    current_certs = parse_certificates_file()
                    updated = False
                    sync_logs = []
                    staged_uploads = []
                    
                    certs_to_process = list(raw_certs)
                    
                    for cert_file in certs_to_process:
                        filepath = os.path.join(raw_cert_dir, cert_file)
                        if not os.path.exists(filepath):
                            continue
                        mime = get_mime_type(cert_file)
                        
                        with open(filepath, "rb") as f:
                            b64_data = base64.b64encode(f.read()).decode("utf-8")
                            
                        prompt = """
                        Analyze this certification document. Extract the following information and output it strictly in the following JSON format:
                        {
                          "title": "Full name of the certificate/course",
                          "issuer": "Issuing organization or institution",
                          "date": "Date of issue in YYYY-MM-DD format (estimate year/month if exact day isn't present, e.g. 2026-06-01)",
                          "credentialId": "Credential verification ID if present, otherwise empty string",
                          "verifyUrl": "Verification link/URL if present, otherwise empty string",
                          "tags": ["3 to 5 lowercase programming languages, tools or framework tags related to this certificate"]
                        }
                        Do not return any conversational text, markdown packaging, or backticks. Only return the raw JSON object.
                        """
                        
                        cert_data = call_gemini(prompt, file_data=b64_data, file_mime=mime)
                        if not cert_data:
                            raise ValueError(f"Failed to parse certificate '{cert_file}' via Gemini OCR.")
                        cert_data = validate_certificate_response(cert_data)
                        
                        cert_id = slugify(cert_data["title"])
                        file_ext = os.path.splitext(cert_file)[1].lower()
                        dest_filename = f"{cert_id}{file_ext}"
                        dest_filepath = os.path.join(public_cert_dir, dest_filename)
                        staged_filepath = copy_to_staged_file(filepath, dest_filepath)
                        staged_uploads.append(staged_filepath)
                        
                        verify_url = cert_data.get("verifyUrl", "").strip()
                        if verify_url:
                            if not verify_url.startswith(("http://", "https://")):
                                verify_url = "https://" + verify_url
                            
                            # Convert Udemy short link to direct verification URL to avoid redirect 404s
                            if "ude.my/" in verify_url:
                                uc_match = re.search(r'(UC-[a-zA-Z0-9-]+)', verify_url)
                                if uc_match:
                                    verify_url = f"https://www.udemy.com/certificate/{uc_match.group(1)}/"

                        new_cert = {
                            "id": cert_id,
                            "title": cert_data["title"],
                            "issuer": cert_data["issuer"],
                            "date": cert_data["date"],
                            "credentialId": cert_data.get("credentialId"),
                            "verifyUrl": verify_url,
                            "image": f"/certificates/{dest_filename}",
                            "tags": cert_data.get("tags", [])
                        }
                        
                        current_certs = [c for c in current_certs if c.get("id") != cert_id]
                        current_certs.append(new_cert)
                        updated = True
                        new_cert["_staged_path"] = staged_filepath
                        new_cert["_raw_path"] = filepath
                        check_and_add_pending_skills(cert_data.get("tags", []))
                        sync_logs.append(f"Parsed certificate: {cert_data['title']}")
                    
                    git_logs_output = ""
                    if updated:
                        staged_pairs = []
                        raw_paths = []
                        public_certs = []
                        try:
                            for cert in current_certs:
                                cert_copy = dict(cert)
                                staged_path = cert_copy.pop("_staged_path", None)
                                raw_path = cert_copy.pop("_raw_path", None)
                                if staged_path:
                                    staged_pairs.append((staged_path, os.path.join("public", cert_copy["image"].lstrip("/"))))
                                if raw_path:
                                    raw_paths.append(raw_path)
                                public_certs.append(cert_copy)

                            write_certificates_file(public_certs)
                            for staged_path, final_path in staged_pairs:
                                finalize_staged_file(staged_path, final_path)
                                if staged_path in staged_uploads:
                                    staged_uploads.remove(staged_path)
                            for raw_path in raw_paths:
                                if os.path.exists(raw_path):
                                    os.remove(raw_path)
                        except Exception:
                            for staged_path, _ in staged_pairs:
                                cleanup_staged_file(staged_path)
                            raise

                        current_certs = public_certs
                        st.session_state.certificates = current_certs
                        
                        # Update resume log
                        resume = parse_resume_file()
                        if resume and sync_logs:
                            resume['lastSynced'] = {
                                "timestamp": datetime.now().isoformat(),
                                "status": "success",
                                "summary": " & ".join(sync_logs)
                            }
                            write_resume_file(resume)
                            st.session_state.resume = resume
                            
                        if not dry_run_cert:
                            success, git_msg = commit_and_push_paths(
                                run_safe_git_command,
                                ["src/data/certificates.json", "src/data/resume.json", "src/data/skills.json", "public/certificates/"],
                                "chore(sync): publish certificates sync",
                                cwd=os.getcwd(),
                            )
                            if not success:
                                raise ValueError(git_msg)
                            git_logs_output = git_msg

                    for staged_path in staged_uploads:
                        cleanup_staged_file(staged_path)
                                
                    return {
                        "sync_logs": sync_logs,
                        "git_logs_output": git_logs_output
                    }
                
                run_async_task(run_cert_sync, "cert_sync_task")
                st.rerun()
        else:
            st.info("No raw certificate files found. Drop PDFs or image files into `src/data/certificates/raw/` to parse them.")

    # Manage Active Certificates Section
    st.markdown('<div class="section-header" style="margin-top: 2rem;">Manage Active Certificates</div>', unsafe_allow_html=True)
    
    current_certs = st.session_state.certificates
    if not current_certs:
        st.info("No active certificates found in certificates.json.")
    else:
        st.write(f"Currently showing **{len(current_certs)}** active certificate(s):")
        for idx, cert in enumerate(current_certs):
            cert_id = cert.get("id", f"cert_{idx}")
            with st.container(border=True):
                col1, col2 = st.columns([1, 4])
                with col1:
                    img_path = cert.get("image", "")
                    local_img_path = os.path.join("public", img_path.lstrip("/")) if img_path else ""
                    if local_img_path and os.path.exists(local_img_path):
                        st_image_safe(local_img_path, width="stretch")
                    else:
                        st.markdown("*No Image*")
                with col2:
                    st.markdown(f"### {cert.get('title', 'Untitled Certificate')}")
                    st.markdown(f"**Issuer:** {cert.get('issuer', 'Unknown')} | **Date:** {cert.get('date', 'N/A')}")
                    if cert.get("credentialId"):
                        st.markdown(f"**Credential ID:** `{cert.get('credentialId')}`")
                    if cert.get("verifyUrl"):
                        st.markdown(f"[Verify Link]({cert.get('verifyUrl')})")
                    
                    # Tags list
                    tags = cert.get("tags", [])
                    if tags:
                        tags_html = " ".join([f'<span class="skill-capsule-preview" style="box-shadow: 0 4px 10px rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.08); padding: 2px 10px; font-size: 0.7rem; margin-right: 4px; margin-bottom: 4px;"><span class="skill-capsule-dot" style="background-color: #2979ff;"></span>{t}</span>' for t in tags])
                        st.markdown(f'<div style="display: flex; flex-wrap: wrap; margin-bottom: 12px;">{tags_html}</div>', unsafe_allow_html=True)
                        
                    # Remove button
                    if st.button(f"Remove Certificate", key=f"del_cert_{cert_id}", type="secondary"):
                        updated_certs = [c for c in current_certs if c.get("id") != cert_id]
                        
                        try:
                            is_offline = st.session_state.get("offline_mode", False)
                            if HAS_SYNC and not is_offline and not delete_certificate(cert_id):
                                raise Exception("Database delete failed. Local files were not changed.")
                            write_certificates_file(updated_certs)
                            deleted_assets = []
                            if img_path:
                                target_img = os.path.join("public", img_path.lstrip("/"))
                                deleted_assets = delete_existing_files([target_img])
                                for deleted_asset in deleted_assets:
                                    st.toast(f"Deleted image file: `{deleted_asset}`")
                            st.session_state.certificates = updated_certs
                            
                            # 4. Update resume log
                            resume = parse_resume_file()
                            if resume:
                                resume['lastSynced'] = {
                                    "timestamp": datetime.now().isoformat(),
                                    "status": "success",
                                    "summary": f"Removed certificate: {cert.get('title')}"
                                }
                                write_resume_file(resume)
                                st.session_state.resume = resume
                                
                            st.success(f"Successfully removed certificate: **{cert.get('title')}**")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Failed to delete certificate: {e}")

# ──────────────────────────────────────────
# TAB 4: MANAGE SKILLS
# ──────────────────────────────────────────
with tab_skills:
    st.markdown('<div class="section-header">Manage Skills & Project Mapping</div>', unsafe_allow_html=True)
    st.write("Create, modify, delete, and link skills directly. Changes will update `src/data/skills.json` immediately.")
    dry_run_skills = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_skills")

    # 1. Create New Skill Section
    with st.container(border=True):
        st.markdown('<h3 style="margin-top:0;">Create New Skill</h3>', unsafe_allow_html=True)
        
        col_n1, col_n2 = st.columns(2)
        with col_n1:
            new_name = st.text_input("Skill Name", placeholder="e.g. Docker, Kubernetes, WebGPU", key="new_skill_name")
            new_name_biz = st.text_input("Skill Name (Business Mode)", placeholder="e.g. Containerized Deployments, Accelerated Graphics", key="new_skill_name_biz")
            new_icon = st.text_input("Lucide Icon Name", value="sparkles", key="new_skill_icon")
            
            # Category selectbox
            categories_opts = ['orchestration', 'logic', 'product', 'dynamic']
            categories_labels = {
                'orchestration': 'AI Orchestration (orchestration)',
                'logic': 'Systems & Logic (logic)',
                'product': 'Product & UX (product)',
                'dynamic': 'Dynamic Command (dynamic)'
            }
            new_cat = st.selectbox("Category", options=categories_opts, format_func=lambda x: categories_labels[x], key="new_skill_cat")
            
        with col_n2:
            new_color = st.text_input("Hex Color Code", value="#00E676", key="new_skill_color")
            new_level = st.text_input("Skill Level (Optional)", placeholder="e.g. Level Max, Active Quest", key="new_skill_level")
            
            # Prerequisite from existing skills
            existing_skill_names = [s.get('name') for s in st.session_state.skills if s.get('name')]
            new_prereq = st.selectbox("Prerequisite (Optional)", options=[None] + existing_skill_names, index=0, key="new_skill_prereq")
            
        new_status = st.selectbox("Status (Optional)", options=[None, 'legendary', 'mastered', 'quest'], index=0, key="new_skill_status")
        new_desc = st.text_area("Description / Summary (Dev Mode)", placeholder="Short 1-sentence description.", key="new_skill_desc")
        new_desc_biz = st.text_area("Description / Summary (Biz Mode)", placeholder="Outcome value proposition for clients.", key="new_skill_desc_biz")
        
        # Link to existing projects
        project_list = st.session_state.projects or []
        project_options = {p.get('id'): p.get('title') for p in project_list if p.get('id')}
        project_ids = list(project_options.keys())
        
        selected_projects = st.multiselect(
            "Link to Projects (Optional)", 
            options=project_ids, 
            format_func=lambda x: project_options[x],
            key="new_skill_projects"
        )
        
        if st.button("Create Skill", type="primary", width="stretch"):
            if not new_name.strip():
                st.error("Skill Name is required!")
            elif any(s.get("name", "").lower() == new_name.strip().lower() for s in st.session_state.skills):
                st.error(f"Skill '{new_name}' already exists!")
            else:
                # Construct new skill object
                ns = {
                    "name": new_name.strip(),
                    "name_business": new_name_biz.strip() or new_name.strip(),
                    "icon": new_icon.strip() or "sparkles",
                    "description": new_desc.strip(),
                    "description_business": new_desc_biz.strip(),
                    "category": new_cat,
                    "color": new_color.strip() or "#00E676"
                }
                if new_level.strip():
                    ns["level"] = new_level.strip()
                if new_prereq:
                    ns["prereq"] = new_prereq
                if new_status:
                    ns["status"] = new_status
                if selected_projects:
                    ns["projects"] = [{"title": project_options[pid], "id": pid} for pid in selected_projects]
                
                updated_skills = st.session_state.skills + [ns]
                try:
                    write_skills_file(updated_skills)
                    st.session_state.skills = updated_skills
                    st.success(f"Successfully created skill: **{new_name.strip()}**!")
                    if not dry_run_skills:
                        st.info("🚀 Pushing changes to GitHub...")
                        git_ok, git_msg = git_commit_push_file("src/data/skills.json", f"chore(skills): create skill - {new_name.strip()}")
                        if git_ok:
                            st.toast(f"💡 Skill created and {git_msg}")
                        else:
                            st.error(f"❌ Git failed: {git_msg}")
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to save skills: {e}")

    # 2. Manage & Link Existing Skills Section
    st.markdown('<div class="section-header" style="margin-top: 2rem;">Manage & Link Existing Skills</div>', unsafe_allow_html=True)
    
    if not st.session_state.skills:
        st.info("No skills found in skills.json.")
    else:
        category_groups = {
            'orchestration': [],
            'logic': [],
            'product': [],
            'dynamic': []
        }
        for s in st.session_state.skills:
            cat = s.get('category', 'dynamic')
            if cat not in category_groups:
                cat = 'dynamic'
            category_groups[cat].append(s)
            
        category_display_names = {
            'orchestration': 'AI Orchestration (orchestration)',
            'logic': 'Systems & Logic (logic)',
            'product': 'Product & UX (product)',
            'dynamic': 'Dynamic Command (dynamic)'
        }
        
        for cat_key in ['orchestration', 'logic', 'product', 'dynamic']:
            group_skills = category_groups[cat_key]
            if not group_skills:
                continue
                
            st.markdown(f"### {category_display_names[cat_key].split(' (')[0]}")
            
            # Display skills in a 2-column grid
            cols = st.columns(2)
            for s_idx, skill in enumerate(group_skills):
                col_i = cols[s_idx % 2]
                s_name = skill.get('name', 'Unnamed Skill')
                s_id = slugify(s_name)
                key_prefix = f"edit_skill_{s_id}"
                
                # Retrieve parameters for the tag capsule preview
                s_color = skill.get('color', '#00E676')
                s_icon = skill.get('icon', 'sparkles')
                s_level = skill.get('level', '')
                s_status = skill.get('status', '')
                
                # Label for preview badge
                badge_label = s_name
                if s_level:
                    badge_label += f" ({s_level})"
                if s_status:
                    badge_label += f" [{s_status.upper()}]"
                    
                with col_i:
                    expander_label = f"🔧 {s_name}"
                    with st.expander(expander_label):
                        # Visual capsule preview
                        st.markdown(f"""
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 0.75rem; color: #8A8A93; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px;">Live Preview:</span>
                            <div class="skill-capsule-preview" style="box-shadow: 0 4px 10px rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.08);">
                                <span class="skill-capsule-dot" style="background-color: {s_color};"></span>
                                <span style="font-family: 'Space Grotesk', sans-serif; font-size: 0.75rem;">{badge_label}</span>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        edit_name = st.text_input("Skill Name", value=s_name, key=f"{key_prefix}_name")
                        edit_name_biz = st.text_input("Skill Name (Business Mode)", value=skill.get('name_business', ''), key=f"{key_prefix}_name_biz")
                        edit_icon = st.text_input("Lucide Icon Name", value=s_icon, key=f"{key_prefix}_icon")
                        
                        default_cat_idx = categories_opts.index(skill.get('category', 'dynamic'))
                        edit_cat = st.selectbox(
                            "Category", 
                            options=categories_opts, 
                            index=default_cat_idx,
                            format_func=lambda x: categories_labels[x],
                            key=f"{key_prefix}_cat"
                        )
                        edit_color = st.text_input("Hex Color Code", value=s_color, key=f"{key_prefix}_color")
                        edit_level = st.text_input("Skill Level (Optional)", value=s_level, key=f"{key_prefix}_level")
                        
                        other_skills = [sk.get('name') for sk in st.session_state.skills if sk.get('name') and sk.get('name') != s_name]
                        curr_prereq = skill.get('prereq')
                        if curr_prereq not in other_skills:
                            curr_prereq = None
                        
                        prereq_opts = [None] + other_skills
                        prereq_idx = prereq_opts.index(curr_prereq)
                        edit_prereq = st.selectbox("Prerequisite (Optional)", options=prereq_opts, index=prereq_idx, key=f"{key_prefix}_prereq")
                        
                        curr_status = skill.get('status')
                        status_opts = [None, 'legendary', 'mastered', 'quest']
                        if curr_status not in status_opts:
                            curr_status = None
                        status_idx = status_opts.index(curr_status)
                        edit_status = st.selectbox("Status (Optional)", options=status_opts, index=status_idx, key=f"{key_prefix}_status")
                        
                        edit_desc = st.text_area("Description / Summary (Dev Mode)", value=skill.get('description', ''), key=f"{key_prefix}_desc")
                        edit_desc_biz = st.text_area("Description / Summary (Biz Mode)", value=skill.get('description_business', ''), key=f"{key_prefix}_desc_biz")
                        
                        curr_linked_projects = [p.get('id') for p in skill.get('projects', []) if p.get('id')]
                        curr_linked_projects = [pid for pid in curr_linked_projects if pid in project_options]
                        
                        edit_selected_projects = st.multiselect(
                            "Link to Projects (Optional)", 
                            options=project_ids, 
                            default=curr_linked_projects,
                            format_func=lambda x: project_options[x],
                            key=f"{key_prefix}_projects"
                        )
                        
                        col_b1, col_b2 = st.columns([1, 1])
                        with col_b1:
                            if st.button(f"Save Changes", key=f"{key_prefix}_save_btn", type="primary", width="stretch"):
                                if not edit_name.strip():
                                    st.error("Skill Name is required!")
                                elif edit_name.strip().lower() != s_name.lower() and any(sk.get("name", "").lower() == edit_name.strip().lower() for sk in st.session_state.skills):
                                    st.error(f"Another skill named '{edit_name.strip()}' already exists!")
                                else:
                                    updated_s = {
                                        "name": edit_name.strip(),
                                        "name_business": edit_name_biz.strip(),
                                        "icon": edit_icon.strip(),
                                        "description": edit_desc.strip(),
                                        "description_business": edit_desc_biz.strip(),
                                        "category": edit_cat,
                                        "color": edit_color.strip()
                                    }
                                    if edit_level.strip():
                                        updated_s["level"] = edit_level.strip()
                                    if edit_prereq:
                                        updated_s["prereq"] = edit_prereq
                                    if edit_status:
                                        updated_s["status"] = edit_status
                                    if edit_selected_projects:
                                        updated_s["projects"] = [{"title": project_options[pid], "id": pid} for pid in edit_selected_projects]
                                        
                                    updated_skills_list = []
                                    for sk in st.session_state.skills:
                                        if sk.get('name') == s_name:
                                            updated_skills_list.append(updated_s)
                                        else:
                                            if edit_name.strip() != s_name and sk.get('prereq') == s_name:
                                                sk['prereq'] = edit_name.strip()
                                            updated_skills_list.append(sk)
                                            
                                    try:
                                        is_offline = st.session_state.get("offline_mode", False)
                                        if HAS_SYNC and not is_offline and edit_name.strip() != s_name and not delete_skill(s_name):
                                            raise Exception("Database delete for the old skill name failed. Local files were not changed.")
                                        write_skills_file(updated_skills_list)
                                        st.session_state.skills = updated_skills_list
                                        st.success(f"Successfully updated skill: **{edit_name.strip()}**!")
                                        if not dry_run_skills:
                                            st.info("🚀 Pushing changes to GitHub...")
                                            git_ok, git_msg = git_commit_push_file("src/data/skills.json", f"chore(skills): update skill - {edit_name.strip()}")
                                            if git_ok:
                                                st.toast(f"💡 Skill updated and {git_msg}")
                                            else:
                                                st.error(f"❌ Git failed: {git_msg}")
                                        st.rerun()
                                    except Exception as e:
                                        st.error(f"Failed to save skill changes: {e}")
                                        
                        with col_b2:
                            if st.button(f"Delete Skill", key=f"{key_prefix}_del_btn", type="secondary", width="stretch"):
                                updated_skills_list = []
                                for sk in st.session_state.skills:
                                    if sk.get('name') != s_name:
                                        if sk.get('prereq') == s_name:
                                            sk.pop('prereq', None)
                                        updated_skills_list.append(sk)
                                        
                                try:
                                    is_offline = st.session_state.get("offline_mode", False)
                                    if HAS_SYNC and not is_offline and not delete_skill(s_name):
                                        raise Exception("Database delete failed. Local files were not changed.")
                                    write_skills_file(updated_skills_list)
                                    st.session_state.skills = updated_skills_list
                                    st.success(f"Successfully deleted skill: **{s_name}**!")
                                    if not dry_run_skills:
                                        st.info("🚀 Pushing changes to GitHub...")
                                        git_ok, git_msg = git_commit_push_file("src/data/skills.json", f"chore(skills): delete skill - {s_name}")
                                        if git_ok:
                                            st.toast(f"💡 Skill deleted and {git_msg}")
                                        else:
                                            st.error(f"❌ Git failed: {git_msg}")
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Failed to delete skill: {e}")

# ──────────────────────────────────────────
# TAB 5: UPDATE PHOTOS
# ──────────────────────────────────────────
with tab_photos:
    st.markdown('<div class="section-header">Update Hero & About Photos</div>', unsafe_allow_html=True)
    st.write("Upload new images to replace the background/profile illustrations on your portfolio site.")
    
    dry_run_photo = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_photo")
    
    if not HAS_PIL:
        st.info("💡 **Tip**: Install Pillow (`pip install pillow`) in your project environment to automatically convert any uploaded image (PNG, JPG, WebP) to the correct format required by the website.")

    # save_uploaded_image is now defined globally in the helpers section

    # 1. Hero Section Photos
    st.markdown("## Hero Section Photos")
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Hero - Noir Mode")
        st.caption("Target: `public/images/hero-noir.webp` (WebP)")
        hero_noir_path = "public/images/hero-noir.webp"
        if os.path.exists(hero_noir_path):
            st_image_safe(hero_noir_path, caption="Current Noir Hero", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_hero_noir = st.file_uploader("Upload New Noir Hero Image", type=["png", "jpg", "jpeg", "webp"], key="up_hero_noir")
        if up_hero_noir is not None:
            if st.button("Replace Noir Hero Image", key="btn_hero_noir", type="primary"):
                success, msg = save_uploaded_image(up_hero_noir, hero_noir_path, "WEBP")
                if success:
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(hero_noir_path, "chore(photos): update hero noir image")
                        if git_ok:
                            st.toast(f"🖼️ {msg}\n\n{git_msg}")
                        else:
                            st.toast(f"⚠️ {msg} but Git failed: {git_msg}")
                    else:
                        st.toast(f"🖼️ {msg}")
                    st.rerun()
                else:
                    st.error(msg)
                    
    with col2:
        st.subheader("Hero - Comic Mode")
        st.caption("Target: `public/images/hero-illustration-wavy.webp` (WebP)")
        hero_comic_path = "public/images/hero-illustration-wavy.webp"
        if os.path.exists(hero_comic_path):
            st_image_safe(hero_comic_path, caption="Current Comic Hero", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_hero_comic = st.file_uploader("Upload New Comic Hero Image", type=["png", "jpg", "jpeg", "webp"], key="up_hero_comic")
        if up_hero_comic is not None:
            if st.button("Replace Comic Hero Image", key="btn_hero_comic", type="primary"):
                success, msg = save_uploaded_image(up_hero_comic, hero_comic_path, "WEBP")
                if success:
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(hero_comic_path, "chore(photos): update hero comic image")
                        if git_ok:
                            st.toast(f"🖼️ {msg}\n\n{git_msg}")
                        else:
                            st.toast(f"⚠️ {msg} but Git failed: {git_msg}")
                    else:
                        st.toast(f"🖼️ {msg}")
                    st.rerun()
                else:
                    st.error(msg)

    st.markdown("---")
    
    # 2. About Section Photos
    st.markdown("## About Section Photos")
    col3, col4 = st.columns(2)
    
    with col3:
        st.subheader("About Portrait - Noir Mode")
        st.caption("Target: `public/images/profile-noir.webp` (WebP)")
        profile_noir_path = "public/images/profile-noir.webp"
        if os.path.exists(profile_noir_path):
            st_image_safe(profile_noir_path, caption="Current Noir Profile", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_profile_noir = st.file_uploader("Upload New Noir Profile Image", type=["png", "jpg", "jpeg", "webp"], key="up_profile_noir")
        if up_profile_noir is not None:
            if st.button("Replace Noir Profile Image", key="btn_profile_noir", type="primary"):
                success, msg = save_uploaded_image(up_profile_noir, profile_noir_path, "WEBP")
                if success:
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(profile_noir_path, "chore(photos): update profile noir image")
                        if git_ok:
                            st.toast(f"🖼️ {msg}\n\n{git_msg}")
                        else:
                            st.toast(f"⚠️ {msg} but Git failed: {git_msg}")
                    else:
                        st.toast(f"🖼️ {msg}")
                    st.rerun()
                else:
                    st.error(msg)
                    
    with col4:
        st.subheader("About Portrait - Comic Mode")
        st.caption("Target: `public/images/profile-comic.webp` (WebP)")
        profile_comic_path = "public/images/profile-comic.webp"
        if os.path.exists(profile_comic_path):
            st_image_safe(profile_comic_path, caption="Current Comic Profile", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_profile_comic = st.file_uploader("Upload New Comic Profile Image", type=["png", "jpg", "jpeg", "webp"], key="up_profile_comic")
        if up_profile_comic is not None:
            if st.button("Replace Comic Profile Image", key="btn_profile_comic", type="primary"):
                success, msg = save_uploaded_image(up_profile_comic, profile_comic_path, "WEBP")
                if success:
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(profile_comic_path, "chore(photos): update profile comic image")
                        if git_ok:
                            st.toast(f"🖼️ {msg}\n\n{git_msg}")
                        else:
                            st.toast(f"⚠️ {msg} but Git failed: {git_msg}")
                    else:
                        st.toast(f"🖼️ {msg}")
                    st.rerun()
                else:
                    st.error(msg)

# ──────────────────────────────────────────
# TAB 6: BLOG EDITOR
# ──────────────────────────────────────────
with tab_blog:
    st.markdown('<div class="section-header">AI Blog Writer & Publisher</div>', unsafe_allow_html=True)
    st.write("Draft professional developer logs, tutorials, and post updates using the Gemini co-pilot, and publish them directly to your website.")
    
    # 💡 Brainstorm Ideas from Codebase
    st.subheader("💡 Brainstorm Ideas from Codebase")
    st.write("Let Gemini analyze your projects, skills, package dependencies, and recent git commits to propose engineering blog topics.")

    ideas_status = st.session_state.get("blog_ideas_task_status", "idle")

    if ideas_status == "success":
        ideas_res = st.session_state.get("blog_ideas_task_result")
        if ideas_res:
            ideas_list = ideas_res.get("ideas", [])
            st.session_state.blog_brainstormed_ideas = ideas_list
            if ideas_list:
                st.success("Successfully generated blog ideas!")
            else:
                st.warning("⚠️ No ideas were returned by Gemini. Please try again or check your codebase metadata.")
        else:
            st.warning("⚠️ Brainstorm task completed, but returned empty results.")
        st.session_state.blog_ideas_task_status = "idle"
    elif ideas_status == "error":
        ideas_err = st.session_state.get("blog_ideas_task_error", "Unknown error")
        st.error(f"Error brainstorming ideas: {ideas_err}")
        st.session_state.blog_ideas_task_status = "idle"

    if ideas_status == "running":
        st.info("🧠 Analyzing codebase metadata and brainstorming technical articles...")
        st.markdown(
            '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
            '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
            '<span>Brainstorming ideas. Feel free to browse other tabs!</span>'
            '</div>'
            '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
            unsafe_allow_html=True
        )

    # Fetch projects for multi-select
    projects_list = []
    try:
        projects_list = parse_projects_file()
    except Exception:
        pass

    projects_with_github = ["Current Website Codebase (Prateek_website)"]
    if projects_list:
        projects_with_github.extend([
            p.get("title") for p in projects_list 
            if p.get("title") and p.get("githubUrl")
        ])

    selected_github_projects = st.multiselect(
        "Select projects to fetch GitHub repository details for deeper analysis:",
        options=projects_with_github,
        default=["Current Website Codebase (Prateek_website)"],
        help="For selected projects, the brainstormer will fetch their README and recent commits directly from GitHub (or locally for the website) to build highly specific blog topics."
    )

    col_brainstorm, col_clear = st.columns([3, 1])
    with col_brainstorm:
        btn_ideas_disabled = (ideas_status == "running")
        if st.button("Brainstorm 5 Blog Ideas", width="stretch", disabled=btn_ideas_disabled, key="btn_brainstorm_blog"):
            # Resolve selected project github URLs at click time
            github_urls_to_fetch = {}
            include_current_website_codebase = False
            for proj_title in selected_github_projects:
                if proj_title == "Current Website Codebase (Prateek_website)":
                    include_current_website_codebase = True
                    continue
                for p in projects_list:
                    if p.get("title") == proj_title and p.get("githubUrl"):
                        github_urls_to_fetch[proj_title] = p.get("githubUrl")
                        break

            def run_brainstorm():
                # Gather context
                context = {}
                # 1. Projects (filtered by user selection)
                try:
                    context['projects'] = [
                        {
                            'title': p.get('title'),
                            'description': p.get('description'),
                            'tech': p.get('tech', [])
                        }
                        for p in projects_list
                        if p.get('title') in selected_github_projects
                    ]
                    if "Current Website Codebase (Prateek_website)" in selected_github_projects:
                        context['projects'].append({
                            'title': "Current Website Codebase (Prateek_website)",
                            'description': "This Next.js portfolio website codebase.",
                            'tech': ["Next.js 16", "React 19", "TypeScript", "TailwindCSS", "Supabase", "Framer Motion"]
                        })
                except Exception:
                    pass
                # 2. Skills
                try:
                    skills = parse_skills_file()
                    if skills:
                        context['skills'] = [s.get('name') for s in skills if s.get('name')][:15]
                except Exception:
                    pass
                # 3. Git log
                try:
                    success, logs = run_safe_git_command(["git", "log", "-n", "8", "--oneline"], cwd=os.getcwd())
                    if success:
                        context['recent_commits'] = logs.strip().split('\n')
                except Exception:
                    pass
                # 4. Package.json
                try:
                    if os.path.exists("package.json"):
                        with open("package.json", "r") as f:
                            pkg = json.load(f)
                            context['dependencies'] = list(pkg.get('dependencies', {}).keys())
                except Exception:
                    pass

                # 5. Fetch remote GitHub repository details for chosen projects
                if github_urls_to_fetch or include_current_website_codebase:
                    context['github_repositories'] = {}
                    
                    if include_current_website_codebase:
                        # Read the local README.md of the website codebase
                        website_readme = "No README found."
                        try:
                            if os.path.exists("README.md"):
                                with open("README.md", "r", encoding="utf-8") as f:
                                    website_readme = f.read()[:1500]
                        except Exception:
                            pass
                        
                        context['github_repositories']["Current Website Codebase (Prateek_website)"] = {
                            "slug": "prat3010/Prateek_website",
                            "readme": website_readme,
                            "recent_commits": "\n".join(context.get('recent_commits', []))
                        }

                    for title, url in github_urls_to_fetch.items():
                        repo_meta = fetch_github_repo_metadata(url)
                        if repo_meta:
                            context['github_repositories'][title] = repo_meta

                prompt = f"""
                You are a senior full-stack developer and technical blogger. 
                Analyze the following codebase metadata (projects, skills, package dependencies, and recent git commits), including detailed fetched repository files/commits:
                
                [CODEBASE CONTEXT]
                {json.dumps(context, indent=2)}
                
                Generate a list of 5 creative, highly technical, and engaging blog post ideas that would fit perfectly on this developer's portfolio.
                For each idea, return:
                1. A catchy, SEO-optimized title.
                2. A short paragraph describing the technical details, challenges, or architectural decisions that could be discussed in the post.
                3. A ready-to-use structured prompt/notes block (150-300 words) explaining the technical details, background, and solution of the topic so that a blog generator can write it.
                
                Generate and return strictly the following JSON structure:
                {{
                  "ideas": [
                    {{
                      "title": "A catchy, SEO-optimized title",
                      "description": "Short paragraph describing what the post will cover.",
                      "notes": "A detailed, raw notes block (150-300 words) explaining the technical details, background, and solution of the topic so that a blog generator can write it."
                    }}
                  ]
                }}
                Do not return any conversational text, markdown formatting wrappers outside the JSON, or backticks. Return only the raw JSON.
                """

                res = call_gemini(prompt)
                if res is None:
                    raise ValueError("Failed to generate blog ideas from Gemini.")
                return res

            run_async_task(run_brainstorm, "blog_ideas_task")
            st.rerun()

    with col_clear:
        if st.button("Clear Ideas", width="stretch", key="btn_clear_ideas"):
            if "blog_brainstormed_ideas" in st.session_state:
                del st.session_state.blog_brainstormed_ideas
            if "blog_ideas_task_status" in st.session_state:
                st.session_state.blog_ideas_task_status = "idle"
            if "blog_ideas_task_error" in st.session_state:
                st.session_state.blog_ideas_task_error = None
            st.rerun()

    # Display brainstormed ideas
    brainstormed_ideas = st.session_state.get("blog_brainstormed_ideas", [])
    if brainstormed_ideas:
        st.write("### Proposed Blog Ideas:")
        for idx, idea in enumerate(brainstormed_ideas):
            with st.expander(f"💡 {idea.get('title', 'Idea ' + str(idx+1))}"):
                st.write(idea.get('description', ''))
                st.markdown("**Structured raw notes for generator:**")
                st.code(idea.get('notes', ''), language="markdown")
                if st.button(f"👉 Use this Idea", key=f"btn_use_idea_{idx}"):
                    st.session_state.blog_draft_title = idea.get('title', '')
                    st.session_state.blog_draft_raw_notes = idea.get('notes', '')
                    st.toast(f"Selected: {idea.get('title')}")
                    st.rerun()

    st.write("---")

    # AI Assist inputs
    st.subheader("AI Ghostwriter Co-Pilot")
    raw_notes = st.text_area(
        "1. Paste your raw notes, debug outputs, or code snippets here:",
        height=150,
        placeholder="E.g. Fixed resume PDF download using jsPDF to create a vector layout so text remains selectable and ATS-compliant...",
        key="blog_draft_raw_notes"
    )
    
    tone = st.selectbox("Choose Tone:", ["Professional & Technical", "Conversational & Casual", "Tutorial / How-To Style"], key="blog_draft_tone")
    
    blog_status = st.session_state.get("blog_draft_task_status", "idle")
    
    if blog_status == "success":
        res = st.session_state.get("blog_draft_task_result")
        if res:
            st.session_state.blog_draft_title = res.get("title", "")
            st.session_state.blog_draft_excerpt = res.get("excerpt", "")
            st.session_state.blog_draft_content = res.get("content", "")
            st.success("Draft generated! Review it below.")
        st.session_state.blog_draft_task_status = "idle"
    elif blog_status == "error":
        err_msg = st.session_state.get("blog_draft_task_error", "Unknown error")
        st.error(f"Error generating draft: {err_msg}")
        st.session_state.blog_draft_task_status = "idle"
        
    if blog_status == "running":
        st.info("🤖 Translating notes into a professional article in the background...")
        st.markdown(
            '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">'
            '<div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem; border: 0.25em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border .75s linear infinite;"></div>'
            '<span>Gemini is generating your draft. Feel free to edit other parts or switch tabs!</span>'
            '</div>'
            '<style>@keyframes spinner-border { to { transform: rotate(360deg); } }</style>',
            unsafe_allow_html=True
        )

    btn_disabled = (blog_status == "running")
    if st.button("Draft Blog Post with AI", width="stretch", disabled=btn_disabled, key="btn_draft_blog"):
        if not raw_notes:
            st.error("Please add some raw notes or code first!")
        else:
            prompt = f"""
            You are a senior full-stack developer and technical writer. 
            Your task is to write a highly engaging, clear, and professional developer blog post based on these raw notes and code:
            
            [RAW NOTES / CODE]
            {raw_notes}
            
            [TONE]
            {tone}
            
            Generate and return strictly the following JSON structure:
            {{
              "title": "A catchy, SEO-optimized title for the blog post (e.g. 'How to solve X with Y')",
              "excerpt": "A short, 1-2 sentence description summarizing the post's takeaways",
              "content": "The full body content of the blog post in standard Markdown format. Use clear headings (e.g. ##, ###), bullets, blockquotes, and code blocks for technical details. Focus on clarity, engineering details, and keep it direct. Avoid standard AI greeting fillers or concluding phrases like 'In conclusion'."
            }}
            Do not return any conversational text, markdown formatting wrappers outside the JSON, or backticks. Return only the raw JSON.
            """
            
            def run_blog_generation():
                res = call_gemini(prompt)
                if res is None:
                    raise ValueError("Failed to generate blog post from Gemini. Please verify API key, logs, or network.")
                return res
                
            run_async_task(run_blog_generation, "blog_draft_task")
            st.rerun()
                    
    # Form details (pre-filled from session state if available)
    st.subheader("Edit & Publish Post")
    
    draft_title = st.text_input("Title:", key="blog_draft_title")
    draft_excerpt = st.text_area("Excerpt / Summary:", key="blog_draft_excerpt")
    draft_tags = st.text_input("Tags (comma separated):", key="blog_draft_tags")
    draft_content = st.text_area("Markdown Body Content:", height=350, key="blog_draft_content")
    
    dry_run_blog = st.checkbox("Dry-Run Mode (Save to Supabase/locally, skip Git remote push)", value=True, key="dry_blog")
    
    if st.button("Publish Blog Post", width="stretch", type="primary"):
        try:
            draft_title, draft_excerpt, tags_list, draft_content = validate_blog_fields(
                draft_title,
                draft_excerpt,
                [t.strip() for t in draft_tags.split(",") if t.strip()],
                draft_content,
            )
            slug = slugify(draft_title)
            date_str = st.session_state.get("blog_draft_date", datetime.now().strftime('%Y-%m-%d'))
            
            # Format frontmatter
            file_content = f"""---
title: {json.dumps(draft_title)}
date: {json.dumps(date_str)}
excerpt: {json.dumps(draft_excerpt)}
tags: {json.dumps(tags_list)}
coverImage: "/images/blog/default.jpg"
---

{draft_content}
"""
            is_offline = st.session_state.get("offline_mode", False)
            supabase_success = True
            
            if HAS_SYNC and not is_offline:
                st.info("Syncing blog post to Supabase...")
                post_data = {
                    'slug': slug,
                    'title': draft_title,
                    'date': date_str,
                    'excerpt': draft_excerpt,
                    'tags': tags_list,
                    'coverImage': '/images/blog/default.jpg',
                    'content': draft_content
                }
                res = sync_blog_post(post_data)
                if res is None:
                    supabase_success = False
                    st.error("Failed to sync blog post to Supabase.")
            
            if supabase_success:
                try:
                    # Write file
                    posts_dir = os.path.join("src", "content", "posts")
                    os.makedirs(posts_dir, exist_ok=True)
                    file_path = os.path.join(posts_dir, f"{slug}.md")
                    atomic_write_text(file_path, file_content)
                    
                    # Update resume sync log
                    resume = parse_resume_file()
                    if resume:
                        resume['lastSynced'] = {
                            "timestamp": datetime.now().isoformat(),
                            "status": "success",
                            "summary": f"Published blog post: {draft_title}"
                        }
                        write_resume_file(resume)
                        st.session_state.resume = resume
                    
                    st.success(f"Successfully published blog post locally! File created at: `{file_path}`")
                    
                    if HAS_SYNC and not is_offline:
                        st.info("Purging website cache...")
                        trigger_revalidation()
                        st.success("Website cache revalidated successfully!")
                    
                    if not dry_run_blog:
                        st.info("🚀 Pushing changes to GitHub...")
                        git_ok, git_msg = commit_and_push_paths(
                            run_safe_git_command,
                            [file_path, "src/data/resume.json"],
                            f"chore(blog): publish post - {draft_title}",
                            cwd=os.getcwd(),
                        )
                        if git_ok:
                            st.success(git_msg)
                        else:
                            st.error(f"Git failed: {git_msg}")
                    
                    # Clear session state
                    if "blog_draft_title" in st.session_state: del st.session_state.blog_draft_title
                    if "blog_draft_excerpt" in st.session_state: del st.session_state.blog_draft_excerpt
                    if "blog_draft_content" in st.session_state: del st.session_state.blog_draft_content
                    if "blog_draft_tags" in st.session_state: del st.session_state.blog_draft_tags
                    if "blog_draft_date" in st.session_state: del st.session_state.blog_draft_date
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"Failed to publish post: {e}")
        except Exception as e:
            st.error(str(e))

    # ──────────────────────────────────────────
    # Existing / Published Blogs List
    # ──────────────────────────────────────────
    st.markdown("---")
    st.subheader("Already Published Logs")
    
    posts_dir = os.path.join("src", "content", "posts")
    if os.path.exists(posts_dir):
        post_files = [f for f in os.listdir(posts_dir) if f.endswith(".md")]
        
        if not post_files:
            st.info("No blog posts found on the website.")
        else:
            posts_data = []
            for file_name in post_files:
                file_path = os.path.join(posts_dir, file_name)
                post_title = file_name
                post_date = ""
                post_excerpt = ""
                post_tags_list = []
                post_body = ""
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        file_content = f.read()
                    post_body = file_content
                    if file_content.startswith("---"):
                        parts = file_content.split("---", 2)
                        if len(parts) >= 3:
                            frontmatter = parts[1]
                            post_body = parts[2].strip()
                            for line in frontmatter.split("\n"):
                                line = line.strip()
                                if line.startswith("title:"):
                                    post_title = line.split("title:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("date:"):
                                    post_date = line.split("date:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("excerpt:"):
                                    post_excerpt = line.split("excerpt:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("tags:"):
                                    tags_str = line.split("tags:", 1)[1].strip()
                                    try:
                                        post_tags_list = json.loads(tags_str)
                                    except Exception:
                                        tags_clean = tags_str.replace("[", "").replace("]", "").replace('"', '').replace("'", "")
                                        post_tags_list = [t.strip() for t in tags_clean.split(",") if t.strip()]
                except Exception:
                    pass
                
                posts_data.append({
                    "file_name": file_name,
                    "file_path": file_path,
                    "title": post_title,
                    "date": post_date,
                    "excerpt": post_excerpt,
                    "tags": post_tags_list,
                    "body": post_body
                })
            
            # Sort by date (newest first)
            posts_data.sort(key=lambda x: x["date"] or "0000-00-00", reverse=True)
            
            for post in posts_data:
                with st.container(border=True):
                    col_info, col_edit, col_del = st.columns([5, 1, 1.2])
                    with col_info:
                        st.markdown(f"**{post['title']}**")
                        st.caption(f"Date: {post['date'] if post['date'] else 'No Date'} | File: `{post['file_name']}`")
                    with col_edit:
                        edit_key = f"edit_{post['file_name']}"
                        if st.button("Edit", key=edit_key, type="secondary", width="stretch"):
                            st.session_state.blog_draft_title = post['title']
                            st.session_state.blog_draft_excerpt = post['excerpt']
                            st.session_state.blog_draft_tags = ", ".join(post['tags'])
                            st.session_state.blog_draft_content = post['body']
                            st.session_state.blog_draft_date = post['date']
                            st.rerun()
                    with col_del:
                        btn_key = f"delete_{post['file_name']}"
                        if st.button("Remove", key=btn_key, type="secondary", width="stretch"):
                            try:
                                os.remove(post['file_path'])
                            except Exception as e:
                                st.error(f"Error deleting file: {e}")
                            
                            is_offline = st.session_state.get("offline_mode", False)
                            if HAS_SYNC and not is_offline:
                                slug = post['file_name'].replace(".md", "")
                                if delete_blog_post(slug):
                                    trigger_revalidation()
                                else:
                                    st.error("Deleted local blog file, but Supabase delete failed.")
                            
                            st.success(f"Deleted `{post['file_name']}` successfully!")
                            st.rerun()
    else:
        st.info("No blog posts directory found.")
