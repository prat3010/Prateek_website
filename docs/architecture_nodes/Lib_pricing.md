---
id: Lib_pricing
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
file_path: src/lib/pricing.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts"
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
downstream:
  - ../25_SOTA_Scoping_Engine_PRD
  - Route_scoping
  - UI_ArchitectureCartDrawer
  - API_client_create_razorpay_order
---

# Lib: `pricing.ts` (Commercial Pricing SSoT)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts)**

#lib #domain #pricing #cpq #ecommerce

> **Single Source of Truth for Client Estimations, Math Formulas & Dependency Trees.**

- **Path:** `src/lib/pricing.ts`
- **Core Functions:**
  - `calcQuote(engineId, featureIds, brandTier, careTier, currency)`
  - `resolveFeatureDependencies(featureIds, allFeatures)`: Recursive topological resolution of prerequisite modules.
  - `resolveDefaultCurrency(regionCookie)`: Geo-IP currency resolver (`INR` vs `USD`).
  - `formatMoney(amount, currency)`: Locale-aware price formatting.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Route: /scoping](Route_scoping.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
