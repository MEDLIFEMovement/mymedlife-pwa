# Goal 165: SOP Rollout Source Intake

Status: ready to use as the intake artifact for the workflow-engine phase.

## Purpose

This document defines what the `Full SOP Rollout Package` must contribute to
the repo before deeper workflow-engine decisions are made.

It exists because the updated Codex goal makes the rollout package the highest
priority source, but the current repo state does not yet contain a verified,
complete import of that package.

## Source Priority

Use sources in this order:

1. full SOP rollout package
2. permissions matrix
3. Figma mockups
4. MED International SOP source content
5. current repo / Supabase / Linear / PR context

If lower-priority sources disagree with higher-priority sources, record the
conflict explicitly instead of silently blending them.

## Required Intake Outputs

The rollout package intake is complete only when it produces all of these:

### 1. Workflow inventory

One list of every campaign/workflow the package expects to exist, including:

- workflow name
- canonical slug
- current operational status
- intended owning roles
- target surfaces
- source document references

### 2. Permissions inventory

One mapped inventory of:

- supported roles
- allowed actions per role
- restricted actions per role
- sensitive data boundaries
- approval-only actions
- backend-only actions

This inventory must reconcile directly against the permissions matrix.

### 3. Workflow object extraction

For each workflow, extract:

- phases
- steps
- owners
- validators
- evidence requirements
- approval gates
- points rules
- KPI rules
- triggers
- escalations
- handoffs
- integration touchpoints

If a source names one of these only indirectly, mark it `inferred_from_source`
instead of pretending the source was explicit.

### 4. Surface mapping

For each workflow, map which parts drive:

- student app
- student leader command center
- coach command center
- staff command center
- DS/admin backend
- SLT prep

This map should identify whether the workflow drives:

- route visibility
- card content
- action availability
- review states
- progress states
- metrics
- audit requirements

### 5. Import readiness report

For each workflow, classify:

- `ready_for_draft_import`
- `needs_permissions_resolution`
- `needs_figma_mapping`
- `needs_source_clarification`
- `blocked_by_security_boundary`

## Required Normalization Rules

### Workflow naming

- use stable slugs
- preserve source names as labels or aliases
- do not let one workflow exist under multiple permanent slugs

### Role naming

- preserve the canonical product role model already present in the repo
- map source-language roles into canonical roles at the intake boundary
- do not rename existing runtime/database role keys yet

### Source certainty

Every extracted item should carry one of:

- `explicit_in_source`
- `inferred_from_source`
- `repo_only_placeholder`
- `missing_source_confirmation`

### Integration posture

Every integration touchpoint should carry one of:

- `internal_only`
- `disabled_pending_approval`
- `future_external`

No intake artifact should imply live sends or live writes by default.

## First Import And Runtime Proving Paths

The first canonical full structured import is:

- `planning-goal-setting`

That decision matches the rollout package order and has now been confirmed.

The strongest existing runtime/UI proving surface in the repo is still:

- `rush-month`

Use that distinction explicitly:

- `planning-goal-setting` = first full PDF-backed import target
- `rush-month` = first strong runtime-adapter/product-surface proving lane

Do not spread first-pass intake effort equally across all campaigns.

## Deliverables For Run A

Run A should end with these concrete artifacts:

1. this intake checklist completed for the rollout package
2. one normalized workflow inventory
3. one normalized permissions inventory
4. one Planning / Goal Setting source-to-template mapping
5. one explicit note that Rush Month remains the strongest runtime/UI proving
   surface after the data model pass
6. one gap report showing what the builder schema still lacks

## Acceptance

Run A intake is complete when:

- the full SOP rollout package has been decomposed into workflow-ready inputs
- Planning / Goal Setting is explicitly ready for first structured
  draft-template modeling
- Rush Month remains explicitly named as the first strong runtime-adapter lane
- unresolved source gaps are named instead of guessed
- the next schema/runtime implementation slice can begin without re-deciding
  what the package meant
