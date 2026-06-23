# Goal 163: Packet-to-Product Parity Audit

Status: implementation goal largely landed locally; Phase 1 and Phase 2 are
not complete because hosted auth, writes, uploads, and integrations still stop
at approved review boundaries.

## Purpose

The myMEDLIFE full send package and Figma Make clickthroughs became the product
overlay for the existing repo, not a restart-from-zero instruction. Goal 163
records what is now proven in the codebase, what was reconciled into the local
route/state model, and what still blocks a truthful claim that Phase 1 or Phase
2 are complete.

This document is the plain-language stop line for the current goal:

- packet/repo/Figma reconciliation is largely in place
- the role-based surface model is present in code
- the shared tests/build are green again
- the app is review-ready locally
- the app is not yet live-ready

## Proven In The Current Repo

### 1. Reconciliation docs are current enough to guide implementation

The working architecture docs now treat Figma as a route/state map rather than
just a style reference:

- `docs/architecture/figma-route-and-surface-map.md`
- `docs/architecture/figma-clickthrough-screen-inventory.md`
- `docs/architecture/figma-implementation-matrix.md`

Those docs now reflect the owned member, chapter leader, coach, staff HQ, SLT
Prep, and admin/backend route families already present in code, including the
admin SOP library and SOP builder lanes.

### 2. Canonical role and scope routing is in place

The packet's richer role model is now represented centrally through:

- `src/services/canonical-role-scope.ts`
- `src/services/local-actor-context.ts`
- `src/services/landing-route.ts`
- `src/services/owned-route-redirect.ts`

The repo can now map current local actors, DB role keys, and chapter/staff
labels into canonical roles and scopes without breaking existing persisted key
compatibility.

### 3. Core surface ownership is present across the app

The current repo has distinct owned surfaces instead of one generic dashboard:

- member mobile routes
- chapter leader command-center routes
- coach portfolio/support routes
- staff HQ routes
- SLT Prep traveler/staff routes
- admin review, safety, and backend tooling routes

The traveler-facing SLT profile and notifications routes now stay traveler-owned
and keep the staff-review handoff in `/slt-prep/staff` instead of rendering that
card on the traveler pages themselves.

Visible controls on those surfaces now route into real screens or mock-safe
owned review states instead of stopping at placeholder pages.

### 4. SOP library and SOP builder backend lanes exist locally

The backend tooling requested by the packet now exists in typed mock-safe form:

- `src/app/admin/sop-library/page.tsx`
- `src/app/admin/sop-builder/[campaignSlug]/page.tsx`
- `src/services/sop-library-workspace.ts`
- `src/services/sop-builder-workspace.ts`

The builder now exposes route-backed lanes for:

- `steps`
- `role-matrix`
- `completion`
- `points-kpi`
- `comms`
- `preview`
- `version`

Visible mutable controls open same-route review states for filter/add-step/
duplicate-step/disable-step/publish/schedule/rollback review instead of dying
as inert buttons.

### 5. The shared quality baseline is green again

Latest local verification on this branch:

- `pnpm test`: `179` test files passed, `1106` tests passed
- `pnpm typecheck`: passed
- `pnpm lint`: passed
- `pnpm build`: passed

Browser spot-checks on 2026-06-23 also confirmed the member profile,
submit-evidence, points, events, and chapter leadership surfaces in their live
local routes.

This matters because the branch started this packet-parity pass with broad test
drift across shared assignment, proof, points/KPI, and shell expectations.

## What This Goal Does Not Prove Yet

### Phase 1 is not truthfully complete yet

The local release gate still says:

- `verdict: local_review_ready_not_live`
- `localReviewReady: true`
- `liveLaunchReady: false`
- `browserWritesEnabled: 0`
- `externalWritesEnabled: 0`

Source:

- `src/services/mvp-release-readiness.ts`

That means the repo is strong enough for local stakeholder review, but not for
truthful live-launch claims.

### Phase 2 is not truthfully complete yet

The MVP coverage checklist still marks the live transition lanes as blocked:

- `live_auth_writes` -> `blocked_until_approval`
- `real_integrations` -> `blocked_until_approval`

Source:

- `src/services/mvp-coverage-checklist.ts`

So the repo does not yet prove:

- real auth onboarding
- approved browser writes
- hosted proof uploads
- live external integrations
- pilot-owner signoff
- real student invitations

### Backend mutation parity is intentionally incomplete

The SOP builder and admin backend lanes now exist and route correctly, but the
real mutation layer remains intentionally blocked. That includes live reorder,
create, persist, archive, schedule, rollback, and publish behavior.

That is an intentional safety boundary, not an accidental omission.

## Current Honest Status

The packet-to-product parity goal is close in the sense that the repo now has:

- current reconciliation docs
- canonical role/scope routing
- role-owned surface families
- SOP backend lanes
- green tests, typecheck, lint, and build

But the goal is not fully complete if the bar is "Phase 1 complete and Phase 2
complete," because the repo itself still truthfully reports a local-review-only
posture and blocked live lanes.

## Remaining Named Slices

What remains is narrow, not vague:

1. final visual/clickthrough parity passes where specific screens still differ
   from the Figma Make walkthroughs
2. hosted auth/write/upload/integration approvals and evidence
3. explicit closure of the Phase 1 and Phase 2 launch gates after those hosted
   approvals are actually exercised

## Review Use

Use this audit when someone asks either of these questions:

- "How close are we to finishing the packet-to-product parity goal?"
- "Are Phase 1 or Phase 2 actually complete yet?"

The honest answer today is:

The local product parity work is largely in place and the branch is green, but
the app is still in a review-ready, not live-ready, state until hosted approval
lanes are exercised and signed off.
