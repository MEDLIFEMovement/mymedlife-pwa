# Goal 91: Leader Dashboard Role Focus

## Purpose

Goal 91 makes the Rush Month leader dashboard use the separated President / VP
and E-Board Member local personas from Goal 90. The final MVP expects leaders
to assign actions, track completion, review evidence, view KPIs, and manage
members, but those responsibilities should not read like one generic leader
job.

## What It Adds

- President / VP dashboard copy focused on approval posture, proof decisions,
  role coverage, and chapter KPI accountability.
- E-Board Member dashboard copy focused on owner follow-up, event execution,
  proof reminders, and action committee movement.
- A role-focus panel on `/rush-month/dashboard` for chapter-leader personas.
- Role next-action routing that sends President / VP toward review/member
  coverage and E-Board toward actions/events.
- Tests proving the dashboard and first-screen next actions distinguish the two
  leader roles.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- President / VP and E-Board Member still map to `chapter_leader` visibility.
- The dashboard now gives them different operating priorities.
- All assignment saves, proof decisions, role changes, membership approvals,
  reminders, Luma writes, and external automations remain disabled.

## Safety Boundary

This goal does not:

- enable production auth
- enable browser write controls
- create production users
- enable role or membership writes
- save assignments
- approve or reject proof
- upload proof files
- publish proof publicly
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

All changes are local read-only guidance and tests.

## How Staff Should Use It

Preview both leader roles:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=eboard.a@mymedlife.test
```

Open `/rush-month/dashboard`.

- President / VP should see approval, proof decision, member coverage, and KPI
  accountability language.
- E-Board Member should see owner follow-up, events, proof reminder, and action
  committee execution language.

## Follow-On

Goal 92 carries the same President / VP versus E-Board split into
`/rush-month/actions`, including disabled assignment creation framing and owner
follow-up guidance without enabling browser saves or reminders.
