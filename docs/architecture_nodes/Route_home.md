---
id: Route_home
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/portfolio
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../04_Adaptive_Portfolio_Experience
  - ../06_Adaptive_Identity_System
  - ../08_Information_Architecture
  - UI_NoirSkyline
  - Context_ThemeProvider_Lenis
  - Lib_data
---

# Route: `/` (Adaptive Portfolio Home)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/page.tsx)**

#route #frontend #ui #identity

> **Core Multi-Audience Portfolio Experience with Azure/Noir Skyline & Lenis Smooth Scroll.**

- **Path:** `src/app/page.tsx` & `src/components/`
- **Key Features:**
  - NoirSkyline 6-layer parallax backdrop (`isMobile` & `reducedMotion` decoupled)
  - Audience Identity Switcher (`Developer` vs `Business`)
  - Server-First Cookie Extraction (`theme`, `audience`) in `RootLayout`
  - Lenis smooth scroll container (`LenisProvider.tsx`)
  - Sections: Hero, About, Skills, Projects, Playground, Resume, Scoping, Contact, Footer

---

## 🔗 Related Architecture & Cross-References
- [04_Adaptive_Portfolio_Experience](../04_Adaptive_Portfolio_Experience.md)
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [08_Information_Architecture](../08_Information_Architecture.md)
- [UI: NoirSkyline](UI_NoirSkyline.md)
- [Context: ThemeProvider & Lenis](Context_ThemeProvider_Lenis.md)
- [Lib: data.ts](Lib_data.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

