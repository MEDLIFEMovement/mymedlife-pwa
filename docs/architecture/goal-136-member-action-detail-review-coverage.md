# Goal 136: Member Action Detail Review Coverage

Status: focused review coverage for one assigned member action.

Goal 136 makes `/rush-month/actions/member-push` a first-class checkpoint in
the MVP review path. The action-detail route already existed; this goal makes
the member-facing action detail explicit in stakeholder walkthroughs, route
smoke assertions, MVP coverage, progress, release-readiness language, and
reviewer docs.

## Purpose

The full MVP requires members to move from chapter context into an assigned
Rush Month action before proof submission, points, leaderboard recognition, and
review. `/rush-month/actions/member-push` shows the assigned action title,
owner role, status, due date, proof requirement, KPI, points posture, proof
handoff, local action-start posture, disabled proof/upload controls, outbox
preview, and next safe action.

## What Changed

- `src/services/stakeholder-review-plan.ts` includes one concrete member
  action-detail review step.
- `src/services/route-smoke-manifest.ts` now asserts the action-detail pass
  signals and write boundary.
- MVP coverage, progress, and release-readiness services now call out member
  action detail as a formal member-flow checkpoint.
- Reviewer docs and tests cover the no-write boundary.

## Safety Boundary

This does not enable action-start saves, proof metadata saves, file uploads,
direct points/KPI writes, reminders, production auth, student invitations, or
external sends. The route remains role-scoped and mock-safe unless localhost
write flags are explicitly approved for a separate write slice.
