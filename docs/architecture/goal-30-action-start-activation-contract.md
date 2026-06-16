# Goal 30: Action-Start Activation Contract

Goal 30 defines the future browser/server contract for the first recommended
write path: `action_started`.

This goal does not enable the save button. It documents and displays the
contract that a later approved goal can implement.

## Contract

Future route:

- `/rush-month/actions/[assignmentId]`

Future server action:

- `startAssignmentAction`

Future local database function:

- `app.start_assignment_action(assignment_uuid)`

Client request shape:

- `assignmentId` from the route parameter

Client must not provide:

- role
- audience
- user ID
- email
- chapter scope

The server action must derive actor identity from Supabase Auth/session context.

## Current Behavior

The action detail page shows the contract and still returns a disabled attempt.

The disabled attempt lists the future tables:

- `assignments`
- `events`
- `integration_events`
- `audit_logs`

## What Stays Disabled

- browser save/start controls
- production Supabase
- live auth/browser sessions
- external writes
- proof uploads and publishing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS/email, and AI writes

## Files

- `src/services/action-start-activation-contract.ts`
- `src/components/action-start-activation-contract-panel.tsx`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/action-start-activation-contract.test.ts`

## Next Approval Needed

Nick/team should explicitly approve the next goal before this contract becomes
a real server action or enabled browser control.
