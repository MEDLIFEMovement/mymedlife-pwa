# Narrow Launch Event Loop Gap Sequence

Date: 2026-07-08
Owner lane: `#5` MVP Story + Production Planning, docs/spec only

## Purpose

Turn the event-loop truth map into a practical build and proof sequence. This is
the shortest safe path from current repo truth to a narrow launch event loop
that can be reviewed without confusing preview shells with rollout evidence.

Companion doc:

- `docs/user-stories/narrow-launch-event-loop-truth.md`

## Shortest Safe Sequence

### Step 1 - Finish Current Shell Queues

Owner: `#1`, `#2`, `#3`, watched by `#4`

Current queue context:

- `#1`: let `#523/#536` settle before assigning another member event-loop slice.
- `#2`: let `#545/#547` settle before assigning another leader event-loop slice.
- `#3`: let `#522/#521/#534/#538/#550` settle before assigning another
  Staff/Admin event-loop slice.

Why first:

- Avoid overlapping shell files while the current wave is still maturing.
- Keep event-loop cleanup from colliding with active source-fidelity work.

Matrix effect:

- Possible `Scope/UI` and `QA/Ops` only after implementation and checks.
- No rollout movement.

### Step 2 - Member Event Detail To Points Continuity

Owner: `#1`

Goal:

- Make `/app/events` -> `/app/events/[eventId]` -> RSVP preview -> check-in
  preview -> points impact -> `/app/points` feel like one clean member path.

Acceptance:

- Source/return links preserve home/events/profile/points context.
- RSVP, check-in, and points steps are route-backed.
- Copy clearly says preview-only when no live write exists.
- Visible fake event/member/chapter/points content remains `TEST` labeled.
- No button implies Luma writeback, QR write, attendance import, or points award
  authority.

Proof tier:

- Local route/component/browser proof only.
- Not production signed-in proof.
- Not rollout proof.

### Step 3 - Leader Event / Attendance / Leaderboard Review Continuity

Owner: `#2`

Goal:

- Keep `/leader?view=events`, `/leader?view=attendance`, and
  `/leader?view=leaderboard` coherent as readback surfaces for the same
  launch-lane event loop.

Acceptance:

- Event selection and return paths remain route/query-backed.
- Attendance readback does not imply import authority.
- Leaderboard readback does not imply points award authority.
- Fake leader/member/chapter/event/points rows remain `TEST` labeled.

Proof tier:

- Local shell/readback proof only.
- Not production leader role proof.
- Not attendance or points authority.

### Step 4 - Staff/Admin Event Loop Review Coherence

Owner: `#3`

Goal:

- Keep staff chapter rows, event readbacks, org leaderboard rows, embedded
  Admin handoffs, Luma status, and launch-gate review copy coherent.

Acceptance:

- Staff can see chapter/event/points posture without entering live operations.
- Embedded Admin and dark Admin surfaces remain review/read-only.
- Luma/API/MCP/provider verbs are blocked, disabled, or clearly preview-only.
- Fake chapters, staff/admin actors, audit rows, owner placeholders, proof rows,
  and metrics remain `TEST` labeled.

Proof tier:

- Local shell/readback proof only.
- Not owner CSV proof.
- Not provider proof.
- Not launch-gate proof.

### Step 5 - Focused QA Evidence Classification

Owner: `#4`

Goal:

- Review event-loop PRs by proof tier, not by vibes.

Acceptance:

- Route smoke: route availability only.
- Component/service tests: local behavior only.
- Screenshots: source-fidelity and visual acceptance only.
- Signed-in production proof: only real approved production accounts.
- Rollout proof: only real packet/live-count/pilot/audit/outbox evidence.

Matrix effect:

- `QA/Ops` can move from repeatable focused checks.
- No Data/Auth, Writes/Integrations, or Rollout Gate movement from public
  no-write smoke alone.

### Step 6 - Production Data/Auth Readiness

Owner: future Data/Auth or functional lane

Goal:

- Prove real production identity, chapter scope, event rows, Luma mappings,
  RSVP readback, attendance readback, points readback, and role access.

Needed evidence:

- real production member, leader, staff/support, and DS/admin accounts
- approved profile/role rows
- approved chapter/event/Luma rows
- production signed-in route proof for member/leader/staff/admin event-loop
  surfaces

Matrix effect:

- Possible `Data/Auth` and `QA/Ops` movement if implemented and verified.
- Still not Writes/Integrations or Rollout Gate by itself.

### Step 7 - Production Write / Integration Contract

Owner: future functional/data lane with Coordinator approval

Goal:

- Define and prove fail-closed write authority before any live event-loop write
  is browser-facing.

Required contracts:

- RSVP write/readback path
- QR/check-in or attendance import path
- attendance-to-points materialization
- duplicate handling and reconciliation
- audit rows
- outbox zero-send posture
- rollback and support ownership

Matrix effect:

- Possible `Writes/Integrations` movement only with tests, audit/outbox proof,
  and explicit activation approval.

### Step 8 - Five-Chapter Pilot Proof

Owner: rollout evidence lane / Coordinator-led

Goal:

- Collect real five-chapter proof for the launch event loop.

Each ready row needs:

- approved pilot chapter
- real event id or approved Luma mapping
- member route proof
- leader route proof
- RSVP proof
- attendance or check-in proof
- points readback proof
- audit proof
- outbox zero-send proof
- support owner
- rollback owner
- checked-at timestamp
- reviewer name or email

Matrix effect:

- `Rollout Gate` movement only when the real proof packet passes.

## Builder-Facing Next Gaps

| Owner | Next gap | Why it matters | Must not do |
| --- | --- | --- | --- |
| `#1` | Member event detail -> RSVP/check-in preview -> points continuity | This is the clearest student-facing launch path after current member queue clears. | No live RSVP/check-in/points writes, Luma calls, provider sync, or rollout claims. |
| `#2` | Leader event/attendance/leaderboard readback continuity | Leaders need to understand the same event loop from chapter operations. | No event creation writes, attendance imports, role/member mutations, or points awards. |
| `#3` | Staff/Admin event-loop review and Luma/launch-gate posture | Staff/Admin need demo-safe review of event and points truth without live operations. | No owner CSV apply, provider calls, API key operations, audit mutation, or gate advancement. |
| `#4` | Event-loop QA proof classification | Prevents smoke/screenshots from being mistaken for rollout proof. | No matrix edits, no production access, no rollout proof claims. |
| Future functional/data lane | RSVP/check-in/attendance/points write authority and pilot proof | This is what moves beyond shell readiness. | Do not hide this inside shell PRs. |

## Superseded Or Deferred

- Another generic shell-only packet is lower value than event-loop continuity.
- Leader leaderboard polish alone is lower value than leader event/attendance
  continuity.
- Staff/Admin menu depth alone is lower value than event-loop review posture
  after the current Staff/Admin queue settles.
- Provider/API access is not needed for shell cleanup; it is only needed later
  for approved read-only Luma/static export or production proof tasks.

## Final Launch-Truth Reminder

The narrow-launch event loop is reviewable and increasingly coherent. It is not
yet rollout-ready. The missing leap is not more screenshots; it is real
production evidence for RSVP, attendance/check-in, points, audit, zero-send, and
role-scoped route proof.
