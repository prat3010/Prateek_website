import streamlit as st
from sync_tabs.shared import (
    parse_skills_file,
    write_skills_file,
    git_commit_push_file,
    delete_skill,
    slugify,
    HAS_SYNC
)

def render_skills_tab():
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
            
            existing_skill_names = [s.get('name') for s in st.session_state.skills if s.get('name')]
            new_prereq = st.selectbox("Prerequisite (Optional)", options=[None] + existing_skill_names, index=0, key="new_skill_prereq")
            
        new_status = st.selectbox("Status (Optional)", options=[None, 'legendary', 'mastered', 'quest'], index=0, key="new_skill_status")
        new_desc = st.text_area("Description / Summary (Dev Mode)", placeholder="Short 1-sentence description.", key="new_skill_desc")
        new_desc_biz = st.text_area("Description / Summary (Biz Mode)", placeholder="Outcome value proposition for clients.", key="new_skill_desc_biz")
        
        project_list = st.session_state.projects or []
        project_options = {p.get('id'): p.get('title') for p in project_list if p.get('id')}
        project_ids = list(project_options.keys())
        
        selected_projects = st.multiselect(
            "Link to Projects (Optional)", 
            options=project_ids, 
            format_func=lambda x: project_options[x],
            key="new_skill_projects"
        )
        
        if st.button("Create Skill", type="primary", key="btn_create_skill"):
            if not new_name.strip():
                st.error("Skill Name is required!")
            elif any(s.get("name", "").lower() == new_name.strip().lower() for s in st.session_state.skills):
                st.error(f"Skill '{new_name}' already exists!")
            else:
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
        
        categories_opts = ['orchestration', 'logic', 'product', 'dynamic']
        categories_labels = {
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
            
            cols = st.columns(2)
            for s_idx, skill in enumerate(group_skills):
                col_i = cols[s_idx % 2]
                s_name = skill.get('name', 'Unnamed Skill')
                s_id = slugify(s_name)
                key_prefix = f"edit_skill_{s_id}"
                
                s_color = skill.get('color', '#00E676')
                s_icon = skill.get('icon', 'sparkles')
                s_level = skill.get('level', '')
                s_status = skill.get('status', '')
                
                badge_label = s_name
                if s_level:
                    badge_label += f" ({s_level})"
                if s_status:
                    badge_label += f" [{s_status.upper()}]"
                    
                with col_i:
                    expander_label = f"🔧 {s_name}"
                    with st.expander(expander_label):
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
                            if st.button(f"Save Changes", key=f"{key_prefix}_save_btn", type="primary", use_container_width=True):
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
                            if st.button(f"Delete Skill", key=f"{key_prefix}_del_btn", type="secondary", use_container_width=True):
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
