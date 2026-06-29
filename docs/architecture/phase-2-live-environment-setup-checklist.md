# Phase 2 Live Environment Setup Checklist

Date: 2026-06-29

Status:
- local implementation is green
- staging remains the reviewer target
- hosted reviewer proof now exists for signed-in route access, durable control readback, and the approved staging-only Luma loop
- the remaining hosted closeout work is reviewer capture, owner signoff, and production-foundation setup rather than discovering whether the staging loop works
- production Supabase exists, but production rollout is not approved from this checklist

## Purpose

This checklist is the documentation version of the production environment packet
shown on `/admin/launch-gate`.

It exists so the team can review the production Supabase and Vercel setup
requirements in one place without exposing secrets and without treating repo
readiness as launch approval.

## Current Truth

- `staging.mymedlife.org` is still the reviewer target.
- The staging rollout-control migration is now applied on the hosted Supabase
  project `rceupryepjgkdeqgxzrc`.
- Hosted staging now contains the durable rollout-control tables:
  - `app.feature_flag_overrides`
  - `app.feature_flag_audit_records`
  - `app.theme_snapshots`
  - `app.theme_audit_records`
  - `app.admin_step_up_sessions`
  - `app.production_control_approvals`
- The staging Supabase security advisor is clean after the helper search-path
  fix applied on 2026-06-29.
- The production Supabase security advisor is also clean, but that production
  project is still only an empty shell and not a launched app environment yet.
- The current repo now allows signed-in hosted staging reviewer sessions to use
  Supabase-backed reads without widening anonymous preview traffic into the
  live read model.
- Hosted staging reviewer proof now exists for signed-in route access,
  Supabase-backed rollout controls, and the approved Luma event / RSVP /
  attendance / points loop.
- Read-only Supabase inspection on 2026-06-29 confirms hosted staging now has:
  - `16` applied Supabase migrations
  - `1` `action_started` event row
  - `1` `evidence_submitted` event row
  - `4` staged RSVP rows
  - `5` staged attendance-import rows
  - `1` attendance-backed points row totaling `20` points
  - `14` disabled `n8n` outbox rows
  - `1` disabled `hubspot` outbox row
  - `0` sent outbox rows
  - `0` approved live-send rows
- The remaining Phase 2 closeout work is no longer proving the hosted
  `action_started`, proof-loop, or Luma data path exists. The remaining work is
  capturing the clean reviewer packet, confirming role readback on the approved
  routes, and recording final owner signoff externally.
- Production Supabase project `fnlhontvvprwgooevzdl` now exists and is healthy,
  but read-only inspection on 2026-06-29 also showed:
  - `0` `app.*` base tables
  - `0` visible `supabase_migrations` tables
  That means production project creation is done, but production schema rollout
  has not started yet.
- The narrow staging-only Luma loop is the only approved external-family
  exception under review:
  - event create/update
  - RSVP writeback
  - attendance import
  - points and leaderboard readback
- HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, AI actions, and any
  non-approved Luma behavior stay off.
- Local verification is green:
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm supabase:test`

## Production Environment Packet

### 1. Production Supabase project

Required evidence:
- Separate production Supabase project reference is recorded without printing
  service keys.
- Approved migration list and migration owner are named before any hosted
  production apply.
- RLS/security advisor output is captured after approved migrations.
- Production seed and user-provisioning plan is limited to the tiny pilot
  cohort.

Safe defaults:
- Staging project remains `rceupryepjgkdeqgxzrc`.
- Production project remains `fnlhontvvprwgooevzdl`, separate from staging.
- Treat the production project as an empty shell until approved app migrations
  are actually applied.
- No production migration is applied from this checklist.

### 2. Production Vercel environment

Required evidence:
- Production Vercel project or production target is confirmed for
  `mymedlife-pwa`.
- Production deploy source branch and rollback deployment target are recorded.
- Vercel SSO / access posture is chosen for pilot reviewers and real users.

Safe defaults:
- Preview branch deployments remain the review lane.
- Production env vars stay unset until approved.
- No production promotion is performed from this checklist.

### 3. Production environment variables

Required evidence:
- `NEXT_PUBLIC_SUPABASE_URL` points to production Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the production browser-safe key.
- The server-only Supabase service key is set without `NEXT_PUBLIC_`.
- `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` is set only after approved control
  layer migration rollout.
- Luma pilot variables are scoped only to the approved pilot calendar.

Environment manifest:

- Browser-safe public values
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only Supabase values
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DB_URL`
- App data and control-layer mode
  - `MYMEDLIFE_DATA_SOURCE`
  - `MYMEDLIFE_CONTROL_LAYER_SOURCE`
  - `MYMEDLIFE_ENABLE_STAGING_REVIEW_AUTH`
- Approved Luma pilot only
  - `LUMA_API_KEY`
  - `LUMA_CALENDAR_ID`
  - `MYMEDLIFE_LUMA_ENVIRONMENT`
  - `MYMEDLIFE_ENABLE_LUMA_WRITES`
  - `MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES`
  - `MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES`
  - `MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT`
- External systems held off
  - `HUBSPOT_*`
  - `N8N_*`
  - `WAREHOUSE_*`
  - `POWER_BI_*`
  - `OPENAI_API_KEY`
  - `SMS_*`
  - `EMAIL_*`

Safe defaults:
- Never expose service role, Luma API, HubSpot, n8n, warehouse, Power BI,
  SMS/email, or AI keys through `NEXT_PUBLIC_`.
- Keep non-approved integration env vars unset or off.
- Record presence and scope only; do not paste secret values into docs, PRs,
  Linear, or logs.

### 4. Rollout control layer readiness

Required evidence:
- The rollout-controls migration is applied in the target environment so
  `app.feature_flag_overrides`, `app.feature_flag_audit_records`,
  `app.theme_snapshots`, `app.theme_audit_records`,
  `app.admin_step_up_sessions`, `app.production_control_approvals`, and the
  audited write functions are readable.
- `/admin/feature-flags` and `/admin/theme` render without the persistence
  warning in the target environment.
- One DS/Admin feature-flag save and one theme-token save record visible audit
  rows before the environment is treated as control-layer ready.
- Production-sensitive flag/theme changes must create a visible
  `production_control_approvals` row before the durable control mutation is
  treated as review-complete.
- `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` is only enabled after that
  DS/Admin control-layer read/write proof is captured.

Safe defaults:
- Keep anonymous staging visitors on the default preview posture unless they
  are in the approved reviewer sign-in path.
- Do not treat `Supabase-backed` UI copy alone as proof; the pages must stop
  showing the persistence warning.
- Production remains blocked if reviewers cannot read or audit the feature-flag
  and theme tables in that environment.

### 5. Auth callback URLs and role routing

Required evidence:
- Production callback URL for `https://www.mymedlife.org` is approved.
- Staging callback URL for `https://staging.mymedlife.org` stays separate.
- Role-routing smoke proves member, leader, staff, DS Admin, Super Admin, and
  eligible traveler paths.
- Wrong-workspace URL access is blocked server-side.

Safe defaults:
- One sign-in surface remains the entry point.
- Backend role and scope decide the destination after auth.
- Staff preview remains read-only unless separately approved.

### 6. DNS and domain plan

Required evidence:
- `staging.mymedlife.org` remains the reviewer target until production cutover.
- `www.mymedlife.org` production DNS owner and registrar access are named.
- Cutover, rollback, and cache/DNS propagation plan are documented.

Safe defaults:
- Do not repoint production DNS from this checklist.
- Keep staging and production hostnames visibly separate.
- Record DNS owner and rollback target before pilot invites.

### 7. Backup and restore path

Required evidence:
- Production Supabase backup posture is confirmed.
- Restore drill owner is named.
- Pilot data repair path is documented for assignment, RSVP, attendance,
  points, and audit rows.

Safe defaults:
- Do not invite real users until backup posture is named.
- Do not enable irreversible writes without a repair path.
- Keep production proof uploads disabled until storage restore policy is
  approved.

### 8. Rollback and support owners

Required evidence:
- Rollback owner is named.
- Support/pause channel is named.
- DS owner is named.
- HQ/admin owner is named.
- Stop rules and student communication plan are recorded before invitations.

Safe defaults:
- Pilot owner and rollback owner stay visible in the launch packet.
- One support/pause channel is used during the pilot.
- No broad launch happens without day-one support coverage.

## What Must Stay Blocked

- production migrations
- production auth claims
- proof uploads
- public proof sharing
- broad browser writes
- HubSpot writes
- Shopify writes
- n8n execution
- warehouse / Power BI writes
- SMS / email sends
- AI actions
- any non-approved Luma behavior outside the staging-only pilot loop

## Reviewer Path

Use these surfaces together:

- `/admin/launch-gate`
- `/admin/luma-live-pilot`
