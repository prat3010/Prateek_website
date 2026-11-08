import os
import sys
import json
import hashlib
import streamlit as st

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPTS_DIR = os.path.join(ROOT_DIR, 'scripts')
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

from sync_supabase import upsert_record, upload_storage_file, _has_config
from sync_json import atomic_write_json
from sync_tabs.shared import trigger_revalidation

PLAYGROUND_JSON_PATH = os.path.join(ROOT_DIR, 'src', 'data', 'playgroundItems.json')

def load_local_playground_items():
    if os.path.exists(PLAYGROUND_JSON_PATH):
        try:
            with open(PLAYGROUND_JSON_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            st.error(f"Error loading playgroundItems.json: {e}")
    return []

def compute_package_hash(uploaded_file):
    hasher = hashlib.sha256()
    uploaded_file.seek(0)
    while chunk := uploaded_file.read(65536):
        hasher.update(chunk)
    uploaded_file.seek(0)
    return hasher.hexdigest()

def render_playground_tab():
    st.markdown("""
    <div style="padding: 12px 14px; margin-bottom: 20px; background: #0d0d0d; border: 1px solid #222222; border-radius: 8px;">
        <h3 style="margin: 0; color: #ffffff; font-family: 'Inter', sans-serif;">🎮 Playground & Micro-SaaS Publishing Engine</h3>
        <p style="margin: 4px 0 0 0; color: #888888; font-size: 0.85rem;">
            Catalog management, commercial pricing tiers, digital release package uploads, and SHA-256 integrity verification.
        </p>
    </div>
    """, unsafe_allow_html=True)

    items = load_local_playground_items()
    slug_to_item = {item.get('slug'): item for item in items}

    mode = st.radio(
        "Operation Mode:",
        ["Edit Existing Item", "➕ Publish New Micro-SaaS Product"],
        horizontal=True,
        key="playground_mode_radio"
    )

    selected_item = {}
    if mode == "Edit Existing Item":
        if not items:
            st.warning("No playground items found in local catalog.")
            return

        item_options = [f"{item.get('title', 'Untitled')} ({item.get('slug')})" for item in items]
        selected_index = st.selectbox(
            "Select Creation / Product to Edit:",
            range(len(items)),
            format_func=lambda i: item_options[i],
            key="playground_item_selector"
        )
        selected_item = items[selected_index]
    else:
        selected_item = {
            "id": "saas-new-product",
            "slug": "new-micro-saas",
            "title": "New Micro-SaaS Product",
            "tagline": "Turnkey production-ready solution.",
            "description": "Comprehensive full-stack codebase with documentation.",
            "kind": "saas",
            "taxonomy": "commercial",
            "isCommercial": True,
            "priceINR": 2499,
            "priceUSD": 29,
            "pricingModel": "Commercial Release + Open Core",
            "status": "live",
            "version": "1.0.0",
            "licenseType": "commercial_single",
            "featured": False,
            "tags": ["Micro-SaaS", "Turnkey", "Production"],
            "techStack": ["Next.js", "TypeScript", "FastAPI"],
            "highlights": ["Turnkey deployment", "Commercial resale license"],
            "showcaseProjects": [],
            "pricingTiers": []
        }

    st.markdown("---")
    
    # ── Section 1: General Metadata ──
    with st.expander("1. General Metadata & Classification", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            title = st.text_input("Title:", value=selected_item.get("title", ""))
            slug = st.text_input("Slug (Unique Identifier):", value=selected_item.get("slug", ""))
            tagline = st.text_input("Tagline:", value=selected_item.get("tagline", ""))
            item_id = st.text_input("Item ID:", value=selected_item.get("id", f"item-{slug}"))
        
        with col2:
            kind_options = ['saas', 'interactive-toy', 'generative-media', 'cognitive-tool', 'experiment']
            current_kind = selected_item.get("kind", "saas")
            kind_idx = kind_options.index(current_kind) if current_kind in kind_options else 0
            kind = st.selectbox("Kind:", kind_options, index=kind_idx)

            taxonomy_options = ['commercial', 'toys-and-games', 'ecosystem']
            current_tax = selected_item.get("taxonomy", "commercial" if selected_item.get("isCommercial") else "toys-and-games")
            tax_idx = taxonomy_options.index(current_tax) if current_tax in taxonomy_options else 0
            taxonomy = st.selectbox("Taxonomy Classification:", taxonomy_options, index=tax_idx)

            status_options = ['live', 'beta', 'concept', 'archived']
            current_status = selected_item.get("status", "live")
            status_idx = status_options.index(current_status) if current_status in status_options else 0
            status = st.selectbox("Status:", status_options, index=status_idx)

            featured = st.checkbox("Featured on Homepage / Gallery Top", value=selected_item.get("featured", False))

        description = st.text_area("Full Description:", value=selected_item.get("description", ""), height=100)
        
        col3, col4 = st.columns(2)
        with col3:
            tags_str = st.text_input("Tags (comma-separated):", value=", ".join(selected_item.get("tags", [])))
            metrics_badge = st.text_input("Metrics Badge (e.g. FLAGSHIP COMMERCIAL PACK):", value=selected_item.get("metricsBadge", ""))
        with col4:
            preview_image = st.text_input("Preview Image Path:", value=selected_item.get("previewImage", "/images/project-synchronizer.webp"))
            vibe_date = st.text_input("Vibe Coded Date (YYYY-MM-DD):", value=selected_item.get("vibeCodedDate", "2026-11-08"))

    # ── Section 2: Commerce & Pricing Engine ──
    with st.expander("2. Commerce, Licensing & Pricing Engine", expanded=True):
        is_commercial = st.checkbox("Is Commercial Product (Requires Payment)", value=selected_item.get("isCommercial", False))
        
        col_c1, col_c2, col_c3 = st.columns(3)
        with col_c1:
            price_inr = st.number_input("Price INR (₹):", min_value=0, value=int(selected_item.get("priceINR") or 2499) if is_commercial else 0, step=100)
        with col_c2:
            price_usd = st.number_input("Price USD ($):", min_value=0, value=int(selected_item.get("priceUSD") or 29) if is_commercial else 0, step=5)
        with col_c3:
            pricing_model = st.text_input("Pricing Model:", value=selected_item.get("pricingModel", "Commercial Release + Open Core" if is_commercial else "Free"))

        license_types = ['free', 'personal', 'commercial_single', 'commercial_unlimited', 'cloud_pass']
        current_lic = selected_item.get("licenseType", "commercial_single" if is_commercial else "free")
        lic_idx = license_types.index(current_lic) if current_lic in license_types else 0
        license_type = st.selectbox("License Grant:", license_types, index=lic_idx)

        # Pricing Tiers JSON
        tiers_json_str = json.dumps(selected_item.get("pricingTiers", []), indent=2)
        pricing_tiers_input = st.text_area("Pricing Tiers (JSON Array of { id, title, priceINR, priceUSD, features }):", value=tiers_json_str, height=120)

    # ── Section 3: Architecture & Source Configuration ──
    with st.expander("3. Architecture, Codebase & Integration Rails", expanded=True):
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            component_name = st.text_input("Interactive React Component (null for Headless Stage):", value=selected_item.get("componentName") or "")
            app_url = st.text_input("App / Detail Route URL:", value=selected_item.get("appUrl", f"/playground/{slug}"))
            github_url = st.text_input("Public GitHub Link (Open Core or Reference):", value=selected_item.get("githubUrl", ""))
        with col_s2:
            github_repo_source = st.text_input("Private GitHub Repo for Invites (owner/repo):", value=selected_item.get("githubRepoSource", ""))
            version = st.text_input("Release Version:", value=selected_item.get("version", "1.0.0"))

        tech_stack_str = st.text_input("Tech Stack (comma-separated):", value=", ".join(selected_item.get("techStack", [])))
        
        highlights_val = selected_item.get("highlights", [])
        highlights_str = st.text_area("Highlights / Features (one per line):", value="\n".join(highlights_val), height=100)

        showcase_json_str = json.dumps(selected_item.get("showcaseProjects", []), indent=2)
        showcase_input = st.text_area("Built With This Showcase Projects (JSON Array):", value=showcase_json_str, height=120)

    # ── Section 4: Digital Package Release & SHA-256 Checksum ──
    with st.expander("4. Digital Release Package Uploader & SHA-256 Checksum", expanded=True):
        st.markdown("""
        Upload the `.zip` archive to be served from the private `playground-releases` Supabase bucket.
        Integrity hashes (SHA-256) and package sizes are calculated automatically.
        """)
        
        uploaded_file = st.file_uploader("Select Distribution ZIP Package:", type=["zip", "tar", "gz"], key="playground_file_uploader")
        
        computed_hash = selected_item.get("checksumSha256", "")
        computed_size = selected_item.get("fileSize", "")
        download_package_key = selected_item.get("downloadPackageKey", "")

        if uploaded_file is not None:
            raw_bytes = uploaded_file.getvalue()
            size_mb = len(raw_bytes) / (1024 * 1024)
            computed_size = f"{size_mb:.1f} MB"
            computed_hash = hashlib.sha256(raw_bytes).hexdigest()
            
            st.info(f"📦 Archive Selected: **{uploaded_file.name}** | Size: **{computed_size}** | SHA-256: `{computed_hash}`")
            
            if size_mb > 250:
                st.error("❌ File size exceeds 250 MB production quota.")
            elif size_mb > 50:
                st.warning("⚠️ File exceeds 50 MB (Supabase Free tier limit). Ensure Pro tier storage is enabled.")

            target_storage_path = f"{slug}/{uploaded_file.name}"
            if st.button("🚀 Upload Package to Private Supabase Storage", key="btn_upload_pkg"):
                with st.spinner(f"Streaming package to playground-releases/{target_storage_path}..."):
                    success, msg = upload_storage_file('playground-releases', target_storage_path, raw_bytes, uploaded_file.type or 'application/zip')
                    if success:
                        download_package_key = target_storage_path
                        st.success(f"✅ Uploaded to `playground-releases/{target_storage_path}`!")
                    else:
                        st.error(f"❌ Upload failed: {msg}")

        col_p1, col_p2, col_p3 = st.columns(3)
        with col_p1:
            final_pkg_key = st.text_input("Storage Package Key:", value=download_package_key)
        with col_p2:
            final_size = st.text_input("File Size String:", value=computed_size)
        with col_p3:
            final_checksum = st.text_input("SHA-256 Checksum:", value=computed_hash)

    # ── Section 5: Persistence & Publishing Action ──
    st.markdown("---")
    col_act1, col_act2 = st.columns(2)
    
    with col_act1:
        if st.button("💾 Save & Sync to Supabase + JSON", use_container_width=True, type="primary"):
            # Parse tags and arrays
            parsed_tags = [t.strip() for t in tags_str.split(",") if t.strip()]
            parsed_tech = [t.strip() for t in tech_stack_str.split(",") if t.strip()]
            parsed_highlights = [h.strip() for h in highlights_str.split("\n") if h.strip()]
            
            try:
                parsed_tiers = json.loads(pricing_tiers_input) if pricing_tiers_input.strip() else []
            except Exception as e:
                st.error(f"Invalid JSON in Pricing Tiers: {e}")
                return

            try:
                parsed_showcase = json.loads(showcase_input) if showcase_input.strip() else []
            except Exception as e:
                st.error(f"Invalid JSON in Showcase Projects: {e}")
                return

            # Construct item payload
            updated_item = {
                "id": item_id.strip() or f"saas-{slug.strip()}",
                "slug": slug.strip(),
                "title": title.strip(),
                "tagline": tagline.strip(),
                "description": description.strip(),
                "kind": kind,
                "taxonomy": taxonomy,
                "isCommercial": is_commercial,
                "priceINR": price_inr if is_commercial else None,
                "priceUSD": price_usd if is_commercial else None,
                "pricingModel": pricing_model.strip(),
                "pricingTiers": parsed_tiers,
                "status": status,
                "featured": featured,
                "metricsBadge": metrics_badge.strip(),
                "previewImage": preview_image.strip(),
                "vibeCodedDate": vibe_date.strip(),
                "tags": parsed_tags,
                "techStack": parsed_tech,
                "highlights": parsed_highlights,
                "appUrl": app_url.strip(),
                "githubUrl": github_url.strip(),
                "componentName": component_name.strip() if component_name.strip() else None,
                "githubRepoSource": github_repo_source.strip() if github_repo_source.strip() else None,
                "downloadPackageKey": final_pkg_key.strip() if final_pkg_key.strip() else None,
                "fileSize": final_size.strip() if final_size.strip() else None,
                "checksumSha256": final_checksum.strip() if final_checksum.strip() else None,
                "version": version.strip(),
                "licenseType": license_type,
                "showcaseProjects": parsed_showcase,
            }

            # 1. Update local list
            existing_idx = None
            for idx, item in enumerate(items):
                if item.get("slug") == updated_item["slug"]:
                    existing_idx = idx
                    break

            if existing_idx is not None:
                items[existing_idx] = updated_item
            else:
                items.append(updated_item)

            # 2. Atomic write to playgroundItems.json
            try:
                atomic_write_json(PLAYGROUND_JSON_PATH, items)
                st.success(f"✓ Saved '{updated_item['title']}' to local JSON catalog.")
            except Exception as e:
                st.error(f"Failed to write to playgroundItems.json: {e}")
                return

            # 3. Upsert to Supabase if config available
            if _has_config():
                db_record = {
                    "slug": updated_item["slug"],
                    "title": updated_item["title"],
                    "tagline": updated_item["tagline"],
                    "description": updated_item["description"],
                    "kind": updated_item["kind"],
                    "taxonomy": updated_item["taxonomy"],
                    "is_commercial": updated_item["isCommercial"],
                    "price_inr": updated_item["priceINR"],
                    "price_usd": updated_item["priceUSD"],
                    "pricing_model": updated_item["pricingModel"],
                    "pricing_tiers": updated_item["pricingTiers"],
                    "status": updated_item["status"],
                    "featured": updated_item["featured"],
                    "metrics_badge": updated_item["metricsBadge"],
                    "preview_image": updated_item["previewImage"],
                    "vibe_coded_date": updated_item["vibeCodedDate"],
                    "tags": updated_item["tags"],
                    "tech_stack": updated_item["techStack"],
                    "highlights": updated_item["highlights"],
                    "app_url": updated_item["appUrl"],
                    "github_url": updated_item["githubUrl"],
                    "component_name": updated_item["componentName"],
                    "github_repo_source": updated_item["githubRepoSource"],
                    "download_package_key": updated_item["downloadPackageKey"],
                    "file_size": updated_item["fileSize"],
                    "checksum_sha256": updated_item["checksumSha256"],
                    "version": updated_item["version"],
                    "license_type": updated_item["licenseType"],
                    "showcase_projects": updated_item["showcaseProjects"],
                }
                res = upsert_record('playground_products', db_record, key_col='slug')
                if res is not None:
                    st.success("✓ Upserted record to Supabase `playground_products`.")
                else:
                    st.warning("Notice: Supabase upsert failed or offline.")

            # 4. Trigger Next.js cache revalidation
            trigger_revalidation()
            st.toast("⚡ Next.js cache revalidated for playground items!")
            st.rerun()

    with col_act2:
        if st.button("🔄 Purge Next.js Cache Only", use_container_width=True):
            trigger_revalidation()
            st.toast("🧹 Cache revalidation signal sent.")
