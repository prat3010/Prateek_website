import json
import urllib.request
import streamlit as st

RETRIEVER_PRICING_API = "https://rag.prateeq.in/v1/config/pricing"
RETRIEVER_ADMIN_PRICING_API = "https://rag.prateeq.in/v1/admin/config/pricing"
ADMIN_KEY = "dev-admin-master-key-change-in-production"


def fetch_rag_pricing():
    try:
        req = urllib.request.Request(RETRIEVER_PRICING_API)
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception:
        pass
    return None


def save_rag_pricing(pricing_payload, admin_key):
    url = RETRIEVER_ADMIN_PRICING_API
    data = json.dumps({"pricing": pricing_payload}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Master-Key": admin_key,
        },
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status == 200:
            return True
    return False


def render_rag_pricing_tab():
    st.header("💳 RAG SaaS Pricing Manager")
    st.caption("Manage live INR & USD pricing packages, feature bullet points, and Stripe links for prateeq.in/rag")

    pricing_data = fetch_rag_pricing()
    if not pricing_data:
        st.warning("Could not fetch pricing data from Retriever API. Displaying default fallback structure.")
        pricing_data = {
            "inr": {"currency": "INR", "symbol": "₹", "plans": []},
            "usd": {"currency": "USD", "symbol": "$", "plans": []},
        }

    admin_key = st.text_input("Admin Master Key", value=ADMIN_KEY, type="password", help="Master key for authenticating admin pricing writes")

    st.markdown("---")

    col_inr, col_usd = st.columns(2)

    with col_inr:
        st.subheader("🇮🇳 Indian Rates (INR)")
        inr_plans = pricing_data.get("inr", {}).get("plans", [])
        updated_inr_plans = []
        for i, plan in enumerate(inr_plans):
            with st.expander(f"Plan {i+1}: {plan.get('name', 'Plan')} ({plan.get('price', '0')} INR)", expanded=True):
                name = st.text_input("Plan Name", value=plan.get("name", ""), key=f"inr_name_{i}")
                price = st.text_input("Price (INR)", value=plan.get("price", ""), key=f"inr_price_{i}")
                desc = st.text_area("Description", value=plan.get("description", ""), key=f"inr_desc_{i}")
                popular = st.checkbox("Popular Badge", value=plan.get("popular", False), key=f"inr_pop_{i}")
                features_str = st.text_area("Features (1 per line)", value="\n".join(plan.get("features", [])), key=f"inr_feat_{i}")
                stripe_url = st.text_input("Stripe Checkout URL", value=plan.get("stripeUrl", ""), key=f"inr_stripe_{i}")

                updated_inr_plans.append({
                    "id": plan.get("id", f"plan_inr_{i}"),
                    "name": name,
                    "price": price,
                    "period": "/month",
                    "popular": popular,
                    "description": desc,
                    "features": [f.strip() for f in features_str.split("\n") if f.strip()],
                    "cta": plan.get("cta", "Subscribe"),
                    "stripeUrl": stripe_url,
                })

    with col_usd:
        st.subheader("🌐 Global Rates (USD)")
        usd_plans = pricing_data.get("usd", {}).get("plans", [])
        updated_usd_plans = []
        for i, plan in enumerate(usd_plans):
            with st.expander(f"Plan {i+1}: {plan.get('name', 'Plan')} (${plan.get('price', '0')} USD)", expanded=True):
                name = st.text_input("Plan Name", value=plan.get("name", ""), key=f"usd_name_{i}")
                price = st.text_input("Price (USD)", value=plan.get("price", ""), key=f"usd_price_{i}")
                desc = st.text_area("Description", value=plan.get("description", ""), key=f"usd_desc_{i}")
                popular = st.checkbox("Popular Badge", value=plan.get("popular", False), key=f"usd_pop_{i}")
                features_str = st.text_area("Features (1 per line)", value="\n".join(plan.get("features", [])), key=f"usd_feat_{i}")
                stripe_url = st.text_input("Stripe Checkout URL", value=plan.get("stripeUrl", ""), key=f"usd_stripe_{i}")

                updated_usd_plans.append({
                    "id": plan.get("id", f"plan_usd_{i}"),
                    "name": name,
                    "price": price,
                    "period": "/month",
                    "popular": popular,
                    "description": desc,
                    "features": [f.strip() for f in features_str.split("\n") if f.strip()],
                    "cta": plan.get("cta", "Subscribe"),
                    "stripeUrl": stripe_url,
                })

    st.markdown("---")
    if st.button("💾 Save Live Pricing Packages", type="primary", use_container_width=True):
        new_pricing_payload = {
            "inr": {"currency": "INR", "symbol": "₹", "plans": updated_inr_plans},
            "usd": {"currency": "USD", "symbol": "$", "plans": updated_usd_plans},
        }
        try:
            success = save_rag_pricing(new_pricing_payload, admin_key)
            if success:
                st.success("🎉 Successfully updated live RAG SaaS pricing!")
            else:
                st.error("Failed to save pricing data. Please check admin master key.")
        except Exception as e:
            st.error(f"Error saving pricing: {e}")
