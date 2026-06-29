# myMEDLIFE Staging Reviewer Access Guide

Date: 2026-06-26

Status:
- draft
- review-only
- staging reviewer path is the approved default; hosted proof is still pending
- hosted Supabase rollout-control tables now exist, but the reviewer proof pass is still pending

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

- hosted staging Supabase now contains `app.feature_flags` and
  `app.theme_settings`
- the staging Supabase security advisor is clean after the rollout-control
  helper fix
- the app can still remain in preview/mock posture if the staging Vercel
  environment has not switched to Supabase-backed read mode yet

## What The Reviewer Should Look For

- The browser should clearly show that the reviewer is signed in before any
  route review begins.
- The login form should accept one of the seeded reviewer emails and the shared
  review password `password`.
- The app should remain on the approved staging review path.
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
- Hosted staging evidence for the approved reviewer path and first narrow write.
- Hosted staging evidence for the Luma event -> RSVP -> attendance import ->
  points/leaderboard readback loop.
- Hosted staging proof that the rollout-control layer is readable and audited
  in that environment.
- Hosted staging proof that Vercel envs now point the app at Supabase-backed
  read mode instead of preview/mock data.
- Readback screenshots or route evidence from the approved staging session.

## Escalation Rule

If a reviewer cannot get through the handoff with the approved identity, stop
and ask the launch owners to confirm the staging access path before trying to
continue.
