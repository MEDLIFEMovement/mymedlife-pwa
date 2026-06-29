# myMEDLIFE Staging Reviewer Access Guide

Date: 2026-06-29

Status:
- draft
- review-only
- staging reviewer path is the approved default
- hosted route-level proof exists, including the Luma attendance-to-points readback
- hosted Supabase rollout-control tables now exist and are readable in the signed-in reviewer path
- hosted role-routed login proof and the authoritative first-write/proof-loop route evidence are now recorded

## What This Guide Covers

This guide describes the currently observed staging review path for
`https://staging.mymedlife.org` so a human reviewer can follow the existing
handoff without guessing.

It does **not** approve a production launch.
It does **not** change any write, upload, or external-send posture.
It does **not** replace the need for a named approved reviewer account if the
team wants a different identity than the approved default.

## Current Observed Path

1. Open `https://staging.mymedlife.org` in the browser.
2. Expect the request to be intercepted by Vercel SSO before the myMEDLIFE app
   loads.
3. Complete the Vercel sign-in step with the approved reviewer identity for the
   staging access path.
4. After Vercel signs you in, continue to the app using the redirect that is
   returned by the SSO flow.
5. Expect the app to land on the myMEDLIFE sign-in page with the title
   `Local Sign In | myMEDLIFE` and the heading `Sign in to myMEDLIFE.`
6. Sign in with a seeded reviewer account:
   - `ds.admin@mymedlife.test`
   - `super.admin@mymedlife.test`
   - shared review password: `password`
7. Confirm the signed-in reviewer is routed into the admin workspace, not left
   on the login page and not sent into a member-facing route.
8. Use that signed-in session to inspect the required read-only review routes
   and hosted evidence surfaces.

Fresh hosted recheck on 2026-06-29 also confirmed:

- the same seeded login path issues a hosted app session cookie on staging
- after that app session exists, the signed-in DS Admin route can read the
  Supabase-backed control layer instead of the in-memory fallback
- the clean route evidence is the final URL plus the page copy shown after the
  signed-in redirect, not the Vercel SSO cookie by itself

Current proven examples from 2026-06-29:

- member: `/app` and `/rush-month/actions/50000000-0000-4000-8000-000000000002`
- leader:
  `/rush-month/review?assignmentId=50000000-0000-4000-8000-000000000002&evidenceItemId=3e7b2ab6-8770-488f-9637-90cbaa863b62`
- staff: `/staff?view=chapters`
- DS admin:
  `/admin/audit-log`, `/admin/integration-outbox`, `/admin/pilot-scope`,
  `/admin/first-write`, `/admin/feature-flags`, `/admin/theme`,
  `/admin/luma-live-pilot`

## Concrete Browser Observation

Observed again on 2026-06-29:

- `https://staging.mymedlife.org/login` returned `302 Found`
- `https://staging.mymedlife.org/admin/luma-live-pilot` returned `302 Found`
- both redirects pointed first to `https://vercel.com/sso-api?...`
- this confirms that the first visible gate is still Vercel SSO, not the app
  login form by itself

Implication:

- the reviewer must successfully complete the Vercel SSO step before any app
  route evidence can be treated as valid staging proof
- after that handoff, the reviewer should still confirm that the myMEDLIFE app
  itself shows the seeded sign-in form and then a signed-in reviewer session
  before trying `/admin/luma-live-pilot`, `/admin/audit-log`,
  `/admin/integration-outbox`, or any member/leader/staff readback surface

Additional current truth from 2026-06-29:

- hosted staging Supabase now contains:
  - `app.feature_flag_overrides`
  - `app.feature_flag_audit_records`
  - `app.theme_snapshots`
  - `app.theme_audit_records`
  - `app.admin_step_up_sessions`
  - `app.production_control_approvals`
- the staging Supabase security advisor is clean after the rollout-control
  helper fix
- the app can still remain in preview/mock posture if the staging Vercel
  environment has not switched to Supabase-backed read mode yet
- hosted DS/Admin reviewer sign-in succeeded after the Vercel SSO handoff
- a fresh DS Admin sign-in on the same date reached
  `/admin/feature-flags?env=staging` and rendered:
  - `Control storage: Reading and writing feature flags, theme snapshots, approvals, step-up sessions, and audit rows from Supabase.`
- the same signed-in DS Admin session also re-read:
  - `/admin/theme` with `Persistence supabase`
  - `/admin/first-write` with `Connected preview data` and the hosted
    `action_started` readback packet
  - `/admin/proof-write` with the hosted `Proof metadata packet`
  - `/admin/luma-live-pilot` with `Event writes On`, `RSVP writes On`,
    `Attendance import On`, and `Production Off`
- the approved Luma loop now has hosted proof for RSVP write, attendance
  import, points, leaderboard, and zero unauthorized outbox sends
- hosted member, leader, staff, and DS/Admin role-routed readback was also
  rechecked from the same staging alias
- the clean authoritative Phase 2 write/readback proof uses assignment
  `50000000-0000-4000-8000-000000000002`, not assignment `...0001`
- see `docs/review/2026-06-29-med-500-hosted-staging-route-and-write-proof.md`
  for the exact route list and row-level proof chain

## What The Reviewer Should Look For

- The browser should clearly show that the reviewer is signed in before any
  route review begins.
- The login form should accept one of the seeded reviewer emails and the shared
  review password `password`.
- The app should remain on the approved staging review path.
- `/admin/feature-flags` should stop saying `Using in-memory admin controls
  because no Supabase session token is active.` once the reviewer is actually
  signed in through hosted Supabase Auth.
- The reviewer should be able to open `/admin/luma-live-pilot` and compare it
  against `/app`, `/chapter`, `/staff`, `/admin/audit-log`,
  `/admin/integration-outbox`, `/admin/feature-flags`, and `/admin/theme`.
- The data-source banner should remain in safe preview posture for anonymous
  traffic, but a signed-in reviewer session on the latest build should switch
  to Supabase-backed readback where the hosted proof requires it.
- The `/admin/luma-live-pilot` route should show `Proof rows` as `Ready`
  before any event, RSVP, or attendance control is used. If it shows
  `Blocked`, stop there and do not treat the hosted Luma proof as valid yet.
- `/admin/feature-flags` and `/admin/theme` should load without the
  `Persistence not available yet` warning before the environment is treated as
  rollout-control ready.
- No new writes, uploads, external sends, or production actions should be
  enabled during this review.

## What Is Still Missing

- The exact named reviewer account to use for the hosted proof run, if it is
  different from the default reviewer identity.
- External recording of the current hosted proof in the review systems.
- Final screenshots if reviewers want visual attachments in addition to the
  current route-and-row evidence note.
- Named-owner confirmation for the pilot packet and final approval language.

## Escalation Rule

If a reviewer cannot get through the handoff with the approved identity, stop
and ask the launch owners to confirm the staging access path before trying to
continue.
