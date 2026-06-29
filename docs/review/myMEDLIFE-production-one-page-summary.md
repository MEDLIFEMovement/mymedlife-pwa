# myMEDLIFE Production - One Page Summary

Date: 2026-06-29

## Plain English

myMEDLIFE is in a good staging review state, but it is **not ready for live
launch yet**.

The app works as a role-based product, the hosted staging evidence now exists,
and the launch-readiness docs are in place. What is still missing is external
acceptance of that staging proof plus the production environment setup that
makes a small live pilot safe.

## What Is Ready

- Member, leader, staff, admin, and SLT Prep surfaces exist.
- Launch-readiness review pages exist.
- Tests, lint, and build are green.
- Hosted staging already proves the first hosted write, the proof metadata
  chain, the approved Luma event loop, and role-routed review readback.
- A fresh hosted auth recheck on 2026-06-29 also reconfirmed that the DS-admin
  reviewer path sets the app session cookie and flips the control routes into
  their Supabase-backed review state.
- Live external sends and broad writes remain off by default, except for the
  separately gated Luma event-loop staging proof.

## What Still Needs a Yes

1. Accept the current staging evidence packet as the official reviewer record.
2. Finish the production environment packet:
   - production Supabase rollout owner
   - production Vercel target and env vars
   - auth callback URLs
   - DNS / domain plan
   - backup / restore path
   - support / rollback ownership
3. Keep the live pilot tiny:
   - one chapter
   - 5-15 users
   - Luma/event/RSVP/attendance/points loop only
   - no HubSpot, n8n, warehouse, Power BI, SMS/email, or AI writes

## What Has Been Approved

1. Staging reviewer access path: `staging.mymedlife.org` behind Vercel SSO
2. Pilot scope: one chapter only, small and controlled
3. First hosted write: `action_started`
4. Smallest proof / review loop: metadata submit -> leader review -> audit trail
5. Production environment ownership: DS/platform with GitHub/Copilot/Codex Security on security approval
6. Luma event loop: event create/update, RSVP writeback, attendance import, points and leaderboard readback, with audit/outbox proof
7. External integration hold: HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, AI, and non-approved Luma behavior stay off
8. Support / pause channel: one dedicated launch Slack channel, with email backup, and the primary approver as pause authority
9. Monitoring and incident response: one named incident owner, one backup owner, one pilot alert channel, and the existing rollback path as the stop mechanism

## What To Say Back

Reviewers can reply:

`approved as written`

Or replace only the fields they want to change.

For a ready-to-send version of that message, see
[myMEDLIFE-production-approval-email-draft.md](./myMEDLIFE-production-approval-email-draft.md).

For the next step after they reply, see
[myMEDLIFE-production-next-steps-after-reply.md](./myMEDLIFE-production-next-steps-after-reply.md).

For the current staging reviewer path as observed in the browser, see
[myMEDLIFE-staging-reviewer-access-guide.md](./myMEDLIFE-staging-reviewer-access-guide.md).

For a one-screen view of all remaining launch decisions, see
[myMEDLIFE-production-decision-tracker.md](./myMEDLIFE-production-decision-tracker.md).

For a copy/paste reply block, see
[myMEDLIFE-production-reply-template.md](./myMEDLIFE-production-reply-template.md).

The current packet defaults have been approved by the primary approver. The
launch still depends on production-foundation setup and external acceptance of
the hosted proof before it can be treated as live-ready.

The current reviewer has confirmed they are the pilot owner and rollback owner,
so that part of the packet is no longer ambiguous.

## Bottom Line

This is a **review packet**, not a launch approval.
Do not enable broad writes, external sends, or any non-approved Luma behavior
until the approvals above are recorded, the staging proof is accepted, and the
production environment packet is complete.
