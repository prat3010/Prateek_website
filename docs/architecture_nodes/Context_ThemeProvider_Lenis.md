---
id: Context_ThemeProvider_Lenis
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
downstream:
  - ../06_Adaptive_Identity_System
  - Route_home
  - Route_rag_app
---

# Context: `ThemeProvider.tsx` & `LenisProvider.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#context #provider #theme #scroll #lenis

> **Global Client Providers for Dual-Theme Hydration & Lenis Smooth Scrolling.**

- **Paths:** `src/context/ThemeContext.tsx` & `src/context/LenisContext.tsx`
- **Contracts:**
  - Server-first cookie parsing in `RootLayout` eliminates layout shifts (CLS-free).
  - Visual Theme (`Azure` vs `Noir`) and Communication Identity (`Dev` vs `Business`) are strictly independent.
  - Lenis scroll container isolates interactive sub-windows via `data-lenis-prevent`.

---

## 🔗 Related Architecture & Cross-References
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [Route: /](Route_home.md)
- [Route: /rag/app](Route_rag_app.md)
