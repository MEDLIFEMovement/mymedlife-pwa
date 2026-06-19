# Goal 161: Membership Approval Result States

## Purpose

Goal 161 defines the plain-English result states for the future membership
approval write before any membership approval control is enabled. Goal 160 made
the approval packet visible on `/chapter/members`; Goal 161 explains what the
browser and server result should look like when that packet eventually becomes
a guarded local write path.

## What It Adds

- `src/services/membership-approval-result-states.ts`
- `tests/membership-approval-result-states.test.ts`
- membership approval coverage in `getWriteResultStateCoverageSummary()`
- a result preview inside the `/chapter/members` membership approval packet

The result-state family covers:

- `membership_approved`
- `write_disabled`
- `welcome_disabled`
- `crm_sync_disabled`
- `duplicate_membership`
- `permission_denied`
- `missing_auth`
- `join_request_not_found`
- `profile_not_ready`
- `role_assignment_invalid`
- `audit_reason_required`
- `server_error`

## Safety Boundary

This goal does not enable:

- production auth
- join request approval writes
- membership-row writes
- chapter role assignment writes
- committee lane changes
- member deactivation
- welcome email or SMS sends
- HubSpot, n8n, warehouse, Power BI, Luma, or AI writes

Result-state coverage is not write approval. Goal 162 now adds the readiness
packet for that later write path, but the server action, RPC, RLS tests, audit
readback, rollback path, and localhost-only activation flags still remain future
implementation work.

## Review Path

1. Open `/chapter/members` as `leader.a@mymedlife.test`.
2. Confirm the Goal 160 packet still shows the current disabled state and future
   `membership_approved` state.
3. Open `/admin` or the write-result coverage panel and confirm
   `membership_approved` is counted as a covered result-state family.
4. Review the Goal 162 write-readiness packet on the same route.
5. Keep membership writes blocked until production auth, RLS, audit readback,
   rollback, and welcome/CRM-disabled behavior are approved.
