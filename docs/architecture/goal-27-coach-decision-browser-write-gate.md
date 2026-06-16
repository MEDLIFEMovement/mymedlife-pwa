# Goal 27: Coach Decision Browser Write Gate

Goal 27 makes the coach advance / hold / intervene decision path visible in the
app without enabling browser writes, live auth, or external automation.

The candidate write is `coach_decision_logged` on `/coach`, backed by the new
local Supabase function:

```sql
app.log_coach_decision(
  chapter_uuid,
  campaign_uuid,
  phase_uuid,
  decision_input,
  decision_note,
  blocker_summary_input
)
```

This goal aligns the app, TypeScript write plan, local SQL function, and RLS
tests around the future coach decision save path. It does not turn on browser
saves.

## Why This Exists

Coaches need a clear way to decide whether a chapter campaign phase should
advance, hold, or receive intervention. That decision changes chapter readiness
truth, so it should not be owned by chapter leaders or DS Admin.

The local function keeps the write boundary explicit:

- portfolio coaches can log decisions for chapters they actively coach
- Admin and Super Admin can log decisions for support/oversight
- DS Admin cannot own student, chapter, or coach decision truth
- chapter leaders cannot self-validate coach decisions
- `intervene` requires a blocker summary
- every decision records event, integration, disabled outbox, and audit intent

## What The Browser Gate Shows

The `/coach` page now shows a preview of the future decision write and the
activation gate before any enabled control appears.

The gate tells a reviewer:

- the current actor can or cannot log coach decisions
- the actor is or is not allowed by the write plan
- the local database function exists
- RLS/security tests exist
- external writes remain disabled
- live auth is still missing
- browser write approval is still missing

## What Stays Disabled

- enabled browser save/decision controls
- production Supabase
- live auth/browser sessions
- real coach decision writes from the UI
- HubSpot writes
- Luma writes
- n8n escalation packets
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

Even when `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`, the browser gate still
returns `canRenderEnabledControl: false`.

## Files

- `supabase/migrations/20260616120000_goal_27_coach_decision.sql`
- `supabase/tests/database/rls_goal_27.test.sql`
- `src/services/local-action-contracts.ts`
- `src/services/write-readiness.ts`
- `src/services/write-plan-matrix.ts`
- `src/services/browser-write-activation.ts`
- `src/app/coach/page.tsx`
- `tests/local-action-contracts.test.ts`
- `tests/write-readiness.test.ts`
- `tests/write-plan-matrix.test.ts`
- `tests/browser-write-activation.test.ts`

## Next Approval Needed

Before a real coach decision browser write is enabled, Nick/team should
explicitly approve:

1. local auth/session readiness
2. the coach decision route and actor scope
3. validation for advance, hold, and intervene
4. success/error states and rollback behavior
5. confirmation that n8n escalation packets stay disabled until approved
