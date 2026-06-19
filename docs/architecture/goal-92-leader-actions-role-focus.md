# Goal 92: Leader Actions Role Focus

## Purpose

Goal 92 carries the separated President / VP and E-Board Member local personas
from the dashboard into `/rush-month/actions`. The MVP needs leader assignment,
owner follow-up, proof review, KPI, and member-management flows, but the first
review screen should make the next job obvious instead of treating every leader
as the same person.

## What It Adds

- President / VP guidance on `/rush-month/actions` focused on approval
  guardrails before more work is assigned.
- E-Board Member guidance on `/rush-month/actions` focused on moving owners,
  event linkage, and proof follow-up.
- Role-specific assignment-create framing while the existing save path remains
  disabled unless local write approval is explicitly active.
- A dedicated service for leader action focus so the page copy is backed by
  tested role logic.
- Tests proving President / VP, E-Board Member, generic chapter leader, and
  non-leader personas receive the correct focus.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- President / VP and E-Board Member still map to `chapter_leader` visibility.
- `/rush-month/actions` now gives them different operating priorities.
- Assignment creation remains a reviewed local write path, not a production
  browser write.
- Membership approvals, proof decisions, proof uploads, reminders, Luma writes,
  role changes, public proof sharing, and external automations remain disabled.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- enable role or membership writes
- approve or reject proof
- upload proof files
- publish proof publicly
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

All external integration posture stays mock-safe through existing
IntegrationEvent, AutomationOutbox, and AuditLog previews.

## How Staff Should Use It

Preview both leader roles:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=eboard.a@mymedlife.test
```

Open `/rush-month/actions`.

- President / VP should see assignment creation framed as an approval
  checkpoint and be sent toward proof review plus member-role coverage.
- E-Board Member should see assignment creation framed as execution planning
  and be sent toward owner follow-up plus events.
- Action Committee Chair should still see generic chapter-leader guidance.
- Members should not see the leader action focus panel.

## Follow-On

Goal 93 carries the same role split into `/rush-month/review` so President / VP
proof accountability and E-Board proof follow-up are visible without enabling
chapter-level proof decisions or HQ sharing writes.
