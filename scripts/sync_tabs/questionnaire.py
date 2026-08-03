import json
import os
import streamlit as st
from streamlit.column_config import NumberColumn, SelectboxColumn, TextColumn

from sync_tabs.shared import SCRIPTS_DIR, write_resume_file, git_commit_push_file
from sync_validation import validate_questionnaire

DEFAULTS_PATH = os.path.join(
    os.path.dirname(SCRIPTS_DIR), "src", "data", "intakeQuestionnaireDefaults.json",
)

PRICE_COLS = ("priceINR", "priceUSD")


def _load_defaults():
    with open(DEFAULTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _ensure_sections(intake):
    defaults = _load_defaults()
    for key, fallback in defaults.items():
        if not isinstance(intake.get(key), list) or not intake.get(key):
            intake[key] = [dict(item) for item in fallback]
    if not isinstance(intake.get("timelineOptions"), list) or not intake["timelineOptions"]:
        intake["timelineOptions"] = [
            "Express Delivery Sprint (7–10 Days - Rush Fee Applies)",
            "Standard Turnaround (2–4 Weeks)",
            "Flexible Timeline",
        ]


def _keep_fields(row, fields):
    clean = {}
    for field in fields:
        value = row.get(field)
        if value is None:
            continue
        if isinstance(value, float) and value.is_integer():
            value = int(value)
        clean[field] = value
    return clean


def _split_list_field(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _editor_or_empty(editor_value):
    return editor_value if isinstance(editor_value, list) else []


def render_questionnaire_tab():
    res = st.session_state.resume
    if res is None:
        st.error("Could not load resume.json. Please verify the file is present.")
        return
    if "intake" not in res or not isinstance(res.get("intake"), dict):
        res["intake"] = {}
    intake = res["intake"]
    _ensure_sections(intake)

    st.markdown(
        '<div class="section-header">🧾 Scoping Questionnaire Config</div>',
        unsafe_allow_html=True,
    )
    st.caption(
        "Edits the Project Scoping Lab & Instant Quote wizard at /scoping: base engines, feature "
        "modules, goal archetypes, brand asset tiers, care plans, and timeline options. Saving "
        "writes to Supabase, updates src/data/resume.json, and revalidates the site cache."
    )

    # 1. Base Engines
    with st.container(border=True):
        st.markdown("##### 1. Base Platform Engines (Tier Pricing)")
        intake["engines"] = _editor_or_empty(st.data_editor(
            intake["engines"],
            key="qe_engines",
            num_rows="dynamic",
            height=220,
            column_config={
                "id": TextColumn("ID", required=True),
                "title": TextColumn("Title", required=True),
                "tier": TextColumn("Tier", required=True),
                "priceINR": NumberColumn("Price INR", min_value=0, step=1000, format="%d", required=True),
                "priceUSD": NumberColumn("Price USD", min_value=0, step=50, format="%d", required=True),
                "laymanDescription": TextColumn("Plain Description", required=True),
                "techSpecs": TextColumn("Tech Specs", required=True),
            },
        ))

    # 2. Feature Modules
    with st.container(border=True):
        st.markdown("##### 2. Add-On Feature Modules")
        intake["features"] = _editor_or_empty(st.data_editor(
            intake["features"],
            key="qe_features",
            num_rows="dynamic",
            height=260,
            column_config={
                "id": TextColumn("ID", required=True),
                "label": TextColumn("Label", required=True),
                "priceINR": NumberColumn("Price INR", min_value=0, step=1000, format="%d", required=True),
                "priceUSD": NumberColumn("Price USD", min_value=0, step=50, format="%d", required=True),
                "laymanDescription": TextColumn("Plain Description", required=True),
                "techSpecs": TextColumn("Tech Specs", required=True),
            },
        ))

    # 3. Goal Archetypes
    with st.container(border=True):
        st.markdown("##### 3. Goal Archetypes (Recommended Config + Compulsory Features)")
        st.caption("List compulsory feature labels separated by commas.")
        goal_rows = [
            {
                **goal,
                "compulsoryFeatureLabels": ", ".join(goal.get("compulsoryFeatureLabels", [])),
            }
            for goal in intake["goals"]
        ]
        edited_goals = st.data_editor(
            goal_rows,
            key="qe_goals",
            num_rows="dynamic",
            height=300,
            column_config={
                "id": TextColumn("ID", required=True),
                "label": TextColumn("Label (with emoji)", required=True),
                "shortLabel": TextColumn("Short Label", required=True),
                "description": TextColumn("Description", required=True),
                "recommendedEngineId": SelectboxColumn(
                    "Recommended Engine", required=True,
                    options=[e["id"] for e in intake["engines"]],
                ),
                "compulsoryFeatureLabels": TextColumn("Compulsory Feature Labels", required=True),
            },
        )
        intake["goals"] = [
            _keep_fields(
                row,
                ("id", "label", "shortLabel", "description", "recommendedEngineId", "compulsoryFeatureLabels"),
            )
            for row in _editor_or_empty(edited_goals)
        ]
        for goal in intake["goals"]:
            goal["compulsoryFeatureLabels"] = _split_list_field(goal.get("compulsoryFeatureLabels"))

    # 4. Brand Asset Options
    with st.container(border=True):
        st.markdown("##### 4. Brand Asset Options")
        intake["brandAssets"] = _editor_or_empty(st.data_editor(
            intake["brandAssets"],
            key="qe_brand_assets",
            num_rows="dynamic",
            height=180,
            column_config={
                "id": TextColumn("ID", required=True),
                "label": TextColumn("Label", required=True),
                "priceINR": NumberColumn("Price INR", min_value=0, step=1000, format="%d", required=True),
                "priceUSD": NumberColumn("Price USD", min_value=0, step=50, format="%d", required=True),
                "description": TextColumn("Description", required=True),
            },
        ))

    # 5. Maintenance Plans
    with st.container(border=True):
        st.markdown("##### 5. Care & Maintenance Plans")
        st.caption("List 'includes' items separated by commas.")
        plan_rows = [
            {**plan, "includes": ", ".join(plan.get("includes", []))}
            for plan in intake["maintenancePlans"]
        ]
        edited_plans = st.data_editor(
            plan_rows,
            key="qe_maintenance_plans",
            num_rows="dynamic",
            height=280,
            column_config={
                "id": TextColumn("ID", required=True),
                "name": TextColumn("Plan Name", required=True),
                "priceINR": NumberColumn("Price INR", min_value=0, step=500, format="%d", required=True),
                "priceUSD": NumberColumn("Price USD", min_value=0, step=10, format="%d", required=True),
                "period": TextColumn("Period", required=True),
                "badge": TextColumn("Badge", required=True),
                "laymanDescription": TextColumn("Plain Description", required=True),
                "techSpecs": TextColumn("Tech Specs", required=True),
                "includes": TextColumn("Includes", required=True),
            },
        )
        intake["maintenancePlans"] = [
            _keep_fields(
                row,
                ("id", "name", "priceINR", "priceUSD", "period", "badge", "laymanDescription", "techSpecs", "includes"),
            )
            for row in _editor_or_empty(edited_plans)
        ]
        for plan in intake["maintenancePlans"]:
            plan["includes"] = _split_list_field(plan.get("includes"))

    # 6. Timeline Options
    with st.container(border=True):
        st.markdown("##### 6. Timeline Options (One per line)")
        tl_edit = st.text_area(
            "Timeline Options",
            value="\n".join(intake["timelineOptions"]),
            height=90,
            key="qe_timeline",
        )
        intake["timelineOptions"] = [t.strip() for t in tl_edit.split("\n") if t.strip()]

    # ──────────────────────────────────────────────────────────
    # RESET, SAVE & LIVE JSON VIEW
    # ──────────────────────────────────────────────────────────
    st.markdown("---")
    col_reset, col_save = st.columns([1, 4])
    with col_reset:
        if st.button("🔄 Reset to Defaults", key="btn_reset_questionnaire", use_container_width=True):
            for key, value in _load_defaults().items():
                intake[key] = [dict(item) for item in value]
            for widget_key in (
                "qe_engines", "qe_features", "qe_goals", "qe_brand_assets",
                "qe_maintenance_plans", "qe_timeline",
            ):
                if widget_key in st.session_state:
                    del st.session_state[widget_key]
            st.success("Questionnaire reset to defaults. Review and Save to persist.")
            st.rerun()
    with col_save:
        dry_run = st.checkbox(
            "Dry-Run Mode (Save locally only, do not push to remote)",
            value=True,
            key="dry_questionnaire",
        )
        if st.button("💾 Save Questionnaire Changes", type="primary", key="btn_save_questionnaire", use_container_width=True):
            errors = validate_questionnaire(
                intake["engines"],
                intake["features"],
                intake["goals"],
                intake["brandAssets"],
                intake["maintenancePlans"],
            )
            if errors:
                st.error(f"Validation failed ({len(errors)} issue(s)) — nothing saved:")
                for issue in errors:
                    st.markdown(f"- {issue}")
            else:
                try:
                    write_resume_file(res)
                    st.success("Questionnaire saved to Supabase + src/data/resume.json!")
                    if not dry_run:
                        st.info("🚀 Pushing changes to GitHub...")
                        git_ok, git_msg = git_commit_push_file(
                            "src/data/resume.json",
                            "chore(resume): update scoping questionnaire config",
                        )
                        if git_ok:
                            st.toast(f"📝 Questionnaire saved and {git_msg}")
                        else:
                            st.error(f"❌ Git failed: {git_msg}")
                except Exception as e:
                    st.error(f"Failed to save questionnaire: {e}")

    with st.expander("🔍 Live JSON View (Intake Config)", expanded=False):
        st.code(json.dumps(intake, indent=2), language="json")
