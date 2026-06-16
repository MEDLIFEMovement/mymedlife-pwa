# Goal 22: Rush Month Role-Aware Dashboard

Goal 22 adds a role-aware Rush Month operating dashboard and aligns the campaign
catalog with the exact starter campaign shells required by the final MVP goal.

This goal is still local/read-only. It does not enable live auth, browser save
controls, production Supabase, proof uploads, public proof sharing, or external
automation.

## What Goal 22 Adds

1. `/rush-month/dashboard` as the role-aware operating dashboard.
2. A pure dashboard service that prepares role-specific next steps, metrics,
   assignments, events, proof, leaderboard rows, alerts, risk signals, and
   integration posture.
3. A friendly mock Rush Month leaderboard.
4. Member view: next action, points, leaderboard, events, and proof prompts.
5. Leader view: team assignments, proof follow-up, event movement, and
   committee watchouts.
6. Coach view: decision state, risks, KPI posture, and coach readout next step.
7. Admin view: HQ proof-sharing posture without integration ownership.
8. DS Admin view: integration/outbox posture only, with chapter truth hidden.
9. Super Admin view: full local oversight for permission review.
10. Required starter campaign shells:
    - Planning / Goal Setting
    - Chapter Engagement
    - SLT Promotion
    - Moving Mountains
    - Leadership Transition
    - Grow the Movement
    - Start a Chapter

## Role Boundaries

- General members can see their simple week, own visible assignment, events,
  points, and friendly leaderboard.
- Chapter leaders can see team actions, proof follow-up, event plans, and
  committee watchouts.
- Coaches can see campaign health, decision state, visible risks, and KPI
  posture.
- Admins can read HQ support and proof-sharing posture.
- DS Admin can inspect disabled/mock integration posture only.
- Super Admin can inspect the full local surface.

## Mock-Safe Boundaries

Still disabled:

- production Supabase
- browser writes
- live auth sessions
- proof uploads
- public proof publishing
- HubSpot writes
- Luma writes
- n8n workflows
- warehouse or Power BI exports
- SMS/email sends
- AI summaries

## Files

- `src/app/rush-month/dashboard/page.tsx`
- `src/services/rush-month-dashboard-service.ts`
- `src/shared/types/rush-month-dashboard.ts`
- `src/data/mock-leaderboard.ts`
- `tests/rush-month-dashboard-service.test.ts`
- expanded `src/data/mock-campaigns.ts`
- updated `src/services/role-visibility.ts`

## Next Questions

- Which dashboard card should become the first real browser write after live
  auth is approved?
- Should leader assignment creation move from local database function to
  browser UI first, or should proof submission move first?
- Which fields are required before real event attendance/NPS import is wired?
