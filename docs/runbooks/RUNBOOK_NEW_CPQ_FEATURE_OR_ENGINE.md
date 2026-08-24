# 💰 Architecture Runbook: Adding a New CPQ Engine or Feature Module

**Objective:** Standard Operating Procedure (SOP) for expanding the Scoping Lab, Cart Drawer, and PDF Commercial proposals without breaking pricing math or contracts.

---

## 📋 Step 1: Single Source of Truth Data Registration
1. Open `src/data/intakeQuestionnaireDefaults.json`.
2. **If adding a Base Engine:** Add entry under `baseEngines` array with unique `id`, `title`, `inrPrice`, `usdPrice`, and delivery days.
3. **If adding a Feature Module:** Add entry under `featureModules` array with unique `id`, `title`, `inrPrice`, `usdPrice`, and optional `dependsOn` array.
4. **If adding a Maintenance/Care Plan:** Add entry under `maintenancePlans` array.

---

## ⚙️ Step 2: Database Seeding & Contract Verification
1. Run local contract audit:
   ```bash
   python3 scripts/audit_contracts.py
   ```
2. Synchronize Supabase tables and cache:
   ```bash
   python3 scripts/seed_supabase.py
   ```

---

## 🧮 Step 3: Domain Math & PDF Smoke Testing
1. **Pricing Engine:** Verify that `src/lib/pricing.ts` resolves feature dependencies via `resolveFeatureDependencies()`.
2. **PDF Commercial Layouts:** Run the commercial PDF smoke test suite to guarantee that page counts and branding stay pinned:
   ```bash
   npx vitest run src/lib/__tests__/pdf-smoke.test.ts
   ```
   *(Ensure Scoping Guide = 3 pages, Services & Pricing Guide = 6 pages in both Azure and Noir themes).*

---

## 🏛️ Step 4: Knowledge Graph Sync
1. Run `python3 scripts/sync_graph_with_code.py` to verify that CPQ data contracts match all linked architecture nodes.
