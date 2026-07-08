# Member Stories IG-Feed Acceptance Map

Date: 2026-07-08  
Owner lane: `#1` General Member App Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#1`, `#4`, and Coordinator a narrow acceptance target for the next member
Stories/feed pass after the active profile work settles. The user expectation is
plain: the General Student App Stories tab should feel like the exported
Figma/code IG-style feed, while remaining preview-safe and TEST-labeled.

This packet should prevent drift into redesign-by-vibes or fake-live social
behavior.

## Sources Inspected

Repo implementation truth:

- `src/app/app/stories/page.tsx`
- `src/app/app/member-mobile-shell-page.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/member-bottom-nav.tsx`
- `tests/member-stories-profile-pages.test.tsx`
- `tests/e2e/launch-smoke.spec.ts`
- `docs/user-stories/member-stories-feed-reader-delta-map.md`
- `docs/user-stories/member-stories-ig-source-acceptance-packet.md`

Exported/Figma acceptance-shape signal:

- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/story-data.ts`
- `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`

## Current Repo Truth

- `/app/stories` is route-backed through `AppStoriesPage`.
- Stories route state accepts optional `filter` and `story` query values.
- `FigmaMemberStoriesPage` renders a phone-width Stories feed with:
  - sticky `Stories` header
  - horizontal filter chips
  - handle row
  - square story media area
  - disabled like/comment/share/save controls
  - preview-only consent and publishing copy
  - bottom spacing for the member shell
- Tests already assert route-backed feed behavior, reader query behavior,
  preview-only controls, TEST handles, and no `Add Story`, no `Live from the
  field`, and no live `stories published` count.
- The route remains preview-only; reactions, comments, shares, saves,
  publishing, uploads, external sources, and production proof are blocked.

## Exported IG-Style Acceptance Shape

The exported Stories source implies:

- top bar with Stories context
- rich filter family: `For You`, `My Chapter`, `Field Stories`, `Student
  Stories`, `Trip Moments`, `Events`, and `Featured`
- strong visual feed rhythm with large media-forward cards
- story handle/source row before the media
- square or near-square story media area
- action row that visually resembles social feed controls
- caption/body text under each story
- reader/detail posture when a story is selected
- footer/metadata that does not imply live public publishing unless real proof
  exists

## What Current Main Still Differs On

Known likely differences to evaluate before the next `#1` slice:

- current filters are shorter: `For You`, `Events`, `SLT`, `Fundraising`,
  `Leadership`
- current media area is a branded gradient/story stage, not necessarily as
  image/video-forward as the exported feed
- current story reader/detail is route-backed by query state, but the visual
  reader should still be checked against the exported modal/detail feel
- current feed is intentionally preview-safe, so some exported live-feeling
  affordances such as `Add Story`, live field status, or published counts are
  intentionally removed and should not be restored as live claims

## Smallest Useful #1 Slice

Only start this after the active profile route-shell/body work is clean enough
not to collide with Stories or bottom-nav files.

Smallest acceptable implementation scope:

- compare `FigmaMemberStoriesPage` against exported `story-data.ts`
- restore source-like filter depth where it can be done with preview-safe local
  display state
- tune card/feed rhythm toward IG-like story cards without changing data truth
- keep reader/detail route-backed with `story` query state
- preserve disabled/preview-only social controls
- update focused Stories tests if route/copy/filter behavior changes

Likely files in scope:

- `src/components/figma-member-stories-page.tsx`
- `src/app/app/stories/page.tsx`, only if query handling needs a targeted fix
- `src/app/app/member-mobile-shell-page.tsx`, only if Stories route state or
  bottom-nav continuity is the actual issue
- `tests/member-stories-profile-pages.test.tsx`
- `tests/e2e/launch-smoke.spec.ts`, only if browser smoke expectations change

Files and lanes out of scope:

- `src/components/member-profile-panel.tsx` while profile work is active
- `/leader`, `/staff`, `/admin`
- proof upload, consent/storage, moderation, provider sync, auth/RLS, rollout
  packets, owner CSVs, production proof

## Acceptance Checklist

Reviewer acceptance for `#1`:

- `/app/stories` still opens inside the General Member App route family.
- Bottom nav remains visible and route-backed for member shell navigation.
- Feed visually reads as IG-like: handle row, square media, action row, caption,
  timestamp/status, and reader affordance.
- Filter chips remain visible and route/query-backed or clearly local
  preview-only; no silent dead taps.
- Reader/detail opens through shareable query state such as
  `/app/stories?filter=Events&story=2` where supported.
- Reactions, comments, shares, saves, source links, publishing, uploads, and
  external/provider behavior stay disabled, blocked, or preview-only.
- `Add Story`, live public feed status, and live published counts do not appear
  unless separately approved by Data/Auth/Writes and rollout evidence lanes.
- Visible fake story titles, story captions, proof/source rows, member handles,
  chapter names, event names, and fake metrics remain `TEST` labeled.
- Product/menu labels stay clean: `MEDLIFE Stories`, `Stories`, `Events`,
  `Points`, `Profile`, `MEDLIFE`, `myMEDLIFE`, and provider names are not
  prefixed with `TEST`.

## What Must Stay Preview-Safe Or Blocked

- story publishing
- story uploads
- proof ingestion
- consent approval
- comments
- reactions/likes saved to a real account
- share/send behavior
- save/bookmark persistence
- social/provider source links
- moderation approval
- production proof, live counts, pilot proof, or rollout packet evidence

## What Counts As Real Progress

Real progress:

- member Stories `Scope/UI` progress if the feed looks closer to the exported
  IG-style source while staying preview-safe
- possible `QA/Ops` progress if route/component/browser checks prove filters,
  reader query state, bottom nav, and blocked controls

Not progress:

- proof/UGC governance readiness
- Data/Auth readiness
- Writes/Integrations readiness
- production proof
- provider readiness
- Rollout Gate movement

## Reviewer Checks

Suggested `#4` or Coordinator review:

- Open `/app/stories`.
- Open `/app/stories?filter=Events&story=2`.
- Confirm feed card rhythm includes handle row, square media, action row, and
  caption/read-more/detail posture.
- Confirm fake content uses `TEST` where visible.
- Confirm no `Add Story`, live public feed status, or published-count claim
  appears.
- Confirm disabled controls clearly say preview-only/blocked rather than
  silently doing nothing.
- Confirm no route or copy claims proof approval, story publishing, provider
  sync, or rollout evidence.

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest member Stories
`Scope/UI` and possibly `QA/Ops` movement. It must not move Data/Auth,
Writes/Integrations, provider readiness, production proof, or Rollout Gate.
