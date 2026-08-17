import streamlit as st
import json
import os
from datetime import datetime, timedelta
from sync_tabs.shared import (
    HAS_SYNC,
    SCRIPTS_DIR,
    atomic_write_json,
    git_commit_push_file,
    fetch_records,
    upsert_record,
)
from sync_supabase import (
    fetch_clients,
    delete_client,
    fetch_intake_leads,
    update_intake_lead,
    delete_intake_lead,
    fetch_project_deliverables,
    delete_project_deliverable,
)


def render_clients_tab():
    st.header("🏢 Commercial, Client & Lead Directory Command Center")
    st.markdown("Manage registered client accounts, track incoming scoping leads, control project delivery stages, issue GST/Non-GST invoices, and edit project deliverables.")

    # 1. Fetch live records from Supabase tables
    clients = []
    intake_leads = []
    orders = []
    invoices = []
    deliverables = []

    if HAS_SYNC:
        try:
            clients = fetch_clients() or []
        except Exception as e:
            st.warning(f"Could not fetch clients from Supabase: {e}")

        try:
            intake_leads = fetch_intake_leads() or []
        except Exception as e:
            st.warning(f"Could not fetch intake_leads from Supabase: {e}")

        try:
            orders = fetch_records("client_scopes") or fetch_records("client_orders") or []
        except Exception as e:
            st.warning(f"Could not fetch scopes from Supabase: {e}")

        try:
            invoices = fetch_records("invoices") or []
        except Exception as e:
            st.warning(f"Could not fetch invoices from Supabase: {e}")

        try:
            deliverables = fetch_project_deliverables() or []
        except Exception as e:
            st.warning(f"Could not fetch project_deliverables from Supabase: {e}")

    # Commercial Overview Metrics Cards
    total_orders = len(orders)
    paid_orders = [o for o in orders if o.get("deposit_paid")]
    total_paid_inr = sum(float(o.get("total_cost_inr", 0)) * 0.5 for o in paid_orders)
    total_paid_usd = sum(float(o.get("total_cost_usd", 0)) * 0.5 for o in paid_orders)

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Registered Clients", len(clients))
    with col2:
        st.metric("Scoping Leads", len(intake_leads))
    with col3:
        st.metric("Active Scopes", total_orders)
    with col4:
        st.metric("Invoices Issued", len(invoices))
    with col5:
        st.metric("Total Paid (INR)", f"₹{total_paid_inr:,.0f}")

    st.markdown("---")

    # 2. Main Tabbed Navigation
    c_tab1, c_tab2, c_tab3, c_tab4, c_tab5 = st.tabs([
        "👥 Registered Clients",
        "📋 Scoping Intake Leads",
        "📦 Client Scopes & Delivery",
        "🔑 Deliverables Vault",
        "🧾 Invoices & GST Credentials"
    ])

    # ─────────────────────────────────────────────────────────────
    # TAB 1: REGISTERED CLIENTS DIRECTORY
    # ─────────────────────────────────────────────────────────────
    with c_tab1:
        st.subheader("👥 Registered Client Accounts (`clients` Table)")
        st.caption("Consolidated list of all client profiles registered via OAuth, Scoping Form, or manual registration.")

        search_query = st.text_input("🔍 Search Clients by Email, Name, or Company", "", key="client_search_input")

        filtered_clients = clients
        if search_query:
            q = search_query.lower()
            filtered_clients = [
                c for c in clients
                if q in (c.get("email") or "").lower()
                or q in (c.get("full_name") or "").lower()
                or q in (c.get("company_name") or "").lower()
            ]

        # Manual Client Add Form
        with st.expander("➕ Register New Client Account Manually", expanded=False):
            with st.form("form_add_client"):
                n_email = st.text_input("Client Email *", key="n_client_email")
                n_name = st.text_input("Full Name", key="n_client_name")
                n_company = st.text_input("Company Name", key="n_client_company")
                n_phone = st.text_input("Phone Number", key="n_client_phone")
                n_gstin = st.text_input("GST / Tax ID", key="n_client_gstin")
                n_country = st.text_input("Country", "India", key="n_client_country")

                submitted = st.form_submit_button("Save & Register Client")
                if submitted:
                    if not n_email:
                        st.error("Client email is required.")
                    elif HAS_SYNC:
                        client_payload = {
                            "email": n_email,
                            "full_name": n_name,
                            "company_name": n_company,
                            "phone": n_phone,
                            "tax_id_gst": n_gstin,
                            "country": n_country,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        res = upsert_record("clients", client_payload, key_col="email")
                        if res:
                            st.success(f"Successfully registered client {n_email}!")
                            st.rerun()
                        else:
                            st.error("Failed to register client in Supabase.")

        if not filtered_clients:
            st.info("No registered clients found matching query.")
        else:
            st.markdown(f"**Showing {len(filtered_clients)} client profile(s)**")
            for c in filtered_clients:
                c_id = c.get("id", "")
                c_email = c.get("email", "No Email")
                c_name = c.get("full_name", "N/A")
                c_company = c.get("company_name", "N/A")
                c_phone = c.get("phone", "N/A")
                c_gst = c.get("tax_id_gst", "N/A")
                c_country = c.get("country", "N/A")
                c_created = c.get("created_at", "N/A")

                # Count linked scopes
                linked_scopes = [s for s in orders if s.get("client_email") == c_email]

                with st.expander(f"👤 {c_email} — {c_company} ({c_name}) [{len(linked_scopes)} Scope(s)]", expanded=False):
                    f1, f2 = st.columns(2)
                    with f1:
                        edit_name = st.text_input(f"Full Name ({c_email})", c_name, key=f"e_name_{c_id}")
                        edit_company = st.text_input(f"Company Name ({c_email})", c_company, key=f"e_comp_{c_id}")
                        edit_phone = st.text_input(f"Phone ({c_email})", c_phone, key=f"e_phone_{c_id}")
                    with f2:
                        edit_gst = st.text_input(f"Tax ID / GST ({c_email})", c_gst, key=f"e_gst_{c_id}")
                        edit_country = st.text_input(f"Country ({c_email})", c_country, key=f"e_cntry_{c_id}")
                        st.caption(f"Registered At: {c_created}")

                    b_col1, b_col2 = st.columns(2)
                    with b_col1:
                        if st.button(f"💾 Save Changes for {c_email}", key=f"btn_save_client_{c_id}"):
                            if HAS_SYNC:
                                c["full_name"] = edit_name
                                c["company_name"] = edit_company
                                c["phone"] = edit_phone
                                c["tax_id_gst"] = edit_gst
                                c["country"] = edit_country
                                c["updated_at"] = datetime.utcnow().isoformat()
                                res = upsert_record("clients", c, key_col="email")
                                if res:
                                    st.success(f"Updated client {c_email}!")
                                    st.rerun()

                    with b_col2:
                        if st.button(f"🗑️ Delete Client Record ({c_email})", key=f"btn_del_client_{c_id}"):
                            if HAS_SYNC and c_id:
                                delete_client(c_id)
                                st.success(f"Deleted client {c_email}")
                                st.rerun()

    # ─────────────────────────────────────────────────────────────
    # TAB 2: SCOPING INTAKE LEADS
    # ─────────────────────────────────────────────────────────────
    with c_tab2:
        st.subheader("📋 Scoping Intake Leads (`intake_leads` Table)")
        st.caption("Raw intake briefs submitted by prospects on `/scoping` prior to login or scope confirmation.")

        if not intake_leads:
            st.info("No intake leads recorded in Supabase yet.")
        else:
            lead_status_filter = st.selectbox(
                "Filter Leads by Status",
                options=["All", "new", "contacted", "converted", "archived"],
                key="lead_status_filter"
            )

            filtered_leads = intake_leads
            if lead_status_filter != "All":
                filtered_leads = [l for l in intake_leads if l.get("status") == lead_status_filter]

            for lead in filtered_leads:
                lead_id = lead.get("id", "")
                lead_code = lead.get("scope_code", "DRAFT")
                lead_email = lead.get("contact_email", "N/A")
                lead_company = lead.get("company_name", "Untitled")
                lead_engine = lead.get("base_engine_title", "Engine")
                lead_cost_inr = lead.get("total_cost_inr", 0)
                lead_status = lead.get("status", "new")
                lead_notes = lead.get("notes_internal", "")

                status_emoji = {"new": "🟢 NEW", "contacted": "🟡 CONTACTED", "converted": "✅ CONVERTED", "archived": "⚪ ARCHIVED"}.get(lead_status, lead_status.upper())

                with st.expander(f"📋 {lead_code} — {lead_company} ({lead_email}) [{status_emoji}]", expanded=False):
                    l_c1, l_c2 = st.columns(2)
                    with l_c1:
                        st.markdown(f"**Contact Phone:** {lead.get('contact_phone', 'N/A')}")
                        st.markdown(f"**Engine Tier:** {lead_engine}")
                        st.markdown(f"**Project Goal:** {lead.get('project_goal', 'N/A')}")
                        st.markdown(f"**Target Audience:** {lead.get('target_audience', 'N/A')}")
                        st.markdown(f"**Estimated Cost:** ₹{lead_cost_inr:,.0f} / ${lead.get('total_cost_usd', 0):,.0f}")
                    with l_c2:
                        st.markdown(f"**Brand Kit:** {lead.get('brand_asset_option', 'Standard')}")
                        st.markdown(f"**Care Plan:** {lead.get('maintenance_plan', 'Standard')}")
                        st.markdown(f"**Timeline:** {lead.get('timeline', 'Standard')}")
                        st.markdown(f"**Inspiration Links:** {lead.get('inspiration_links', 'None')}")
                        st.markdown(f"**Submitted At:** {lead.get('created_at', 'N/A')}")

                    # Features list
                    feats = lead.get("selected_features", [])
                    if feats:
                        st.markdown("**Selected Features:** " + ", ".join([f"`{f}`" for f in feats]))

                    if lead.get("additional_notes"):
                        st.info(f"**Client Notes:** {lead.get('additional_notes')}")

                    st.markdown("---")
                    st.markdown("#### Lead Management & Status Update")
                    u_col1, u_col2 = st.columns(2)
                    with u_col1:
                        new_lead_status = st.selectbox(
                            f"Status for {lead_code}",
                            options=["new", "contacted", "converted", "archived"],
                            index=["new", "contacted", "converted", "archived"].index(lead_status) if lead_status in ["new", "contacted", "converted", "archived"] else 0,
                            key=f"status_lead_{lead_id}"
                        )
                    with u_col2:
                        new_internal_notes = st.text_area(f"Internal Notes ({lead_code})", lead_notes, key=f"notes_lead_{lead_id}")

                    act_col1, act_col2 = st.columns(2)
                    with act_col1:
                        if st.button(f"💾 Save Lead Status & Notes ({lead_code})", key=f"btn_save_lead_{lead_id}"):
                            if HAS_SYNC and lead_id:
                                update_intake_lead(lead_id, {"status": new_lead_status, "notes_internal": new_internal_notes})
                                st.success(f"Updated lead {lead_code}!")
                                st.rerun()
                    with act_col2:
                        if st.button(f"🗑️ Delete Lead ({lead_code})", key=f"btn_del_lead_{lead_id}"):
                            if HAS_SYNC and lead_id:
                                delete_intake_lead(lead_id)
                                st.success(f"Deleted lead {lead_code}")
                                st.rerun()

    # ─────────────────────────────────────────────────────────────
    # TAB 3: CLIENT SCOPES & DELIVERY
    # ─────────────────────────────────────────────────────────────
    with c_tab3:
        st.subheader("📦 Active Client Scopes & Delivery Manager (`client_scopes` Table)")
        st.caption("Confirmed project scopes, 50% deposit tracking, live delivery stage updates, and commercial non-GST invoice issuing.")

        if not orders:
            st.info("No client scopes recorded in Supabase yet.")
        else:
            for order in orders:
                scope_code = order.get("scope_code", "UNKNOWN")
                company = order.get("company_name", "Untitled Client")
                email = order.get("client_email", "")
                deposit_paid = order.get("deposit_paid", False)
                status = order.get("status", "Draft Proposal")
                delivery_stage = order.get("delivery_stage", "architecture")

                with st.expander(f"📦 {scope_code} — {company} ({'✅ 50% DEPOSIT PAID' if deposit_paid else '⏳ DRAFT PROPOSAL'})", expanded=False):
                    c1, c2 = st.columns(2)
                    with c1:
                        st.markdown(f"**Client Email:** `{email}`")
                        st.markdown(f"**Contact Phone:** {order.get('client_phone', 'N/A')}")
                        st.markdown(f"**Base Engine:** {order.get('base_engine', 'Web Engine')}")
                        st.markdown(f"**Timeline:** {order.get('timeline', 'Standard')}")
                        st.markdown(f"**Total Build Investment:** {order.get('currency', 'INR')} {order.get('total_cost_inr' if order.get('currency') == 'INR' else 'total_cost_usd', 0):,}")
                    with c2:
                        st.markdown(f"**Deposit Status:** {'✅ PAID' if deposit_paid else '⏳ PENDING'}")
                        st.markdown(f"**Brand Kit:** {order.get('brand_asset', 'Standard')}")
                        st.markdown(f"**Care Plan:** {order.get('maintenance_plan', 'Standard')}")

                    features_raw = order.get("features", [])
                    if isinstance(features_raw, str):
                        try:
                            features_raw = json.loads(features_raw)
                        except Exception:
                            features_raw = [features_raw]

                    if features_raw:
                        st.markdown("**Selected Scope Modules:** " + " ".join([f"`{f}`" for f in features_raw]))

                    st.markdown("---")
                    st.markdown("#### Live Delivery Stage & Payment Control")
                    c_milestone, c_payment = st.columns(2)
                    with c_milestone:
                        new_stage = st.selectbox(
                            f"Update Live Milestone for {scope_code}",
                            options=["architecture", "engineering", "staging", "live"],
                            format_func=lambda x: {
                                "architecture": "Phase 1: Architecture & Specs",
                                "engineering": "Phase 2: Core Engineering",
                                "staging": "Phase 3: Staging & QA",
                                "live": "Phase 4: Production Launch"
                            }[x],
                            index=["architecture", "engineering", "staging", "live"].index(delivery_stage) if delivery_stage in ["architecture", "engineering", "staging", "live"] else 0,
                            key=f"stage_select_{scope_code}"
                        )
                    with c_payment:
                        new_paid = st.checkbox(
                            f"50% Scope Deposit Locked & Paid",
                            value=deposit_paid,
                            key=f"paid_check_{scope_code}"
                        )

                    if st.button(f"Save Client Scope & Delivery Status for {scope_code}", key=f"btn_save_{scope_code}"):
                        if HAS_SYNC:
                            order["delivery_stage"] = new_stage
                            order["deposit_paid"] = new_paid
                            order["status"] = "Deposit Paid — In Development" if new_paid else "Draft Proposal"
                            order["updated_at"] = datetime.utcnow().isoformat()
                            upsert_record("client_scopes", order, key_col="scope_code")
                            st.success(f"Updated {scope_code}! Stage set to '{new_stage}', Deposit Paid = {new_paid}.")

                    st.markdown("---")
                    st.markdown("#### 🧾 Issue Commercial Non-GST Invoice")
                    c_inv_type, c_inv_act = st.columns(2)
                    with c_inv_type:
                        inv_milestone_type = st.radio(
                            f"Invoice Type for {scope_code}",
                            options=["50% Upfront Deposit", "50% Final Milestone Balance", "100% Full Project Total"],
                            key=f"inv_type_{scope_code}"
                        )
                    with c_inv_act:
                        curr = order.get("currency", "INR")
                        cost_inr = float(order.get("total_cost_inr", 0))
                        cost_usd = float(order.get("total_cost_usd", 0))
                        base_cost = cost_inr if curr == "INR" else cost_usd
                        inv_amt = base_cost * 0.5 if "50%" in inv_milestone_type else base_cost

                        st.markdown(f"**Invoice Amount:** `{curr} {inv_amt:,.2f}`")

                    if st.button(f"🚀 Issue Invoice for {scope_code}", key=f"btn_issue_inv_{scope_code}"):
                        if HAS_SYNC:
                            suffix = "50" if "Deposit" in inv_milestone_type else ("BAL" if "Balance" in inv_milestone_type else "FULL")
                            inv_number = f"INV-{scope_code}-{suffix}"
                            line_items = [
                                {
                                    "name": f"{order.get('base_engine', 'Web Application Engine')} — {inv_milestone_type}",
                                    "description": f"Scope Code {scope_code} ({order.get('company_name', 'Client')})",
                                    "rate": inv_amt,
                                    "quantity": 1,
                                    "subtotal": inv_amt,
                                    "tax_amount": 0,
                                    "total": inv_amt
                                }
                            ]
                            invoice_record = {
                                "invoice_number": inv_number,
                                "scope_id": order.get("id", scope_code),
                                "customer_name": order.get("company_name", "Valued Client"),
                                "customer_email": order.get("client_email", email),
                                "customer_phone": order.get("client_phone", ""),
                                "amount": inv_amt,
                                "currency": curr,
                                "is_gst": False,
                                "milestone_name": inv_milestone_type,
                                "payment_status": "issued" if not deposit_paid else "paid",
                                "issue_date": datetime.utcnow().strftime("%Y-%m-%d"),
                                "due_date": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
                                "line_items": json.dumps(line_items),
                                "tax_breakup": json.dumps({"total_tax": 0, "is_interstate": False}),
                                "customer_notes": "Commercial Bill / Invoice issued by a Non-GST Registered Freelance Developer under Section 22 of the CGST Act.",
                                "terms_and_conditions": "100% Intellectual Property transfers upon final balance payment.",
                                "created_at": datetime.utcnow().isoformat(),
                                "updated_at": datetime.utcnow().isoformat()
                            }
                            try:
                                upsert_record("invoices", invoice_record, key_col="invoice_number")
                                st.success(f"Successfully issued non-GST invoice '{inv_number}' for {curr} {inv_amt:,.2f}!")
                            except Exception as ex:
                                st.error(f"Failed to issue invoice: {ex}")

    # ─────────────────────────────────────────────────────────────
    # TAB 4: DELIVERABLES VAULT
    # ─────────────────────────────────────────────────────────────
    with c_tab4:
        st.subheader("🔑 Project Deliverables Vault (`project_deliverables` Table)")
        st.caption("Manage staging URLs, production domains, GitHub repositories, Figma links, and environment variables per project scope.")

        if not orders:
            st.info("No active scopes available to link deliverables.")
        else:
            selected_scope_code = st.selectbox(
                "Select Client Scope to Manage Deliverables",
                options=[o.get("scope_code") for o in orders if o.get("scope_code")],
                key="deliverable_scope_select"
            )

            target_scope = next((o for o in orders if o.get("scope_code") == selected_scope_code), None)
            scope_id = target_scope.get("id") if target_scope else None

            # Find existing deliverable for this scope
            existing_deliv = next((d for d in deliverables if d.get("scope_id") == scope_id), {}) if scope_id else {}

            with st.form("form_deliverables"):
                st.markdown(f"**Deliverables for Scope:** `{selected_scope_code}` ({target_scope.get('company_name') if target_scope else ''})")
                d_staging = st.text_input("Staging Preview URL", existing_deliv.get("staging_url", ""))
                d_prod = st.text_input("Production Live URL", existing_deliv.get("production_url", ""))
                d_github = st.text_input("GitHub Repository URL", existing_deliv.get("github_repo", ""))
                d_figma = st.text_input("Figma Design Specs URL", existing_deliv.get("figma_url", ""))
                d_signoff = st.text_input("Signoff PDF Document URL", existing_deliv.get("signoff_pdf_url", ""))

                env_vars = existing_deliv.get("environment_variables", {})
                env_str = json.dumps(env_vars, indent=2) if isinstance(env_vars, dict) else str(env_vars)
                d_env = st.text_area("Environment Variables (JSON format)", env_str)

                sub_deliv = st.form_submit_button("💾 Save Deliverables Vault Data")
                if sub_deliv:
                    if not scope_id:
                        st.error("Scope ID is required.")
                    elif HAS_SYNC:
                        try:
                            parsed_env = json.loads(d_env) if d_env.strip() else {}
                        except Exception as e:
                            st.error(f"Invalid JSON format for environment variables: {e}")
                            parsed_env = {}

                        deliv_record = {
                            "scope_id": scope_id,
                            "staging_url": d_staging,
                            "production_url": d_prod,
                            "github_repo": d_github,
                            "figma_url": d_figma,
                            "signoff_pdf_url": d_signoff,
                            "environment_variables": parsed_env,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                        if existing_deliv.get("id"):
                            deliv_record["id"] = existing_deliv["id"]

                        res = upsert_record("project_deliverables", deliv_record, key_col="scope_id")
                        if res:
                            st.success(f"Saved deliverables for scope {selected_scope_code}!")
                            st.rerun()

    # ─────────────────────────────────────────────────────────────
    # TAB 5: INVOICES & GST SELLER CREDENTIALS
    # ─────────────────────────────────────────────────────────────
    with c_tab5:
        st.subheader("🧾 GST & Multi-Currency Invoices Ledger")
        if not invoices:
            st.info("No custom invoices issued yet.")
        else:
            for inv in invoices:
                inv_num = inv.get("invoice_number", "INV-UNKNOWN")
                cust_name = inv.get("customer_name", "Valued Client")
                cust_email = inv.get("customer_email", "")
                amt = inv.get("amount", 0)
                curr = inv.get("currency", "INR")
                status = inv.get("payment_status", "pending")

                with st.expander(f"📄 {inv_num} — {cust_name} ({curr} {amt:,.2f}) [{status.upper()}]", expanded=False):
                    c1, c2 = st.columns(2)
                    with c1:
                        st.markdown(f"**Customer Email:** `{cust_email}`")
                        st.markdown(f"**Issue Date:** {inv.get('issue_date', inv.get('created_at', 'N/A'))}")
                    with c2:
                        st.markdown(f"**Status:** `{status.upper()}`")
                        st.markdown(f"**Payment URL:** {inv.get('payment_url', 'N/A')}")

                    new_status = st.selectbox(
                        f"Update Status for {inv_num}",
                        options=["draft", "issued", "pending", "paid", "cancelled"],
                        index=["draft", "issued", "pending", "paid", "cancelled"].index(status) if status in ["draft", "issued", "pending", "paid", "cancelled"] else 2,
                        key=f"inv_status_{inv_num}"
                    )

                    if st.button(f"Save Status for {inv_num}", key=f"btn_inv_save_{inv_num}"):
                        if HAS_SYNC:
                            inv["payment_status"] = new_status
                            inv["updated_at"] = datetime.utcnow().isoformat()
                            upsert_record("invoices", inv, key_col="invoice_number")
                            st.success(f"Updated {inv_num} status to '{new_status}'!")

        st.markdown("---")
        st.subheader("🏛️ Registered Business & GST Invoicing Credentials (Seller Config)")
        seller_path = os.path.join(os.path.dirname(SCRIPTS_DIR), "src/data/seller.json")
        seller_data = {}
        if os.path.exists(seller_path):
            try:
                with open(seller_path, "r", encoding="utf-8") as f:
                    seller_data = json.load(f)
            except Exception as e:
                st.warning(f"Could not read seller.json: {e}")

        c_s1, c_s2 = st.columns(2)
        with c_s1:
            s_name = st.text_input("Seller / Founder Name", seller_data.get('name', 'Prateek Sharma'), key="s_name")
            s_company = st.text_input("Registered Company Name", seller_data.get('company', 'Prateeq Studio'), key="s_company")
            s_email = st.text_input("Billing Email", seller_data.get('email', 'prateeqsharma@gmail.com'), key="s_email")
            s_phone = st.text_input("Billing Phone", seller_data.get('phone', '+91 98765 43210'), key="s_phone")
            s_gstin = st.text_input("15-Digit GSTIN Number", seller_data.get('gstin', '07AAAAA0000A1Z5'), key="s_gstin")
        with c_s2:
            s_street = st.text_input("Street Address", seller_data.get('street', 'Developer Studio, CP'), key="s_street")
            s_city = st.text_input("City", seller_data.get('city', 'New Delhi'), key="s_city")
            s_state = st.text_input("State", seller_data.get('state', 'Delhi'), key="s_state")
            s_pincode = st.text_input("Pincode", seller_data.get('pincode', '110001'), key="s_pincode")
            s_country = st.text_input("Country", seller_data.get('country', 'India'), key="s_country")
            s_sac = st.text_input("Default SAC / HSN Code", seller_data.get('defaultSacCode', '998314'), key="s_sac")

        if st.button("💾 Save Business & GST Invoicing Credentials", key="btn_save_seller"):
            updated_seller = {
                "name": s_name,
                "company": s_company,
                "email": s_email,
                "phone": s_phone,
                "gstin": s_gstin,
                "street": s_street,
                "city": s_city,
                "state": s_state,
                "pincode": s_pincode,
                "country": s_country,
                "defaultSacCode": s_sac,
            }
            try:
                atomic_write_json(seller_path, updated_seller)
                git_ok, git_msg = git_commit_push_file("src/data/seller.json", "chore(seller): update seller GST credentials")
                st.success(f"Saved seller credentials directly to src/data/seller.json! ({git_msg if git_ok else 'Local saved'})")
            except Exception as ex:
                st.error(f"Failed to save seller credentials: {ex}")
