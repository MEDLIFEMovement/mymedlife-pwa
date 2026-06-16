# Goal 28: Write Activation Readiness Dashboard

Goal 28 consolidates the first browser-write gates into one reviewable admin
panel while keeping every write path disabled.

The dashboard lives on `/admin` for local staff/debug actors that already have
admin panels:

- Admin
- DS Admin
- Super Admin

It does not add a new permission system. It composes the existing gate functions
for:

- `action_started`
- `action_assigned`
- `evidence_submitted`
- `hq_sharing_decision`
- `coach_decision_logged`

## Why This Exists

Goals 23 through 27 made each candidate write path visible on the route where it
will eventually live. That is useful for route-level review, but Nick/team also
need one plain-English place to see the whole write-readiness picture.

This dashboard answers:

- which future writes exist
- which route each write belongs to
- which local database function backs it
- whether the selected actor is allowed by the write plan
- how many checks are ready
- which blockers still prevent browser saves

## What Stays Disabled

- browser save controls
- production Supabase
- live auth/browser sessions
- proof uploads and publishing
- HubSpot writes
- Luma writes
- n8n workflows or escalation packets
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

Even when `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`, every readiness item
still reports zero enabled controls.

## Files

- `src/services/write-activation-readiness.ts`
- `src/components/write-activation-readiness-panel.tsx`
- `src/app/admin/page.tsx`
- `tests/write-activation-readiness.test.ts`

## Next Approval Needed

Before any item on this dashboard can become an enabled browser control,
Nick/team should explicitly approve:

1. live auth/session readiness
2. the first write route to activate
3. actor scope and rollback behavior
4. visible success/error states
5. confirmation that external writes remain disabled
