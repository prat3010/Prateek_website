import os
import sys
import re
import json
import urllib.request
import urllib.parse
try:
    import streamlit as st
except ImportError:
    st = None

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
        fetch_records,
        upsert_record,
        fetch_blog_posts,
    )
    HAS_SYNC = True
except ImportError:
    HAS_SYNC = False
    sync_projects = lambda *a, **kw: None
    sync_skills = lambda *a, **kw: None
    sync_certificates = lambda *a, **kw: None
    sync_resume = lambda *a, **kw: None
    call_rpc = lambda *a, **kw: None
    fetch_page_visits = lambda *a, **kw: None
    sync_blog_post = lambda *a, **kw: None
    delete_blog_post = lambda *a, **kw: False
    delete_project = lambda *a, **kw: False
    delete_skill = lambda *a, **kw: False
    delete_certificate = lambda *a, **kw: False
    fetch_records = lambda *a, **kw: None
    fetch_blog_posts = lambda *a, **kw: None

try:
    from sync_tabs.blog_service import (
        publish_post_to_all_layers,
        delete_post_from_all_layers,
        fetch_pending_ai_drafts,
        fetch_rss_news,
        get_rss_feeds,
        save_rss_feeds,
    )
except ImportError:
    publish_post_to_all_layers = lambda *a, **kw: (False, "Service unavailable")
    delete_post_from_all_layers = lambda *a, **kw: (False, "Service unavailable")
    fetch_pending_ai_drafts = lambda *a, **kw: []
    fetch_rss_news = lambda *a, **kw: []
    get_rss_feeds = lambda *a, **kw: []
    save_rss_feeds = lambda *a, **kw: False

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
                    k = key.strip()
                    v = val.strip()
                    env_vars[k] = v
                    os.environ[k] = v
    return env_vars

env = load_env()
GEMINI_API_KEY = env.get("GEMINI_API_KEY")

def trigger_contract_and_schema_audit():
    """Trigger background execution of contract audit and architecture dependency map generator."""
    try:
        subprocess.run([sys.executable, "scripts/audit_contracts.py"], capture_output=True, timeout=5, cwd=os.getcwd())
        subprocess.run([sys.executable, "scripts/generate_architecture_map.py"], capture_output=True, timeout=5, cwd=os.getcwd())
    except Exception:
        pass

def trigger_revalidation():
    trigger_contract_and_schema_audit()
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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GEMINI_API_KEY}"
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
                    return json.loads(text, strict=False)
                except json.JSONDecodeError:
                    pattern = r"```(?:json)?\s*(.*?)\s*```"
                    match = re.search(pattern, text, re.DOTALL)
                    if match:
                        try:
                            return json.loads(match.group(1).strip(), strict=False)
                        except json.JSONDecodeError:
                            pass
                    
                    first_brace = text.find('{')
                    last_brace = text.rfind('}')
                    if first_brace != -1 and last_brace != -1:
                        chunk = text[first_brace:last_brace+1]
                        try:
                            return json.loads(chunk, strict=False)
                        except json.JSONDecodeError:
                            pass
                        # Regex fallback for structured responses with embedded unescaped quotes
                        extracted = {}
                        for k in ["title", "excerpt", "optimized_title", "optimized_excerpt", "readability_grade", "meta_description", "content"]:
                            m = re.search(rf'"{k}"\s*:\s*"(.*?)(?="\s*,\s*"\w+"|\s*}})', chunk, re.DOTALL)
                            if m:
                                extracted[k] = m.group(1).replace(r'\"', '"').replace(r'\n', '\n')
                        for list_k in ["tags", "suggested_titles", "seo_recommendations", "ideas", "skills"]:
                            m_list = re.search(rf'"{list_k}"\s*:\s*\[(.*?)\]', chunk, re.DOTALL)
                            if m_list:
                                try:
                                    extracted[list_k] = json.loads(f"[{m_list.group(1)}]", strict=False)
                                except Exception:
                                    pass
                        if extracted and (("title" in extracted and "content" in extracted) or "ideas" in extracted or "optimized_title" in extracted):
                            return extracted
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

# ==========================================
# Domain Taxonomy & Fallback Capability Pillars
# ==========================================
PILLAR_AI_RAG = {
    "name": "AI Agent & RAG Architecture",
    "name_business": "AI Workflows & RAG Document Intelligence",
    "icon": "bot",
    "description": "Designing autonomous multi-agent networks, vector embeddings (pgvector/Ollama), and citation-grounded RAG pipelines.",
    "description_business": "Automating repetitive business processes and building AI-powered chat systems with verified document citations.",
    "category": "orchestration",
    "color": "#E10098",
    "level": "Level Max",
    "status": "legendary"
}

PILLAR_PROMPT_ENGINEERING = {
    "name": "Structured Prompting & LLM Tuning",
    "name_business": "AI Prompt Engineering & Context Design",
    "icon": "brain",
    "description": "Architecting prompt templates, context window packing, and guiding complex LLM logical reasoning paths.",
    "description_business": "Designing structured prompts and context flows to optimize AI accuracy and lower API token costs.",
    "category": "orchestration",
    "color": "#FFEB3B",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_AI_ASSISTED = {
    "name": "AI-Assisted Engineering Workflows",
    "name_business": "Rapid Software Delivery & AI Workflows",
    "icon": "sparkles",
    "description": "Accelerating build speed using agentic composer setups, visual prototypes, and automated task execution.",
    "description_business": "Utilizing modern AI build pipelines to ship custom web platforms and tools significantly faster.",
    "category": "orchestration",
    "color": "#00E5FF",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_NEXT_REACT = {
    "name": "Next.js & React App Architecture",
    "name_business": "High-Performance Web Applications",
    "icon": "atom",
    "description": "Building full-stack web applications with Next.js 16 App Router, React 19, Server Components, and optimized rendering.",
    "description_business": "Developing fast, SEO-optimized web applications and portals built on Next.js infrastructure.",
    "category": "logic",
    "color": "#3178C6",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_PYTHON_SYSTEMS = {
    "name": "Python Systems & Async APIs",
    "name_business": "High-Speed Server APIs & Background Workers",
    "icon": "terminal",
    "description": "Developing backend microservices, asynchronous workers, and REST APIs using Python (FastAPI / Flask).",
    "description_business": "Building backend services and API automation layers to power modern web apps.",
    "category": "logic",
    "color": "#3776AB",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_SUPABASE_POSTGRES = {
    "name": "PostgreSQL & Supabase Engineering",
    "name_business": "Secure Cloud Database & Data Storage",
    "icon": "database",
    "description": "Designing relational schemas, Row-Level Security (RLS), pgvector semantic indexing, and Supabase BaaS integrations.",
    "description_business": "Structuring secure databases with automated data access controls and cloud backend hosting.",
    "category": "logic",
    "color": "#3ECF8E",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_TYPESCRIPT = {
    "name": "TypeScript & Type-Safe Architecture",
    "name_business": "Reliable & Maintainable Codebases",
    "icon": "shield",
    "description": "Enforcing strict end-to-end type safety, shared interfaces, and runtime data contract validation across client and server.",
    "description_business": "Writing robust, type-checked web application logic that minimizes software bugs and maintenance costs.",
    "category": "logic",
    "color": "#007ACC",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_API_INTEGRATION = {
    "name": "API & Integration Pipelines",
    "name_business": "System Integrations & Data Streaming",
    "icon": "server",
    "description": "Designing resilient REST endpoints, Server-Sent Events (SSE) streaming, and third-party API orchestration.",
    "description_business": "Connecting third-party business services, payment portals, and real-time live data streams.",
    "category": "logic",
    "color": "#059669",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_FLUTTER = {
    "name": "Flutter & Cross-Platform Mobile",
    "name_business": "Cross-Platform iOS & Android Apps",
    "icon": "smartphone",
    "description": "Architecting compiled mobile applications with Flutter/Dart, Riverpod state management, and declarative routing.",
    "description_business": "Building high-performance native-feeling mobile applications for iOS and Android from a unified codebase.",
    "category": "product",
    "color": "#02569B",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_PRODUCT_UX = {
    "name": "Product Strategy & UX Design",
    "name_business": "Customer Journey & Experience Design",
    "icon": "layout",
    "description": "Defining user flows, functional requirements, and shipping friction-free MVPs aligned with user goals.",
    "description_business": "Designing intuitive user interfaces and user flows that improve customer conversion and retention.",
    "category": "product",
    "color": "#FF1744",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_DESIGN_SYSTEMS = {
    "name": "Design Systems & Web Performance",
    "name_business": "Polished Frontend & Speed Optimization",
    "icon": "paintbrush",
    "description": "Crafting modular CSS systems, Framer Motion transitions, and optimizing Core Web Vitals (LCP, CLS, INP).",
    "description_business": "Improving site loading speeds, visual polish, and responsive layouts across desktop and mobile devices.",
    "category": "product",
    "color": "#FF4081",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_OFFLINE_PRIVACY = {
    "name": "Privacy Sandboxing & Offline Architecture",
    "name_business": "Local Device Privacy & Offline Security",
    "icon": "shield",
    "description": "Designing privacy-first applications operating strictly on local device runtimes with zero external data telemetry.",
    "description_business": "Securing sensitive user data by processing files directly on the user's local device without external servers.",
    "category": "product",
    "color": "#00E676",
    "level": "Level Max",
    "status": "mastered"
}

PILLAR_DATA_SCIENCE = {
    "name": "Data Science & Numerical Modeling",
    "name_business": "Business Intelligence & Data Insights",
    "icon": "bar-chart",
    "description": "Analyzing raw datasets, mathematical space transformations, NumPy/SciPy computation, and analytical modeling.",
    "description_business": "Translating raw operational data into actionable insights, analytical dashboards, and predictive models.",
    "category": "dynamic",
    "color": "#00897B",
    "level": "Active Quest",
    "status": "quest"
}

PILLAR_ADAPTIVE_STACK = {
    "name": "Adaptive Stack & Rapid Prototyping",
    "name_business": "Adaptive Technical Consultation & MVPs",
    "icon": "zap",
    "description": "Rapidly mastering and deploying tools as required to ship end-to-end web apps, internal dashboards, and automation tooling.",
    "description_business": "Providing flexible end-to-end technical execution tailored to your specific project requirements.",
    "category": "dynamic",
    "color": "#FF9100",
    "level": "Legendary",
    "status": "legendary"
}

FALLBACK_SKILLS = {
    # AI / RAG
    "rag": PILLAR_AI_RAG,
    "agent": PILLAR_AI_RAG,
    "agents": PILLAR_AI_RAG,
    "multi-agent": PILLAR_AI_RAG,
    "vector": PILLAR_AI_RAG,
    "embeddings": PILLAR_AI_RAG,
    "pgvector": PILLAR_AI_RAG,
    "ollama": PILLAR_AI_RAG,
    "semantic-search": PILLAR_AI_RAG,
    "retrieval": PILLAR_AI_RAG,
    
    # Prompting / LLM
    "llm": PILLAR_PROMPT_ENGINEERING,
    "prompting": PILLAR_PROMPT_ENGINEERING,
    "prompt-engineering": PILLAR_PROMPT_ENGINEERING,
    "gemini": PILLAR_PROMPT_ENGINEERING,
    "openai": PILLAR_PROMPT_ENGINEERING,
    "claude": PILLAR_PROMPT_ENGINEERING,
    
    # AI Build Workflows
    "cursor": PILLAR_AI_ASSISTED,
    "copilot": PILLAR_AI_ASSISTED,
    "composer": PILLAR_AI_ASSISTED,
    "ai-coding": PILLAR_AI_ASSISTED,
    
    # Next.js / React / Web
    "next.js": PILLAR_NEXT_REACT,
    "nextjs": PILLAR_NEXT_REACT,
    "react": PILLAR_NEXT_REACT,
    "react19": PILLAR_NEXT_REACT,
    "frontend": PILLAR_NEXT_REACT,
    "web-development": PILLAR_NEXT_REACT,
    "web development": PILLAR_NEXT_REACT,
    
    # Python Systems & Async
    "python": PILLAR_PYTHON_SYSTEMS,
    "python3": PILLAR_PYTHON_SYSTEMS,
    "fastapi": PILLAR_PYTHON_SYSTEMS,
    "flask": PILLAR_PYTHON_SYSTEMS,
    "django": PILLAR_PYTHON_SYSTEMS,
    "oop": PILLAR_PYTHON_SYSTEMS,
    "asyncio": PILLAR_PYTHON_SYSTEMS,
    "backend": PILLAR_PYTHON_SYSTEMS,
    
    # Database
    "supabase": PILLAR_SUPABASE_POSTGRES,
    "postgres": PILLAR_SUPABASE_POSTGRES,
    "postgresql": PILLAR_SUPABASE_POSTGRES,
    "sql": PILLAR_SUPABASE_POSTGRES,
    "database": PILLAR_SUPABASE_POSTGRES,
    "relational": PILLAR_SUPABASE_POSTGRES,
    
    # TypeScript
    "typescript": PILLAR_TYPESCRIPT,
    "ts": PILLAR_TYPESCRIPT,
    "type-safety": PILLAR_TYPESCRIPT,
    
    # API & Integrations
    "api": PILLAR_API_INTEGRATION,
    "apis": PILLAR_API_INTEGRATION,
    "rest": PILLAR_API_INTEGRATION,
    "graphql": PILLAR_API_INTEGRATION,
    "sse": PILLAR_API_INTEGRATION,
    "webhooks": PILLAR_API_INTEGRATION,
    "stripe": PILLAR_API_INTEGRATION,
    "razorpay": PILLAR_API_INTEGRATION,
    
    # Mobile
    "flutter": PILLAR_FLUTTER,
    "dart": PILLAR_FLUTTER,
    "mobile": PILLAR_FLUTTER,
    "ios": PILLAR_FLUTTER,
    "android": PILLAR_FLUTTER,
    
    # Product & UX
    "ux": PILLAR_PRODUCT_UX,
    "ui": PILLAR_PRODUCT_UX,
    "product-design": PILLAR_PRODUCT_UX,
    "figma": PILLAR_PRODUCT_UX,
    "wireframing": PILLAR_PRODUCT_UX,
    
    # Design Systems & Performance
    "css": PILLAR_DESIGN_SYSTEMS,
    "css-modules": PILLAR_DESIGN_SYSTEMS,
    "tailwind": PILLAR_DESIGN_SYSTEMS,
    "framer-motion": PILLAR_DESIGN_SYSTEMS,
    "performance": PILLAR_DESIGN_SYSTEMS,
    
    # Security & Offline
    "privacy": PILLAR_OFFLINE_PRIVACY,
    "sandboxing": PILLAR_OFFLINE_PRIVACY,
    "security": PILLAR_OFFLINE_PRIVACY,
    "offline": PILLAR_OFFLINE_PRIVACY,
    "wasm": PILLAR_OFFLINE_PRIVACY,
    
    # Data Science
    "data science": PILLAR_DATA_SCIENCE,
    "data-science": PILLAR_DATA_SCIENCE,
    "data analysis": PILLAR_DATA_SCIENCE,
    "pandas": PILLAR_DATA_SCIENCE,
    "numpy": PILLAR_DATA_SCIENCE,
    "scipy": PILLAR_DATA_SCIENCE,
    "machine learning": PILLAR_DATA_SCIENCE,
    "ml": PILLAR_DATA_SCIENCE,
    "analytics": PILLAR_DATA_SCIENCE,
    
    # Prototyping & Automation
    "automation": PILLAR_ADAPTIVE_STACK,
    "web scraping": PILLAR_ADAPTIVE_STACK,
    "web-scraping": PILLAR_ADAPTIVE_STACK,
    "prototyping": PILLAR_ADAPTIVE_STACK,
    "scripting": PILLAR_ADAPTIVE_STACK,
    "tooling": PILLAR_ADAPTIVE_STACK,
}

def generate_skills_from_tags_batch(tags_list):
    if not tags_list:
        return []
    tags_str = ", ".join([f'"{t}"' for t in tags_list])
    prompt = f"""
    You are a technical portfolio writer. Generate senior-level structured Capability Pillar entries for the following novel technology tags: {tags_str}.
    
    The portfolio groups skills into 4 core architectural pillars:
    - 'orchestration': AI agents, LLMs, RAG, prompt tuning
    - 'logic': fullstack web apps, async backend APIs, databases, TypeScript
    - 'product': mobile apps, UX strategy, CSS/design systems, offline security
    - 'dynamic': data science, analytics, rapid prototyping, adaptive tools

    For each tag, output a structured JSON object matching this format:
    {{
      "tag": "the original lowercase tag name that was passed",
      "name": "Authoritative High-Impact Capability Title (e.g. 'Cloud Infrastructure & DevOps Architecture', 'Blockchain & Smart Contract Engineering')",
      "name_business": "Client Outcome Service Title (e.g. 'Scalable Cloud Infrastructure', 'Decentralized Applications & Smart Contracts')",
      "icon": "A lowercase string representing a relevant Lucide icon (e.g. 'atom', 'server', 'database', 'terminal', 'layout', 'paintbrush', 'sparkles', 'brain', 'bot', 'smartphone', 'shield', 'bar-chart', 'zap', 'cloud', 'cpu', 'code', 'globe', 'lock')",
      "description": "A short 1-sentence senior developer description of the capability. Maximum 20 words.",
      "description_business": "A short 1-sentence client value proposition description. Maximum 20 words.",
      "category": "One of 'orchestration', 'logic', 'product', or 'dynamic'",
      "color": "A hex color code suitable for the technology brand (e.g. '#FF9900')",
      "level": "Level Max",
      "status": "mastered"
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
        print(f"Error generating skills in batch: {e}")
    return []

def check_and_add_pending_skills(tags_list):
    current_skills = parse_skills_file()
    existing_skill_names = {s.get("name", "").strip().lower() for s in current_skills if s.get("name")}
    
    if 'pending_skills' not in st.session_state:
        st.session_state.pending_skills = []
    pending_names = {s.get("name", "").strip().lower() for s in st.session_state.pending_skills if s.get("name")}
    
    import threading
    is_main_thread = (threading.current_thread() is threading.main_thread())
    
    new_tags_for_gemini = []
    for tag in tags_list:
        tag_clean = tag.strip().lower()
        if not tag_clean:
            continue
            
        # 1. Exact match against existing or pending pillar names
        if tag_clean in existing_skill_names or tag_clean in pending_names:
            continue
            
        # 2. Check if the tag matches a known taxonomy pillar in FALLBACK_SKILLS
        if tag_clean in FALLBACK_SKILLS:
            pillar = FALLBACK_SKILLS[tag_clean]
            pillar_name_lower = pillar["name"].lower()
            if pillar_name_lower in existing_skill_names:
                # Already represented by an active capability pillar
                continue
            elif pillar_name_lower in pending_names:
                # Already queued in pending
                continue
            else:
                st.session_state.pending_skills.append(dict(pillar))
                pending_names.add(pillar_name_lower)
                if is_main_thread and st:
                    st.toast(f"💡 Resolved tag '{tag_clean}' to pillar '{pillar['name']}'!")
                continue
                
        # 3. Check if tag matches an existing pillar name using word-boundary regex
        matched_existing = False
        for name in existing_skill_names:
            if re.search(rf'\b{re.escape(tag_clean)}\b', name, re.IGNORECASE):
                matched_existing = True
                break
        if matched_existing:
            continue
            
        for name in pending_names:
            if re.search(rf'\b{re.escape(tag_clean)}\b', name, re.IGNORECASE):
                matched_existing = True
                break
        if matched_existing:
            continue
            
        # 4. If completely unknown novel tag, queue for Gemini batch proposal
        new_tags_for_gemini.append(tag_clean)
        
    if new_tags_for_gemini:
        batch_tags = new_tags_for_gemini[:5]
        if is_main_thread and st:
            st.toast(f"🔍 New novel domain tags: {', '.join(batch_tags)}. Calling Gemini...")
        proposals = generate_skills_from_tags_batch(batch_tags)
        
        if proposals:
            added_count = 0
            for prop in proposals:
                if prop.get("name"):
                    if not prop.get("name_business"):
                        prop["name_business"] = prop["name"]
                    if not prop.get("description_business"):
                        prop["description_business"] = prop.get("description", "")
                    if not prop.get("level"):
                        prop["level"] = "Level Max"
                    if not prop.get("status"):
                        prop["status"] = "mastered"
                    st.session_state.pending_skills.append(prop)
                    pending_names.add(prop["name"].lower())
                    added_count += 1
            if is_main_thread and st:
                st.toast(f"💡 Generated {added_count} capability pillar proposal(s)!")
        else:
            if is_main_thread and st:
                st.warning("⚠️ Gemini key exhausted or limit reached. Generated template proposal.")
            for tag in batch_tags:
                fallback_prop = {
                    "name": f"{tag.capitalize()} & Systems Engineering",
                    "name_business": f"{tag.capitalize()} Development & Solutions",
                    "icon": "sparkles",
                    "description": f"Architecting, implementing, and deploying solutions utilizing {tag}.",
                    "description_business": f"Building reliable applications and solutions with {tag}.",
                    "category": "dynamic",
                    "color": "#00E676",
                    "level": "Level Max",
                    "status": "mastered"
                }
                st.session_state.pending_skills.append(fallback_prop)
                pending_names.add(fallback_prop["name"].lower())

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

def stop_dev_server(port=3000):
    """Terminates any process listening on the given port (e.g. Next.js dev server)."""
    import subprocess
    import signal
    import os
    import time
    
    # 1. Try finding and terminating PIDs on port via lsof
    try:
        res = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True)
        pids = [int(p.strip()) for p in res.stdout.splitlines() if p.strip().isdigit()]
        if pids:
            for pid in pids:
                try:
                    os.kill(pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
            time.sleep(0.3)
            # Send SIGKILL to stubborn remaining processes
            res2 = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True)
            pids2 = [int(p.strip()) for p in res2.stdout.splitlines() if p.strip().isdigit()]
            for pid in pids2:
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            return True, f"Terminated process(es) on port {port}: {pids}"
    except Exception:
        pass

    # 2. Fallback on fuser (Linux)
    try:
        subprocess.run(["fuser", "-k", f"{port}/tcp"], capture_output=True)
        return True, f"Killed process on port {port} via fuser."
    except Exception:
        pass

    # 3. Fallback on pkill for next dev / next-server
    try:
        subprocess.run(["pkill", "-f", "next dev|next-server"], capture_output=True)
    except Exception:
        pass

    return not is_port_active(port), f"Dev server check complete on port {port}"

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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    /* Font overrides */
    html, body, [class*="css"], .stWidgetFormContainer {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }
    
    h1, h2, h3, h4, h5, h6, .section-header {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-weight: 600 !important;
        color: #ffffff !important;
        letter-spacing: -0.02em !important;
    }
    
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Vercel Ultra-Dark Background with subtle dot grid */
    .stApp {
        background-color: #000000 !important;
        background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px) !important;
        background-size: 24px 24px !important;
        background-attachment: fixed !important;
        color: #ededed !important;
    }
    
    /* Hide Streamlit Deploy buttons */
    .stAppDeployButton,
    [data-testid="stAppDeployButton"],
    .stDeployButton,
    [data-testid="stHeaderDeployButton"],
    header button[class*="deploy"],
    header a[href*="share.streamlit.io"],
    header [class*="AppDeployButton"] {
        display: none !important;
    }

    /* Transparent Header Bar */
    header[data-testid="stHeader"],
    header[data-testid="stHeader"] > div,
    header[data-testid="stHeader"] [class*="st-emotion-cache"] {
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    header[data-testid="stHeader"] button,
    header[data-testid="stHeader"] button svg,
    header[data-testid="stHeader"] button svg * {
        color: #888888 !important;
        fill: #888888 !important;
    }

    /* Padding for top container */
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 3rem !important;
        max-width: 1300px !important;
    }
    
    /* Vercel Section Headers */
    .section-header {
        font-size: 1.15rem !important;
        font-weight: 600 !important;
        color: #ffffff !important;
        margin-top: 0.5rem !important;
        margin-bottom: 1.25rem !important;
        border-bottom: 1px solid #222222 !important;
        padding-bottom: 8px !important;
        display: block !important;
        letter-spacing: -0.01em !important;
        text-transform: none !important;
        font-family: 'Inter', sans-serif !important;
    }

    /* Vercel Dark Card Containers */
    div[data-testid="stVerticalBlockBorder"] {
        background: #0a0a0a !important;
        border: 1px solid #222222 !important;
        border-radius: 8px !important;
        padding: 20px !important;
        margin-bottom: 20px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        transition: all 0.2s ease !important;
    }
    div[data-testid="stVerticalBlockBorder"]:hover {
        border-color: #333333 !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
    }

    /* Vercel Expanders */
    details[data-testid="stExpander"] {
        background: #0a0a0a !important;
        border: 1px solid #222222 !important;
        border-radius: 8px !important;
        margin-bottom: 12px !important;
        box-shadow: none !important;
        transition: all 0.15s ease !important;
    }
    details[data-testid="stExpander"]:hover {
        border-color: #333333 !important;
        background: #111111 !important;
    }
    summary[data-testid="stExpanderSummary"] {
        font-weight: 500 !important;
        color: #ffffff !important;
        font-family: 'Inter', sans-serif !important;
    }

    /* Vercel High-Contrast Buttons */
    button[data-testid="baseButton-primary"] {
        background: #ffffff !important;
        color: #000000 !important;
        font-weight: 600 !important;
        font-family: 'Inter', sans-serif !important;
        text-transform: none !important;
        letter-spacing: -0.01em !important;
        border: 1px solid #ffffff !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.15s ease !important;
        padding: 0.4rem 1.2rem !important;
    }
    button[data-testid="baseButton-primary"]:hover {
        background: #e6e6e6 !important;
        border-color: #e6e6e6 !important;
        color: #000000 !important;
        transform: none !important;
    }
    button[data-testid="baseButton-primary"]:active {
        background: #cccccc !important;
    }

    button[data-testid="baseButton-secondary"] {
        background: #111111 !important;
        color: #ededed !important;
        font-weight: 500 !important;
        font-family: 'Inter', sans-serif !important;
        border: 1px solid #222222 !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
        transition: all 0.15s ease !important;
    }
    button[data-testid="baseButton-secondary"]:hover {
        background: #1f1f1f !important;
        border-color: #333333 !important;
        color: #ffffff !important;
        transform: none !important;
    }

    /* Danger delete buttons */
    button[id^="del_exp_"]:hover, button[id^="del_edu_"]:hover, button[id^="rem_bul_"]:hover, button[id^="delete_"]:hover {
        border-color: #5c1d24 !important;
        color: #f87171 !important;
        background-color: #1f1213 !important;
    }

    /* Vercel Dark Inputs */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea, .stSelectbox>div>div>div {
        background-color: #0d0d0d !important;
        color: #ffffff !important;
        border: 1px solid #222222 !important;
        border-radius: 6px !important;
        transition: all 0.15s ease !important;
        font-family: 'Inter', sans-serif !important;
        font-weight: 400 !important;
        font-size: 0.9rem !important;
    }
    .stTextInput>div>div>input:focus, .stTextArea>div>div>textarea:focus {
        border-color: #0070f3 !important;
        box-shadow: 0 0 0 1px #0070f3 !important;
        background-color: #111111 !important;
    }
    
    /* Vercel Form Labels */
    label[data-testid="stWidgetLabel"] p {
        color: #a1a1aa !important;
        font-weight: 500 !important;
        font-size: 0.82rem !important;
        font-family: 'Inter', sans-serif !important;
    }

    /* Vercel Sidebar Dark Panel */
    section[data-testid="stSidebar"] {
        background-color: #0a0a0a !important;
        border-right: 1px solid #1f1f1f !important;
    }
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] li, section[data-testid="stSidebar"] span {
        color: #a1a1aa !important;
    }
    section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] h3 {
        color: #ffffff !important;
        font-family: 'Inter', sans-serif !important;
        font-weight: 600 !important;
    }
    section[data-testid="stSidebar"] .stButton>button {
        background: #111111 !important;
        color: #ededed !important;
        border: 1px solid #222222 !important;
        border-radius: 6px !important;
        font-weight: 500 !important;
    }
    section[data-testid="stSidebar"] .stButton>button:hover {
        background: #1f1f1f !important;
        border-color: #333333 !important;
        color: #ffffff !important;
    }

    /* Vercel Left Vertical Navigation Sidebar Menu */
    div[data-testid="stRadio"] div[role="radiogroup"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 3px !important;
    }
    div[data-testid="stRadio"] div[role="radiogroup"] > label {
        background: transparent !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
        color: #888888 !important;
        font-size: 0.85rem !important;
        font-weight: 500 !important;
        line-height: 1.35 !important;
        border: 1px solid transparent !important;
        transition: all 0.15s ease !important;
        cursor: pointer !important;
        margin: 0 !important;
        width: 100% !important;
    }
    div[data-testid="stRadio"] div[role="radiogroup"] > label:hover {
        background: #141414 !important;
        color: #ededed !important;
    }
    div[data-testid="stRadio"] div[role="radiogroup"] > label[data-checked="true"],
    div[data-testid="stRadio"] div[role="radiogroup"] > label:has(input:checked) {
        background: #1f1f1f !important;
        color: #ffffff !important;
        border-color: #333333 !important;
        font-weight: 600 !important;
    }
    div[data-testid="stRadio"] div[role="radiogroup"] > label > div:first-child {
        display: none !important;
    }

    /* Vercel Dark Callouts & Alert Boxes */
    div[data-testid="stAlert"], div[role="alert"] {
        background-color: #0d0d0d !important;
        border: 1px solid #222222 !important;
        border-radius: 6px !important;
        color: #ededed !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    }
    div[data-testid="stAlert"] * {
        color: #ededed !important;
    }

    /* Custom Slim Vercel Scrollbars */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: #000000;
    }
    ::-webkit-scrollbar-thumb {
        background: #222222;
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #333333;
    }

    /* Vercel Telemetry Metric Cards */
    .telemetry-card {
        border: 1px solid #222222;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        background: #0a0a0a;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: left;
        transition: all 0.15s ease;
    }
    .telemetry-card:hover {
        border-color: #333333;
        background: #111111;
    }
    .telemetry-card-val {
        font-size: 2rem;
        font-weight: 700;
        color: #ffffff;
        font-family: 'Inter', sans-serif !important;
        margin-bottom: 4px;
        letter-spacing: -0.03em;
    }
    .telemetry-card-lbl {
        font-size: 0.72rem;
        font-weight: 600;
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-family: 'Inter', sans-serif !important;
    }

    /* Custom progress bar graphs */
    .bar-container {
        margin-bottom: 12px;
    }
    .bar-label-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 0.8rem;
        font-family: 'Inter', sans-serif !important;
        font-weight: 500;
    }
    .bar-label {
        color: #ededed;
    }
    .bar-count {
        color: #888888;
    }
    .bar-track {
        background-color: #141414;
        border: 1px solid #222222;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
    }
    .bar-fill {
        height: 100%;
        background-color: #0070f3;
        border-radius: 4px;
    }

    /* Skill capsules visual preview styling */
    .skill-capsule-preview {
        display: inline-flex;
        align-items: center;
        padding: 3px 10px;
        border: 1px solid #222222;
        border-radius: 20px;
        background: #0d0d0d;
        font-family: 'Inter', sans-serif !important;
        font-weight: 500;
        font-size: 0.8rem;
        color: #ededed;
        margin-right: 6px;
        margin-bottom: 6px;
        transition: all 0.15s ease;
    }
    .skill-capsule-preview:hover {
        border-color: #333333;
        background: #171717;
    }
    .skill-capsule-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 6px;
        background-color: #10b981;
    }

    /* Status badge */
    .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        text-transform: uppercase;
        border: 1px solid #222222;
    }
    .status-badge-bot {
        background-color: rgba(239, 68, 68, 0.1) !important;
        color: #f87171 !important;
        border-color: rgba(239, 68, 68, 0.25) !important;
    }
    .status-badge-user {
        background-color: rgba(0, 112, 243, 0.1) !important;
        color: #38bdf8 !important;
        border-color: rgba(0, 112, 243, 0.25) !important;
    }
</style>
""", unsafe_allow_html=True)

