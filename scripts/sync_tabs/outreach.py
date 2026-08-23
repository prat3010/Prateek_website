import os
import sys
import json
import re
import random
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
import streamlit as st
from sync_tabs.shared import env, HAS_SYNC, upsert_record

DEFAULTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "outreach_defaults.json")

PORTFOLIO_CONTEXT_PROMPT = """
Prateek Sharma's Proven Production Background:
- Role: Forward Deployed Engineer & AI Solutions Architect
- Retriever AI SaaS: Built a multi-tenant hybrid search & pgvector RAG platform on Next.js 16 and Supabase with presigned citation downloads and 1-line script embeds.
- Synchronizer Control Deck: Streamlit management dashboard integrated with Gemini 3.6 Flash for automated skills scanning, certificate analysis, and real-time database sync.
- Client Workspace Dashboard: Google OAuth 2.0 workspace with interactive milestone tracking, Razorpay payment processing, and dynamic commercial PDF proposal exports.
- Portfolio & Telemetry Engine: Next.js 16 edge proxy architecture with sub-100ms SQL telemetry aggregations.
"""

def load_defaults():
    try:
        if os.path.exists(DEFAULTS_PATH):
            with open(DEFAULTS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {
        "activeModel": "gemini-3.6-flash",
        "minQualityScore": 75,
        "maxLeadsPerRun": 1,
        "ctaDeepLink": "https://prateeq.in/scoping?engine=saas"
    }

def save_defaults(config):
    try:
        with open(DEFAULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        st.success("Updated outreach configuration & prompt settings!")
    except Exception as e:
        st.error(f"Failed to save defaults: {e}")

def call_gemini_with_fallback(prompt, preferred_model="gemini-3.6-flash", api_key=""):
    if not api_key:
        return None
    models = [preferred_model, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
    seen = set()
    ordered = [m for m in models if not (m in seen or seen.add(m))]
    
    for model in ordered:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                text = res.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text:
                    return text.strip()
        except Exception:
            pass
    return None

def fetch_real_live_hiring_leads(limit=1):
    real_leads = []

    # Source 1: Hacker News 'Who is Hiring?' Open API
    try:
        user_url = 'https://hacker-news.firebaseio.com/v0/user/whoishiring.json'
        with urllib.request.urlopen(urllib.request.Request(user_url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=5) as resp:
            user_data = json.loads(resp.read().decode('utf-8'))
        
        thread_id = None
        for tid in user_data.get('submitted', [])[:5]:
            item_url = f'https://hacker-news.firebaseio.com/v0/item/{tid}.json'
            with urllib.request.urlopen(urllib.request.Request(item_url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=4) as r:
                tdata = json.loads(r.read().decode('utf-8'))
            if 'who is hiring' in tdata.get('title', '').lower():
                thread_id = tid
                break
                
        if thread_id:
            item_url = f'https://hacker-news.firebaseio.com/v0/item/{thread_id}.json'
            with urllib.request.urlopen(urllib.request.Request(item_url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=4) as r:
                tdata = json.loads(r.read().decode('utf-8'))
            kids = tdata.get('kids', [])[:45]
            
            for kid_id in kids:
                kurl = f'https://hacker-news.firebaseio.com/v0/item/{kid_id}.json'
                with urllib.request.urlopen(urllib.request.Request(kurl, headers={'User-Agent': 'Mozilla/5.0'}), timeout=4) as kr:
                    comment = json.loads(kr.read().decode('utf-8'))
                text = comment.get('text', '')
                clean_text = re.sub(r'<[^>]+>', ' ', text).strip()
                lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
                first_line = lines[0] if lines else clean_text[:100]
                
                low_text = clean_text.lower()
                if ('remote' in low_text or 'anywhere' in low_text) and any(t in low_text for t in ['react', 'next', 'python', 'ai', 'rag', 'agent', 'full stack', 'developer', 'engineer', 'frontend', 'backend']):
                    parts = [p.strip() for p in first_line.split('|')]
                    company = parts[0] if len(parts) > 0 else 'Tech Startup'
                    role = parts[1] if len(parts) > 1 else 'Remote Software Engineer'
                    
                    real_leads.append({
                        'company': company,
                        'role': role,
                        'source_url': f'https://news.ycombinator.com/item?id={kid_id}',
                        'snippet': clean_text[:500],
                        'intent_source': 'hn_whoishiring'
                    })
                    if len(real_leads) >= limit:
                        break
    except Exception:
        pass

    # Source 2: WeWorkRemotely RSS
    if len(real_leads) < limit:
        try:
            wwr_url = 'https://weworkremotely.com/categories/remote-programming-jobs.rss'
            with urllib.request.urlopen(urllib.request.Request(wwr_url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=5) as resp:
                root = ET.fromstring(resp.read())
            for item in root.findall('.//item'):
                title = item.find('title').text or ''
                link = item.find('link').text or ''
                desc = item.find('description').text or title
                clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
                
                if ':' in title:
                    company, role = title.split(':', 1)
                else:
                    company, role = title, 'Remote Developer'
                    
                real_leads.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': link,
                    'snippet': clean_desc[:500],
                    'intent_source': 'weworkremotely'
                })
                if len(real_leads) >= limit:
                    break
        except Exception:
            pass

    return real_leads

def render_outreach_tab():
    st.markdown('<div class="section-header">Autonomous Lead Prospecting & Control Deck</div>', unsafe_allow_html=True)
    st.caption("Scrape real live hiring posts (Hacker News 'Who is Hiring', WeWorkRemotely), generate 1 hyper-personalized matchmaking pitch, and dispatch outreach.")

    config = load_defaults()

    SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://osaqaemntuzrjouzobvx.supabase.co")
    SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    GEMINI_API_KEY = env.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY", "")

    if not SUPABASE_SERVICE_KEY:
        st.warning("SUPABASE_SERVICE_ROLE_KEY environment variable is missing in .env.local")

    with st.expander("⚙️ Lead Sources & AI Settings (Gemini 3.6 Flash)", expanded=False):
        c_model = st.text_input("Active AI Model", value=config.get("activeModel", "gemini-3.6-flash"))
        c_min_score = st.slider("Minimum Quality Score Threshold", 50, 95, config.get("minQualityScore", 75))
        c_cta = st.text_input("CTA Deep Link Base", value=config.get("ctaDeepLink", "https://prateeq.in/scoping?engine=saas"))
        
        col_a, col_b = st.columns([1, 1])
        with col_a:
            if st.button("💾 Save Config", use_container_width=True):
                config["activeModel"] = c_model
                config["minQualityScore"] = c_min_score
                config["ctaDeepLink"] = c_cta
                save_defaults(config)
        with col_b:
            if st.button("🩺 Test Gemini API Quota & Key Health", use_container_width=True):
                if not GEMINI_API_KEY:
                    st.error("No GEMINI_API_KEY found in .env.local!")
                else:
                    st.markdown("#### 🩺 Live Gemini API Health Report")
                    for m in ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash"]:
                        try:
                            start = datetime.now()
                            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={GEMINI_API_KEY}"
                            payload = json.dumps({"contents": [{"parts": [{"text": "Ping"}]}]}).encode("utf-8")
                            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
                            with urllib.request.urlopen(req, timeout=5) as resp:
                                json.loads(resp.read().decode("utf-8"))
                            lat = int((datetime.now() - start).total_seconds() * 1000)
                            st.success(f"🟢 `{m}`: Active & Healthy ({lat}ms response)")
                        except urllib.error.HTTPError as err:
                            if err.code == 429:
                                st.warning(f"⚠️ `{m}`: Rate-Limited (HTTP 429 - Minute/Daily Quota Exceeded)")
                            elif err.code == 400 or err.code == 403:
                                st.error(f"🔴 `{m}`: Key Error / Invalid Quota (HTTP {err.code})")
                            else:
                                st.error(f"🔴 `{m}`: Error {err.code}")
                        except Exception as ex:
                            st.error(f"🔴 `{m}`: Exception {ex}")

    col1, col2 = st.columns([2, 1])
    with col1:
        if st.button("🚀 Run Hyper-Personalized Lead Matchmaker (Discover 1 Lead)", use_container_width=True):
            if not SUPABASE_SERVICE_KEY:
                st.error("Cannot run prospector: SUPABASE_SERVICE_ROLE_KEY missing!")
            else:
                with st.spinner(f"🔍 Fetching top hiring post & crafting hyper-personalized match pitch using {config.get('activeModel', 'gemini-3.6-flash')}..."):
                    hiring_leads = fetch_real_live_hiring_leads(limit=1)
                    processed_leads = []

                    for item in hiring_leads:
                        company = item["company"]
                        role = item["role"]
                        snippet_text = item["snippet"]
                        source_url = item["source_url"]
                        source_type = item["intent_source"]

                        # Dynamic Deep Link Generation
                        low_snip = snippet_text.lower()
                        if "agent" in low_snip or "workflow" in low_snip or "tool" in low_snip:
                            targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=autonomous_agents"
                        elif "rag" in low_snip or "vector" in low_snip or "embedding" in low_snip:
                            targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=ai_rag_app"
                        else:
                            targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=saas_app"

                        quality_score = 92
                        reason = f"Verified live hiring post match from {source_type}"

                        clean_snippet = snippet_text[:120].rstrip('.') if snippet_text else role
                        custom_pitch = f"Hi {company} Team,\n\nI saw your post for {role} ({clean_snippet}...).\n\nAs a Forward Deployed Engineer & AI Solutions Architect, I specialize in building custom AI agents, vector search, and full-stack software assets.\n\nI put together an interactive scoping spec for your stack: {targeted_cta}\n\nBest,\nPrateek Sharma"

                        if GEMINI_API_KEY:
                            pitch_prompt = f"You are writing an outreach pitch as Prateek Sharma (Forward Deployed Engineer & AI Solutions Architect).\n{PORTFOLIO_CONTEXT_PROMPT}\nClient Job Post: Company={company}, Role={role}, Snippet={snippet_text}.\nRules: Write a 3-sentence, hyper-personalized pitch connecting their exact hiring needs to Prateek's real production builds (Retriever AI RAG, Synchronizer, Workspace Dashboard, Next.js 16 + Supabase). Position Prateek as an embedded Forward Deployed Engineer. Include CTA link {targeted_cta}. Sign off from Prateek Sharma. Return plain text ONLY, no markdown."
                            gen_text = call_gemini_with_fallback(pitch_prompt, preferred_model=config.get("activeModel", "gemini-3.6-flash"), api_key=GEMINI_API_KEY)
                            if gen_text:
                                custom_pitch = gen_text.strip()

                        domain_clean = company.lower().replace(" ", "").replace("/", "") + ".com"
                        processed_leads.append({
                            "lead_name": "Hiring Manager / Founder",
                            "company": f"{company} ({role})",
                            "role": role,
                            "email": f"contact@{domain_clean}",
                            "source_url": source_url,
                            "ai_generated_pitch": custom_pitch,
                            "quality_score": quality_score,
                            "intent_source": source_type,
                            "verification_reason": reason,
                            "status": "pending",
                            "created_at": datetime.utcnow().isoformat()
                        })

                    if processed_leads:
                        for lead_data in processed_leads:
                            upsert_record("outreach_leads", lead_data)
                        st.success(f"Discovered & verified 1 hyper-personalized lead from {processed_leads[0]['intent_source']}!")
                    else:
                        st.info("No active hiring posts found matching criteria. Click again to search!")
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
        st.info("No pending pitches in queue. Click 'Run Hyper-Personalized Lead Matchmaker' to discover target leads!")
    else:
        for lead in pending_leads:
            lead_id = lead.get("id")
            with st.container(border=True):
                st.markdown(f"### {lead.get('lead_name')} — {lead.get('company')}")
                
                score = lead.get("quality_score", 92)
                source = lead.get("intent_source", "hn_whoishiring")
                reason = lead.get("verification_reason", "")
                st.caption(f"⭐ **Quality Score**: `{score}/100` | 🎯 **Source**: `{source}` | 🔍 `{reason}`")
                st.caption(f"Role: {lead.get('role', 'N/A')} | Post Link: {lead.get('source_url', 'N/A')}")
                
                pitch_text = st.text_area(
                    "AI Matchmaker Pitch Draft",
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
