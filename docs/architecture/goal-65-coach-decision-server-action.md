# Goal 65: Coach Decision Server Action

## Purpose

Goal 65 adds the fifth local-only browser-to-Supabase write path: coaches, Admin,
or Super Admin can record an advance / hold / intervene decision from `/coach`
when local Supabase Auth, local Supabase reads, UUID-backed phase data, and
explicit local write flags are all enabled.

This completes the first local operating-loop write sequence:

leader assigns action -> member starts action -> proof/testimonial submitted ->
HQ records sharing decision -> coach records advance / hold / intervene.

## What Changed

- Added coach decision write readiness and RPC result mapping.
- Added a server action that calls `app.log_coach_decision(...)`.
- Added a coach decision form/readback panel on `/coach`.
- Updated the coach browser-write activation gate so it can become ready only
  under local auth plus explicit flags.
- Added environment safety coverage for `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE`.
- Added tests for role boundaries, validation, result mapping, readback, and
  parsing.

## Required Local Conditions

The browser control stays locked unless all of these are true:

- local Supabase reads are active
- local Supabase Auth is active
- the actor is signed in as a fake local Coach, Admin, or Super Admin
- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true`
- the current chapter, campaign, and phase are UUID-backed local Supabase rows
- the note is long enough for audit context
- an intervention decision includes a blocker summary

## Database Function

The server action uses the existing Goal 27 function:

```sql
app.log_coach_decision(...)
```

That function writes one transactional bundle:

- phase readiness update
- phase readiness review row
- internal `coach_decision_logged` event
- integration event row
- disabled automation outbox row
- audit log row

## Safety Boundary

This goal does not:

- connect production Supabase
- create production users
- enable broad browser writes
- send n8n escalation packets
- trigger HubSpot, Luma, warehouse, Power BI, SMS, email, or AI writes
- upload files
- publish proof

Escalation packets remain disabled. The outbox row is created only as future
automation posture.

## Files

- `src/app/coach/actions.ts`
- `src/app/coach/page.tsx`
- `src/components/coach-decision-server-action-panel.tsx`
- `src/services/coach-decision-write.ts`
- `src/services/browser-write-activation.ts`
- `src/services/environment-safety-summary.ts`
- `tests/coach-decision-write.test.ts`
- `tests/browser-write-activation.test.ts`
- `tests/environment-safety-summary.test.ts`

## Next Step

The next MVP slice should likely improve real local readback/seed coverage for
the full sequence or start tightening production/staging readiness, depending
on whether Nick wants another local write path or a reviewable pilot path next.
