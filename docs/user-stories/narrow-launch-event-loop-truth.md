# Narrow Launch Event Loop Truth

Date: 2026-07-08
Owner lane: `#5` MVP Story + Production Planning, docs/spec only

## Purpose

Inventory the actual narrow-launch event loop from current repo truth:

- events
- RSVP
- QR/check-in
- attendance
- points
- simple leaderboards

This packet is for builder handoff and launch-truth review. It does not
implement product behavior, prove production readiness, or move the rollout
gate.

## Truth Rules

- Repo truth wins for implementation and readiness claims.
- Figma/exported source shapes acceptance and visual intent, not production
  functionality.
- Visible fake people, chapters, events, RSVP rows, story/proof rows, points,
  leaderboard rows, fake metrics, placeholder owners, and audit actors must
  keep visible `TEST` labels until replaced by approved real data or hidden.
- Local, TEST, sandbox, Figma, staging, screenshot, smoke, and preview evidence
  can help reviewers, but none of it counts as rollout proof by itself.

## Sources Inspected

Routes and UI surfaces:

- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/leader/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/launch-gate/page.tsx`

Read models and safety services:

- `src/services/events-points-launch-lane.ts`
- `src/services/member-launch-lane-events.ts`
- `src/services/member-launch-lane-loop-state.ts`
- `src/services/launch-lane-event-snapshots.ts`
- `src/services/launch-lane-points-readback.ts`
- `src/services/luma-rsvp-attendance-writeback-safety-contract.ts`
- `src/services/production-pilot-event-proof.ts`
- `src/services/production-pilot-event-proof-import.ts`
- `src/services/production-signed-in-route-proof.ts`

Tests:

- `tests/events-points-launch-lane.test.ts`
- `tests/member-event-detail-page.test.tsx`
- `tests/member-launch-lane-events.test.ts`
- `tests/launch-lane-event-snapshots.test.ts`
- `tests/launch-lane-points-readback.test.ts`
- `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts`
- `tests/production-pilot-event-proof.test.ts`
- `tests/production-pilot-event-proof-import.test.ts`
- `tests/event-loop-data-auth-readiness-doc.test.ts`

Supporting docs:

- `docs/event-loop-data-auth-readiness.md`
- `docs/five-chapter-pilot-proof-checklist.md`
- `docs/production-functionality-wiring-audit.md`
- `docs/integration-readiness-map.md`
- `docs/user-stories/delivery-backlog.md`

## End-To-End Event Loop Inventory

| Step | Member surface | Leader surface | Staff/Admin surface | Current status | Repo evidence |
| --- | --- | --- | --- | --- | --- |
| Event discovery | `/app/events`, `/app/events/[eventId]` | `/leader?view=events` | `/staff?view=events`, `/admin/integrations/luma` | `partial` | `src/app/app/events/page.tsx`, `src/app/app/events/[eventId]/page.tsx`, `src/services/member-launch-lane-events.ts`, `src/services/launch-lane-event-snapshots.ts`, `tests/member-launch-lane-events.test.ts` |
| Event detail | `/app/events/[eventId]` | `/leader?view=events&event=*` | `/staff?view=events&event=*` | `built shell / preview-only controls` | `tests/member-event-detail-page.test.tsx`, `src/services/events-points-launch-lane.ts`, `tests/events-points-launch-lane.test.ts` |
| RSVP posture | `/app/events/[eventId]?step=rsvp` | leader event readback | staff event readback | `preview-only / readback partial` | `src/services/launch-lane-event-snapshots.ts`, `src/services/member-launch-lane-loop-state.ts`, `tests/member-event-detail-page.test.tsx`, `tests/launch-lane-event-snapshots.test.ts` |
| QR/check-in posture | `/app/events/[eventId]?step=checkin` | `/leader?view=attendance`, `/leader?view=events` | staff event/attendance summaries | `preview-only` | `src/app/app/events/[eventId]/page.tsx`, `tests/member-event-detail-page.test.tsx`, `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts` |
| Attendance readback | event detail, `/app/points` | leader attendance readback | staff chapter readback | `partial` | `src/services/launch-lane-event-snapshots.ts`, `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts` |
| Points readback | `/app/points`, event detail points step | `/leader?view=leaderboard` | `/staff?view=leaderboard` | `partial / read-only` | `src/app/app/points/page.tsx`, `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts` |
| Simple leaderboards | `/app/points` member impact | `/leader?view=leaderboard` | `/staff?view=leaderboard` | `partial / mock-safe readback` | `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts`, `tests/member-event-detail-page.test.tsx` |
| Luma/provider bridge | Luma label and preview link posture | leader event/attendance review | `/admin/integrations/luma` | `blocked / read-only preview` | `src/services/luma-rsvp-attendance-writeback-safety-contract.ts`, `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts`, `docs/integration-readiness-map.md` |
| Pilot proof | not a shell feature | not a shell feature | `/admin/launch-gate`, rollout packet tooling | `blocked until real evidence` | `src/services/production-pilot-event-proof.ts`, `src/services/production-pilot-event-proof-import.ts`, `tests/production-pilot-event-proof.test.ts`, `docs/five-chapter-pilot-proof-checklist.md` |

## Current State By Step

### 1. Events

Current status: `partial`.

What exists:

- Member event list route at `/app/events`.
- Member event detail route at `/app/events/[eventId]`.
- Route-backed return/source context from home, events, profile, and points.
- Event rows are built from read-only app data, chapter events, Luma link
  metadata, RSVP event rows, attendance event rows, and points rows.

What is not proved:

- Approved production event rows for launch chapters.
- Production Luma mapping for the pilot chapters.
- Production event create/update authority.

### 2. RSVP

Current status: `preview-only / partial readback`.

What exists:

- Member RSVP step route at `/app/events/[eventId]?step=rsvp`.
- RSVP state can be inferred from internal `event_rsvp_recorded` rows and the
  signed-in actor/profile match.
- The UI copy says route-backed preview and blocks external writes.

What is not proved:

- Production member RSVP browser write.
- Luma RSVP writeback.
- Real provider-authoritative RSVP readback.

### 3. QR / Check-In

Current status: `preview-only`.

What exists:

- Member check-in preview route at `/app/events/[eventId]?step=checkin`.
- Preview QR code posture and check-in progression into points impact.
- Leader and staff readback services can display attendance status.

What is not proved:

- Production QR scan or check-in write.
- Production attendance import.
- Duplicate-safe provider attendance reconciliation.

### 4. Attendance

Current status: `partial`.

What exists:

- Attendance count readback from the latest `event_attendance_recorded` payload
  when present, otherwise from `chapter_events.attendance_count`.
- Leader attendance readback rows.
- Staff chapter readback rows with RSVP, attendance, points, and risk labels.

What is not proved:

- Production attendance source of truth.
- Production attendance import from Luma.
- Audit-backed attendance write path.

### 5. Points

Current status: `partial / read-only`.

What exists:

- Member points route at `/app/points`.
- Event detail points-impact step at `/app/events/[eventId]?step=points`.
- Member, leader, staff, chapter, and org points readbacks from
  `points_events`.
- Tests prove local readback consistency across member history, leader
  attendance, chapter leaderboards, staff chapter rows, and org totals.

What is not proved:

- Production attendance-to-points materialization.
- Award authority for points writes.
- Provider-linked points movement.
- Audit-backed point award proof from live pilot activity.

### 6. Simple Leaderboards

Current status: `partial / mock-safe readback`.

What exists:

- Member points/leaderboard posture.
- Leader chapter/member leaderboard posture.
- Staff/org leaderboard posture.
- Readback rows are tied to local points data in tests.

What is not proved:

- Production points ledger authority.
- Production leaderboard movement after real attendance.
- Rewards/provider sync.

## Contradictions Between Visible UI And Functional Proof

- The member event detail route looks like a full event flow, but RSVP and
  check-in are route-backed preview states, not production writes.
- The points impact screen can show "Checked in" and a points amount, but the
  real points ledger still depends on an approved attendance/write sequence.
- Leader and staff event/attendance/leaderboard views can show rich readbacks,
  but they still depend on read-only or mock-safe data until production rows are
  approved and proven.
- Luma-linked labels and admin integration posture do not prove Luma writes,
  reminders, webhooks, RSVP writeback, attendance import, or provider replay.
- Five-chapter pilot proof has code-level readiness checks, but the checks only
  validate supplied real evidence; they do not create that evidence.

## Proof Boundaries

### Local Proof

Can prove:

- route exists
- service computes expected readbacks
- tests cover local/fixture event-loop behavior
- controls are visibly blocked or preview-only

Cannot prove:

- production identity
- production data rows
- provider truth
- rollout gate readiness

### Staging Proof

Can prove:

- hosted route can render in a staging-like environment
- staging provider/export rehearsal may work if separately documented

Cannot prove:

- production owner data
- final signed-in production proof
- final pilot proof
- production invite gate readiness

### Production Signed-In Proof

Can prove only when collected from real approved production accounts:

- member can open `/app`, `/app/events`, event detail, and `/app/points`
- leader can open `/leader?view=events`, attendance, and leaderboard surfaces
- staff/support can open `/staff?view=events`, chapters, and leaderboard
- DS/admin can open `/admin` proof/admin review surfaces

Cannot prove by itself:

- RSVP write authority
- attendance import
- points materialization
- pilot event proof

### Rollout-Gate Proof

Requires all relevant real evidence together:

- approved owner data and rollout packet
- production live counts
- production signed-in route proof by role
- five ready pilot event proof rows
- RSVP, attendance, points, audit, and zero-send proof
- support owner, rollback owner, reviewer, and timestamp
- final Coordinator/Nick approval

## Builder Handoff

### `#1` General Member App

Best next gap after the current member queue clears:

- Member event/detail/RSVP-check-in/points continuity.

Likely scope:

- `/app/events`
- `/app/events/[eventId]`
- `/app/points`
- member bottom nav and source/return context
- focused member event route tests

Do not touch:

- live RSVP writes
- QR/check-in writes
- points award authority
- Luma/provider writes
- rollout proof

### `#2` Student Leadership / Chapter Command Center

Best next gap after the current leader queue clears:

- Leader event/attendance/leaderboard handoff clarity inside
  `/leader?view=*`.

Likely scope:

- `/leader?view=events`
- `/leader?view=attendance`
- `/leader?view=leaderboard`
- route/query continuity back to selected event or member where supported

Do not touch:

- event creation writes
- attendance imports
- role/member mutations
- points awards
- Luma/provider sync

### `#3` Staff / DS Admin

Best next gap after the current Staff/Admin queue clears:

- Staff chapter event readback plus embedded Admin/Luma/launch-gate review
  clarity.

Likely scope:

- `/staff?view=events`
- `/staff?view=leaderboard`
- `/staff?view=admin`
- `/admin/integrations/luma`
- `/admin/launch-gate`

Do not touch:

- owner CSV application
- live provider calls
- API keys
- audit/outbox mutation
- launch-gate advancement

### `#4` QA / Release Watch

Best next gap:

- Classify event-loop PR evidence by proof tier.

Reviewer checks:

- route smoke proves route availability only
- focused tests prove local behavior only
- screenshots prove visual acceptance only
- production signed-in route proof requires real production accounts
- rollout proof requires the five-chapter packet and supporting evidence

### Future Functional / Data Lane

Needs a separate lane, not shell PR scope:

- production RSVP write/readback path
- QR/check-in or attendance import authority
- attendance-to-points materialization
- duplicate handling and reconciliation
- audit/outbox zero-send proof
- production pilot proof import/check tooling against real rows

## Matrix Narrative

- This planning packet alone moves no percentages.
- Shell/UI event-loop cleanup can move `Scope/UI` and maybe `QA/Ops`.
- Data/Auth can move only from tested production-role/data/readback safety or
  real signed-in proof readiness.
- Writes/Integrations can move only from approved write/provider contracts,
  fail-closed tests, audit/outbox safety, and explicit activation approval.
- Rollout Gate can move only when real owner data, live counts, signed-in proof,
  pilot proof, audit/outbox zero-send proof, and final approval exist.
