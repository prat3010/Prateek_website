---
id: Engine_Digital_SOW_Escrow_Freeze
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
tags:
  - tier/2_discovery_commerce
  - security/public
  - domain/commerce
  - platform/website
downstream:
  - ../14_Razorpay_Payments_and_Invoicing
  - API_client_verify_razorpay_payment
  - Schema_client_scopes
  - UI_PreDepositBridge
---

# Engine: Digital SOW & 50% Escrow Freeze

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#engine #escrow #sow #legal #security #phase_g

> **Cryptographic SOW Immutability Locking on Deposit Capture.**

- **Mechanism:** When a client pays the 50% deposit via Razorpay, the backend calculates an SHA-256 hash of the exact JSON configuration snapshot (`engine`, `features`, `brand`, `care`, `pricing`, `timestamp`).
- **Immutability:** Locks the agreed scope to prevent scope creep while allowing flexible Phase 2 Change Orders.

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [API: client/verify-razorpay-payment](API_client_verify_razorpay_payment.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
