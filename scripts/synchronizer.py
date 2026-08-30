#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import subprocess
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
    stop_dev_server,
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
from sync_tabs.resume import (
    render_resume_profile_tab,
    render_quotation_terms_tab,
    render_partner_agreement_tab,
)
from sync_tabs.projects import render_projects_tab
from sync_tabs.certificates import render_certificates_tab
from sync_tabs.skills import render_skills_tab
from sync_tabs.photos import render_photos_tab
from sync_tabs.blog import render_blog_tab
from sync_tabs.rag_pricing import render_rag_pricing_tab
from sync_tabs.clients import render_clients_tab
from sync_tabs.questionnaire import render_questionnaire_tab
from sync_tabs.outreach import render_outreach_tab

st.set_page_config(
    page_title="Resume & Portfolio Manager",
    page_icon="💼",
    layout="wide",
)

# Inject modern UI custom styles
inject_global_styles()


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


# Session state initialization
if "deploy_status" not in st.session_state:
    st.session_state.deploy_status = None
if "last_checked" not in st.session_state:
    st.session_state.last_checked = None

deploy_status_val = st.session_state.get("deploy_status_task_status", "idle")

if st.session_state.deploy_status is None or deploy_status_val == "running":
    if deploy_status_val == "idle":
        run_async_task(fetch_deployment_status, "deploy_status_task")
        deploy_info = {"state": "pending", "description": "Fetching latest status..."}
        last_checked_time = "Fetching..."
    elif deploy_status_val == "error":
        deploy_info = {"error": st.session_state.get("deploy_status_task_error", "Failed to fetch")}
        last_checked_time = "Error"
    else:
        deploy_info = {"state": "pending", "description": "Fetching latest status..."}
        last_checked_time = "Fetching..."
else:
    deploy_info = st.session_state.deploy_status
    last_checked_time = st.session_state.last_checked

if st.session_state.get("deploy_status_task_status") == "success":
    st.session_state.deploy_status = st.session_state.deploy_status_task_result
    st.session_state.last_checked = datetime.now().strftime("%H:%M:%S")
    st.session_state.deploy_status_task_status = "idle"
    st.rerun()

# ──────────────────────────────────────────
# Left Sidebar Vertical Navigation & Workspace Hubs
# ──────────────────────────────────────────
st.sidebar.markdown("""
<div style="padding: 12px 14px; margin-bottom: 16px; background: #0d0d0d; border: 1px solid #222222; border-radius: 8px;">
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.1rem; color: #ffffff; font-weight: 700;">▲</span>
        <span style="color: #ffffff; font-weight: 600; font-size: 0.92rem; font-family: 'Inter', sans-serif; letter-spacing: -0.02em;">PRATEEQ / SYNCHRONIZER</span>
    </div>
    <span style="display: block; color: #888888; font-size: 0.68rem; font-weight: 600; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; margin-top: 4px;">v2.0 // VERCEL EDITION</span>
</div>
""", unsafe_allow_html=True)

nav_options = [
    "👤 Profile, Bio & Career",
    "🚀 Deployed Systems & Architecture",
    "⚡ Skills Matrix",
    "📜 Verified Badges",
    "🖼️ Photos & Assets",
    "✍️ Blog & Content Studio",
    "🎯 Lead Prospecting Deck",
    "🧾 Scoping Questionnaire",
    "🏢 Client Orders & Invoices",
    "🤝 Sales Partner Agreements",
    "💰 Quotation Terms & Rates",
    "💳 RAG SaaS Pricing",
    "📈 Traffic Telemetry",
    "⚙️ Server Control & CI/CD",
]

selected_tab = st.sidebar.radio(
    "WORKSPACE NAVIGATION",
    nav_options,
    index=0,
    key="vertical_nav_tab",
)

st.sidebar.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# System & Environment Status
with st.sidebar.container(border=True):
    st.markdown("##### System & Environment")
    
    # CI/CD Quick Status Pill
    if "error" in deploy_info:
        st.caption("🔴 **CI/CD:** Offline / Limit reached")
    else:
        st_state = deploy_info.get("state", "unknown").lower()
        if st_state == "success":
            st.caption("🟢 **CI/CD:** Success (Vercel Built)")
        elif st_state == "pending":
            st.caption("🟡 **CI/CD:** Building...")
        elif st_state in ["failure", "error"]:
            st.caption("🔴 **CI/CD:** Build Failed")
        else:
            st.caption(f"⚪ **CI/CD:** {st_state.upper()}")

    # Offline Mode Switcher
    st.checkbox("Offline Mode (Local JSON Only)", value=not HAS_SYNC, key="offline_mode")

    # Gemini Key Status
    if GEMINI_API_KEY:
        st.caption("🟢 **Gemini AI Key:** Loaded")
    else:
        st.caption("🔴 **Gemini AI Key:** Missing")

# Quick Utilities
with st.sidebar.container(border=True):
    st.markdown("##### Quick Utilities")
    if st.button("🔍 Scan Missing Skills", use_container_width=True):
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
            st.info("No projects or certificates found to scan.")

if 'pending_skills' in st.session_state and st.session_state.pending_skills:
    st.sidebar.info(f"💡 **{len(st.session_state.pending_skills)}** pending skill(s) queued for review in **Skills Matrix**.")

# ──────────────────────────────────────────
# Top Breadcrumb / Workspace Header
# ──────────────────────────────────────────
st.markdown(f"""
<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; margin-bottom: 24px; background: #0a0a0a; border: 1px solid #222222; border-radius: 8px;">
    <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.1rem; font-weight: 700; color: #ffffff;">▲ Synchronizer</span>
        <span style="color: #444444;">/</span>
        <span style="font-size: 0.9rem; color: #ffffff; font-weight: 500; font-family: 'Inter', sans-serif;">{selected_tab}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #111111; border: 1px solid #222222; border-radius: 20px; font-size: 0.72rem; color: #10b981; font-family: 'JetBrains Mono', monospace;">
            <span style="width: 6px; height: 6px; background-color: #10b981; border-radius: 50%;"></span>
            LOCAL HOST: ACTIVE
        </span>
    </div>
</div>
""", unsafe_allow_html=True)

# Load static data in session state
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


def render_control_room_tab():
    st.markdown('<div class="section-header">Server Control Room & CI/CD Operations</div>', unsafe_allow_html=True)
    
    col_c1, col_c2 = st.columns(2)
    
    with col_c1:
        with st.container(border=True):
            st.markdown("### CI/CD Deployment Status")
            if "error" in deploy_info:
                st.error("Offline or GitHub API limit reached")
            else:
                state = deploy_info.get("state", "unknown").lower()
                desc = deploy_info.get("description", "")
                url = deploy_info.get("url", "")
                updated_at = deploy_info.get("updated_at", "")
                
                if state == "success":
                    st.success("🟢 **STATUS: SUCCESS** — Vercel Build Completed")
                elif state == "pending":
                    st.warning("🟡 **STATUS: BUILDING** — Vercel Build Running...")
                elif state in ["failure", "error"]:
                    st.error("🔴 **STATUS: FAILED** — Build Failed")
                else:
                    st.info(f"⚪ **STATUS: {state.upper()}** — {desc}")
                    
                st.markdown(f"**Description:** {desc}")
                if url:
                    st.markdown(f"[🔗 View Vercel Build Logs]({url})")
                    
                if updated_at:
                    try:
                        dt = datetime.strptime(updated_at, "%Y-%m-%dT%H:%M:%SZ")
                        ist_dt = dt + timedelta(hours=5, minutes=30)
                        formatted_time = ist_dt.strftime("%b %d, %Y at %I:%M %p IST")
                        st.caption(f"Last Deployed: {formatted_time}")
                    except Exception:
                        pass

            st.caption(f"Checked at: {last_checked_time}")
            if st.button("Refresh Build Status", key="btn_refresh_deploy_ctrl", use_container_width=True):
                st.session_state.deploy_status = None
                st.session_state.deploy_status_task_status = "idle"
                st.rerun()

    with col_c2:
        with st.container(border=True):
            st.markdown("### Local Dev & Build Triggers")
            
            is_dev_running = is_port_active(3000)
            dev_status_color = "🟢" if is_dev_running else "🔴"
            dev_status_txt = "Active (Port 3000)" if is_dev_running else "Stopped"
            
            st.markdown(f"**Local Dev Server Status:** {dev_status_color} {dev_status_txt}")
            
            if not is_dev_running:
                if st.button("🚀 Start Dev Server (`npm run dev`)", key="btn_start_dev_ctrl", use_container_width=True):
                    try:
                        subprocess.Popen(["npm", "run", "dev"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        st.toast("🚀 Launched dev server in background!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Failed to start dev server: {e}")
            else:
                if st.button("🛑 Stop Dev Server (`kill :3000`)", key="btn_stop_dev_ctrl", use_container_width=True, type="primary"):
                    try:
                        success, msg = stop_dev_server(3000)
                        if success:
                            st.toast("🛑 Dev server stopped successfully!")
                        else:
                            st.warning(f"Stop command sent: {msg}")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Failed to stop dev server: {e}")

            st.markdown("---")
            rebuild_status = st.session_state.get("vercel_rebuild_status", "idle")
            rebuild_disabled = (rebuild_status == "running")
            
            if rebuild_status == "success":
                st.toast("⚡ Vercel rebuild triggered successfully!")
                st.session_state.vercel_rebuild_status = "idle"
            elif rebuild_status == "error":
                err = st.session_state.get("vercel_rebuild_error", "Unknown error")
                st.error(f"Rebuild trigger failed: {err}")
                st.session_state.vercel_rebuild_status = "idle"
                
            if st.button("⚡ Force Vercel Rebuild", key="btn_force_rebuild_ctrl", disabled=rebuild_disabled, use_container_width=True, help="Pushes an empty commit to GitHub to force Vercel to rebuild and redeploy."):
                run_async_task(trigger_rebuild_commit, "vercel_rebuild")
                st.rerun()
                
            if st.button("🧹 Purge Live Website Cache", key="btn_purge_cache_ctrl", use_container_width=True, help="Sends cache revalidation request to live site."):
                with st.spinner("Purging cache..."):
                    trigger_revalidation()
                    st.toast("🧹 Purged Next.js cache!")


# Dispatcher map for active view rendering
NAV_DISPATCH = {
    "👤 Profile, Bio & Career": render_resume_profile_tab,
    "🚀 Deployed Systems & Architecture": render_projects_tab,
    "⚡ Skills Matrix": render_skills_tab,
    "📜 Verified Badges": render_certificates_tab,
    "🖼️ Photos & Assets": render_photos_tab,
    "✍️ Blog & Content Studio": render_blog_tab,
    "🎯 Lead Prospecting Deck": render_outreach_tab,
    "🧾 Scoping Questionnaire": render_questionnaire_tab,
    "🏢 Client Orders & Invoices": render_clients_tab,
    "🤝 Sales Partner Agreements": render_partner_agreement_tab,
    "💰 Quotation Terms & Rates": render_quotation_terms_tab,
    "💳 RAG SaaS Pricing": render_rag_pricing_tab,
    "📈 Traffic Telemetry": render_analytics_tab,
    "⚙️ Server Control & CI/CD": render_control_room_tab,
}

render_target = NAV_DISPATCH.get(selected_tab)
if render_target:
    render_target()

