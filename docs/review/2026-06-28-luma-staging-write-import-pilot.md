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
   - To prove points, first check in one approved guest in Luma's host tools.
     The public Luma API returns `checked_in_at` on guest readback, but it does
     not expose a public attendee check-in write for myMEDLIFE to call directly.
7. Confirm `/admin/integration-outbox` still shows no n8n execution, no HubSpot
   write, and no production send posture.
8. Review the new "Event and points evidence" section on
   `/admin/luma-live-pilot`:
   - RSVP count
   - attendance count
   - points awarded
   - leaderboard posture
   - outbox sends
   - audit/outbox safety notes

## Validation run

- `pnpm vitest run tests/luma-live-pilot.test.ts tests/luma-calendar-readiness.test.ts tests/luma-event-loop-pilot.test.tsx tests/staging-luma-event-loop.test.ts`
- `pnpm vitest run tests/luma-live-pilot-page.test.tsx tests/luma-live-pilot.test.ts tests/staging-luma-event-loop.test.ts tests/luma-event-loop-pilot.test.tsx`
- `pnpm eslint src/services/luma-live-pilot.ts src/app/admin/luma-live-pilot/page.tsx src/app/admin/luma-live-pilot/actions.ts tests/luma-live-pilot.test.ts`
- `pnpm typecheck`
- `pnpm build`

## Hosted staging proof captured

Captured on `2026-06-29` with a signed-in DS Admin staging session.

- Hosted login succeeded for `ds.admin@mymedlife.test`.
- Event create/update succeeded:
  - latest event id: `evt-bJE178Q02N5DaLH`
- RSVP writeback succeeded for `nellis@medlifemovement.org`.
- Attendance import succeeded for the same event:
  - `1` approved guest row imported
  - `0` rows marked checked in on the first hosted import run
  - no secrets returned
- Official Luma API review confirmed the current pilot constraint:
  - public endpoints exist for event create/update, guest add, guest status
    update, and guest list readback with `checked_in_at`
  - no public attendee check-in write endpoint is currently documented
  - the live pilot therefore still depends on an approved human host-side Luma
    check-in before attendance import can produce points proof
- Durable app proof written in Supabase for `evt-bJE178Q02N5DaLH`:
  - `1` linked `luma_event_links` row
  - `1` linked `chapter_events` row
  - `3` `app.events` rows for the create, RSVP, and attendance-import sequence
  - `4` `app.integration_events` rows for the linked event flow
  - `3` disabled `app.automation_outbox` rows blocking downstream automation
  - `2` audit rows that mention the Luma event id in the before/after payload
- A later hosted reviewer replay on the same date reran attendance import after
  a real Luma host-side check-in:
  - `1` approved guest row imported
  - `1` row marked checked in
  - `/admin/luma-live-pilot` headline counters moved to:
    - `RSVPs 4`
    - `Attendance 2`
    - `Points 20`
    - `Leaderboard Updated`
    - `Outbox sends 0`
- Reviewer-visible readback is still in place for the broader loop:
  - member `/app` shows the event, RSVP, attendance, points, and leaderboard
    story
  - leader `/leader` shows the same event-to-points flow in leader review terms
  - staff `/staff?view=chapters` shows the event-and-points pulse
  - admin `/admin/luma-live-pilot`, `/admin/audit-log`, and
    `/admin/integration-outbox` show the hosted proof and safety posture
- The visible leaderboard surfaces now prefer durable Supabase-backed points rows
  when they exist, instead of always falling back to mock leaderboard data.
  That means the hosted checked-in attendee proof can now show up in
  reviewer-visible member and leader leaderboard UI.
- On `/admin/luma-live-pilot`, the headline counters are cumulative staging proof
  totals. The success banner is the authoritative latest event-specific result.

## What this still does not prove

- It does not yet prove the separate hosted `action_started` packet.
- It does not yet prove the proof metadata to leader-review packet.
- It does not yet provide the final clean route-capture bundle for member,
  leader, staff, admin, audit, and outbox review surfaces.
- It does not enable n8n, HubSpot, warehouse, Power BI, SMS/email, AI, or
  production Luma behavior.
