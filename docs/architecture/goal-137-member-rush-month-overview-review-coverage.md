# Goal 137: Member Rush Month Overview Review Coverage

Status: focused review coverage for the Rush Month campaign front door.

Goal 137 makes `/rush-month` a first-class checkpoint in the MVP review path.
The overview route already existed; this goal makes the member-facing campaign
front door explicit in stakeholder walkthroughs, route smoke assertions, MVP
coverage, progress, release-readiness language, and reviewer docs.

## Purpose

The full MVP requires members to move from chapter context into the active Rush
Month campaign before assigned actions, proof, points, events, and leader/coach
review. `/rush-month` shows the active campaign objective, role next action,
visible action count, proof pending count, coach-read posture, closeout
readiness, event/proof sections, this-week operating path, and links into the
dashboard, actions, and events.

## What Changed

- `src/services/stakeholder-review-plan.ts` includes `/rush-month` as a member
  Rush Month overview review step.
- `src/services/route-smoke-manifest.ts` now asserts the overview pass signals
  and write boundary.
- MVP coverage, progress, and release-readiness services now call out the Rush
  Month overview as a formal member-flow checkpoint.
- Reviewer docs and tests cover the no-write boundary.

## Safety Boundary

This does not enable campaign phase changes, assignment saves, proof saves,
direct points/KPI writes, Luma writes, n8n workflows, production auth, student
invitations, or external sends. The route remains role-scoped and read-only.
