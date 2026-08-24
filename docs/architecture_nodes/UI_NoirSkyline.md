---
id: UI_NoirSkyline
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
file_path: src/components/effects/NoirSkyline.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/effects/NoirSkyline.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/effects/NoirSkyline.tsx"
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
downstream:
  - ../99_DECISIONS
  - Route_home
  - ../05_User_Experience_and_Interaction_Design
---

# UI: `NoirSkyline.tsx` (6-Layer Parallax Backdrop)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/effects/NoirSkyline.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/effects/NoirSkyline.tsx)**

#ui #effects #graphics #svg #parallax

> **Fixed 6-Layer Deterministic Hand-Drawn Skyline with Decoupled Mobile Parallax.**

- **Path:** `src/components/effects/NoirSkyline.tsx` & `wobblyPaths.generated.ts`
- **Performance Contracts:**
  - `isMobile` (width ≤ 768px or coarse pointer) and `reducedMotion` (OS preference or < 4 cores) are tracked separately.
  - Mobile preserves scroll parallax while switching `preserveAspectRatio` to `xMidYMax meet` with seamless sky extension (`var(--skyline-sky-bg)`).
  - Prebaked SVG wobble paths prevent runtime main-thread polygon displacement.

---

## 🔗 Related Architecture & Cross-References
- [99_DECISIONS (ADR 10)](../99_DECISIONS.md)
- [Route: /](Route_home.md)
- [05_User_Experience_and_Interaction_Design](../05_User_Experience_and_Interaction_Design.md)
