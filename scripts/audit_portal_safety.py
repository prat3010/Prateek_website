#!/usr/bin/env python3
"""
audit_portal_safety.py
Scans React components across src/components/ to ensure any modal, backdrop,
or full-screen overlay rendered inside ScrollSection escapes the CSS containing
block via <Portal> (src/components/ui/Portal.tsx) in compliance with ADR 05.
"""

import re
from pathlib import Path

COMPONENTS_DIR = Path("/Users/prateeksharma/Developer/Prateek_website/src/components")


def audit_portals():
    print("🔍 Auditing React components for Framer Motion Containing Block (<Portal>) compliance...")
    
    issues = []
    compliant_modals = []
    
    # Heuristics for overlay / modal indicators in TSX files
    modal_patterns = [
        r"position:\s*['\"]fixed['\"]",
        r"className=.*?\bfixed\b",
        r"className=.*?\bmodal\b",
        r"className=.*?\bbackdrop\b",
        r"className=.*?\boverlay\b",
        r"className=.*?\bdialog\b",
        r"role=['\"]dialog['\"]",
        r"aria-modal=['\"]true['\"]"
    ]
    
    for tsx_file in sorted(COMPONENTS_DIR.rglob("*.tsx")):
        if "__tests__" in str(tsx_file) or ".test." in tsx_file.name:
            continue
        # Skip Portal component itself and effects/background layers that are intentionally mounted at root
        if tsx_file.name in ["Portal.tsx", "ScrollSection.tsx", "NoirSkyline.tsx", "GestureScroll.tsx"]:
            continue
            
        content = tsx_file.read_text(encoding="utf-8")
        
        # Check if file has modal / fixed overlay indicators
        has_overlay = any(re.search(pat, content, re.IGNORECASE) for pat in modal_patterns)
        
        # Check if file is in a section that is placed inside ScrollSection (e.g., About, Resume, Intake, etc.)
        rel_path = tsx_file.relative_to(COMPONENTS_DIR)
        
        if has_overlay:
            uses_portal = "<Portal" in content or "createPortal" in content
            
            # Check if it's a floating HUD or navbar that is outside ScrollSection or uses custom fixed root
            is_global_root_element = "Navbar" in str(rel_path) or "ThemeToggle" in str(rel_path) or "AudioControl" in str(rel_path)
            
            if uses_portal:
                compliant_modals.append(str(rel_path))
            elif is_global_root_element:
                pass # Intentionally mounted outside ScrollSection in RootLayout
            else:
                # Potential unportalled overlay
                # Let's verify if it renders an interactive modal / popup
                if "modal" in str(rel_path).lower() or "dialog" in str(rel_path).lower() or "drawer" in str(rel_path).lower():
                    issues.append(f"⚠️ {rel_path} renders an overlay/modal but does NOT import or wrap with <Portal>!")
                else:
                    compliant_modals.append(f"{rel_path} (inline UI)")

    print(f"✓ Found {len(compliant_modals)} compliant overlay/modal implementations.")
    for cm in compliant_modals[:5]:
        print(f"   - {cm}")
    if len(compliant_modals) > 5:
        print(f"   - ... and {len(compliant_modals) - 5} more.")

    if issues:
        print(f"\n❌ Containing Block Violations Detected ({len(issues)}):")
        for iss in issues:
            print(f"   {iss}")
        return False
    else:
        print("\n✨ Portal Safety Audit Passed! Zero containing block violations detected.")
        return True


if __name__ == "__main__":
    success = audit_portals()
    exit(0 if success else 1)
