import streamlit as st
import json
from datetime import datetime
from sync_tabs.shared import write_resume_file, git_commit_push_file

def render_resume_tab():
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
            # Ensure summary dictionary exists
            if 'summary' not in res:
                res['summary'] = {}
            res['summary']['general'] = st.text_area("General Summary", summ.get('general', ''), height=100)
            res['summary']['fullstack'] = st.text_area("Full-Stack Summary", summ.get('fullstack', ''), height=100)
            res['summary']['ai'] = st.text_area("AI Orchestration Summary", summ.get('ai', ''), height=100)
            res['summary']['creative'] = st.text_area("Creative Designer Summary", summ.get('creative', ''), height=100)

        # 2b. Biography Details (Origin Story / About Section)
        with st.container(border=True):
            st.markdown('<div class="section-header">Origin Story Biography & Facts</div>', unsafe_allow_html=True)
            about_data = res.get('about', {}) or {}
            
            # Sub-tabs for Developer and Business
            tab_about_dev, tab_about_biz = st.tabs(["Developer Mode Copy", "Business Mode Copy"])
            
            with tab_about_dev:
                dev_copy = about_data.get('developer', {}) or {}
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
                biz_copy = about_data.get('business', {}) or {}
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
                # Ensure experience array exists
                if 'experience' not in res:
                    res['experience'] = []
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
                # Ensure education array exists
                if 'education' not in res:
                    res['education'] = []
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
            
            tab_q_global, tab_q_india = st.tabs(["Global Rates (USD)", "India Rates (INR)"])
            
            with tab_q_global:
                quote_data = res.get('quotation', {}) or {}
                col_q1, col_q2 = st.columns(2)
                with col_q1:
                    q_hourly = st.text_input("Estimated Hourly Rate (USD)", value=quote_data.get('hourlyRate', ''), placeholder="e.g. $50", key="quote_hourly")
                    q_day = st.text_input("Standard Day Rate (8 hours - USD)", value=quote_data.get('dayRate', ''), placeholder="e.g. $350", key="quote_day")
                with col_q2:
                    q_terms = st.text_area("Standard Payment Terms (USD)", value=quote_data.get('paymentTerms', ''), key="quote_terms", height=70)
                    
                q_deliv_str = "\n".join(quote_data.get('deliverables', []))
                q_deliv_edit = st.text_area("Service Deliverables Checklist (USD - One per line)", value=q_deliv_str, height=100, key="quote_deliv")
                q_deliv_list = [d.strip() for d in q_deliv_edit.split("\n") if d.strip()]
                
                res['quotation'] = {
                    "hourlyRate": q_hourly.strip(),
                    "dayRate": q_day.strip(),
                    "paymentTerms": q_terms.strip(),
                    "deliverables": q_deliv_list
                }
                
            with tab_q_india:
                quote_data_in = res.get('quotation_india', {}) or {}
                col_qi1, col_qi2 = st.columns(2)
                with col_qi1:
                    qi_hourly = st.text_input("Estimated Hourly Rate (INR)", value=quote_data_in.get('hourlyRate', ''), placeholder="e.g. ₹3,500", key="quote_hourly_in")
                    qi_day = st.text_input("Standard Day Rate (8 hours - INR)", value=quote_data_in.get('dayRate', ''), placeholder="e.g. ₹25,000", key="quote_day_in")
                with col_qi2:
                    qi_terms = st.text_area("Standard Payment Terms (INR)", value=quote_data_in.get('paymentTerms', ''), key="quote_terms_in", height=70)
                    
                qi_deliv_str = "\n".join(quote_data_in.get('deliverables', []))
                qi_deliv_edit = st.text_area("Service Deliverables Checklist (INR - One per line)", value=qi_deliv_str, height=100, key="quote_deliv_in")
                qi_deliv_list = [d.strip() for d in qi_deliv_edit.split("\n") if d.strip()]
                
                res['quotation_india'] = {
                    "hourlyRate": qi_hourly.strip(),
                    "dayRate": qi_day.strip(),
                    "paymentTerms": qi_terms.strip(),
                    "deliverables": qi_deliv_list
                }

        # 4c. Pricing Plans & Packages
        with st.container(border=True):
            st.markdown('<div class="section-header">Pricing Plans & Packages Grid</div>', unsafe_allow_html=True)
            
            pricing_region = st.selectbox("Select Pricing Region to Edit:", ["Global (USD)", "India (INR)"], key="pricing_region_select")
            
            if pricing_region == "Global (USD)":
                pricing_data = res.get('pricing', {}) or {}
                
                tab_price_dev, tab_price_biz = st.tabs(["Developer (Mentorship/Audits) Tiers", "Business (Website/Support) Tiers"])
                
                with tab_price_dev:
                    dev_tiers = pricing_data.get('developer', []) or []
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
                    biz_tiers = pricing_data.get('business', []) or []
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
                
            else:
                pricing_data_in = res.get('pricing_india', {}) or {}
                
                tab_price_dev_in, tab_price_biz_in = st.tabs(["Developer (Mentorship/Audits) Tiers [INR]", "Business (Website/Support) Tiers [INR]"])
                
                with tab_price_dev_in:
                    dev_tiers_in = pricing_data_in.get('developer', []) or []
                    while len(dev_tiers_in) < 3:
                        dev_tiers_in.append({"title": "", "price": "", "description": "", "features": [], "cta": ""})
                    
                    updated_dev_tiers_in = []
                    for t_idx in range(3):
                        tier = dev_tiers_in[t_idx]
                        st.markdown(f"**Tier #{t_idx + 1}**")
                        col_t1, col_t2 = st.columns(2)
                        with col_t1:
                            t_title = st.text_input("Tier Title", value=tier.get('title', ''), key=f"p_dev_title_in_{t_idx}")
                            t_price = st.text_input("Price / Rate Label", value=tier.get('price', ''), key=f"p_dev_price_in_{t_idx}")
                        with col_t2:
                            t_cta = st.text_input("CTA Code (pre-populates dropdown value)", value=tier.get('cta', ''), key=f"p_dev_cta_in_{t_idx}")
                            t_desc = st.text_input("Short Tier Description", value=tier.get('description', ''), key=f"p_dev_desc_in_{t_idx}")
                            
                        t_feat_str = "\n".join(tier.get('features', []))
                        t_feat_edit = st.text_area("Features (One per line)", value=t_feat_str, height=70, key=f"p_dev_feat_in_{t_idx}")
                        t_feat_list = [f.strip() for f in t_feat_edit.split("\n") if f.strip()]
                        
                        updated_dev_tiers_in.append({
                            "title": t_title.strip(),
                            "price": t_price.strip(),
                            "description": t_desc.strip(),
                            "features": t_feat_list,
                            "cta": t_cta.strip()
                        })
                    pricing_data_in['developer'] = updated_dev_tiers_in
                    
                with tab_price_biz_in:
                    biz_tiers_in = pricing_data_in.get('business', []) or []
                    while len(biz_tiers_in) < 3:
                        biz_tiers_in.append({"title": "", "price": "", "description": "", "features": [], "cta": ""})
                    
                    updated_biz_tiers_in = []
                    for t_idx in range(3):
                        tier = biz_tiers_in[t_idx]
                        st.markdown(f"**Tier #{t_idx + 1}**")
                        col_tb1, col_tb2 = st.columns(2)
                        with col_tb1:
                            t_title = st.text_input("Tier Title", value=tier.get('title', ''), key=f"p_biz_title_in_{t_idx}")
                            t_price = st.text_input("Price Range / Rate Label", value=tier.get('price', ''), key=f"p_biz_price_in_{t_idx}")
                        with col_tb2:
                            t_cta = st.text_input("CTA Code (pre-populates dropdown value)", value=tier.get('cta', ''), key=f"p_biz_cta_in_{t_idx}")
                            t_desc = st.text_input("Short Tier Description", value=tier.get('description', ''), key=f"p_biz_desc_in_{t_idx}")
                            
                        t_feat_str = "\n".join(tier.get('features', []))
                        t_feat_edit = st.text_area("Features (One per line)", value=t_feat_str, height=70, key=f"p_biz_feat_in_{t_idx}")
                        t_feat_list = [f.strip() for f in t_feat_edit.split("\n") if f.strip()]
                        
                        updated_biz_tiers_in.append({
                            "title": t_title.strip(),
                            "price": t_price.strip(),
                            "description": t_desc.strip(),
                            "features": t_feat_list,
                            "cta": t_cta.strip()
                        })
                    pricing_data_in['business'] = updated_biz_tiers_in
                    
                res['pricing_india'] = pricing_data_in

        # Save Button & Live JSON View
        st.markdown("---")
        dry_run_resume = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_resume")
        if st.button("Save Resume Changes", type="primary", key="btn_save_resume_changes"):
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
