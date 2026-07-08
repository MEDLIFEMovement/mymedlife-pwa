# Leader Next Slice Brief

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#2` Student Leadership / Chapter Command Center

## Live Repo Context

The leader lane is currently centered on service-backed `/leader?view=*`
continuity and leadership-family route honesty. Active or recent PRs include:

- `#512` leader service-backed leadership continuity, healthy rerun/watch.
- Earlier leader shell work restored live route continuity and support/culture
  handoffs.

The older leaderboard-first recommendation is superseded until the broader
leader menu/view continuity base is stable.

## Exact Next Recommended Slice

**Cross-route continuity across Member Profile, Current Leaders, Succession,
Values, and Leadership Training.**

Scope the PR around leader-owned screens that are directly connected by
service-backed `/leader?view=*` routing and leadership development handoffs.

The goal is to make the leader shell feel like one coherent Chapter Command
Center without implying live role changes, succession writes, training
assignment writes, or member mutations.

## Why This Is Best From Repo Truth

Leader work has matured beyond isolated preview panels. The current risk is
cross-route drift: menu items, handoff copy, and action controls may exist, but
they can still imply more live authority than the shell safely supports.

This slice keeps the highest-value leadership surfaces usable for review while
preserving strict write-safety boundaries.

## Likely File Families

Inspect first:

- `src/app/leader/page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/leader-app-shell.tsx`
- `src/components/leadership-transition-campaign-panel.tsx`
- `tests/leader-command-center-routing.test.ts`
- `tests/leader-page.test.tsx`
- `tests/figma-leader-support-screens.test.tsx`

Avoid:

- `/app`, `/staff`, `/admin`
- production role writes
- member mutation services
- event creation writes
- attendance imports
- Luma/provider sync
- notifications
- points awards
- rollout proof

## Figma / Exported-Source Acceptance Checks

- Source-backed leader menu families remain visible.
- Direct `/leader?view=*` links and reloads preserve the intended view.
- Member Profile, Current Leaders, Succession, Values, and Leadership Training
  read as connected leader surfaces, not unrelated panels.
- Action buttons that sound operational are blocked, disabled, read-only, or
  preview-only.
- The shell preserves Student Leadership / Chapter Command Center visual
  language from exported/Figma source.

## TEST-Label Expectations

Visible fake/sandbox/Figma-derived content must show `TEST`, including:

- leader names
- member names
- chapter names
- current-leader/succession examples
- leadership training examples
- story/support/culture sample content
- leaderboard or points rows if visible
- fake metrics and task examples

Keep product/menu/role terms clean: MEDLIFE, myMEDLIFE, Events, Attendance,
Points, Leadership Training, role labels, and menu labels should not be
prefixed.

## Visible But Preview-Only

Keep these visible if source-backed, but do not make them sound live:

- promote / transition / succession controls
- assign training
- update member/profile/role
- contact / follow-up / notification controls
- event or attendance follow-through
- points/leaderboard readback
- story/proof publish or share controls

## Matrix Columns

If landed and tested/smoked, this slice may support:

- `Scope/UI`
- `QA/Ops`

It must not move:

- `Data/Auth`
- `Writes/Integrations`
- `Rollout Gate`

## What Does Not Count As Rollout Proof

- leader shell screenshots
- public no-write smoke
- TEST leader/member/chapter rows
- local role switchers
- preview profile handoffs
- source/Figma data

## Blockers To Starting Safely

Do not start if:

- `#512` or another active leader PR is still editing the same route/menu files,
- the slice requires shared routing/auth helper changes,
- it starts persisting succession, role, member, training, assignment, or points
  changes,
- Coordinator wants #2 to stay on queue hygiene for active leader PRs first.
