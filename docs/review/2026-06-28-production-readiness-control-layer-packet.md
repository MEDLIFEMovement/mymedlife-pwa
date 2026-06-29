# Production Readiness Control Layer Packet

## Current Verdict

myMEDLIFE is still a controlled pilot candidate, not broadly production-ready.
This packet moves the app closer to production by making admin controls durable,
audited, and approval-gated.

## What This Slice Adds

- Supabase schema for durable feature flags, theme snapshots, audit records,
  step-up sessions, and production approval records.
- RLS-protected tables for DS Admin and Super Admin control surfaces.
- Audited database functions for feature flag changes and theme snapshot saves.
- Production-sensitive provider flags require:
  - explicit confirmation
  - approval reference
  - fresh DS/Admin step-up session
  - explicit `production_control_approvals` record before the durable flag change runs
- Production theme publish requires:
  - explicit confirmation
  - approval reference
  - fresh DS/Admin step-up session
- Production theme rollback / restore now records the same explicit approval trail before the durable snapshot change runs.
- `/admin/feature-flags` and `/admin/theme` now report whether they are using
  in-memory fallback or Supabase-backed control storage.
- `/admin/feature-flags` and `/admin/theme` now expose a reviewable production
  approval trail section so DS/HQ can see recent durable
  `production_control_approvals` rows in the app, not only in Supabase.

## Production Supabase Readiness

Required before production pilot:

- Create separate production Supabase project.
- Apply approved migrations only after DS/platform approval.
- Confirm RLS policies for:
  - `app.feature_flag_overrides`
  - `app.feature_flag_audit_records`
  - `app.theme_snapshots`
  - `app.theme_audit_records`
  - `app.admin_step_up_sessions`
  - `app.production_control_approvals`
- Confirm `anon` key is browser-safe and service role key is server-only.
- Confirm backups and restore drill owner.
- Confirm production seed/user provisioning plan for the tiny pilot cohort.
- Confirm production Auth callback URLs.

## Hosted Staging Control-Layer Evidence

Applied to hosted staging Supabase project `rceupryepjgkdeqgxzrc`:

- `20260628215346 production_control_layer`
- `20260628221748 fix_control_layer_advisors`
- `20260628232529 allow_authenticated_active_theme_reads`

Readback confirmed:

- Control tables exist for step-up sessions, production approvals, feature flag
  overrides, feature flag audits, theme snapshots, and theme audits.
- RLS is enabled on all six control tables.
- DS Admin / Super Admin select policies exist for the control tables.
- The audited control functions exist with explicit search paths.
- Current hosted staging totals after reviewer-visible proof:
  - `app.feature_flag_overrides`: `2`
  - `app.feature_flag_audit_records`: `3`
  - `app.theme_snapshots`: `3`
  - `app.theme_audit_records`: `3`
  - `app.admin_step_up_sessions`: `1`
  - `app.production_control_approvals`: `1`

Hosted Supabase advisor result after the follow-up migration:

- Security advisor: `0` lints.
- Performance advisor still reports existing broader-schema performance items,
  plus expected unused-index notices on newly created empty control tables. These
  do not enable writes or relax RLS.

Local verification after hosted application:

- `supabase test db --local supabase/tests/database/rls_production_control_layer.test.sql`
  passed: `15` tests.
- `pnpm vitest run tests/feature-flags-theme-services.test.ts tests/admin-integrations-step-up.test.ts`
  passed: `2` files, `13` tests.
- `pnpm vitest run tests/feature-flag-durable-update.test.ts tests/theme-published-css-durable.test.ts tests/luma-live-pilot-durable-control.test.ts tests/admin-integrations-step-up.test.ts`
  passed: `4` files, `9` tests.
- Follow-up durable approval verification:
  - `pnpm vitest run tests/feature-flags-theme-services.test.ts tests/theme-published-css-durable.test.ts tests/feature-flag-durable-update.test.ts tests/theme-durable-update.test.ts tests/admin-control-actions.test.ts`
  - passed: `5` files, `23` tests

## Production Vercel Readiness

Required environment variables:

- `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase`
- `MYMEDLIFE_AUTH_MODE=staging_supabase` for staging review, production mode only
  after final auth approval.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only secrets must not use `NEXT_PUBLIC_`.
- Luma production write variables stay unset/off until separately approved.
- n8n, HubSpot, warehouse, Power BI, SMS/email, and AI write variables stay
  unset/off until separately approved.

Required platform checks:

- Production Vercel project/environment separated from staging.
- Production domain and DNS owner named.
- Rollback target and rollback owner named.
- Logs/alerts destination named.
- Staging smoke passes before production promotion.

Current Vercel evidence:

- Vercel project `mymedlife-pwa` exists under team
  `nellis-6036's projects`.
- The current signed-in staging target is the latest `READY` deployment for
  `feat/modular-flags-theme-admin`:
  - deployment id: `dpl_H7c9SpH2zJhmZvZBbaR5YEVaowg9`
  - commit: `23ad353`
  - branch: `feat/modular-flags-theme-admin`
  - PR: `#126`
  - alias: `staging.mymedlife.org`
- Vercel CLI access was confirmed as `nellis-6036`.
- `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` was added as a non-secret Preview
  variable for both active staging branches:
  - `feat/modular-flags-theme-admin`
  - `feat/MED-494-hosted-staging-read-write-proof`

Remaining hosted UI proof:

- `https://staging.mymedlife.org/login` still redirects through Vercel SSO, so
  a signed-in reviewer session is still required to visually confirm hosted UI
  state.
- Hosted preview proof now exists for durable control readback and form submits:
  - `/admin/feature-flags` shows `Control storage: Reading and writing ... from Supabase.`
  - a DS Admin hosted feature-flag save created a durable override row, a
    feature-flag audit row, and an `audit_logs` row with reason
    `Hosted preview feature flag proof save`.
  - `/admin/theme` shows the same Supabase-backed control storage posture and a
    DS Admin hosted theme draft save now creates a durable theme snapshot, a
    theme audit row, and an `audit_logs` row with reason
    `Hosted preview theme proof save`.
- Hosted route-level reviewer proof was re-checked on `2026-06-29T02:30:40Z`:
  - `/admin/feature-flags` shows `Control storage: Reading and writing ... from Supabase.`
  - `/admin/theme` shows the same Supabase-backed control-storage posture.
  - `/admin/audit-log`, `/admin/integration-outbox`, `/admin/pilot-scope`, and
    `/admin/first-write` all render against the signed-in hosted staging
    session.
- A fresh hosted auth replay later on `2026-06-29` reproduced the same DS-admin
  reviewer path directly against the app login form:
  - the seeded hosted sign-in reached the expected final role routes for
    member, leader, staff, and DS admin
  - the signed-in DS-admin route set the hosted app session cookie and removed
    the `no Supabase session token is active` fallback on
    `/admin/feature-flags`
  - the same session re-read `/admin/theme`, `/admin/first-write`,
    `/admin/proof-write`, `/admin/luma-live-pilot`,
    `/admin/integration-outbox?source=luma-live-pilot`,
    `/admin/audit-log?source=luma-live-pilot`, and `/admin/pilot-scope`
- The control layer is no longer waiting on staging alias promotion. The
  remaining blocker is no longer whether the dangerous control path exists.
  That hosted proof now exists too:
  - DS Admin re-auth on `/admin/integrations` created
    `app.admin_step_up_sessions` row
    `d7d8dc57-e628-4fdd-bf69-c0428d6711a8`
  - a production-environment provider save on `/admin/feature-flags?env=production`
    recorded `app.production_control_approvals` row
    `3b918432-f843-4051-a040-9c9b90601ecc`
  - the same save wrote production override row
    `c16f5f52-9269-44be-a8c7-8adef1859ff8`
    for `integration_luma`
  - the save used `scheduled`, not `enabled`, so the hosted proof stayed
    non-live while still exercising confirmation, approval reference, fresh
    step-up, and durable audit behavior
  - matching audit log rows now exist for:
    - `admin_step_up_verified`
    - `production_control_approval_recorded`
    - `feature_flag_status_changed`
- The remaining blocker is now the separate hosted `action_started` packet,
  proof-metadata-to-leader-review packet, and the separate production
  environment and owner decisions.
- Production environment variables remain unset/off for this control layer.

## Production Environment Packet In The App

The `/admin/launch-gate` route now includes a production environment packet for
DS Admin / Super Admin reviewers. It makes these items visible without setting
production configuration or exposing secrets:

- production Supabase project
- production Vercel environment
- production environment variables
- auth callback URLs and role routing
- DNS and domain plan
- backup and restore path
- rollback and support owners

The packet records presence, ownership, and evidence requirements only. It must
show `Secrets 0` for every item. No service role key, Luma API key, HubSpot key,
n8n credential, warehouse credential, Power BI secret, SMS/email secret, or AI
key should appear in docs, PR comments, Linear comments, browser HTML, or logs.

The route can now also show safe recorded values for those items through the
names-only `MYMEDLIFE_PRODUCTION_*` packet metadata fields. Those fields are for
project refs, owners, URLs, and runbook names only. They are never a place to
paste real credentials.

## Luma Event Loop Staging Proof

Approved staging scope:

- Event create/update from myMEDLIFE to Luma.
- RSVP writeback to Luma.
- Attendance import from Luma.
- Points and leaderboard readback visible in the myMEDLIFE review surface.
- No n8n execution.
- No production Luma setup.

Hosted proof recorded on `2026-06-29T02:30:40Z`:

- Signed in to `staging.mymedlife.org` as seeded DS Admin
  `ds.admin@mymedlife.test` through the hosted login route.
- Created a staging Luma event from myMEDLIFE:
  - event id `evt-bJE178Q02N5DaLH`
  - redirect proof: `Created a Luma event from myMEDLIFE staging ... Staging proof recorded.`
- Wrote one RSVP back to Luma for `nellis@medlifemovement.org` with Luma email
  sending suppressed.
- Imported attendance for the same event:
  - `1` approved guest row imported
  - `0` rows included check-in attendance on the first hosted import run
  - no secrets returned
- Luma's public API documentation explains why the first hosted import could
  stop short of points proof:
  - myMEDLIFE can call public endpoints for event create/update, guest add,
    guest status updates, and guest list readback with `checked_in_at`
  - the public API does not document a public attendee check-in write endpoint
  - for the controlled pilot, a human host-side Luma check-in is still the
    approved path before attendance import can materialize points
- Durable staging rows now prove the hosted loop:
  - `app.luma_event_links`: `1` linked row for `evt-bJE178Q02N5DaLH`
  - `app.chapter_events`: `1` linked chapter event row for the hosted pilot
  - `app.events`: `3` rows for the event create, RSVP, and attendance-import
    sequence
  - `app.audit_logs`: `2` rows mentioning `evt-bJE178Q02N5DaLH`
    (`luma_event_upsert_recorded` and `luma_rsvp_recorded`)
  - `app.integration_events`: `3` recorded rows
    (`luma_event_linked`, `luma_rsvp_recorded`,
    `luma_attendance_imported`)
  - `app.automation_outbox`: `3` disabled rows for blocked downstream sends
    (`luma_event_external_send_blocked`,
    `luma_rsvp_external_send_blocked`,
    `luma_attendance_external_send_blocked`)
- Role-surface readback was re-checked on hosted staging:
  - member `/app`: Luma, RSVP, points, leaderboard, and attendance copy visible
  - leader `/leader`: Luma-backed events, RSVP conversion, attendance, and
    points validation copy visible
  - coach/staff `/staff?view=chapters`: event-and-points pulse visible
  - admin `/admin/luma-live-pilot`, `/admin/audit-log`, and
    `/admin/integration-outbox`: hosted proof and safety routes visible
- A later hosted reviewer replay on the same date used the approved Luma guest
  check-in path and reran attendance import for `evt-bJE178Q02N5DaLH`:
  - `1` approved guest row imported
  - `1` row included check-in attendance
  - reviewer-visible counters on `/admin/luma-live-pilot` moved to:
    - `RSVPs 4`
    - `Attendance 2`
    - `Points 20`
    - `Leaderboard Updated`
    - `Outbox sends 0`
  - this closes the honest Luma attendance-to-points gap for hosted staging
- Existing earlier event proof remains in staging audit history from the first
  hosted create pass and the later attendee-import replay.

Remaining before live pilot:

- The Luma event loop itself is no longer the honest blocker.
- The remaining hosted proof work is now the separate `action_started` packet,
  proof metadata to leader-review packet, and the final route-capture bundle
  that ties member, leader, staff, admin, audit, and outbox readback together.
- Audit/outbox proof now shows blocked downstream rows only; no unapproved send
  execution was enabled.
- Production Luma remains blocked until production calendar ownership,
  rollback/disable ownership, and production env variables are approved.

## Small Live Pilot Gate

Pilot shape:

- One chapter only.
- 5-15 users.
- Event / RSVP / attendance / points / leaderboard loop only.
- Manual-first support.
- No broad launch.

Approved-live scope should include only:

- User sign-in and role routing.
- Event discovery.
- Luma event create/update for the approved pilot calendar only.
- RSVP.
- RSVP writeback to the approved pilot Luma event only.
- Attendance readback/import from the approved pilot Luma calendar only.
- Points and leaderboard readback.
- Admin audit/outbox visibility.

Blocked until separate approval:

- Any Luma behavior outside the approved pilot event loop.
- n8n execution.
- HubSpot writes.
- Warehouse / Power BI writes.
- SMS/email sends.
- AI actions.
- Broad multi-chapter rollout.

## Owner Blanks

- Production Supabase owner: DS/platform ownership approved; named individual still required before live pilot.
- Production Vercel owner: DS/platform ownership approved; named individual still required before live pilot.
- DNS owner: platform/HQ ownership approved; named individual still required before live pilot.
- Backup/restore owner: DS/platform ownership approved; named individual still required before live pilot.
- Rollback owner: Nick confirmed unless explicitly reassigned later.
- Pilot owner: Nick confirmed unless explicitly reassigned later.
- Day-one support owner: HQ support lane approved; named individual still required before live pilot.
- Support/pause channel: dedicated launch Slack channel with email backup approved; exact channel name still required before live pilot.

## Review Routes

- `/admin/feature-flags`
- `/admin/theme`
- `/admin/luma-live-pilot`
- `/admin/integration-outbox`
- `/admin/audit-log`
- `/admin/launch-gate`
- `/admin/operations`
- `/admin/pilot-scope`

## What Is Intentionally Not Included

- Hosted production migration application.
- Production Supabase project creation.
- Production Vercel env variable changes.
- Production Luma setup.
- n8n execution.
- External sends.
- Broad launch approval.
