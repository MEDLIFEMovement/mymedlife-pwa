# myMEDLIFE Staging Reviewer Access Guide

Date: 2026-06-28

Status:
- review-only
- staging reviewer path is the approved default
- Luma/event-loop hosted proof should be captured from `/admin/luma-live-pilot`

## What This Guide Covers

This guide describes the currently observed staging review path for
`https://staging.mymedlife.org` so a human reviewer can follow the existing
handoff without guessing.

It does **not** approve a production launch.
It does **not** change any write, upload, or external-send posture.
It does **not** replace the need for a named approved reviewer account if the
team wants a different identity than the approved default.

## Current Reviewer Path

1. Open `https://staging.mymedlife.org` in the browser.
2. Expect the request to be intercepted by Vercel SSO before the myMEDLIFE app
   loads.
3. Complete the Vercel sign-in step with the approved reviewer identity for the
   staging access path.
4. After Vercel signs you in, continue to the app using the redirect that is
   returned by the SSO flow.
5. Confirm the app opens with a signed-in reviewer session before you review
   any staging routes.
6. Open `https://staging.mymedlife.org/admin/luma-live-pilot`.
7. Confirm the page shows `Staging Luma pilot`, `Hosted reviewer proof`, and the
   current gate for event writes, RSVP writes, attendance import, and production
   blocking.
8. Use the same signed-in session to inspect the required readback routes and
   hosted evidence surfaces.

## Luma Event Loop Hosted Proof

Use `/admin/luma-live-pilot` as the staging evidence checklist.

The reviewer should capture route evidence or screenshots for:

1. Reviewer access path:
   `staging.mymedlife.org` -> Vercel SSO -> signed-in app session ->
   `/admin/luma-live-pilot`.
2. Luma event create/update:
   run only if the route says event writes are `On`, then record the returned
   Luma event id.
3. RSVP writeback:
   write the approved reviewer RSVP to the same event with Luma email sending
   suppressed.
4. Attendance import:
   import the guest list for the same event and confirm the page returns
   attendance rows without QR codes or secrets.
5. Points and leaderboard readback:
   confirm member, leader, staff/admin, and `/admin/luma-live-pilot` surfaces
   tell the same event -> RSVP -> attendance -> points story.
6. Audit/outbox safety:
   open `/admin/audit-log` and `/admin/integration-outbox` to confirm audit
   visibility and zero unapproved external sends.

## What The Reviewer Should Look For

- The browser should clearly show that the reviewer is signed in before any
  route review begins.
- The app should remain on the approved staging review path.
- Luma staging event create/update, RSVP writeback, and attendance import may be
  used only when the route shows those staging gates are `On`.
- No production Luma setup, n8n execution, HubSpot writes, warehouse/Power BI
  writes, SMS/email sends outside the approved Luma RSVP suppression posture, or
  AI actions should be enabled during this review.

## What Is Still Missing

- Final hosted screenshots or route evidence from the approved staging session.
- Final live-pilot approval after the reviewer evidence is attached to Linear.
- Production Supabase/Vercel ownership and production Luma ownership remain
  separate production gates.

## Escalation Rule

If a reviewer cannot get through the handoff with the approved identity, stop
and ask the launch owners to confirm the staging access path before trying to
continue.
