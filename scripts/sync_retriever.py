"""
Retriever Automated Knowledge Ingestion Adapter for Synchronizer.
=================================================================
Converts portfolio projects into structured architectural case studies
and ingests them directly into Retriever tenants via HTTP API.
Zero external pip dependencies (uses Python standard library urllib).
"""

import json
import logging
import os
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("sync_retriever")

# Read credentials from environment or default production values
def _get_env(key: str, default: str = "") -> str:
    # First check os.environ
    val = os.environ.get(key)
    if val:
        return val.strip()

    # Second check local .env.local if present
    env_local_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_local_path.is_file():
        try:
            for line in env_local_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k.strip() == key:
                        return v.strip().strip("'\"")
        except Exception:
            pass

    return default

RETRIEVER_API_URL = _get_env("RETRIEVER_API_URL", "https://rag.prateeq.in").rstrip("/")
SCOPING_TENANT_ID = _get_env("RETRIEVER_SCOPING_TENANT_ID", "1f85286c-9d9a-4ebc-9c62-a99360a5ece4")
SCOPING_API_KEY = _get_env("RETRIEVER_SCOPING_ADMIN_KEY", "")
PORTFOLIO_TENANT_ID = _get_env("RETRIEVER_PORTFOLIO_TENANT_ID", "6797e2c8-745a-4bd1-aa4c-3854b8d79c22")
PORTFOLIO_API_KEY = _get_env("RETRIEVER_PORTFOLIO_API_KEY", "")
RETRIEVER_USER_ID = _get_env("RETRIEVER_SCOPING_USER_ID", "36e62429-419e-48ef-af92-533afca9e028")


def format_project_case_study(project: Dict[str, Any]) -> str:
    """
    Formats a project dictionary into an authoritative system architecture case study markdown document.
    """
    title = project.get("title", "Untitled System")
    system_role = project.get("systemRole", "SYS // PRODUCTION SYSTEM")
    category = project.get("category", "systems")
    telemetry_badge = project.get("telemetryBadge", "LIVE SYSTEM")
    tags = ", ".join(project.get("tags", []))
    desc = project.get("description", "")
    long_desc = project.get("longDescription", "")
    live_url = project.get("liveUrl", "")
    github_url = project.get("githubUrl", "")

    highlights = project.get("architectureHighlights", [])
    if isinstance(highlights, list) and highlights:
        highlights_str = "\n".join([f"- {h}" for h in highlights])
    elif isinstance(highlights, str) and highlights.strip():
        highlights_str = highlights.strip()
    else:
        highlights_str = "- Production-grade Next.js 16 App Router, React 19, and Supabase architecture."

    challenges = project.get("challenges", [])
    challenges_str = ""
    if isinstance(challenges, list) and challenges:
        for c in challenges:
            if isinstance(c, dict):
                chal = c.get("challenge", "")
                sol = c.get("solution", "")
                challenges_str += f"- **Challenge:** {chal}\n  **Solution:** {sol}\n"
            elif isinstance(c, str):
                challenges_str += f"- {c}\n"
    if not challenges_str:
        challenges_str = "- Enforced strict multi-tenant Row-Level Security (RLS) and sub-second latency targets."

    deliverables = project.get("keyDeliverables", [])
    if isinstance(deliverables, list) and deliverables:
        deliverables_str = "\n".join([f"- {d}" for d in deliverables])
    elif isinstance(deliverables, str) and deliverables.strip():
        deliverables_str = deliverables.strip()
    else:
        deliverables_str = "- Full source code repository, documentation, and deployed cloud infrastructure."

    return f"""# System Architecture Case Study: {title} ({system_role})

Document Authority: Prateek Sharma — Forward Deployed Engineer & Solutions Architect
System Role: {system_role}
Domain Category: {category}
Live Status: {telemetry_badge}
Key Technologies & Stack: {tags}

## 1. Executive Summary & Overview
{desc}

{long_desc}

## 2. Technical Architecture & Engineering Highlights
{highlights_str}

## 3. Engineering Hurdles & Implemented Solutions
{challenges_str}

## 4. Key Production Deliverables
{deliverables_str}

## 5. Live System Contracts & Repositories
- Live Production URL: {live_url or 'Deployed Internal System'}
- Source Code Repository: {github_url or 'Private Enterprise Repository'}
"""


def ingest_document_to_tenant(
    tenant_id: str,
    api_key: str,
    filename: str,
    content: str,
    tags: List[str],
    api_url: Optional[str] = None,
) -> bool:
    """
    Ingests a raw markdown document into a Retriever tenant via POST /v1/tenants/{tenant_id}/documents/raw.
    """
    base_url = (api_url or RETRIEVER_API_URL).rstrip("/")
    url = f"{base_url}/v1/tenants/{tenant_id}/documents/raw"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-Tenant-ID": tenant_id,
        "X-User-ID": RETRIEVER_USER_ID,
        "Content-Type": "application/json",
    }
    payload = {
        "title": filename,
        "content": content,
        "mime_type": "text/markdown",
        "tags": tags,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError as http_err:
        err_msg = http_err.read().decode("utf-8", errors="ignore")
        logger.warning("Retriever ingestion HTTP %s for tenant %s: %s", http_err.code, tenant_id, err_msg)
        return False
    except Exception as err:
        logger.warning("Retriever ingestion exception for tenant %s: %s", tenant_id, err)
        return False


def sync_project_to_retriever(project: Dict[str, Any], is_delete: bool = False) -> Dict[str, Any]:
    """
    Orchestrates syncing project markdown to Retriever and local tenant bundles.
    """
    raw_id = project.get("id") or project.get("slug") or ""
    clean_id = re.sub(r"[^a-zA-Z0-9]", "_", raw_id.lower()).strip("_")
    if not clean_id:
        clean_id = re.sub(r"[^a-zA-Z0-9]", "_", project.get("title", "project").lower()).strip("_")

    filename = f"case_study_{clean_id}.md"
    content = format_project_case_study(project)
    tags = ["portfolio_project", project.get("category", "systems")] + project.get("tags", [])

    scoping_ok = False
    portfolio_ok = False

    if not is_delete:
        # Ingest into Scoping Concierge tenant
        scoping_ok = ingest_document_to_tenant(SCOPING_TENANT_ID, SCOPING_API_KEY, filename, content, tags)
        # Ingest into Portfolio AI Twin tenant
        portfolio_ok = ingest_document_to_tenant(PORTFOLIO_TENANT_ID, PORTFOLIO_API_KEY, filename, content, tags)

    # Mirror to local corpus directory if retriever repo is present
    local_target = os.path.expanduser(f"~/Developer/retriever/data/tenants/tenant_scoping_concierge/{filename}")
    try:
        if is_delete:
            if os.path.exists(local_target):
                os.remove(local_target)
        else:
            os.makedirs(os.path.dirname(local_target), exist_ok=True)
            with open(local_target, "w", encoding="utf-8") as f:
                f.write(content)
    except Exception as e:
        logger.warning("Local corpus mirror notice: %s", e)

    return {
        "success": scoping_ok or portfolio_ok,
        "scoping_ok": scoping_ok,
        "portfolio_ok": portfolio_ok,
        "filename": filename,
        "is_delete": is_delete,
    }


def bulk_sync_all_projects_to_retriever(projects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Bulk synchronizes all projects into Retriever tenants.
    """
    results = []
    scoping_count = 0
    portfolio_count = 0

    for p in projects:
        res = sync_project_to_retriever(p, is_delete=False)
        results.append(res)
        if res.get("scoping_ok"):
            scoping_count += 1
        if res.get("portfolio_ok"):
            portfolio_count += 1

    return {
        "total": len(projects),
        "scoping_synced": scoping_count,
        "portfolio_synced": portfolio_count,
        "results": results,
    }
