# Goal 18 Leader Assignment Creation

Status: local Supabase implementation only.

Goal 18 adds the first local chapter-leader assignment creation path:
`app.create_chapter_assignment(...)`.

This does not wire browser save controls, production auth, real users, or
external sends.

## What The Function Does

When an allowed chapter leader creates an assignment, the function writes one
transactional bundle:

1. Create one `assignments` row with status `not_started`.
2. Create one structured internal `events` row with event type
   `action_assigned`.
3. Create one `integration_events` row with destination `internal` and status
   `recorded`.
4. Create one `automation_outbox` row with status `disabled`.
5. Create one `audit_logs` row.

If any step fails, the transaction rolls back.

## Who Can Create Assignments Locally

Allowed:

- Chapter Leader for their own chapter
- Super Admin as an audited break-glass path

Blocked:

- General Member
- Coach
- Admin
- DS Admin
- Chapter Leader for another chapter

Reason: routine assignment truth should be owned by chapter leadership, not
coaches, general HQ support, DS Admin, or external automation.

## Validations

The function validates:

- campaign belongs to the chapter
- optional phase belongs to the campaign and chapter
- optional action template belongs to the campaign and chapter
- optional action committee belongs to the chapter
- optional chapter event belongs to the campaign and chapter
- assigned user is an approved chapter member
- assigned role is chapter-scoped
- title, instructions, evidence requirement, and KPI key are present
- points are between 0 and 1000

## Why Direct Inserts Are Blocked

Direct `assignments` inserts can create work without event history, disabled
outbox intent, or audit history. Goal 18 replaces direct assignment inserts
from authenticated browser roles with a function-only path.

## What Stays Disabled

- browser save controls
- production auth
- production Supabase
- real users and role assignments
- real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

## Tests

The RLS/security coverage lives in:

- `supabase/tests/database/rls_goal_18.test.sql`

The tests prove:

- direct assignment inserts are blocked
- chapter leaders can create own-chapter assignments through the function
- cross-chapter assignment creation is blocked
- General Members, Coaches, Admin, and DS Admin cannot create routine
  assignments
- Super Admin can create an audited break-glass assignment
- invalid campaign ownership, unapproved assigned users, and unsafe points are
  rejected
- assignment creation records event, integration event, disabled outbox, and
  audit log rows
- no outbox row is approved for live send or sent

## Next Step

Goal 19 should plan real auth and onboarding:

- sign-in approach
- chapter join request flow
- membership approval flow
- role assignment flow
- first production RLS review checklist
