# Goal 37: Rush Month Local Operating Loop

Goal 37 adds a mock-safe interactive Rush Month operating loop.

This goal does not enable production Supabase, live auth, browser writes,
uploads, public proof publishing, n8n, HubSpot, Luma, warehouse, Power BI,
SMS/email, or AI writes.

## Why This Exists

The final MVP needs to prove the Rush Month loop end to end:

leader assigns action -> member starts action -> member submits proof ->
completion is reviewed -> points and KPIs update -> HQ records proof-sharing
posture -> coach records advance / hold / intervene.

Earlier goals defined write gates and result states. Goal 37 makes the loop
clickable in the app using deterministic browser-local state.

## Current Behavior

The new `/rush-month/loop` route lets a reviewer click through:

- assign action
- start action
- submit proof
- approve local completion
- record HQ sharing posture
- log coach decision

Each meaningful action appends structured local records:

- `IntegrationEvent`
- disabled `AutomationOutbox` when future automation would care
- `AuditLog`
- points and KPI updates where appropriate

## Product Boundary

Completion review and HQ proof sharing remain separate:

- completion review unlocks local points and KPI movement
- HQ proof-sharing posture decides whether proof may be reused later
- no public proof publishing happens

## Files

- `src/services/rush-month-local-loop.ts`
- `src/components/rush-month-local-loop-demo.tsx`
- `src/app/rush-month/loop/page.tsx`
- `tests/rush-month-local-loop.test.ts`
- `src/services/role-visibility.ts`

## Next Approval Needed

This local loop is review evidence, not write approval. A later goal should
still require Nick/team approval before any browser action writes to Supabase.
