---
name: docs-synchronizer
description: Manages the Spec-First Architecture Blueprinting, Post-Milestone Knowledge Graph Synchronization, and Obsidian Canvas Regeneration lifecycle.
---

# Documentation & Architecture Synchronizer Skill

Keeps project documentation, roadmaps, dependency maps, and the 8-tier Obsidian Architecture Knowledge Graph 100% synchronized with live code.

## Lifecycle Workflow

### Phase 1: Pre-Milestone Contract Blueprinting (Before Code)
1. Draft or review the target architecture node in `docs/architecture_nodes/` with:
   - `id`, `tier`, `platform`, `auth_level`, `blast_radius`, `file_path`
   - `status: planned` (ensures agents recognize target contract without hallucinating that code exists)
   - Non-negotiable safety invariants and expected test suites
2. Query the Knowledge Graph pre-flight:
   ```bash
   python3 scripts/query_architecture.py --target <entity_or_api>
   ```

### Phase 2: Post-Milestone Graph & Vault Synchronization (After Code & Tests)
1. Update node status from `status: planned` → `status: production`.
2. Check off completed milestone items in `UNIFIED_MASTER_ROADMAP.md` / `ROADMAP.md`.
3. Capture new architectural lessons or framework quirks in `docs/LEARNINGS.md`.
4. Run the full synchronization toolchain:
   ```bash
   python3 scripts/sync_graph_with_code.py
   python3 scripts/audit_contracts.py
   python3 scripts/audit_db.py
   ```

