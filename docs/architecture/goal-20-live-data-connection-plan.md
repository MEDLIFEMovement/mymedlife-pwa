# Goal 20 Live Data Connection Plan

Status: planning and disabled readiness only.

Goal 20 defines how myMEDLIFE should move from mock data to local Supabase and
eventually a controlled pilot without a risky big-bang cutover.

## Phases

1. Mock data remains default.
2. Local read-only Supabase previews.
3. Local audited database functions.
4. Auth-gated local browser flows.
5. Production readiness review.
6. Controlled pilot.

Production Supabase, browser writes, and external writes remain disabled in
this goal.

## Route Order

Start with low-risk read-only routes:

- `/chapter`
- `/campaigns`
- `/campaigns/[campaignSlug]`
- `/action-committees`
- `/rush-month`
- `/rush-month/dashboard`
- `/rush-month/actions`
- `/proof-library`

Then connect function-only write routes:

- `/rush-month/actions/[assignmentId]`
- `/rush-month/evidence`
- `/rush-month/review`

Keep coach and admin routes read-only until auth, onboarding, and staff
boundaries are stable:

- `/coach`
- `/admin`

## Rules

- Keep mock fallback working.
- Connect one route at a time.
- Prefer read-only first.
- Use audited database functions for writes.
- Keep uploads disabled until the storage goal is approved.
- Keep public proof publishing disabled.
- Keep real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes
  disabled.
- Require RLS tests before enabling each browser write.

## What This Adds

- `src/services/live-data-connection-plan.ts`
- `tests/live-data-connection-plan.test.ts`

The tests prove production Supabase, browser writes, and external writes remain
disabled while the migration order is documented.
