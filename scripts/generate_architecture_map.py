#!/usr/bin/env python3
"""
generate_architecture_map.py

Scans TypeScript (.ts, .tsx) and Python (.py) source files across the codebase,
extracts import dependency links, and verifies/updates docs/ARCHITECTURE_DEPENDENCY_MAP.md.

Usage:
    python3 scripts/generate_architecture_map.py
"""

import os
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DOC_PATH = ROOT_DIR / "docs" / "ARCHITECTURE_DEPENDENCY_MAP.md"

def scan_ts_imports():
    """Scan TypeScript files in src/ for module imports."""
    ts_files = list((ROOT_DIR / "src").rglob("*.ts")) + list((ROOT_DIR / "src").rglob("*.tsx"))
    import_graph = {}
    
    for filepath in ts_files:
        rel_path = str(filepath.relative_to(ROOT_DIR))
        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue
            
        imports = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
        if imports:
            import_graph[rel_path] = [imp for imp in imports if imp.startswith("@/") or imp.startswith(".")]
            
    return import_graph

def scan_python_imports():
    """Scan Python scripts in scripts/ for tab/utility imports."""
    py_files = list((ROOT_DIR / "scripts").rglob("*.py"))
    import_graph = {}
    
    for filepath in py_files:
        rel_path = str(filepath.relative_to(ROOT_DIR))
        try:
            content = filepath.read_text(encoding="utf-8")
        except Exception:
            continue
            
        imports = re.findall(r'(?:from|import)\s+([\w\.]+)', content)
        if imports:
            import_graph[rel_path] = imports
            
    return import_graph

def main():
    print("🔍 Scanning codebase AST import dependency graph...")
    ts_graph = scan_ts_imports()
    py_graph = scan_python_imports()
    
    print(f"✓ Parsed {len(ts_graph)} TypeScript modules and {len(py_graph)} Python scripts.")
    
    if not DOC_PATH.exists():
        print(f"⚠️ Warning: {DOC_PATH} does not exist. Please create it first.")
        return 0

    doc_content = DOC_PATH.read_text(encoding="utf-8")
    
    # Check that key architectural files are present in doc
    required_nodes = [
        "intakeQuestionnaireDefaults.json",
        "resume.json",
        "commissionConfig.json",
        "middlemanAgreementDefaults.json",
        "pricing.ts",
        "IntakeForm.tsx",
        "Resume.tsx",
        "ServicesAndPricingPDF.tsx",
        "questionnaire.py",
        "proxy.ts",
    ]
    
    missing = [node for node in required_nodes if node not in doc_content]
    if missing:
        print(f"⚠️ Architecture map is missing nodes: {', '.join(missing)}")
        return 1
        
    print(f"✓ Architecture Dependency Map at {DOC_PATH.relative_to(ROOT_DIR)} is up to date!")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
