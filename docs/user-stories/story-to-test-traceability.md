# myMEDLIFE Story-To-Test Traceability

Date: 2026-07-07
Owner lane: myMEDLIFE #5, planning/docs only
Linear planning reference: MED-512
Purpose: connect the repo-truth MVP stories and highest-priority delivery
backlog slices to concrete test evidence, while keeping UI completeness,
test coverage, and rollout proof separate.

## Truth Rules

- Repo implementation truth wins for current status.
- Figma/exported code is the visual and navigation contract, not production
  proof.
- Smoke, screenshots, local, TEST, sandbox, and preview evidence can support
  UI/QA confidence, but never production rollout proof by themselves.
- Visible fake/sandbox/Figma-derived people, chapters, events, stories, proof,
  campaigns, SOPs, audit actors, and metrics must keep `TEST` visible until
  replaced by approved real data or hidden.
- Rollout evidence remains separate from UI shell work: owner CSVs, production
  packet, live counts, signed-in route proof, pilot proof, audit/outbox
  zero-send proof, and final approval cannot be satisfied by docs alone.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- `docs/user-stories/delivery-backlog.md`
- Repo `origin/main` at `fa3d114` (`Add MED-512 delivery backlog (#437)`)
- `tests/e2e/launch-smoke.spec.ts`
- `tests/member-mobile-shell-page.test.tsx`
- `tests/member-event-detail-page.test.tsx`
- `tests/member-launch-lane-events.test.ts`
- `tests/launch-lane-points-readback.test.ts`
- `tests/leader-page.test.tsx`
- `tests/leader-command-center-routing.test.ts`
- `tests/staff-page.test.tsx`
- `tests/admin-control-center.test.ts`
- `tests/admin-management-pages.test.tsx`
- `tests/admin-audit-log-review.test.ts`
- `tests/admin-system-health-review.test.ts`
- `tests/production-launch-gate.test.ts`
- `tests/production-signed-in-route-proof-readiness.test.ts`
- `tests/points-leaderboard-award-safety-contract.test.ts`
- `tests/proof-ugc-consent-storage-safety-contract.test.ts`
- `tests/coach-staff-portfolio-intervention-safety-contract.test.ts`
- `tests/production-rollout-owner-return-intake.test.ts`
- `tests/production-live-data-readiness.test.ts`
- `tests/production-pilot-event-proof.test.ts`

## Coverage Key

| Strength | Meaning |
| --- | --- |
| `strong` | Multiple route/component/service/e2e tests cover the expected local behavior or blocked posture. |
| `partial` | Some direct route or service tests exist, but coverage does not fully prove the story. |
| `weak` | Only broad smoke, docs, or indirect tests were found. |
| `none` | No meaningful repo test evidence found in this pass. |

Completion labels:

- `UI-complete`: shell/route/control behavior is test-covered enough for local
  review, but may still be mock-safe.
- `test-complete`: current local behavior and blocked states have strong tests.
- `rollout-blocked`: real production evidence is still missing even if UI/tests
  are strong.

## MVP Story Traceability

| Story ID | Persona | Route / surface | Owner lane | Current truth | Test evidence | Coverage | Missing coverage | Missing proof | Completion label |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MVP-MEM-01 | member | `/login`, `/app` | #1 / Data-Safety | partial | `tests/e2e/launch-smoke.spec.ts`, `tests/launch-lane-auth-readiness.test.ts`, `tests/local-sandbox-auth-routing.test.ts`, `tests/production-signed-in-route-proof-readiness.test.ts` | partial | Real production auth route proof path is readiness-tested, not executed. | Real member account, profile/role row, signed-in production route proof. | rollout-blocked |
| MVP-MEM-02 | member | `/app` | #1 | built shell / mock-safe | `tests/member-mobile-shell-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | More device-specific mobile QA remains useful. | Real member/chapter data and production account proof. | UI-complete |
| MVP-MEM-03 | member | `/app/events` | #1 | partial | `tests/member-mobile-shell-page.test.tsx`, `tests/member-launch-lane-events.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Production event source tests remain separate. | Approved real event rows and chapter mapping. | rollout-blocked |
| MVP-MEM-04 | member | `/app/events/[eventId]?step=rsvp` | #1 / Data-Safety | preview-only | `tests/member-event-detail-page.test.tsx`, `tests/member-launch-lane-events.test.ts`, `tests/event-loop-data-auth-readiness-doc.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Write-path tests should be added only when write approval exists. | RSVP write/readback proof, Luma boundary, audit/outbox. | test-complete locally, rollout-blocked |
| MVP-MEM-05 | member | `/app/events/[eventId]?step=checkin` | #1 / Data-Safety | preview-only | `tests/member-event-detail-page.test.tsx`, `tests/launch-lane-event-snapshots.test.ts`, `tests/event-loop-pilot-foundation.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Real QR/attendance import tests remain future work. | Approved attendance source, QR proof, audit/readback. | test-complete locally, rollout-blocked |
| MVP-MEM-06 | member | `/app/points` | #1 / Data-Safety | partial | `tests/member-mobile-shell-page.test.tsx`, `tests/member-event-detail-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/points-leaderboard-award-safety-contract.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Production ledger mutation tests should not exist until approval. | Real points ledger, award authority, duplicate handling, production proof. | rollout-blocked |
| MVP-LDR-01 | leader | `/leader?view=overview` | #2 | built shell / partial data | `tests/leader-page.test.tsx`, `tests/leader-command-center-routing.test.ts`, `tests/chapter-leader-command-center.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Production leader data proof remains outside UI tests. | Real leader account and chapter-scoped rows. | UI-complete |
| MVP-LDR-02 | leader | `/leader?view=events`, attendance | #2 / Data-Safety | partial | `tests/leader-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/events-points-launch-lane.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Live attendance follow-up tests are blocked until approved. | Real event, RSVP, attendance, permissioned chapter data. | rollout-blocked |
| MVP-LDR-03 | leader | `/leader?view=leaderboard` | #2 / Data-Safety | partial | `tests/leader-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/points-leaderboard-award-safety-contract.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Production leaderboard proof remains missing. | Real points ledger and award authority. | rollout-blocked |
| MVP-STF-01 | coach/staff | `/staff?view=chapters` | #3 | built shell / partial data | `tests/staff-page.test.tsx`, `tests/staff-command-center.test.ts`, `tests/staff-launch-lane.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Real staff portfolio data tests remain rollout-dependent. | Real staff/support account and approved chapter portfolio data. | UI-complete |
| MVP-STF-02 | coach/staff | staff events / leaderboard / chapters | #3 / Data-Safety | partial | `tests/staff-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/coach-staff-portfolio-intervention-safety-contract.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Live export/intervention tests remain blocked. | Real event/points readback and staff proof. | rollout-blocked |
| MVP-STF-03 | coach/staff | `/staff?view=admin` | #3 | partial | `tests/staff-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | Role proof from real production accounts remains missing. | Staff/admin role proof and DS/admin authority. | rollout-blocked |
| MVP-ADM-01 | admin | `/admin/users`, `/admin/chapters`, `/admin/access` | #3 / Data-Safety | partial | `tests/admin-management-pages.test.tsx`, `tests/admin-management-data.test.ts`, `tests/admin-users-actions.test.ts`, `tests/admin-chapters-actions.test.ts`, `tests/admin-master-data-workspace.test.ts` | strong | Real owner-data apply tests must wait for approved data process. | Owner CSVs, production user/chapter rows, approved role assignments. | rollout-blocked |
| MVP-ADM-02 | admin | `/admin/launch-gate` | #3 / Rollout Evidence | staged | `tests/production-launch-gate.test.ts`, `tests/core-production-launch-readiness.test.ts`, `tests/production-invite-gate.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Evidence-producing tests are blocked until real data exists. | Owner CSVs, live counts, signed-in proof, pilot proof, zero-send. | rollout-blocked |
| MVP-DSA-01 | DS admin | `/admin`, embedded `/staff?view=admin` | #3 | built shell / partial ops | `tests/admin-control-center.test.ts`, `tests/staff-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | Production ops proof is still missing. | Real DS admin account/route proof and production ops data. | UI-complete |
| MVP-DSA-02 | DS admin | audit/outbox/integrations/API/MCP | #3 / Data-Safety | partial / preview-only | `tests/admin-audit-log-review.test.ts`, `tests/admin-integration-outbox-workspace.test.ts`, `tests/admin-luma-integration-status.test.ts`, `tests/admin-management-pages.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | Provider/outbox mutation tests should remain absent until approval. | Approved provider contracts, secrets handling, audit/outbox proof. | test-complete locally, rollout-blocked |
| MVP-SUP-01 | super admin | cross-shell review | #4 / #5 | partial | `tests/e2e/launch-smoke.spec.ts`, `tests/local-vs-production-role-proof-separation.test.ts`, `tests/figma-sandbox-signed-in-role-proof.test.ts` | partial | Real cross-shell production proof is not captured. | Real super admin account, route proof, production packet. | rollout-blocked |
| MVP-SUP-02 | super admin | final invite gate | Rollout Evidence | blocked | `tests/production-launch-gate.test.ts`, `tests/production-rollout-gap-report.test.ts`, `tests/production-rollout-owner-return-intake.test.ts`, `tests/production-live-data-readiness.test.ts`, `tests/production-pilot-event-proof.test.ts`, `tests/production-signed-in-route-proof-readiness.test.ts` | strong for guardrails | Passing the gate with real evidence is intentionally not covered yet. | Owner CSVs, live counts, production route proof, pilot proof, zero-send, human approval. | rollout-blocked |

## Highest-Priority Backlog Slice Traceability

| Backlog ID | Owner | Story parent | Current truth | Test evidence | Coverage | Missing test / proof |
| --- | --- | --- | --- | --- | --- | --- |
| BL-001 | #1 | MEM-003/004/005/006 | partial / preview-only | `tests/member-mobile-shell-page.test.tsx`, `tests/member-event-detail-page.test.tsx`, `tests/member-launch-lane-events.test.ts`, `tests/launch-lane-points-readback.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Mobile device QA and production event/attendance/points proof. |
| BL-002 | #1 | MEM-007 | preview-only | `tests/member-stories-profile-pages.test.tsx`, `tests/member-mobile-shell-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | partial | Consent/storage/moderation/publishing proof. |
| BL-003 | #1 | MEM-008 | partial | `tests/profile-workspace.test.ts`, `tests/member-profile-privacy-safety-contract.test.ts`, `tests/e2e/launch-smoke.spec.ts` | partial | Production profile/role proof and edit authority. |
| BL-004 | #1 | MEM-009 | preview-only | `tests/slt-prep-routes.test.tsx`, `tests/slt-prep-write-safety-contract.test.ts`, `tests/slt-trip-prep-workspace.test.ts`, `tests/e2e/launch-smoke.spec.ts` | partial | Real traveler/payment/forms/provider proof; outside narrow first launch. |
| BL-005 | #1 | MEM-002 | built shell / mock-safe | `tests/member-mobile-shell-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | Mobile device QA and real member data proof. |
| BL-006 | #1 | MEM-006 | partial | `tests/launch-lane-points-readback.test.ts`, `tests/points-leaderboard-award-safety-contract.test.ts`, `tests/member-leaderboard-workspace.test.ts` | strong | Real points ledger and award authority. |
| BL-009 | Data/Safety | MEM-004/005 | preview-only | `tests/event-loop-data-auth-readiness-doc.test.ts`, `tests/event-loop-pilot-foundation.test.ts`, `tests/chapter-event-update-safety-contract.test.ts` | partial | Approved browser write path and pilot proof. |
| BL-012 | #2 | LDR-001 | built shell / partial data | `tests/leader-page.test.tsx`, `tests/leader-command-center-routing.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Real leader account/data proof. |
| BL-013 | #2 | LDR-002 | partial | `tests/leader-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Live event/attendance data proof. |
| BL-014 | #2 | LDR-003 | partial | `tests/leader-page.test.tsx`, `tests/launch-lane-points-readback.test.ts`, `tests/points-leaderboard-award-safety-contract.test.ts` | strong | Production ledger proof. |
| BL-015 | #2 | LDR-004 | preview-only | `tests/leader-page.test.tsx`, `tests/member-profile-privacy-safety-contract.test.ts`, `tests/leader-review-focus.test.ts` | partial | Production member/profile role proof. |
| BL-018 | #2 | LDR-007 | preview-only | `tests/leader-page.test.tsx`, `tests/figma-leader-support-screens.test.tsx`, `tests/leader-proof-decision-workspace.test.ts` | partial | Content governance and proof/story consent. |
| BL-021 | #3 | STF-001 | built shell / partial data | `tests/staff-page.test.tsx`, `tests/staff-command-center.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Real staff account and chapter portfolio proof. |
| BL-022 | #3 | STF-002 | partial | `tests/staff-page.test.tsx`, `tests/coach-staff-portfolio-intervention-safety-contract.test.ts`, `tests/launch-lane-points-readback.test.ts` | strong | Live interventions/exports/notifications remain blocked. |
| BL-023 | #3 | STF-003 | preview-only | `tests/staff-page.test.tsx`, `tests/rush-month-event-readiness.test.ts`, `tests/rush-month-event-detail.test.ts` | partial | Real campaign runtime and publish authority. |
| BL-024 | #3 | STF-004 | preview-only | `tests/staff-page.test.tsx`, `tests/proof-library-route-pages.test.tsx`, `tests/proof-ugc-consent-storage-safety-contract.test.ts` | partial | Consent/storage/moderation/publishing proof. |
| BL-027 | #3 | DSA-001 | built shell / partial ops | `tests/admin-control-center.test.ts`, `tests/staff-page.test.tsx`, `tests/e2e/launch-smoke.spec.ts` | strong | Production DS/admin proof. |
| BL-028 | #3 | DSA-002 | preview-only | `tests/admin-management-pages.test.tsx`, `tests/admin-integration-outbox-workspace.test.ts`, `tests/admin-luma-integration-status.test.ts`, `tests/e2e/launch-smoke.spec.ts` | strong | Provider contracts, secrets handling proof, live outbox proof. |
| BL-036 | Data/Safety | ADM-003/DSA-004 | staged | `tests/production-signed-in-route-proof-readiness.test.ts`, `tests/production-signed-in-route-proof-import.test.ts`, `tests/production-signed-in-route-proof.test.ts` | strong for readiness | Real production account proof rows. |
| BL-037 | Rollout Evidence | SUP-002 | blocked | `tests/production-rollout-owner-return-intake.test.ts`, `tests/production-rollout-owner-send-tracker.test.ts`, `tests/production-rollout-owner-packet-status.test.ts` | strong for tooling | Actual owner CSV returns and validation. |
| BL-040 | Rollout Evidence | DSA-004/SUP-002 | blocked | `tests/production-signed-in-route-proof-readiness.test.ts`, `tests/production-signed-in-route-proof.test.ts`, `tests/local-vs-production-role-proof-separation.test.ts` | strong for guardrails | Real member, leader, staff/support, DS/admin route screenshots with account evidence. |
| BL-041 | Rollout Evidence | MEM-004/005/006/SUP-002 | blocked | `tests/production-pilot-event-proof.test.ts`, `tests/production-pilot-event-proof-import.test.ts`, `tests/event-loop-pilot-foundation.test.ts` | strong for tooling | Real pilot event evidence. |
| BL-044 | #4 | All MVP UI stories | partial | `tests/e2e/launch-smoke.spec.ts`, route/component tests above | partial | Manual/public no-write smoke evidence after each PR. |
| BL-046 | #4 | MEM-003/006 | partial | `tests/e2e/launch-smoke.spec.ts`, `tests/member-event-detail-page.test.tsx`, `tests/member-mobile-shell-page.test.tsx` | partial | Real mobile device QA screenshots/recordings. |

## Strongest Coverage Gaps

1. Production signed-in proof is readiness-tested, but not captured from real
   production accounts.
2. Owner CSV return/intake tooling exists, but the rollout blocker remains real
   returned owner data.
3. Member RSVP/check-in/points has strong preview tests, but no approved
   browser write, attendance source, or production points ledger proof.
4. Proof/UGC and stories have route/UI and safety-contract coverage, but real
   consent, storage, moderation, and publishing proof remain missing.
5. Staff/Admin provider and outbox controls are strongly blocked in tests, but
   no provider contract, outbox send approval, or zero-send pilot proof exists.
6. Mobile/device QA is not the same as desktop route smoke and still needs
   separate #4 evidence before launch.

## Next 10 Build Slices

| Rank | Lane | Backlog ID | Recommended slice | Why next |
| --- | --- | --- | --- | --- |
| 1 | #1 General Member App | BL-001 | Member `/app/events` + detail + RSVP/check-in + `/app/points` handoff polish. | Highest launch value and already strong test scaffold. |
| 2 | #4 QA / release watch | BL-046 | Mobile device QA for member event/points loop. | Desktop smoke is insufficient for the mobile-first member shell. |
| 3 | Data/Safety | BL-009 | RSVP/check-in/attendance fail-closed contract refresh. | Keeps #1 UI honest and prevents accidental write-readiness overclaiming. |
| 4 | #2 Student Leadership | BL-013 | Leader event/attendance handoff closeout. | Keeps leader launch surface aligned to member event loop without enabling writes. |
| 5 | #3 Staff / DS Admin | BL-021 | Staff portfolio/header/nav final parity sweep. | Staff support shell is launch-relevant and has strong route tests. |
| 6 | #3 Staff / DS Admin | BL-028 | DS Admin Integrations / API Keys / MCP blocked-state clarity. | Renato-facing admin safety remains high-risk if wording sounds live. |
| 7 | #2 Student Leadership | BL-015 | Leader member/profile handoff parity. | Useful for chapter support while staying preview/read-only. |
| 8 | #1 General Member App | BL-006 | Member points readback and leaderboard preview honesty. | Tightens the event-to-points loop without touching award authority. |
| 9 | Rollout Evidence | BL-037 | Owner CSV intake monitor and validation plan. | Real owner data remains the first external launch blocker. |
| 10 | #5 Planning | BL-050 | Matrix crosswalk refresh from backlog rows. | Helps Coordinator explain what can move and what must remain blocked. |

## Matrix Guidance

This traceability map is planning/documentation only and should not move
readiness percentages by itself. Strong test coverage can support confidence in
`Scope/UI` and `QA/Ops` after a matching implementation PR lands and is smoked.
`Data/Auth`, `Writes/Integrations`, and `Rollout Gate` require matching safety
contracts, real production evidence, or approved rollout artifacts.
