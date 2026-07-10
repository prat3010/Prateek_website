import os
import sys
import re
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
import streamlit as st

# Setup sys.path to resolve script directory modules properly
SCRIPTS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

# Import Supabase sync helpers from sibling module
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

# Pillow import
try:
    from PIL import Image as PILImage
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ==========================================
# Env Loader & API Helpers
# ==========================================
def load_env():
    env_vars = dict(os.environ)
    # Find relative env file from project root
    env_path = os.path.join(os.path.dirname(SCRIPTS_DIR), ".env.local")
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
                    pattern = r"```(?:json)?\s*(.*?)\s*```"
                    match = re.search(pattern, text, re.DOTALL)
                    if match:
                        try:
                            return json.loads(match.group(1).strip())
                        except json.JSONDecodeError:
                            pass
                    
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

def check_and_add_pending_skills(tags_list):
    current_skills = parse_skills_file()
    existing_skill_names = {s.get("name", "").lower() for s in current_skills}
    
    if 'pending_skills' not in st.session_state:
        st.session_state.pending_skills = []
    pending_names = {s.get("name", "").lower() for s in st.session_state.pending_skills}
    
    new_tags = []
    for tag in tags_list:
        tag_clean = tag.strip().lower()
        if not tag_clean:
            continue
            
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
        tags_needing_gemini = []
        for tag in new_tags:
            if tag in FALLBACK_SKILLS:
                st.session_state.pending_skills.append(FALLBACK_SKILLS[tag])
                st.toast(f"💡 Resolved new tag '{tag}' locally from database!")
            else:
                tags_needing_gemini.append(tag)
                
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

def run_async_task(task_func, key_prefix):
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

def is_port_active(port):
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False

def trigger_rebuild_commit():
    success, out = run_safe_git_command(["git", "commit", "--allow-empty", "-m", "chore(deploy): force vercel rebuild"])
    if not success:
        raise Exception(f"Failed to create empty commit: {out}")
    success, out = run_safe_git_command(["git", "push"])
    if not success:
        raise Exception(f"Failed to push empty commit: {out}")
    return "Triggered Vercel rebuild successfully via empty commit!"

def run_safe_git_command(args, cwd=None):
    import subprocess
    if not args or args[0] != "git":
        return False, "Invalid command program: only 'git' is allowed."
        
    if len(args) < 2:
        return False, "Git command is missing subcommand."
        
    allowed_subcommands = {"log", "status", "add", "commit", "push", "diff"}
    subcommand = args[1]
    if subcommand not in allowed_subcommands:
        return False, f"Access denied: Git subcommand '{subcommand}' is not whitelisted."
        
    banned_substrings = {"--config", "--exec-path", "--upload-pack", "--receive-pack"}
    for arg in args[2:]:
        for banned in banned_substrings:
            if banned in arg:
                return False, f"Access denied: Dangerous parameter '{banned}' detected in command arguments."
    
    if cwd:
        cwd = os.path.realpath(cwd)
        if not os.path.isdir(cwd):
            return False, f"Directory does not exist: {cwd}"
            
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

def read_local_path_context(path_str):
    if not path_str:
        return False, "Path is empty."
    
    abs_path = os.path.abspath(path_str)
    if not os.path.isabs(path_str):
        abs_path = os.path.abspath(os.path.join(os.getcwd(), path_str))
        
    home_dir = os.path.expanduser("~")
    if not abs_path.startswith(home_dir) and not abs_path.startswith(os.getcwd()):
        return False, "Access denied: Path must be inside project or user directories."
        
    if not os.path.exists(abs_path):
        return False, f"Path does not exist: `{path_str}`"
        
    if os.path.isfile(abs_path):
        try:
            if os.path.getsize(abs_path) > 500 * 1024:
                return False, "File is too large (max 500KB)."
            with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return True, f"=== FILE: {os.path.basename(abs_path)} ===\n{content}"
        except Exception as e:
            return False, f"Error reading file: {e}"
            
    elif os.path.isdir(abs_path):
        try:
            allowed_exts = {'.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.css', '.md', '.sql', '.yaml', '.yml', '.mjs'}
            gathered = []
            file_count = 0
            size_count = 0
            for root, dirs, files in os.walk(abs_path):
                dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '.next', '__pycache__', 'dist', 'build'}]
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in allowed_exts:
                        f_path = os.path.join(root, file)
                        f_size = os.path.getsize(f_path)
                        if f_size > 100 * 1024:
                            continue
                        size_count += f_size
                        if size_count > 250 * 1024:
                            break
                        file_count += 1
                        if file_count > 15:
                            break
                        with open(f_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        rel_path = os.path.relpath(f_path, abs_path)
                        gathered.append(f"=== FILE: {rel_path} ===\n{content}")
                if file_count > 15 or size_count > 250 * 1024:
                    break
            if not gathered:
                return False, "No readable source files found in the directory."
            return True, "\n\n".join(gathered)
        except Exception as e:
            return False, f"Error reading directory: {e}"
            
    return False, "Unknown path type."

def fetch_github_repo_metadata(github_url):
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

    resolved_repo = repo
    commits_url = f"https://api.github.com/repos/{owner}/{resolved_repo}/commits"
    headers = {"User-Agent": "Mozilla/5.0"}
    token = env.get("GITHUB_TOKEN") or env.get("GITHUB_PAT") or env.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"
        
    req = urllib.request.Request(commits_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            pass
    except urllib.error.HTTPError as e:
        if e.code == 404:
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

    commits_text = ""
    commits_url = f"https://api.github.com/repos/{owner}/{resolved_repo}/commits"
    req = urllib.request.Request(commits_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            commits = json.loads(res.read().decode("utf-8"))
            commits_text = "\n".join([f"- {c['sha'][:7]} {c['commit']['message'].splitlines()[0]}" for c in commits[:3]])
    except Exception:
        pass

    readme = ""
    for branch in ["main", "master", "dev", "develop"]:
        for filename in ["README.md", "readme.md", "README.markdown", "README.txt"]:
            readme = fetch_file_content(resolved_repo, f"{branch}/{filename}")
            if readme:
                break
        if readme:
            break

    if readme:
        readme = readme[:1500]

    return {
        "slug": f"{owner}/{resolved_repo}",
        "readme": readme if readme else "No README found.",
        "recent_commits": commits_text if commits_text else "No recent commits fetched."
    }

def sanitize_local_path(path_input):
    if not path_input:
        return False, None, "Path cannot be empty."
        
    path_input = path_input.strip()
    if path_input.startswith("-"):
        return False, None, "Path cannot start with '-' to prevent CLI flag injection."
        
    if "\x00" in path_input or "\n" in path_input or "\r" in path_input:
        return False, None, "Path contains invalid control characters."
        
    try:
        resolved = os.path.realpath(path_input)
    except Exception as e:
        return False, None, f"Failed to resolve path: {str(e)}"
        
    if not os.path.exists(resolved):
        return False, None, "Directory does not exist."
    if not os.path.isdir(resolved):
        return False, None, "Path is not a valid directory."
        
    home_dir = os.path.expanduser("~")
    if not resolved.startswith(home_dir) and not resolved.startswith(os.getcwd()):
        return False, None, "Access denied: Path must be inside home directory or project directory."
        
    git_dir = os.path.join(resolved, ".git")
    if not os.path.exists(git_dir) or not os.path.isdir(git_dir):
        return False, None, "Path is not a Git repository (missing '.git' folder)."
        
    return True, resolved, None

# ==========================================
# TS Data Parsers (Projects, Resume, Certs)
# ==========================================
def parse_projects_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_projects
            data = fetch_projects()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch projects from Supabase: {e}")
            
    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/projects.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local projects.json: {e}")
    return []

def write_projects_file(projects):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_projects(projects)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/projects.json")
    try:
        atomic_write_json(path, projects)
    except Exception as e:
        raise Exception(f"Failed to write projects to local file: {str(e)}")
        
    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

def parse_resume_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_resume
            data = fetch_resume()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch resume from Supabase: {e}")

    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/resume.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local resume.json: {e}")
    return None

def parse_skills_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_skills
            data = fetch_skills()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch skills from Supabase: {e}")

    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/skills.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local skills.json: {e}")
    return []

def write_skills_file(skills_list):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_skills(skills_list)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/skills.json")
    try:
        atomic_write_json(path, skills_list)
    except Exception as e:
        raise Exception(f"Failed to write skills to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

def write_resume_file(resume):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_resume(resume)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/resume.json")
    try:
        atomic_write_json(path, resume)
    except Exception as e:
        raise Exception(f"Failed to write resume to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

def parse_certificates_file():
    if HAS_SYNC:
        try:
            from sync_supabase import fetch_certificates
            data = fetch_certificates()
            if data is not None:
                return data
        except Exception as e:
            print(f"Failed to fetch certificates from Supabase: {e}")

    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/certificates.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to read local certificates.json: {e}")
    return []

def write_certificates_file(certificates):
    is_offline = st.session_state.get("offline_mode", False)
    
    if HAS_SYNC and not is_offline:
        try:
            res = sync_certificates(certificates)
            if res is None:
                raise Exception("Supabase REST API returned a failure response (None).")
        except Exception as e:
            raise Exception(f"Database sync failed: {str(e)}. Changes were NOT saved.")
            
    path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/certificates.json")
    try:
        atomic_write_json(path, certificates)
    except Exception as e:
        raise Exception(f"Failed to write certificates to local file: {str(e)}")

    if HAS_SYNC and not is_offline:
        try:
            trigger_revalidation()
        except Exception:
            pass

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

def save_uploaded_image(uploaded_file, target_path, target_format, max_width=None, quality=80):
    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        uploaded_file.seek(0, 2)
        original_size = uploaded_file.tell()
        uploaded_file.seek(0)
        
        if HAS_PIL:
            image = PILImage.open(uploaded_file)
            
            if max_width and image.size[0] > max_width:
                aspect_ratio = image.size[1] / image.size[0]
                new_height = int(max_width * aspect_ratio)
                image = image.resize((max_width, new_height), PILImage.Resampling.LANCZOS)
                
            if target_format.upper() == 'WEBP':
                image.save(target_path, format='WEBP', quality=quality)
            elif target_format.upper() == 'PNG':
                image.save(target_path, format='PNG')
            else:
                if image.mode in ('RGBA', 'LA'):
                    image = image.convert('RGB')
                image.save(target_path, format=target_format.upper())
                
            optimized_size = os.path.getsize(target_path)
            reduction_pct = ((original_size - optimized_size) / original_size) * 100 if original_size > 0 else 0
            
            metrics = {
                "original_size": original_size,
                "optimized_size": optimized_size,
                "reduction_pct": max(0.0, reduction_pct)
            }
            return True, f"Successfully converted and saved image to `{target_path}`!", metrics
        else:
            file_ext = os.path.splitext(uploaded_file.name)[1].lower()
            clean_ext = file_ext.replace('jpeg', 'jpg')
            clean_target = f".{target_format.lower()}".replace('jpeg', 'jpg')
            if clean_ext == clean_target:
                with open(target_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                optimized_size = os.path.getsize(target_path)
                metrics = {
                    "original_size": original_size,
                    "optimized_size": optimized_size,
                    "reduction_pct": 0.0
                }
                return True, f"Successfully saved raw `{uploaded_file.name}` directly!", metrics
            else:
                return False, f"Format mismatch! Uploaded `{file_ext}` but target needs `.{target_format.lower()}`. Install `pillow` or upload a matching file.", None
    except Exception as e:
        return False, f"Failed to save: {e}", None

def git_commit_push_file(file_path, commit_message):
    try:
        return commit_and_push_paths(run_safe_git_command, [file_path], commit_message, cwd=os.getcwd())
    except Exception as e:
        return False, f"Git operations failed: {str(e)}"

# ==========================================
# Shared Global CSS styles injector
# ==========================================
def inject_global_styles():
    st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=JetBrains+Mono:wght@400;700&family=Quicksand:wght@300..700&display=swap');
    
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

    .stApp {
        background-color: #1a162b !important;
        background-image: 
            linear-gradient(rgba(255, 117, 151, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 117, 151, 0.03) 1px, transparent 1px),
            radial-gradient(at 10% 10%, rgba(255, 117, 151, 0.18) 0px, transparent 50%),
            radial-gradient(at 90% 20%, rgba(90, 214, 255, 0.16) 0px, transparent 50%),
            radial-gradient(at 50% 80%, rgba(244, 220, 149, 0.12) 0px, transparent 50%);
        background-size: 32px 32px, 32px 32px, 100% 100%, 100% 100%, 100% 100%;
        background-attachment: fixed;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: rgba(38, 32, 69, 0.5);
        padding: 8px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 117, 151, 0.12);
        margin-bottom: 24px;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: auto;
        padding: 8px 16px !important;
        background-color: transparent !important;
        border-radius: 8px !important;
        border: 1px solid transparent !important;
        color: #B0B0C4 !important;
        font-weight: 700 !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .stTabs [data-baseweb="tab"]:hover {
        color: #ffb7c5 !important;
        border-color: rgba(255, 117, 151, 0.2) !important;
        background-color: rgba(255, 117, 151, 0.04) !important;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: rgba(255, 117, 151, 0.1) !important;
        color: #ffffff !important;
        border-color: rgba(255, 117, 151, 0.4) !important;
        box-shadow: 0 4px 12px rgba(255, 117, 151, 0.15);
    }
    
    .stTabs [data-baseweb="tab-highlight-container"] {
        display: none !important;
    }
    
    div[data-testid="stForm"] {
        background-color: rgba(38, 32, 69, 0.5) !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
    }
    
    .section-header {
        color: #ffffff;
        font-size: 1.4rem;
        font-weight: 700;
        margin-top: 8px;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 1.5px solid rgba(255, 117, 151, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .stButton>button {
        background-color: rgba(255, 117, 151, 0.1) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 117, 151, 0.35) !important;
        border-radius: 8px !important;
        padding: 8px 20px !important;
        font-weight: 700 !important;
        font-family: 'Fredoka', sans-serif !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .stButton>button:hover {
        background-color: rgba(255, 117, 151, 0.2) !important;
        border-color: #ffb7c5 !important;
        box-shadow: 0 4px 16px rgba(255, 117, 151, 0.25) !important;
        transform: translateY(-1px);
    }
    
    .stButton>button:active {
        transform: translateY(1px);
    }
    
    .stTextInput>div>div>input, .stTextArea>div>div>textarea, .stSelectbox>div>div {
        background-color: rgba(26, 22, 43, 0.6) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
        transition: all 0.2s ease !important;
    }
    
    .stTextInput>div>div>input:focus, .stTextArea>div>div>textarea:focus {
        border-color: rgba(255, 117, 151, 0.5) !important;
        box-shadow: 0 0 0 3px rgba(255, 117, 151, 0.15) !important;
    }

    div[data-testid="stExpander"] {
        background-color: rgba(38, 32, 69, 0.4) !important;
        border: 1px solid rgba(255, 117, 151, 0.15) !important;
        border-radius: 12px !important;
        margin-bottom: 12px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
    }
    
    .telemetry-card {
        background: rgba(38, 32, 69, 0.6);
        border: 1px solid rgba(255, 117, 151, 0.15);
        border-radius: 12px;
        padding: 16px 20px;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }
    .telemetry-card:hover {
        border-color: rgba(255, 117, 151, 0.35);
        transform: translateY(-2px);
    }
    .telemetry-card-val {
        font-family: 'Fredoka', sans-serif;
        font-size: 2.2rem;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.1;
    }
    .telemetry-card-lbl {
        font-family: 'Quicksand', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        color: #ffb7c5;
        text-transform: uppercase;
        margin-top: 6px;
        letter-spacing: 0.5px;
    }
    
    .bar-container {
        margin-bottom: 12px;
    }
    .bar-label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 0.85rem;
    }
    .bar-label {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
        color: #e0e0e3;
    }
    .bar-count {
        font-family: 'Fredoka', sans-serif;
        font-weight: 700;
        color: #ffffff;
    }
    .bar-track {
        height: 8px;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        overflow: hidden;
    }
    .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

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
