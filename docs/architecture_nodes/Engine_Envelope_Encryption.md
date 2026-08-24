---
id: Engine_Envelope_Encryption
tier: 7_async_security
platform: Retriever
status: production
auth_level: public
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/src/"
tags:
  - tier/7_async_security
  - security/public
  - domain/async_infra
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
  - ../16_Security_and_Privacy
---

# Engine: Zero-Trust Envelope Encryption (Milestone 50)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #security #encryption #kms #m50

> **Per-Tenant Data-At-Rest Key Management & Envelope Cryptography.**

- **Mechanism:** Every tenant document chunk is encrypted using a unique DEK wrapped by master KMS.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
