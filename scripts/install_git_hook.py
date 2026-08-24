#!/usr/bin/env python3
"""
install_git_hook.py
Installs a Git Pre-Commit Hook into .git/hooks/pre-commit that automatically runs:
python3 scripts/sync_graph_with_code.py
whenever any staged changes are committed.
"""

import os
import stat
from pathlib import Path

WEBSITE_DIR = Path("/Users/prateeksharma/Developer/Prateek_website")
HOOKS_DIR = WEBSITE_DIR / ".git" / "hooks"
PRE_COMMIT_HOOK = HOOKS_DIR / "pre-commit"

HOOK_SCRIPT = """#!/bin/sh
# Auto-sync Obsidian Architecture Knowledge Graph on Git Commit
echo "🔄 [Git Pre-Commit Hook] Synchronizing Obsidian Knowledge Graph & Architecture Canvases..."
python3 scripts/sync_graph_with_code.py

# Stage any newly regenerated canvas or documentation maps
git add docs/MASTER_ARCHITECTURE_MAP.canvas docs/COMMERCE_AND_ESCROW_FLOW.canvas docs/RAG_AND_COGNITIVE_PIPELINE.canvas docs/AUTONOMOUS_OUTREACH_ENGINE.canvas docs/architecture_nodes/ docs/ARCHITECTURE_DEPENDENCY_MAP.md 2>/dev/null || true

exit 0
"""


def main():
    if not HOOKS_DIR.exists():
        print(f"⚠️ Git hooks directory not found at {HOOKS_DIR}")
        return

    PRE_COMMIT_HOOK.write_text(HOOK_SCRIPT.strip() + "\n", encoding="utf-8")
    
    # Make executable (chmod +x)
    st = os.stat(PRE_COMMIT_HOOK)
    os.chmod(PRE_COMMIT_HOOK, st.st_mode | stat.S_IEXEC)
    
    print(f"✓ Git pre-commit hook successfully installed at: {PRE_COMMIT_HOOK}")
    print("✨ Future git commits will automatically synchronize your Obsidian Architecture Graph!")


if __name__ == "__main__":
    main()
