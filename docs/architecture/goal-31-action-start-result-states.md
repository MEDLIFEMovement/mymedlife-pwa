# Goal 31: Action-Start Result States

Goal 31 defines the plain-English result states for the future
`action_started` browser save.

This goal does not enable the save button, create a server action, or write to
Supabase from the browser. It makes the future student/staff experience
reviewable before activation.

## Why This Exists

Goal 30 defined the future contract:

- route: `/rush-month/actions/[assignmentId]`
- server action: `startAssignmentAction`
- local function: `app.start_assignment_action(assignment_uuid)`

Goal 31 defines what the app should say after that future save attempt.

The immediate value is safety:

- the current browser result still says writes are disabled
- duplicate start attempts have a defined outcome
- stale-page conflicts have a defined outcome
- missing-auth and permission-denied cases are explicit
- DS Admin stays out of student truth
- no external automation can run from this path

## Result States

The result-state contract includes:

- `started`
- `write_disabled`
- `already_started`
- `stale_assignment`
- `permission_denied`
- `missing_auth`
- `assignment_not_found`
- `server_error`

Only `started` may create an internal app event in the future. Every other
state must avoid creating duplicate assignment events.

## Current Behavior

The action detail page now shows:

- the current disabled browser result
- the future result for the selected mock action
- the disabled server result shape
- every possible action-start result state

The current result is always `write_disabled`.

## What Stays Disabled

- browser save/start controls
- server action implementation
- production Supabase
- live auth/browser sessions
- proof uploads and public proof sharing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS/email, and AI writes

## Files

- `src/services/action-start-result-states.ts`
- `src/components/action-start-result-states-panel.tsx`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/action-start-result-states.test.ts`

## Next Approval Needed

Nick/team should approve a later activation goal before any result state is
connected to a real browser write.
