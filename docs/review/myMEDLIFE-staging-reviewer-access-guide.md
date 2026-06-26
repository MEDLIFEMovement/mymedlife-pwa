# myMEDLIFE Staging Reviewer Access Guide

Date: 2026-06-26

Status:
- draft
- review-only
- staging reviewer path is the approved default; hosted proof is still pending

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
5. Confirm the app opens with a signed-in reviewer session before you review
   any staging routes.
6. Use that signed-in session to inspect the required read-only review routes
   and hosted evidence surfaces.

## What The Reviewer Should Look For

- The browser should clearly show that the reviewer is signed in before any
  route review begins.
- The app should remain on the approved staging review path.
- No new writes, uploads, external sends, or production actions should be
  enabled during this review.

## What Is Still Missing

- The exact named reviewer account to use for the hosted proof run, if it is
  different from the default reviewer identity.
- Hosted staging evidence for the approved reviewer path and first narrow write.
- Readback screenshots or route evidence from the approved staging session.

## Escalation Rule

If a reviewer cannot get through the handoff with the approved identity, stop
and ask the launch owners to confirm the staging access path before trying to
continue.
