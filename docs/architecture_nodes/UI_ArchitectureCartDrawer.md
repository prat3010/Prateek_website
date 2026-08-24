---
id: UI_ArchitectureCartDrawer
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
  - domain/scoping
  - platform/website
downstream:
  - ../25_SOTA_Scoping_Engine_PRD
  - UI_TopologyMap
  - UI_PreDepositBridge
  - Schema_client_scopes
---

# UI: `ArchitectureCartDrawer.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #frontend #cpq #cart #ecommerce

> **Productized E-Commerce Drawer with Real-Time CPQ Pricing & Topology Map.**

- **Features:**
  - Sticky bottom action bar (`⚡ Instant Estimate: ₹3,75,000 / $4,500`)
  - Transitive feature dependency enforcement (`resolveFeatureDependencies`)
  - Compulsory vs optional module toggles
  - Embedded `TopologyMap.tsx` live SVG circuit
  - Dynamic promo code re-computation

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
- [Schema: client_scopes](Schema_client_scopes.md)
