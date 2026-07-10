import streamlit as st
import os
import re
import json
import urllib.request
from datetime import datetime
from sync_tabs.shared import (
    call_gemini,
    validate_project_response,
    parse_projects_file,
    write_projects_file,
    check_and_add_pending_skills,
    parse_resume_file,
    write_resume_file,
    git_commit_push_file,
    st_image_safe,
    save_uploaded_image,
    delete_existing_files,
    delete_project,
    run_safe_git_command,
    HAS_SYNC,
    run_async_task,
    sanitize_local_path
)
from sync_git import commit_and_push_paths

def render_projects_tab():
    with st.container(border=True):
        st.markdown('<div class="section-header">Import & Sync Project Showcase</div>', unsafe_allow_html=True)
        st.write("Extract descriptions, tags, and custom resume bullet points from your repos using the Gemini API.")

        project_mode = st.radio("Choose Project Input Type:", ["Local Directory", "GitHub Repository"])

        proj_input = ""
        if project_mode == "Local Directory":
            proj_input = st.text_input("Absolute Local Folder Path:", placeholder="/Users/prateeksharma/Developer/my-app")
        else:
            proj_input = st.text_input("GitHub Repository URL / Slug:", placeholder="username/repo or just repo-name")

        dry_run_proj = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_proj_sync")

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
                    repo = ""
                    
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
                                # Ensure bullets array exists
                                if 'bullets' not in exp:
                                    exp['bullets'] = []
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
                            success, msg, _ = save_uploaded_image(up_img, target_img_path, "WEBP")
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
                            success, msg, _ = save_uploaded_image(up_img_noir, target_noir_path, "WEBP")
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
                        if st.button("Save Project Changes", key=f"btn_save_proj_{p_id}", type="primary", use_container_width=True):
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
                        if st.button("Delete Project", key=f"btn_del_proj_{p_id}", type="secondary", use_container_width=True):
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
