# Goal 94: Member Role Focus

## Purpose

Goal 94 carries the separated President / VP and E-Board Member local personas
into `/chapter/members`. The MVP needs leaders to manage members, understand
role coverage, and coordinate follow-up, but permission-changing membership
work must stay clearly separated from execution follow-up.

## What It Adds

- President / VP roster guidance focused on join requests, role coverage, and
  locked membership/role approvals.
- E-Board Member roster guidance focused on open member work, proof follow-up,
  and committee execution capacity.
- Generic chapter-leader guidance for Action Committee Chair.
- A dedicated service for member role focus so the page copy is backed by
  tested role logic.
- Tests proving President / VP, E-Board Member, generic chapter leader, member,
  and coach behavior.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- President / VP and E-Board Member still map to `chapter_leader` visibility.
- `/chapter/members` now gives them different member-management priorities.
- Join requests, role coverage, roster follow-up, disabled controls, audit
  previews, and outbox previews remain visible through the existing workspace.
- Join approvals, role changes, committee moves, member deactivation, reminders,
  and external writes remain disabled.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- approve join requests
- assign or change chapter roles
- move committee lanes
- deactivate members
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

Future membership writes still require the approved auth/RLS/write-readiness
path and structured AuditLog/IntegrationEvent coverage.

## How Staff Should Use It

Preview both leader roles:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=eboard.a@mymedlife.test
```

Open `/chapter/members`.

- President / VP should see member management framed as role coverage and
  approval readiness.
- E-Board Member should see member management framed as committee execution and
  owner follow-up.
- Action Committee Chair should see generic chapter-leader roster guidance.
- Coaches should keep the roster health readout without seeing the leader role
  focus panel.

## Follow-On

Goal 95 carries the same leader role split into `/admin/assignment-write`, so
staff can verify which role owns assignment approval guardrails, owner handoff,
and committee coordination before any local assignment-create write is opened.
