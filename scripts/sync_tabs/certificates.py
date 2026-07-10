import streamlit as st
import os
import re
import base64
from datetime import datetime
from sync_tabs.shared import (
    call_gemini,
    validate_certificate_response,
    parse_certificates_file,
    write_certificates_file,
    check_and_add_pending_skills,
    parse_resume_file,
    write_resume_file,
    st_image_safe,
    save_uploaded_image,
    delete_existing_files,
    delete_certificate,
    run_safe_git_command,
    HAS_SYNC,
    run_async_task,
    get_mime_type,
    slugify
)
from sync_assets import copy_to_staged_file, finalize_staged_file, cleanup_staged_file
from sync_git import commit_and_push_paths

def render_certificates_tab():
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
                            # Ensure lastSynced dict exists
                            if 'lastSynced' not in resume:
                                resume['lastSynced'] = {}
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
                    
                    tags = cert.get("tags", [])
                    if tags:
                        tags_html = " ".join([f'<span class="skill-capsule-preview" style="box-shadow: 0 4px 10px rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.08); padding: 2px 10px; font-size: 0.7rem; margin-right: 4px; margin-bottom: 4px;"><span class="skill-capsule-dot" style="background-color: #2979ff;"></span>{t}</span>' for t in tags])
                        st.markdown(f'<div style="display: flex; flex-wrap: wrap; margin-bottom: 12px;">{tags_html}</div>', unsafe_allow_html=True)
                        
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
