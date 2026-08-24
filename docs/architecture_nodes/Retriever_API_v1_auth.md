---
id: Retriever_API_v1_auth
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
file_path: apps/api/src/routers/auth.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py"
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
---

# Retriever API: `apps/api/src/routers/auth.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py)**

#retriever #api #auth #jwt

> **Tenant API Key Authentication & Cryptographic Verification.**

- **Endpoints:** `/v1/auth/token`, `/v1/auth/verify`
- **Security:** SHA-256 key hashing with dynamic rate limiting per tier.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
