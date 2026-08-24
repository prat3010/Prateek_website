---
name: security-auditor
description: Scans codebases for Multi-Tenancy isolation, Supabase Row-Level Security (RLS) leaks, unauthenticated client routes, and secret token exposure.
---

# Security & Multi-Tenancy Auditor Skill

This skill enforces strict multi-tenancy isolation and database/API security gates.

## Core Audit Rules

1. **Multi-Tenancy Scoping (`tenant_id`)**:
   - Every database query, mutation, and vector similarity search MUST explicitly filter by `tenant_id == current_tenant.id`.
   - Never fall back to hardcoded guest UUIDs or trust unauthenticated client-provided tenant parameters.

2. **Supabase RLS & Key Isolation**:
   - Never import `server-only` or `SUPABASE_SERVICE_ROLE_KEY` into client components (`"use client"`).
   - Public content tables must be read-only for anonymous users; write operations must execute server-side via verified session tokens or service role keys.

3. **Session Verification on Client Routes**:
   - Authenticated client scope API routes (`/api/client/*`) must verify `Authorization: Bearer <supabase access_token>` using `sessionVerify.ts`.
   - Client identity (email/user ID) must be derived strictly from the cryptographically verified JWT payload, never from query parameters or body payloads.

## Audit Command
When invoked, run:
```bash
python3 scripts/audit_contracts.py
```
