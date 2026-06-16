# Goal 64: Leader Assignment Server Action

## Purpose

Goal 64 adds the fourth local-only browser-to-Supabase write path:
chapter leaders can create a Rush Month assignment from `/rush-month/actions`
when local Supabase Auth, local Supabase reads, and explicit local write flags
are all enabled.

This moves the MVP operating loop closer to:

leader assigns action -> member starts action -> proof/testimonial submitted ->
HQ reviews sharing posture -> coach sees readiness.

## What Changed

- Added a local assignment-create write readiness service.
- Added a server action that calls `app.create_chapter_assignment(...)`.
- Added a leader-facing assignment creation panel on `/rush-month/actions`.
- Updated the browser-write activation gate so assignment creation can become
  ready only under local auth plus explicit flags.
- Added environment safety coverage for
  `MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE`.
- Added tests for readiness, role boundaries, validation, RPC result mapping,
  and readback.

## Required Local Conditions

The browser control stays locked unless all of these are true:

- local Supabase reads are active
- local Supabase Auth is active
- the actor is signed in as a fake local chapter leader or Super Admin
- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true`
- the current chapter and campaign are UUID-backed local Supabase rows
- the assignment title, instructions, proof requirement, KPI, role, and points
  pass validation

## Database Function

The server action uses the existing Goal 18 function:

```sql
app.create_chapter_assignment(...)
```

That function writes one transactional bundle:

- assignment row
- internal `action_assigned` event
- integration event row
- disabled automation outbox row
- audit log row

If any step fails, the database transaction rolls back.

## Safety Boundary

This goal does not:

- connect production Supabase
- create production users
- enable broad browser writes
- send reminders
- trigger n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, or AI writes
- upload files
- publish proof

Reminder automation remains disabled. The outbox row is created only as a
future automation handoff record.

## Files

- `src/app/rush-month/actions/actions.ts`
- `src/app/rush-month/actions/page.tsx`
- `src/components/leader-assignment-server-action-panel.tsx`
- `src/services/assignment-create-write.ts`
- `src/services/browser-write-activation.ts`
- `src/services/environment-safety-summary.ts`
- `tests/assignment-create-write.test.ts`
- `tests/browser-write-activation.test.ts`
- `tests/environment-safety-summary.test.ts`

## Next Step

The next operating-loop write slice should likely wire the coach decision server
action on `/coach`, because the local database function and RLS tests already
exist and it completes the advance / hold / intervene part of the MVP loop.
