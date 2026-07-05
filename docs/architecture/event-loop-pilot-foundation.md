# Event Loop Pilot Foundation

This pass narrows myMEDLIFE around the first launch value loop:

1. a chapter has a Luma-backed event
2. a member RSVPs
3. a leader records attendance
4. attendance awards local points
5. chapter and organization leaderboards update

The proof is intentionally small and readable. It uses five staging/mock pilot chapters:

- UCLA MEDLIFE
- Lakeside MEDLIFE
- Boston College MEDLIFE
- UC San Diego MEDLIFE
- McGill MEDLIFE

## What Is Wired

- Member route: `/app/events`
- Leader route: `/leader?view=events`
- Staff route: `/staff?view=events`
- Admin Luma route: `/admin/integrations/luma`
- Admin outbox route: `/admin/integration-outbox`
- Admin audit route: `/admin/audit-log`

The shared read model lives in `src/services/event-loop-pilot-foundation.ts`.
It reads the same chapter, event, RSVP, attendance, points, audit, and outbox
rows already used by the role surfaces.

## Safety Posture

- Luma links are mock/staging readback only.
- Luma external sends remain disabled.
- HubSpot, n8n, warehouse, Power BI, SMS/email, AI, and production Luma sends remain blocked.
- Raw Luma secrets are not exposed to browser data, logs, test snapshots, or route models.
- Disabled outbox rows and audit rows are present so reviewers can see what would have happened.

## Done For This Slice

- Five chapters have event rows.
- Five chapters have Luma/mock link rows.
- Five chapters have RSVP evidence.
- Five chapters have attendance evidence.
- Five chapters have local attendance-backed points.
- Organization leaderboard totals reflect the chapter points.
- Admin status can see Luma posture, disabled outbox rows, and audit evidence.

This is not a production rollout by itself. It is the clean pilot foundation for
turning on a very small hosted event loop after the normal approval gates.
