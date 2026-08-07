import streamlit as st
import json
from datetime import datetime
from sync_tabs.shared import (
    HAS_SYNC,
    fetch_records,
    upsert_record,
)

def render_clients_tab():
    st.header("🏢 Client Orders & Delivery Command Center")
    st.markdown("Manage incoming scope submissions, track 50% deposit payments, and update live client delivery milestones.")

    # 1. Commercial Overview Metrics Cards
    orders = []
    if HAS_SYNC:
        try:
            orders = fetch_records("client_orders") or []
        except Exception as e:
            st.warning(f"Could not fetch orders from Supabase: {e}")

    total_orders = len(orders)
    paid_orders = [o for o in orders if o.get("deposit_paid")]
    total_paid_inr = sum(float(o.get("total_cost_inr", 0)) * 0.5 for o in paid_orders)
    total_paid_usd = sum(float(o.get("total_cost_usd", 0)) * 0.5 for o in paid_orders)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Scopes Received", total_orders)
    with col2:
        st.metric("Paid Scope Deposits", len(paid_orders))
    with col3:
        st.metric("Total Paid (INR)", f"₹{total_paid_inr:,.0f}")
    with col4:
        st.metric("Total Paid (USD)", f"${total_paid_usd:,.0f}")

    st.markdown("---")

    # 2. Orders Data Table & Milestone Manager
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
        payment_id = order.get("payment_id", "N/A")

        with st.expander(f"📦 {scope_code} — {company} ({'✅ 50% DEPOSIT PAID' if deposit_paid else '⏳ DRAFT PROPOSAL'})", expanded=True):
            c1, c2 = st.columns(2)
            with c1:
                st.markdown(f"**Client Email:** `{email}`")
                st.markdown(f"**Contact Phone:** {order.get('client_phone', 'N/A')}")
                st.markdown(f"**Base Engine:** {order.get('base_engine', 'Web Engine')}")
                st.markdown(f"**Timeline:** {order.get('timeline', 'Standard')}")
                st.markdown(f"**Total Build Investment:** {order.get('currency', 'INR')} {order.get('total_cost_inr' if order.get('currency') == 'INR' else 'total_cost_usd', 0):,}")
            
            with c2:
                st.markdown(f"**Deposit Status:** {'✅ PAID' if deposit_paid else '⏳ PENDING'}")
                st.markdown(f"**Payment Ref ID:** `{payment_id}`")
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
                    upsert_record("client_orders", order, key_col="scope_code")
                    st.success(f"Updated {scope_code}! Stage set to '{new_stage}', Deposit Paid = {new_paid}. Live on prateeq.in/dashboard.")
