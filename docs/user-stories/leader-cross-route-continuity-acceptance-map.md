# Leader Cross-Route Continuity Acceptance Map

Date: 2026-07-08  
Owner lane: `#2` Student Leadership / Chapter Command Center Builder  
Planning status: docs/spec only; no product code changed here.

## Purpose

Give `#2`, `#4`, and Coordinator a narrow acceptance target for the next leader
continuity pass after the current `#533/#535/#539` wave. The leader shell no
longer needs broad shape restoration as the primary next move. The remaining
visible pressure is cross-route continuity: Chapter Home, Member Profile,
Current Leaders, Succession, Values, and Leadership Training should feel like
one source-backed leadership review flow instead of separate preview panels.

This packet should help `#2` restore return paths and selected-member context
without inventing live promotion, succession, interview, note, notification, or
assignment writes.

## Sources Inspected

Repo implementation truth:

- `src/app/leader/page.tsx`
- `src/components/chapter-leader-command-center-panel.tsx`
- `src/services/chapter-leader-command-center.ts`
- `src/services/leader-command-center-routing.ts`
- `src/services/leader-launch-lane.ts`
- `tests/chapter-leader-command-center.test.ts`
- `tests/e2e/launch-smoke.spec.ts`
- `docs/user-stories/leader-shell-acceptance-packet.md`
- `docs/user-stories/module-to-shell-acceptance-map.md`
- `docs/user-stories/current-shell-wave-sequencing.md`

Exported/source acceptance-shape signal:

- source-backed leader shell/menu structure in `ChapterLeaderCommandCenterPanel`
- local exported/source materials and SOP leadership-transition chunks as scope
  signals only, not implementation proof

## Current Repo Truth

- `/leader` is route-backed and signed-in/role-scoped through
  `src/app/leader/page.tsx`.
- The service-backed leader shell currently includes these views:
  `overview`, `leaderboard`, `leaders`, `members`, `member_profile`,
  `committees`, `events`, `impact`, `bridge_videos`, `succession`, `values`,
  `training`, and `feed_analytics`.
- Query state supports selected member, committee, event, leaderboard metric,
  region, benchmark, impact story, pipeline, search, bridge filter, bridge
  video, feed post, and quick action.
- `buildChapterLeaderCommandCenterHref` is tested for preserving route intent
  across member, committee, event, bridge, feed, leaderboard, and selected
  member handoffs.
- Member Profile quick-action states already keep preview-only actions visible,
  including chair review, E-Board review, event flow, values interview, and note
  review.
- Succession, Values, and Leadership Training routes are visible and
  preview-safe.
- None of this proves live role changes, promotion, succession approval,
  interview scheduling, note saves, attendance imports, notifications, points
  awards, or rollout readiness.

## Source-Backed Continuity Contract

The leader command center should preserve:

- one route family: `/leader?view=*`
- stable side/menu access to the leadership family
- selected-member context when moving from Member Profile to Succession, Values,
  and Training where the route supports it
- return-path clarity from quick-action states back to the owning route
- visible current-leader and candidate context before any succession or values
  action reads as actionable
- preview-only action language for promotion, nomination, values interview,
  training resources, notes, and assignments
- `TEST` labels on fake leaders, members, chapters, events, leadership samples,
  and mock metrics

## What Still Needs Tightening

Remaining likely drift/gap items for `#2`:

- some links can feel like they open a new panel without making the return path
  obvious
- selected-member context must stay visible across Member Profile, Current
  Leaders, Succession, Values, and Training when a `member` query exists
- quick-action states should name the owning route before sending the reviewer
  somewhere else
- Values and Leadership Training should not feel like live interview scheduling,
  training assignment, deck launch, or external-resource opening
- Current Leaders and Succession should not imply real role/member mutation
- copied or fallback links should not depend on non-shareable in-memory click
  state when a query-backed route can express the same context

## Smallest Useful #2 Slice

Smallest acceptable implementation scope:

- Tighten cross-route copy and hrefs across Member Profile, Current Leaders,
  Succession, Values, and Leadership Training.
- Preserve selected-member query context where source-backed and useful.
- Add or update focused tests for route/href continuity and blocked/preview-only
  wording if repo truth changes.
- Do not redesign the leader shell or add new modules.

Likely files in scope:

- `src/components/chapter-leader-command-center-panel.tsx`
- `src/services/chapter-leader-command-center.ts`
- `src/services/leader-command-center-routing.ts`, only if route resolution is
  actually the issue
- `src/app/leader/page.tsx`, only if service-backed view routing needs a tiny
  correction
- `tests/chapter-leader-command-center.test.ts`

Files and lanes out of scope:

- `/app` member shell files
- `/staff` or `/admin` shell files
- auth/RLS/session helpers
- provider, notification, assignment-write, event-write, or points-write
  services
- rollout packets, owner CSVs, production signed-in proof, live counts

## Acceptance Checklist

Reviewer acceptance for `#2`:

- `/leader?view=overview` still opens the source-backed leader shell.
- `/leader?view=member_profile&member=<id>` keeps the selected member visible
  and `TEST` labeled.
- Current Leaders can hand off to Succession and Values without losing selected
  member/search/pipeline context where source-backed.
- Succession can return to member or members context without implying a real
  promotion, nomination, role change, or succession approval.
- Values routes make interview/scheduling/form controls visibly preview-only or
  blocked.
- Leadership Training remains visible as preview content; resource opens,
  publishing, assignment, completion, or external-provider behaviors are not
  fake-live.
- Links are route-backed with shareable query state where practical; no silent
  dead controls and no dependence on unshareable click-only state for important
  review context.
- Product/menu labels stay clean: `MEDLIFE`, `myMEDLIFE`, `Values`,
  `Succession`, `Leadership Training`, `Current Leaders`, role labels, and menu
  labels are not prefixed with `TEST`.
- Fake/sample leaders, members, chapters, events, pipeline rows, story/proof
  samples, and fake metrics remain visibly `TEST` labeled.

## What Must Stay Preview-Safe Or Blocked

- promotion or nomination writes
- succession approval or role changes
- interview scheduling, invite sending, or form submission
- training assignment, completion, publishing, playback tracking, or external
  deck/resource launch
- leader notes or follow-up saves
- committee/member mutations
- event, attendance, or points writes
- notifications, HubSpot, Luma, n8n, email, SMS, or provider sync
- production signed-in proof or rollout evidence

## What Counts As Real Progress

Real progress from this slice:

- Leader `Scope/UI` progress if the leadership-family routes feel connected
  and source-backed.
- Possible `QA/Ops` progress if focused tests prove route/href continuity and
  blocked-state copy.
- Cleaner Coordinator/#4 review because cross-route behavior is shareable and
  visible.

Not progress from this slice:

- Data/Auth readiness
- Writes/Integrations readiness
- production proof
- rollout readiness
- provider readiness

## Reviewer Checks

Suggested `#4` or Coordinator review:

- Open `/leader?view=overview`, `/leader?view=leaders`,
  `/leader?view=members`, `/leader?view=member_profile&member=member-ivy`,
  `/leader?view=succession&member=member-ivy`,
  `/leader?view=values&member=member-ivy`, and `/leader?view=training`.
- Confirm selected-member context remains visible when a member query is used.
- Confirm values/succession/training actions are route-backed or explicitly
  preview-only/blocked.
- Confirm no button copy claims a live promotion, nomination, role change,
  interview invite, note save, training completion, provider send, or points
  award.
- Confirm no visible fake row lost the `TEST` marker.

## Matrix Guidance

Planning alone moves nothing.

If implemented and tested cleanly, this can support modest Leader `Scope/UI`
and possibly `QA/Ops` movement. It must not move Data/Auth, Writes/Integrations,
production proof, provider readiness, or Rollout Gate.
