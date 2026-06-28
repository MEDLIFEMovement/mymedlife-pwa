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
- Production theme publish requires:
  - explicit confirmation
  - approval reference
  - fresh DS/Admin step-up session
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

## Luma Event Loop Staging Proof

Already proven on staging for the narrow approved scope:

- Event create/update from myMEDLIFE to Luma.
- RSVP writeback to Luma.
- Attendance import from Luma.
- No n8n execution.
- No production Luma setup.

Evidence recorded previously:

- Created Luma event id: `evt-T1xyktFsTCpCWY5`
- RSVP writeback succeeded for `nellis@medlifemovement.org`
- Attendance import returned `1` approved guest row
- GitHub PR #125 comment recorded evidence
- Linear `MED-494` recorded evidence

Remaining before live pilot:

- Readback surfaces must show points/leaderboard impact for member, leader,
  staff, and admin after the approved staging data path.
- Audit/outbox must show zero unapproved sends.
- Production Luma remains blocked.

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
- RSVP.
- Attendance readback/import.
- Points and leaderboard readback.
- Admin audit/outbox visibility.

Blocked until separate approval:

- Production Luma writes.
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
