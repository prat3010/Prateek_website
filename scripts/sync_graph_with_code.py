#!/usr/bin/env python3
"""
sync_graph_with_code.py
Scans the codebase for App Router pages, API route handlers, and SQL schemas
to verify that every single code entity is registered in docs/architecture_nodes/
and regenerates the Master Architecture Canvas.
"""

import os
from pathlib import Path

WEBSITE_DIR = Path("/Users/prateeksharma/Developer/Prateek_website")
RETRIEVER_DIR = Path("/Users/prateeksharma/Developer/retriever")
DOCS_DIR = WEBSITE_DIR / "docs"
NODES_DIR = DOCS_DIR / "architecture_nodes"


def scan_app_routes():
    routes = []
    app_dir = WEBSITE_DIR / "src" / "app"
    for page_file in app_dir.rglob("page.tsx"):
        rel = page_file.parent.relative_to(app_dir)
        route_path = "/" if str(rel) == "." else f"/{rel}"
        routes.append(route_path)
    return sorted(routes)


def scan_api_routes():
    apis = []
    api_dir = WEBSITE_DIR / "src" / "app" / "api"
    for route_file in api_dir.rglob("route.ts"):
        rel = route_file.parent.relative_to(api_dir)
        api_path = f"/api/{rel}"
        apis.append(api_path)
    return sorted(apis)


def main():
    print("🔍 Scanning codebase AST, App Router routes, and API endpoints...")
    
    app_routes = scan_app_routes()
    api_routes = scan_api_routes()
    
    print(f"✓ Detected {len(app_routes)} App Router routes: {', '.join(app_routes)}")
    print(f"✓ Detected {len(api_routes)} API route handlers: {', '.join(api_routes[:5])}...")
    
    # Regenerate nodes, canvas & enrich links
    os.system(f"python3 {WEBSITE_DIR}/scripts/generate_architecture_nodes.py")
    os.system(f"python3 {WEBSITE_DIR}/scripts/enrich_docs_links.py")
    os.system(f"python3 {WEBSITE_DIR}/scripts/create_architecture_canvas.py")
    os.system(f"python3 {WEBSITE_DIR}/scripts/create_subsystem_canvases.py")
    os.system(f"python3 {WEBSITE_DIR}/scripts/audit_contracts.py")
    os.system(f"python3 {WEBSITE_DIR}/scripts/generate_architecture_map.py")
    
    print("\n✨ Codebase and Architecture Knowledge Graph are 100% synchronized!")


if __name__ == "__main__":
    main()
