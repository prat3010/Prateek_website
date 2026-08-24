#!/bin/sh
# Auto-sync Obsidian Architecture Knowledge Graph on Git Commit
echo "🔄 [Git Pre-Commit Hook] Synchronizing Obsidian Knowledge Graph & Architecture Canvases..."
python3 scripts/sync_graph_with_code.py

# Stage any newly regenerated canvas or documentation maps
git add docs/MASTER_ARCHITECTURE_MAP.canvas docs/COMMERCE_AND_ESCROW_FLOW.canvas docs/RAG_AND_COGNITIVE_PIPELINE.canvas docs/AUTONOMOUS_OUTREACH_ENGINE.canvas docs/architecture_nodes/ docs/ARCHITECTURE_DEPENDENCY_MAP.md 2>/dev/null || true

exit 0
