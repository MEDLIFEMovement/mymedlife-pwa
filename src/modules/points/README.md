# Points Module

## What This Owns
- Points summaries, chapter and organization leaderboards, KPI posture, and point impact messaging.
- Existing implementation lives in points/KPI services and member/leader/staff leaderboard panels.

## What This Does Not Own
- Event attendance import, proof review decisions, or external analytics exports.

## Routes
- `/rush-month/leaderboard`
- `/leader?view=leaderboard`
- staff/admin organization leaderboard panels.

## Components And Services
- Points recognition panels, leaderboard read models, and KPI ledger services.

## Data Models
- Point rows, KPI signals, leaderboard rank movement, chapter totals, and organization totals.

## Flags
- `events_luma_points` owns the visible points loop.
- `staff_analytics_reporting` owns broader staff analytics.

## Permissions
- Members see their points and chapter rank. Leaders see chapter totals. Staff/admin see portfolio and organization-wide views.

## Integrations
- Warehouse and Power BI exports stay disabled until approved.

## Tests
- `tests/points-kpi-ledger.test.ts`
- `tests/leaderboard-page.test.tsx`
- `tests/member-points-recognition-panel.test.ts`

## Safe Modification
- Keep point calculations in services and require audit/readback before live materialization.

## TODOs
- Move point/KPI service files into this module once stable.
