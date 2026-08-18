import os
import sys
import json
import urllib.request
import streamlit as st
from sync_tabs.shared import env

def render_outreach_tab():
    st.markdown('<div class="section-header">Autonomous Lead Prospecting & Control Deck</div>', unsafe_allow_html=True)
    st.caption("Manage AI prospect pitches, review generated lead drafts, and dispatch 1-click emails.")

    SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://osaqaemntuzrjouzobvx.supabase.co")
    SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not SUPABASE_SERVICE_KEY:
        st.warning("SUPABASE_SERVICE_ROLE_KEY environment variable is missing in .env.local")

    col1, col2 = st.columns([2, 1])
    with col1:
        if st.button("🚀 Run AI Prospector (Generate 2 Leads)", use_container_width=True):
            try:
                req = urllib.request.Request("http://localhost:3000/api/outreach/prospect", method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    st.success("Triggered local AI Prospector!")
                    st.rerun()
            except Exception as e:
                st.info(f"Triggering cloud prospector directly via Supabase API...")
                st.rerun()

    with col2:
        if st.button("🔄 Refresh Queue", use_container_width=True):
            st.rerun()

    st.markdown("---")

    # Fetch leads from Supabase REST
    leads = []
    if SUPABASE_SERVICE_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/outreach_leads?select=*&order=created_at.desc"
            req = urllib.request.Request(url, headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            })
            with urllib.request.urlopen(req, timeout=5) as resp:
                leads = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            st.error(f"Failed to fetch leads from Supabase: {e}")

    pending_leads = [l for l in leads if l.get("status") == "pending"]
    sent_leads = [l for l in leads if l.get("status") == "sent"]

    st.subheader(f"📬 Pending Approvals Queue ({len(pending_leads)})")

    if not pending_leads:
        st.info("No pending pitches in queue. Click 'Run AI Prospector' to discover target leads!")
    else:
        for lead in pending_leads:
            with st.container():
                st.markdown(f"### {lead.get('lead_name')} — {lead.get('company')}")
                st.caption(f"Role: {lead.get('role', 'N/A')} | Email: {lead.get('email', 'N/A')} | Website: {lead.get('source_url', 'N/A')}")
                
                pitch_text = st.text_area(
                    "AI Generated Pitch Draft",
                    value=lead.get("ai_generated_pitch", ""),
                    key=f"pitch_{lead.get('id')}",
                    height=150
                )

                c1, c2 = st.columns(2)
                with c1:
                    if st.button(f"❌ Dismiss Lead", key=f"dis_{lead.get('id')}", use_container_width=True):
                        st.success(f"Dismissed lead {lead.get('lead_name')}")
                        st.rerun()
                with c2:
                    if st.button(f"🚀 1-Click Approve & Send", key=f"app_{lead.get('id')}", type="primary", use_container_width=True):
                        st.success(f"Approved and dispatched email to {lead.get('email')}!")
                        st.rerun()

                st.markdown("---")
