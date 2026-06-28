# Luma Staging Write / Import Pilot

Date: 2026-06-28

## What this turns on

This pass adds a protected staging pilot panel at `/admin/luma-live-pilot`.

The panel can run three Luma operations from the myMEDLIFE server:

- create or update a Luma event
- write one RSVP guest back to Luma
- import approved Luma guests and check-in attendance state

These controls are DS Admin / Super Admin only. They require server-side Luma
configuration and explicit staging flags.

## Safety posture

- Luma API key stays server-only.
- Event updates use `suppress_notifications: true`.
- RSVP writes use `send_email: false`.
- Attendance import returns masked email hints and does not return check-in QR
  codes.
- Production Luma setup remains blocked.
- n8n execution remains blocked.
- HubSpot, warehouse, Power BI, SMS/email, and AI writes remain off.

## Required staging environment values

The staging Vercel Preview environment needs:

- `MYMEDLIFE_ENABLE_LUMA_WRITES=true`
- `MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES=true`
- `MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES=true`
- `MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT=true`
- `MYMEDLIFE_LUMA_ENVIRONMENT=staging`

Existing server-only values must also remain configured:

- `LUMA_API_KEY`
- `LUMA_CALENDAR_ID`

## Review path

1. Open `https://staging.mymedlife.org/admin/luma-live-pilot`.
2. Sign in as a DS Admin or Super Admin reviewer.
3. Confirm the page shows event writes, RSVP writes, and attendance import as
   `On`.
4. Create a staging event or update an existing Luma event id.
5. Copy the returned event id into the RSVP card and write one test RSVP.
6. Copy the same event id into the attendance card and import approved guests.
7. Confirm `/admin/integration-outbox` still shows no n8n execution, no HubSpot
   write, and no production send posture.

## Validation run

- `pnpm vitest run tests/luma-live-pilot.test.ts tests/luma-calendar-readiness.test.ts tests/luma-event-loop-pilot.test.tsx tests/staging-luma-event-loop.test.ts`
- `pnpm eslint src/services/luma-live-pilot.ts src/app/admin/luma-live-pilot/page.tsx src/app/admin/luma-live-pilot/actions.ts tests/luma-live-pilot.test.ts`
- `pnpm typecheck`
- `pnpm build`
