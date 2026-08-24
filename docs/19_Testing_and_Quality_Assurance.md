# **19. Testing and Quality Assurance**

## **Purpose**

The Testing and Quality Assurance specification defines the protocols for verifying codebase health, database integrity, and visual quality. It ensures that no code is merged or deployed containing lint errors, broken types, database mismatches, or accessibility blockers.

---

# **Automated Verification Scripts**

The project includes custom validation scripts under `scripts/`. Developers must execute these check steps before committing changes:

### **1. Full Workspace Verification (`./scripts/verify.sh`)**
Executes a comprehensive, non-interactive suite ensuring zero runtime failures:
1. **Cache Cleansing**: Clears `.next` compilation caches.
2. **Type Checking**: Runs `npx tsc --noEmit` to verify type safety.
3. **Lint Quality**: Runs `npm run lint` for ESLint Next.js 16 & React 19 standards.
4. **Unit & Integration Suite**: Runs `npm test` (Vitest: 31 files, 258 tests).
5. **Dead Code & Dependency Pruning**: Runs `npx knip` to detect unused exports, orphaned files, and bloated dependencies.
6. **Portal Containing-Block Safety (ADR 05)**: Runs `python3 scripts/audit_portal_safety.py` to ensure overlays escape `ScrollSection` containing blocks.
7. **Secret & Credential Leak Audit**: Runs `python3 scripts/audit_secrets.py` to scan diffs for leaked API keys, tokens, or private certificates.
8. **Data Contract & Architecture Graph Sync**: Runs `python3 scripts/audit_contracts.py` & `sync_graph_with_code.py` to keep live code and Obsidian canvases 100% synchronized.

### **2. Headless Browser E2E Testing (Playwright)**
- **Runner:** `npx playwright test` (`npm run test:e2e`)
- **Coverage:** Headless Chromium testing for `/scoping` wizard selections, `/terminal` interactive command execution, and `/analytics` dashboards.

### **3. Property-Based API Fuzzing (Schemathesis)**
- **Runner:** `python3 apps/api/scripts/run_fuzz_tests.py` (in `retriever`)
- **Coverage:** Fuzzes all 85 FastAPI operations via OpenAPI ASGI transport, asserting 0 unhandled 500 crashes.

### **4. Schema Matching (`./scripts/audit_db.py`)**
Compares local configuration settings against active database structures:
* Matches local definitions inside [supabase_schema.sql](../supabase_schema.sql) against tables, policies, and indexes on the live Supabase instance.
* Outputs lists of missing columns or mismatching constraints.

---

# **Unit & Integration Testing (Vitest)**

The project uses [Vitest](https://vitest.dev/) with React Testing Library for unit and integration testing. Tests are colocated with source code under `__tests__/` directories.

### **Test Commands**
| Command | Description |
|---------|-------------|
| `npm test` | Single run — executes all tests |
| `npm run test:watch` | Watch mode — re-runs on file changes |
| `npm run test:coverage` | Runs with V8 coverage report |

### **Configuration**
- **Config:** `vitest.config.ts` — jsdom environment, `@` path alias, `pool: 'forks'` for process isolation
- **Setup:** `vitest.setup.ts` — imports `@testing-library/jest-dom/vitest` for DOM matchers
- **Coverage:** `src/lib/**`, `src/utils/**`, `src/hooks/**`

### **Test Categories**
| Category | Location | What's tested |
|----------|----------|---------------|
| Pure functions | `src/utils/__tests__/` | `escapeHtml` sanitization |
| Data layer & helpers | `src/lib/__tests__/` | Supabase fallback, `getSkillsHighlight`, `getIpHash`, honeypot patterns |
| API routes | `src/app/api/__tests__/` | CRUD handlers (skills, projects, certificates, profile), contact validation, cache revalidation, git-log, analytics aggregation |
| Client hooks | `src/hooks/__tests__/` | `useTypewriter`, `useScrambledText` |
| Analytics utils | `src/app/admin/analytics/__tests__/` | URI decoding, referrer normalization, interval grouping |

### **Mock Patterns**
- **Supabase CRUD routes:** `createResolvableChain(result)` builds a thenable mock chain with `.select()`, `.insert()`, `.order()`, `.single()`, etc. Mocked via `vi.mock('@/data/supabase', ...)`.
- **API key auth:** `process.env.SYNC_API_KEY` is set in `beforeEach`; the key is passed via `makePostRequest(body, apiKey)` to set the `x-api-key` header.
- **Next.js cache:** `vi.mock('next/cache', ...)` stubs `revalidateTag`.

### **Adding New Tests**
1. Create `__tests__/<name>.test.ts` next to the source file.
2. Mock external dependencies with `vi.mock(...)` before importing the module under test.
3. Use `beforeEach` to reset mock state and set environment variables.
4. Run `npm test` to verify.

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
- `npm test` passes all tests (0 failures).
- `./scripts/verify.sh` runs and exits with code 0 (zero errors and warnings).
- `./scripts/audit_db.py` reports no missing tables or column schema gaps.
- Manual test checks pass across both desktop and mobile viewports.

---

## **Related Architecture & Cross-References**

- [Audit Checklist & Test Baselines](MASTER_CODEBASE_AUDIT_CHECKLIST.md)
- [Codebase Modernization Rules](18_Codebase_Modernization_and_Refactoring.md)
- [CI/CD & Deployment Verification](20_Deployment_Strategy.md)