# Goal 69: Rush Month Event Readiness

## Purpose

Goal 69 adds a mock-safe Rush Month event, NPS, Luma, proof, and outbox
readiness surface. Action committees need to organize real moments on campus,
not just assignments in a list. This route makes the event loop visible without
creating Luma events, importing attendance, sending NPS reminders, or exporting
data.

## What It Adds

- `/rush-month/events`
- `getRushMonthEventReadinessWorkspace(actor)`
- role-aware event readiness panel
- Rush Month page links into the event readiness route
- route metadata, route registry, smoke manifest, stakeholder review, live-data
  plan, MVP checklist, and MVP progress updates
- tests for event/NPS/Luma readiness and DS Admin restriction

## Safety Rules

- No Luma event is created or updated.
- No Luma attendance or check-in import runs.
- No NPS reminder, email, or SMS is sent.
- No warehouse, Power BI, HubSpot, n8n, or AI export runs.
- No proof upload is enabled.
- DS Admin can inspect integration posture elsewhere, but does not read or own
  chapter event, attendance, NPS, or proof truth here.

## Future Events

When event integrations are approved later, the app should create structured
records such as:

- `luma_event_linked`
- `luma_attendance_import_mocked`
- `kpi_event_recorded`
- `evidence_submitted`
- `audit_log_recorded`

Future outbox rows should stay disabled until the team explicitly approves Luma
syncs, attendance imports, NPS reminders, warehouse exports, or coach summaries.

## Why This Matters

The Rush Month MVP should prove that chapters are doing things: socials, Med
Talks, local volunteering, invite pushes, feedback collection, and bridge-video
proof. This route makes that operating model reviewable before the team turns on
any real external automation.
