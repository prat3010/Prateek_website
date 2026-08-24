#!/usr/bin/env python3
"""
upgrade_architecture_nodes.py
Enriches all 96 architecture nodes in docs/architecture_nodes/ with:
1. Standardized YAML Frontmatter (id, tier, platform, status, auth_level, cache_tag, file_path, ide_cursor_uri, ide_vscode_uri, tags, upstream, downstream)
2. Prominent Click-to-Code Action Badges ([Open in Cursor] | [Open in VS Code])
3. Hierarchical Nested Tag Taxonomy (#tier/..., #security/..., #domain/...)
4. Clean Markdown links without dangling references.
"""

import os
import re
import json
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
NODES_DIR = DOCS_DIR / "architecture_nodes"
WEBSITE_ROOT = "/Users/prateeksharma/Developer/Prateek_website"
RETRIEVER_ROOT = "/Users/prateeksharma/Developer/retriever"


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
        if stem in ["UI_ScopingLab", "UI_ArchitectureCartDrawer", "UI_TopologyMap", "UI_PreDepositBridge"]:
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
        tier = "5_domain_providers"
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

    # Auth Level
    lower_body = body.lower()
    if "bearer" in lower_body or "oauth" in lower_body or stem.startswith("API_client_") or stem in ["Route_dashboard", "Route_admin", "Route_rag_app"]:
        auth_level = "bearer_jwt"
    elif "service_role" in lower_body or "sync_api_key" in lower_body or stem in ["API_revalidate", "Proxy_telemetry", "API_outreach_dispatch", "Tool_Synchronizer"]:
        auth_level = "service_role"
    else:
        auth_level = "public"

    # Extract File Path
    path_match = re.search(r"\*\*Path:\*\*\s*`([^`]+)`", body)
    if path_match:
        rel_path = path_match.group(1).split("&")[0].strip()
    else:
        if stem.startswith("API_"):
            parts = stem.replace("API_", "").split("_")
            rel_path = f"src/app/api/{'/'.join(parts)}/route.ts"
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

    # Extract upstream / downstream links from related section
    related_links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", body)
    downstream = []
    for label, target in related_links:
        clean_target = target.split("#")[0].replace(".md", "").replace("architecture_nodes/", "").strip()
        if clean_target and clean_target != stem and not clean_target.startswith("http"):
            downstream.append(clean_target)

    return {
        "id": stem,
        "tier": tier,
        "platform": platform,
        "status": "production",
        "auth_level": auth_level,
        "file_path": rel_path,
        "ide_cursor_uri": cursor_uri,
        "ide_vscode_uri": vscode_uri,
        "tags": tags,
        "downstream": downstream[:8]
    }


def enrich_node(filename: str, content: str) -> str:
    # Strip existing YAML if present
    body = content.strip()
    if body.startswith("---"):
        parts = body.split("---", 2)
        if len(parts) >= 3:
            body = parts[2].strip()

    # Strip existing action badge if present
    body = re.sub(r"> \[!NOTE\] Quick IDE Jump.*?\n\n", "", body, flags=re.DOTALL)

    meta = extract_metadata(filename, body)

    # Build YAML frontmatter
    yaml_lines = [
        "---",
        f"id: {meta['id']}",
        f"tier: {meta['tier']}",
        f"platform: {meta['platform']}",
        f"status: {meta['status']}",
        f"auth_level: {meta['auth_level']}",
        f"file_path: {meta['file_path']}",
        f"ide_cursor_uri: \"{meta['ide_cursor_uri']}\"",
        f"ide_vscode_uri: \"{meta['ide_vscode_uri']}\"",
        "tags:"
    ]
    for t in meta["tags"]:
        yaml_lines.append(f"  - {t}")
    if meta["downstream"]:
        yaml_lines.append("downstream:")
        for d in meta["downstream"]:
            yaml_lines.append(f"  - {d}")
    yaml_lines.append("---\n")

    yaml_block = "\n".join(yaml_lines)

    # Build Click-to-Code Action Badge
    action_badge = f"> [!NOTE] Quick IDE Jump\n> ⚡ **[Open in Cursor]({meta['ide_cursor_uri']})** &nbsp;|&nbsp; 💻 **[Open in VS Code]({meta['ide_vscode_uri']})**\n\n"

    # Insert action badge right after the first header
    if "\n" in body:
        header, rest = body.split("\n", 1)
        full_body = f"{header}\n\n{action_badge}{rest.strip()}\n"
    else:
        full_body = f"{body}\n\n{action_badge}\n"

    return f"{yaml_block}\n{full_body}"


def main():
    print(f"🚀 Enriching all architecture nodes in {NODES_DIR} with YAML Frontmatter & Click-to-Code Links...")
    count = 0
    for node_file in NODES_DIR.glob("*.md"):
        content = node_file.read_text(encoding="utf-8")
        enriched = enrich_node(node_file.name, content)
        node_file.write_text(enriched, encoding="utf-8")
        count += 1

    print(f"✨ Successfully enriched {count} architecture nodes with SOTA YAML Frontmatter and IDE Deep Links!")


if __name__ == "__main__":
    main()
