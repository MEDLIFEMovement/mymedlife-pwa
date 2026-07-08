# Luma Functionality Truth

Date: 2026-07-08
Owner lane: `#5` MVP Story + Production Planning, docs/spec only

## Purpose

This packet inventories the Luma launch lane from current repo truth. It is for
builder handoff, Atlas/business-workspace scoping, and coordination. It does
not request Luma access, call Luma, write production data, or prove rollout
readiness.

## Truth Rules

- Repo truth wins for implementation and readiness claims.
- Figma/exported source can shape acceptance, but it does not prove provider
  wiring.
- Luma provider terms should stay clean; fake visible people, chapters, events,
  proof rows, owner rows, counts, and audit actors must keep visible `TEST`
  labels until replaced by approved real data or hidden.
- Local, TEST, sandbox, Figma, staging, smoke, and screenshot evidence can help
  reviewers, but none of it counts as rollout proof by itself.
- Luma writes, reminders, webhooks, RSVP writeback, attendance import,
  provider replay/retry/rollback, and provider-backed points movement remain
  blocked unless a separate approved lane enables them.

## Sources Inspected

Routes and shell surfaces:

- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/launch-gate/page.tsx`

Services and scripts:

- `src/services/admin-luma-integration-status.ts`
- `src/services/luma-rsvp-attendance-writeback-safety-contract.ts`
- `src/services/chapter-luma-calendars.ts`
- `src/services/production-luma-mapping-readiness.ts`
- `src/services/staging-luma-event-loop.ts`
- `src/services/event-loop.ts`
- `src/services/launch-lane-event-snapshots.ts`
- `src/services/production-pilot-event-proof.ts`
- `src/services/production-pilot-event-proof-import.ts`
- `scripts/check-production-luma-mapping-readiness.mjs`
- `scripts/create-production-luma-runtime-registry.mjs`
- `scripts/check-production-pilot-event-proof.mjs`
- `scripts/create-production-pilot-event-proof-import.mjs`

Tests:

- `tests/admin-luma-integration-status.test.ts`
- `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts`
- `tests/production-luma-mapping-readiness.test.ts`
- `tests/production-luma-runtime-registry-export.test.ts`
- `tests/event-loop.test.ts`
- `tests/launch-lane-event-snapshots.test.ts`
- `tests/production-pilot-event-proof.test.ts`
- `tests/production-pilot-event-proof-import.test.ts`

Supporting docs:

- `docs/event-loop-data-auth-readiness.md`
- `docs/luma-rollout-data-request-template.md`
- `docs/luma-pilot-event-proof-data-request-template.md`
- `docs/production-rollout-bootstrap.md`
- `docs/user-stories/narrow-launch-event-loop-truth.md`
- `docs/user-stories/narrow-launch-event-loop-gap-sequence.md`
- `docs/user-stories/delivery-backlog.md`

## Current Luma Inventory By Capability

| Capability | Current repo truth | Status | Evidence |
| --- | --- | --- | --- |
| Chapter-to-calendar mapping | The app has local/staging summary logic, rollout-stage readiness, production packet/runtime mapping comparison, and runtime registry export from approved packet rows. | `staged / blocked for rollout proof` | `src/services/chapter-luma-calendars.ts`, `src/services/production-luma-mapping-readiness.ts`, `tests/production-luma-mapping-readiness.test.ts`, `tests/production-luma-runtime-registry-export.test.ts` |
| Event surfaces | Member event list/detail, leader/staff event readback, and admin Luma status surfaces exist as route/readback shells. | `partial / preview-only` | `src/app/app/events/page.tsx`, `src/app/app/events/[eventId]/page.tsx`, `src/services/launch-lane-event-snapshots.ts`, `tests/launch-lane-event-snapshots.test.ts` |
| RSVP visibility | Member event detail can show RSVP posture and internal readback from app rows. | `partial / preview-only` | `src/app/app/events/[eventId]/page.tsx`, `src/services/launch-lane-event-snapshots.ts`, `docs/event-loop-data-auth-readiness.md` |
| RSVP writeback to Luma | Safety contract states no current write path exists; `luma_rsvp_writeback` must stay blocked. | `blocked` | `src/services/luma-rsvp-attendance-writeback-safety-contract.ts`, `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts` |
| QR/check-in | Member detail has route-backed preview of check-in/QR state; staging model can rehearse local state. | `preview-only` | `src/app/app/events/[eventId]/page.tsx`, `src/services/staging-luma-event-loop.ts`, `tests/event-loop.test.ts` |
| Attendance import/readback | Local/staging state can represent attendance; production pilot proof validators require attendance counts. No provider import authority is enabled. | `partial readback / blocked import` | `src/services/staging-luma-event-loop.ts`, `src/services/production-pilot-event-proof.ts`, `tests/production-pilot-event-proof.test.ts` |
| Points linkage | Local event-loop and points readback can connect attendance-like state to points; provider-backed materialization remains blocked. | `partial / blocked for provider authority` | `src/services/event-loop.ts`, `src/services/launch-lane-event-snapshots.ts`, `tests/event-loop.test.ts`, `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts` |
| Leaderboards impact | Simple leaderboard/readback can reflect local points data, but Luma attendance cannot move leaderboards yet. | `partial / mock-safe` | `docs/user-stories/narrow-launch-event-loop-truth.md`, `tests/luma-rsvp-attendance-writeback-safety-contract.test.ts` |
| Audit/outbox safety | Admin Luma status and integration outbox expose secret-free, read-only posture; live sends count stays visible; unsafe verbs are blocked. | `built read-only guardrail` | `src/app/admin/integrations/luma/page.tsx`, `src/app/admin/integration-outbox/page.tsx`, `src/services/admin-luma-integration-status.ts`, `tests/admin-luma-integration-status.test.ts` |
| Pilot proof | Validators can check five-chapter RSVP, attendance, points, audit, zero-send, route, reviewer, and timestamp proof if real evidence is supplied. | `staged / blocked on real proof` | `src/services/production-pilot-event-proof.ts`, `src/services/production-pilot-event-proof-import.ts`, `tests/production-pilot-event-proof.test.ts`, `tests/production-pilot-event-proof-import.test.ts` |
| Rollout gate | Luma mapping and pilot proof feed the rollout packet/gate, but do not replace owner data, signed-in proof, live counts, or final approval. | `blocked until real evidence` | `docs/production-rollout-bootstrap.md`, `docs/luma-rollout-data-request-template.md`, `docs/luma-pilot-event-proof-data-request-template.md` |

## Built, Preview-Only, Staged, Blocked, Missing

### Built Or Strong Local Guardrail

- Secret-free DS/Admin Luma status readback at `/admin/integrations/luma`.
- Admin integration outbox review posture at `/admin/integration-outbox`.
- Luma provider mode labels and blocked-control inventory.
- Local/staging event-loop state model with `externalWritesEnabled: false`.
- Production Luma mapping readiness validator and registry export.
- Production pilot event proof import/check validators.
- Tests proving Luma keys do not render in browser-visible status output.

### Preview-Only Or Mock-Safe

- Member RSVP/check-in/points step flow on event detail.
- Luma labels and linked event posture in member event rows.
- Local staging event prep, RSVP, attendance, points, audit, and outbox
  rehearsal.
- Simple leaderboard movement from local/test points rows.
- DS/Admin provider readback when mode is mock/staging/live-ready-not-enabled.

### Staged For Later Real Evidence

- Static Luma export templates for mapping and pilot event facts.
- Runtime chapter-to-Luma registry generation from approved packet rows.
- Five-chapter pilot proof import and readiness checks.
- Production rollout packet checks that include `lumaCalendars` and
  `pilotEventProof`.

### Blocked

- Luma event create/update/delete.
- Luma reminders, broadcasts, webhooks, replay, retry, rollback, or dead-letter
  mutation.
- RSVP writeback from myMEDLIFE to Luma.
- Attendance import from Luma into myMEDLIFE operational truth.
- Provider-backed points awards or leaderboard movement.
- Any provider/Test/Figma/sandbox/mock/staging/sample evidence counting as
  production pilot proof, signed-in proof, live counts, rollout packet evidence,
  or invite-gate approval.

### Missing Or Underdefined

- Approved live RSVP write path and readback owner.
- Approved QR/check-in or attendance import path.
- Duplicate-safe attendance reconciliation.
- Attendance-to-points materialization with audit linkage.
- Real owner-approved chapter-to-calendar data for launch chapters.
- Real five-chapter event proof tied back to app routes, audit, outbox, and
  reviewer/timestamp evidence.
- Production-support/rollback playbook for failed Luma sync or mismatched
  provider rows.

## Proof Boundaries

### Local Proof

Can prove:

- route exists
- controls are blocked/read-only/preview-only
- service contracts fail closed
- local staging state preserves audit/outbox posture
- TEST/mock data is not being called production proof

Cannot prove:

- live provider truth
- production signed-in role access
- production Luma mapping
- production RSVP/attendance/points proof
- rollout gate readiness

### Staging Proof

Can prove:

- hosted staging routes render
- staging/mock provider posture can be reviewed
- no browser-secret exposure in the visible model

Cannot prove:

- final production Luma truth
- production write authority
- final pilot proof
- final invite gate

### Production Signed-In Proof

Can prove only when collected with real approved production accounts:

- member can see event and Luma/RSVP posture in the app
- leader can see event/attendance/leaderboard posture
- staff/admin can inspect Luma status, outbox, audit, and launch-gate posture

Cannot prove by itself:

- Luma writeback
- attendance import
- points materialization
- rollout proof

### Rollout-Gate Proof

Requires all relevant real evidence together:

- approved owner data and rollout packet
- approved Luma chapter calendar mapping
- production live counts
- production signed-in route proof
- five ready pilot event proof rows with RSVP, attendance, points, audit,
  zero-send, app routes, reviewer, and timestamp
- final Coordinator/Nick approval

## Biggest Launch-Truth Clarifications

1. Luma is not a live integration today; it is a guarded readback/readiness
   lane with explicit blocked writes.
2. Admin Luma status is useful because it proves secret-free posture and blocked
   controls, not because it proves provider connectivity.
3. The local event-loop model can rehearse RSVP, attendance, points, audit, and
   outbox behavior, but it remains local/staging-safe and cannot count as pilot
   proof.
4. Luma static exports are a later supporting source for mapping and event
   facts; they do not replace app route proof, audit/outbox proof, live counts,
   or final gate approval.
5. Provider-linked attendance must not move points or leaderboards until a
   separate audited materialization lane exists.

## Matrix Narrative

- Planning docs alone move no percentages.
- Shell/UI cleanup around Luma labels, event steps, and admin status can move
  `Scope/UI` and possibly `QA/Ops` after implementation and focused checks.
- Data/Auth can move only from real role/data/readback guardrails, not from
  provider labels.
- Writes/Integrations can move only after a separate approved fail-closed
  write/provider contract and evidence.
- Rollout Gate can move only with real owner data, live counts, signed-in proof,
  five-chapter pilot proof, audit/outbox zero-send proof, and final approval.
