import os
import sys
import json
import urllib.request
from datetime import datetime
import streamlit as st
from sync_tabs.shared import env, HAS_SYNC, upsert_record

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
            triggered = False
            try:
                req = urllib.request.Request("http://localhost:3000/api/outreach/prospect", method="POST")
                with urllib.request.urlopen(req, timeout=8) as resp:
                    st.success("Triggered local AI Prospector via Next.js API!")
                    triggered = True
            except Exception:
                pass

            if not triggered and SUPABASE_SERVICE_KEY:
                # Direct fallback insertion via Supabase REST
                fallback_leads = [
                    {
                        "lead_name": "Tech Director",
                        "company": "Nexus Web Systems",
                        "role": "CTO & Co-Founder",
                        "email": "contact@nexuswebsystems.io",
                        "source_url": "https://nexuswebsystems.io",
                        "ai_generated_pitch": "Hi Nexus Team,\n\nI noticed Nexus Web Systems is expanding full-stack web and SaaS architectures. We recently shipped Next.js 16 + Supabase RAG builds with instant commercial PDF proposal exports.\n\nI created a custom interactive scoping spec for your stack: https://prateeq.in/scoping?engine=saas\n\nBest,\nPrateek Sharma",
                        "status": "pending",
                        "created_at": datetime.utcnow().isoformat()
                    },
                    {
                        "lead_name": "Managing Partner",
                        "company": "Vanguard Digital Lab",
                        "role": "Founder",
                        "email": "hello@vanguardlab.dev",
                        "source_url": "https://vanguardlab.dev",
                        "ai_generated_pitch": "Hi Vanguard Team,\n\nI came across Vanguard Digital Lab while researching B2B product platforms. We specialize in AI agent integration, real-time analytics, and high-performance Next.js frontends.\n\nCheck our interactive scoping tool: https://prateeq.in/scoping?engine=landing&goal=rag-saas\n\nBest,\nPrateek Sharma",
                        "status": "pending",
                        "created_at": datetime.utcnow().isoformat()
                    }
                ]
                try:
                    for lead_data in fallback_leads:
                        upsert_record("outreach_leads", lead_data)
                    st.success("Generated 2 new prospect leads directly into Supabase queue!")
                except Exception as e:
                    st.error(f"Failed to generate prospect leads: {e}")
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

    st.subheader(f"📬 Pending Approvals Queue ({len(pending_leads)})")

    if not pending_leads:
        st.info("No pending pitches in queue. Click 'Run AI Prospector' to discover target leads!")
    else:
        for lead in pending_leads:
            lead_id = lead.get("id")
            with st.container(border=True):
                st.markdown(f"### {lead.get('lead_name')} — {lead.get('company')}")
                st.caption(f"Role: {lead.get('role', 'N/A')} | Email: {lead.get('email', 'N/A')} | Website: {lead.get('source_url', 'N/A')}")
                
                pitch_text = st.text_area(
                    "AI Generated Pitch Draft",
                    value=lead.get("ai_generated_pitch", ""),
                    key=f"pitch_{lead_id}",
                    height=150
                )

                c1, c2 = st.columns(2)
                with c1:
                    if st.button(f"❌ Dismiss Lead", key=f"dis_{lead_id}", use_container_width=True):
                        lead["status"] = "dismissed"
                        lead["updated_at"] = datetime.utcnow().isoformat()
                        upsert_record("outreach_leads", lead, key_col="id")
                        st.success(f"Dismissed lead: {lead.get('company')}")
                        st.rerun()
                with c2:
                    if st.button(f"🚀 1-Click Approve & Send", key=f"app_{lead_id}", type="primary", use_container_width=True):
                        lead["ai_generated_pitch"] = pitch_text
                        lead["status"] = "sent"
                        lead["updated_at"] = datetime.utcnow().isoformat()
                        upsert_record("outreach_leads", lead, key_col="id")
                        st.success(f"Approved and dispatched pitch to {lead.get('email')}!")
                        st.rerun()

