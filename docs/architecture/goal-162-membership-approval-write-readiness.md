# Goal 162: Membership Approval Write Readiness

## Purpose

Goal 162 turns the future membership approval save into a first-class guarded
write candidate before any SQL function, server action, browser control, welcome
message, CRM sync, or production auth path is enabled.

Goal 160 made the approval packet visible on `/chapter/members`. Goal 161 added
the result states. Goal 162 adds the readiness checklist that explains what must
exist before `app.approve_chapter_membership` can be implemented or tested.

## What It Adds

- `src/services/membership-approval-write-readiness.ts`
- `tests/membership-approval-write-readiness.test.ts`
- Goal 162 readiness inside the `/chapter/members` membership packet
- `membership_approved` as a write-plan operation
- `membership_approved` in the browser-write readiness summary
- `membership_approved` in the write sequence and staff dry-run rehearsal

The readiness packet names:

- future function: `app.approve_chapter_membership`
- target route: `/chapter/members`
- future tables: `memberships`, `events`, `integration_events`,
  `automation_outbox`, and `audit_logs`
- required local flags:
  `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true` and
  `MYMEDLIFE_ENABLE_MEMBERSHIP_APPROVAL_WRITE=true`
- required RLS tests for leader/admin approval, blocked member/coach/DS Admin
  approval, duplicate prevention, disabled outbox, and audit logging
- blocked checks for the missing SQL function and missing RLS test
- disabled welcome message and CRM sync posture

## Safety Boundary

This goal does not enable:

- production Supabase
- production auth
- local membership approval writes
- SQL migration or RPC implementation
- server action implementation
- browser approval controls
- membership-row writes
- chapter role escalation
- committee lane changes
- member deactivation
- welcome email or SMS sends
- HubSpot, n8n, warehouse, Power BI, Luma, or AI writes

Even if the local write env flags are requested, Goal 162 keeps
`canSubmit=false` because the database function and RLS tests are intentionally
not implemented yet.

## Review Path

1. Open `/chapter/members` as `leader.a@mymedlife.test`.
2. Confirm the membership packet shows `Goal 162 membership approval write
   readiness`.
3. Confirm the readiness checks show the database function and RLS tests are
   still blocked.
4. Open `/admin/write-sequence` or `/admin/staff-dry-run` and confirm
   `membership_approved` appears as the seventh guarded write candidate.
5. Keep membership writes blocked until production auth, chapter-scoped RLS,
   duplicate prevention, rollback, audit readback, and disabled welcome/CRM
   behavior are approved.

## Next Step

A later write goal can implement `app.approve_chapter_membership` with a narrow
database function, pgTAP-style RLS/security tests, a local server action, audit
readback, rollback notes, and localhost-only activation flags. That later goal
must still keep welcome messages, CRM syncs, and external sends disabled unless
Nick explicitly approves them.
