# Goal 13 Local Write Implementation Plan

Planning status: local-only, disabled, and not connected to production.

Goal 13 does not enable Supabase writes, live auth, file uploads, public proof
sharing, or external integrations. It turns the Goal 12 write-readiness airlock
into a reviewable implementation plan and a small TypeScript test matrix.

## Model Note

Recommended model before implementation: GPT-5.5 Thinking or the strongest
available reasoning model.

Reason: the next implementation step will affect browser write permissions,
Supabase RLS, audit logging, proof-sharing boundaries, and integration safety.

## Objective

Prepare the first local Supabase write implementation path without activating
it. The app should still run end-to-end with mock data and read-only local
Supabase previews, but the team should now be able to review:

- which write operations come first
- which tables each write would touch
- which roles can perform each write
- which roles must be blocked
- which RLS tests are required before any write is turned on
- which outbox rows stay disabled until later approval

The matching executable matrix lives in
`src/services/write-plan-matrix.ts`.

## Non-Goals

- Do not enable `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES` to save data.
- Do not connect production Supabase.
- Do not add live browser sign-in, sessions, or cookies.
- Do not upload proof files to storage.
- Do not publish proof publicly.
- Do not send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes.
- Do not add a custom data-access framework.

## First Write Operations

### `action_started`

Plain English: a permitted actor starts a visible assigned action.

Future tables:

- `assignments`
- `integration_events`
- `audit_logs`

Transaction boundary:

1. Update one assignment status to `in_progress` when allowed.
2. Record one structured internal event.
3. Record one audit log entry.
4. Roll back all three steps if any step fails.

Routine allowed actors:

- General Member for their own visible assignment
- Chapter Leader for chapter-scoped visible work
- Coach for coach-owned portfolio work
- Super Admin only as an audited break-glass path

Blocked actors:

- Admin for routine student truth ownership
- DS Admin for all student truth ownership

### `evidence_submitted`

Plain English: a student or chapter operator submits a testimonial, bridge
video, photo, link, or recap for HQ review.

Future tables:

- `assignments`
- `evidence_items`
- `integration_events`
- `automation_outbox`
- `audit_logs`

Transaction boundary:

1. Update the assignment status to `submitted`.
2. Create one evidence/proof metadata row.
3. Record one structured internal event.
4. Create one disabled outbox row for future HQ or automation follow-up.
5. Record one audit log entry.
6. Roll back all five steps if any step fails.

Allowed actors:

- General Member for their own visible assignment
- Chapter Leader for visible chapter-scoped work

Blocked actors:

- Coach
- Admin
- DS Admin
- Super Admin

Reason: proof is student or chapter-generated testimonial material. MEDLIFE HQ
decides whether to share it later, but HQ should not silently become the
student proof submitter in the normal product flow.

### `hq_sharing_decision`

Plain English: MEDLIFE HQ decides whether submitted proof should be shared more
broadly with other chapters or universities.

Future tables:

- `evidence_items`
- `approvals`
- `integration_events`
- `automation_outbox`
- `audit_logs`

Transaction boundary:

1. Update the evidence sharing/review status.
2. Create one HQ approval decision row.
3. Record one structured internal event.
4. Create one disabled outbox row for future warehouse or sharing workflow.
5. Record one audit log entry.
6. Roll back all five steps if any step fails.

Allowed actors:

- Admin
- Super Admin

Blocked actors:

- General Member
- Chapter Leader
- Coach
- DS Admin

Reason: chapter leaders can help collect proof and coaches can read portfolio
signals, but MEDLIFE headquarters owns the broad proof-sharing decision.

## Event And Outbox Rules

Every meaningful write should create a structured internal event.

Outbox rows may be created only as disabled or recorded local rows until Nick
approves real external sends. A disabled outbox row means "something external
could happen later," not "something was sent."

Rules for later implementation:

- `integration_events.status` must stay `recorded`, `mocked`, or `disabled`.
- `automation_outbox.status` must stay `recorded`, `mocked`, or `disabled`.
- No browser role may mark an outbox row as sent.
- DS Admin can inspect and later manage integration posture, but cannot own
  student truth, proof submission, or HQ sharing decisions.
- Service-role usage must remain server/test-only.

## RLS Test Matrix

Before any local write path is enabled, add Supabase tests for these cases:

- Member can start only their own visible assignment.
- Member cannot start another chapter's assignment.
- Chapter Leader can start visible chapter-scoped assignment work.
- Chapter Leader cannot cross chapter boundaries.
- Coach can start only coach-owned portfolio work, not student work outside
  their portfolio.
- Admin cannot start routine student truth assignments.
- DS Admin cannot start assignments.
- Action start creates an audit log.
- Member can submit proof for their own visible assignment.
- Chapter Leader can submit proof for visible chapter work.
- Coach cannot submit proof.
- Admin cannot submit proof as student truth.
- DS Admin cannot submit proof.
- Super Admin cannot use the normal proof submission path.
- Proof submission creates a disabled outbox row.
- Chapter Leader cannot approve proof for broad sharing.
- Coach cannot record an HQ sharing decision.
- DS Admin cannot record an HQ sharing decision.
- Admin can record an HQ sharing decision.
- Super Admin can record an HQ sharing decision.
- HQ sharing decision creates a disabled outbox row.
- No role can set an outbox row to a real sent/approved-for-live-send state.

## Implementation Order For A Later Goal

1. Add database functions or tightly scoped server actions for each operation.
2. Add RLS tests before wiring UI controls.
3. Implement `action_started` locally first because it has the smallest table
   footprint.
4. Implement `evidence_submitted` locally second with metadata only, no file
   storage upload.
5. Implement `hq_sharing_decision` locally third with disabled outbox rows.
6. Add browser UI controls only after local Supabase tests pass.
7. Keep production auth and external integrations disabled until a separate
   approval goal.

## Known Mismatches To Watch

- Current local mock contracts allow some read-capable actors to preview action
  starts. The future write path should be stricter and test ownership.
- Current proof previews do not upload files. The first write implementation
  should still save metadata only.
- Current outbox rows are illustrative. Later outbox work needs idempotency,
  retries, and failure handling, but not before the Rush Month operating loop is
  stable.

## Rollback And Safety Checklist

- Keep `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false` by default.
- Keep code disabled even if the env var is accidentally set to `true` until a
  later approved goal changes that behavior.
- Keep all seed users obviously fake.
- Keep all new writes local-only until production auth is approved.
- Keep all external destinations disabled.
- Run app checks and Supabase RLS tests before merging any implementation PR.

## Open Questions For Goal 14

- Should the first implementation use server actions, API routes, or a small
  server-only service layer?
- Should `action_started` be allowed for chapter leaders on behalf of assigned
  members, or only for the assigned actor?
- Should Super Admin have a normal browser write path or only a separate
  audited break-glass/service path?
- What minimum proof metadata is required before file upload/storage is added?
- Which local Supabase test should become the permanent smoke test for write
  safety in GitHub CI?
