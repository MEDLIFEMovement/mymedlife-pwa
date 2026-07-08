# Member Profile Rhythm Acceptance Map

Date: 2026-07-08  
Owner lane: `#1` General Member App Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#1` a narrow, source-backed acceptance target for the next member profile
rhythm pass. The problem is not broad member shell shape anymore. The remaining
visible concern is that `/profile` can still feel denser and more desktop-like
than the exported General Member App rhythm, even though the route is wired and
read-only.

This packet should help the builder restore mobile app feel without inventing
live profile editing, private-data writes, or rollout proof.

## Sources Inspected

Repo implementation truth:

- `src/components/member-profile-panel.tsx`
- `src/components/member-bottom-nav.tsx`
- `src/app/profile/page.tsx`
- `src/app/app/member-mobile-shell-page.tsx`
- `tests/home-page.test.tsx`
- `tests/member-stories-profile-pages.test.tsx`
- `docs/user-stories/member-shell-acceptance-packet.md`
- `docs/user-stories/member-next-slice-brief.md`
- `docs/user-stories/post-wave-next-builder-goals.md`

Exported/Figma acceptance-shape signal:

- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/ui-components.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/guidelines/Guidelines.md`

Important source caveat: the exported member prototype shows a `Profile` item in
the bottom-nav family, but it does not provide a fully distinct production
profile screen in the same way the repo now has `MemberProfilePanel`. Treat the
exported source as the rhythm contract, not as proof of a missing exact screen.

## Current Repo Truth

- `/profile` is route-backed and uses `MemberProfilePanel`.
- The profile panel already keeps visible fake member/chapter/event content
  labeled with `TEST` via explicit label helpers.
- The profile panel is intentionally read-only and includes safety copy around
  profile scope, event loop, points, recognition, and identity readback.
- The implemented profile connects back to `/app`, `/app/events`, and
  `/app/points` through route-backed controls.
- The member bottom nav exists as `MemberBottomNav` with `Home`, `Stories`,
  `Events`, `Points`, and `Profile`.
- None of this proves production profile data readiness, profile edit authority,
  real member identity proof, or rollout readiness.

## Exported Member-App Rhythm To Preserve

The exported General Member App feels mobile-first:

- phone-width shell, not a wide dashboard
- stacked cards with generous vertical rhythm
- one clear primary moment above the fold
- compact bottom navigation pinned to the app shell
- event, points, stories, and profile reachable without switching mental models
- bright, simple hierarchy rather than dense admin-style readback
- tap targets that are easy to hit on mobile

For profile, `looks like the Figma` means the implemented route should feel like
one member-app surface in that family, not like a desktop record page.

## What Should Change In A Future #1 Slice

Smallest useful implementation scope:

- Tune `/profile` spacing, card hierarchy, and mobile density in
  `src/components/member-profile-panel.tsx`.
- Preserve or improve bottom-nav continuity through `MemberBottomNav`; do not
  replace it with a desktop-style quick-nav.
- Keep the first screen focused on identity, chapter, and next step.
- Move secondary readback below the primary member moment instead of crowding
  the top of the route.
- Keep the event/points handoff visible but lightweight.

Likely files in scope:

- `src/components/member-profile-panel.tsx`
- `src/components/member-bottom-nav.tsx`, only if active-state or spacing
  continuity needs a targeted fix
- `src/app/profile/page.tsx`, only if route wrapper or shell spacing is the
  issue
- focused member/profile route tests only

Files and lanes out of scope:

- `/leader`, `/staff`, `/admin`, or shared staff/admin shell files
- auth/session helpers, RLS, write services, provider integrations
- rollout packets, owner CSVs, production signed-in proof, live counts
- SLT standalone `/slt-prep/*` data/write behavior

## Acceptance Checklist

Reviewer acceptance for `#1`:

- `/profile` still loads as a member route and stays read-only.
- The first viewport reads as a mobile member profile moment: name/chapter/role
  first, not a dense operational dashboard.
- Cards use mobile-friendly spacing and clear hierarchy; no desktop table/grid
  feel above the fold.
- Bottom-nav family remains visible and route-backed for `Home`, `Stories`,
  `Events`, `Points`, and `Profile` where the shell uses that nav.
- The event and points handoff remains visible, but it does not imply RSVP,
  check-in, attendance, or points writes.
- Fake member, chapter, event, story/proof, points examples, and recognition
  examples visibly include `TEST`.
- Product/menu labels stay clean: `MEDLIFE`, `myMEDLIFE`, `Events`, `Points`,
  `Stories`, `Profile`, `RSVP`, and role labels are not prefixed with `TEST`.
- No social, profile-edit, contact-data, emergency/traveler, HubSpot, provider,
  or rollout-proof behavior is introduced.

## What Must Stay Preview-Safe Or Blocked

- Profile edits.
- Private contact data writes.
- Emergency or traveler data writes.
- Chapter membership or role changes.
- Points awards or leaderboard mutation.
- RSVP/check-in/attendance writes.
- HubSpot/contact sync.
- Production signed-in proof.
- Rollout packet, live-count, or invite-gate evidence.

## What Counts As Real Progress

Real progress from this slice:

- member `Scope/UI` progress if the profile route visibly matches the exported
  member-app rhythm better
- possible `QA/Ops` progress if focused tests or browser checks prove route
  continuity
- clearer reviewer confidence that profile is part of the General Member App,
  not a separate desktop dashboard

Not progress from this slice:

- Data/Auth readiness
- Writes/Integrations readiness
- production profile proof
- rollout readiness
- provider readiness

## Reviewer Checks

Suggested `#4` or Coordinator review:

- Open `/profile?source=home`, `/profile`, `/app`, `/app/events?source=profile`,
  and `/app/points?source=profile` in the same browser review.
- Confirm the profile route still feels mobile-first at narrow viewport width.
- Confirm the bottom nav or member route handoff remains visible and does not
  dead-end.
- Confirm no visible fake row lost the `TEST` marker.
- Confirm no button copy says or implies that a real profile edit, points award,
  RSVP/check-in write, provider sync, or production proof happened.

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest member
`Scope/UI` movement and maybe `QA/Ops` movement for member profile continuity.
It must not move Data/Auth, Writes/Integrations, production proof, provider
readiness, or Rollout Gate.
