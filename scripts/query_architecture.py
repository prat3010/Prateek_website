#!/usr/bin/env python3
"""
query_architecture.py (High-Octane AI Pre-Flight Edition)
CLI tool for AI Agents & Developers to query the Architecture Knowledge Graph.
Provides Invariants, Blast Radius, Upstream/Downstream Callers, Test Suites, and SOP Runbooks.

Usage:
  python3 scripts/query_architecture.py --target API_client_create_razorpay_order
  python3 scripts/query_architecture.py --target client_scopes
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
        
        # Extract YAML properties
        blast_m = re.search(r"^blast_radius:\s*(.+)$", content, re.MULTILINE)
        blast_radius = blast_m.group(1).strip().upper() if blast_m else "MEDIUM"
        
        auth_m = re.search(r"^auth_level:\s*(.+)$", content, re.MULTILINE)
        auth_level = auth_m.group(1).strip() if auth_m else "public"

        file_m = re.search(r"^file_path:\s*(.+)$", content, re.MULTILINE)
        file_path = file_m.group(1).strip() if file_m else ""

        runbook_m = re.search(r"^runbook:\s*(.+)$", content, re.MULTILINE)
        runbook = runbook_m.group(1).strip() if runbook_m else "docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md"

        # Extract invariants list
        invariants = []
        inv_match = re.search(r"## 🛡️ Non-Negotiable Invariants & Safety Constraints\s*\n(.*?)(?:\n## |\Z)", content, re.DOTALL)
        if inv_match:
            lines = inv_match.group(1).strip().split("\n")
            for l in lines:
                l_clean = l.strip()
                if l_clean and (l_clean[0].isdigit() or l_clean.startswith("-") or l_clean.startswith("*")):
                    rule_text = re.sub(r"^[0-9\.\-\*\s]+\*\*?", "", l_clean).rstrip("*").strip()
                    if rule_text:
                        invariants.append(rule_text)

        # Extract test suites
        test_suites = []
        ts_matches = re.findall(r"test_suites:\s*\n((?:\s+-\s+.+\n?)+)", content)
        if ts_matches:
            for line in ts_matches[0].strip().split("\n"):
                clean_ts = line.replace("-", "").strip()
                if clean_ts:
                    test_suites.append(clean_ts)

        # Extract title & summary
        lines = content.strip().split("\n")
        title = name
        for line in lines:
            if line.startswith("# "):
                title = line.lstrip("# ").strip()
                break

        summary = ""
        for line in lines:
            if line.startswith("> **") and line.endswith("**"):
                summary = line.strip("> *").strip()
                break

        nodes[name.lower()] = {
            "name": name,
            "title": title,
            "path": str(md_file),
            "file_path": file_path,
            "auth_level": auth_level,
            "blast_radius": blast_radius,
            "invariants": invariants,
            "test_suites": test_suites,
            "runbook": runbook,
            "summary": summary,
            "tags": tags,
            "links": [{"label": link_item[0], "target": link_item[1]} for link_item in links],
            "raw_content": content
        }
    return nodes


def find_target(target_query: str, nodes: dict):
    query = target_query.lower().replace("/", "_").replace("-", "_").strip()
    
    # Exact match on key
    for k, v in nodes.items():
        if query == k or f"api_{query}" == k or f"schema_{query}" == k or f"ui_{query}" == k or f"route_{query}" == k:
            return v

    # Substring match
    for k, v in nodes.items():
        if query in k or k in query:
            return v
            
    # Fuzzy search across content & titles
    matches = []
    for k, v in nodes.items():
        if query in v["title"].lower() or query in v["file_path"].lower() or query in v["raw_content"].lower():
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
    parser = argparse.ArgumentParser(description="High-Octane Architecture Pre-Flight Intelligence Tool")
    parser.add_argument("--target", "-t", type=str, help="Name of entity, table, API, or component")
    parser.add_argument("--list", "-l", action="store_true", help="List all available architecture nodes")
    parser.add_argument("--json", "-j", action="store_true", help="Output raw JSON format for agent parsing")
    
    args = parser.parse_args()
    nodes = load_all_nodes()
    
    if args.list:
        print("\n🏛️ Available Architecture Nodes in Knowledge Graph:\n")
        for k, v in sorted(nodes.items()):
            blast_badge = f"[{v['blast_radius']}]"
            print(f"  • {blast_badge:10} {v['title']} ({v['name']}) [{', '.join('#' + t for t in v['tags'][:2])}]")
        print(f"\nTotal Registered Nodes: {len(nodes)}\n")
        return

    if not args.target:
        print("Error: Specify --target <name> or --list. Example: python3 scripts/query_architecture.py --target API_client_create_razorpay_order")
        sys.exit(1)

    node = find_target(args.target, nodes)
    if not node:
        print(f"❌ No architecture node found matching '{args.target}'. Run with --list to view all nodes.")
        sys.exit(1)

    blast = get_blast_radius(node, nodes)
    
    if args.json:
        result = {
            "target": node["title"],
            "name": node["name"],
            "file_path": node["file_path"],
            "auth_level": node["auth_level"],
            "blast_radius": node["blast_radius"],
            "invariants": node["invariants"],
            "test_suites": node["test_suites"],
            "runbook": node["runbook"],
            "summary": node["summary"],
            "tags": node["tags"],
            "spec_file": node["path"],
            "blast_radius_tree": blast
        }
        print(json.dumps(result, indent=2))
        return

    print("=" * 80)
    print(f"🎯 ARCHITECTURE CONTEXT: {node['title']}")
    print("=" * 80)
    print(f"🚨 BLAST RADIUS LEVEL:    [{node['blast_radius']}]")
    print(f"🔒 SECURITY AUTH LEVEL:    [{node['auth_level'].upper()}]")
    print(f"📁 CODEBASE SOURCE FILE:   {node['file_path'] or 'N/A'}")
    print(f"📖 SPECIFICATION NODE:    {node['path']}")
    print(f"🛠️  RECOMMENDED RUNBOOK:   {node['runbook']}")
    
    if node["summary"]:
        print(f"\n💡 Summary: {node['summary']}")

    print("\n" + "-" * 80)
    print("🛡️  NON-NEGOTIABLE INVARIANTS (CRITICAL DOMAIN CONSTRAINTS):")
    print("-" * 80)
    if node["invariants"]:
        for idx, inv in enumerate(node["invariants"], 1):
            print(f"  {idx}. ⚠️  {inv}")
    else:
        print("  • Maintain zero regression and graceful error handling.")

    print("\n" + "-" * 80)
    print("🧪 VERIFICATION & TEST SUITES:")
    print("-" * 80)
    if node["test_suites"]:
        for ts in node["test_suites"]:
            print(f"  • 🧪 {ts}")
    else:
        print("  • npm test (Vitest standard suite)")

    print("\n" + "-" * 80)
    print("⚠️  BLAST RADIUS & DEPENDENCY TREE:")
    print("-" * 80)
    print("⬆️  Upstream Callers (Who calls/relies on this):\n")
    if blast["upstream_callers"]:
        for up in blast["upstream_callers"]:
            print(f"   • {up}")
    else:
        print("   • None directly mapped (Entrypoint or standalone)")

    print("\n⬇️  Downstream Dependencies (What this depends on):\n")
    if blast["downstream_dependencies"]:
        for down in blast["downstream_dependencies"]:
            print(f"   • {down}")
    else:
        print("   • None")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
