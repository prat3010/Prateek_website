---
id: UI_CommercialPDFSuite
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
  - domain/pdf
  - platform/website
downstream:
  - ../99_DECISIONS
  - UI_ScopingLab
  - UI_MiddlemanAgreement
---

# UI: `pdfTheme.ts`, `pdfFonts.ts` & React-PDF Exporters

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #pdf #theme #typography #commercial

> **Client & Server Commercial PDF Export Infrastructure with Azure/Noir Tokens.**

- **Paths:** `src/components/pdf/pdfTheme.ts`, `pdfFonts.ts`, `ScopingBriefPDF.tsx`, `MiddlemanAgreementPDF.tsx`
- **Features:**
  - Pinned page counts enforced by automated smoke tests
  - Playfair Display, Lora, and JetBrains Mono typography tokens
  - `getPdfTheme(isNoir)` dynamically toggles light/dark document styling

---

## 🔗 Related Architecture & Cross-References
- [99_DECISIONS (ADR 11 & 12)](../99_DECISIONS.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: MiddlemanAgreement](UI_MiddlemanAgreement.md)
