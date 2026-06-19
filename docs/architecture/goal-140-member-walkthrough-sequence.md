# Goal 140: Member Walkthrough Sequence Review

Status: focused review-order checkpoint for the member MVP walkthrough.

Goal 140 orders `/admin/review-path` so the first stakeholder walkthrough follows
the actual member MVP journey before moving into leader, coach, and admin
surfaces.

## Purpose

The full MVP review should read like a student would experience Rush Month:
sign in, confirm role scope, understand onboarding, land on the chapter home,
enter Rush Month, review assigned actions, open an action detail, understand
proof submission, see points and leaderboard context, check the member dashboard,
review events, and open one event detail.

## What Changed

- `src/services/stakeholder-review-plan.ts` now orders the member sequence from
  `/login` through `/rush-month/events/event-rush-social-001` before leader,
  coach, proof-library, and admin review surfaces.
- `tests/stakeholder-review-plan.test.ts` asserts the first twelve review steps
  by step id so the route cannot silently drift back into a screen inventory.
- `src/services/mvp-release-readiness.ts` and reviewer docs now call out the
  member walkthrough sequence as a Goal 140 local-review checkpoint.

## Safety Boundary

This changes review sequencing only. It does not enable production auth, profile
writes, membership writes, action-start saves, proof metadata saves, file
uploads, points/KPI writes, Luma writes, n8n workflows, warehouse exports, AI
summaries, external sends, real student pilots, or student invitations.
