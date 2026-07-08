# myMEDLIFE Member Builder Packet

Date: 2026-07-07  
Owner lane: `#1` General Member App Builder  
Planning reference: MED-512  
Purpose: give the member-shell builder a durable repo-truth runway without
mixing in leader, staff/admin, rollout, or provider work.

## Sources Inspected

- `docs/user-stories/builder-ticket-packet.md`
- `docs/user-stories/latest-main-builder-crosswalk.md`
- `docs/user-stories/story-to-test-traceability.md`
- `docs/user-stories/delivery-backlog.md`
- `src/app/app/events/page.tsx`
- `src/app/app/events/[eventId]/page.tsx`
- `src/app/app/points/page.tsx`
- `src/app/app/stories/page.tsx`
- `src/app/app/slt-prep/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`

## Shell Contract

- Repo truth sets current implementation status.
- Exported/Figma member mobile shell is the visual contract.
- Visible fake people, chapters, events, stories, points, and traveler content
  must keep `TEST`.
- No member control should silently do nothing.
- No member shell PR should imply live RSVP, attendance, points awards, story
  publishing, profile writes, or traveler/provider writes unless separately
  approved.

## Current Member Truth

- Built or launch-reviewable: `/app`, `/app/events`, event detail shell,
  `/app/points`
- Preview-only or mock-safe: RSVP/check-in, Stories interactions, points
  authority, `/app/slt-prep`
- Rollout-blocked: production member proof, live event rows, RSVP/readback
  proof, attendance proof, points ledger proof

## Recommended Next Slices

### 1. BL-001 - Member events/detail to points handoff polish

- In scope:
  - `src/app/app/events/page.tsx`
  - `src/app/app/events/[eventId]/page.tsx`
  - `src/app/app/points/page.tsx`
  - `src/components/figma-member-mobile-home.tsx`
  - `tests/member-mobile-shell-page.test.tsx`
  - `tests/member-event-detail-page.test.tsx`
  - `tests/member-launch-lane-events.test.ts`
  - `tests/launch-lane-points-readback.test.ts`
- Goal:
  - make events, event detail, RSVP/check-in posture, and points visibility
    feel like one coherent member path
- Must stay blocked:
  - real RSVP writes, attendance writes, QR writes, points mutation,
    Smile.io/Luma/provider actions

### 2. BL-006 - Points readback and leaderboard preview honesty

- In scope:
  - `/app/points`
  - points cards on the member home shell
  - read-only leaderboard copy and tests
- Goal:
  - make points readback understandable without drifting into live-reward or
    award-authority language
- Must stay blocked:
  - rewards, exports, award authority, provider sync, production leaderboard proof

### 3. BL-003 - Profile source-fidelity and privacy-copy pass

- In scope:
  - member profile route and profile links from the member shell
  - privacy/read-only messaging for visible profile surfaces
- Goal:
  - keep profile visible and source-faithful while making private or unwired
    data posture explicit
- Must stay blocked:
  - profile/contact/emergency/traveler writes, HubSpot sync, production signed-in proof

### 4. BL-004 - `/app/slt-prep` handoff closeout

- In scope:
  - `/app/slt-prep`
  - member-shell entry and handoff copy
- Goal:
  - keep SLT visible inside the member shell without pretending the traveler
    workflow is final or fully source-backed
- Must stay blocked:
  - payments, forms, Drive, Shopify, HubSpot, Luma, Zoom, traveler writes

## Do-Not-Touch Boundaries

- No leader, staff, or admin routes/components
- No auth/data-safety services unless Coordinator explicitly widens scope
- No rollout evidence docs or packet work
- No provider/API access or production data claims

## Acceptance Checks

- Exported/Figma member shell and bottom-nav family remain intact
- Visible fake rows keep `TEST`
- Controls are route-backed, blocked, disabled, read-only, or preview-only
- No fake-live wording for RSVP, attendance, points, stories, or SLT
- Focused member tests and browser smoke selectors remain passing when touched

## Model Recommendation

Use `gpt-5.4` medium for implementation. Use `gpt-5.4-mini` only for tiny
checklist or review follow-ups.

## Matrix Guidance

Shell-fidelity PRs here may support modest Member `Scope/UI` and `QA/Ops`
movement once landed and smoked. They must not move `Data/Auth`,
`Writes/Integrations`, or `Rollout Gate` by themselves.
