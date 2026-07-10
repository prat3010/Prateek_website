import streamlit as st
import os
from sync_tabs.shared import (
    HAS_PIL,
    st_image_safe,
    save_uploaded_image,
    git_commit_push_file
)

def render_photos_tab():
    st.markdown('<div class="section-header">Update Hero & About Photos</div>', unsafe_allow_html=True)
    st.write("Upload new images to replace the background/profile illustrations on your portfolio site.")
    
    dry_run_photo = st.checkbox("Dry-Run Mode (Save locally only, do not push to remote)", value=True, key="dry_photo")
    
    if not HAS_PIL:
        st.info("💡 **Tip**: Install Pillow (`pip install pillow`) in your project environment to automatically convert any uploaded image (PNG, JPG, WebP) to the correct format required by the website.")

    # WebP Optimization Settings
    opt_quality = 80
    max_width = None
    if HAS_PIL:
        with st.expander("🖼️ WebP Optimization Settings", expanded=True):
            opt_quality = st.slider("WebP Compression Quality", 50, 100, 80, help="Lower value decreases file size but reduces quality. 80 is the recommended default.")
            resize_mode = st.selectbox(
                "Resize Width Constraint:", 
                ["No Resize", "Responsive Hero (1600px)", "Responsive Portrait (800px)"], 
                index=0,
                help="Reduces image dimensions if the uploaded image exceeds this width, saving massive bandwidth."
            )
            if resize_mode == "Responsive Hero (1600px)":
                max_width = 1600
            elif resize_mode == "Responsive Portrait (800px)":
                max_width = 800

    # 1. Hero Section Photos
    st.markdown("## Hero Section Photos")
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Hero - Noir Mode")
        st.caption("Target: `public/images/hero-noir.webp` (WebP)")
        hero_noir_path = "public/images/hero-noir.webp"
        if os.path.exists(hero_noir_path):
            st_image_safe(hero_noir_path, caption="Current Noir Hero", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_hero_noir = st.file_uploader("Upload New Noir Hero Image", type=["png", "jpg", "jpeg", "webp"], key="up_hero_noir")
        if up_hero_noir is not None:
            if st.button("Replace Noir Hero Image", key="btn_hero_noir", type="primary"):
                success, msg, metrics = save_uploaded_image(up_hero_noir, hero_noir_path, "WEBP", max_width=max_width, quality=opt_quality)
                if success:
                    report = ""
                    if metrics:
                        orig = metrics["original_size"] / 1024
                        opt = metrics["optimized_size"] / 1024
                        red = metrics["reduction_pct"]
                        report = f"\n\n📊 **Size Optimization Report:**\n* Original: {orig:.1f} KB\n* Optimized: {opt:.1f} KB\n* Reduced: **{red:.1f}% smaller!**"
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(hero_noir_path, "chore(photos): update hero noir image")
                        if git_ok:
                            st.success(f"🖼️ {msg}{report}\n\n{git_msg}")
                        else:
                            st.success(f"🖼️ {msg}{report}\n\n⚠️ Git failed: {git_msg}")
                    else:
                        st.success(f"🖼️ {msg}{report}")
                    st.rerun()
                else:
                    st.error(msg)
                    
    with col2:
        st.subheader("Hero - Comic Mode")
        st.caption("Target: `public/images/hero-illustration-wavy.webp` (WebP)")
        hero_comic_path = "public/images/hero-illustration-wavy.webp"
        if os.path.exists(hero_comic_path):
            st_image_safe(hero_comic_path, caption="Current Comic Hero", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_hero_comic = st.file_uploader("Upload New Comic Hero Image", type=["png", "jpg", "jpeg", "webp"], key="up_hero_comic")
        if up_hero_comic is not None:
            if st.button("Replace Comic Hero Image", key="btn_hero_comic", type="primary"):
                success, msg, metrics = save_uploaded_image(up_hero_comic, hero_comic_path, "WEBP", max_width=max_width, quality=opt_quality)
                if success:
                    report = ""
                    if metrics:
                        orig = metrics["original_size"] / 1024
                        opt = metrics["optimized_size"] / 1024
                        red = metrics["reduction_pct"]
                        report = f"\n\n📊 **Size Optimization Report:**\n* Original: {orig:.1f} KB\n* Optimized: {opt:.1f} KB\n* Reduced: **{red:.1f}% smaller!**"
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(hero_comic_path, "chore(photos): update hero comic image")
                        if git_ok:
                            st.success(f"🖼️ {msg}{report}\n\n{git_msg}")
                        else:
                            st.success(f"🖼️ {msg}{report}\n\n⚠️ Git failed: {git_msg}")
                    else:
                        st.success(f"🖼️ {msg}{report}")
                    st.rerun()
                else:
                    st.error(msg)

    st.markdown("---")
    
    # 2. About Section Photos
    st.markdown("## About Section Photos")
    col3, col4 = st.columns(2)
    
    with col3:
        st.subheader("About Portrait - Noir Mode")
        st.caption("Target: `public/images/profile-noir.webp` (WebP)")
        profile_noir_path = "public/images/profile-noir.webp"
        if os.path.exists(profile_noir_path):
            st_image_safe(profile_noir_path, caption="Current Noir Profile", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_profile_noir = st.file_uploader("Upload New Noir Profile Image", type=["png", "jpg", "jpeg", "webp"], key="up_profile_noir")
        if up_profile_noir is not None:
            if st.button("Replace Noir Profile Image", key="btn_profile_noir", type="primary"):
                success, msg, metrics = save_uploaded_image(up_profile_noir, profile_noir_path, "WEBP", max_width=max_width, quality=opt_quality)
                if success:
                    report = ""
                    if metrics:
                        orig = metrics["original_size"] / 1024
                        opt = metrics["optimized_size"] / 1024
                        red = metrics["reduction_pct"]
                        report = f"\n\n📊 **Size Optimization Report:**\n* Original: {orig:.1f} KB\n* Optimized: {opt:.1f} KB\n* Reduced: **{red:.1f}% smaller!**"
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(profile_noir_path, "chore(photos): update profile noir image")
                        if git_ok:
                            st.success(f"🖼️ {msg}{report}\n\n{git_msg}")
                        else:
                            st.success(f"🖼️ {msg}{report}\n\n⚠️ Git failed: {git_msg}")
                    else:
                        st.success(f"🖼️ {msg}{report}")
                    st.rerun()
                else:
                    st.error(msg)
                    
    with col4:
        st.subheader("About Portrait - Comic Mode")
        st.caption("Target: `public/images/profile-comic.webp` (WebP)")
        profile_comic_path = "public/images/profile-comic.webp"
        if os.path.exists(profile_comic_path):
            st_image_safe(profile_comic_path, caption="Current Comic Profile", width="stretch")
        else:
            st.warning("No image currently found at target path.")
            
        up_profile_comic = st.file_uploader("Upload New Comic Profile Image", type=["png", "jpg", "jpeg", "webp"], key="up_profile_comic")
        if up_profile_comic is not None:
            if st.button("Replace Comic Profile Image", key="btn_profile_comic", type="primary"):
                success, msg, metrics = save_uploaded_image(up_profile_comic, profile_comic_path, "WEBP", max_width=max_width, quality=opt_quality)
                if success:
                    report = ""
                    if metrics:
                        orig = metrics["original_size"] / 1024
                        opt = metrics["optimized_size"] / 1024
                        red = metrics["reduction_pct"]
                        report = f"\n\n📊 **Size Optimization Report:**\n* Original: {orig:.1f} KB\n* Optimized: {opt:.1f} KB\n* Reduced: **{red:.1f}% smaller!**"
                    if not dry_run_photo:
                        git_ok, git_msg = git_commit_push_file(profile_comic_path, "chore(photos): update profile comic image")
                        if git_ok:
                            st.success(f"🖼️ {msg}{report}\n\n{git_msg}")
                        else:
                            st.success(f"🖼️ {msg}{report}\n\n⚠️ Git failed: {git_msg}")
                    else:
                        st.success(f"🖼️ {msg}{report}")
                    st.rerun()
                else:
                    st.error(msg)
