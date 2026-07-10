#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
from datetime import datetime, timedelta

# Import Streamlit - will fail gracefully if not installed
try:
    import streamlit as st
except ImportError:
    print("Error: Streamlit is not installed. Run 'pip install streamlit' to run this manager.")
    sys.exit(1)

# Ensure the scripts directory is on PATH for importing modular tabs
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

# Import shared functions and helpers
from sync_tabs.shared import (
    HAS_SYNC,
    HAS_PIL,
    env,
    GEMINI_API_KEY,
    run_async_task,
    is_port_active,
    trigger_rebuild_commit,
    run_safe_git_command,
    parse_projects_file,
    parse_resume_file,
    parse_skills_file,
    parse_certificates_file,
    write_skills_file,
    check_and_add_pending_skills,
    trigger_revalidation,
    inject_global_styles,
)

# Import individual tab renders
from sync_tabs.analytics import render_analytics_tab
from sync_tabs.resume import render_resume_tab
from sync_tabs.projects import render_projects_tab
from sync_tabs.certificates import render_certificates_tab
from sync_tabs.skills import render_skills_tab
from sync_tabs.photos import render_photos_tab
from sync_tabs.blog import render_blog_tab

st.set_page_config(
    page_title="Resume & Portfolio Manager",
    page_icon="💼",
    layout="wide",
)

# Inject modern UI custom styles
inject_global_styles()

# =──────────────────────────────────────────
# Sidebar Widgets & Telemetry Monitors
# =──────────────────────────────────────────
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

st.sidebar.markdown("### CI/CD Deployment Status")

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

if "deploy_status" not in st.session_state:
    st.session_state.deploy_status = None
if "last_checked" not in st.session_state:
    st.session_state.last_checked = None

deploy_status_val = st.session_state.get("deploy_status_task_status", "idle")

if st.session_state.deploy_status is None or deploy_status_val == "running":
    if deploy_status_val == "idle":
        run_async_task(fetch_deployment_status, "deploy_status_task")
        status = {"state": "pending", "description": "Fetching latest status in background..."}
        last_checked = "Fetching..."
    elif deploy_status_val == "running":
        status = {"state": "pending", "description": "Fetching latest status in background..."}
        last_checked = "Fetching..."
    elif deploy_status_val == "error":
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
            try:
                dt = datetime.strptime(updated_at, "%Y-%m-%dT%H:%M:%SZ")
                ist_dt = dt + timedelta(hours=5, minutes=30)
                formatted_time = ist_dt.strftime("%b %d, %I:%M %p IST")
                st.markdown(f"<small style='color: #8A8A93;'>Deployed: {formatted_time}</small>", unsafe_allow_html=True)
            except:
                pass

    st.markdown(f"<small style='color: #8A8A93;'>Checked at: {last_checked}</small>", unsafe_allow_html=True)
    if st.button("Refresh Status", key="btn_refresh_deploy_status", use_container_width=True):
        st.session_state.deploy_status = None
        st.session_state.deploy_status_task_status = "idle"
        st.rerun()

    st.markdown("---")
    st.markdown("<div style='font-family: \"Fredoka\", sans-serif; font-weight: bold; font-size: 1rem; color: #ffffff; text-transform: uppercase;'>Control Room</div>", unsafe_allow_html=True)

    is_dev_running = is_port_active(3000)
    dev_status_color = "🟢" if is_dev_running else "🔴"
    dev_status_txt = "Active (Port 3000)" if is_dev_running else "Stopped"
    
    st.markdown(f"<small>**Local Dev Server:** {dev_status_color} {dev_status_txt}</small>", unsafe_allow_html=True)
    
    if not is_dev_running:
        if st.button("🚀 Start Dev Server", key="btn_start_dev", use_container_width=True):
            import subprocess
            try:
                subprocess.Popen(["npm", "run", "dev"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                st.toast("🚀 Launched dev server in background!")
                st.rerun()
            except Exception as e:
                st.error(f"Failed to start dev server: {e}")
    
    rebuild_status = st.session_state.get("vercel_rebuild_status", "idle")
    rebuild_disabled = (rebuild_status == "running")
    
    if rebuild_status == "success":
        st.toast("⚡ Vercel rebuild triggered successfully!")
        st.session_state.vercel_rebuild_status = "idle"
    elif rebuild_status == "error":
        err = st.session_state.get("vercel_rebuild_error", "Unknown error")
        st.error(f"Rebuild trigger failed: {err}")
        st.session_state.vercel_rebuild_status = "idle"
        
    if st.button("⚡ Force Vercel Rebuild", key="btn_force_rebuild", disabled=rebuild_disabled, use_container_width=True, help="Pushes an empty commit to GitHub to force Vercel to rebuild and redeploy the site."):
        run_async_task(trigger_rebuild_commit, "vercel_rebuild")
        st.rerun()
        
    if st.button("🧹 Purge Live Cache", key="btn_purge_cache", use_container_width=True, help="Sends a cache revalidation request to the Next.js API revalidate endpoint on the live website."):
        with st.spinner("Purging cache..."):
            trigger_revalidation()
            st.toast("🧹 Purged Next.js cache!")

if GEMINI_API_KEY:
    st.sidebar.success("Gemini API Key loaded from .env.local")
else:
    st.sidebar.error("GEMINI_API_KEY not found in .env.local")

# Offline Mode Switcher
st.sidebar.checkbox("Offline Mode (Local JSON Only)", value=not HAS_SYNC, key="offline_mode")

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
if 'blog_brainstorm_focus' not in st.session_state:
    st.session_state.blog_brainstorm_focus = ""
if 'blog_draft_local_path' not in st.session_state:
    st.session_state.blog_draft_local_path = ""
if 'blog_focus_keyword' not in st.session_state:
    st.session_state.blog_focus_keyword = ""

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

with tab_analytics:
    render_analytics_tab()

with tab_edit:
    render_resume_tab()

with tab_project:
    render_projects_tab()

with tab_cert:
    render_certificates_tab()

with tab_skills:
    render_skills_tab()

with tab_photos:
    render_photos_tab()

with tab_blog:
    render_blog_tab()
