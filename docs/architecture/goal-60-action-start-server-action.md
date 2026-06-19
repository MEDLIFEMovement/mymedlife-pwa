# Goal 60: Action-Start Server Action

Goal 60 adds the first local browser-to-Supabase write path for the Rush Month
MVP: starting an assigned action.

This is the first step from review-only UI toward the real end-to-end loop:

member signs in -> opens an assigned action -> starts the action -> Supabase
records assignment status, structured event, integration event, and audit log.

## What This Adds

- A local-only action-start write config.
- A server action for `/rush-month/actions/[assignmentId]`.
- A form panel that stays locked unless all local write prerequisites pass.
- Local auth/session checks before any RPC call.
- UUID validation so mock IDs like `member-push` never call Supabase.
- RPC mapping for `app.start_assignment_action(assignment_uuid)`.
- A stale-page safeguard so a changed assignment returns `stale_assignment`
  instead of writing outdated browser truth.
- Result-state redirects using the existing action-start result language.
- Tests for disabled-by-default behavior, env gating, auth requirement, UUID
  requirement, and RPC result mapping.

## Required Local Flags

Both flags must be true before the UI can submit the action-start server action:

```bash
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true
MYMEDLIFE_ENABLE_ACTION_START_WRITE=true
```

The app must also be using localhost Supabase Auth and a signed-in fake seed
user. Production URLs are still refused by the Supabase Auth config.

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

The local database function records an `integration_events` row with
`liveExternalWrite=false`. It does not create or send automation outbox rows for
action starts.

If a localhost drill needs repair, rollback remains local-only: reset the
assignment status and matching `action_started` event/audit rows, or rerun
`supabase db reset` to restore the full seed state.

## Next Step

Goal 61 should browser-test this against a running local Supabase stack with fake
seed users, then refresh the assignment detail route from local Supabase after a
successful start so the visible status changes from `not_started` to
`in_progress`.
