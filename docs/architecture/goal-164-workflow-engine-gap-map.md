# Goal 164: Workflow Engine Gap Map

Status: the repo already has a strong SOP builder review surface, but it is not
yet the workflow engine of the product.

## Purpose

This note turns the updated Codex goal into a concrete Run A artifact:

- what already exists in the repo
- what is still missing before the SOP builder can become source-of-truth
- which implementation slice should come first

The goal is not to restart the app. The goal is to evolve the current
review-ready parity build into a workflow-engine architecture.

Use this together with:

- `docs/architecture/goal-165-sop-rollout-source-intake.md`

Goal 165 defines what the full SOP rollout package must contribute. Goal 164
defines how the current repo falls short of that target and where the first
implementation slice should begin.

## What Already Exists

### 1. A typed SOP builder skeleton already exists

The current builder foundation is real and useful:

- `src/shared/types/sop-builder.ts`
- `src/data/mock-sop-builder.ts`
- `src/services/sop-library-workspace.ts`
- `src/services/sop-builder-workspace.ts`
- `src/app/admin/sop-library/page.tsx`
- `src/app/admin/sop-builder/[campaignSlug]/page.tsx`

Current builder concepts already cover:

- campaign definitions
- steps
- role action rules
- completion rules
- evidence rules
- approval rules
- points rules
- KPI rules
- communication rules
- preview scenarios
- audit records
- integration boundaries
- version summaries

This is enough to avoid a greenfield rewrite.

### 2. Role-based app surfaces already exist

The app already has route-owned surfaces for:

- member mobile
- chapter leader command center
- coach command center
- staff command center
- SLT prep traveler and staff
- admin review and backend lanes

The canonical role/scope layer is already in place, so workflow ownership does
not need to begin from raw audience strings.

### 3. Integration and outbox posture already exists in read-only form

The repo already models:

- integration events
- automation outbox posture
- audit posture
- blocked live-send controls

Key existing lane:

- `src/services/admin-integration-outbox-workspace.ts`

This means the workflow engine can bind to typed integration posture without
opening external writes yet.

## What Is Missing

### 1. The builder schema is still review-oriented, not engine-oriented

The current schema is close, but it is not yet complete for the master goal.

Missing or under-modeled concepts:

- explicit workflow template lifecycle
- publishable workflow version identity separate from summary text
- phase objects as first-class records rather than step labels only
- handoff rules as first-class workflow config
- escalation rules as first-class workflow config
- trigger rules that unify internal events and future automation posture
- feature flag bindings tied to workflow rollout
- structured validator definitions beyond prose guardrails
- import traceability back to SOP source content

### 2. Product behavior is still mostly hardcoded outside the builder

The current app still drives `rush-month` from route- and service-specific
implementations such as:

- `src/services/member-rush-month-campaign-overview.ts`
- `src/services/rush-month-event-readiness.ts`
- `src/services/rush-month-local-loop.ts`
- `src/services/leader-actions-focus.ts`
- `src/services/chapter-leader-command-center.ts`
- `src/services/staff-command-center.ts`

This is the biggest architecture gap. The builder exists, but the runtime is
not yet reading campaign behavior from builder-owned workflow data.

### 3. Campaign import is still manual mock authoring

`src/data/mock-sop-builder.ts` defines campaign data by hand. The repo does not
yet have a structured import layer from SOP source content into builder drafts.

That means MED International campaign rollout is not yet scalable or auditable.

### 4. Permissions truth is not yet attached directly to workflow operations

The app has permissions and route visibility, but the workflow builder does not
yet define operation-level permissions for:

- draft editing
- review submission
- publish approval
- archive / rollback
- template ownership transfer
- integration binding changes

Those should resolve from the permissions matrix, not from hidden UI posture.

## First Implementation Slice

The first implementation slice should be:

`workflow schema hardening + planning-import preparation`

That slice should do four things:

1. extend `src/shared/types/sop-builder.ts` so workflow phases, handoffs,
   escalations, triggers, feature-flag bindings, source-trace metadata, and
   publish-state metadata are first-class types
2. add import-ready structures for the first canonical campaign:
   `planning-goal-setting`
3. keep the next runtime proving pass pointed at `rush-month`, which still has
   the strongest member/leader/coach route family in the current repo
4. separate "first full PDF import" from "first runtime adapter surface" so the
   rollout package order and the repo's strongest existing surface can both stay
   true at the same time

The first full structured import is now confirmed as
`planning-goal-setting`. The strongest current runtime/UI proving surface is
still `rush-month`.

## Run A Deliverables

Run A should finish with these concrete artifacts:

1. one completed source-intake packet from Goal 165
2. one repo-backed gap map
3. one canonical workflow object model
4. one explicit mapping from current SOP builder fields to missing workflow
   engine fields
5. one confirmed first full import decision: `planning-goal-setting`
6. one explicit runtime proving-path decision: `rush-month`
7. one list of hardcoded `rush-month` services that should be adapted to
   workflow-runtime reads after the data model pass

## Run A Acceptance

Run A is complete when:

- the intake expectations from Goal 165 have been satisfied or clearly marked as
  blocked by missing source access
- the team can point to one canonical workflow schema direction
- the first full import and the first runtime proving surface are both
  explicitly named
- the difference between builder review UI and workflow engine behavior is
  documented
- the next implementation slice is clear enough to execute without making new
  architecture decisions

## Current Recommendation

Do not start with hosted writes.

Do not start with all campaigns.

Do not start by replacing every `rush-month` service at once.

Start by making the builder schema complete enough to support the confirmed
first full import (`planning-goal-setting`), then teach one product slice to
read from that workflow data using the strongest existing runtime surface
(`rush-month`).
