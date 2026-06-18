# Goal 95: Leader Assignment Role Responsibility

## Purpose

Goal 95 carries the President / VP and E-Board role split into the staff-facing
leader assignment packet at `/admin/assignment-write`. The MVP needs assignment
creation to be reviewable before any local write opens, and reviewers need to
see which chapter role owns approval guardrails, owner handoff, and committee
coordination.

## What It Adds

- A leader responsibility map in the assignment verification packet.
- President / VP responsibility for assignment approval guardrails.
- E-Board Member responsibility for owner handoff and event/proof follow-up.
- Action Committee Chair responsibility for committee coordination before work
  is assigned.
- Tests proving the packet exposes the role map to Admin/DS Admin/Super Admin
  review contexts while hiding it from operating roles.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- `/admin/assignment-write` remains visible only to Admin, DS Admin, and Super
  Admin review contexts.
- The role map is read-only and does not grant chapter permissions.
- The packet still blocks assignment creation until local Supabase, HQ decision
  readback, local auth, explicit flags, and disabled reminder checks pass.
- Assignment creation must still create assignment, structured event,
  IntegrationEvent, disabled AutomationOutbox, and AuditLog evidence when
  eventually tested locally.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- open the assignment-create write gate
- send reminders
- approve memberships or change roles
- move committee lanes
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The packet remains a review surface until the approved localhost write sequence
is explicitly configured.

## How Staff Should Use It

Open `/admin/assignment-write` as:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=super.admin@mymedlife.test
```

The leader responsibility map should show:

- President / VP: approval guardrails.
- E-Board Member: owner handoff.
- Action Committee Chair: committee coordination.

## Follow-On

Goal 96 adds the same role-responsibility clarity to `/admin/write-sequence`
and `/admin/staff-dry-run` so reviewers can trace the full Rush Month operating
loop by responsible role before any broader launch step.
