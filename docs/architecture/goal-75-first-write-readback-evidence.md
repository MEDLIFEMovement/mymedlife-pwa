# Goal 75: First-Write Readback Evidence

## Purpose

Goal 75 makes the first-write activation drill easier to verify after staff run
it locally.

Goal 74 explained whether the first localhost-only `action_started` write was
blocked or ready. Goal 75 adds read-only evidence that shows what the app can
observe after the drill:

- assignment status readback
- internal `events` row
- `integration_events` row
- `audit_logs` row
- zero expected `automation_outbox` sends for action start

## What It Adds

- read-only local Supabase reads for:
  - `events`
  - `integration_events`
  - `automation_outbox`
  - `audit_logs`
- TypeScript persistence row types for local event and audit log rows
- Supabase-to-domain mapping for integration events and outbox rows
- post-drill readback evidence on `/admin/first-write`
- tests for the read model and first-write readback evidence states

## Safety Rules

- This does not enable production auth.
- This does not enable browser writes by default.
- This does not add a new write button.
- This does not upload proof or publish proof.
- This does not send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI
  writes.

## Why This Matters

The first MVP write should not be approved just because a button appears to
work. Staff need readback proof that the app saved the assignment status and
created the structured records future automation will consume. This keeps
myMEDLIFE/Supabase as the source of truth while keeping external automation
disabled.
