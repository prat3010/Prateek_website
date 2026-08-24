---
name: docs-synchronizer
description: Automatically scans modified files, audits markdown documentation, updates roadmaps, and synchronizes the Obsidian Knowledge Graph canvas.
---

# Documentation & Architecture Synchronizer Skill

This skill keeps project documentation, dependency maps, and the Obsidian Architecture Knowledge Graph 100% synchronized with live code.

## Core Sync Rules

1. **Mandatory Documentation Audit**:
   - Whenever any code change is executed (even a minor bug fix or single property tweak), the agent MUST audit all relevant project documentation (`docs/`, `ROADMAP.md`, `CLIENT_DASHBOARD_ROADMAP.md`, `README.md`) and update affected sections.

2. **Graph & Canvas Synchronization**:
   - After code edits, the agent MUST run `python3 scripts/sync_graph_with_code.py` to regenerate all 43 architecture nodes, update `MASTER_ARCHITECTURE_MAP.canvas`, and refresh `docs/ARCHITECTURE_DEPENDENCY_MAP.md`.

## Execution Command
```bash
python3 scripts/sync_graph_with_code.py
```
