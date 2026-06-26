# myMEDLIFE SOP Rollout Run B Template Model

Status: in progress

Updated: 2026-06-23

## Purpose

Run B adds a canonical workflow-template registry beside the current SOP builder
so the workflow engine can grow without destabilizing the review-ready admin
surfaces.

## What This Slice Adds

- one canonical type lane in `src/shared/types/sop-templates.ts`
- one local template registry in `src/data/mock-sop-template-registry.ts`
- one read-model service in `src/services/sop-template-registry.ts`
- focused tests in `tests/sop-template-registry.test.ts`

## First Structured Template

The first full structured import target remains:

- `planning-goal-setting`

This slice encodes that campaign as the first registry template with:

- source references
- phase and step structure
- role/scope rules
- completion, evidence, approval, points, and KPI rules
- communication and integration posture
- risk and escalation rules
- closeout requirements
- script templates
- resource links
- audit expectations
- draft import lifecycle states

## Important Boundary

This is not yet a runtime-adapter pass.

It does not change:

- member routes
- leader routes
- coach routes
- staff routes
- backend writes
- auth behavior
- external sends

It only creates the structured data and helper layer needed for later runtime
reads and import-review workflows.

## Relationship To Rush Month

Planning / Goal Setting remains the first full PDF-backed import target.

Rush Month still remains the strongest current runtime/UI proving lane and
should be the first major product-surface adapter after the registry/data-model
foundation is stable.
