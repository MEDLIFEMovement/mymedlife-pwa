# Member Shell Restoration Work Packet

Date: 2026-07-08
Builder owner: `#1` General Member App
Owner lane: myMEDLIFE #5, planning/docs only

## Best Next Work Packet

Restore the General Member App's source-backed feel across Stories, bottom nav,
SLT entry, and event-to-points handoff without enabling live RSVP, check-in,
points, publishing, consent, traveler, or provider writes.

## Evidence Base

- Repo routes: `/app`, `/app/events`, `/app/events/[eventId]`, `/app/points`,
  `/app/stories`, `/profile`, `/app/slt-prep`, `/slt-prep/*`.
- Repo components: `figma-member-mobile-home`, `figma-member-stories-page`,
  `student-app-shell`, `slt-prep-primitives`, `slt-prep-subnav`.
- Exported app source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`
  contains `StoriesScreen`, `EventsScreen`, `EventDetailScreen`,
  `RsvpConfirmScreen`, `CheckInScreen`, and `PointsLeaderboard`.
- Exported Stories source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/story-data.ts`
  contains story filters, cards, modal, source badges, and reaction controls.
- Exported SLT source:
  `/Users/codex/Desktop/myMEDLIFE SLT Prep Phase/src/app/routes.tsx`
  defines home, checklist, item detail, forms, payments, meetings, extensions,
  timeline, staff dashboard, and notifications.

## What "Looks Like The Figma" Means

### Stories

The exported Stories mobile source is explicitly Instagram-like:

- sticky top bar with `Stories`,
- horizontal filters such as For You, My Chapter, Field Stories, Student
  Stories, Trip Moments, Events, Featured,
- username/source row,
- full-width square visual post,
- heart/comment/share/bookmark action row,
- like count, caption, read-more/detail interaction, and timestamp,
- modal/detail reader for longer story content.

Repo truth currently keeps Stories safer and more review-oriented. That safety
is good, but the next restoration slice should recover more of the exported
feed feel without making reactions, comments, saves, shares, uploads, or
publishing live.

### SLT Prep

The exported SLT package is a standalone trip-prep experience. In the General
Member App, `/app/slt-prep` should behave as a member-shell entry/handoff into
that content, not as proof that trip registration, payments, forms, reminders,
provider sync, or traveler updates are live.

### Events And Points

The exported app links event detail, RSVP confirmation, check-in, and points
earned. In repo truth, those should remain preview/readback cues until real
RSVP/check-in/attendance/points authority exists.

## Smallest Safe Implementation Slices

1. **Stories IG feel parity:** restore full-width mobile feed rhythm, richer
   source-backed filters, story reader/detail posture, and action-row fidelity
   while keeping all social/write controls disabled or preview-only.
2. **SLT member-shell placement:** ensure `/app/slt-prep` preserves the member
   shell and bottom-nav family, with clear copy that SLT workflows are
   preview-only.
3. **Event-to-points continuity:** verify Events -> detail -> RSVP/check-in
   posture -> Points remains visually connected and does not imply live awards.

## Likely File Families

- `src/app/app/page.tsx`
- `src/app/app/member-home-page.tsx`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/app/slt-prep/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/student-app-shell.tsx`
- `src/components/slt-prep-primitives.tsx`
- focused member route/component tests

## Do Not Touch

- `/leader`, `/staff`, `/admin`
- shared auth/session helpers unless Coordinator explicitly approves
- RSVP/check-in/attendance write services
- points ledger or award authority
- proof consent/storage/publishing
- Luma, Smile.io, HubSpot, Hootsuite, Shopify, Drive/Form, Zoom, or provider
  writes
- owner CSVs, rollout packets, live counts, signed-in production proof, pilot
  proof

## Acceptance Checks

- Member shell and bottom nav remain visible and source-backed.
- Stories visually reads like the exported IG-style feed, but social controls
  are disabled/read-only/preview-only.
- Visible story/proof rows include `TEST` unless backed by approved real data.
- `/app/slt-prep` reads as a member app surface with SLT preview state, not a
  live standalone travel/payment system.
- Event/points handoff copy says preview/readback where no write path exists.
- Focused member tests or browser checks cover every changed route.

## Matrix Limits

Can move: `Scope/UI`, possibly `QA/Ops` if tested/smoked.

Cannot move: `Data/Auth`, `Writes/Integrations`, `Rollout Gate`.
