---
id: API_contact
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/contact/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../09_Section_Specifications/08_Contact
  - ../16_Security_and_Privacy
---

# API: `POST /api/contact` (Contact Form Gateway)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts)**

#api #email #resend #recaptcha

> **Inbound Lead Submission with Invisible Google reCAPTCHA v3 & Resend Email Delivery.**

- **Path:** `src/app/api/contact/route.ts`
- **Services:** Google reCAPTCHA score verification + Resend API
- **Recipient:** `prateeqsharma@gmail.com`

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/08_Contact](../09_Section_Specifications/08_Contact.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

