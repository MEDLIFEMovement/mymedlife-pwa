# Staff Analytics Module

## What This Owns
- Staff command center analytics, chapter health, organization leaderboard, feed analytics, and portfolio reporting posture.

## What This Does Not Own
- Warehouse exports, Power BI publishing, or external CRM writes.

## Routes
- `/staff?view=chapters`
- `/staff?view=feed_analytics`
- `/staff?view=admin`
- admin analytics/readback panels.

## Components And Services
- Staff command center panel, portfolio toolbar, analytics cards, and organization-level read models.

## Data Models
- Chapter health score, risk/decision pills, KPI summaries, feed analytics, RSVP conversion, and attendance trend rows.

## Flags
- `staff_analytics_reporting`

## Permissions
- Coaches see assigned portfolio. Staff/admin see broader authorized scopes.

## Integrations
- BigQuery and Power BI are provider flags and remain disabled until approved.

## Tests
- `tests/staff-command-center.test.ts`
- `tests/staff-page.test.tsx`
- `tests/staff-portfolio-readiness.test.ts`

## Safe Modification
- Keep analytics derivations in services and make external exports replayable/auditable later.

## TODOs
- Move staff analytics services into this module.
