# Goal 14 Action Start Write

Status: local Supabase implementation only.

Goal 14 adds the first real local database write path for myMEDLIFE:
`app.start_assignment_action(assignment_uuid uuid)`.

This does not wire the browser UI to save data. It does not connect production
Supabase, live auth, proof uploads, public sharing, or external integrations.

## What The Function Does

When an allowed local actor starts an assignment, the function performs one
transactional write bundle:

1. Update the assignment status to `in_progress`.
2. Create one structured internal `events` row.
3. Create one `integration_events` row with destination `internal` and status
   `recorded`.
4. Create one `audit_logs` row.

If any step fails, the transaction rolls back.

## Who Can Start Assignments Locally

Allowed:

- assigned member for their own visible assignment
- chapter role holder for an assignment assigned to their chapter role
- coach for a coach-owned assignment in their active portfolio chapter
- super admin as an audited local break-glass path

Blocked:

- member from another chapter
- coach trying to start member-owned student work
- admin trying to own routine student truth
- DS admin trying to own student truth

## Why This Uses A Database Function

Direct table updates can change assignment status without guaranteeing the
event and audit trail. Goal 14 makes the action-start transition go through a
single database function so the status update, event, integration-ready event,
and audit log stay together.

A tightened assignment update trigger blocks direct `not_started` or
`changes_requested` to `in_progress` transitions unless they come through the
approved function.

## What Stays Disabled

- browser save controls
- production auth
- production Supabase
- proof uploads
- public proof sharing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes
- automation outbox creation for action starts

## Tests

The RLS/security coverage lives in:

- `supabase/tests/database/rls_goal_14.test.sql`

The tests prove:

- direct assignment-start table updates are blocked
- assigned members can start their own work through the function
- chapter leaders can start assigned chapter-role work through the function
- coaches can start coach-owned portfolio work through the function
- coaches cannot start member-owned student work
- admins and DS admins cannot start routine student truth assignments
- super admin has an audited break-glass local path
- action start creates internal event, integration event, and audit log rows
- action start does not create outbox rows or external sends

## Next Step

Goal 15 should follow the same pattern for proof submission metadata:

- write through one narrow database function
- prove RLS boundaries first
- create internal events and audit logs
- keep uploads and public sharing disabled
- keep external outbox rows disabled
