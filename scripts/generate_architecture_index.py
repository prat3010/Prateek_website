import glob, os, re
from pathlib import Path

NODES_DIR = Path('docs/architecture_nodes')
node_files = sorted(NODES_DIR.glob('*.md'))

tiers = {
    '1_frontend': [],
    '2_discovery_commerce': [],
    '3_workspace_control': [],
    '4_api_gateway': [],
    '5_domain_providers': [],
    '6_retriever_cognitive': [],
    '7_async_security': [],
    '8_dual_persistence': []
}

for nf in node_files:
    content = nf.read_text(encoding='utf-8')
    nid_m = re.search(r'^id:\s*(.+)$', content, re.MULTILINE)
    nid = nid_m.group(1).strip() if nid_m else nf.stem
    blast_m = re.search(r'^blast_radius:\s*(.+)$', content, re.MULTILINE)
    blast = blast_m.group(1).strip().upper() if blast_m else 'MEDIUM'
    auth_m = re.search(r'^auth_level:\s*(.+)$', content, re.MULTILINE)
    auth = auth_m.group(1).strip().upper() if auth_m else 'PUBLIC'
    tier_m = re.search(r'^tier:\s*(.+)$', content, re.MULTILINE)
    tier = tier_m.group(1).strip() if tier_m else '1_frontend'
    
    title = nid
    for line in content.split("\n"):
        if line.startswith("# "):
            title = line.lstrip("# ").strip()
            break
            
    mapped_tier = tier if tier in tiers else "4_api_gateway"
    if "schema_" in nid.lower():
        mapped_tier = "8_dual_persistence"
    elif "retriever_" in nid.lower() or ("engine_" in nid.lower() and not "celery" in nid.lower() and not "dogfooding" in nid.lower() and not "envelope" in nid.lower()):
        mapped_tier = "6_retriever_cognitive"
        
    tiers[mapped_tier].append({
        "id": nid,
        "title": title,
        "blast": blast,
        "auth": auth,
        "file": nf.name
    })

tier_titles = {
    "1_frontend": "1. FRONTEND: Portfolio & Adaptive Identity",
    "2_discovery_commerce": "2. DISCOVERY & COMMERCE: Multimodal CPQ & SOW Freeze",
    "3_workspace_control": "3. WORKSPACE & CONTROL: Client Dashboard, Admin & Studio",
    "4_api_gateway": "4. API GATEWAY: Next.js 16 Edge & REST Layer",
    "5_domain_providers": "5. CORE DOMAIN & GUARDS: CPQ Pricing, Auth & PDF Suite",
    "6_retriever_cognitive": "6. RETRIEVER COGNITIVE CORE: Guardrails, Search & FastAPIs",
    "7_async_security": "7. ASYNC INFRASTRUCTURE: Workers, Brokers & Security Envelopes",
    "8_dual_persistence": "8. DUAL PERSISTENCE: Supabase Relational + pgvector HNSW Store"
}

lines = []
lines.append("# 🏛️ Master Architecture Knowledge Graph Index")
lines.append("**Total Registered Architecture Nodes:** 97 | **Visual Canvases:** 4 | **Standard SOP Runbooks:** 4\n")
lines.append("## ⚡ Quick Navigation")
lines.append("- [Master Architecture Visual Canvas](MASTER_ARCHITECTURE_MAP.canvas)")
lines.append("- [Commerce & Escrow Flow Canvas](COMMERCE_AND_ESCROW_FLOW.canvas)")
lines.append("- [RAG & Cognitive Pipeline Canvas](RAG_AND_COGNITIVE_PIPELINE.canvas)")
lines.append("- [Autonomous Outreach Engine Canvas](AUTONOMOUS_OUTREACH_ENGINE.canvas)")
lines.append("- **Standard Runbooks:**")
lines.append("  - [Runbook: New API Endpoint](runbooks/RUNBOOK_NEW_API_ENDPOINT.md)")
lines.append("  - [Runbook: New CPQ Feature or Engine](runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)")
lines.append("  - [Runbook: Database Schema Migration](runbooks/RUNBOOK_DATABASE_MIGRATION.md)")
lines.append("  - [Runbook: RAG Tenant Onboarding](runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)\n---")

for tkey, ttitle in tier_titles.items():
    nodes_in_tier = tiers[tkey]
    lines.append(f"\n### 🔹 {ttitle} ({len(nodes_in_tier)} Nodes)\n")
    lines.append("| Node ID | Title / Component | Blast Radius | Security Auth | Specification File |")
    lines.append("| :--- | :--- | :---: | :---: | :--- |")
    for n in nodes_in_tier:
        nid = n["id"]
        title = n["title"]
        blast = n["blast"]
        auth = n["auth"]
        fname = n["file"]
        badge = f"🔴 `{blast}`" if blast == "CRITICAL" else (f"🟠 `{blast}`" if blast == "HIGH" else f"🟢 `{blast}`")
        lines.append(f"| `{nid}` | **{title}** | {badge} | `{auth}` | [architecture_nodes/{fname}](architecture_nodes/{fname}) |")

with open("docs/00_ARCHITECTURE_INDEX.md", "w") as f:
    f.write("\n".join(lines) + "\n")

print("✓ Successfully generated docs/00_ARCHITECTURE_INDEX.md!")
