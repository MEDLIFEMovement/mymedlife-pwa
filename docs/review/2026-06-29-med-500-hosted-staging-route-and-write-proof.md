# MED-500 Hosted Staging Route And Write Proof

Date: 2026-06-29

Status:
- hosted staging proof captured
- review-only
- no new production writes approved
- no external sends enabled

## Why this note exists

This note records the cleanest current hosted staging proof for the Phase 2
closeout lane. It is the source of truth for which route/readback evidence is
real, which assignment row is authoritative, and which earlier seeded row
should not be treated as proof.

## Reviewer access path

Observed reviewer path on `https://staging.mymedlife.org`:

1. Open `https://staging.mymedlife.org`.
2. Complete the Vercel SSO gate first.
3. After the Vercel handoff, the app loads the myMEDLIFE login page.
4. Sign in with a seeded staging account.
5. Confirm the app routes the signed-in reviewer into the correct workspace.

Important:

- the Vercel SSO cookie alone is not app proof
- the preview-actor cookie alone is not app proof
- the valid proof path is: Vercel SSO -> myMEDLIFE login -> seeded account ->
  role-routed workspace
- a fresh hosted recheck on 2026-06-29 also confirmed that this sign-in path
  sets the staging app session cookie and removes the
  `no Supabase session token is active` fallback on the DS-admin control routes

## Hosted sign-in and route proof captured

Hosted role-routed proof was rechecked on 2026-06-29 through the staging alias:

- member:
  - sign-in: `member.a@mymedlife.test`
  - route evidence: `/app`
  - route evidence: `/rush-month/actions/50000000-0000-4000-8000-000000000002`
  - readback:
    - `Hi, Sofia`
    - `Rush Month`
    - `Invite three more students to Rush Month`
    - status `submitted`
- leader:
  - sign-in: `leader.a@mymedlife.test`
  - route evidence:
    `/rush-month/review?assignmentId=50000000-0000-4000-8000-000000000002&evidenceItemId=3e7b2ab6-8770-488f-9637-90cbaa863b62`
  - readback:
    - `Leader proof review`
    - `Chapter proof follow-up`
    - `Waiting for HQ review`
- staff:
  - sign-in: `admin@mymedlife.test`
  - route evidence: `/staff?view=chapters`
  - readback:
    - `Staff Command Center | myMEDLIFE`
    - `Event and points pulse`
- DS admin:
  - sign-in: `ds.admin@mymedlife.test`
  - route evidence:
    - `/admin/audit-log?source=luma-live-pilot`
    - `/admin/integration-outbox?source=luma-live-pilot`
    - `/admin/pilot-scope`
    - `/admin/first-write`
    - `/admin/feature-flags`
    - `/admin/theme`
    - `/admin/luma-live-pilot`
  - readback:
    - `/admin/feature-flags` shows
      `Control storage: Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.`
    - `/admin/theme` shows `Persistence supabase` with `Snapshot rows 3`
      and `Audit rows 3`
    - `/admin/first-write` shows `Connected preview data` and the hosted
      `action_started` drill readback
    - `/admin/proof-write` shows the hosted `Proof metadata packet`
    - `/admin/luma-live-pilot` shows `Event writes On`, `RSVP writes On`,
      `Attendance import On`, and `Production Off`

## Authoritative hosted first-write and proof-loop row set

Do not use assignment
`50000000-0000-4000-8000-000000000001`
as the hosted first-write proof row.

Reason:

- it reads as `in_progress`
- but it does not have the matching internal event, integration event, and
  audit log chain needed for authoritative hosted proof

Use assignment
`50000000-0000-4000-8000-000000000002`
as the authoritative hosted proof chain.

Assignment readback:

- title: `Invite three more students to Rush Month`
- status: `submitted`
- points: `15`

### Hosted `action_started` evidence

For assignment `50000000-0000-4000-8000-000000000002`:

- internal event:
  - id: `80326f8b-2436-409b-9a7d-454006c76772`
  - type: `action_started`
- integration event:
  - id: `20033a9c-f891-43c6-88ca-0e3bf0b03a8c`
  - type: `action_started`
  - destination: `internal`
  - status: `recorded`
- audit log:
  - id: `99ad7242-b46c-48d4-a573-79eef122fa74`
  - action: `action_started`
  - target: assignment `50000000-0000-4000-8000-000000000002`
- automation outbox:
  - expected result: no `action_started` send row
  - current result: no `action_started` outbox send row observed

This is the clean authoritative proof that the approved first hosted write can
run without creating an unauthorized downstream send.

### Hosted proof metadata readback

For the same assignment:

- evidence item:
  - id: `3e7b2ab6-8770-488f-9637-90cbaa863b62`
  - status: `pending_review`
- internal event:
  - id: `cca7640b-149f-45b7-8efe-c6c50b5815cf`
  - type: `evidence_submitted`
- integration event:
  - id: `b95589cd-1000-4435-a28d-3fbb9a168a4a`
  - type: `evidence_submitted`
  - destination: `internal`
  - status: `recorded`
- audit log:
  - id: `bf1c1538-6983-46f6-b0f5-d4053be65da5`
  - action: `evidence_submitted`
- automation outbox:
  - id: `e80798d1-18cb-4441-8d94-84a56bc1ad0c`
  - event type: `evidence_submitted`
  - destination: `n8n`
  - status: `disabled`

Leader readback on the hosted route shows the submitted proof waiting in the
chapter review lane without opening leader decision writes.

## Readback surfaces confirmed

Hosted route-level readback was confirmed for:

- member home: `/app`
- member leaderboard: `/rush-month/leaderboard`
- member action detail:
  `/rush-month/actions/50000000-0000-4000-8000-000000000002`
- leader review route:
  `/rush-month/review?assignmentId=50000000-0000-4000-8000-000000000002&evidenceItemId=3e7b2ab6-8770-488f-9637-90cbaa863b62`
- staff chapters: `/staff?view=chapters`
- admin audit: `/admin/audit-log?source=luma-live-pilot`
- admin outbox: `/admin/integration-outbox?source=luma-live-pilot`
- admin pilot scope: `/admin/pilot-scope`
- admin first write: `/admin/first-write`
- admin feature flags: `/admin/feature-flags`
- admin theme: `/admin/theme`
- admin Luma pilot: `/admin/luma-live-pilot`

Fresh replay detail from the 2026-06-29 hosted sign-in recheck:

- `member.a@mymedlife.test` signed in to `/app`
  - readback: `Hi, Sofia`, `Rush Month`, `Campaign progress`
- `leader.a@mymedlife.test` signed in to the chapter proof-review route
  - readback: `Leader proof review`, `Chapter proof follow-up`
- `admin@mymedlife.test` signed in to `/staff?view=chapters`
  - readback: `Staff Command Center`, `Event and points pulse`
- `ds.admin@mymedlife.test` signed in to `/admin/feature-flags?env=staging`
  - readback: the hosted DS-admin route now shows Supabase-backed control
    storage instead of the missing-session fallback

## Connector-backed database snapshot

Read-only Supabase inspection against staging project
`rceupryepjgkdeqgxzrc` on 2026-06-29 confirmed:

- control-layer tables
  - `app.feature_flag_overrides`: `2`
  - `app.feature_flag_audit_records`: `3`
  - `app.theme_snapshots`: `3`
  - `app.theme_audit_records`: `3`
  - `app.admin_step_up_sessions`: `1`
  - `app.production_control_approvals`: `1`
- hosted write / proof counts
  - `app.events`
    - `action_started`: `1`
    - `evidence_submitted`: `1`
    - `event_rsvp_recorded`: `4`
    - `event_attendance_recorded`: `5`
  - `app.integration_events`
    - `action_started`: `1`
    - `luma_event_linked`: `4`
    - `luma_rsvp_recorded`: `4`
    - `luma_attendance_imported`: `5`
  - `app.points_events`
    - attendance-backed rows: `1`
    - total points delta from Luma/attendance reasons: `20`
  - `app.automation_outbox`
    - disabled `n8n` rows: `14`
    - disabled `hubspot` rows: `1`
    - sent rows: `0`
    - approved live-send rows: `0`
  - `app.audit_logs`
    - `action_started`: `1`
    - `evidence_submitted`: `1`
    - `luma_event_upsert_recorded`: `4`
    - `luma_rsvp_recorded`: `4`
    - `luma_attendance_import_recorded`: `5`

This matters because it proves the hosted staging loop is not just visible in
the UI. The database currently shows real staged write/readback rows for the
first hosted write, the smallest proof loop, the Luma RSVP and attendance loop,
one attendance-backed points award, and zero unauthorized sends. The current
disabled outbox rows are still held on internal destinations, not released as
live downstream traffic.

## Hosted DS/Admin control-layer proof

Hosted staging also proves the DS/Admin control layer is no longer only a local
review concept:

- `/admin/feature-flags` and `/admin/theme` are part of the signed-in reviewer
  route bundle
- a fresh signed-in DS Admin replay on 2026-06-29 issued the hosted app
  session cookie and then reloaded `/admin/feature-flags` into the Supabase
  control state, not the in-memory fallback
- the staging database already contains durable rows for:
  - `app.feature_flag_overrides`
  - `app.feature_flag_audit_records`
  - `app.theme_snapshots`
  - `app.theme_audit_records`
- a protected hosted replay on `2026-06-29` also proved the production-sensitive
  control path without enabling live behavior:
  - DS Admin re-auth created `app.admin_step_up_sessions` row
    `d7d8dc57-e628-4fdd-bf69-c0428d6711a8`
  - the next hosted provider save recorded
    `app.production_control_approvals` row
    `3b918432-f843-4051-a040-9c9b90601ecc`
  - the same hosted save created production-environment
    `app.feature_flag_overrides` row
    `c16f5f52-9269-44be-a8c7-8adef1859ff8`
    for `integration_luma`
  - that provider flag is set to `scheduled`, which keeps it non-live while the
    approval and audit path is being proven on staging
  - matching durable audit rows now exist in:
    - `app.feature_flag_audit_records`
      `4287ded6-5ece-43c8-953e-a803e4178bc2`
    - `app.audit_logs`
      `376fb49e-9657-4c9e-bfc4-a8648b1e45c3`
      (`admin_step_up_verified`)
    - `app.audit_logs`
      `2a3700d7-573e-41fb-9b0b-3580ac44493f`
      (`production_control_approval_recorded`)
    - `app.audit_logs`
      `476bf78f-cff4-4949-a5df-8ef8334089e7`
      (`feature_flag_status_changed`)

What this proves:

- feature-flag and theme review is attached to Supabase-backed tables on
  staging, not only in-memory local review state
- durable audit rows already exist for control changes
- production-sensitive provider controls now have one honest hosted staging
  proof with fresh step-up, explicit approval, durable override, and durable
  audit rows
- the proven provider save still keeps Luma non-live because the production
  environment flag was written as `scheduled`, not `enabled`

## Hosted review-packet storage proof

The packet-storage migration is now applied on hosted staging too:

- `app.review_packet_records` exists on staging with RLS enabled
- the packet functions now exist on staging:
  - `app.current_review_packet_role()`
  - `app.upsert_review_packet_record(...)`
- the Supabase security advisor is still clean after this follow-up migration:
  - security advisor: `0` lints

Durable packet rows now recorded on staging:

- pilot scope:
  - `MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE` = `` `action_started` ``
  - row id: `e5ed5380-caa9-4bac-bda9-8ea944bfbe6e`
- production launch:
  - `MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF` = `fnlhontvvprwgooevzdl`
  - row id: `6090cd26-e1be-4098-bfd6-22b1380aeb14`

Audit proof from the same write pass:

- `review_packet_recorded`
  - target id: `e5ed5380-caa9-4bac-bda9-8ea944bfbe6e`
  - reason: `Primary approver approved action_started as the first hosted write.`
- `review_packet_recorded`
  - target id: `6090cd26-e1be-4098-bfd6-22b1380aeb14`
  - reason:
    `Production Supabase project shell exists and still needs approved app migrations.`

What this proves:

- pilot-scope and production-launch packet values are no longer env-only
  placeholders on staging
- the packet lane now has its own durable table, audited write function, and
  matching audit rows
- the remaining packet gap is a clean signed-in replay on `/admin/pilot-scope`
  and `/admin/launch-gate`, not uncertainty about whether the storage path
  exists

## What is now honestly proven

- the signed-in reviewer path through `staging.mymedlife.org` is real
- role-routed hosted readback exists for member, leader, staff, and DS admin
- the approved first hosted write `action_started` has authoritative hosted
  event, integration-event, and audit proof
- proof metadata submission readback exists on the same assignment chain
- leader review readback exists without opening leader decision writes
- the outbox stays blocked for the first hosted write and disabled for the proof
  metadata loop
- the DS/Admin feature-flag and theme routes now have hosted Supabase-backed
  control-layer readback with durable audit posture
- the Luma event / RSVP / attendance / points / leaderboard loop is separately
  proven on hosted staging
- the focused DS admin review routes now point at the exact Luma pilot evidence
  rows instead of the broader admin dataset

## What is still not proven here

- leader decision write approval or request-changes write
- HQ proof decision write
- proof upload
- public proof sharing
- broader chapter/admin mutation writes
- production auth
- production deployment
- external sends beyond the separately approved blocked/disabled staging rows

## What this means for the next phase

The honest next phase is no longer "discover whether staging works."
That part is proven.

The next phase moving toward production is:

1. close Phase 2 externally with the current hosted evidence recorded in review
   systems
2. keep the pilot narrow to one chapter and one workflow
3. stand up the separate production environment and ownership model
4. promote only the next approved live-pilot writes in sequence
5. keep external systems off until each family gets its own approval gate
