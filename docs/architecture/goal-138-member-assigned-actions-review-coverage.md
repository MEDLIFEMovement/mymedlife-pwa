# Goal 138: Member Assigned-Actions Review Coverage

Status: focused review coverage for the member assigned-actions list.

Goal 138 makes `/rush-month/actions` a first-class member checkpoint in the MVP
review path. The route already existed and also supports leader follow-up; this
goal makes the member assigned-actions view explicit before reviewers open one
action detail.

## Purpose

The full MVP requires members to move from the Rush Month overview into their
assigned work before action detail, proof submission, points, and recognition.
`/rush-month/actions` shows the local member's visible assignments, due dates,
status, proof requirements, points, KPI signal, and links into action detail.

## What Changed

- `src/services/stakeholder-review-plan.ts` includes `/rush-month/actions` as a
  member assigned-actions review step, separate from the leader follow-up step.
- `src/services/route-smoke-manifest.ts` now asserts the member assigned-actions
  pass signals and write boundary.
- MVP coverage, progress, and release-readiness services now call out assigned
  actions as a formal member-flow checkpoint.
- Reviewer docs and tests cover the no-write boundary.

## Safety Boundary

This does not enable assignment creation, action-start saves, proof saves,
reminders, direct points/KPI writes, browser writes, production auth, student
invitations, or external sends. Leader assignment creation remains a separate
guarded local write path.
