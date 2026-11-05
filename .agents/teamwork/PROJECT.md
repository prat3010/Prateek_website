# Project: Account Observability & Management Flow Audit

## Architecture
The system under audit comprises three tiers:
1. **Frontend / Web Control Plane (`Prateek_website`)**: Next.js 16 App Router on Vercel, Supabase Auth client/server PKCE, Edge proxy telemetry, Resend email dispatch, Razorpay payment client & webhooks.
2. **Persistence & Auth Layer (`Supabase`)**: PostgreSQL with pgvector, Supabase Auth (`auth.users`), RLS policies on `clients`, `scopes`, `invoices`, `page_visits`, `rag_tenants`, `rag_tenant_members`, `rag_documents`.
3. **Cognitive Backend (`Retriever`)**: FastAPI running on Oracle Cloud VPS, pgvector storage, multi-tenant scoping via `tenant_id`, API key auth, document vector ingestion.

## Feature Inventory
| # | Feature / Subsystem | Description | Milestone | Source |
|---|---------------------|-------------|-----------|--------|
| 1 | User Signup & Authentication | Callback, Google OAuth, Magic Link, Email/Password, session cookies, redirects | Survey / Audit | R1.1 |
| 2 | Observability & Telemetry | Admin Signup Notification via Resend, Edge telemetry in proxy.ts, page visit logging | Survey / Audit | R1.2 |
| 3 | Session Stitching | scopingObservability.ts, tracking cookies, associating anonymous chat traces with user emails | Survey / Audit | R1.3 |
| 4 | Welcome & Transaction Emails | Email templates, sending triggers, delivery reliability | Survey / Audit | R1.4 |
| 5 | Error Handling | Failure paths across auth, webhook processing, onboarding, 3rd party integrations | Survey / Audit | R1.5 |
| 6 | Security and Row-Level Security | Supabase RLS policies, multi-tenancy isolation, session token verification | Survey / Audit | R1.6 |
| 7 | Profile Management | User and client record creation, updating, persistence in clients table and auth | Survey / Audit | R1.7 |
| 8 | Tenant Provisioning | Retriever OCI engine integration, rag_tenants, rag_tenant_members, trial periods | Survey / Audit | R1.8 |
| 9 | Payment and Invoicing | Razorpay order creation, payment verification, invoice persistence, subscription states | Survey / Audit | R1.9 |
| 10 | Lifecycle Notifications & Alerts | Hot lead alerts, onboarding milestone progressions, invoice status updates | Survey / Audit | R1.10 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Phase 0: Survey | 3 Explorers map 10 subsystems | none | DONE |
| 2 | Phase 1: Author Report | Worker writes `docs/audits/account_observability_flow_audit.md` | M1 | DONE |
| 3 | Phase 2: Verification Gate | 2 Reviewers, 2 Challengers, 1 Auditor | M2 | DONE |
| 4 | Phase 3: Deliverable & Handoff | Final state check and reporting back to parent | M3 | IN_PROGRESS |

## Code Layout
- Web App: `/Users/prateeksharma/Developer/Prateek_website`
- Database Schema: `/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql`
- Retriever Backend: `/Users/prateeksharma/Developer/retriever`
- Deliverable: `/Users/prateeksharma/Developer/Prateek_website/docs/audits/account_observability_flow_audit.md`
- Metadata & Working Dirs: `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/`
