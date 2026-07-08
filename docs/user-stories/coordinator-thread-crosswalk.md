# myMEDLIFE Coordinator Thread Crosswalk

Date: 2026-07-08  
Owner lane: myMEDLIFE #5, planning/docs only  
Purpose: compact routing map for Coordinator when assigning the next builder
slice or reviewing a PR.

## Thread-To-Shell Crosswalk

| Thread | Shell / module family | Strongest next slice | Major non-goals | Likely matrix columns affected |
| --- | --- | --- | --- | --- |
| `#1` | General Member App | Member `/app/events` -> detail -> RSVP/check-in -> `/app/points` continuity | Leader/staff/admin files, auth rewrites, live RSVP/check-in/attendance writes, points awards, provider sync, rollout proof | `Scope/UI`, possibly `QA/Ops` after tests/smoke |
| `#2` | Student Leadership / Chapter Command Center | Service-backed `/leader?view=*` menu/view restoration and leadership-family route continuity | Member/staff/admin files, event creation writes, attendance imports, role/member mutations, points awards, production proof | `Scope/UI`, possibly `QA/Ops` after tests/smoke |
| `#3` | Staff / DS Admin Command Center | Staff chapter drawer / embedded Admin / Chapters loop coherence | Member/leader files, rollout packet ownership, owner CSV apply, invite gate, provider writes, admin mutations, production proof | `Scope/UI`, possibly `QA/Ops` after tests/smoke |
| `#4` | Release / QA watch | PR-board watch, focused checks, visible TEST review, no-write smoke classification | Implementation work, matrix edits, rollout proof claims, production/provider access | `QA/Ops` confidence only when tied to real checks |
| `#5` | Repo truth story/backlog planning | Keep stories, backlog, acceptance packets, and stale-steering notes current | Product code edits, rollout proof capture, provider/API access, matrix editing | No movement from planning alone |

## Matrix Language To Reuse

- `Scope/UI`: can move modestly when a shell PR lands, preserves Figma/source
  fidelity, keeps menu/control honesty, and passes focused checks.
- `QA/Ops`: can move modestly when focused tests, browser smoke, or visual QA
  provide real evidence for the affected shell.
- `Data/Auth`: moves only from implemented and tested role/data/privacy/safety
  contracts or real signed-in proof readiness work.
- `Writes/Integrations`: moves only from approved write/provider contracts,
  audit/outbox proof, fail-closed tests, and explicit activation approval.
- `Rollout Gate`: moves only from real owner-approved data, live counts,
  production signed-in route proof, pilot proof, audit/outbox zero-send proof,
  and final Coordinator/Nick approval.

Planning docs, shell screenshots, public no-write smoke, TEST cleanup, local
actors, sandbox rows, Figma data, and preview flows do not move rollout proof by
themselves.

## Reviewer Shortcut

Before merge, ask:

- Did the PR stay inside the assigned shell family?
- Did it name source/Figma evidence, with screenshots secondary?
- Are visible fake rows marked `TEST`?
- Are unfinished controls route-backed, read-only, disabled, blocked, or
  preview-only?
- Did the PR avoid live writes, provider sends, invites, owner CSV changes,
  production proof rows, and launch-gate claims?
- Are tests/checks focused on the changed shell?

## Current Superseded Guidance

- `#2` leaderboard-first polish is superseded by broader `/leader?view=*`
  continuity.
- `#3` rollout packet / owner CSV / invite-gate ownership is superseded by Staff
  / DS Admin shell ownership.
- Shell PRs should not claim `Data/Auth`, `Writes/Integrations`, or
  `Rollout Gate` movement without separate proof.
