# SOP Workflows Module

## What This Owns
- SOP template runtime, workflow builder state, role matrix, campaign steps, and next-action configuration.

## What This Does Not Own
- The core event/Luma/points loop when SOPs are disabled.

## Routes
- `/admin/sop-library`
- `/admin/sop-builder/[campaignSlug]`
- workflow preview/config routes.

## Components And Services
- SOP library, builder workspace, workflow runtime, and template registry.

## Data Models
- Campaign template, campaign version, SOP step, role action rule, completion rule, evidence rule, points rule, KPI rule, trigger rule, and publish state.

## Flags
- `sop_workflows_next_action`
- SOPs can be disabled without breaking events, Luma, points, task-independent readback, or staff analytics.

## Permissions
- Admin/DS own builder routes. End-user surfaces read published workflow configuration only.

## Integrations
- Integration bindings are typed but disabled by default.

## Tests
- `tests/sop-workflow-runtime.test.ts`
- `tests/sop-template-registry.test.ts`
- `tests/admin-sop-builder-page.test.tsx`

## Safe Modification
- Keep workflow behavior data-driven. Do not permanently hardcode campaign logic into route files.

## TODOs
- Move SOP runtime and builder files into this module.
