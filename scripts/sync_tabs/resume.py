import streamlit as st
import json
import os
from datetime import datetime
from sync_tabs.shared import write_resume_file, git_commit_push_file

def render_resume_tab():
    if st.session_state.resume is None:
        st.error("Could not load resume.json. Please verify the file is present.")
        return

    res = st.session_state.resume

    # Re-organized 4-subtab layout
    tab_res_profile, tab_res_career, tab_res_pricing, tab_res_partner = st.tabs([
        "👤 Profile & Bio",
        "💼 Career & Education",
        "💰 Quotation & Engagement Terms",
        "🤝 Partner & Scoping"
    ])

    # ──────────────────────────────────────────────────────────
    # SUB-TAB 1: 👤 Profile & Bio
    # ──────────────────────────────────────────────────────────
    with tab_res_profile:
        # Profile Details
        with st.container(border=True):
            st.markdown('<div class="section-header">Profile & Contact Details</div>', unsafe_allow_html=True)
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

        # Persona Summaries
        with st.container(border=True):
            st.markdown('<div class="section-header">Persona Summaries</div>', unsafe_allow_html=True)
            st.info("Write a bio description tailored for each engineering archetype.")
            summ = res.get('summary', {}) or {}
            if 'summary' not in res:
                res['summary'] = {}
            res['summary']['general'] = st.text_area("General Summary", summ.get('general', ''), height=90)
            res['summary']['fullstack'] = st.text_area("Full-Stack Summary", summ.get('fullstack', ''), height=90)
            res['summary']['ai'] = st.text_area("AI Orchestration Summary", summ.get('ai', ''), height=90)
            res['summary']['creative'] = st.text_area("Creative Designer Summary", summ.get('creative', ''), height=90)

        # Origin Story Biography & Facts
        with st.container(border=True):
            st.markdown('<div class="section-header">Origin Story Biography & Facts</div>', unsafe_allow_html=True)
            about_data = res.get('about', {}) or {}

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

    # ──────────────────────────────────────────────────────────
    # SUB-TAB 2: 💼 Career & Education
    # ──────────────────────────────────────────────────────────
    with tab_res_career:
        # Work Experience Timeline
        with st.container(border=True):
            st.markdown('<div class="section-header">Work Experience Timeline</div>', unsafe_allow_html=True)

            if st.button("➕ Add Job Experience"):
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
                with st.expander(f"💼 {exp.get('company')} — {exp.get('role')} ({exp.get('period')})", expanded=False):
                    col_c1, col_c2 = st.columns(2)
                    with col_c1:
                        exp['company'] = st.text_input("Company Name", exp.get('company'), key=f"comp_{exp_idx}")
                        exp['role'] = st.text_input("Role Title", exp.get('role'), key=f"role_{exp_idx}")
                    with col_c2:
                        exp['period'] = st.text_input("Period (Dates)", exp.get('period'), key=f"per_{exp_idx}")
                        exp['location'] = st.text_input("Location", exp.get('location'), key=f"loc_{exp_idx}")

                    tags_str = ", ".join(exp.get('tags', []))
                    edited_tags = st.text_input("Tags / Skills (comma-separated)", tags_str, key=f"tags_{exp_idx}")
                    exp['tags'] = [t.strip() for t in edited_tags.split(",") if t.strip()]

                    st.markdown("**Bullet Points**")
                    if st.button("➕ Add Bullet Point", key=f"add_bullet_btn_{exp_idx}"):
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
                        tab_g, tab_f, tab_a, tab_c = st.tabs([
                            "General / Core", 
                            "Full-Stack / Backend", 
                            "AI / Agents", 
                            "Creative / UI"
                        ])

                        with tab_g:
                            bullet['general'] = st.text_area("General Description", bullet.get('general', ''), key=f"bul_g_{exp_idx}_{b_idx}", height=70)
                        with tab_f:
                            bullet['fullstack'] = st.text_area("Full-Stack Description", bullet.get('fullstack', ''), key=f"bul_f_{exp_idx}_{b_idx}", height=70)
                        with tab_a:
                            bullet['ai'] = st.text_area("AI/Agent Description", bullet.get('ai', ''), key=f"bul_a_{exp_idx}_{b_idx}", height=70)
                        with tab_c:
                            bullet['creative'] = st.text_area("Creative/Animation Description", bullet.get('creative', ''), key=f"bul_c_{exp_idx}_{b_idx}", height=70)

                        if st.button(f"🗑️ Remove Bullet #{b_idx+1}", key=f"rem_bul_{exp_idx}_{b_idx}"):
                            bullets_to_remove.append(b_idx)

                    if bullets_to_remove:
                        for idx in sorted(bullets_to_remove, reverse=True):
                            exp['bullets'].pop(idx)
                        st.rerun()

                    if st.button("🗑️ Delete Job Experience Block", key=f"del_exp_{exp_idx}", type="secondary"):
                        res['experience'].pop(exp_idx)
                        st.rerun()

        # Education Section
        with st.container(border=True):
            st.markdown('<div class="section-header">Education & Degrees</div>', unsafe_allow_html=True)
            if st.button("➕ Add Education Block"):
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
                with st.expander(f"🎓 {edu.get('school')} — {edu.get('degree')}", expanded=False):
                    col_e1, col_e2 = st.columns(2)
                    with col_e1:
                        edu['school'] = st.text_input("University / School", edu.get('school'), key=f"school_{edu_idx}")
                        edu['degree'] = st.text_input("Degree / Program", edu.get('degree'), key=f"deg_{edu_idx}")
                    with col_e2:
                        edu['period'] = st.text_input("Period", edu.get('period'), key=f"edu_per_{edu_idx}")
                        edu['location'] = st.text_input("Location", edu.get('location'), key=f"edu_loc_{edu_idx}")

                    if st.button("🗑️ Delete Education Block", key=f"del_edu_{edu_idx}", type="secondary"):
                        res['education'].pop(edu_idx)
                        st.rerun()

    # ──────────────────────────────────────────────────────────
    # SUB-TAB 3: 💰 Quotation & Engagement Terms
    # ──────────────────────────────────────────────────────────
    with tab_res_pricing:
        # Freelance Quotation Details
        with st.container(border=True):
            st.markdown('<div class="section-header">Freelance Quotation & Engagement Terms</div>', unsafe_allow_html=True)

            tab_q_global, tab_q_india = st.tabs(["Global Terms (USD)", "India Terms (INR)"])

            with tab_q_global:
                quote_data = res.get('quotation', {}) or {}
                col_q1, col_q2 = st.columns(2)
                with col_q1:
                    q_scope = st.text_input("Fixed Scope Guarantee", value=quote_data.get('scopeModel', 'Fixed-Price Milestones (No hidden hourly charges)'), key="quote_scope")
                    q_sprint = st.text_input("Delivery Sprint Speed", value=quote_data.get('deliverySprint', '1 to 3 Weeks Turnaround Sprint'), key="quote_sprint")
                    q_warranty = st.text_input("Post-Launch Warranty", value=quote_data.get('warrantyModel', 'Included 30-Day Post-Launch Support & Warranty'), key="quote_warranty")
                with col_q2:
                    q_terms = st.text_area("Standard Payment Terms (USD)", value=quote_data.get('paymentTerms', ''), key="quote_terms", height=90)

                q_deliv_str = "\n".join(quote_data.get('deliverables', []))
                q_deliv_edit = st.text_area("Service Deliverables Checklist (USD - One per line)", value=q_deliv_str, height=90, key="quote_deliv")
                q_deliv_list = [d.strip() for d in q_deliv_edit.split("\n") if d.strip()]

                res['quotation'] = {
                    "scopeModel": q_scope.strip(),
                    "deliverySprint": q_sprint.strip(),
                    "warrantyModel": q_warranty.strip(),
                    "hourlyRate": quote_data.get('hourlyRate', '$40'),
                    "dayRate": quote_data.get('dayRate', '$300'),
                    "paymentTerms": q_terms.strip(),
                    "deliverables": q_deliv_list
                }

            with tab_q_india:
                quote_data_in = res.get('quotation_india', {}) or {}
                col_qi1, col_qi2 = st.columns(2)
                with col_qi1:
                    qi_scope = st.text_input("Fixed Scope Guarantee [INR]", value=quote_data_in.get('scopeModel', 'Fixed-Price Milestones (No hidden hourly charges)'), key="quote_scope_in")
                    qi_sprint = st.text_input("Delivery Sprint Speed [INR]", value=quote_data_in.get('deliverySprint', '1 to 3 Weeks Turnaround Sprint'), key="quote_sprint_in")
                    qi_warranty = st.text_input("Post-Launch Warranty [INR]", value=quote_data_in.get('warrantyModel', 'Included 30-Day Post-Launch Support & Warranty'), key="quote_warranty_in")
                with col_qi2:
                    qi_terms = st.text_area("Standard Payment Terms (INR)", value=quote_data_in.get('paymentTerms', ''), key="quote_terms_in", height=90)

                qi_deliv_str = "\n".join(quote_data_in.get('deliverables', []))
                qi_deliv_edit = st.text_area("Service Deliverables Checklist (INR - One per line)", value=qi_deliv_str, height=90, key="quote_deliv_in")
                qi_deliv_list = [d.strip() for d in qi_deliv_edit.split("\n") if d.strip()]

                res['quotation_india'] = {
                    "scopeModel": qi_scope.strip(),
                    "deliverySprint": qi_sprint.strip(),
                    "warrantyModel": qi_warranty.strip(),
                    "hourlyRate": quote_data_in.get('hourlyRate', '₹3,000'),
                    "dayRate": quote_data_in.get('dayRate', '₹20,000'),
                    "paymentTerms": qi_terms.strip(),
                    "deliverables": qi_deliv_list
                }

    # ──────────────────────────────────────────────────────────
    # SUB-TAB 4: 🤝 Partner & Scoping
    # ──────────────────────────────────────────────────────────
    with tab_res_partner:
        intake_data = res.get('intake', {}) or {}

        # Middleman Partnership Terms & PDF Agreement Manager
        with st.container(border=True):
            st.markdown('<div class="section-header">Middleman Partnership Agreement & PDF Config</div>', unsafe_allow_html=True)
            mm_data = intake_data.get('middlemanAgreement', {}) or {}

            col_mm1, col_mm2 = st.columns(2)
            with col_mm1:
                partner_name = st.text_input("Partner / Sales Rep Name", value=mm_data.get('partnerName', '[Partner Name]'), key="mm_partner_name")
                partner_email = st.text_input("Partner Email", value=mm_data.get('partnerEmail', ''), key="mm_partner_email")
                eff_date = st.text_input("Effective Date", value=mm_data.get('effectiveDate', 'August 2, 2026'), key="mm_eff_date")
                dev_name = st.text_input("Developer Name", value=mm_data.get('developerName', 'Prateeq Sharma'), key="mm_dev_name")
                dev_email = st.text_input("Developer Email", value=mm_data.get('developerEmail', 'prateeqsharma@gmail.com'), key="mm_dev_email")
            with col_mm2:
                t1_comm = st.text_input("Tier 1 Commission (%)", value=mm_data.get('tier1Commission', '10%'), key="mm_t1_comm")
                t2_comm = st.text_input("Tier 2 Commission (%)", value=mm_data.get('tier2Commission', '12%'), key="mm_t2_comm")
                t3_comm = st.text_input("Tier 3/4 Commission (%)", value=mm_data.get('tier3Commission', '15%'), key="mm_t3_comm")
                rec_comm = st.text_input("Recurring Care Plan Commission (%)", value=mm_data.get('recurringCommission', '10%'), key="mm_rec_comm")

            default_disburse = [
                "Rule 3.1 (No Out-of-Pocket Liability): Developer will never pay commissions out-of-pocket prior to client funds clearing bank accounts.",
                "Rule 3.2 (Proportional Payout Schedule): 50% of Commission disbursed within 24 hours of receiving Client's 50% Upfront Deposit. 50% disbursed upon receiving Client's Final 50% Balance.",
                "Rule 3.3 (Cancellations & Defaults): In the event of a client default or partial scope cancellation, commission is calculated strictly on net funds actually collected and retained."
            ]
            default_confid = [
                "Rule 4.1 (Non-Circumvention): Partner agrees not to bypass Developer or refer introduced clients to alternative software developers without express written consent.",
                "Rule 4.2 (Codebase & IP Ownership): All codebase assets, databases, and intellectual property remain the property of Developer until 100% of project contract fees are paid by Client.",
                "Rule 4.3 (Confidentiality & Non-Disclosure): Both parties agree to keep project quotes, client contact information, and internal commercial terms strictly confidential."
            ]

            disburse_val = mm_data.get('disbursementRules') if mm_data.get('disbursementRules') else default_disburse
            confid_val = mm_data.get('confidentialityRules') if mm_data.get('confidentialityRules') else default_confid

            st.markdown("##### Section 3: Payment Disbursement Rules (One per line)")
            disburse_edit = st.text_area("Disbursement Rules", value="\n".join(disburse_val), height=90, key="mm_disburse_rules")
            disburse_list = [r.strip() for r in disburse_edit.split("\n") if r.strip()]

            st.markdown("##### Section 4: Non-Circumvention & Confidentiality Rules (One per line)")
            confid_edit = st.text_area("Confidentiality Rules", value="\n".join(confid_val), height=90, key="mm_confid_rules")
            confid_list = [r.strip() for r in confid_edit.split("\n") if r.strip()]

            agreed_edit = st.text_area(
                "Agreed Electronically Clause",
                value=mm_data.get('agreedElectronically', 'The parties acknowledge that this Agreement may be accepted and signed electronically, and an electronic signature or a documented email acceptance of these terms shall have the same force and effect as a manually executed signature.'),
                height=70,
                key="mm_agreed_e"
            )

            st.markdown("##### Editable Agreement Prose (Sections below render inside the PDF in order)")
            st.caption("Each section shows its heading and one line per paragraph/bullet. Prefix a line with '- ' to render it as a bullet. Use {{partnerName}}, {{developerName}}, {{developerEmail}}, {{partnerEmail}}, {{effectiveDate}} placeholders.")
            defaults_path = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'middlemanAgreementDefaults.json')
            if not getattr(st.session_state, '_mm_defaults_loaded', False):
                try:
                    with open(defaults_path, 'r', encoding='utf-8') as df:
                        st.session_state['_mm_defaults'] = json.load(df)
                except Exception:
                    st.session_state['_mm_defaults'] = {'sections': []}
                st.session_state['_mm_defaults_loaded'] = True
            _mm_defaults = st.session_state.get('_mm_defaults', {'sections': []})
            existing_sections = mm_data.get('sections') or []
            section_by_key = {s.get('key'): s for s in existing_sections if isinstance(s, dict) and s.get('key')}
            default_sections = _mm_defaults.get('sections', [])

            if st.button("↺ Reset Agreement Prose to Defaults", key="mm_reset_prose"):
                section_by_key = {}
                existing_sections = []
                st.session_state['_mm_prose_rev'] = st.session_state.get('_mm_prose_rev', 0) + 1
            prose_rev = st.session_state.get('_mm_prose_rev', 0)

            expanded_sections = []
            for idx, def_sec in enumerate(default_sections):
                sec_key = def_sec.get('key', f'sec_{idx}')
                cur = section_by_key.get(sec_key, {})
                heading_val = cur.get('heading', def_sec.get('heading', ''))
                lines_val = cur.get('lines') or def_sec.get('lines', [])
                col_h, col_t = st.columns([1, 4])
                with col_h:
                    heading_edit = st.text_input("Heading", value=heading_val, key=f"mm_sec_{sec_key}_head_{prose_rev}")
                with col_t:
                    lines_edit = st.text_area(
                        def_sec.get('heading', sec_key),
                        value="\n".join(lines_val),
                        height=max(70, len(lines_val) * 16),
                        key=f"mm_sec_{sec_key}_lines_{prose_rev}"
                    )
                expanded_sections.append({
                    "key": sec_key,
                    "heading": heading_edit.strip(),
                    "lines": [l.strip() for l in lines_edit.split("\n") if l.strip()]
                })

            if 'intake' not in res:
                res['intake'] = {}

            res['intake']['middlemanAgreement'] = {
                "partnerName": partner_name.strip(),
                "partnerEmail": partner_email.strip(),
                "effectiveDate": eff_date.strip(),
                "developerName": dev_name.strip(),
                "developerEmail": dev_email.strip(),
                "tier1Commission": t1_comm.strip(),
                "tier2Commission": t2_comm.strip(),
                "tier3Commission": t3_comm.strip(),
                "recurringCommission": rec_comm.strip(),
                "agreedElectronically": agreed_edit.strip(),
                "disbursementRules": disburse_list,
                "confidentialityRules": confid_list,
                "sections": expanded_sections
            }

            target_pdf = "Sales_Partner_Agreement.pdf"

            col_b1, col_b2 = st.columns([1, 1])
            with col_b1:
                import re as _re, tempfile, json as _json, subprocess
                safe_partner = _re.sub(r'[^A-Za-z0-9]+', '_', partner_name.strip()).strip('_') or 'Partner'
                if st.button("📄 Build Current Agreement PDF", key="btn_build_mm_pdf"):
                    try:
                        gen_pdf = None
                        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as tmp_cfg:
                            _json.dump({'intake': {'middlemanAgreement': res['intake']['middlemanAgreement']}}, tmp_cfg)
                            cfg_path = tmp_cfg.name
                        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_pdf:
                            pdf_path = tmp_pdf.name
                        proc = subprocess.run(
                            ['node', 'scripts/generate-middleman-pdf.mjs', '--config', cfg_path, '--out', pdf_path],
                            capture_output=True,
                            text=True
                        )
                        os.unlink(cfg_path)
                        if proc.returncode == 0 and os.path.exists(pdf_path):
                            with open(pdf_path, 'rb') as f:
                                gen_pdf = f.read()
                            os.unlink(pdf_path)
                            st.session_state['mm_pdf_bytes'] = gen_pdf
                            st.session_state['mm_pdf_name'] = f"{safe_partner}_Sales_Partner_Agreement.pdf"
                            st.success("📄 Agreement built from current form values!")
                        else:
                            st.session_state.pop('mm_pdf_bytes', None)
                            st.error(f"Failed to generate PDF: {proc.stderr}")
                    except Exception as e:
                        st.error(f"Error generating PDF: {e}")

                if st.session_state.get('mm_pdf_bytes'):
                    st.download_button(
                        label="📥 Download Partnership Agreement PDF",
                        data=st.session_state['mm_pdf_bytes'],
                        file_name=st.session_state.get('mm_pdf_name', target_pdf),
                        mime="application/pdf",
                        key="btn_download_mm_pdf"
                    )
                else:
                    st.info("📄 Click 'Build Current Agreement PDF' to generate the download.")

        # Project Intake & Questionnaire Config
        with st.container(border=True):
            st.markdown('<div class="section-header">Project Scoping Brief & T&C Config</div>', unsafe_allow_html=True)
            
            in_title = st.text_input("Form & PDF Title", value=intake_data.get('title', 'PROJECT DISCOVERY & SCOPING BRIEF'), key="intake_title")
            in_sub = st.text_area("Form Subtitle Description", value=intake_data.get('subtitle', ''), height=60, key="intake_sub")

            st.markdown("##### Feature Modules Options (One per line)")
            feat_opts_str = "\n".join(intake_data.get('featureOptions', []))
            feat_opts_edit = st.text_area("Feature Options", value=feat_opts_str, height=90, key="intake_feats")
            feat_opts_list = [f.strip() for f in feat_opts_edit.split("\n") if f.strip()]

            st.markdown("##### Standard Terms & Conditions (One per line)")
            tc_str = "\n".join(intake_data.get('termsAndConditions', []))
            tc_edit = st.text_area("Terms & Conditions List", value=tc_str, height=140, key="intake_tc")
            tc_list = [t.strip() for t in tc_edit.split("\n") if t.strip()]

            res['intake']['title'] = in_title.strip()
            res['intake']['subtitle'] = in_sub.strip()
            res['intake']['featureOptions'] = feat_opts_list
            res['intake']['termsAndConditions'] = tc_list

    # ──────────────────────────────────────────────────────────
    # SAVE BUTTON & LIVE JSON CODE VIEW (Global Footer)
    # ──────────────────────────────────────────────────────────
    st.markdown("---")
    dry_run_resume = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_resume")
    if st.button("💾 Save Resume Changes", type="primary", key="btn_save_resume_changes", use_container_width=True):
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
