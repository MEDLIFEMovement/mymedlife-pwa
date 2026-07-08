# myMEDLIFE Member Stories IG Source Acceptance Packet

Date: 2026-07-07  
Owner lane: myMEDLIFE #5, planning/docs only  
Planning reference: MED-512  
Purpose: give future member-shell work a plain-English, source-backed packet for
the General Student App Stories lane without drifting into fake-live social or
proof behavior.

## Source Files And Docs Inspected

- `src/app/app/stories/page.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `tests/member-stories-profile-pages.test.tsx`
- `tests/member-mobile-shell-page.test.tsx`
- `tests/e2e/launch-smoke.spec.ts`
- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `docs/figma-control-inventory.md`
- `docs/member-stories-profile-control-honesty-acceptance-checklist.md`

## Purpose In Plain English

This packet explains what the repo-backed Stories experience is trying to be:
an Instagram-like member feed inside the General Student App shell. It should
feel like a real social feed visually, while still being honest that reactions,
publishing, sharing, and proof governance are not live production behaviors yet.

## Current Truth

- `Shell state`: route-backed member surface
- `Data state`: TEST/fixture-driven preview content
- `Implementation truth`: partial but strong source-backed shell
- `Launch posture`: preview-only social/proof behavior

## What The Source Actually Shows

- `/app/stories` is a real member-owned route, not just a parked placeholder.
- The screen uses a dedicated source-backed Stories component instead of a
  generic feed stub.
- The visual shape is mobile-first: tall card stack, sticky top header, pill
  filters, square story media, creator handle, action row, and a consent /
  publishing explainer block.
- The feed already uses explicit blocked-state copy for like, comment, share,
  and save actions.
- The member shell still matters: this is meant to feel like part of the
  General Student App, not a detached media microsite.

## What Makes It Feel IG-Like

- A simple "Stories" top bar with back affordance.
- Scrollable feed chips like `For You`, `Events`, `SLT`, `Fundraising`, and
  `Leadership`.
- Repeating story cards with:
  - creator handle
  - proof type label
  - square media stage
  - social action icons
  - story caption/body
- A lightweight reader/detail state driven by route query, not a totally
  separate shell.
- Social affordances stay visible even when they are blocked, because the shell
  is meant to look like a social feed rather than a plain document list.

## Control Honesty Rules

### Should be route-backed

- bottom-nav `Stories`
- member-home `MEDLIFE Stories` entry
- `/app/stories`
- filter query states when the route uses them
- story reader/detail selection when the route uses it

### Can stay visual or read-only

- filter chips if they only change local or query-backed display state
- story cards as readable feed items
- creator handles, proof-type labels, and summary text
- consent/publishing explanation panel

### Must stay blocked or preview-only

- likes
- comments
- shares
- saves
- publish/upload verbs
- external source/provider verbs
- any story count, engagement count, or moderation claim that sounds like live
  production truth

Nothing should silently do nothing. If a control is visible, it needs to be
route-backed, read-only, disabled, blocked, or clearly preview-only.

## TEST Label Rules

- Fake story titles, story captions, chapter names, user names, and proof-source
  labels should visibly include `TEST`.
- Real product and menu labels stay clean:
  - `myMEDLIFE`
  - `MEDLIFE Stories`
  - `Stories`
  - `Events`
  - `Points`
  - `Profile`
- `TEST` is UI honesty only. It never counts as production proof.

## What Counts As Real Progress

- The feed looks more like the exported/source-backed member shell instead of a
  generic list.
- Story navigation is clearer and more route-honest.
- Visible fake story content is consistently `TEST` labeled.
- Blocked social controls explain themselves instead of implying live behavior.
- Focused member route/component tests continue to prove the shell shape and
  blocked-state wording.

## What Does Not Count As Real Progress

- Adding prettier fake metrics or richer fake engagement counts.
- Making the feed feel more live without tightening blocked-state honesty.
- Treating smoke, screenshots, TEST rows, or local fixtures as proof of
  consent/storage/moderation readiness.
- Letting `Stories` look live while the underlying proof/story governance is
  still preview-only.

## Next Likely Builder Owner

- `#1` General Member App Builder

## Suggested Model

- `gpt-5.4` medium

## What Must Not Be Overstated As Production Proof

- social engagement
- story publishing
- consent approval
- moderation/storage readiness
- provider/source sync
- rollout evidence
- signed-in production proof

## Practical Reviewer Checks

- Does `/app/stories` still feel like the member mobile shell?
- Do the story cards and action row match the source-backed social-feed shape?
- Are blocked verbs still clearly blocked?
- Are fake visible story/user/chapter rows marked `TEST`?
- Did the PR stay in member-owned files and avoid auth/rollout/provider drift?

## Matrix Recommendation

This packet is planning-only and should not move readiness percentages by
itself. A clean implementation PR may support modest `Member App Scope/UI` and
`QA/Ops` movement only.
