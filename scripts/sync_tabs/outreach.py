import os
import sys
import json
import re
import random
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET
from datetime import datetime

# Ensure scripts dir is on sys.path for direct invocation
SCRIPTS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

try:
    import streamlit as st
except ImportError:
    st = None
from sync_tabs.shared import env, HAS_SYNC, upsert_record

DEFAULTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "outreach_defaults.json")

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
        "maxLeadsPerRun": 25,
        "ctaDeepLink": "https://prateeq.in/scoping?engine=saas"
    }

def save_defaults(config):
    try:
        with open(DEFAULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        if st:
            st.success("Updated outreach configuration & prompt settings!")
    except Exception as e:
        if st:
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

def get_known_source_urls(supabase_url, service_key):
    """Fetch all previously recorded source_urls from Supabase to prevent duplicate scraping."""
    if not service_key:
        return set()
    try:
        url = f"{supabase_url.rstrip('/')}/rest/v1/outreach_leads?select=source_url"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {d.get("source_url") for d in data if d.get("source_url")}
    except Exception:
        return set()

PORTFOLIO_CONTEXT_PROMPT = """
Prateek Sharma's Proven Production Background:
- Role: Forward Deployed Engineer & AI Solutions Architect
- Retriever AI SaaS: Built a multi-tenant hybrid search & pgvector HNSW RAG platform with PyTorch ColBERT token MaxSim reranking, HDBSCAN topic modeling, and 3D PCA/UMAP latent projections on Next.js 16 and FastAPI.
- Synchronizer Control Deck: Streamlit management dashboard integrated with Gemini 3.6 Flash for automated skills scanning, certificate analysis, and real-time database sync.
- Client Workspace Dashboard: Google OAuth 2.0 workspace with interactive milestone tracking, Razorpay payment processing, and dynamic commercial PDF proposal exports.
- Cognitive Systems & Reliability: DeBERTa semantic NLI evaluator, AST hexagonal boundary verification with 950+ unit tests, zero-downtime blue/green release deployments, and full OpenTelemetry distributed tracing.
"""

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/xml, application/xml, */*"
}

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class SemanticProfileMatcher:
    """Scikit-Learn TF-IDF N-Gram Vectorizer & Cosine Similarity Engine for Prateek's Profile."""
    def __init__(self):
        self.vectorizer = None
        self.profile_matrix = None
        self.feature_names = None
        self._init_engine()

    def _init_engine(self):
        if not SKLEARN_AVAILABLE:
            return
        try:
            resume_file = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "resume.json")
            resume_data = {}
            if os.path.exists(resume_file):
                with open(resume_file, "r", encoding="utf-8") as f:
                    resume_data = json.load(f)

            corpus_parts = [
                PORTFOLIO_CONTEXT_PROMPT,
                resume_data.get("about", {}).get("developer", {}).get("noir", ""),
                resume_data.get("about", {}).get("business", {}).get("noir", ""),
                " ".join(resume_data.get("about", {}).get("developer", {}).get("facts", [])),
                " ".join(resume_data.get("about", {}).get("developer", {}).get("factsNoir", [])),
                "Forward Deployed Engineer AI Solutions Architect Retriever AI SaaS ColBERT MaxSim einsum token reranker",
                "pgvector HNSW hybrid search BM25 Next.js 16 React 19 FastAPI Python Celery RabbitMQ OpenTelemetry",
                "HDBSCAN topic clustering c-TF-IDF 3D PCA UMAP embedding space projection Three.js WebGL particle cloud",
                "Semantic NLI DeBERTa judge hallucination evaluation RLM Python REPL sandbox Docling Layout OCR LlamaGuard 3",
                "Digital SOW SHA-256 cryptographic freezing 50% deposit escrow HMAC timing-safe webhooks Razorpay"
            ]

            skills = resume_data.get("skills", {})
            if isinstance(skills, dict):
                for cat, sk_list in skills.items():
                    if isinstance(sk_list, list):
                        corpus_parts.append(" ".join(sk_list))

            profile_text = " ".join(corpus_parts)
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True,
                stop_words="english",
                token_pattern=r'(?u)\b[\w\.\-]{2,}\b'
            )
            self.profile_matrix = self.vectorizer.fit_transform([profile_text])
            self.feature_names = self.vectorizer.get_feature_names_out()
        except Exception:
            self.vectorizer = None

    def match(self, title, description):
        if not SKLEARN_AVAILABLE or not self.vectorizer:
            return 0.0, []
        try:
            job_text = f"{title} {description}"
            job_vec = self.vectorizer.transform([job_text])
            sim = float(cosine_similarity(job_vec, self.profile_matrix)[0][0])

            # Find top overlapping n-grams
            job_dense = job_vec.toarray()[0]
            prof_dense = self.profile_matrix.toarray()[0]
            overlap = job_dense * prof_dense
            top_indices = overlap.argsort()[::-1][:5]
            top_terms = [self.feature_names[i] for i in top_indices if overlap[i] > 0]
            return sim, top_terms
        except Exception:
            return 0.0, []

PROFILE_MATCHER = SemanticProfileMatcher()

def is_india_eligible_remote(text):
    """Return True if the job is 100% remote and accessible from India / Worldwide, or open to global candidates."""
    low = text.lower()
    excl = [
        "us citizen only", "us citizenship", "must be in us", "must reside in us",
        "must be located in", "must be based in the us", "must live in the us",
        "authorized to work in the us", "us work authorization", "w2 only", "c2c only",
        "security clearance", "us only", "usa only", "united states only",
        "north america only", "canada only", "uk citizen only", "eu citizen only",
        "latin america only", "latam only",
        "(us & canada)", "us & canada", "us and canada", "us/canada", "us / canada",
        "us or canada", "us/ca", "us & ca", "us/can", "remote (us", "remote (canada",
        "remote (uk", "remote (eu", "remote - us", "remote - uk", "remote - eu",
        "remote - north america"
    ]
    if any(e in low for e in excl):
        return False
    incl = ["remote", "worldwide", "anywhere", "global", "telecommute", "wfh", "work from home", "india", "apac", "emea", "london", "singapore", "bengaluru", "bangalore"]
    return any(i in low for i in incl)

def detect_lead_type(title, description):
    """Determine whether a posting is for a Freelance / Client Project or a Full-Time Job."""
    text = f"{title} {description}".lower()
    freelance_signals = [
        "freelance", "contract", "contractor", "consultant", "consulting", "project-based",
        "project based", "part-time", "part time", "hourly", "b2b", "agency", "advisory",
        "seeking freelancer", "seeking contractor", "gig", "fixed price", "sow", "per project"
    ]
    if any(sig in text for sig in freelance_signals):
        return "client"
    return "job"

def calculate_job_fit_score(title, description):
    """Calculate weighted skill relevance score (0 to 100) using Scikit-Learn TF-IDF cosine similarity."""
    text = f"{title} {description}".lower()

    negative_keywords = [
        "ios", "swift", "swiftui", "android", "kotlin", "objective-c", "c++", "embedded", "firmware",
        "java spring", "spring boot", "php", "wordpress", "drupal", "ruby on rails", "salesforce",
        "devops specialist", "kubernetes administrator", "sre specialist", "flutter", "react native",
        "siem", "edr", "yara", "mitre att&ck", "soc analyst", "threat detection", "penetration testing", "pen testing"
    ]
    for nk in negative_keywords:
        if re.search(r'\b' + re.escape(nk) + r'\b', text):
            return 0, f"Filtered out: {nk}"

    reasons = []

    # 1. Scikit-Learn ML Cosine Similarity
    sim, top_ngrams = PROFILE_MATCHER.match(title, description)
    if sim > 0:
        sim_pct = round(sim * 100, 1)
        reasons.append(f"ML Cosine: {sim_pct}%")
        if top_ngrams:
            reasons.append(f"Matches: {', '.join(top_ngrams[:3])}")

    # 2. Scaled ML base score
    if sim >= 0.35:
        base_score = 85 + min(14, int((sim - 0.35) * 100))
    elif sim >= 0.20:
        base_score = 70 + int(((sim - 0.20) / 0.15) * 15)
    elif sim >= 0.10:
        base_score = 55 + int(((sim - 0.10) / 0.10) * 15)
    else:
        base_score = int(sim * 500)

    # 3. Role Title Alignment bonus (+10 to +20)
    role_bonus = 0
    tier1_roles = {
        "forward deployed": 20, "ai engineer": 18, "solutions architect": 15,
        "founding engineer": 15, "full stack": 12, "fullstack": 12, "product engineer": 12,
        "backend engineer": 8, "frontend engineer": 8
    }
    for role_kw, pts in tier1_roles.items():
        if role_kw in text:
            role_bonus = max(role_bonus, pts)
            reasons.append(f"Role: {role_kw}")
            break

    # 4. Location Alignment (+10)
    loc_bonus = 0
    if any(w in text for w in ["worldwide", "anywhere", "global", "india", "apac", "london", "singapore"]):
        loc_bonus = 10
        reasons.append("Global/Worldwide")
    elif "remote" in text:
        loc_bonus = 8
        reasons.append("Remote")

    # If scikit-learn is not available, fallback to legacy heuristic
    if not SKLEARN_AVAILABLE or sim == 0:
        legacy_score = 0
        tier1_tech = {
            "rag": 25, "pgvector": 25, "vector": 15, "embedding": 15, "fastapi": 20,
            "next.js": 20, "nextjs": 20, "react": 10, "typescript": 10, "python": 15,
            "ai agent": 25, "agentic": 25, "langchain": 15, "llamaindex": 15,
            "supabase": 15, "postgresql": 10, "postgres": 10, "llm": 15
        }
        for tech, pts in tier1_tech.items():
            if re.search(r'\b' + re.escape(tech) + r'\b', text):
                legacy_score += pts
        final_score = min(max(legacy_score + role_bonus + loc_bonus, 0), 98)
        return final_score, " | ".join(reasons) if reasons else "General Match"

    final_score = min(max(base_score + (role_bonus // 2) + (loc_bonus // 2), 0), 99)
    return final_score, " | ".join(reasons) if reasons else "ML Match"

def extract_compensation(text, structured_val=None):
    """Extract salary, hourly rate, or project compensation from text or structured API fields."""
    if structured_val:
        s_str = str(structured_val).strip()
        if s_str and s_str.lower() not in ["none", "null", "", "0", "0 - 0", "competitive"]:
            return s_str

    if not text:
        return None

    clean_text = text.replace("&dollar;", "$").replace("&euro;", "€").replace("&pound;", "£")

    patterns = [
        # $120k - $180k / year or $120k-$180k
        r"(\$\s*\d{1,3}\s*[kK]\s*(?:-|–|to)\s*(?:\$)?\s*\d{1,3}\s*[kK](?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year|annum))?)",
        # $120,000 - $180,000 / yr
        r"(\$\s*\d{2,3},\d{3}\s*(?:-|–|to)\s*(?:\$)?\s*\d{2,3},\d{3}(?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year|annum|usd))?)",
        # Hourly: $50 - $100 / hr or $75/hr or $50-$100/hour
        r"(\$\s*\d{1,3}(?:\.\d{2})?\s*(?:-|–|to)\s*(?:\$)?\s*\d{1,3}(?:\.\d{2})?\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:hr|hour|h))",
        r"(\$\s*\d{1,3}(?:\.\d{2})?\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:hr|hour|h))",
        # Monthly: $5,000 - $10,000 / month or $5k - $8k / mo
        r"(\$\s*\d{1,2}(?:,\d{3}|\s*[kK])\s*(?:-|–|to)\s*(?:\$)?\s*\d{1,2}(?:,\d{3}|\s*[kK])\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:mo|month))",
        r"(\$\s*\d{1,2}(?:,\d{3}|\s*[kK])\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:mo|month))",
        # Single $150k / year or $150,000 / yr
        r"(\$\s*\d{2,3}\s*[kK](?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year|annum))?)",
        r"(\$\s*\d{2,3},\d{3}(?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year|annum))?)",
        # Euro & GBP
        r"([€£]\s*\d{1,3}\s*[kK]\s*(?:-|–|to)\s*(?:[€£])?\s*\d{1,3}\s*[kK](?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year))?)",
        r"([€£]\s*\d{2,3},\d{3}\s*(?:-|–|to)\s*(?:[€£])?\s*\d{2,3},\d{3})",
        r"([€£]\s*\d{1,3}\s*[kK](?:\s*(?:\/\s*|\s*per\s*|\s*a\s*)(?:yr|year))?)",
        # INR / Lakhs / LPA: 25 - 40 LPA or ₹25L - ₹40L or INR 20-30 Lakhs
        r"((?:₹|INR\s*)\s*\d{1,2}(?:\.\d+)?\s*(?:-|–|to)\s*(?:₹|INR\s*)?\s*\d{1,2}(?:\.\d+)?\s*(?:LPA|Lakhs?|L|Cr))",
        r"(\d{1,2}(?:\.\d+)?\s*(?:-|–|to)\s*\d{1,2}(?:\.\d+)?\s*LPA)",
        r"((?:₹|INR\s*)\s*\d{1,2}(?:\.\d+)?\s*(?:LPA|Lakhs?|L))"
    ]

    for pat in patterns:
        match = re.search(pat, clean_text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            val = re.sub(r"\s+", " ", val)
            return val

    return None

def format_compensation_with_inr(comp_str):
    """Normalize and format compensation string with live INR equivalent (1 USD ≈ ₹84)."""
    if not comp_str:
        return None, None
    clean_comp = str(comp_str).strip()
    if any(k in clean_comp.lower() for k in ["lpa", "lakh", "inr", "₹"]):
        return clean_comp, clean_comp

    if "$" in clean_comp:
        usd_matches = re.findall(r'\$\s*(\d{1,3}(?:,\d{3})*|\d+)\s*([kK])?', clean_comp)
        if usd_matches:
            vals = []
            for num_s, k_flag in usd_matches:
                v = float(num_s.replace(',', ''))
                if k_flag.lower() == 'k' or v < 1000:
                    v *= 1000
                vals.append(v)
            if vals:
                def to_inr_text(val):
                    lakhs = (val * 84) / 100000
                    if lakhs >= 100:
                        cr = round(lakhs / 100, 2)
                        return f"₹{cr} Cr LPA"
                    else:
                        return f"₹{round(lakhs, 1)} LPA"

                if len(vals) == 1:
                    inr_str = f"~{to_inr_text(vals[0])}"
                else:
                    t_min = to_inr_text(min(vals))
                    t_max = to_inr_text(max(vals))
                    inr_str = f"~{t_min} - {t_max}"
                return clean_comp, inr_str
    return clean_comp, None

def extract_contact_info(text, company=""):
    """Extract real direct emails and application / ATS links from posting text."""
    ats_patterns = [
        r'https?://(?:jobs\.)?lever\.co/[^\s<>"\']+',
        r'https?://(?:boards\.)?greenhouse\.io/[^\s<>"\']+',
        r'https?://jobs\.ashbyhq\.com/[^\s<>"\']+',
        r'https?://[a-zA-Z0-9-]+\.workable\.com/[^\s<>"\']+',
        r'https?://[a-zA-Z0-9-]+\.breezy\.hr/[^\s<>"\']+',
        r'https?://[a-zA-Z0-9-]+\.notion\.site/[^\s<>"\']+',
        r'https?://apply\.workable\.com/[^\s<>"\']+'
    ]
    ats_link = None
    for pat in ats_patterns:
        match = re.search(pat, text)
        if match:
            ats_link = match.group(0).rstrip('.,;)')
            break

    email_match = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', text)
    valid_emails = [
        e for e in email_match 
        if not any(b in e.lower() for b in ['example.com', 'domain.com', 'ycombinator.com', 'sentry.io', 'github.com'])
    ]
    direct_email = valid_emails[0] if valid_emails else None

    if not direct_email:
        domain_clean = re.sub(r'[^a-zA-Z0-9]', '', company.lower()) + ".com"
        direct_email = f"contact@{domain_clean}"

    return direct_email, ats_link

# ─────────────────────────────────────────────────────────────────────────────
# 8 Multi-Platform Scraper Engines
# ─────────────────────────────────────────────────────────────────────────────

def fetch_hn_whoishiring_concurrent(known_urls):
    """Source 1: Hacker News 'Who is Hiring' monthly thread (120+ comments concurrent)."""
    results = []
    try:
        user_url = 'https://hacker-news.firebaseio.com/v0/user/whoishiring.json'
        req = urllib.request.Request(user_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=5) as resp:
            user_data = json.loads(resp.read().decode('utf-8'))
        
        thread_id = None
        for tid in user_data.get('submitted', [])[:5]:
            item_url = f'https://hacker-news.firebaseio.com/v0/item/{tid}.json'
            with urllib.request.urlopen(urllib.request.Request(item_url, headers=HEADERS), timeout=4) as r:
                tdata = json.loads(r.read().decode('utf-8'))
            if 'who is hiring' in tdata.get('title', '').lower():
                thread_id = tid
                break
                
        if not thread_id:
            return results

        item_url = f'https://hacker-news.firebaseio.com/v0/item/{thread_id}.json'
        with urllib.request.urlopen(urllib.request.Request(item_url, headers=HEADERS), timeout=4) as r:
            tdata = json.loads(r.read().decode('utf-8'))
        kids = tdata.get('kids', [])[:120]

        def fetch_single_comment(cid):
            try:
                kurl = f'https://hacker-news.firebaseio.com/v0/item/{cid}.json'
                with urllib.request.urlopen(urllib.request.Request(kurl, headers=HEADERS), timeout=3) as kr:
                    return json.loads(kr.read().decode('utf-8'))
            except Exception:
                return None

        with ThreadPoolExecutor(max_workers=15) as executor:
            comments = list(executor.map(fetch_single_comment, kids))

        for c in comments:
            if not c:
                continue
            cid = c.get('id')
            source_url = f'https://news.ycombinator.com/item?id={cid}'
            if source_url in known_urls:
                continue

            raw_text = c.get('text', '')
            clean_text = re.sub(r'<[^>]+>', ' ', raw_text).strip()
            lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
            first_line = lines[0] if lines else clean_text[:100]

            if not is_india_eligible_remote(clean_text):
                continue

            parts = [p.strip() for p in first_line.split('|')]
            company = parts[0] if len(parts) > 0 else 'Tech Startup'
            role = parts[1] if len(parts) > 1 else 'Remote Software Engineer'

            score, reason = calculate_job_fit_score(role, clean_text)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_text, company)
                lead_type = detect_lead_type(role, clean_text)
                comp = extract_compensation(clean_text)
                results.append({
                    'company': company,
                    'role': role,
                    'source_url': ats_link or source_url,
                    'snippet': clean_text[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'hn_whoishiring',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_hn_freelance_live(known_urls):
    """Source 2: Hacker News Algolia Live Search API for Freelance & Client Gigs."""
    results = []
    queries = ['"seeking freelancer"', '"seeking contractor"', '"contract" AND "rag"', '"freelance" AND "nextjs"']
    try:
        for q in queries:
            url = f'https://hn.algolia.com/api/v1/search_by_date?query={urllib.parse.quote(q)}&tags=comment&hitsPerPage=12'
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            hits = data.get('hits', [])
            for h in hits:
                cid = h.get('objectID')
                source_url = f'https://news.ycombinator.com/item?id={cid}'
                if source_url in known_urls:
                    continue

                raw_text = h.get('comment_text', '')
                clean_text = re.sub(r'<[^>]+>', ' ', raw_text).strip()
                if not is_india_eligible_remote(clean_text):
                    continue

                author = h.get('author', 'HN Client')
                score, reason = calculate_job_fit_score('AI / Full-Stack Contract Consultant', clean_text)
                if score >= 70:
                    direct_email, ats_link = extract_contact_info(clean_text, author)
                    comp = extract_compensation(clean_text)
                    results.append({
                        'company': f"Client: @{author}",
                        'role': 'Freelance / Contract AI Engineer',
                        'source_url': ats_link or source_url,
                        'snippet': clean_text[:600],
                        'email': direct_email,
                        'quality_score': score,
                        'intent_source': 'hn_freelance_live',
                        'lead_type': 'client',
                        'compensation': comp,
                        'verification_reason': f"Direct Freelance Project ({reason})"
                    })
    except Exception:
        pass
    return results

def fetch_weworkremotely_jobs(known_urls):
    """Source 3: WeWorkRemotely RSS feed."""
    results = []
    try:
        wwr_url = 'https://weworkremotely.com/categories/remote-programming-jobs.rss'
        req = urllib.request.Request(wwr_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=5) as resp:
            root = ET.fromstring(resp.read())

        for item in root.findall('.//item'):
            title = item.find('title').text or ''
            link = item.find('link').text or ''
            if link in known_urls:
                continue

            desc = item.find('description').text or title
            clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()

            if not is_india_eligible_remote(clean_desc):
                continue

            if ':' in title:
                company, role = title.split(':', 1)
            else:
                company, role = title, 'Remote Developer'

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                lead_type = detect_lead_type(role, clean_desc)
                comp = extract_compensation(clean_desc)
                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': ats_link or link,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'weworkremotely',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_himalayas_jobs(known_urls):
    """Source 4: Himalayas Remote Startup RSS Feed (100 items)."""
    results = []
    try:
        url = 'https://himalayas.app/jobs/rss'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=5) as resp:
            root = ET.fromstring(resp.read())

        for item in root.findall('.//item'):
            title = item.find('title').text or ''
            link = item.find('link').text or ''
            if link in known_urls:
                continue

            desc = item.find('description').text or title
            clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()

            if not is_india_eligible_remote(clean_desc):
                continue

            company = "Tech Startup"
            role = title
            if " at " in title:
                parts = title.split(" at ", 1)
                role, company = parts[0], parts[1]

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                lead_type = detect_lead_type(role, clean_desc)
                comp = extract_compensation(clean_desc)
                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': ats_link or link,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'himalayas',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_remoteok_jobs(known_urls):
    """Source 5: RemoteOK Public API."""
    results = []
    try:
        url = 'https://remoteok.com/api'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            jobs = json.loads(resp.read().decode('utf-8'))

        for job in jobs[1:60]:
            if not isinstance(job, dict):
                continue
            link = job.get('url') or f"https://remoteok.com/remote-jobs/{job.get('id')}"
            if link in known_urls:
                continue

            company = job.get('company', 'Tech Startup')
            role = job.get('position', 'Remote Developer')
            description = job.get('description', '')
            tags = " ".join(job.get('tags', []))
            full_text = f"{role} {tags} {description}"
            clean_desc = re.sub(r'<[^>]+>', ' ', full_text).strip()

            location = job.get('location', '').lower()
            if any(e in location for e in ['us only', 'usa only', 'north america', 'uk only', 'eu only']):
                continue

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                apply_url = job.get('apply_url') or ats_link or link
                lead_type = detect_lead_type(role, clean_desc)
                
                # Check structured salary fields from RemoteOK
                s_min = job.get('salary_min')
                s_max = job.get('salary_max')
                structured_comp = None
                if s_min and s_max and s_max > 0:
                    structured_comp = f"${s_min:,} - ${s_max:,} / yr"
                elif job.get('salary'):
                    structured_comp = str(job.get('salary'))
                comp = extract_compensation(clean_desc, structured_comp)

                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': apply_url,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'remoteok',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_remotive_jobs(known_urls):
    """Source 6: Remotive Public Software Dev API."""
    results = []
    try:
        url = 'https://remotive.com/api/remote-jobs?category=software-dev'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            jobs = data.get('jobs', [])

        for job in jobs:
            link = job.get('url', '')
            if link in known_urls:
                continue

            company = job.get('company_name', 'Tech Startup')
            role = job.get('title', 'Remote Developer')
            candidate_req = job.get('candidate_required_location', '').lower()
            if any(e in candidate_req for e in ['us only', 'usa only', 'north america', 'uk only', 'eu only']):
                continue

            desc = job.get('description', '')
            clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                lead_type = detect_lead_type(role, clean_desc)
                comp = extract_compensation(clean_desc, job.get('salary'))
                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': ats_link or link,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'remotive',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_jobicy_jobs(known_urls):
    """Source 7: Jobicy Remote Engineering API."""
    results = []
    try:
        url = 'https://jobicy.com/api/v2/remote-jobs?count=50&industry=engineering'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            jobs = data.get('jobs', [])

        for job in jobs:
            link = job.get('url', '')
            if link in known_urls:
                continue

            company = job.get('companyName', 'Tech Startup')
            role = job.get('jobTitle', 'Remote Developer')
            geo = job.get('jobGeo', '').lower()
            if any(e in geo for e in ['usa only', 'uk only', 'europe only', 'canada only']):
                continue

            desc = job.get('jobDescription', '')
            clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                lead_type = detect_lead_type(role, clean_desc)
                
                s_min = job.get('annualSalaryMin')
                s_max = job.get('annualSalaryMax')
                s_curr = job.get('salaryCurrency', 'USD')
                structured_comp = None
                if s_min and s_max and int(s_max) > 0:
                    structured_comp = f"${int(s_min):,} - ${int(s_max):,} {s_curr} / yr"
                comp = extract_compensation(clean_desc, structured_comp)

                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': ats_link or link,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'jobicy',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_arbeitnow_jobs(known_urls):
    """Source 8: Arbeitnow Remote Tech API."""
    results = []
    try:
        url = 'https://www.arbeitnow.com/api/job-board-api'
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            jobs = data.get('data', [])

        for job in jobs:
            if not job.get('remote'):
                continue
            link = job.get('url', '')
            if link in known_urls:
                continue

            company = job.get('company_name', 'Tech Startup')
            role = job.get('title', 'Remote Developer')
            desc = job.get('description', '')
            clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()

            score, reason = calculate_job_fit_score(role, clean_desc)
            if score >= 75:
                direct_email, ats_link = extract_contact_info(clean_desc, company)
                lead_type = detect_lead_type(role, clean_desc)
                comp = extract_compensation(clean_desc, job.get('salary'))
                results.append({
                    'company': company.strip(),
                    'role': role.strip(),
                    'source_url': ats_link or link,
                    'snippet': clean_desc[:600],
                    'email': direct_email,
                    'quality_score': score,
                    'intent_source': 'arbeitnow',
                    'lead_type': lead_type,
                    'compensation': comp,
                    'verification_reason': reason
                })
    except Exception:
        pass
    return results

def fetch_direct_ats_jobs(known_urls):
    """Source 9: Direct ATS JSON APIs across 45+ Top AI & Remote Giants (Greenhouse + Ashby)."""
    results = []
    gh_companies = [
        'gitlab', 'sourcegraph', 'elastic', 'sentry', 'retool', 'canonical',
        'duckduckgo', 'hashicorp', 'automattic', 'zapier', 'mux', 'stripe',
        'postman', 'browserstack', 'supabase', 'datadog', 'cloudflare',
        'airtable', 'snowflake', 'clickhouse', 'mongodb', 'cockroachlabs'
    ]
    ashby_companies = [
        'linear', 'vercel', 'langchain', 'perplexity', 'together', 'modal',
        'elevenlabs', 'anyscale', 'cursor', 'cohere', 'replit', 'groq',
        'mistral', 'tavily', 'firecrawl', 'browserbase', 'pinecone', 'weaviate',
        'qdrant', 'glean', 'braintrust', 'deepgram', 'dust', 'writer', 'huggingface'
    ]

    def check_gh(slug):
        sub_res = []
        try:
            url = f'https://boards-api.greenhouse.io/v1/boards/{slug}/jobs'
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            for j in data.get('jobs', []):
                link = j.get('absolute_url', '')
                if link in known_urls:
                    continue
                title = j.get('title', '')
                loc = j.get('location', {}).get('name', '')
                full_text = f"{title} Location: {loc} {slug}"
                if not is_india_eligible_remote(full_text):
                    continue
                score, reason = calculate_job_fit_score(title, full_text)
                if score >= 70:
                    direct_email, ats_link = extract_contact_info(full_text, slug.capitalize())
                    comp = extract_compensation(full_text)
                    sub_res.append({
                        'company': slug.capitalize(),
                        'role': title.strip(),
                        'source_url': ats_link or link,
                        'snippet': f"Direct Greenhouse Career Board: {title} ({loc})",
                        'email': direct_email,
                        'quality_score': score,
                        'intent_source': f'ats_{slug}',
                        'lead_type': 'job',
                        'compensation': comp,
                        'verification_reason': f"Top Startup Direct ATS ({reason})"
                    })
        except Exception:
            pass
        return sub_res

    def check_ashby(slug):
        sub_res = []
        try:
            url = f'https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true'
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            for j in data.get('jobs', []):
                link = j.get('jobUrl', '')
                if link in known_urls:
                    continue
                title = j.get('title', '')
                loc = str(j.get('location', ''))
                comp_data = j.get('compensation', {})
                comp_str = comp_data.get('compensationTierSummary') if isinstance(comp_data, dict) else None
                full_text = f"{title} Location: {loc} Comp: {comp_str} {slug}"
                if not is_india_eligible_remote(full_text):
                    continue
                score, reason = calculate_job_fit_score(title, full_text)
                if score >= 70:
                    direct_email, ats_link = extract_contact_info(full_text, slug.capitalize())
                    comp = extract_compensation(full_text, comp_str)
                    sub_res.append({
                        'company': slug.capitalize(),
                        'role': title.strip(),
                        'source_url': ats_link or link,
                        'snippet': f"Direct Ashby Career Board: {title} ({loc})",
                        'email': direct_email,
                        'quality_score': score,
                        'intent_source': f'ashby_{slug}',
                        'lead_type': 'job',
                        'compensation': comp,
                        'verification_reason': f"Top AI Startup Direct ATS ({reason})"
                    })
        except Exception:
            pass
        return sub_res

    try:
        with ThreadPoolExecutor(max_workers=20) as executor:
            gh_futures = [executor.submit(check_gh, s) for s in gh_companies]
            ashby_futures = [executor.submit(check_ashby, s) for s in ashby_companies]
            for f in gh_futures + ashby_futures:
                results.extend(f.result())
    except Exception:
        pass
    return results

def fetch_direct_lever_jobs(known_urls):
    """Source 11: Direct Lever ATS JSON APIs across Tier-1 AI & Global Tech Leaders (Palantir, Spotify, etc.)."""
    results = []
    lever_companies = ['palantir', 'spotify', 'wealthfront', 'canva', 'atlassian', 'netflix']

    def check_lever(slug):
        sub_res = []
        try:
            url = f'https://api.lever.co/v0/postings/{slug}?mode=json'
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=6) as resp:
                jobs = json.loads(resp.read().decode('utf-8'))

            for j in jobs:
                link = j.get('hostedUrl', '') or j.get('applyUrl', '')
                if not link or link in known_urls:
                    continue
                title = j.get('text', '')
                cats = j.get('categories', {})
                loc = str(cats.get('location', ''))
                team = str(cats.get('team', ''))
                workplace = str(j.get('workplaceType', ''))
                desc_plain = j.get('descriptionPlain', '') or ''
                additional = j.get('additionalPlain', '') or ''
                full_text = f"{title} Location: {loc} Team: {team} Workplace: {workplace}\n{desc_plain}\n{additional}"

                if not is_india_eligible_remote(f"{title} {loc} {workplace}"):
                    continue

                score, reason = calculate_job_fit_score(title, full_text)
                if score >= 70:
                    direct_email, ats_link = extract_contact_info(full_text, slug.capitalize())
                    comp = extract_compensation(full_text)
                    lead_type = detect_lead_type(title, full_text)
                    sub_res.append({
                        'company': slug.capitalize(),
                        'role': title.strip(),
                        'source_url': ats_link or link,
                        'snippet': f"Direct Lever ATS: {title} ({loc}) - {desc_plain[:300]}",
                        'email': direct_email,
                        'quality_score': score,
                        'intent_source': f'lever_{slug}',
                        'lead_type': lead_type,
                        'compensation': comp,
                        'verification_reason': f"Tier-1 AI Lever ATS ({reason})"
                    })
        except Exception:
            pass
        return sub_res

    try:
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(check_lever, s) for s in lever_companies]
            for f in futures:
                results.extend(f.result())
    except Exception:
        pass
    return results

def fetch_tier1_fast_scan(known_urls):
    """Fast scan focused exclusively on 50+ Tier-1 AI Unicorns and Direct ATS Boards (Lever, Ashby, Greenhouse)."""
    results = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_lever = executor.submit(fetch_direct_lever_jobs, known_urls)
        f_ats = executor.submit(fetch_direct_ats_jobs, known_urls)
        results.extend(f_lever.result())
        results.extend(f_ats.result())
    return results

def fetch_jobspy_multiboard(known_urls):
    """Source 10: Multi-Board Aggregator (LinkedIn, Indeed, Google Jobs via JobSpy)."""
    results = []
    try:
        from jobspy import scrape_jobs
        jobs_df = scrape_jobs(
            site_name=["google", "indeed"],
            search_term="AI Engineer RAG Next.js",
            location="India",
            results_wanted=15,
            is_remote=True,
            country_indeed="India"
        )
        if jobs_df is not None and not jobs_df.empty:
            for _, row in jobs_df.iterrows():
                link = str(row.get('job_url', '')).strip()
                if not link or link in known_urls or link == 'nan':
                    continue
                title = str(row.get('title', 'Remote Developer'))
                company = str(row.get('company', 'Tech Startup'))
                if company == 'nan':
                    company = 'AI Startup'
                desc = str(row.get('description', ''))
                full_text = f"{title} {company} {desc}"
                if not is_india_eligible_remote(full_text):
                    continue
                score, reason = calculate_job_fit_score(title, full_text)
                if score >= 75:
                    direct_email, ats_link = extract_contact_info(full_text, company)
                    
                    min_amt = row.get('min_amount')
                    max_amt = row.get('max_amount')
                    curr = row.get('currency', 'USD')
                    struct_comp = None
                    if min_amt and max_amt and str(min_amt) != 'nan':
                        struct_comp = f"${int(min_amt):,} - ${int(max_amt):,} {curr}"
                    comp = extract_compensation(full_text, struct_comp)
                    
                    lead_type = detect_lead_type(title, full_text)
                    results.append({
                        'company': company,
                        'role': title,
                        'source_url': ats_link or link,
                        'snippet': desc[:600] if desc and desc != 'nan' else f"{title} at {company}",
                        'email': direct_email,
                        'quality_score': score,
                        'intent_source': 'jobspy_multiboard',
                        'lead_type': lead_type,
                        'compensation': comp,
                        'verification_reason': f"Multi-Board Search ({reason})"
                    })
    except Exception:
        pass
    return results

def query_retriever_for_job_match(job_title, job_company, job_details):
    """Query live Retriever API on rag.prateeq.in for deep semantic vector retrieval & ColBERT evidence."""
    retriever_url = os.environ.get("NEXT_PUBLIC_RETRIEVER_API_URL") or "https://rag.prateeq.in"
    tenant_id = os.environ.get("RETRIEVER_SCOPING_TENANT_ID") or "1f85286c-9d9a-4ebc-9c62-a99360a5ece4"
    api_key = os.environ.get("RETRIEVER_SCOPING_API_KEY") or ""

    query_text = f"{job_title} at {job_company}: {job_details[:300]}"
    try:
        url = f"{retriever_url.rstrip('/')}/v1/search"
        payload = json.dumps({
            "tenant_id": tenant_id,
            "query": query_text,
            "top_k": 3
        }).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "SynchronizerHeadhunter/1.0"
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            headers["X-API-Key"] = api_key

        req = urllib.request.Request(url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("results", [])
    except Exception as e:
        return [{"error": str(e)}]

def generate_multi_channel_pitches(company, role, snippet_text, config, api_key, lead_type="job"):
    """Generate 3 distinct high-impact outreach assets (Email, LinkedIn <300 chars, and ATS Cover Letter)."""
    low_snip = snippet_text.lower()
    if "agent" in low_snip or "workflow" in low_snip or "tool" in low_snip:
        targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=autonomous_agents"
    elif "rag" in low_snip or "vector" in low_snip or "embedding" in low_snip:
        targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=ai_rag_app"
    else:
        targeted_cta = "https://prateeq.in/scoping?engine=saas&goal=saas_app"

    clean_snippet = snippet_text[:120].rstrip('.') if snippet_text else role

    if lead_type == "client":
        fallback_email = f"Hi {company} Team,\n\nI noticed your project requirements for {role} ({clean_snippet}...).\n\nAs an independent AI Solutions Architect & Forward Deployed Engineer, I build custom multi-tenant RAG systems, AI agents, and full-stack software assets on contract with rapid sprint delivery.\n\nI put together an interactive scope & digital architecture spec for your stack: {targeted_cta}\n\nBest,\nPrateek Sharma"
        fallback_li = f"Hi {company} Team, saw your {role} requirements. I build custom multi-tenant RAG systems & AI agents with rapid sprint delivery (prateeq.in). Let's connect!"
        fallback_cover = f"Dear {company} Team,\n\nI am writing to express my strong interest in the {role} project. Over recent production cycles, I architected and deployed enterprise-grade cognitive platforms (Next.js 16, pgvector HNSW, ColBERT MaxSim, and distributed Celery workers) with 950+ passing tests.\n\nMy forward-deployed engineering approach bridges client strategy with rapid code delivery. You can inspect my live production systems at https://prateeq.in. I welcome the opportunity to discuss how I can accelerate {company}'s technical roadmap."
    else:
        fallback_email = f"Hi {company} Team,\n\nI saw your post for {role} ({clean_snippet}...).\n\nAs a Forward Deployed Engineer & AI Solutions Architect, I specialize in building custom AI agents, vector search, and full-stack software assets.\n\nI put together an interactive scoping spec for your stack: {targeted_cta}\n\nBest,\nPrateek Sharma"
        fallback_li = f"Hi {company} Team, saw your {role} opening! I architected a multi-tenant RAG platform with ColBERT MaxSim, pgvector, and Next.js 16 (prateeq.in). Would love to connect and contribute!"
        fallback_cover = f"Dear {company} Hiring Team,\n\nI am writing to apply for the {role} position. As a Forward Deployed Engineer & AI Solutions Architect, I build and take production AI workflows to scale—including pgvector hybrid retrieval, ColBERT token MaxSim rerankers, and zero-downtime blue/green deployment pipelines.\n\nMy live production builds and architecture knowledge graphs are accessible at https://prateeq.in. I look forward to contributing my systems execution velocity to {company}."

    if len(fallback_li) > 295:
        fallback_li = fallback_li[:292] + "..."

    default_result = {
        "email": fallback_email,
        "linkedin": fallback_li,
        "cover_letter": fallback_cover
    }

    if not api_key:
        return default_result

    positioning = (
        "Position Prateek as an independent AI Solutions Architect / Forward Deployed Contractor."
        if lead_type == "client"
        else "Position Prateek as an embedded Forward Deployed Engineer / AI Product Engineer."
    )

    prompt = f"""You are writing high-conversion multi-channel outreach assets as Prateek Sharma (Forward Deployed Engineer & AI Solutions Architect).
{PORTFOLIO_CONTEXT_PROMPT}

Target Opportunity:
Company: {company}
Role: {role}
Posting Details: {snippet_text}
Lead Type: {lead_type}

Rules:
1. "email": Write a 3-sentence, hyper-personalized pitch connecting their exact hiring/project needs to Prateek's real production builds (Retriever AI SaaS RAG, ColBERT token MaxSim, pgvector HNSW, Next.js 16 + Supabase). {positioning} Include CTA link {targeted_cta}. Sign off from Prateek Sharma.
2. "linkedin": Write a punchy, personalized LinkedIn connection note strictly UNDER 280 CHARACTERS (character count is crucial for LinkedIn limit). Highlight Prateek's relevant production architecture (prateeq.in) and express eagerness to connect.
3. "cover_letter": Write a 2-paragraph technical ATS cover letter snippet explaining specifically why Prateek's production systems and forward deployed engineering velocity make him an ideal fit for {company}.

Return ONLY valid JSON matching this exact structure:
{{"email": "...", "linkedin": "...", "cover_letter": "..."}}"""

    gen_text = call_gemini_with_fallback(prompt, preferred_model=config.get("activeModel", "gemini-3.6-flash"), api_key=api_key)
    if gen_text:
        try:
            clean_json = re.sub(r"^```json\s*", "", gen_text.strip())
            clean_json = re.sub(r"\s*```$", "", clean_json.strip())
            parsed = json.loads(clean_json)
            if isinstance(parsed, dict) and "email" in parsed and "linkedin" in parsed:
                li = parsed.get("linkedin", "")
                if len(li) > 295:
                    parsed["linkedin"] = li[:292] + "..."
                return parsed
        except Exception:
            pass
    return default_result

def generate_tailored_pitch(company, role, snippet_text, config, api_key, lead_type="job"):
    """Generate structured multi-channel pitches and return as JSON string."""
    pitches = generate_multi_channel_pitches(company, role, snippet_text, config, api_key, lead_type=lead_type)
    return json.dumps(pitches)

def render_outreach_tab():
    if not st:
        return
    st.markdown('<div class="section-header">Autonomous Job Hunter & Lead Prospecting Cockpit</div>', unsafe_allow_html=True)
    st.caption("11-Source Real-Time Aggregator: Hacker News, Direct Lever (Palantir/Spotify), Direct Ashby (25+ AI Startups), Direct Greenhouse (20+ Giants), WeWorkRemotely, Himalayas, Jobicy, RemoteOK, Remotive, Arbeitnow & HN Freelance Live. Powered by Scikit-Learn TF-IDF Cosine Match & Gemini 3.6 Flash.")

    config = load_defaults()

    SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://osaqaemntuzrjouzobvx.supabase.co")
    SUPABASE_SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    GEMINI_API_KEY = env.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY", "")

    if not SUPABASE_SERVICE_KEY:
        st.warning("⚠️ SUPABASE_SERVICE_ROLE_KEY environment variable is missing in .env.local")

    with st.expander("⚙️ Lead Sources & AI Settings (Gemini 3.6 Flash & Scikit-Learn)", expanded=False):
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

    # Main Action Controls
    c_btn1, c_btn_fast, c_btn2 = st.columns([2.5, 2.5, 1])
    with c_btn1:
        if st.button("🚀 Scan All 11 Mega Sources (Full Deep Hunter)", type="primary", use_container_width=True):
            if not SUPABASE_SERVICE_KEY:
                st.error("Cannot run hunter: SUPABASE_SERVICE_ROLE_KEY missing!")
            else:
                progress_bar = st.progress(0, text="Fetching previously recorded history for deduplication...")
                known_urls = get_known_source_urls(SUPABASE_URL, SUPABASE_SERVICE_KEY)

                all_discovered = []

                # Fetch all 11 feeds concurrently
                progress_bar.progress(8, text="🔍 Scanning Hacker News 'Who is Hiring' (120+ comments)...")
                hn_leads = fetch_hn_whoishiring_concurrent(known_urls)
                all_discovered.extend(hn_leads)

                progress_bar.progress(16, text="🔍 Scanning Hacker News Live Freelance Gigs (Algolia API)...")
                hn_free = fetch_hn_freelance_live(known_urls)
                all_discovered.extend(hn_free)

                progress_bar.progress(28, text="🔍 Scanning Direct Lever ATS (Palantir, Spotify, Atlassian, Canva)...")
                lever_leads = fetch_direct_lever_jobs(known_urls)
                all_discovered.extend(lever_leads)

                progress_bar.progress(42, text="🔍 Scanning Direct ATS Boards (Ashby & Greenhouse for 45+ AI Startups)...")
                ats_leads = fetch_direct_ats_jobs(known_urls)
                all_discovered.extend(ats_leads)

                progress_bar.progress(55, text="🔍 Scanning WeWorkRemotely RSS feed...")
                wwr_leads = fetch_weworkremotely_jobs(known_urls)
                all_discovered.extend(wwr_leads)

                progress_bar.progress(66, text="🔍 Scanning Himalayas Remote Startup feed (100 jobs)...")
                hima_leads = fetch_himalayas_jobs(known_urls)
                all_discovered.extend(hima_leads)

                progress_bar.progress(75, text="🔍 Scanning Jobicy Remote Engineering API...")
                jobicy_leads = fetch_jobicy_jobs(known_urls)
                all_discovered.extend(jobicy_leads)

                progress_bar.progress(83, text="🔍 Scanning RemoteOK API...")
                rok_leads = fetch_remoteok_jobs(known_urls)
                all_discovered.extend(rok_leads)

                progress_bar.progress(90, text="🔍 Scanning Remotive & Arbeitnow APIs...")
                remotive_leads = fetch_remotive_jobs(known_urls)
                all_discovered.extend(remotive_leads)
                arbeit_leads = fetch_arbeitnow_jobs(known_urls)
                all_discovered.extend(arbeit_leads)

                progress_bar.progress(95, text="🔍 Running JobSpy Multi-Board Engine (Google Jobs & Indeed)...")
                jobspy_leads = fetch_jobspy_multiboard(known_urls)
                all_discovered.extend(jobspy_leads)

                progress_bar.progress(98, text="Persisting qualified matching opportunities to Shortlist Queue...")

                new_count = 0
                for item in all_discovered:
                    lead_payload = {
                        "lead_name": "Hiring Manager / Founder",
                        "company": item["company"],
                        "role": item["role"],
                        "email": item["email"],
                        "source_url": item["source_url"],
                        "ai_generated_pitch": "", # On-demand pitch generation
                        "quality_score": item["quality_score"],
                        "intent_source": item["intent_source"],
                        "lead_type": item.get("lead_type", "job"),
                        "compensation": item.get("compensation"),
                        "verification_reason": item["verification_reason"],
                        "status": "shortlisted",
                        "created_at": datetime.utcnow().isoformat()
                    }
                    upsert_record("outreach_leads", lead_payload)
                    new_count += 1

                progress_bar.progress(100, text="Done!")
                if new_count > 0:
                    st.success(f"🎯 Discovered and shortlisted {new_count} new opportunities across 11 platforms!")
                else:
                    st.info("Scan complete. No new unrecorded matching jobs or clients found at this moment.")
                st.rerun()

    with c_btn_fast:
        if st.button("🎯 Fast-Scan: Tier-1 AI Startups Only (Palantir, Ashby, Greenhouse)", use_container_width=True):
            if not SUPABASE_SERVICE_KEY:
                st.error("Cannot run hunter: SUPABASE_SERVICE_ROLE_KEY missing!")
            else:
                progress_bar = st.progress(0, text="Fetching history for deduplication...")
                known_urls = get_known_source_urls(SUPABASE_URL, SUPABASE_SERVICE_KEY)

                progress_bar.progress(30, text="🎯 Fast-scanning Palantir & Tier-1 Direct Lever Boards...")
                lever_leads = fetch_direct_lever_jobs(known_urls)

                progress_bar.progress(70, text="🎯 Fast-scanning 45+ Top AI Startups on Ashby & Greenhouse...")
                ats_leads = fetch_direct_ats_jobs(known_urls)

                all_tier1 = lever_leads + ats_leads
                progress_bar.progress(90, text="Persisting Tier-1 matches...")

                new_count = 0
                for item in all_tier1:
                    lead_payload = {
                        "lead_name": "Hiring Manager / Founder",
                        "company": item["company"],
                        "role": item["role"],
                        "email": item["email"],
                        "source_url": item["source_url"],
                        "ai_generated_pitch": "",
                        "quality_score": item["quality_score"],
                        "intent_source": item["intent_source"],
                        "lead_type": item.get("lead_type", "job"),
                        "compensation": item.get("compensation"),
                        "verification_reason": item["verification_reason"],
                        "status": "shortlisted",
                        "created_at": datetime.utcnow().isoformat()
                    }
                    upsert_record("outreach_leads", lead_payload)
                    new_count += 1

                progress_bar.progress(100, text="Done!")
                if new_count > 0:
                    st.success(f"🎯 Discovered and shortlisted {new_count} new Tier-1 AI openings (Palantir, Vercel, Linear, etc.)!")
                else:
                    st.info("Fast-scan complete. All current Tier-1 AI openings are already in your shortlist.")
                st.rerun()

    with c_btn2:
        if st.button("🔄 Refresh", use_container_width=True):
            st.rerun()

    st.markdown("---")

    # Fetch leads from Supabase REST
    leads = []
    if SUPABASE_SERVICE_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/outreach_leads?select=*&order=quality_score.desc,created_at.desc"
            req = urllib.request.Request(url, headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            })
            with urllib.request.urlopen(req, timeout=5) as resp:
                leads = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            st.error(f"Failed to fetch leads from Supabase: {e}")

    shortlisted_leads = [l for l in leads if l.get("status") == "shortlisted"]
    pending_pitches = [l for l in leads if l.get("status") == "pending"]
    sent_leads = [l for l in leads if l.get("status") == "sent"]
    declined_leads = [l for l in leads if l.get("status") in ["declined", "dismissed", "rejected"]]

    # Summary KPI Metric Cards
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("🌟 Shortlisted Total", len(shortlisted_leads))
    m2.metric("✍️ Ready for Review", len(pending_pitches))
    m3.metric("🚀 Dispatched / Sent", len(sent_leads))
    m4.metric("📁 Declined (Excluded)", len(declined_leads))

    tab1, tab2, tab3, tab4 = st.tabs([
        f"🌟 Shortlisted Opportunities ({len(shortlisted_leads)})",
        f"✍️ Pitches Ready ({len(pending_pitches)})",
        f"🚀 Dispatched ({len(sent_leads)})",
        f"📁 Excluded Archive ({len(declined_leads)})"
    ])

    with tab1:
        st.caption("Review shortlisted opportunities. Powered by Scikit-Learn TF-IDF Cosine Match scoring, live USD ↔ INR normalizer, and 3-in-1 pitch drafting.")

        # Interactive Search & Filter Row
        c_search, c_comp_filter = st.columns([3, 2])
        with c_search:
            search_query = st.text_input("🔍 Search by Keyword, Role, or Company:", placeholder="e.g. Palantir, ColBERT, RAG, Forward Deployed...", key="lead_search_kw")
        with c_comp_filter:
            comp_filter = st.selectbox("💵 Compensation Filter:", [
                "All Compensation Levels",
                "High-Ticket Only ($100k+ / ₹35L+)",
                "Mid-to-High ($50k+ / ₹20L+)",
                "Disclosed Pay Only"
            ], key="lead_comp_sel")

        # Quick Preset Category Pills
        quick_preset = st.radio(
            "Filter Category:",
            [
                f"All Opportunities ({len(shortlisted_leads)})",
                f"🔥 Top ML Matches ({len([l for l in shortlisted_leads if l.get('quality_score', 0) >= 85])})",
                f"🎯 Tier-1 Direct ATS ({len([l for l in shortlisted_leads if any(k in l.get('intent_source', '') for k in ['lever', 'ashby', 'ats'])])})",
                f"💼 Remote Jobs ({len([l for l in shortlisted_leads if l.get('lead_type', 'job') == 'job'])})",
                f"🤝 Freelance / Client Projects ({len([l for l in shortlisted_leads if l.get('lead_type') == 'client'])})"
            ],
            horizontal=True
        )

        filtered_shortlist = shortlisted_leads
        if "🔥 Top ML Matches" in quick_preset:
            filtered_shortlist = [l for l in filtered_shortlist if l.get("quality_score", 0) >= 85]
        elif "🎯 Tier-1 Direct ATS" in quick_preset:
            filtered_shortlist = [l for l in filtered_shortlist if any(k in l.get("intent_source", "") for k in ["lever", "ashby", "ats"])]
        elif "💼 Remote Jobs" in quick_preset:
            filtered_shortlist = [l for l in filtered_shortlist if l.get("lead_type", "job") == "job"]
        elif "🤝 Freelance" in quick_preset:
            filtered_shortlist = [l for l in filtered_shortlist if l.get("lead_type") == "client"]

        # Apply search query filter
        if search_query:
            sq_low = search_query.lower()
            filtered_shortlist = [
                l for l in filtered_shortlist
                if sq_low in l.get("role", "").lower()
                or sq_low in l.get("company", "").lower()
                or sq_low in l.get("verification_reason", "").lower()
                or sq_low in l.get("snippet", "").lower()
            ]

        # Apply comp filter
        if comp_filter == "Disclosed Pay Only":
            filtered_shortlist = [l for l in filtered_shortlist if l.get("compensation")]
        elif comp_filter == "High-Ticket Only ($100k+ / ₹35L+)":
            def is_high_ticket(l):
                c = l.get("compensation", "") or ""
                if not c: return False
                if any(x in c.lower() for x in ["100k", "120k", "130k", "140k", "150k", "160k", "170k", "180k", "200k", "35l", "40l", "45l", "50l", "1cr", "cr"]):
                    return True
                vals = re.findall(r'\$\s*(\d{2,3}),?\d{3}', c)
                if vals and any(int(v) >= 100 for v in vals):
                    return True
                return False
            filtered_shortlist = [l for l in filtered_shortlist if is_high_ticket(l)]
        elif comp_filter == "Mid-to-High ($50k+ / ₹20L+)":
            def is_mid_to_high(l):
                c = l.get("compensation", "") or ""
                if not c: return False
                if any(x in c.lower() for x in ["50k", "60k", "70k", "80k", "90k", "100k", "120k", "130k", "140k", "150k", "20l", "25l", "30l", "35l"]):
                    return True
                vals = re.findall(r'\$\s*(\d{2,3}),?\d{3}', c)
                if vals and any(int(v) >= 50 for v in vals):
                    return True
                return False
            filtered_shortlist = [l for l in filtered_shortlist if is_mid_to_high(l)]

        if not filtered_shortlist:
            st.info("No opportunities currently matching this filter. Click 'Fast-Scan Tier-1 AI Startups' or 'Scan All 11 Sources' above to discover new openings!")
        else:
            for lead in filtered_shortlist:
                lead_id = lead.get("id")
                lead_type = lead.get("lead_type", "job")
                type_badge = "🤝 **FREELANCE / CLIENT PROJECT**" if lead_type == "client" else "💼 **FULL-TIME REMOTE JOB**"
                badge_color = "#10b981" if lead_type == "client" else "#3b82f6"

                raw_comp, inr_comp = format_compensation_with_inr(lead.get("compensation"))
                if raw_comp:
                    inr_str_html = f" &nbsp;<span style='color:#059669;'>({inr_comp})</span>" if inr_comp and inr_comp != raw_comp else ""
                    comp_badge = f"<span style='background:#f59e0b22; color:#d97706; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;'>💰 {raw_comp}{inr_str_html}</span>"
                else:
                    comp_badge = "<span style='background:#6b728018; color:#9ca3af; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;'>💰 Pay: Not Disclosed</span>"

                score = lead.get("quality_score", 85)
                score_color = "#10b981" if score >= 85 else "#3b82f6" if score >= 75 else "#f59e0b"
                score_badge = f"<span style='background:{score_color}22; color:{score_color}; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;'>🎯 Match: {score}/100</span>"

                with st.container(border=True):
                    col_info, col_act = st.columns([3, 1])
                    with col_info:
                        st.markdown(f"<div style='display:flex; align-items:center; gap:8px; margin-bottom:6px;'><span style='background:{badge_color}22; color:{badge_color}; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;'>{type_badge}</span>{comp_badge}{score_badge}</div>", unsafe_allow_html=True)
                        st.markdown(f"### {lead.get('role', 'Software Engineer')} @ **{lead.get('company', 'Company')}**")
                        source = lead.get("intent_source", "unknown")
                        reason = lead.get("verification_reason", "")
                        st.markdown(f"🎯 **Source:** `{source}` | 🔍 `{reason}`")

                        src_url = lead.get("source_url", "")
                        if src_url:
                            st.markdown(f"🔗 [**Open Opportunity / Direct ATS Application**]({src_url})")

                        # Optional Deep Retriever VPS Vector Match Check
                        with st.expander("⚡ Deep Retriever Cognitive Search (Live VPS)", expanded=False):
                            if st.button("🔍 Run Semantic Match on rag.prateeq.in", key=f"ret_q_{lead_id}"):
                                with st.spinner("Querying Retriever API..."):
                                    res = query_retriever_for_job_match(lead.get('role', ''), lead.get('company', ''), lead.get('verification_reason', '') + " " + lead.get('snippet', ''))
                                    if res and isinstance(res, list) and len(res) > 0 and "error" not in res[0]:
                                        st.success(f"Retriever verified {len(res)} matching architecture knowledge chunks:")
                                        for r in res[:2]:
                                            st.markdown(f"- **{r.get('document_title', 'Spec')}** (Score: `{round(r.get('score', 0)*100, 1)}%`): {r.get('chunk_text', '')[:250]}...")
                                    else:
                                        st.info(f"Retriever query note: {res}")

                    with col_act:
                        if st.button("✍️ Draft 3-in-1 Pitch", key=f"draft_{lead_id}", type="primary", use_container_width=True):
                            with st.spinner("Generating 3-in-1 multi-channel pitch (Email, LinkedIn, Cover Letter)..."):
                                pitch = generate_tailored_pitch(
                                    lead.get("company", ""),
                                    lead.get("role", ""),
                                    lead.get("verification_reason", "") + " " + lead.get("snippet", "") + " " + lead.get("company", ""),
                                    config,
                                    GEMINI_API_KEY,
                                    lead_type=lead_type
                                )
                                lead["ai_generated_pitch"] = pitch
                                lead["status"] = "pending"
                                lead["updated_at"] = datetime.utcnow().isoformat()
                                upsert_record("outreach_leads", lead, key_col="id")
                                st.success("3-in-1 Pitch drafted! Moved to 'Pitches Ready' tab.")
                                st.rerun()

                        if st.button("❌ Decline", key=f"dec_{lead_id}", use_container_width=True):
                            lead["status"] = "declined"
                            lead["updated_at"] = datetime.utcnow().isoformat()
                            upsert_record("outreach_leads", lead, key_col="id")
                            st.info(f"Declined {lead.get('company')}. It will not appear in future scans.")
                            st.rerun()

    with tab2:
        st.caption("Review and fine-tune AI-drafted multi-channel pitches (Email, LinkedIn Connection Note, ATS Cover Letter) before approving.")
        if not pending_pitches:
            st.info("No drafted pitches waiting for review. Go to 'Shortlisted Opportunities' tab and click '✍️ Draft 3-in-1 Pitch' on jobs you want to target.")
        else:
            for lead in pending_pitches:
                lead_id = lead.get("id")
                comp_str = lead.get("compensation")
                comp_text = f" | 💰 **Pay:** `{comp_str}`" if comp_str else ""

                # Parse multi-channel pitch JSON
                raw_pitch = lead.get("ai_generated_pitch", "")
                pitch_data = {}
                try:
                    if raw_pitch and raw_pitch.strip().startswith("{"):
                        pitch_data = json.loads(raw_pitch)
                except Exception:
                    pitch_data = {}

                email_val = pitch_data.get("email") or raw_pitch
                linkedin_val = pitch_data.get("linkedin") or f"Hi {lead.get('company')} Team, saw your {lead.get('role')} search! I build custom multi-tenant RAG platforms with ColBERT MaxSim, pgvector, and Next.js 16 (prateeq.in). Would love to connect and contribute!"
                cover_val = pitch_data.get("cover_letter") or f"Dear {lead.get('company')} Hiring Team,\n\nI am writing to apply for the {lead.get('role')} position. As a Forward Deployed Engineer & AI Solutions Architect, I build and take production AI workflows to scale—including pgvector hybrid retrieval, ColBERT token MaxSim rerankers, and zero-downtime blue/green deployment pipelines.\n\nMy live production builds and architecture knowledge graphs are accessible at https://prateeq.in. I look forward to contributing my systems execution velocity to {lead.get('company')}."

                with st.container(border=True):
                    st.markdown(f"### {lead.get('company')} — {lead.get('role')}")
                    st.caption(f"Match Score: `{lead.get('quality_score')}/100` | Target Email: `{lead.get('email')}` | Source: `{lead.get('intent_source')}`{comp_text}")

                    src_url = lead.get("source_url", "")
                    if src_url:
                        st.markdown(f"🔗 [**Direct Link / ATS Application Portal**]({src_url})")

                    # 3-in-1 Multi-Channel Tabs
                    p_tab_email, p_tab_li, p_tab_cover = st.tabs([
                        "📧 Founder / EM Email Pitch",
                        "💼 LinkedIn Note (<300 Chars)",
                        "📑 ATS Cover Letter Snippet"
                    ])

                    with p_tab_email:
                        edited_email = st.text_area(
                            "Direct Email Pitch (3 sentences + deep-link CTA)",
                            value=email_val,
                            key=f"pitch_email_{lead_id}",
                            height=130
                        )

                    with p_tab_li:
                        edited_li = st.text_area(
                            "LinkedIn Connection Note (Under 300 characters)",
                            value=linkedin_val,
                            key=f"pitch_li_{lead_id}",
                            height=90
                        )
                        li_len = len(edited_li)
                        li_color = "#10b981" if li_len <= 300 else "#ef4444"
                        st.markdown(f"<span style='color:{li_color}; font-size:0.8rem; font-weight:600;'>Character Count: {li_len} / 300 chars {'(✅ Perfect for LinkedIn connection request)' if li_len <= 300 else '(⚠️ Exceeds LinkedIn 300 character limit!)'}</span>", unsafe_allow_html=True)

                    with p_tab_cover:
                        edited_cover = st.text_area(
                            "ATS Application Cover Letter (Tailored to Greenhouse / Lever text boxes)",
                            value=cover_val,
                            key=f"pitch_cover_{lead_id}",
                            height=160
                        )

                    c1, c2 = st.columns(2)
                    with c1:
                        if st.button("❌ Dismiss / Decline", key=f"dis_p_{lead_id}", use_container_width=True):
                            lead["status"] = "declined"
                            lead["updated_at"] = datetime.utcnow().isoformat()
                            upsert_record("outreach_leads", lead, key_col="id")
                            st.info(f"Declined {lead.get('company')}")
                            st.rerun()
                    with c2:
                        if st.button("🚀 1-Click Approve & Save Formats", key=f"send_p_{lead_id}", type="primary", use_container_width=True):
                            updated_pitch_payload = {
                                "email": edited_email,
                                "linkedin": edited_li,
                                "cover_letter": edited_cover
                            }
                            lead["ai_generated_pitch"] = json.dumps(updated_pitch_payload)
                            lead["status"] = "sent"
                            lead["updated_at"] = datetime.utcnow().isoformat()
                            upsert_record("outreach_leads", lead, key_col="id")
                            st.success(f"Approved and archived outreach assets for {lead.get('company')}!")
                            st.rerun()

    with tab3:
        st.caption("History of approved / dispatched job outreach communications.")
        if not sent_leads:
            st.info("No sent pitches recorded yet.")
        else:
            for lead in sent_leads:
                with st.container(border=True):
                    st.markdown(f"**{lead.get('company')}** — {lead.get('role')}")
                    st.caption(f"Archived at: `{lead.get('updated_at', lead.get('created_at'))}` | Target Email: `{lead.get('email')}`")
                    raw_p = lead.get("ai_generated_pitch", "")
                    try:
                        p_dict = json.loads(raw_p) if raw_p and raw_p.startswith("{") else {"email": raw_p}
                        st.markdown("**📧 Email Pitch:**")
                        st.text(p_dict.get("email", ""))
                        if p_dict.get("linkedin"):
                            st.markdown("**💼 LinkedIn Note:**")
                            st.text(p_dict.get("linkedin", ""))
                        if p_dict.get("cover_letter"):
                            st.markdown("**📑 Cover Letter:**")
                            st.text(p_dict.get("cover_letter", ""))
                    except Exception:
                        st.text(raw_p)

    with tab4:
        st.caption("Archive of declined jobs. These URLs are permanently remembered and will never be fetched again in future scans.")
        if not declined_leads:
            st.info("No declined jobs in archive.")
        else:
            for lead in declined_leads[:30]:
                st.caption(f"❌ **{lead.get('company')}** ({lead.get('role')}) — {lead.get('source_url', 'No URL')}")


