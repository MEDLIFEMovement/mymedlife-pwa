# Goal 97: Admin Responsibility Summary

## Purpose

Goal 97 brings the write-sequence role-responsibility model up into the main
admin control center. Non-technical reviewers should not need to open the
deeper write sequence first to understand which role owns each guarded Rush
Month operating step.

## What It Adds

- An operating responsibility summary on `/admin`.
- The summary is derived from the write-sequence planner so it stays aligned
  with `/admin/write-sequence` and `/admin/staff-dry-run`.
- Each guarded local write shows responsible role, responsibility, review
  prompt, and safety boundary.
- Tests proving the admin summary includes all seven guarded write steps and the
  President / VP + E-Board + Action Committee Chair assignment responsibility.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- `/admin` remains visible only to admin-capable local review personas.
- The operating responsibility summary is read-only.
- No write gate is opened by showing this summary.
- Admin writes, production auth, broad browser writes, role writes, membership
  writes, and external writes remain disabled.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- open production action-start, proof, leader proof, HQ decision, assignment,
  coach decision, or membership approval writes
- upload proof files
- publish proof publicly
- send reminders, escalation packets, HubSpot, Luma, n8n, warehouse, Power BI,
  SMS, email, or AI writes

The admin control center remains a review surface, not a write console.

## How Staff Should Use It

Open `/admin` as:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=super.admin@mymedlife.test
```

The operating responsibility summary should show all seven guarded local write
steps. The leader assignment row should explicitly name President / VP,
E-Board Member, and Action Committee Chair responsibilities.

## Follow-On

Goal 98 consolidates the current role-responsibility and mock-safe review work
into a single handoff/readiness checkpoint so Nick can review the accumulated
Goal 90-97 changes as one coherent role model.
