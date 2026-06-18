# Goal 123: Evidence Submission Readiness Route

Goal 123 deepens `/rush-month/evidence` into a member-facing proof submission
readiness route.

## Route

- `/rush-month/evidence`

## What It Shows

- the next proof item for the selected local actor
- a submission queue for visible assignments
- Goal 152 story prompts, prep checklists, review lanes, proof-intake links, and
  disabled controls for each visible assignment
- Goal 158 proof submission packet for the recommended proof item
- whether each item is ready for proof, waiting for review, needs changes,
  approved internally, or not started
- the linked action detail route for the local-only proof metadata write gate
- future structured records for proof queue views, evidence submission, outbox,
  and audit logs
- blocked proof metadata saves, uploads, public proof publishing, direct
  points/KPI writes, reminders, warehouse exports, and AI summaries

## Safety Boundary

This route does not:

- save proof metadata
- upload files
- publish proof publicly
- write points or KPIs
- send reminders
- export proof to the warehouse or Power BI
- create AI summaries
- run HubSpot, Luma, n8n, SMS, email, or other external sends

The route can point reviewers to the existing action detail write gate, but the
actual browser write path still requires local Supabase Auth, explicit local
write flags, RLS coverage, audit evidence, and rollback approval.

## Why This Matters

Rush Month needs a clear student path from action completion to proof submission.
The app already had proof status and action detail controls; this slice makes
the evidence route itself answer what a member should submit next while keeping
all production proof, upload, publishing, and automation paths blocked.

## Implementation

- `src/app/rush-month/evidence/page.tsx`
- `src/services/evidence-submission-workspace.ts`
- `tests/evidence-submission-workspace.test.ts`

Related review surfaces now include `/rush-month/evidence` in the route smoke
manifest, stakeholder review plan, MVP coverage checklist, MVP progress map, and
release readiness summary.

## Goal 152 Extension

Goal 152 makes the evidence queue more useful for members and chapter operators
by surfacing the same proof handoff guidance used on action detail pages:

- story prompt
- prep checklist
- review lane
- proof-intake link
- disabled proof metadata, upload, publish, and external-send controls

This still does not save proof metadata, upload files, publish proof, or send
external automation.

## Goal 158 Extension

Goal 158 adds a proof submission packet for the recommended proof item. The
packet shows the future metadata payload, `app.submit_assignment_proof_metadata`
function target, current and future result states, readiness checks, structured
event, disabled outbox, audit action, and locked controls.

This still does not save proof metadata, upload files, publish proof, send
member reminders, or trigger external automation.
