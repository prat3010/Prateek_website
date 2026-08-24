# 🚀 Architecture Runbook: Creating a New API Endpoint

**Objective:** Standard Operating Procedure (SOP) for developing, securing, testing, and documenting a Next.js 16 App Router or FastAPI route handler.

---

## 🔒 Step 1: Security & Session Derivation (Mandatory)
- **Session Extraction:** If the route is private/client-gated, caller MUST pass `Authorization: Bearer <supabase_token>`.
- **Identity Derivation:** Call `getVerifiedSessionEmail(req)` or `getVerifiedSessionUser(req)` from `@/lib/sessionVerify`.
  > [!CAUTION]
  > NEVER accept client email or client ID from the request body or URL params for authorization.
- **Admin Endpoints:** If the route requires operator privilege, verify session email against `isAdminEmail(email)`.

---

## 🏗️ Step 2: Implementation & Error Handling
1. **Directory Structure:** Create `src/app/api/<resource>/route.ts`.
2. **Method Handlers:** Export explicit named functions: `export async function POST(req: NextRequest)` (or `GET`, `DELETE`).
3. **HTTP Status Conventions:**
   - `200 OK` / `201 Created` for successful mutations.
   - `400 Bad Request` for invalid schemas.
   - `401 Unauthorized` for missing/invalid tokens.
   - `403 Forbidden` for unauthorized resource access.
   - `409 Conflict` / `422 Unprocessable` for business invariant violations.
   - `500 Internal Server Error` with safe generic error messages.

---

## 🧪 Step 3: Automated Unit & Integration Tests
1. Create test file at `src/app/api/__tests__/<resource>.test.ts`.
2. Cover the following scenarios:
   - Rejection of unauthenticated requests (401).
   - Rejection of invalid payload schemas (400).
   - Success path returning correct payload structure (200/201).
   - Error path handling database or upstream network failure (500).
3. Run `npm test` to verify.

---

## 🏛️ Step 4: Knowledge Graph & Canvas Synchronization
1. Create architecture node: `docs/architecture_nodes/API_<resource>.md` with YAML frontmatter:
   - `id: API_<resource>`
   - `tier: 4_api_gateway`
   - `auth_level: bearer_jwt | public | admin`
   - `blast_radius: critical | high | medium | low`
   - `invariants: [...]`
2. Run `python3 scripts/sync_graph_with_code.py` to link with Obsidian Canvas and pre-push hooks.
