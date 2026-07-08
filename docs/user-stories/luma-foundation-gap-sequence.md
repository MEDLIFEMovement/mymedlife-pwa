# Luma Foundation Gap Sequence

Date: 2026-07-08
Owner lane: `#5` MVP Story + Production Planning, docs/spec only

Companion doc:

- `docs/user-stories/luma-functionality-truth.md`

## Purpose

Turn Luma repo truth into builder-ready next slices without requesting provider
access, touching production secrets, or pretending preview posture is rollout
proof.

## Start Here: Current Queue Guardrail

Use this live queue truth when assigning related work:

- `#1`: member `#551` is the narrow current blocker; Browser smoke is ambiguous
  between the Stories filter-chip `Events` link and the bottom-nav `Events`
  link. Do not start a broad member event/Luma slice until this clears.
- `#3`: `#550` is the broadened Staff/Admin continuity rerun/watch branch on
  head `756acf2fa814b87e06555cc4d30a4c078f83d7ea`. Do not overlap Staff/Admin
  Luma/admin surfaces until this settles or Coordinator approves.
- `#4`: classify Luma work by evidence tier. Green checks and public no-write
  smoke do not become production provider proof.

## Safe Build-Now Slices

These can proceed without Luma API access, production secrets, or live writes
once the relevant shell lane is free.

| Priority | Owner | Slice | Why it is safe now | Acceptance checks | Must not do |
| --- | --- | --- | --- | --- | --- |
| 1 | `#3` | Admin Luma status + integration outbox review clarity | Existing routes and services are read-only and explicitly secret-free. | `/admin/integrations/luma` shows provider mode, calendars, linked events, live sends, blocked controls, safety notes, and outbox/audit handoffs; raw keys never appear. | No provider call, API key reveal, test connection write, webhook, retry/replay, or live-send approval. |
| 2 | `#1` | Member event Luma posture clarity | Member event detail already has RSVP/check-in/points steps and Luma labels; the slice is copy/route honesty after `#551`. | `/app/events/[eventId]` says Luma link is preview/read-only; RSVP/check-in/points stay route-backed; TEST event/chapter content remains labeled. | No RSVP writeback, QR/check-in write, attendance import, points award, or provider sync. |
| 3 | `#4` | Luma proof-tier QA checklist | Reviewers need to separate route smoke, local tests, staging rehearsal, production signed-in proof, and rollout-gate proof. | PR review notes name the proof tier for every Luma/event-loop claim. | No matrix edit, provider access, rollout packet edit, or proof claim from screenshots. |
| 4 | `#6` or future Atlas/business helper | Static-export field map and sample-data validator | A business helper can prepare field mapping templates and dry-run validation against sample CSVs without touching providers. | CSV/schema docs align to `luma-calendars.csv` and `pilot-event-proof.csv`; sample rows use `TEST`; validators reject secrets and fake proof markers. | No real Luma request, API key handling, production CSV apply, or owner packet mutation. |
| 5 | future Data/Safety lane | Luma writeback activation preflight spec | The existing safety contract already defines blocked flags and side effects; a future lane can add stronger fail-closed tests without enabling writes. | Tests prove `luma_event_create`, `luma_event_update`, `luma_rsvp_writeback`, and `luma_attendance_import` stay production-blocked by default. | No browser-facing live writes, provider calls, reminders, webhooks, attendance import, or points materialization. |

## Later Access-Asks Only When Justified

Do not request Luma access now. Ask only when a specific evidence gap proves it
is needed.

| Later ask | When it becomes justified | Preferred path | Must exclude |
| --- | --- | --- | --- |
| Chapter calendar mapping | Approved launch chapter slate exists and packet assembly is missing calendar IDs/names. | Static CSV/Sheet export first. | API keys, event mutation scopes, webhooks, reminders, attendee contact export beyond approved fields. |
| Pilot event facts | Five-chapter pilot proof gap report identifies missing event ID/URL/timezone/RSVP/attendance fields. | Static export first; read-only API only if export is insufficient. | Writes, reminders, webhooks, sensitive guest details beyond approved proof fields. |
| Read-only API lookup | Static export cannot provide required mapping/proof fields. | Minimum read-only calendar/event/guest lookup. | Create/update/delete, write scopes, webhook execution, notification sends. |
| Production proof collection | DS/Coordinator approves real proof collection window. | App route proof plus packet/live-count/audit/outbox workflow. | Treating Luma export alone as signed-in route proof, audit proof, outbox proof, or final gate approval. |

## Builder Handoff

### `#1` General Member App

Next safe Luma-adjacent slice after `#551` clears:

- Keep `/app/events` and `/app/events/[eventId]` Luma posture honest while
  continuing member event/detail/RSVP/check-in/points continuity.

Likely files/surfaces:

- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `tests/member-event-detail-page.test.tsx`

Acceptance:

- Luma appears as link/posture only, not as a live provider write.
- RSVP/check-in/points steps stay route-backed and preview-safe.
- Share, calendar export, QR/check-in, and points-impact controls are blocked
  or clearly preview-only where no live write exists.
- Visible fake event/chapter/member/points content keeps `TEST` labels.

### `#3` Staff / DS Admin

Next safe Luma-adjacent slice after `#550` settles:

- Tighten Admin Luma status, integration outbox, and launch-gate handoff copy
  so DS/Admin can demo what is reviewable without implying live provider
  operations.

Likely files/surfaces:

- `src/app/admin/integrations/luma/page.tsx`
- `src/app/admin/integration-outbox/page.tsx`
- `src/app/admin/launch-gate/page.tsx`
- `tests/admin-luma-integration-status.test.ts`
- `tests/admin-integration-outbox-workspace.test.ts`

Acceptance:

- Provider mode, linked event counts, outbox status, safety notes, and blocked
  controls remain visible.
- Raw API keys/secrets never render.
- Admin handoffs to audit/outbox/launch gate stay read-only.
- Provider verbs are disabled, blocked, or clearly future-wired.
- Visible fake admin/provider/audit rows keep `TEST` labels.

### `#4` QA / Release Watch

Next safe QA slice:

- Add a Luma-specific review note to active shell PR watch: route smoke proves
  route availability, not provider proof.

Acceptance:

- PR reviews call out whether evidence is local, staging, production signed-in,
  or rollout-gate.
- Browser smoke ambiguity around `#551` is not generalized into a Luma/product
  failure.
- Staff/Admin `#550` is treated as shell continuity until merged, not provider
  readiness.

### `#6` / Atlas / Business Workspace Candidate

Safe helper slice:

- Build a static-export worksheet and validation checklist for future Luma
  chapter/event data requests using existing templates.

Likely inputs:

- `docs/luma-rollout-data-request-template.md`
- `docs/luma-pilot-event-proof-data-request-template.md`
- `docs/production-rollout-bootstrap.md`
- `scripts/create-production-pilot-event-proof-import.mjs`
- `scripts/check-production-luma-mapping-readiness.mjs`

Acceptance:

- The helper produces field maps and dry-run/sample evidence only.
- Sample rows visibly include `TEST`.
- The packet states no access request is being made yet.
- It does not create rollout packet rows, production users, provider writes, or
  invite-gate evidence.

## Matrix Guidance

Can move soon, if implemented and checked:

- `Scope/UI`: clearer member Luma posture, admin Luma status, outbox handoffs,
  and blocked-control honesty.
- `QA/Ops`: focused tests, browser route checks, and #4 evidence-tier
  classification.

Can move later only with stronger evidence:

- `Data/Auth`: real role-scoped production readback of events/Luma mappings and
  signed-in route proof.
- `Writes/Integrations`: approved fail-closed write/provider contracts plus
  audit/outbox tests and activation approval.
- `Rollout Gate`: approved owner data, live counts, signed-in proof, real
  five-chapter pilot event proof, zero-send evidence, and final approval.

## Superseded Or Deferred

- Do not ask for Luma access now just because the Luma lane is getting
  attention.
- Do not treat `/admin/integrations/luma` as proof that Luma is connected live.
- Do not hide Luma provider activation inside shell/UI PRs.
- Do not assign Atlas/business helper work to production secrets or provider
  APIs; keep it static-export and validation-template oriented until
  Coordinator approves a real access ask.
