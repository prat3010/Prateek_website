# **19. Testing and Quality Assurance**

## **Purpose**

The Testing and Quality Assurance specification defines the protocols for verifying codebase health, database integrity, and visual quality. It ensures that no code is merged or deployed containing lint errors, broken types, database mismatches, or accessibility blockers.

---

# **Automated Verification Scripts**

The project includes custom validation scripts under `scripts/`. Developers must execute these check steps before committing changes:

### **1. Workspace Validation (`./scripts/verify.sh`)**
Executes a full sweep of the application to ensure it builds correctly:
* **Cache Cleansing**: Deletes `.next` compilation caches to prevent stale references.
* **Type Checking**: Runs `npx tsc --noEmit` to verify type safety.
* **Lint Check**: Runs the project linter (`npm run lint` or `eslint`) to check formatting.
* **Trial Build**: Triggers a production test build (`npm run build`) to ensure bundlers build without compilation errors.

### **2. Schema Matching (`./scripts/audit_db.py`)**
Compares local configuration settings against active database structures:
* Matches local definitions inside [supabase_schema.sql](file:///Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql) against tables, policies, and indexes on the live Supabase instance.
* Outputs lists of missing columns or mismatching constraints.

---

# **Troubleshooting Build Failures**

### **Stale Type References**
When routes or interfaces are modified, TypeScript type checking may fail due to cached references in `.next/types/`. When this happens, clear the compiler cache manually:
```bash
rm -rf .next && npx tsc --noEmit
```

### **Linter Rules (ESLint)**
All warnings and errors must be resolved. The build pipeline enforces a zero-lint-warning policy for production releases.

---

# **Manual Verification Checklist**

For interactive visual changes, developers must complete this checklist:

* **[ ] Audience Adaptive Flow**: Select "Hiring a Developer" and check the layout, then switch to "Need a Website". The transition must trigger the decoding animation without layout jumps or page reloads.
* **[ ] Mobile Compatibility**: Verify menu toggles, button tap targets (minimum size 48x48px), and text sizing on small viewport screens.
* **[ ] PDF Generation Test**: Trigger resume and quotation downloads. Verify the generated PDF files open correctly and contain current database info.
* **[ ] Contact Validation**: Submit the contact form with empty values, invalid email formats, and long text bodies. Ensure validation messages appear and rate-limits trigger as expected.
* **[ ] Motion Settings**: Enable "Reduced Motion" in OS settings and check that transitions disable gracefully on the website.

---

# **Acceptance Criteria**
- The script `./scripts/verify.sh` runs and exits with code 0 (zero errors and warnings).
- The script `./scripts/audit_db.py` reports no missing tables or column schema gaps.
- Manual test checks pass across both desktop and mobile viewports.
