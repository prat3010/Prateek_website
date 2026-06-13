#!/usr/bin/env python3
import os
import sys
import re
import json
import base64
import shutil
import urllib.request
import urllib.parse
from datetime import datetime

# Import Streamlit - will fail gracefully if not installed
try:
    import streamlit as st
except ImportError:
    print("Error: Streamlit is not installed. Run 'pip install streamlit' to run this manager.")
    sys.exit(1)

st.set_page_config(
    page_title="Resume & Portfolio Manager",
    page_icon="💼",
    layout="wide",
)

# ==========================================
# Env Loader & API Helpers
# ==========================================
def load_env():
    env_vars = {}
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

# Helper to send API request to Gemini
def call_gemini(prompt, file_data=None, file_mime=None):
    if not GEMINI_API_KEY:
        st.error("Missing GEMINI_API_KEY in .env.local. Please add your key first.")
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
        with urllib.request.urlopen(req) as res:
            response_data = json.loads(res.read().decode("utf-8"))
            candidates = response_data.get("candidates", [])
            if candidates:
                text_content = candidates[0]["content"]["parts"][0]["text"]
                return json.loads(text_content.strip())
            else:
                st.error("Error: Empty candidates response from Gemini")
                return None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        st.error(f"Gemini API Error {e.code}: {e.reason}")
        st.code(err_msg, language="json")
        return None
    except Exception as e:
        st.error(f"API Connection Error: {e}")
        return None

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
        "description": "Instructing AI to spin up robust backends, serialize data models, and deploy endpoints.",
        "category": "logic",
        "color": "#059669"
    },
    "react": {
        "name": "React / Next.js",
        "icon": "atom",
        "description": "Directing AI to synthesize React components, manage application state, and orchestrate client/server code.",
        "category": "dynamic",
        "color": "#61DAFB"
    },
    "python": {
        "name": "Python",
        "icon": "terminal",
        "description": "Instructing AI to write utility scripts, automation tasks, and backend helper scripts.",
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
        "description": "Directing AI to synthesize React components, manage application state, and orchestrate client/server code.",
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
    You are an expert AI orchestrator. Generate a list of structured Skill entries for the following technology tags: {tags_str}.
    
    For each tag, output a structured JSON object. The response must be a JSON array of objects, where each object matches this format:
    {{
      "tag": "the original lowercase tag name that was passed",
      "name": "Formatted capitalization of the technology (e.g. 'react' -> 'React / Next.js', 'fastapi' -> 'FastAPI', 'excel' -> 'Microsoft Excel', 'supabase' -> 'Supabase', etc.)",
      "icon": "A lowercase string representing a relevant Lucide icon (e.g. 'atom', 'server', 'database', 'terminal', 'layout', 'paintbrush', 'sparkles', 'brain', 'bot', 'git-branch', 'cloud', 'figma', 'zap', 'image', 'file-text')",
      "description": "A short 1-sentence description of the skill in an AI-orchestrated tone matching the portfolio brand (e.g., 'Directing AI to synthesize React components...', 'Steering AI to generate responsive structures...', 'Instructing AI to write Python utility scripts...'). Maximum 15 words.",
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
                        "description": f"Applying {tag} capabilities to implement robust project requirements.",
                        "category": "dynamic",
                        "color": "#00E676"
                    }
                    st.session_state.pending_skills.append(fallback_prop)

# ==========================================
# TS Data Parsers (Projects, Resume, Certs)
# ==========================================

# Parse projects.ts
def parse_projects_file():
    path = "src/data/projects.ts"
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        content = f.read()
    
    match = re.search(r'export const projects:\s*Project\[\]\s*=\s*\[(.*)\];?', content, re.DOTALL)
    if not match:
        return []
    array_content = match.group(1).strip()
    
    blocks = []
    depth = 0
    start = -1
    for i, char in enumerate(array_content):
        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start != -1:
                blocks.append(array_content[start:i+1])
                start = -1
                
    projects = []
    for block in blocks:
        project = {}
        id_match = re.search(r'id:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        title_match = re.search(r'title:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        desc_match = re.search(r'description:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block, re.DOTALL)
        long_desc_match = re.search(r'longDescription:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block, re.DOTALL)
        image_match = re.search(r'image:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        live_url_match = re.search(r'liveUrl:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        github_url_match = re.search(r'githubUrl:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        color_match = re.search(r'color:\s*[\'"]((?:[^\'"\\]|\\.)*)[\'"]', block)
        is_live_match = re.search(r'isLive:\s*(true|false)', block)
        tags_match = re.search(r'tags:\s*\[(.*?)\]', block, re.DOTALL)
        
        if id_match: project['id'] = id_match.group(1)
        if title_match: project['title'] = title_match.group(1)
        if desc_match: project['description'] = desc_match.group(1).replace('\n', ' ').strip()
        if long_desc_match: project['longDescription'] = long_desc_match.group(1).replace("\\'", "'").replace('\n', ' ').strip()
        if image_match: project['image'] = image_match.group(1)
        if live_url_match: project['liveUrl'] = live_url_match.group(1)
        if github_url_match: project['githubUrl'] = github_url_match.group(1)
        if color_match: project['color'] = color_match.group(1)
        if is_live_match: project['isLive'] = is_live_match.group(1) == 'true'
        
        if tags_match:
            tags_str = tags_match.group(1)
            project['tags'] = re.findall(r'[\'"](.*?)[\'"]', tags_str)
            
        projects.append(project)
    return projects

def write_projects_file(projects):
    path = "src/data/projects.ts"
    projects_str = "[\n"
    for p in projects:
        escaped_long_desc = p.get('longDescription', '').replace("'", "\\'")
        escaped_desc = p.get('description', '').replace("'", "\\'")
        tags_str = ", ".join([f"'{t}'" for t in p.get('tags', [])])
        
        projects_str += f"""  {{
    id: '{p.get('id', '')}',
    title: '{p.get('title', '').replace("'", "\\'")}',
    description: '{escaped_desc}',
    longDescription: '{escaped_long_desc}',
    image: '{p.get('image', '')}',
    tags: [{tags_str}],
    liveUrl: '{p.get('liveUrl', '')}',
    githubUrl: '{p.get('githubUrl', '')}',
    color: '{p.get('color', '#00E676')}',
    isLive: {str(p.get('isLive', False)).lower()},
  }},\n"""
    projects_str += "]"

    content = f"""export interface Project {{
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  color: string;
  isLive: boolean;
}}

export const projects: Project[] = {projects_str};
"""
    with open(path, "w") as f:
        f.write(content)

# Parse resume.ts
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
                
    def parse_primitive():
        nonlocal idx
        start = idx
        while idx < length:
            c = js_str[idx]
            if c.isspace() or c in [',', ']', '}', ':']:
                break
            idx += 1
        val_str = js_str[start:idx].strip()
        if val_str == 'true':
            return True
        elif val_str == 'false':
            return False
        elif val_str == 'null':
            return None
        try:
            if '.' in val_str:
                return float(val_str)
            return int(val_str)
        except ValueError:
            return val_str
            
    return parse_value()

# Parse resume.ts
def parse_resume_file():
    path = "src/data/resume.ts"
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        content = f.read()

    obj_str = extract_literal(content, "export const resumeData: ResumeData =")
    if not obj_str:
        return None
    try:
        return parse_js_object(obj_str)
    except Exception as e:
        st.error(f"Failed to parse resume.ts: {e}")
        return None

# Parse skills.ts
def parse_skills_file():
    path = "src/data/skills.ts"
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        content = f.read()

    obj_str = extract_literal(content, "export const skills: Skill[] =")
    if not obj_str:
        return []
    try:
        return parse_js_object(obj_str)
    except Exception as e:
        st.error(f"Failed to parse skills.ts: {e}")
        return []

# Write skills.ts
def write_skills_file(skills_list):
    path = "src/data/skills.ts"
    with open(path, "r") as f:
        content = f.read()

    def esc(s):
        if s is None:
            return ""
        return str(s).replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

    skills_str = "[\n"
    for s in skills_list:
        skills_str += f"""  {{
    name: "{esc(s.get('name', ''))}",
    icon: "{esc(s.get('icon', 'sparkles'))}",
    description: "{esc(s.get('description', ''))}",
    category: "{esc(s.get('category', 'dynamic'))}",
    color: "{esc(s.get('color', '#00E676'))}","""
        if 'level' in s and s['level']:
            skills_str += f"""\n    level: "{esc(s['level'])}","""
        if 'prereq' in s and s['prereq']:
            skills_str += f"""\n    prereq: "{esc(s['prereq'])}","""
        if 'status' in s and s['status']:
            skills_str += f"""\n    status: "{esc(s['status'])}","""
        if 'projects' in s and s['projects']:
            proj_list = s['projects']
            proj_str = ", ".join([f'{{ title: "{esc(p.get("title", ""))}", id: "{esc(p.get("id", ""))}" }}' for p in proj_list])
            skills_str += f"""\n    projects: [{proj_str}],"""
        skills_str += "\n  },\n"
    skills_str += "]"

    lit_str = extract_literal(content, "export const skills: Skill[] =")
    if not lit_str:
        raise ValueError("Skills array literal not found in skills.ts")

    new_content = content.replace(lit_str, skills_str, 1)
    with open(path, "w") as f:
        f.write(new_content)

def write_resume_file(resume):
    path = "src/data/resume.ts"
    
    def esc(s):
        if s is None:
            return ""
        return str(s).replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')

    experience_str = "[\n"
    for exp in resume.get('experience', []):
        bullets_str = "[\n"
        for b in exp.get('bullets', []):
            bullets_str += f"""        {{
          general: "{esc(b.get('general', ''))}",
          fullstack: "{esc(b.get('fullstack', ''))}",
          ai: "{esc(b.get('ai', ''))}",
          creative: "{esc(b.get('creative', ''))}",
        }},\n"""
        bullets_str += "      ]"
        
        tags_str = ", ".join([f'"{esc(t)}"' for t in exp.get('tags', [])])
        experience_str += f"""    {{
      id: "{esc(exp.get('id', ''))}",
      company: "{esc(exp.get('company', ''))}",
      role: "{esc(exp.get('role', ''))}",
      period: "{esc(exp.get('period', ''))}",
      location: "{esc(exp.get('location', ''))}",
      bullets: {bullets_str},
      tags: [{tags_str}]
    }},\n"""
    experience_str += "  ]"

    education_str = "[\n"
    for edu in resume.get('education', []):
        education_str += f"""    {{
      school: "{esc(edu.get('school', ''))}",
      degree: "{esc(edu.get('degree', ''))}",
      period: "{esc(edu.get('period', ''))}",
      location: "{esc(edu.get('location', ''))}"
    }},\n"""
    education_str += "  ]"

    summary = resume.get('summary', {})
    last_synced = resume.get('lastSynced', {}) or {}

    content = f"""export interface WorkExperience {{
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: {{
    general: string;
    fullstack?: string;
    ai?: string;
    creative?: string;
  }}[];
  tags: string[];
}}

export interface Education {{
  school: string;
  degree: string;
  period: string;
  location: string;
}}

export interface ResumeData {{
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  summary: {{
    general: string;
    fullstack: string;
    ai: string;
    creative: string;
  }};
  experience: WorkExperience[];
  education: Education[];
  lastSynced?: {{
    timestamp: string;
    status: 'success' | 'failed';
    summary: string;
  }};
}}

export const resumeData: ResumeData = {{
  name: "{esc(resume.get('name', 'Prateek Sharma'))}",
  title: "{esc(resume.get('title', ''))}",
  email: "{esc(resume.get('email', ''))}",
  phone: "{esc(resume.get('phone', ''))}",
  website: "{esc(resume.get('website', ''))}",
  github: "{esc(resume.get('github', ''))}",
  linkedin: "{esc(resume.get('linkedin', ''))}",
  summary: {{
    general: "{esc(summary.get('general', ''))}",
    fullstack: "{esc(summary.get('fullstack', ''))}",
    ai: "{esc(summary.get('ai', ''))}",
    creative: "{esc(summary.get('creative', ''))}",
  }},
  experience: {experience_str},
  education: {education_str},
  lastSynced: {{
    timestamp: "{esc(last_synced.get('timestamp', ''))}",
    status: "{esc(last_synced.get('status', 'success'))}",
    summary: "{esc(last_synced.get('summary', ''))}",
  }}
}};
"""
    with open(path, "w") as f:
        f.write(content)

# Parse certificates
def parse_certificates_file():
    path = "src/data/certificates.ts"
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        content = f.read()
    
    match = re.search(r'export const certificates: Certificate\[\] = (\[.*\]);', content, re.DOTALL)
    if not match:
        return []
    try:
        return json.loads(match.group(1))
    except:
        return []

def write_certificates_file(certificates):
    path = "src/data/certificates.ts"
    certs_json = json.dumps(certificates, indent=2)
    content = f"""export interface Certificate {{
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  verifyUrl?: string;
  image?: string;
  tags: string[];
}}

export const certificates: Certificate[] = {certs_json};
"""
    with open(path, "w") as f:
        f.write(content)

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

# ==========================================
# Streamlit Interface Layout
# ==========================================

# Custom CSS for Premium UI Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
    
    /* Font overrides */
    html, body, [class*="css"], .stWidgetFormContainer {
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    
    h1, h2, h3, h4, h5, h6, .section-header {
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Core Page Styling */
    .stApp {
        background-color: #000000 !important;
        color: #ffffff !important;
    }
    
    /* Section Headers */
    .section-header {
        font-size: 1.6rem;
        font-weight: 900;
        color: #ffffff;
        margin-top: 0.5rem;
        margin-bottom: 1.2rem;
        border-bottom: 2px solid #ffffff;
        padding-bottom: 5px;
        display: inline-block;
        letter-spacing: 0.5px;
    }

    /* Target bordered containers in Streamlit */
    div[data-testid="stVerticalBlockBorder"] {
        background-color: #000000 !important;
        border: 2px solid #ffffff !important;
        border-radius: 6px !important;
        padding: 24px !important;
        margin-bottom: 24px !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
    }
    div[data-testid="stVerticalBlockBorder"]:hover {
        border-color: #ffffff !important;
    }

    /* Target expanders */
    details[data-testid="stExpander"] {
        background-color: #000000 !important;
        border: 1.5px solid #ffffff !important;
        border-radius: 4px !important;
        margin-bottom: 12px !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
    }
    details[data-testid="stExpander"]:hover {
        border-color: #ffffff !important;
    }
    summary[data-testid="stExpanderSummary"] {
        font-weight: 700 !important;
        color: #ffffff !important;
    }

    /* Buttons styling */
    button[data-testid="baseButton-primary"] {
        background-color: #ffffff !important;
        color: #000000 !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        border: 2px solid #ffffff !important;
        border-radius: 4px !important;
        box-shadow: none !important;
        transition: all 0.1s ease !important;
        padding: 0.5rem 1.5rem !important;
    }
    button[data-testid="baseButton-primary"]:hover {
        background-color: #cccccc !important;
        color: #000000 !important;
        border-color: #cccccc !important;
    }
    button[data-testid="baseButton-primary"]:active {
        transform: translate(1px, 1px) !important;
    }

    button[data-testid="baseButton-secondary"] {
        background-color: #000000 !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        border: 2px solid #ffffff !important;
        border-radius: 4px !important;
        box-shadow: none !important;
        transition: all 0.1s ease !important;
    }
    button[data-testid="baseButton-secondary"]:hover {
        background-color: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
    }
    button[data-testid="baseButton-secondary"]:active {
        transform: translate(1px, 1px) !important;
    }

    /* Danger hover styles for delete buttons */
    button[id^="del_exp_"]:hover, button[id^="del_edu_"]:hover, button[id^="rem_bul_"]:hover, button[id^="delete_"]:hover {
        border-color: #ff3b30 !important;
        color: #ff3b30 !important;
        background-color: #000000 !important;
    }

    /* Inputs */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea, .stSelectbox>div>div>div {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: 2px solid #ffffff !important;
        border-radius: 4px !important;
        transition: border-color 0.2s !important;
    }
    .stTextInput>div>div>input:focus, .stTextArea>div>div>textarea:focus {
        border-color: #ffffff !important;
        box-shadow: 0 0 0 1px #ffffff !important;
    }
    
    /* Labels and small text */
    label[data-testid="stWidgetLabel"] p {
        color: #ffffff !important;
        font-weight: 700 !important;
    }

    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #000000 !important;
        border-right: 2px solid #ffffff !important;
    }
    section[data-testid="stSidebar"] p, section[data-testid="stSidebar"] li, section[data-testid="stSidebar"] span {
        color: #ffffff !important;
    }
    section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] h2, section[data-testid="stSidebar"] h3 {
        color: #ffffff !important;
        font-family: 'Playfair Display', serif !important;
        font-weight: 800 !important;
    }
    section[data-testid="stSidebar"] .stButton>button {
        background-color: #000000 !important;
        color: #ffffff !important;
        border: 2px solid #ffffff !important;
    }
    section[data-testid="stSidebar"] .stButton>button:hover {
        background-color: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
    }

    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 12px !important;
        background-color: #000000 !important;
        padding: 8px !important;
        border-radius: 6px !important;
        border: 2px solid #ffffff !important;
        margin-bottom: 24px !important;
    }
    .stTabs [data-baseweb="tab"] {
        height: 44px !important;
        border-radius: 4px !important;
        background-color: transparent !important;
        color: #888888 !important;
        font-family: 'Space Grotesk', sans-serif !important;
        font-weight: 700 !important;
        padding: 0px 16px !important;
        transition: all 0.2s !important;
    }
    .stTabs [data-baseweb="tab"]:hover {
        color: #ffffff !important;
        background-color: #1c1c1c !important;
    }
    .stTabs [aria-selected="true"] {
        background-color: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
    }

    /* Scrollbar override */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    ::-webkit-scrollbar-track {
        background: #000000;
    }
    ::-webkit-scrollbar-thumb {
        background: #ffffff;
        border-radius: 4px;
        border: 2px solid #000000;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #cccccc;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.markdown("""
<div style="background-color: #000000; border: 2.5px solid #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center; box-shadow: 4px 4px 0px 0px #ffffff;">
    <div style="width: 80px; height: 80px; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center;">
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
    <h3 style="color: #ffffff; margin: 0; font-family: 'Space Grotesk', sans-serif; font-weight: 950; font-size: 1.3rem; letter-spacing: 0.5px; text-transform: uppercase;">PRATEEK SYNC</h3>
    <span style="display: block; color: #8A8A93; font-size: 0.75rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; margin-top: 4px;">ORCHESTRATION CLIENT</span>
    <code style="display: inline-block; background-color: #121212; color: #ffffff; border: 1.5px solid #ffffff; border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: bold; margin-top: 10px; font-family: 'JetBrains Mono', monospace;">v1.3.0 // ACTIVE</code>
</div>
""", unsafe_allow_html=True)

st.sidebar.markdown("### Control Panel Operations")
st.sidebar.markdown("""
This local portal lets you:
*   **Edit Resume** details manually
*   **Sync Projects** from local folders or GitHub
*   **Sync Certificates** from raw scanned files
*   **Write & Publish Blog Posts** using Gemini co-pilot
""")

if GEMINI_API_KEY:
    st.sidebar.success("Gemini API Key loaded from .env.local")
else:
    st.sidebar.error("GEMINI_API_KEY not found in .env.local")

# Manual button to scan for missing skills
if st.sidebar.button("Scan for Missing Skills", use_container_width=True):
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
    
    with st.sidebar.container(border=True):
        st.markdown(f"**Suggested Tag:** `{skill.get('name')}`")
        name = st.text_input("Name", value=skill.get('name'), key="pend_name")
        icon = st.text_input("Icon (Lucide)", value=skill.get('icon', 'sparkles'), key="pend_icon")
        desc = st.text_area("Description", value=skill.get('description', ''), key="pend_desc")
        
        categories_opts = ['orchestration', 'logic', 'product', 'dynamic']
        default_cat = skill.get('category', 'dynamic')
        if default_cat not in categories_opts:
            default_cat = 'dynamic'
        category = st.selectbox("Category", options=categories_opts, index=categories_opts.index(default_cat), key="pend_cat")
        
        color = st.text_input("Hex Color", value=skill.get('color', '#00E676'), key="pend_color")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Approve", key="approve_skill_btn", type="primary"):
                current_skills = parse_skills_file()
                if any(s.get("name", "").lower() == name.lower() for s in current_skills):
                    st.sidebar.error("Skill already exists!")
                else:
                    new_skill = {
                        "name": name,
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
                        st.rerun()
                    except Exception as e:
                        st.sidebar.error(f"Failed to save: {e}")
        with col2:
            if st.button("Dismiss", key="dismiss_skill_btn", type="secondary"):
                st.session_state.pending_skills.pop(0)
                st.rerun()

# Custom Title Header
st.markdown("""
<div style="text-align: center; padding: 30px 20px; margin-bottom: 35px; background-color: #000000; border-radius: 8px; border: 2.5px solid #ffffff;">
    <h1 style="color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-weight: 950; margin: 0; font-size: 2.5rem; letter-spacing: 0.5px; text-transform: uppercase;">PRATEEK CONTROL PORTAL</h1>
    <p style="color: #ffffff; margin: 8px 0 0 0; font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 0.85rem; letter-spacing: 0.2px; text-transform: uppercase; opacity: 0.90;">SYSTEM_STATUS: ONLINE  |  LOCAL RESUME & PORTFOLIO ENGINE</p>
</div>
""", unsafe_allow_html=True)

# Load static data in session state so edits aren't lost on rerun
if 'resume' not in st.session_state:
    st.session_state.resume = parse_resume_file()
if 'projects' not in st.session_state:
    st.session_state.projects = parse_projects_file()
if 'certificates' not in st.session_state:
    st.session_state.certificates = parse_certificates_file()
if 'pending_skills' not in st.session_state:
    st.session_state.pending_skills = []


# Set up tabs
tab_edit, tab_project, tab_cert, tab_blog = st.tabs([
    "Edit Resume Manually", 
    "Sync Projects", 
    "Sync Certificates",
    "Blog Editor"
])

# ──────────────────────────────────────────
# TAB 1: RESUME EDITOR
# ──────────────────────────────────────────
with tab_edit:
    if st.session_state.resume is None:
        st.error("Could not load resume.ts. Please verify the file is present.")
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

        # 2. Summaries section
        with st.container(border=True):
            st.markdown('<div class="section-header">Persona Summaries</div>', unsafe_allow_html=True)
            st.info("Write a different bio description tailored for each engineering archetype.")
            summ = res.get('summary', {})
            res['summary']['general'] = st.text_area("General Summary", summ.get('general', ''), height=100)
            res['summary']['fullstack'] = st.text_area("Full-Stack Summary", summ.get('fullstack', ''), height=100)
            res['summary']['ai'] = st.text_area("AI Orchestration Summary", summ.get('ai', ''), height=100)
            res['summary']['creative'] = st.text_area("Creative Designer Summary", summ.get('creative', ''), height=100)

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
                        col_b1, col_b2 = st.columns(2)
                        with col_b1:
                            bullet['general'] = st.text_area("General Description", bullet.get('general', ''), key=f"bul_g_{exp_idx}_{b_idx}", height=75)
                            bullet['fullstack'] = st.text_area("Full-Stack Description", bullet.get('fullstack', ''), key=f"bul_f_{exp_idx}_{b_idx}", height=75)
                        with col_b2:
                            bullet['ai'] = st.text_area("AI/Agent Description", bullet.get('ai', ''), key=f"bul_a_{exp_idx}_{b_idx}", height=75)
                            bullet['creative'] = st.text_area("Creative/Animation Description", bullet.get('creative', ''), key=f"bul_c_{exp_idx}_{b_idx}", height=75)
                        
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

        # Save Button
        st.markdown("---")
        if st.button("Save Resume Changes", type="primary", use_container_width=True):
            try:
                write_resume_file(res)
                st.success("Resume updated and saved successfully directly in src/data/resume.ts!")
            except Exception as e:
                st.error(f"Failed to write file: {e}")

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

        dry_run_proj = st.checkbox("Dry-Run Mode (Review AI generation without saving)", value=True)

        if st.button("Sync Project Now", type="primary"):
            if not proj_input:
                st.error("Please provide a path or repository link.")
            else:
                readme_content = ""
                package_content = ""
                git_logs = ""
                
                with st.status("Gathering repository artifacts...", expanded=True) as status:
                    if project_mode == "Local Directory":
                        project_path = os.path.abspath(proj_input)
                        st.write(f"📂 Scanning local directory: {project_path}")
                        
                        if not os.path.isdir(project_path):
                            st.error(f"Path '{project_path}' is not a valid directory.")
                            status.update(label="Scanning failed", state="error")
                        else:
                            readme_path = os.path.join(project_path, "README.md")
                            if os.path.exists(readme_path):
                                with open(readme_path, "r") as f:
                                    readme_content = f.read()[:6000]
                                    
                            package_path = os.path.join(project_path, "package.json")
                            if os.path.exists(package_path):
                                with open(package_path, "r") as f:
                                    package_content = f.read()
                                    
                            git_dir = os.path.join(project_path, ".git")
                            if os.path.exists(git_dir):
                                import subprocess
                                try:
                                    git_logs = subprocess.check_output(
                                        ["git", "log", "-n", "5", "--oneline"],
                                        cwd=project_path
                                    ).decode("utf-8")
                                except:
                                    pass
                    else:
                        repo = proj_input.strip()
                        if "/" not in repo:
                            repo = f"prat3010/{repo}"
                        
                        st.write(f"🌐 Querying GitHub REST API for: {repo}")
                        
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
                    
                    # Check contents
                    if not readme_content and not package_content:
                        st.warning("Empty repository metadata gathered. Will submit minimal details to Gemini.")
                    
                    st.write("🤖 Transmitting codebase properties to Gemini API...")
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
                    if project_data:
                        status.update(label="Synchronization parsed!", state="complete")
                        st.success("✅ Success! Gemini generated the entry structure.")
                        
                        st.markdown("### AI-Generated Showcase Entry Preview")
                        st.json(project_data)
                        
                        if not dry_run_proj:
                            project_id = re.sub(r'[^a-zA-Z0-9]', '-', project_data['title'].lower())
                            current_projects = parse_projects_file()
                            
                            # Remove existing project with same ID if any
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
                                "isLive": False
                            }
                            
                            current_projects.append(new_project)
                            write_projects_file(current_projects)
                            st.session_state.projects = current_projects
                            check_and_add_pending_skills(project_data["tags"])
                            
                            # Append resume bullet
                            resume = parse_resume_file()
                            if resume:
                                for exp in resume.get('experience', []):
                                    if exp['id'] == 'freelance-developer':
                                        exp['bullets'].append({
                                            "general": project_data['resumeBullet']['general'],
                                            "fullstack": project_data['resumeBullet'].get('fullstack', ''),
                                            "ai": project_data['resumeBullet'].get('ai', ''),
                                            "creative": project_data['resumeBullet'].get('creative', '')
                                        })
                                        for tag in project_data['tags']:
                                            if tag not in exp['tags']:
                                                exp['tags'].append(tag)
                                
                                resume['lastSynced'] = {
                                    "timestamp": datetime.now().isoformat(),
                                    "status": "success",
                                    "summary": f"Synchronized new project: {new_project['title']}."
                                }
                                write_resume_file(resume)
                                st.session_state.resume = resume
                                
                            st.success(f"Saved entry. Added to projects.ts and experience bullets in resume.ts!")
                    else:
                        status.update(label="API Sync call failed", state="error")

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

            dry_run_cert = st.checkbox("Dry-Run Mode (Examine parsing without saving)", value=True, key="dry_cert")

            if st.button("Sync Certificates Now", type="primary"):
                current_certs = parse_certificates_file()
                sync_logs = []
                updated = False
                
                with st.status("Processing certificate uploads...", expanded=True) as status:
                    for cert_file in raw_certs:
                        filepath = os.path.join(raw_cert_dir, cert_file)
                        mime = get_mime_type(cert_file)
                        
                        st.write(f"🔍 OCR Parsing certificate: `{cert_file}`")
                        
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
                        if cert_data:
                            st.write(f"✅ Extracted: **{cert_data['title']}** from *{cert_data['issuer']}*")
                            
                            safe_title = re.sub(r'[^a-zA-Z0-9]', '-', cert_data['title'].lower())
                            cert_id = f"{safe_title}-{datetime.now().strftime('%M%S')}"
                            
                            dest_filename = f"{cert_id}{os.path.splitext(cert_file)[1]}"
                            dest_filepath = os.path.join(public_cert_dir, dest_filename)
                            
                            if not dry_run_cert:
                                # Move from raw to public
                                shutil.move(filepath, dest_filepath)
                                
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
                                
                                current_certs.append(new_cert)
                                updated = True
                                check_and_add_pending_skills(cert_data.get("tags", []))
                                
                            sync_logs.append(f"Parsed certificate: {cert_data['title']}")
                        else:
                            st.error(f"❌ Failed to parse certificate '{cert_file}'")
                    
                    if updated:
                        status.update(label="All raw files processed!", state="complete")
                        write_certificates_file(current_certs)
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
                            
                        st.success("Certificates added to certificates.ts and moved to assets!")
                        st.rerun()
                    else:
                        status.update(label="Scan completed", state="complete")
        else:
            st.info("No raw certificate files found. Drop PDFs or image files into `src/data/certificates/raw/` to parse them.")

    # Manage Active Certificates Section
    st.markdown('<div class="section-header" style="margin-top: 2rem;">Manage Active Certificates</div>', unsafe_allow_html=True)
    
    current_certs = st.session_state.certificates
    if not current_certs:
        st.info("No active certificates found in certificates.ts.")
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
                        st.image(local_img_path, use_container_width=True)
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
                        st.markdown(" ".join([f"`#{t}`" for t in tags]))
                        
                    # Remove button
                    if st.button(f"Remove Certificate", key=f"del_cert_{cert_id}", type="secondary"):
                        # Removal logic
                        # 1. Delete image
                        if img_path:
                            target_img = os.path.join("public", img_path.lstrip("/"))
                            if os.path.exists(target_img):
                                try:
                                    os.remove(target_img)
                                    st.toast(f"Deleted image file: `{target_img}`")
                                except Exception as e:
                                    st.error(f"Failed to delete image: {e}")
                        
                        # 2. Filter list
                        updated_certs = [c for c in current_certs if c.get("id") != cert_id]
                        
                        # 3. Write file
                        write_certificates_file(updated_certs)
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

# ──────────────────────────────────────────
# TAB 4: BLOG EDITOR
# ──────────────────────────────────────────
with tab_blog:
    st.markdown('<div class="section-header">AI Blog Writer & Publisher</div>', unsafe_allow_html=True)
    st.write("Draft professional developer logs, tutorials, and post updates using the Gemini co-pilot, and publish them directly to your website.")
    
    # AI Assist inputs
    st.subheader("AI Ghostwriter Co-Pilot")
    raw_notes = st.text_area("1. Paste your raw notes, debug outputs, or code snippets here:", height=150, placeholder="E.g. Fixed resume PDF download using jsPDF to create a vector layout so text remains selectable and ATS-compliant...")
    
    tone = st.selectbox("Choose Tone:", ["Professional & Technical", "Conversational & Casual", "Tutorial / How-To Style"])
    
    if st.button("Draft Blog Post with AI", use_container_width=True):
        if not raw_notes:
            st.error("Please add some raw notes or code first!")
        else:
            with st.spinner("🤖 Translating notes into a professional article..."):
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
                
                res = call_gemini(prompt)
                if res:
                    st.session_state.blog_draft_title = res.get("title", "")
                    st.session_state.blog_draft_excerpt = res.get("excerpt", "")
                    st.session_state.blog_draft_content = res.get("content", "")
                    st.success("Draft generated! Review it below.")
                    
    # Form details (pre-filled from session state if available)
    st.subheader("Edit & Publish Post")
    
    draft_title = st.text_input("Title:", value=st.session_state.get("blog_draft_title", ""))
    draft_excerpt = st.text_area("Excerpt / Summary:", value=st.session_state.get("blog_draft_excerpt", ""))
    draft_tags = st.text_input("Tags (comma separated):", value="Next.js, Python, AI" if not st.session_state.get("blog_draft_content") else "")
    draft_content = st.text_area("Markdown Body Content:", value=st.session_state.get("blog_draft_content", ""), height=350)
    
    if st.button("Publish Blog Post", use_container_width=True, type="primary"):
        if not draft_title or not draft_content:
            st.error("Title and Markdown content are required!")
        else:
            slug = slugify(draft_title)
            tags_list = [t.strip() for t in draft_tags.split(",") if t.strip()]
            
            # Format frontmatter
            file_content = f"""---
title: "{draft_title}"
date: "{datetime.now().strftime('%Y-%m-%d')}"
excerpt: "{draft_excerpt}"
tags: {json.dumps(tags_list)}
coverImage: "/images/blog/default.jpg"
---

{draft_content}
"""
            # Write file
            posts_dir = os.path.join("src", "content", "posts")
            os.makedirs(posts_dir, exist_ok=True)
            file_path = os.path.join(posts_dir, f"{slug}.md")
            
            try:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(file_content)
                
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
                
                st.success(f"Successfully published blog post! File created at: `{file_path}`")
                
                # Clear session state
                if "blog_draft_title" in st.session_state: del st.session_state.blog_draft_title
                if "blog_draft_excerpt" in st.session_state: del st.session_state.blog_draft_excerpt
                if "blog_draft_content" in st.session_state: del st.session_state.blog_draft_content
                st.rerun()
                
            except Exception as e:
                st.error(f"Failed to publish post: {e}")

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
                title = file_name
                date = ""
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    if content.startswith("---"):
                        parts = content.split("---", 2)
                        if len(parts) >= 3:
                            frontmatter = parts[1]
                            for line in frontmatter.split("\n"):
                                if line.startswith("title:"):
                                    title = line.split("title:", 1)[1].strip().strip('"').strip("'")
                                elif line.startswith("date:"):
                                    date = line.split("date:", 1)[1].strip().strip('"').strip("'")
                except Exception:
                    pass
                
                posts_data.append({
                    "file_name": file_name,
                    "file_path": file_path,
                    "title": title,
                    "date": date
                })
            
            # Sort by date (newest first)
            posts_data.sort(key=lambda x: x["date"] or "0000-00-00", reverse=True)
            
            for post in posts_data:
                with st.container(border=True):
                    col_info, col_btn = st.columns([5, 1.2])
                    with col_info:
                        st.markdown(f"**{post['title']}**")
                        st.caption(f"Date: {post['date'] if post['date'] else 'No Date'} | File: `{post['file_name']}`")
                    with col_btn:
                        btn_key = f"delete_{post['file_name']}"
                        if st.button("Remove", key=btn_key, type="secondary", use_container_width=True):
                            try:
                                os.remove(post['file_path'])
                                st.success(f"Deleted `{post['file_name']}` successfully!")
                                st.rerun()
                            except Exception as e:
                                st.error(f"Error deleting file: {e}")
    else:
        st.info("No blog posts directory found.")


