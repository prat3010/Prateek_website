#!/usr/bin/env python3
"""
upgrade_architecture_nodes.py (Master Ultra SOTA Edition - Invariants & Blast Radius)
Enriches all 97 architecture nodes in docs/architecture_nodes/ with:
1. Standardized YAML Frontmatter (id, tier, platform, status, auth_level, blast_radius, invariants, test_suites, runbook, file_path, ide_cursor_uri, ide_vscode_uri, tags, downstream)
2. Prominent Click-to-Code Action Badges ([Open in Cursor] | [Open in VS Code])
3. Non-Negotiable Domain Invariants & Blast Radius Safety Constraints
4. Standard SOP Runbook Cross-References
"""

import os
import re
import json
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
NODES_DIR = DOCS_DIR / "architecture_nodes"
WEBSITE_ROOT = "/Users/prateeksharma/Developer/Prateek_website"
RETRIEVER_ROOT = "/Users/prateeksharma/Developer/retriever"

# Exact path overrides
PATH_OVERRIDES = {
    "API_client_create_razorpay_order": "src/app/api/client/create-razorpay-order/route.ts",
    "API_client_verify_razorpay_payment": "src/app/api/client/verify-razorpay-payment/route.ts",
    "API_client_create_razorpay_invoice": "src/app/api/client/create-razorpay-invoice/route.ts",
    "API_client_create_razorpay_subscription": "src/app/api/client/create-razorpay-subscription/route.ts",
    "API_client_get_invoices": "src/app/api/client/get-invoices/route.ts",
    "API_client_get_scopes": "src/app/api/client/get-scopes/route.ts",
    "API_client_delete_scope": "src/app/api/client/delete-scope/route.ts",
    "API_client_save_scope": "src/app/api/client/save-scope/route.ts",
    "API_client_intake_draft": "src/app/api/client/intake-draft/route.ts",
    "API_client_copilot": "src/app/api/client/copilot/route.ts",
    "API_outreach_prospect": "src/app/api/outreach/prospect/route.ts",
    "API_outreach_dispatch": "src/app/api/outreach/dispatch/route.ts",
    "API_outreach_get_leads": "src/app/api/outreach/get-leads/route.ts",
    "API_rag_tenant": "src/app/api/rag/tenant/route.ts",
    "API_rag_invite": "src/app/api/rag/invite/route.ts",
    "API_rag_members": "src/app/api/rag/members/route.ts",
    "API_rag_telemetry": "src/app/api/rag/telemetry/route.ts",
    "API_scoping_parse_intent": "src/app/api/scoping/parse-intent/route.ts",
    "API_scoping_parse_rfp": "src/app/api/scoping/parse-rfp/route.ts",
    "API_analytics_summary": "src/app/api/analytics-summary/route.ts",
    "API_blog_publish": "src/app/api/blog/publish/route.ts",
    "API_certificates": "src/app/api/certificates/route.ts",
    "API_contact": "src/app/api/contact/route.ts",
    "API_git_log": "src/app/api/git-log/route.ts",
    "API_profile": "src/app/api/profile/route.ts",
    "API_projects": "src/app/api/projects/route.ts",
    "API_revalidate": "src/app/api/revalidate/route.ts",
    "API_skills": "src/app/api/skills/route.ts",
    "API_terminal_qrcode": "src/app/api/terminal/qrcode/route.ts",
    "API_terminal_query": "src/app/api/terminal/query/route.ts",
    "API_terminal_snake_leaderboard": "src/app/api/terminal/snake-leaderboard/route.ts",
    "API_webhooks_razorpay": "src/app/api/webhooks/razorpay/route.ts",
    "Route_rag_app": "src/app/rag/app/page.tsx",
    "UI_Terminal": "src/components/ui/SiteInfoConsole.tsx"
}

def get_node_invariants_and_blast(nid: str):
    blast_radius = "medium"
    invariants = []
    test_suites = []
    runbook = "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"
    
    if any(k in nid.lower() for k in ["razorpay", "invoices", "payment"]):
        blast_radius = "critical"
        invariants = [
            "Client email MUST be extracted from verified JWT session, NEVER accepted from request parameters.",
            "Order amounts MUST match exact pricing rules (50% milestone deposit) computed server-side.",
            "Payment signatures MUST be validated using crypto.timingSafeEqual HMAC-SHA256.",
            "Webhook events MUST be deduplicated via processed_webhooks unique event_id ledger."
        ]
        test_suites = ["src/app/api/__tests__/razorpay.test.ts", "src/app/api/__tests__/invoicing.test.ts"]
        runbook = "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"
        
    elif any(k in nid.lower() for k in ["auth", "session", "proxy_telemetry"]):
        blast_radius = "critical"
        invariants = [
            "All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII).",
            "Service role key MUST stay strictly server-only and never leak to client bundle.",
            "Session tokens MUST be cryptographically verified via Supabase Auth getUser()."
        ]
        test_suites = ["src/lib/__tests__/security.test.ts"]
        runbook = "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"
        
    elif any(k in nid.lower() for k in ["pricing", "scoping", "cart", "predeposit", "sow"]):
        blast_radius = "high"
        invariants = [
            "All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().",
            "Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.",
            "Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy)."
        ]
        test_suites = ["src/lib/__tests__/pricing.test.ts", "src/lib/__tests__/pdf-smoke.test.ts"]
        runbook = "docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md"
        
    elif nid.startswith("Schema_"):
        blast_radius = "high"
        invariants = [
            "All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.",
            "Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.",
            "Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables."
        ]
        test_suites = ["scripts/audit_contracts.py", "scripts/audit_db.py"]
        runbook = "docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md"
        
    elif nid.startswith("Retriever_") or nid.startswith("Engine_"):
        blast_radius = "high"
        invariants = [
            "Every query and database record MUST strictly enforce tenant_id isolation.",
            "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.",
            "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
        ]
        test_suites = ["apps/api/tests/test_architecture.py"]
        runbook = "docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md"
        
    elif "outreach" in nid.lower():
        blast_radius = "high"
        invariants = [
            "Outreach dispatch MUST strictly verify that caller email is an authorized operator (isAdminEmail).",
            "AI pitch generation MUST be grounded in verified prospect company signals."
        ]
        test_suites = ["src/app/api/__tests__/admin-outreach.test.ts"]
        runbook = "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"
        
    else:
        blast_radius = "medium"
        invariants = [
            "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.",
            "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
        ]
        test_suites = ["src/lib/__tests__/data.test.ts"]
        runbook = "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"
        
    return blast_radius, invariants, test_suites, runbook


def extract_metadata(filename: str, body: str) -> dict:
    stem = Path(filename).stem

    # Platform detection
    if stem.startswith("Retriever_") or (stem.startswith("Engine_") and "retriever" in body.lower() and "scoping" not in stem.lower()):
        platform = "Retriever"
    else:
        platform = "Prateek_Website"

    # Tier mapping
    if stem.startswith("Route_"):
        if stem in ["Route_scoping"]:
            tier = "2_discovery_commerce"
            domain = "scoping"
        elif stem in ["Route_dashboard", "Route_admin", "Route_rag_app"]:
            tier = "3_workspace_control"
            domain = "workspace"
        elif stem in ["Route_auth_callback"]:
            tier = "4_api_gateway"
            domain = "auth"
        else:
            tier = "1_frontend"
            domain = "portfolio"
    elif stem.startswith("Proxy_"):
        tier = "4_api_gateway"
        domain = "telemetry"
    elif stem.startswith("API_"):
        if any(k in stem for k in ["scoping", "create_razorpay", "verify_razorpay", "intake", "save_scope", "get_scopes", "delete_scope", "invoices"]):
            tier = "4_api_gateway"
            domain = "commerce"
        elif "outreach" in stem:
            tier = "4_api_gateway"
            domain = "outreach"
        elif "rag" in stem:
            tier = "4_api_gateway"
            domain = "rag"
        else:
            tier = "4_api_gateway"
            domain = "content_api"
    elif stem.startswith("Lib_") or stem.startswith("Context_"):
        tier = "5_domain_providers"
        domain = "domain_lib"
    elif stem.startswith("UI_"):
        if stem in ["UI_ScopingLab", "UI_ArchitectureCartDrawer", "UI_TopologyMap", "UI_PreDepositBridge", "UI_MiddlemanAgreement"]:
            tier = "2_discovery_commerce"
            domain = "scoping"
        elif stem in ["UI_ClientWorkspaceDashboard", "UI_AdminPortal", "UI_RAGLabPlayground"]:
            tier = "3_workspace_control"
            domain = "workspace"
        elif stem in ["UI_CommercialPDFSuite"]:
            tier = "5_domain_providers"
            domain = "pdf"
        else:
            tier = "1_frontend"
            domain = "ui"
    elif stem.startswith("Tool_"):
        tier = "3_workspace_control"
        domain = "tooling"
    elif stem.startswith("Schema_"):
        tier = "8_persistence"
        domain = "database"
    elif stem.startswith("Retriever_API_"):
        tier = "6_retriever_cognitive"
        domain = "fastapi"
    elif stem.startswith("Engine_"):
        if stem in ["Engine_Celery_RabbitMQ", "Engine_Envelope_Encryption", "Engine_Dogfooding_Tenant_prateeq_scoping"]:
            tier = "7_async_security"
            domain = "async_infra"
        elif stem in ["Engine_Digital_SOW_Escrow_Freeze"]:
            tier = "2_discovery_commerce"
            domain = "commerce"
        else:
            tier = "6_retriever_cognitive"
            domain = "cognitive_engine"
    else:
        tier = "1_frontend"
        domain = "general"

    # Status
    status = "planned" if stem in ["API_scoping_parse_intent", "API_scoping_parse_rfp"] else "production"

    # Auth Level
    lower_body = body.lower()
    if "bearer" in lower_body or "oauth" in lower_body or stem.startswith("API_client_") or stem in ["Route_dashboard", "Route_admin", "Route_rag_app"]:
        auth_level = "bearer_jwt"
    elif "service_role" in lower_body or "sync_api_key" in lower_body or stem in ["API_revalidate", "Proxy_telemetry", "API_outreach_dispatch", "Tool_Synchronizer"]:
        auth_level = "service_role"
    else:
        auth_level = "public"

    # File Path
    if stem in PATH_OVERRIDES:
        rel_path = PATH_OVERRIDES[stem]
    else:
        path_match = re.search(r"\*\*Path:\*\*\s*`([^`]+)`", body)
        if path_match:
            rel_path = path_match.group(1).split("&")[0].strip()
        else:
            if stem.startswith("API_"):
                parts = stem.replace("API_", "").split("_")
                rel_path = f"src/app/api/{'-'.join(parts)}/route.ts"
            elif stem.startswith("Route_"):
                r_name = stem.replace("Route_", "")
                rel_path = f"src/app/{r_name}/page.tsx" if r_name != "home" else "src/app/page.tsx"
            elif stem.startswith("Retriever_API_"):
                r_name = stem.replace("Retriever_API_v1_", "")
                rel_path = f"apps/api/src/routers/{r_name}.py"
            elif stem.startswith("Schema_"):
                rel_path = "supabase_schema.sql"
            elif stem.startswith("Lib_"):
                l_name = stem.replace("Lib_", "")
                rel_path = f"src/lib/{l_name}.ts"
            else:
                rel_path = "src/"

    abs_path = (RETRIEVER_ROOT + "/" + rel_path) if platform == "Retriever" else (WEBSITE_ROOT + "/" + rel_path)
    cursor_uri = f"cursor://file{abs_path}"
    vscode_uri = f"vscode://file{abs_path}"

    tags = [f"tier/{tier}", f"security/{auth_level}", f"domain/{domain}"]
    if platform == "Retriever":
        tags.append("platform/retriever")
    else:
        tags.append("platform/website")

    blast_radius, invariants, test_suites, runbook = get_node_invariants_and_blast(stem)

    # Downstream links
    related_links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", body)
    downstream = []
    for label, target in related_links:
        clean_target = target.split("#")[0].replace(".md", "").replace("architecture_nodes/", "").strip()
        if clean_target and clean_target != stem and not clean_target.startswith("http") and not clean_target.startswith("cursor") and not clean_target.startswith("vscode"):
            downstream.append(clean_target)

    return {
        "id": stem,
        "tier": tier,
        "platform": platform,
        "status": status,
        "auth_level": auth_level,
        "blast_radius": blast_radius,
        "invariants": invariants,
        "test_suites": test_suites,
        "runbook": runbook,
        "file_path": rel_path,
        "ide_cursor_uri": cursor_uri,
        "ide_vscode_uri": vscode_uri,
        "tags": tags,
        "downstream": downstream[:8]
    }


def enrich_node(filename: str, content: str) -> str:
    body = content.strip()
    if body.startswith("---"):
        parts = body.split("---", 2)
        if len(parts) >= 3:
            body = parts[2].strip()

    # Strip existing action badge and invariants block if present
    body = re.sub(r"> \[!NOTE\] Quick IDE Jump.*?\n\n", "", body, flags=re.DOTALL)
    body = re.sub(r"## 🛡️ Non-Negotiable Invariants & Safety Constraints.*", "", body, flags=re.DOTALL).strip()

    meta = extract_metadata(filename, body)

    yaml_lines = [
        "---",
        f"id: {meta['id']}",
        f"tier: {meta['tier']}",
        f"platform: {meta['platform']}",
        f"status: {meta['status']}",
        f"auth_level: {meta['auth_level']}",
        f"blast_radius: {meta['blast_radius']}",
        f"file_path: {meta['file_path']}",
        f"ide_cursor_uri: \"{meta['ide_cursor_uri']}\"",
        f"ide_vscode_uri: \"{meta['ide_vscode_uri']}\"",
        f"runbook: {meta['runbook']}",
        "tags:"
    ]
    for t in meta["tags"]:
        yaml_lines.append(f"  - {t}")
    if meta["invariants"]:
        yaml_lines.append("invariants:")
        for inv in meta["invariants"]:
            yaml_lines.append(f"  - \"{inv}\"")
    if meta["test_suites"]:
        yaml_lines.append("test_suites:")
        for ts in meta["test_suites"]:
            yaml_lines.append(f"  - {ts}")
    if meta["downstream"]:
        yaml_lines.append("downstream:")
        for d in meta["downstream"]:
            yaml_lines.append(f"  - {d}")
    yaml_lines.append("---\n")

    yaml_block = "\n".join(yaml_lines)
    action_badge = f"> [!NOTE] Quick IDE Jump\n> ⚡ **[Open in Cursor]({meta['ide_cursor_uri']})** &nbsp;|&nbsp; 💻 **[Open in VS Code]({meta['ide_vscode_uri']})**\n\n"

    invariants_md = f"\n\n## 🛡️ Non-Negotiable Invariants & Safety Constraints\n> **Blast Radius:** `{meta['blast_radius'].upper()}` &nbsp;|&nbsp; 📖 **Runbook:** [{Path(meta['runbook']).stem}]({meta['runbook']})\n\n"
    for idx, inv in enumerate(meta["invariants"], 1):
        invariants_md += f"{idx}. **{inv}**\n"

    if "\n" in body:
        header, rest = body.split("\n", 1)
        full_body = f"{header}\n\n{action_badge}{rest.strip()}{invariants_md}\n"
    else:
        full_body = f"{body}\n\n{action_badge}{invariants_md}\n"

    return f"{yaml_block}\n{full_body}"


def main():
    print(f"🚀 Enriching all architecture nodes in {NODES_DIR} with YAML Frontmatter, Invariants & Runbooks...")
    count = 0
    for node_file in sorted(NODES_DIR.glob("*.md")):
        content = node_file.read_text(encoding="utf-8")
        enriched = enrich_node(node_file.name, content)
        node_file.write_text(enriched, encoding="utf-8")
        count += 1

    print(f"✨ Successfully enriched {count} architecture nodes with SOTA Invariants, Runbooks & Deep Links!")


if __name__ == "__main__":
    main()
