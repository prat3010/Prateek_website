---
id: API_contact
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/contact/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/contact/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
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
