# Member Next Slice Brief

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#1` General Member App

## Live Repo Context

Fresh repo truth includes these merged member slices:

- `#502` tightened member home/profile continuity.
- `#506` tightened member story reader/feed parity.
- `#514` preserved member points event return continuity.
- Earlier source-backed member work covers event detail, points, stories, SLT
  entry, and preview-safe controls.

This means the next member slice should not duplicate home/profile, Stories
reader/feed, or event-return work unless a reviewer finds a specific remaining
gap.

## Exact Next Recommended Slice

**Member bottom-nav and cross-route continuity sweep for the already-polished
member flow.**

Scope the PR around the member-owned route family:

- `/app`
- `/app/events`
- `/app/events/[eventId]`
- `/app/points`
- `/app/stories`
- `/profile`
- `/app/slt-prep`

The goal is not to redesign any screen. The goal is to make sure the recently
merged member event, points, Stories, profile, and SLT surfaces still feel like
one exported/Figma mobile app with no broken handoffs, stale copy, or silent
bottom-nav controls.

## Why This Is Best From Repo Truth

The highest-value member work has recently landed in adjacent slices, but it was
spread across separate PRs. A small continuity sweep is now safer than starting
a new feature lane because it can catch cross-route drift without touching
leader/staff/admin or data/write code.

This supports narrow launch because the member path is the student-facing core:
home -> events -> event detail -> RSVP/check-in posture -> points -> profile /
Stories / SLT context.

## Likely File Families

Inspect first:

- `src/app/app/page.tsx`
- `src/app/app/member-home-page.tsx`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `tests/member-figma-route-pages.test.tsx`
- `tests/e2e/launch-smoke.spec.ts` only if route smoke selectors need update

Avoid:

- `/leader`, `/staff`, `/admin`
- auth/session helpers
- event write services, points award authority, provider code, rollout evidence

## Figma / Exported-Source Acceptance Checks

- The bottom nav and member shell still match the exported mobile-app intent.
- Home, Events, Stories, Points, Profile, and SLT entry are visible where
  source-backed.
- Moving between event detail and points feels intentional, not like separate
  pages stitched together.
- Stories still feels like the source-backed IG-style member feed and reader,
  not a generic list.
- SLT entry reads as part of the General Member App, not a live standalone
  travel/payment app.

## TEST-Label Expectations

Visible fake/sandbox/Figma-derived content must show `TEST`, including:

- member names
- chapter names
- event names
- story/proof cards
- points and leaderboard rows
- campaign examples
- SLT/traveler sample rows
- fake metrics

Keep product/menu/provider terms clean: MEDLIFE, myMEDLIFE, Events, RSVP,
Attendance, Points, SLT Prep, role labels, and menu labels should not be
prefixed.

## Visible But Preview-Only

Keep these visible if source-backed, but do not make them sound live:

- RSVP
- check-in / QR / attendance posture
- points earning and simple leaderboard readback
- story reactions, share, save, comment, publish-looking controls
- profile edit or private/contact fields
- SLT forms, payments, reminders, provider references, traveler workflow

## Matrix Columns

If landed and tested/smoked, this slice may support:

- `Scope/UI`
- `QA/Ops`

It must not move:

- `Data/Auth`
- `Writes/Integrations`
- `Rollout Gate`

## What Does Not Count As Rollout Proof

- Public no-write smoke
- screenshots
- TEST rows
- Figma/mock/sandbox content
- preview RSVP/check-in/points copy
- local actor or preview-cookie behavior

## Blockers To Starting Safely

Do not start if:

- another active #1 PR is touching the same member route files,
- Coordinator wants a production proof lane instead of shell continuity,
- the slice requires auth/session helper changes,
- the slice starts enabling RSVP/check-in/attendance/points writes.
