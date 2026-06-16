# Goal 24: Leader Assignment Browser Write Gate

Goal 24 makes the chapter-leader assignment creation path visible in the app
without enabling browser writes.

The candidate write is `action_assigned` on `/rush-month/actions`, backed by the
existing local Supabase function:

```sql
app.create_chapter_assignment(
  chapter_uuid,
  campaign_uuid,
  assignment_title,
  ...
)
```

This goal aligns the TypeScript write plan with the database function from Goal
18. It does not turn on browser save controls.

## Why This Exists

Rush Month starts with a leader assigning clear student work. The database
already has an audited local function for creating assignments, and RLS tests
prove direct assignment inserts are blocked. The app now shows the reviewer the
same activation gate pattern used for action starts.

The gate tells a reviewer:

- the current actor can or cannot create chapter assignments
- the actor is or is not allowed by the write plan
- the local database function exists
- RLS/security tests exist
- external writes remain disabled
- live auth is still missing
- browser write approval is still missing

## What Stays Disabled

- enabled browser save/create controls
- production Supabase
- live auth/browser sessions
- proof uploads
- public proof publishing
- HubSpot writes
- Luma writes
- n8n workflows
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

Even when `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`, the browser gate still
returns `canRenderEnabledControl: false`.

## Files

- `src/services/local-action-contracts.ts`
- `src/services/write-plan-matrix.ts`
- `src/services/write-readiness.ts`
- `src/services/browser-write-activation.ts`
- `src/components/browser-write-gate-notice.tsx`
- `tests/local-action-contracts.test.ts`
- `tests/write-plan-matrix.test.ts`
- `tests/browser-write-activation.test.ts`
- updated `/rush-month/actions`

## Next Approval Needed

Before a real leader assignment browser write is enabled, Nick/team should
explicitly approve:

1. local auth/session readiness
2. the first write route and actor scope
3. the exact validation and rollback behavior
4. the visible success/error states
5. confirmation that production and external writes remain disabled
