# Plan: End-to-End User Account Creation, Observability, and Management Flow Audit

## Objective
Audit the entire user account creation, observability, and management flow across Prateek_website, Supabase, and the Retriever backend. Cover all 10 subsystems, evaluate capabilities from Admin and User perspectives, identify gaps, failure modes, security/RLS risks, and architectural concerns, and deliver a comprehensive markdown report to `docs/audits/account_observability_flow_audit.md`.

## Constraints & Rules
- Strictly Read-Only: zero modifications to application code or database records/schemas.
- Only create/write the final audit report file at `docs/audits/account_observability_flow_audit.md` and agent metadata in `.agents/teamwork/`.
- All investigation and authoring must be performed by dispatched subagents.

## Phases

### Phase 0: Parallel Codebase Survey (3 Explorers)
- **Explorer 1** (`explorer_survey_1`):
  - Focus: Subsystem 1 (User Signup & Authentication), Subsystem 4 (Welcome & Transaction Emails), Subsystem 7 (Profile Management).
  - Target files: `src/app/auth/callback/route.ts`, `src/lib/auth.ts`, `src/context/AuthContext.tsx`, `src/app/login/`, `src/app/rag/login/`, `src/lib/emailNotification.ts`, Resend templates, `clients` table schema, `src/app/api/client/`, Supabase auth triggers.
- **Explorer 2** (`explorer_survey_2`):
  - Focus: Subsystem 2 (Observability & Telemetry), Subsystem 3 (Session Stitching), Subsystem 5 (Error Handling), Subsystem 10 (Lifecycle Notifications and Alerts).
  - Target files: `src/proxy.ts`, `src/lib/scopingObservability.ts`, `src/app/api/analytics-summary/`, `page_visits` schema, hot lead alerts, Resend admin notifications, error boundaries, API error responses, onboarding notifications.
- **Explorer 3** (`explorer_survey_3`):
  - Focus: Subsystem 6 (Security and Row-Level Security), Subsystem 8 (Tenant Provisioning), Subsystem 9 (Payment and Invoicing).
  - Target files: `supabase_schema.sql`, `src/lib/sessionVerify.ts`, RLS policies on all tables, `rag_tenants`, `rag_tenant_members`, `src/app/api/rag/tenant/`, `src/app/api/rag/invite/`, `src/app/api/rag/members/`, `retriever/apps/api/`, `src/lib/invoicing.ts`, Razorpay routes (`/api/client/create-razorpay-order`, `verify-razorpay-payment`, `webhooks/razorpay`).

### Phase 1: Synthesis & Audit Report Authoring (Worker)
- Aggregate all 3 explorer reports.
- Dispatch `teamwork_worker` to author `docs/audits/account_observability_flow_audit.md` following the required structure in R2 and meeting all criteria in R1, R2, R3.

### Phase 2: Independent Review & Verification
- Dispatch 2 `teamwork_reviewer` subagents to review completeness, technical accuracy, code/schema references, persona matrix, and recommendations.
- Dispatch 2 `teamwork_challenger` subagents to stress-test coverage of failure paths, edge cases, and RLS bypasses.
- Dispatch 1 `teamwork_auditor` to verify zero source/database changes and confirm forensic integrity.
- Collect verdicts in `GATE_STATUS.md`.

### Phase 3: Completion & Reporting
- Update orchestrator state, write final `handoff.md`, and report back to parent agent.
