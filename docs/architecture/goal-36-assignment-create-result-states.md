# Goal 36: Assignment Creation Result States

Goal 36 defines the plain-English result states for the future
`action_assigned` browser save.

This goal does not enable assignment saves, live auth, reminder automation, or
external writes. It closes the result-state coverage gap identified in Goal 35.

## Product Meaning

Chapter leaders need to create clear student actions: who owns the work, what
they should do next, what proof/testimonial is needed, and which KPI the action
supports.

Assignment creation changes chapter operating truth, so it should not become a
browser write until live auth, RLS, server identity, validation, rollback, and
approval requirements are reviewed.

## Result States

The result-state contract includes:

- `assignment_created`
- `write_disabled`
- `reminders_disabled`
- `duplicate_assignment`
- `permission_denied`
- `missing_auth`
- `title_too_short`
- `instructions_too_short`
- `evidence_requirement_too_short`
- `kpi_required`
- `invalid_points`
- `server_error`

Only `assignment_created` may create an assignment and disabled outbox row in
the future. No state may send reminders directly.

## Current Behavior

The actions page now shows:

- the current disabled assignment-create browser result
- the future result for the selected mock assignment
- the disabled server result shape
- every possible assignment creation result state

The admin result-state coverage panel now marks all five first write candidates
as covered, while browser writes and external writes remain disabled.

## What Stays Disabled

- browser assignment save controls
- production Supabase
- live auth/browser sessions
- n8n reminder workflows
- HubSpot, Luma, warehouse, Power BI, SMS/email, and AI writes

## Files

- `src/services/assignment-create-result-states.ts`
- `src/components/assignment-create-result-states-panel.tsx`
- `src/app/rush-month/actions/page.tsx`
- `src/services/write-result-state-coverage.ts`
- `tests/assignment-create-result-states.test.ts`
- `tests/write-result-state-coverage.test.ts`

## Next Approval Needed

Nick/team should approve a later activation goal before assignment-create
result states are connected to a real browser write or reminder workflow.
