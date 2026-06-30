# Luma Module

## What This Owns
- Server-only Luma calendar reads, staging event create/update, RSVP writeback, and attendance import gates.
- Existing implementation lives in `src/services/luma-calendar-readiness.ts`, `src/services/luma-live-pilot.ts`, and `/admin/luma-live-pilot`.

## What This Does Not Own
- n8n execution, reminders, HubSpot sync, warehouse exports, production Luma setup, or browser-readable secrets.

## Routes
- `/admin/luma-live-pilot`
- Readback panels appear in member, leader, staff, and admin surfaces.

## Components And Services
- Luma readiness snapshot service.
- Luma live pilot service and admin server actions.
- Luma event-loop readback panel.

## Data Models
- Safe Luma event readback, live pilot gate, event upsert input, RSVP input, and attendance import rows.

## Flags
- `integration_luma` is the provider flag.
- Disabled Luma must return fallback before calling `fetch`.

## Permissions
- Staging controls are DS/Super Admin only.

## Integrations
- Luma Public API through server-only environment variables.

## Tests
- `tests/luma-calendar-readiness.test.ts`
- `tests/luma-live-pilot.test.ts`
- `tests/luma-event-loop-pilot.test.tsx`
- `tests/feature-flags-theme-services.test.ts`

## Safe Modification
- Never expose `LUMA_API_KEY` to the browser, UI, logs, snapshots, or action responses.
- Keep production Luma disabled unless explicitly approved.

## TODOs
- Move Luma services into this module after PR review.
