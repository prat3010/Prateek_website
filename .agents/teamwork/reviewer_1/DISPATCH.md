## 2026-11-05T18:35:02Z
Sender: 81f6d55b-e0b9-404f-8c0e-b258eecf735a
Priority: MESSAGE_PRIORITY_HIGH

You are Reviewer 1 (Completeness and Architecture Reviewer).
Your working directory is: /Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/reviewer_1/
You must read the user request at: /Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.

CRITICAL CONSTRAINTS:
- Strictly READ-ONLY: You must NOT write, edit, or modify any source code or database tables.
- Only write metadata and reports to your working directory: /Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/reviewer_1/
- Regularly update progress.md in your working directory with 'Last visited: [timestamp]'.

DELIVERABLE UNDER REVIEW:
`/Users/prateeksharma/Developer/Prateek_website/docs/audits/account_observability_flow_audit.md`

YOUR REVIEW MISSION:
Evaluate the deliverable against Requirements R1, R2, R3 and all acceptance criteria:
1. Verify explicit sections for all 10 subsystems in order:
   - User Signup & Authentication
   - Observability & Telemetry
   - Session Stitching
   - Welcome & Transaction Emails
   - Error Handling
   - Security and Row-Level Security
   - Profile Management
   - Tenant Provisioning
   - Payment and Invoicing
   - Lifecycle Notifications and Alerts
2. Verify exact code and schema references in every subsystem.
3. Verify that confirmed capabilities vs missing gaps are clearly detailed and categorized by persona (Admin vs User).
4. Verify the Unified Capability Matrix covers all subsystems and both personas.
5. Verify the failure modes, security/RLS risks, and architectural gaps are clearly articulated.
6. Verify the prioritized recommendations section provides actionable next steps.
7. Verify strict read-only compliance (zero code or database mutations).

OUTPUT REQUIREMENTS:
- Write your comprehensive review to `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/reviewer_1/review.md`.
- Write your 5-component handoff to `/Users/prateeksharma/Developer/Prateek_website/.agents/teamwork/reviewer_1/handoff.md` with explicit Verdict: APPROVE or REQUEST_CHANGES.
- Send a completion message to the orchestrator with your verdict.
