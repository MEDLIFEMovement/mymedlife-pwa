# myMEDLIFE Production Launch Checklist

Date: 2026-06-29

Status:
- review-ready staging, not live-ready
- staging hosted proof now exists for the first hosted write, proof metadata
  loop, role-routed readback, and the approved Luma event loop
- production launch is now blocked by external signoff and production-foundation
  setup, not by lack of staging evidence
- hosted staging now has the rollout-control tables and clean Supabase security
  advisor output
- production Supabase exists as a separate healthy project shell, but it still
  has `0` `app.*` tables and no visible migration history in that environment

## What Is Already Proven In Repo

- Role-based shells exist for member, leader, staff, admin, and SLT Prep.
- Login and route guards keep workspace access role-aware.
- Launch-readiness surfaces exist for production gate, release readiness, pilot readiness, design QA, system health, and operations.
- Tests and build are green in the current worktree.
- The app keeps HubSpot, Shopify, n8n, warehouse, Power BI, SMS, email, and AI writes disabled by default; only the approved staging-only Luma loop is in scope for hosted proof.

## What Is Already Proven On Hosted Staging

- Reviewer access works through `https://staging.mymedlife.org` with Vercel SSO
  first, then the seeded myMEDLIFE login path.
- The authoritative hosted first-write chain exists on assignment
  `50000000-0000-4000-8000-000000000002` with matching internal event,
  integration-event, and audit-log rows for `action_started`.
- The smallest proof metadata loop exists on the same assignment with a visible
  `evidence_submitted` event, matching audit row, and disabled outbox posture.
- The approved Luma event loop is proven in staging with:
  - `4` Luma event-link rows
  - `4` RSVP rows
  - `5` attendance-import rows
  - `1` attendance-backed points row totaling `20` points
  - `0` sent outbox rows
- The rollout-control layer is readable on hosted staging:
  - `app.feature_flag_overrides`
  - `app.feature_flag_audit_records`
  - `app.theme_snapshots`
  - `app.theme_audit_records`
  - `app.admin_step_up_sessions`
  - `app.production_control_approvals`
- The review-packet lane is now durable on hosted staging too:
  - `app.review_packet_records`
  - `app.current_review_packet_role()`
  - `app.upsert_review_packet_record(...)`
  - one pilot-scope row is recorded:
    `MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE =` `` `action_started` ``
  - one production-launch row is recorded:
    `MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF = fnlhontvvprwgooevzdl`
  - both rows have matching `review_packet_recorded` audit rows
- Hosted staging now also proves the production-sensitive admin-control path:
  - DS Admin step-up re-auth succeeds
  - one production approval row is recorded
  - one production-environment provider override row is recorded for
    `integration_luma`
  - that provider flag is set to `scheduled`, so the proof stays non-live

## What Still Blocks Live Pilot

1. Record and approve the current staging evidence externally.
   - Confirm the reviewer walkthrough still matches the approved path:
     Vercel SSO -> myMEDLIFE login -> seeded reviewer -> role-routed workspace.
   - Confirm `/admin/luma-live-pilot`, `/admin/audit-log?source=luma-live-pilot`,
     `/admin/integration-outbox?source=luma-live-pilot`, `/admin/feature-flags`,
     `/admin/theme`, `/admin/pilot-scope`, and `/admin/launch-gate` still match
     the current hosted proof packet.
   - Confirm the hosted proof is recorded in the review systems before any live
     pilot claim is made.
2. Execute the already-approved first hosted write and proof sequence on hosted staging.
   - The primary approver has already approved:
     - `staging.mymedlife.org` as the reviewer target
     - one small, one-chapter pilot
     - `action_started` as the first hosted write
     - metadata submit -> leader review -> audit trail as the smallest proof loop
     - external systems staying off for now
   - What is still missing now is the final signoff trail and
     production-foundation follow-through, not another blank approval field.
3. Confirm the production environment path for Supabase, Vercel, domain/DNS, secrets, and backup/restore.
   - Use the safe names-only `MYMEDLIFE_PRODUCTION_*` packet metadata values to
     record project refs, owners, URLs, and runbook names on `/admin/launch-gate`.
   - Do not paste real secrets into that packet.
   - Production Supabase project `fnlhontvvprwgooevzdl` already exists, but it
     still needs approved app migrations, auth callback configuration, env vars,
     backup/restore ownership, and a tiny pilot seed plan.
   - The durable packet storage and the signed-in packet readback are already
     proven on staging; the remaining gap is the missing owner decisions and
     production-foundation follow-through, not another unknown storage
     dependency.
4. Confirm the rollout-control layer is actually live in the target environment.
   - Hosted staging already has `app.feature_flag_overrides`,
     `app.feature_flag_audit_records`, `app.theme_snapshots`,
     `app.theme_audit_records`, `app.admin_step_up_sessions`, and
     `app.production_control_approvals`.
   - Hosted staging now also has one honest production-sensitive provider proof:
     fresh DS/Admin step-up, approval row, override row, and audit rows for
     `integration_luma`, with status `scheduled`.
   - `/admin/feature-flags` and `/admin/theme` must be promoted with the same
     posture in the actual production environment before the pilot is treated as
     live-ready.
   - Record the packet with names-only values such as
     `MYMEDLIFE_PRODUCTION_CONTROL_LAYER_STATUS` and
     `MYMEDLIFE_PRODUCTION_CONTROL_LAYER_PROOF_NOTE`.
   - `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` should only be treated as ready
     in production after equivalent environment proof exists there too.
5. Confirm monitoring, incident response, named support owner, support/pause channel, and rollback ownership.
6. Keep all external integrations disabled until a later approval gate.

## Production Launch Order

### 1. Environment ownership

- Create or confirm production Supabase.
- Create or confirm production Vercel project and environment variables.
- Confirm domain and DNS ownership.
- Confirm secret ownership and backup/restore posture.

### 2. Access and auth

- Reconfirm the hosted reviewer path and role-routed sign-in flow on the approved staging alias.
- Approve production auth callbacks and role routing.
- Verify member, leader, staff, admin, and SLT Prep access boundaries.

### 3. Safety gates

- Prove RLS and security checks.
- Confirm audit rows are written for every approved write path.
- Confirm proof storage and consent policy.
- Confirm device, accessibility, and offline/PWA review.

### 4. Pilot write path

- Approve the narrowest safe first hosted write.
- Keep the first proof/review loop small.
- Keep staging Luma event, RSVP, and attendance actions blocked unless the app
  can record the proof rows in Supabase at the same time.
- Keep uploads and external sends disabled until explicitly approved.

### 5. Controlled pilot

- Start with one chapter.
- Limit the pilot to the smallest named cohort.
- Keep support, pause, and rollback ownership explicit.
- Review pilot results before any expansion.

## Human Decisions Still Needed

- Nick: pilot scope and launch decision
- Kiomi: hosted proof review and launch gate approval
- DS: external integration hold, environment ownership, and security posture
- HQ ops: pilot support and pause channel
- Pilot primary approver: pause authority and rollback authority

## Rule Before Launch

Do not treat repo readiness as launch approval.
Do not enable live external sends or broad writes until the human approvals
above are recorded, the current staging proof is accepted externally, and the
production environment packet is complete.
