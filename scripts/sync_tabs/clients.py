"""
Clients & Scoping Leads Tab Handler for Streamlit Synchronizer.
Provides lead triage, pipeline metrics, status updating, internal notes, and email response generation.
"""

import urllib.parse
import streamlit as st
from sync_supabase import fetch_intake_leads, update_intake_lead, delete_intake_lead


STATUS_OPTIONS = [
    ("new", "🆕 New Lead"),
    ("contacted", "💬 Contacted"),
    ("proposal_sent", "📄 Proposal Sent"),
    ("won", "🏆 Won / Signed"),
    ("in_progress", "🚀 In Progress"),
    ("completed", "✅ Completed"),
    ("lost", "❌ Lost / Archived"),
]

STATUS_MAP = dict(STATUS_OPTIONS)


def render_clients_tab():
    st.header("👥 Clients & Scoping Leads")
    st.caption("Track incoming scoping questionnaire briefs, manage sales pipeline status, and log internal CRM notes.")

    leads = fetch_intake_leads()

    if leads is None:
        st.warning("⚠️ Could not connect to Supabase or `intake_leads` table is empty/missing. Run database schema migrations if needed.")
        leads = []

    # 1. Pipeline Metrics Summary Bar
    total_leads = len(leads)
    new_leads = sum(1 for l in leads if l.get("status") == "new")
    won_leads = sum(1 for l in leads if l.get("status") in ["won", "in_progress", "completed"])
    total_value_inr = sum(float(l.get("total_cost_inr", 0) or 0) for l in leads)
    total_value_usd = sum(float(l.get("total_cost_usd", 0) or 0) for l in leads)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Briefs", f"{total_leads}")
    m2.metric("New Uncontacted", f"{new_leads}", delta=f"{new_leads} Action Required" if new_leads > 0 else "All Caught Up")
    m3.metric("Won / Active", f"{won_leads}")
    m4.metric("Pipeline Value", f"₹{int(total_value_inr):,} / ${int(total_value_usd):,}")

    st.markdown("---")

    if not leads:
        st.info("No client scoping briefs submitted yet. Once a client fills out the questionnaire on your site, their full brief will appear here.")
        return

    # 2. Filters & Search Controls
    col_filter, col_search = st.columns([1, 2])
    with col_filter:
        selected_status_filter = st.selectbox(
            "Filter by Status",
            options=["all"] + [opt[0] for opt in STATUS_OPTIONS],
            format_func=lambda x: "🌐 All Statuses" if x == "all" else STATUS_MAP.get(x, x),
        )

    with col_search:
        search_query = st.text_input("🔍 Search Leads", placeholder="Search by company name, email, or goal...")

    # Filter Leads
    filtered_leads = leads
    if selected_status_filter != "all":
        filtered_leads = [l for l in filtered_leads if l.get("status") == selected_status_filter]

    if search_query.strip():
        q = search_query.lower().strip()
        filtered_leads = [
            l for l in filtered_leads
            if q in l.get("company_name", "").lower()
            or q in l.get("contact_email", "").lower()
            or q in l.get("project_goal", "").lower()
        ]

    st.write(f"Showing **{len(filtered_leads)}** of {total_leads} leads:")

    # 3. Lead List & Deep Inspector Cards
    for lead in filtered_leads:
        lead_id = lead.get("id")
        company_name = lead.get("company_name", "Unknown Company")
        contact_email = lead.get("contact_email", "")
        contact_phone = lead.get("contact_phone", "")
        status = lead.get("status", "new")
        cost_inr = int(lead.get("total_cost_inr", 0) or 0)
        cost_usd = int(lead.get("total_cost_usd", 0) or 0)
        created_at = lead.get("created_at", "")[:10]
        status_label = STATUS_MAP.get(status, status)

        expander_title = f"{status_label} | {company_name} ({contact_email}) — ₹{cost_inr:,} / ${cost_usd:,} [{created_at}]"

        with st.expander(expander_title, expanded=(status == "new")):
            c_left, c_right = st.columns(2)

            with c_left:
                st.subheader("👤 Client Info")
                st.write(f"**Company / Client:** {company_name}")
                st.write(f"**Email:** [{contact_email}](mailto:{contact_email})")
                if contact_phone:
                    clean_phone = "".join(filter(str.isdigit, contact_phone))
                    wa_url = f"https://wa.me/{clean_phone}"
                    st.write(f"**Phone / WhatsApp:** {contact_phone} ([📱 Open WhatsApp]({wa_url}))")
                else:
                    st.write("**Phone:** *Not provided*")

                st.write(f"**Primary Goal:** {lead.get('project_goal', 'N/A')}")
                st.write(f"**Target Audience:** {lead.get('target_audience', 'N/A')}")
                st.write(f"**Target Timeline:** {lead.get('timeline', 'N/A')}")

            with c_right:
                st.subheader("🛠️ Technical Scope & Quote")
                st.write(f"**Base Engine:** {lead.get('base_engine_title', 'Landing Core')}")
                
                features = lead.get("selected_features", [])
                if isinstance(features, list) and features:
                    st.write("**Add-on Modules:**")
                    for feat in features:
                        st.markdown(f"- `{feat}`")
                else:
                    st.write("**Add-on Modules:** None (Base Engine Only)")

                st.write(f"**Brand Option:** {lead.get('brand_asset_option', 'N/A')}")
                st.write(f"**Maintenance Care Plan:** {lead.get('maintenance_plan', 'N/A')}")
                st.write(f"**Total Build Investment:** **₹{cost_inr:,} / ${cost_usd:,}**")

            if lead.get("inspiration_links"):
                st.info(f"🔗 **Inspiration Links:** {lead.get('inspiration_links')}")

            if lead.get("additional_notes"):
                st.info(f"📝 **Client Notes:** {lead.get('additional_notes')}")

            st.markdown("---")

            # CRM Status & Internal Notes Controls
            st.subheader("✏️ CRM Pipeline Manager")
            crm_col1, crm_col2 = st.columns([1, 2])

            with crm_col1:
                new_status = st.selectbox(
                    "Update Lead Status",
                    options=[opt[0] for opt in STATUS_OPTIONS],
                    format_func=lambda x: STATUS_MAP.get(x, x),
                    index=[opt[0] for opt in STATUS_OPTIONS].index(status) if status in [opt[0] for opt in STATUS_OPTIONS] else 0,
                    key=f"status_select_{lead_id}"
                )

            with crm_col2:
                internal_notes = st.text_area(
                    "Internal CRM Notes",
                    value=lead.get("notes_internal", ""),
                    placeholder="Log call notes, agreed payment terms, deposit received date...",
                    key=f"notes_area_{lead_id}",
                    height=90
                )

            if st.button("💾 Save Lead Updates", key=f"save_lead_{lead_id}"):
                res = update_intake_lead(lead_id, {"status": new_status, "notes_internal": internal_notes})
                if res:
                    st.success("✅ Lead status and CRM notes updated successfully!")
                    st.rerun()
                else:
                    st.error("Failed to update lead in Supabase.")

            # Quick Utilities: Email Response Generator & Delete
            st.markdown("---")
            util1, util2 = st.columns(2)

            with util1:
                with st.expander("📧 Generate Email Response Template"):
                    email_template = f"""Hi {company_name.split()[0] if company_name else 'there'},

Thank you for submitting your scoping brief on prateeq.in for {company_name}.

I have reviewed your requirements for the {lead.get('base_engine_title', 'Web App')} build (Goal: {lead.get('project_goal', 'Custom App')}). The estimated investment is ₹{cost_inr:,} (${cost_usd:,}) based on your selected technical scope.

Let's schedule a brief 15-minute alignment call to confirm your launch date and walk through the initial milestone plan:
👉 https://prateeq.in/terminal (or reply with your preferred time slot)

Looking forward to collaborating!

Best regards,
Prateek Sharma
Full-Stack AI & Web Engineer | prateeq.in
"""
                    st.code(email_template, language="text")

            with util2:
                confirm_del = st.checkbox("Confirm deletion", key=f"confirm_del_{lead_id}")
                if st.button("🗑️ Delete Lead", key=f"del_lead_{lead_id}", disabled=not confirm_del):
                    if delete_intake_lead(lead_id):
                        st.success("Lead deleted successfully.")
                        st.rerun()
                    else:
                        st.error("Failed to delete lead.")
