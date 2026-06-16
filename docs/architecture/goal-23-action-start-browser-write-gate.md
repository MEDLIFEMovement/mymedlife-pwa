# Goal 23: Action Start Browser Write Gate

Goal 23 prepares the first browser-facing local write path without enabling it.

The first candidate write is `action_started` on
`/rush-month/actions/[assignmentId]`, backed by the existing local Supabase
function:

```sql
app.start_assignment_action(assignment_uuid uuid)
```

This goal makes the activation conditions visible in the app and testable in
TypeScript. It does not turn on browser writes.

## Why This Exists

The database already has an audited local function for starting an assignment,
and RLS tests prove direct table updates are blocked. The browser UI still needs
a safe gate before an enabled control appears.

The gate tells a reviewer:

- the current actor can or cannot read the assignment
- the actor is or is not allowed by the write plan
- the local database function exists
- RLS/security tests exist
- external writes remain disabled
- live auth is still missing
- browser write approval is still missing

## What Stays Disabled

- enabled browser save/start controls
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

- `src/services/browser-write-activation.ts`
- `src/components/browser-write-gate-notice.tsx`
- `tests/browser-write-activation.test.ts`
- updated `/rush-month/actions/[assignmentId]`
- updated live-data route plan/tests

## Next Approval Needed

Before a real browser write is enabled, Nick/team should explicitly approve:

1. local auth/session readiness
2. the first write route and actor scope
3. the exact rollback behavior
4. the visible success/error states
5. confirmation that production and external writes remain disabled
