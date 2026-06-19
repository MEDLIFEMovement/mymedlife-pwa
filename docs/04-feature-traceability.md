# 04 · Feature Traceability — Linking Features to Commits & Pull Requests

*Part of the MEDLIFE AI Project Documentation Kit · Applies from the first line of code onwards*

## Why This Matters

myMEDLIFE is moving quickly across several review surfaces. This file records the current traceability snapshot for the active Phase 1 MVP review packet so reviewers can see what each `MED-XXX` issue changes, which user story it supports, and where to review it in the repo.

## Current Source of Truth

- User stories: `docs/02-user-stories.md`
- GitHub repository: `MEDLIFEMovement/mymedlife-pwa`
- Active Phase 1 review branch: `feat/MED-414-rush-month-operating-path`
- Active Phase 1 pull request: `#94`
- Snapshot date: `2026-06-19`

## Review Notes

- The branch name only matches `MED-414`. The branch became the umbrella review lane for `MED-413`, `MED-415` through `MED-418`, and `MED-454` through `MED-470`.
- The `MED-XXX` issues listed below exist in the Linear project `myMEDLIFE PWA Operating System`.
- The table below lists the concrete routes, key implementation files, and tests that make each slice reviewable. It is intentionally concise rather than a full diff dump.
- If a slice does not map cleanly to an existing user story in `docs/02-user-stories.md`, it is marked `new — no US story`.

## PR #94 Traceability Map

| MED issue | User story match | Review routes | Key files | Tests | Status |
| --- | --- | --- | --- | --- | --- |
| MED-413 | US-33 | `/login`<br>`/onboarding`<br>`/profile`<br>`/chapter/members` | `src/app/onboarding/page.tsx`<br>`src/app/profile/page.tsx`<br>`src/services/auth-onboarding-workspace.ts`<br>`src/services/chapter-membership-workspace.ts` | `tests/auth-onboarding-workspace.test.ts`<br>`tests/chapter-membership-workspace.test.ts`<br>`tests/profile-workspace.test.ts` | In review via PR #94 |
| MED-414 | US-01 | `/`<br>`/rush-month`<br>`/rush-month/loop` | `src/app/page.tsx`<br>`src/components/rush-month-operating-path-panel.tsx`<br>`src/services/student-home-workspace.ts`<br>`src/services/rush-month-operating-path.ts` | `tests/student-home-workspace.test.ts`<br>`tests/rush-month-operating-path.test.ts` | In review via PR #94 |
| MED-415 | US-03, US-04, US-12 | `/rush-month/evidence`<br>`/rush-month/review` | `src/components/proof-upload-intake-panel.tsx`<br>`src/components/leader-proof-decision-workspace-panel.tsx`<br>`src/services/evidence-submission-workspace.ts`<br>`src/services/leader-proof-decision-write.ts`<br>`supabase/migrations/20260617010000_goal_115_leader_proof_decision.sql` | `tests/evidence-submission-workspace.test.ts`<br>`tests/leader-proof-decision-workspace.test.ts`<br>`tests/leader-proof-decision-write.test.ts`<br>`supabase/tests/database/rls_goal_115.test.sql` | In review via PR #94 |
| MED-416 | new — no US story | service-only slice | `src/services/points-kpi-ledger.ts`<br>`src/services/member-recognition.ts` | `tests/points-kpi-ledger.test.ts`<br>`tests/member-recognition.test.ts` | In review via PR #94 |
| MED-417 | US-31, US-34 | `/admin/integration-outbox` | `src/services/integration-contract-review.ts`<br>`src/services/admin-integration-outbox-workspace.ts`<br>`src/services/read-only-app-data.ts` | `tests/admin-integration-outbox-workspace.test.ts`<br>`tests/read-only-app-data.test.ts` | In review via PR #94 |
| MED-418 | US-32 | `/admin/release-readiness` | `src/components/discourse-bakeoff-panel.tsx`<br>`src/services/discourse-bakeoff-evaluation.ts`<br>`src/services/mvp-release-readiness.ts` | `tests/discourse-bakeoff-evaluation.test.ts`<br>`tests/mvp-release-readiness.test.ts` | In review via PR #94 |
| MED-454 | new — no US story | `/slt-prep`<br>`/slt-prep/checklist`<br>`/slt-prep/checklist/[itemId]`<br>`/slt-prep/forms`<br>`/slt-prep/payments`<br>`/slt-prep/meetings`<br>`/slt-prep/extensions`<br>`/slt-prep/timeline`<br>`/slt-prep/notifications`<br>`/slt-prep/profile`<br>`/slt-prep/staff` | `src/services/slt-trip-prep-workspace.ts`<br>`src/services/slt-trip-prep-staff-workspace.ts`<br>`src/components/slt-prep-primitives.tsx`<br>`src/components/slt-prep-subnav.tsx` | `tests/slt-trip-prep-workspace.test.ts`<br>`tests/slt-trip-prep-staff-workspace.test.ts` | In review via PR #94 |
| MED-455 | new — no US story | `/rush-month/events/[eventId]`<br>`/rush-month/leaderboard`<br>`/offline` | `src/services/rush-month-event-detail.ts`<br>`src/services/rush-month-event-rsvp.ts`<br>`src/services/member-leaderboard-workspace.ts`<br>`src/services/pwa-offline-support.ts`<br>`public/sw.js` | `tests/rush-month-event-detail.test.ts`<br>`tests/member-leaderboard-workspace.test.ts`<br>`tests/pwa-offline-support.test.ts`<br>`tests/pwa-manifest.test.ts` | In review via PR #94 |
| MED-456 | US-10 | `/chapter` | `src/components/chapter-leader-command-center-panel.tsx`<br>`src/services/chapter-leader-command-center.ts` | `tests/chapter-leader-command-center.test.ts` | In review via PR #94 |
| MED-457 | US-20, US-21, US-34 | `/staff` | `src/components/staff-command-center-panel.tsx`<br>`src/services/staff-command-center.ts`<br>`src/services/app-route-registry.ts`<br>`src/services/role-visibility.ts` | `tests/staff-command-center.test.ts`<br>`tests/app-route-registry.test.ts`<br>`tests/role-visibility.test.ts` | In review via PR #94 |
| MED-458 | US-31, US-34 | `/admin/audit-log` | `src/components/admin-audit-log-review-panel.tsx`<br>`src/services/admin-audit-log-review.ts` | `tests/admin-audit-log-review.test.ts` | In review via PR #94 |
| MED-459 | US-31, US-34 | `/admin/integration-outbox` | `src/app/admin/integration-outbox/page.tsx`<br>`src/services/admin-integration-outbox-workspace.ts` | `tests/admin-integration-outbox-workspace.test.ts` | In review via PR #94 |
| MED-460 | US-31, US-32 | `/admin/system-health` | `src/components/admin-system-health-review-panel.tsx`<br>`src/services/admin-system-health-review.ts` | `tests/admin-system-health-review.test.ts` | In review via PR #94 |
| MED-461 | new — no US story | `/admin/master-data` | `src/app/admin/master-data/page.tsx`<br>`src/services/admin-master-data-workspace.ts` | `tests/admin-master-data-workspace.test.ts` | In review via PR #94 |
| MED-462 | US-32 | `/admin/launch-gate` | `src/components/production-launch-gate-panel.tsx`<br>`src/services/production-launch-gate.ts` | `tests/production-launch-gate.test.ts` | In review via PR #94 |
| MED-463 | US-14 | `/campaigns`<br>`/campaigns/[campaignSlug]` | `src/services/campaign-starter-shell-readiness.ts`<br>`src/services/planning-goal-setting-campaign.ts`<br>`src/services/chapter-engagement-campaign.ts`<br>`src/services/slt-promotion-campaign.ts` | `tests/campaign-starter-shell-readiness.test.ts`<br>`tests/planning-goal-setting-campaign.test.ts`<br>`tests/chapter-engagement-campaign.test.ts`<br>`tests/slt-promotion-campaign.test.ts` | In review via PR #94 |
| MED-464 | US-40 | `/admin/design-qa` | `src/components/design-qa-readiness-panel.tsx`<br>`src/services/design-qa-readiness.ts` | `tests/design-qa-readiness.test.ts` | In review via PR #94 |
| MED-465 | US-42 | `/admin/operations` | `src/components/production-operations-runbook-panel.tsx`<br>`src/services/production-operations-runbook.ts` | `tests/production-operations-runbook.test.ts` | In review via PR #94 |
| MED-466 | US-31 | `/admin/database-security` | `src/components/database-security-decision-panel.tsx`<br>`src/services/database-security-decision.ts` | `tests/database-security-decision.test.ts` | In review via PR #94 |
| MED-467 | US-41, US-42 | `/admin/review-path`<br>`/admin/nick-review`<br>`/admin/release-readiness` | `src/components/nick-mvp-review-panel.tsx`<br>`src/services/nick-mvp-review.ts`<br>`src/services/route-smoke-manifest.ts`<br>`src/services/mvp-progress-map.ts` | `tests/nick-mvp-review.test.ts`<br>`tests/route-smoke-manifest.test.ts`<br>`tests/mvp-progress-map.test.ts`<br>`tests/mvp-release-readiness.test.ts` | In review via PR #94 |
| MED-468 | US-14, US-20, US-21, US-22 | `/coach`<br>`/rush-month/actions`<br>`/rush-month/dashboard` | `src/components/coach-support-notes-panel.tsx`<br>`src/services/coach-support-notes.ts`<br>`src/services/leader-actions-focus.ts`<br>`src/services/rush-month-dashboard-service.ts` | `tests/coach-support-notes.test.ts`<br>`tests/leader-actions-focus.test.ts`<br>`tests/rush-month-dashboard-service.test.ts` | In review via PR #94 |
| MED-469 | US-05, US-41, US-42 | `/admin`<br>`/rush-month`<br>`/rush-month/dashboard`<br>`/rush-month/actions/[assignmentId]`<br>`/slt-prep/*` | `README.md`<br>`docs/01-one-page-brief.md`<br>`docs/02-user-stories.md`<br>`docs/03-architecture-nfr.md`<br>`docs/04-feature-traceability.md`<br>`src/components/app-shell.tsx`<br>`src/components/local-role-switcher.tsx`<br>`src/services/admin-control-center.ts` | `tests/member-action-detail-page.test.ts`<br>`tests/local-actor-context.test.ts`<br>`tests/slt-trip-prep-workspace.test.ts`<br>`supabase/tests/database/rls_goal_5.test.sql` | In review via PR #94 |
| MED-470 | new — no US story | `/chapter`<br>`/staff` | `src/components/chapter-leader-command-center-panel.tsx`<br>`src/components/staff-command-center-panel.tsx` | `tests/chapter-leader-command-center.test.ts`<br>`tests/staff-command-center.test.ts` | In review via PR #94 |

## Safe Environment Defaults

`.env.example` remains in the intended local-review posture:

- `MYMEDLIFE_DATA_SOURCE=mock`
- `MYMEDLIFE_AUTH_MODE=disabled`
- `MYMEDLIFE_ENABLE_ACTION_START_WRITE=false`
- `MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=false`
- `MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=false`
- `MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=false`
- `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=false`
- `MYMEDLIFE_ENABLE_LEADER_PROOF_DECISION_WRITE=false`

## Validation Snapshot

Local validation used for the current PR #94 review packet:

- `pnpm typecheck` passed
- `pnpm lint` passed
- `pnpm test` passed: `108` files, `629` tests, `0` failures
- `pnpm build` passed

## Convention Gap Still Visible

The current branch does not satisfy the ideal branch naming rule from the original template because it is an umbrella branch rather than a single-issue branch. For this review pass, traceability is being carried explicitly through:

1. the Linear `MED-XXX` issues
2. this mapping table
3. the PR #94 description
4. commit messages that already reference the `MED-XXX` slices

Future slices should return to the standard branch shape:

- `feat/MED-XX-short-description`
- `fix/MED-XX-short-description`
- `chore/MED-XX-short-description`
- `docs/MED-XX-short-description`
