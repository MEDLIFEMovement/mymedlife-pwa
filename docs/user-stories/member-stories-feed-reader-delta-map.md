# Member Stories Feed / Reader Delta Map

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#1` General Member App

## Purpose

Make the next Member Stories slice concrete: restore the exported-source
Instagram-like feel without making likes, comments, saves, shares, publishing,
consent, proof storage, or provider sync look live.

## Source Evidence

- Repo route: `src/app/app/stories/page.tsx`
- Repo component: `src/components/figma-member-stories-page.tsx`
- Member shell route renderer: `src/app/app/member-mobile-shell-page.tsx`
- Exported app source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/app/App.tsx`
- Exported pasted Stories source:
  `/Users/codex/Desktop/myMEDLIFE App Prototype/src/imports/pasted_text/story-data.ts`
- Prior planning: `docs/user-stories/member-stories-ig-source-acceptance-packet.md`
- Current queue context: `#518` is merged/smoked; `#523` is the active member
  rerun/repair branch and should settle before another #1 code slice touches
  member shell files.

## Current Repo Truth

- `/app/stories` is route-backed.
- It delegates into `renderMemberMobileShellPage` with `initialScreen:
  "stories"`, optional `filter`, and optional `story`.
- The repo component already includes:
  - sticky header,
  - filter chips,
  - story rows/cards,
  - square media stage,
  - action icons,
  - disabled like/comment/share/save controls,
  - review-only consent and publishing copy.
- Current repo truth is safer than the exported source: it is more explicit
  about blocked controls and proof governance.

## Exported-Source Intent

The exported source is more visibly Instagram-like:

- mobile-first single-column feed,
- top bar with `Stories`,
- active/live status cue,
- horizontal filters: `For You`, `My Chapter`, `Field Stories`, `Student
  Stories`, `Trip Moments`, `Events`, `Featured`,
- username/source row,
- full-width square image/video post,
- heart/comment/share/bookmark action row,
- like count,
- caption with bold handle,
- `Read more` reader/detail affordance,
- timestamp,
- modal/detail reader.

## Exact Differences To Review

| Area | Exported-source shape | Current repo truth | Next #1 restoration target |
| --- | --- | --- | --- |
| Filters | Rich category set including My Chapter, Field Stories, Student Stories, Trip Moments, Events, Featured | Shorter set: For You, Events, SLT, Fundraising, Leadership | Restore source-like filter depth if supported by current proof data, or explain why current categories are intentional. |
| Feed media | Full-width square real image/video post feel | Square gradient/story stage with generated review card feel | Move closer to image/video post rhythm without adding fake provider ingest. |
| Social row | Likes, comments, share, bookmark visually active in prototype | Disabled preview controls with clear titles | Keep disabled, but preserve spacing/visual rhythm so it feels like a feed, not an admin review list. |
| Engagement copy | Like counts, captions, read-more, timestamp | Sharing status and review summary are emphasized | Prefer caption/reader language where safe; do not add fake live engagement counts unless clearly TEST/preview. |
| Reader/detail | Modal/detail reader from selected story | Route supports `story` query; component emphasizes list/review | Ensure detail/reader posture is route-backed or clearly preview-only; no silent reader taps. |
| Live cue | Prototype says Live / Live from the field | Repo says Review | Keep review-safe copy unless real publishing proof exists; do not make it sound live. |

## Builder-Ready Slice

**Slice:** Member Stories feed/reader source-fidelity pass after `#523` settles.

**Goal:** Make `/app/stories` feel more like the exported IG-style member feed
while preserving blocked/social/proof honesty.

**Likely files:**

- `src/app/app/stories/page.tsx`
- `src/app/app/member-mobile-shell-page.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-member-mobile-home.tsx` if home links need copy parity
- `tests/member-stories-profile-pages.test.tsx`
- `tests/member-mobile-shell-page.test.tsx`

**Do not touch:**

- `/leader`, `/staff`, `/admin`
- proof upload/write actions
- consent approval, storage, publishing, provider sync
- auth/session helpers
- rollout packet, production proof, live counts

## Acceptance Checks

- `/app/stories` remains route-backed and member-owned.
- Visual hierarchy reads as an IG-style feed: top bar, filters, handle row,
  square media stage, action row, caption/reader affordance.
- Social controls stay disabled/read-only/preview-only with no fake success.
- Fake story, user, chapter, and proof content visibly includes `TEST`.
- Product labels stay clean: `MEDLIFE Stories`, `Stories`, `Events`, `Points`,
  `Profile`.
- No public/smoke/screenshot/TEST evidence is described as production proof.

## Matrix Guidance

May support `Scope/UI` and possibly `QA/Ops` after implementation and focused
tests/smoke. Does not move `Data/Auth`, `Writes/Integrations`, or `Rollout
Gate`.
