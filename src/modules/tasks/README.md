# Tasks Module

## What This Owns
- Assignments, action details, action start state, owner/assignee posture, and leader assignment creation.

## What This Does Not Own
- SOP template authoring, proof upload storage, or external automation sends.

## Routes
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- leader assignment/write packet routes.

## Components And Services
- Member action panels, action detail services, assignment create services, and write-readback packets.

## Data Models
- Assignment, action status, due date, assignee, evidence requirements, and result states.

## Flags
- `task_assignment`
- Disabled task assignment must not break events, Luma, points, or staff analytics.

## Permissions
- Members work on assigned actions. Leaders create/review chapter assignments. Staff/admin inspect posture.

## Integrations
- Automation outbox rows remain disabled unless approved.

## Tests
- `tests/action-start-write.test.ts`
- `tests/assignment-create-write.test.ts`
- `tests/member-action-detail-page.test.ts`

## Safe Modification
- Keep write gating and result states in services.

## TODOs
- Move task services into this module behind exports.
