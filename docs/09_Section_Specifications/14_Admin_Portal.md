# **14. Master Admin Control Center (`/admin`)**

## **Purpose**

The **Master Admin Control Center** (`/admin`) serves as the cloud-hosted command deck for platform-level management across client scopes, invoice payment verification, and the 24/7 Autonomous AI Lead Outreach queue.

---

## **Key Capabilities & User Flows**

1. **Google OAuth & Master Role Gate**:
   - Strictly restricted to platform owners (`3010prateeksharma@gmail.com`) via server-side session checks and [`AuthContext.tsx`](../../src/context/AuthContext.tsx).
   - Unauthorized attempts automatically redirect to `/` with an access denied alert.

2. **Autonomous AI Outreach Queue & Dispatch**:
   - Real-time review and dispatch of prospective B2B client outreach emails via `/api/outreach/dispatch` and `/api/outreach/get-leads`.
   - Displays AI-generated prospect dossiers: lead company, predicted persona archetype, propensity score, and tailored pitch script.
   - 1-click manual dispatch or batch queue execution via Resend email service.

3. **Global Client Scope & Invoice Ledger Oversight**:
   - Master visibility into all submitted project scopes across all tenants (`client_scopes` table).
   - Real-time payment verification statuses, deposit locks, and manual invoice reconciliation.

4. **Design System 2.0 Aesthetics**:
   - Full parity across Azure (editorial graphic novel) and Noir (cyber-monospace obsidian) themes using semantic design tokens (`--surface-elevated`, `--color-primary`, `--badge-active-*`).
