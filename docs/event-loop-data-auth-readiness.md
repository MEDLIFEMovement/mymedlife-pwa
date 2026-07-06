# Event Loop Data/Auth Readiness Map

This note is a read-only map for the launch-lane member event loop:

- events
- RSVP
- attendance or check-in
- points
- leaderboards
- audit and outbox linkage
- pilot proof readiness

It is meant to keep local preview truth separate from production rollout truth.
It does **not** create or approve production proof.

## What Is Real App or Service Logic Today

| Area | Current logic | Evidence | Current classification |
| --- | --- | --- | --- |
| Member event list and event detail readback | The member routes build event rows from `ReadOnlyAppData`, chapter-event rows, linked Luma metadata, internal RSVP event rows, attendance event rows, and points rows. | `src/services/member-launch-lane-events.ts`, `src/services/launch-lane-event-snapshots.ts`, `tests/member-launch-lane-events.test.ts`, `tests/launch-lane-event-snapshots.test.ts` | Real read-model logic, but still read-only and preview-backed in this lane |
| Member RSVP state | RSVP state is inferred from `event_rsvp_recorded` rows and signed-in actor/profile matching. | `src/services/launch-lane-event-snapshots.ts`, `tests/launch-lane-event-snapshots.test.ts` | Real readback logic; not a proved production RSVP write path |
| Attendance or check-in state | Attendance is read from the latest `event_attendance_recorded` event payload when present, otherwise from `chapter_events.attendance_count`. | `src/services/launch-lane-event-snapshots.ts` | Real readback logic; not a proved production attendance import or check-in write path |
| Member, leader, staff, and org points readback | Points, chapter totals, org totals, leader attendance readback, and leaderboard rows are computed from `points_events` plus chapter-event and RSVP readbacks. | `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts` | Real read-model logic; not a proved production attendance-to-points materialization path |
| Chapter-scoped auth guardrails | Access helpers verify that the actor belongs to the chapter or allowed staff scope before event update, RSVP, or attendance-import lanes can proceed. | `src/services/launch-lane-event-access.ts` | Real auth boundary logic |
| Production pilot proof readiness | Packet-level readiness verifies RSVP, attendance, points, audit, zero-send, reviewer, timestamp, and route proof for five pilot chapters. | `src/services/production-pilot-event-proof.ts`, `tests/production-pilot-event-proof.test.ts`, `scripts/check-production-pilot-event-proof.mjs` | Real rollout gate logic, but only checks supplied evidence |
| Production live data readiness | Count-based readiness verifies the launch-floor tables for users, memberships, chapters, chapter events, Luma links, points, audit, and outbox. | `src/services/production-live-data-readiness.ts`, `tests/production-live-data-readiness.test.ts` | Real preflight logic, but count-only and not row-by-row proof |

## What Is Local, Test, Sandbox, or Rehearsal Only

These pieces are useful, but they do **not** count as production proof:

- `src/services/event-loop.ts` currently presents itself as the canonical event-loop entrypoint, but it is still backed by `staging-luma-event-loop.ts`.
- `src/services/staging-luma-event-loop.ts` is an explicit mock or staging state machine:
  - `externalWritesEnabled: false`
  - Luma link status can be `attached`, `requested`, or `disabled`
  - audit and outbox rows are simulated in local state
- `src/services/rush-month-event-rsvp.ts` returns posture labels such as mocked or disabled. It does not perform RSVP writes.
- `src/services/launch-lane-points-readback.ts` includes local seeds such as `eventLoopSeeds` and `leaderAttendanceSeed` to keep preview shells readable.
- `src/services/points-kpi-ledger.ts` can fall back to preview posture when real ledger rows are missing; tests explicitly expect `mock_safe` and `assignment_preview`.
- Local Figma or sandbox proof commands, test seed artifacts, preview-cookie checks, and SOP sample content remain excluded from packet evidence and signed-in proof.

## Tables, Data Sources, and Test Coverage

| Table or source | Used for | Evidence today | Gap that still matters |
| --- | --- | --- | --- |
| `auth.users` and `app.profiles` | Signed-in identity floor for the event loop | Counted by `production-live-data-readiness.ts` | No production access was used in this audit, so no real user/profile proof was added |
| `app.chapter_events` | Event shell, timing, status, attendance fallback | Counted by `production-live-data-readiness.ts`; consumed by `launch-lane-event-snapshots.ts`; focused local RLS coverage in `supabase/tests/database/rls_goal_333.test.sql` | Local proof now shows member, leader, coach, admin, and DS-admin boundaries, but it is still sandbox-only and not production proof |
| `app.luma_event_links` | Luma event id, event URL, chapter-event mapping | Counted by `production-live-data-readiness.ts`; consumed by `launch-lane-event-snapshots.ts`; checked by pilot proof readiness; focused local RLS coverage in `supabase/tests/database/rls_goal_333.test.sql` | Local proof now shows chapter-scoped read access and blocked public writes, but it is still sandbox-only and not production proof |
| Internal RSVP and attendance event rows | Member RSVP readback and attendance readback | `event_rsvp_recorded` and `event_attendance_recorded` are consumed by `launch-lane-event-snapshots.ts`; general event-table RLS already gates actor, chapter leader, coach, and admin reads | Launch proof still needs a real production RSVP/check-in write and readback path, plus a dedicated local event-loop seed if the team wants focused DB proof for those event types themselves |
| `app.points_events` | Member points, chapter totals, org leaderboard totals | `tests/points-kpi-ledger.test.ts`, `tests/launch-lane-points-readback.test.ts`, focused DB coverage in `supabase/tests/database/rls_goal_115.test.sql`, and member-forge blocking in `supabase/tests/database/rls_goal_333.test.sql` | Production event-loop proof still needs attendance-backed points rows created through the approved live path |
| `app.audit_logs` | Audit proof and safe write posture | Counted by `production-live-data-readiness.ts`; pilot proof and rollout gate expect audit evidence; multiple DB tests exist for adjacent audited write flows; member-forge blocking is covered in `supabase/tests/database/rls_goal_333.test.sql` | This audit did not add real event-loop audit rows or production readback |
| `app.automation_outbox` | Zero-send proof and future provider safety | Counted by `production-live-data-readiness.ts`; pilot proof expects `zero_sends`; multiple DB tests exist for adjacent audited flows; member-forge blocking is covered in `supabase/tests/database/rls_goal_333.test.sql` | Production event-loop proof still needs real zero-send outbox evidence tied to the pilot rows |

## Write Paths That Are Missing or Intentionally Blocked

These are the biggest reasons the event loop is still only partly ready:

- Current local RLS still allows a chapter-event owner to update their own `app.chapter_events` row; that is now documented by the local proof suite and should be reviewed before anyone treats attendance fallback fields as tightly locked production truth
- No proved production member RSVP browser write path in this lane
- No proved production attendance import or check-in replay path in this lane
- No proved production attendance-to-points materialization path in this lane
- No proved production event create or update write path in this lane
- No proved production Luma RSVP writeback or guest import readback in this lane
- No provider sends are allowed to count as success; outbox must stay safe and auditable
- No local, preview, Test, Figma, sandbox, SOP sample, or staging evidence can count as pilot proof

## Evidence Needed To Move The Matrix

### Events Data/Auth

Move this only when the team has real production evidence that:

- signed-in member and leader accounts can reach the event loop with production identity rows
- launch chapters have real `app.chapter_events` and `app.luma_event_links` rows
- RSVP and attendance data can be read back from approved production rows, not only preview state
- chapter-scoped access remains correct for member, leader, staff, and admin reviewers

### Points Data/Auth

Move this only when the team has real production evidence that:

- `app.points_events` rows are created from approved event attendance behavior
- member and leader readbacks show the same event-backed totals
- audit linkage for the point award is visible and attributable
- leaderboard movement comes from the real points ledger, not preview seeds

### Events Writes/Integrations

Move this only when the team has real production evidence that:

- the approved live RSVP path is known
- the approved live attendance or check-in path is known
- the Luma mapping used by the pilot chapters is real and reviewer-approved
- outbox safety stays at zero unsafe live-send rows
- rollback or support owners can explain what to do after a failed event, RSVP, or attendance sync

### QA/Ops

Move this only when an operator can repeat the real proof flow using:

- `pnpm rollout:pilot-proof-import`
- `pnpm rollout:build`
- `pnpm rollout:check`
- `pnpm production:pilot-event-proof`
- `pnpm production:data-counts`

and the evidence set comes from real production rows instead of sandbox or rehearsal artifacts.

### Rollout Gate

Do **not** move this from local or staging evidence. Move it only when all of the following exist together:

- approved 30-chapter rollout packet
- production live data counts
- real production signed-in route proof
- five ready pilot proof rows with reviewer, timestamp, app routes, audit, points, and zero-send evidence
- named support, rollback, and production-apply owners

## Fast Operator Summary

If someone asks whether the event loop is production-ready today, the honest answer is:

- event and points **read models** exist
- chapter-scoped **access checks** exist
- pilot-proof and live-data **readiness checks** exist
- production **writes and provider-backed proof** are still incomplete

That means the launch lane has solid guardrails, but it does **not** yet have the production evidence needed to move the rollout gate.
