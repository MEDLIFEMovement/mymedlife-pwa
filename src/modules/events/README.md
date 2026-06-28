# Events Module

## What This Owns
- Event discovery, event detail, RSVP posture, attendance state, and the event-to-points loop.
- Existing implementation lives in Rush Month event routes, chapter/staff panels, and event read-model services.

## What This Does Not Own
- Raw Luma API calls, external sends, or points ledger materialization internals.

## Routes
- `/rush-month/events`
- `/rush-month/events/[eventId]`
- `/leader?view=events`
- staff/admin event readback panels.

## Components And Services
- Event readiness panels, event detail panels, staging Luma event-loop panels, and event read models.

## Data Models
- Event plan, RSVP labels, attendance counts, proof bridge state, and leaderboard impact.

## Flags
- `events_luma_points` is the parent module flag.
- Events must continue to work when `sop_workflows_next_action`, `task_assignment`, or `ugc_feed_proof` are disabled.

## Permissions
- Members see their chapter events. Leaders see chapter attendance posture. Staff/admin see portfolio or organization posture.

## Integrations
- Reads Luma posture through the Luma module. External writes remain server-gated.

## Tests
- `tests/events-page.test.tsx`
- `tests/event-detail-page.test.tsx`
- `tests/rush-month-event-detail.test.ts`
- `tests/staging-luma-event-loop.test.ts`

## Safe Modification
- Keep event behavior in services/read models. Do not hide attendance or points logic inside a component branch.

## TODOs
- Move event-specific services and components into this module incrementally.
