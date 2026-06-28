# myMEDLIFE Production Approval Request

Date: 2026-06-25

Status:
- review-ready staging
- not live-ready yet

## What Is Ready

- Role-based shells are in place.
- Launch-readiness, pilot-readiness, design QA, system health, and operations review surfaces exist.
- Tests, lint, and build are green in the current worktree.
- Live external sends and broad writes remain disabled by default, except for
  the narrow Luma event-loop staging proof that is separately gated and
  reviewer-visible.

## What Needs Approval

The following defaults are now approved by the primary approver:

1. Staging reviewer access path
   - Approved default: `staging.mymedlife.org` behind the existing Vercel SSO handoff.

2. Pilot scope
   - Approved default: one chapter only, small and controlled.

3. First hosted write
   - Approved default: `action_started` as the first hosted write.
   - Keep external sends at zero.

4. Smallest proof/review loop
   - Approved default: metadata submit -> leader review -> audit trail.
   - Keep uploads, public proof, and broader HQ publishing off.

5. Production environment ownership
   - Approved default: DS/platform owns production Supabase, Vercel, domain/DNS, secrets, and backup / restore.
   - Security approval: GitHub/Copilot/Codex Security.

6. External integration hold
   - Approved default: only the Luma event / RSVP / attendance / points loop may be rehearsed for the pilot path.
   - HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, AI, and any non-approved Luma behavior stay off.

7. Luma event loop
   - Approved default: event create/update, RSVP writeback, attendance import, points and leaderboard readback.
   - Required proof: audit/outbox evidence must show zero unauthorized sends.

8. Support / pause channel
   - Approved default: one dedicated launch Slack channel, with email backup, and the primary approver as pause authority.

9. Monitoring and incident response
   - Approved default: one named incident owner, one backup owner, one pilot alert channel, and the existing rollback path as the stop mechanism.

## Simple Reply Format

Reviewers can reply:

`approved as written`

Or replace only the fields they want to change.

## Launch Rule

Do not treat repo readiness as launch approval.
Do not enable live external sends or broad writes until these approvals are recorded and the hosted proof is visible.
