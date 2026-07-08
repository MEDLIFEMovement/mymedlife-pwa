# Member Profile Body Rhythm Acceptance Map

Date: 2026-07-08  
Owner lane: `#1` General Member App Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#1`, `#4`, and Coordinator a narrow acceptance target for the next member
profile body-rhythm pass after the active route-shell fix on `#542` lands. This
map is not asking for another route-shell pass. It only applies once `/profile`
already has the correct member shell, bottom-nav posture, and mobile route
frame.

The remaining product concern is body feel: profile content should read like a
mobile member-app surface, not a dense desktop dashboard or admin record.

## Sources Inspected

Repo implementation truth:

- `src/app/profile/page.tsx`
- `src/components/member-profile-panel.tsx`
- `src/components/member-bottom-nav.tsx`
- `src/app/app/member-mobile-shell-page.tsx`
- `tests/member-stories-profile-pages.test.tsx`
- `tests/home-page.test.tsx`
- `docs/user-stories/member-profile-rhythm-acceptance-map.md`
- `docs/user-stories/member-shell-acceptance-packet.md`

Exported/Figma acceptance-shape signal:

- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/ui-components.tsx`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/guidelines/Guidelines.md`

Important source caveat: the exported member prototype shows `Profile` as part
of the bottom-nav family, but it does not provide a fully distinct profile body
screen. Use exported source for mobile rhythm, density, and hierarchy; use repo
truth for the actual implemented `/profile` behavior.

## Current Repo Truth

- `/profile` is route-backed and renders `MemberProfilePanel`.
- The profile body already labels visible fake member/chapter/event examples
  with `TEST`.
- The profile body is explicitly read-only and includes safety notes.
- Profile links back to `/app`, `/app/events`, and `/app/points`.
- The current body contains multiple stacked sections: hero/profile snapshot,
  event loop, next chapter moment, identity rows, chapter access rows, and
  recognition.
- The current body can still feel denser than the exported member app because
  several route handoffs, stats, and safety/readback sections compete near the
  top of the page.
- None of this proves real profile data readiness, profile edit authority,
  private contact proof, points authority, or rollout readiness.

## Exported Member-App Body Rhythm

The exported member app implies:

- one primary mobile moment above the fold
- large friendly type and clear hierarchy
- stacked cards with visible breathing room
- bottom-nav continuity as part of the experience
- short supporting copy, not long operational explanation blocks
- event/points/stories/profile reachable without turning the route into a
  second home dashboard
- mobile tap comfort over desktop information density

For profile body rhythm, `looks like the Figma` means the profile body should
feel like the same mobile product language as the member home and Stories/feed
surfaces, while still being a repo-truth read-only profile route.

## Acceptance Polish Versus Redesign

Acceptance polish:

- reduce above-the-fold competition between profile snapshot, event loop, points,
  and recognition
- make the first screen clearly about member identity, chapter, and next safe
  action
- keep secondary readback sections lower and visually quieter
- prefer short cards and mobile spacing over dense multi-column dashboard blocks
- preserve existing route-backed handoffs
- keep safety copy visible but concise

Redesign, not acceptable in this narrow slice:

- replacing the route with an unrelated new profile concept
- removing route-backed event/points/profile continuity
- turning profile into a live edit/account settings workflow
- adding new private-data, contact, emergency, traveler, HubSpot, or provider
  behavior
- changing shared member shell architecture while the active route-shell bug is
  still settling

## Smallest Useful #1 Slice

Only start this after `#542` or the current profile-shell route fix is clean.

Smallest acceptable implementation scope:

- tune `MemberProfilePanel` body hierarchy, spacing, and section ordering
- keep route-backed controls and TEST labels intact
- add or adjust focused profile rendering tests only if content or hierarchy
  changes
- do not touch unrelated member Stories, SLT, leader, staff/admin, auth, or
  rollout files

Likely files in scope:

- `src/components/member-profile-panel.tsx`
- `tests/member-stories-profile-pages.test.tsx`
- `tests/home-page.test.tsx`, only if bottom-nav/profile handoff assertions need
  a tiny update

Likely files out of scope:

- `src/app/app/member-mobile-shell-page.tsx`, unless `#542` has already settled
  and the profile body issue proves it needs wrapper spacing
- `src/components/figma-member-stories-page.tsx`
- `/leader`, `/staff`, `/admin`
- auth/session/RLS helpers
- rollout, provider, proof, or owner-data files

## Acceptance Checklist

Reviewer acceptance for `#1`:

- `/profile` still opens as a member route and remains read-only.
- The first visible profile body moment is identity/chapter/role focused.
- Event/points/recognition context is visible but does not crowd the first
  viewport.
- Profile body spacing feels mobile-first: stacked, breathable, and
  thumb-scrollable.
- Cards do not look like staff/admin dashboard widgets above the fold.
- Safety copy remains visible and concise enough not to dominate the route.
- Route-backed buttons still go to `/app`, `/app/events`, and `/app/points`
  where present.
- Visible fake member, chapter, event, points, recognition, story/proof, and
  route examples remain `TEST` labeled.
- Product/menu labels stay clean: `MEDLIFE`, `myMEDLIFE`, `Events`, `Points`,
  `Stories`, `Profile`, `RSVP`, role labels, and menu labels are not prefixed
  with `TEST`.
- No button copy implies profile edits, contact updates, emergency/traveler data
  writes, RSVP/check-in writes, points awards, HubSpot sync, or production
  proof.

## What Must Stay Preview-Safe Or Blocked

- profile edits
- private/contact data writes
- emergency or traveler data writes
- chapter membership or role changes
- RSVP/check-in/attendance writes
- points awards or leaderboard mutation
- HubSpot/contact sync
- production signed-in proof
- rollout packet, live-count, pilot-proof, or invite-gate evidence

## What Counts As Real Progress

Real progress:

- member `Scope/UI` progress if the profile body feels more like the exported
  mobile member app after the route shell is clean
- possible `QA/Ops` progress if focused tests or browser review prove the
  route-backed handoffs still work

Not progress:

- Data/Auth readiness
- Writes/Integrations readiness
- production profile proof
- provider readiness
- Rollout Gate movement

## Reviewer Checks

Suggested `#4` or Coordinator review:

- Review `/profile?source=home` and `/profile` at a narrow mobile viewport.
- Confirm the first viewport is profile identity first, not a dashboard.
- Confirm route handoffs to `/app`, `/app/events`, and `/app/points` still work
  where present.
- Confirm visible fake content still includes `TEST`.
- Confirm profile stays read-only and does not imply production proof.

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest member `Scope/UI`
and possibly `QA/Ops` movement. It must not move Data/Auth, Writes/Integrations,
provider readiness, production proof, or Rollout Gate.
