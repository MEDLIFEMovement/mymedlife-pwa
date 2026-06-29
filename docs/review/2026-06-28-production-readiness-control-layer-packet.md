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
  - `app.feature_flag_overrides`: `1`
  - `app.feature_flag_audit_records`: `2`
  - `app.theme_snapshots`: `3`
  - `app.theme_audit_records`: `3`
  - `app.admin_step_up_sessions`: `0`
  - `app.production_control_approvals`: `0`

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
- The control layer is no longer waiting on staging alias promotion. The
  remaining blocker is the still-incomplete Luma attendance-to-points proof plus
  the separate production environment and owner decisions.
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
  - `0` rows included check-in attendance
  - no secrets returned
- Luma's public API documentation now explains the remaining pilot gap more
  precisely:
  - myMEDLIFE can call public endpoints for event create/update, guest add,
    guest status updates, and guest list readback with `checked_in_at`
  - the public API does not document a public attendee check-in write endpoint
  - for the controlled pilot, a human host must still check in one attendee in
    Luma before attendance import can prove points materialization
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
- The linked chapter event for `evt-bJE178Q02N5DaLH` is still
  `published` with `attendance_count = 0` and `points_rows = 0`.
- Existing earlier event proof remains in staging audit history from the first
  hosted create pass.

Remaining before live pilot:

- Because the imported guest row did not include a Luma check-in, the hosted
  event above created `0` points rows for that event. One reviewed example with
  checked-in attendance is still required before claiming fully live
  attendance-to-points materialization.
- That remaining proof is now understood as an operational step, not an unknown
  app bug: someone with Luma host access must perform one real check-in in Luma,
  then rerun `/admin/luma-live-pilot` attendance import and confirm the
  resulting points/leaderboard readback.
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

- Production Supabase owner: pending DS/platform.
- Production Vercel owner: pending DS/platform.
- DNS owner: pending platform/HQ.
- Backup/restore owner: pending DS/platform.
- Rollback owner: Nick unless reassigned.
- Pilot owner: Nick unless reassigned.
- Day-one support owner: pending HQ.

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
