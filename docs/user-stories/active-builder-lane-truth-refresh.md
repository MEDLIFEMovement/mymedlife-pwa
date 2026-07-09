# Active Builder Lane Truth Refresh

Date: 2026-07-09
Owner lane: `#5` MVP Story + Production Planning, docs/spec only

## Purpose

Keep the live builder-support layer aligned after the merged member profile body
and Stories feed acceptance maps. This is a coordinator handoff, not a product
implementation request.

Use this packet when deciding what `#1`, `#2`, `#3`, and `#4` should do next
without rereading the whole story package.

## Current Repo / Queue Truth Used

- PR `#617` is merged.
- PR `#620` is merged; Coordinator reported public no-write smoke stayed
  `11/11` green after the merge.
- PR `#619` is merged.
- PR `#618` is merged.
- PR `#621` is merged.
- No new member front branch is promoted in this packet; `#1` should shape the
  next member seam locally until Coordinator identifies the next real front
  candidate.
- The active planning layer still separates implementation truth from
  Figma/exported-source acceptance shape.
- Open PR board noise and older parked branches should not outrank the
  no-active-member-front state unless Coordinator gives a fresher queue
  correction.
- TEST/sandbox/Figma-derived visible people, chapters, events, stories, proof
  cards, metrics, placeholder owners, and audit actors must keep visible `TEST`
  labels until replaced by approved real data or hidden.
- Rollout-proof truth is unchanged: shell merges, public smoke, green CI, and
  TEST/sandbox rows do not prove owner data, signed-in production authority,
  provider writes, pilot readiness, or rollout approval.

## Sources Inspected

Repo/story planning docs:

- `docs/user-stories/current-shell-acceptance-handoff-index.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`

Current acceptance maps:

- `docs/user-stories/member-profile-body-rhythm-acceptance-map.md`
- `docs/user-stories/member-stories-ig-feed-acceptance-map.md`
- `docs/user-stories/leader-cross-route-continuity-acceptance-map.md`
- `docs/user-stories/staff-embedded-admin-return-loop-acceptance-map.md`
- `docs/user-stories/staff-topbar-shell-acceptance-map.md`

Live PR signal:

- `gh pr view 617` confirmed merged.
- `gh pr view 620` confirmed merged.
- `gh pr view 619` confirmed merged.
- `gh pr view 618` confirmed merged.
- `gh pr view 621` confirmed merged.
- This packet captures planning order and acceptance boundaries only; it should
  not be read as approval for older parked branches.

## Builder Truth Refresh

### `#1` General Member App

Next safest slice:

1. Keep the next local member seam focused on source-backed member loop
   continuity instead of broad member redesign.
2. Preserve the existing profile, Stories, events/detail, points, and bottom-nav
   acceptance contracts while the queue clears.

Likely source-backed surfaces:

- `/profile`
- `/app`
- `/app/stories`
- bottom nav
- member profile panel
- Stories feed/reader route state

Do not broaden into:

- profile/contact/emergency/traveler writes
- story publishing, uploads, comments, saves, shares, proof ingestion, or
  moderation
- `/leader`, `/staff`, `/admin`
- auth/RLS, provider services, rollout packet, owner data, live counts, or
  production proof

What counts as progress:

- `Scope/UI` progress when member shell rhythm, profile body hierarchy, bottom
  nav continuity, and Stories IG-feed fidelity better match the source-backed
  acceptance maps.
- `QA/Ops` progress only if focused route/component/browser checks prove those
  routes, query states, TEST labels, and blocked controls.

What does not count:

- No profile screenshot, TEST story, local actor, or public smoke result proves
  Data/Auth, Writes/Integrations, or Rollout Gate readiness.

### `#2` Student Leadership / Chapter Command Center

Next safest slice:

- PR `#619` is merged, so stop describing it as active queue work.
- Keep the next local seam narrow: leader attendance,
  member-review, and simple-leaderboard return-path continuity.

Current steering correction:

- Leader guidance is no longer leaderboard-first and is not a broad shell
  rebuild. The higher-value gap is `/leader?view=*` continuity: selected-member
  context, return paths, service-backed routes, and preview-safe handoff copy.

Likely source-backed surfaces:

- `/leader?view=overview`
- `/leader?view=members`
- `/leader?view=member_profile`
- `/leader?view=leaders`
- `/leader?view=succession`
- `/leader?view=values`
- `/leader?view=training`

Do not broaden into:

- real leader/member/role changes
- promotion or succession writes
- interview scheduling, notes, training completion, assignments, notifications,
  attendance imports, points awards, or provider sends
- member app files, staff/admin files, rollout packet, owner data, or
  production signed-in proof

What counts as progress:

- `Scope/UI` progress when route/query continuity, selected-member context,
  return links, and preview-safe copy make the leader shell feel like one
  source-backed command center.
- `QA/Ops` progress only with focused leader route/href tests or browser smoke.

What does not count:

- A cleaner leader path does not prove production leader data, role authority,
  live attendance, points ledger, or rollout readiness.

### `#3` Staff / DS Admin Command Center

Next safest slice:

- PR `#620` is now merged, so stop describing its staff/admin seam as pending.
- Shape the next staff/admin seam locally while there is no promoted member
  front branch: chapter oversight honesty, embedded Admin context, and visible
  TEST-label coverage without claiming rollout proof.

Current steering correction:

- Staff topbar/header overlap remains an acceptance check, but it is not the
  primary missing slice unless a new screenshot, smoke failure, or current-main
  repro proves otherwise. The stronger next lane is embedded Admin return-loop
  coherence.

Likely source-backed surfaces:

- `/staff?view=chapters`
- chapter drawer
- `/staff?view=proof_ugc`
- `/staff?view=admin&adminView=chapters`
- `/staff?view=admin&adminView=audit`
- embedded dark Admin shell

Do not broaden into:

- live admin writes
- chapter/user/role mutation
- proof approval, publish, ingest, consent approval, or provider/social sync
- audit mutation, API key reveal/copy/rotate, MCP connect, owner CSVs, invites,
  rollout packet, live counts, or production proof

What counts as progress:

- `Scope/UI` progress when Staff/Admin route loops preserve chapter/proof
  context, Admin copy, dark shell affordances, and source-backed back labels.
- `QA/Ops` progress only if focused staff/admin tests or browser smoke prove the
  route loops and blocked-control posture.

What does not count:

- An embedded Admin screen that looks coherent does not prove live admin
  authority, provider readiness, audit truth, proof moderation readiness, or
  rollout gate movement.

### `#4` Release / QA Watch

Next safest watch posture:

- Treat shell PRs as merge candidates only after scope, tests, TEST labels,
  visible controls, and blocked-state copy match the relevant acceptance map.
- Public no-write smoke is useful after merged shell waves or when Coordinator
  asks for route availability proof.
- Public smoke is noise when the question is source-fidelity detail, role-proof,
  provider readiness, or rollout evidence.

Do not count as rollout proof:

- screenshots
- TEST/sandbox/Figma rows
- local actors
- public unauthenticated smoke
- green CI
- preview-only shells
- disabled provider controls

## Superseded Steering

Retire these as primary next recommendations unless fresh repo evidence reopens
them:

- `#2` leaderboard/comparison polish as the leader-first priority.
- broad leader shell rebuild as the next priority after the service-backed menu
  wave.
- `#3` topbar-only pass as the staff/admin next priority when no current-main
  overlap repro exists.
- assigning `#3` to rollout owner CSV, invite-gate, or production evidence work.
- mixing `#1` profile body rhythm and Stories IG-feed changes into one large
  member PR.

## Biggest Launch-Gap Truth

The app can keep gaining shell/UI fidelity while narrow launch is still blocked
by production evidence. The biggest remaining gap is not "can we show the
screens"; it is proving real production data, signed-in role access, RSVP /
check-in / attendance truth, points authority, provider/write boundaries, and
rollout approval.

Planning docs, source maps, screenshots, TEST content, and public no-write smoke
do not move Rollout Gate by themselves.

## Matrix Narrative

- Planning artifact alone: no percentage movement.
- Clean shell implementation plus focused tests can move `Scope/UI` and
  sometimes `QA/Ops` for the affected shell.
- No `Data/Auth`, `Writes/Integrations`, production proof, provider readiness,
  or `Rollout Gate` movement without the corresponding real evidence.
