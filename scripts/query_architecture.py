#!/usr/bin/env python3
"""
query_architecture.py
CLI tool for AI Agents & Developers to query the Architecture Knowledge Graph.
Provides blast radius, upstream dependencies, downstream callers, and PRD links.

Usage:
  python3 scripts/query_architecture.py --target client_scopes
  python3 scripts/query_architecture.py --target /api/scoping/parse-intent
  python3 scripts/query_architecture.py --list
  python3 scripts/query_architecture.py --json
"""

import argparse
import json
import re
import sys
from pathlib import Path

DOCS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/docs")
NODES_DIR = DOCS_DIR / "architecture_nodes"
CANVAS_FILE = DOCS_DIR / "MASTER_ARCHITECTURE_MAP.canvas"


def load_all_nodes():
    nodes = {}
    if not NODES_DIR.exists():
        return nodes
    for md_file in sorted(NODES_DIR.glob("*.md")):
        name = md_file.stem
        content = md_file.read_text(encoding="utf-8")
        
        # Parse tags
        tags = re.findall(r"#([a-zA-Z0-9_\-/]+)", content)
        
        # Parse cross-references
        links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", content)
        
        # Extract title & summary
        lines = content.strip().split("\n")
        title = lines[0].lstrip("# ").strip() if lines else name
        summary = ""
        for line in lines[1:]:
            if line.startswith("> **") and line.endswith("**"):
                summary = line.strip("> *").strip()
                break

        nodes[name.lower()] = {
            "name": name,
            "title": title,
            "path": str(md_file),
            "summary": summary,
            "tags": tags,
            "links": [{"label": link_item[0], "target": link_item[1]} for link_item in links],
            "raw_content": content
        }
    return nodes


def find_target(target_query: str, nodes: dict):
    query = target_query.lower().replace("/", "_").replace("-", "_").strip()
    
    # Exact match
    for k, v in nodes.items():
        if query in k or k in query:
            return v
            
    # Fuzzy search across content
    matches = []
    for k, v in nodes.items():
        if query in v["title"].lower() or query in v["raw_content"].lower():
            matches.append(v)
            
    return matches[0] if matches else None


def get_blast_radius(target_node: dict, all_nodes: dict):
    """Calculates upstream callers and downstream dependents."""
    target_name = target_node["name"].lower()
    
    downstream = [link_item["label"] for link_item in target_node["links"]]
    upstream = []
    
    for k, node in all_nodes.items():
        if k == target_name:
            continue
        for link_item in node["links"]:
            if target_node["name"] in link_item["target"] or target_node["name"].lower() in link_item["target"].lower():
                upstream.append(f"{node['title']} ({node['name']})")
                
    return {
        "upstream_callers": upstream,
        "downstream_dependencies": downstream
    }


def main():
    parser = argparse.ArgumentParser(description="Query Architecture Knowledge Graph for AI Agents")
    parser.add_argument("--target", "-t", type=str, help="Name of entity, table, API, or component")
    parser.add_argument("--list", "-l", action="store_true", help="List all available architecture nodes")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON format for agent parsing")
    
    args = parser.parse_args()
    nodes = load_all_nodes()
    
    if args.list:
        print("\n🏛️ Available Architecture Nodes in Knowledge Graph:\n")
        for k, v in sorted(nodes.items()):
            print(f"  • {v['title']} [{', '.join('#' + t for t in v['tags'][:3])}]")
        print(f"\nTotal Nodes: {len(nodes)}\n")
        return

    if not args.target:
        print("Error: Specify --target <name> or --list. Example: python3 scripts/query_architecture.py --target client_scopes")
        sys.exit(1)

    node = find_target(args.target, nodes)
    if not node:
        print(f"❌ No architecture node found matching '{args.target}'. Run with --list to view all nodes.")
        sys.exit(1)

    blast = get_blast_radius(node, nodes)
    
    if args.json:
        result = {
            "target": node["title"],
            "summary": node["summary"],
            "tags": node["tags"],
            "file": node["path"],
            "blast_radius": blast
        }
        print(json.dumps(result, indent=2))
        return

    print("=" * 80)
    print(f"🎯 ARCHITECTURE CONTEXT: {node['title']}")
    print("=" * 80)
    if node["summary"]:
        print(f"📖 Summary: {node['summary']}\n")
    print(f"🏷️  Tags: {', '.join('#' + t for t in node['tags'])}\n")
    print(f"📁 Specification File: {node['path']}\n")

    print("⚠️  BLAST RADIUS & DEPENDENCIES:")
    print("--------------------------------------------------------------------------------")
    print("⬆️  Upstream Callers (Who calls/relies on this):")
    if blast["upstream_callers"]:
        for up in blast["upstream_callers"]:
            print(f"   • {up}")
    else:
        print("   • None directly mapped (Entrypoint or standalone)")

    print("\n⬇️  Downstream Dependencies (What this depends on):")
    if blast["downstream_dependencies"]:
        for down in blast["downstream_dependencies"]:
            print(f"   • {down}")
    else:
        print("   • None")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
