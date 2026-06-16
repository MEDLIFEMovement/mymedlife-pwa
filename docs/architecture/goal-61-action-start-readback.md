# Goal 61: Action-Start Readback Proof

Goal 61 makes the first local action-start browser write easier to verify
against real local Supabase seed data.

## What This Adds

- A stable Northview seed assignment for `member.a@mymedlife.test` that starts
  in `not_started`.
- A local readback message on `/rush-month/actions/[assignmentId]` after an
  action-start result.
- Tests for the readback helper so a successful start must be confirmed by the
  refreshed assignment status before the UI claims local Supabase readback.

## Local Test Assignment

Use this fake local assignment after running the local Supabase reset:

```text
50000000-0000-4000-8000-000000000003
```

Expected local flow:

1. Start local Supabase and reset seed data.
2. Enable local reads, local auth, and the action-start write flags.
3. Sign in as `member.a@mymedlife.test` with password `password`.
4. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
5. Start the action.
6. Confirm the refreshed page shows `in_progress` and the local readback
   success message.

## Safety Boundary

This goal does not enable:

- production Supabase
- production users
- assignment creation browser writes
- proof uploads or proof submission writes
- HQ proof-sharing writes
- coach decision writes
- public proof sharing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The new seed assignment is fake and local-only. It exists to prove the first
controlled write/readback loop before expanding to additional MVP writes.
