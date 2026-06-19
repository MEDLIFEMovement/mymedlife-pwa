# Goal 96: Write Sequence Role Responsibility

## Purpose

Goal 96 carries the role-responsibility model from `/admin/assignment-write`
into `/admin/write-sequence` and `/admin/staff-dry-run`. Reviewers can now trace
each guarded Rush Month write by the role responsible for the operating step
before any browser write or staging discussion happens.

## What It Adds

- A role-responsibility field on every write-sequence operation.
- Planner UI that shows responsible role, responsibility, review prompt, and
  safety boundary for all seven local write candidates.
- Staff dry-run write rehearsal UI that mirrors the same responsibility context.
- Tests proving the leader assignment step separates President / VP approval
  guardrails, E-Board owner handoff, and Action Committee Chair coordination.
- Tests proving the staff dry-run inherits role responsibility from the write
  sequence planner.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- `/admin/write-sequence` and `/admin/staff-dry-run` remain visible only to
  Admin, DS Admin, and Super Admin review contexts.
- Role responsibility is explanatory and read-only.
- No write gate is opened by adding this metadata.
- The seven local write candidates still require their packet gates, local auth,
  local Supabase readback, explicit flags, disabled outbox posture, and audit
  evidence before promotion.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- open action-start, proof, HQ decision, assignment, or coach decision writes
- upload proof files
- publish proof publicly
- send reminders, escalation packets, HubSpot, Luma, n8n, warehouse, Power BI,
  SMS, email, or AI writes

The write sequence and staff dry-run remain review surfaces, not write consoles.

## How Staff Should Use It

Open these routes as Admin, DS Admin, or Super Admin:

```text
/admin/write-sequence
/admin/staff-dry-run
```

Confirm each local write candidate shows:

- the responsible role
- what that role owns
- what reviewers should check
- what must remain disabled

For leader assignment, the review should explicitly name President / VP,
E-Board Member, and Action Committee Chair responsibilities before assignment
creation is tested.

## Follow-On

Goal 97 makes the admin control center summarize this role-responsibility model
so non-technical reviewers can see the same approval and execution boundaries
from the first admin screen.
