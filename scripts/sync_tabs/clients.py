import streamlit as st
import json
import os
from datetime import datetime
from sync_tabs.shared import (
    HAS_SYNC,
    SCRIPTS_DIR,
    atomic_write_json,
    git_commit_push_file,
    fetch_records,
    upsert_record,
)

def render_clients_tab():
    st.header("🏢 Client Orders & Delivery Command Center")
    st.markdown("Manage incoming scope submissions, track 50% deposit payments, update client delivery milestones, and configure GST seller credentials.")

    # 1. Commercial Overview Metrics Cards
    orders = []
    invoices = []
    if HAS_SYNC:
        try:
            orders = fetch_records("client_scopes") or fetch_records("client_orders") or []
        except Exception as e:
            st.warning(f"Could not fetch scopes from Supabase: {e}")

        try:
            invoices = fetch_records("invoices") or []
        except Exception as e:
            st.warning(f"Could not fetch invoices from Supabase: {e}")

    total_orders = len(orders)
    paid_orders = [o for o in orders if o.get("deposit_paid")]
    total_paid_inr = sum(float(o.get("total_cost_inr", 0)) * 0.5 for o in paid_orders)
    total_paid_usd = sum(float(o.get("total_cost_usd", 0)) * 0.5 for o in paid_orders)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Scopes Received", total_orders)
    with col2:
        st.metric("Total Invoices Issued", len(invoices))
    with col3:
        st.metric("Total Paid (INR)", f"₹{total_paid_inr:,.0f}")
    with col4:
        st.metric("Total Paid (USD)", f"${total_paid_usd:,.0f}")

    # 2. Registered Seller GST & Invoicing Settings
    st.markdown("---")
    with st.expander("🏛️ Edit Registered Business & GST Invoicing Credentials (Seller Config)", expanded=False):
        st.caption("These credentials appear on all PDF invoices and are sent to Razorpay for GST compliance.")
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

    st.markdown("---")

    # 3. Invoices & Tax Breakdown Section
    st.subheader("🧾 GST & Multi-Currency Invoices Ledger")
    if not invoices:
        st.info("No custom invoices issued yet. Client scope deposit invoices will appear here once generated.")
    else:
        for inv in invoices:
            inv_num = inv.get("invoice_number", "INV-UNKNOWN")
            cust_name = inv.get("customer_name", "Valued Client")
            cust_email = inv.get("customer_email", "")
            amt = inv.get("amount", 0)
            curr = inv.get("currency", "INR")
            pos = inv.get("place_of_supply", "Delhi")
            is_gst = inv.get("is_gst", False)
            status = inv.get("payment_status", "pending")

            with st.expander(f"📄 {inv_num} — {cust_name} ({curr} {amt:,.2f}) [{status.upper()}]"):
                c1, c2 = st.columns(2)
                with c1:
                    st.markdown(f"**Customer Email:** `{cust_email}`")
                    st.markdown(f"**Place of Supply:** {pos}")
                    st.markdown(f"**Tax Treatment:** {'GST Compliant (CGST/SGST/IGST)' if is_gst else 'Non-GST / International Export'}")
                    st.markdown(f"**Issue Date:** {inv.get('issue_date', inv.get('created_at', 'N/A'))}")
                with c2:
                    st.markdown(f"**Status:** `{status.upper()}`")
                    st.markdown(f"**Razorpay Invoice ID:** `{inv.get('razorpay_invoice_id', 'N/A')}`")
                    st.markdown(f"**Payment Link:** {inv.get('payment_url', 'N/A')}")

                # Status update
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

    # 4. Orders Data Table & Milestone Manager
    if not orders:
        st.info("No client orders recorded in Supabase yet. Incoming submissions from /scoping will appear here automatically.")
        return

    st.subheader("Client Orders & Live Delivery Manager")

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

            # Itemized Selected Features
            features_raw = order.get("features", [])
            if isinstance(features_raw, str):
                try:
                    features_raw = json.loads(features_raw)
                except Exception:
                    features_raw = [features_raw]

            if features_raw:
                st.markdown("**Selected Scope Modules & Customized Features:**")
                st.markdown(" ".join([f"`{f}`" for f in features_raw]))

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
                    st.success(f"Updated {scope_code}! Stage set to '{new_stage}', Deposit Paid = {new_paid}. Live on prateeq.in/dashboard.")

            st.markdown("---")
            st.markdown("#### 🧾 Generate & Issue Commercial Non-GST Invoice")
            
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
                
                if "50%" in inv_milestone_type:
                    inv_amt = base_cost * 0.5
                else:
                    inv_amt = base_cost

                st.markdown(f"**Invoice Amount:** `{curr} {inv_amt:,.2f}`")
                st.caption("Issued as Non-GST Commercial Bill / Invoice.")

            if st.button(f"🚀 Issue Invoice for {scope_code}", key=f"btn_issue_inv_{scope_code}"):
                if HAS_SYNC:
                    suffix = "50" if "Deposit" in inv_milestone_type else ("BAL" if "Balance" in inv_milestone_type else "FULL")
                    inv_number = f"INV-{scope_code}-{suffix}"
                    milestone_label = inv_milestone_type
                    
                    line_items = [
                        {
                            "name": f"{order.get('base_engine', 'Web Application Engine')} — {milestone_label}",
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
                        "milestone_name": milestone_label,
                        "payment_status": "issued" if not deposit_paid else "paid",
                        "issue_date": datetime.utcnow().strftime("%Y-%m-%d"),
                        "due_date": (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
                        "line_items": json.dumps(line_items) if isinstance(line_items, list) else line_items,
                        "tax_breakup": json.dumps({"total_tax": 0, "is_interstate": False}),
                        "customer_notes": "Commercial Bill / Invoice issued by a Non-GST Registered Freelance Developer under Section 22 of the CGST Act.",
                        "terms_and_conditions": "100% Intellectual Property transfers upon final balance payment. 30 days post-launch support included.",
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }

                    try:
                        upsert_record("invoices", invoice_record, key_col="invoice_number")
                        st.success(f"Successfully issued non-GST invoice '{inv_number}' for {curr} {inv_amt:,.2f}! Visible on client dashboard.")
                    except Exception as ex:
                        st.error(f"Failed to issue invoice: {ex}")

