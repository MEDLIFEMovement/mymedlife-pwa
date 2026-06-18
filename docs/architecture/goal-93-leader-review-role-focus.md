# Goal 93: Leader Review Role Focus

## Purpose

Goal 93 carries the separated President / VP and E-Board Member local personas
into `/rush-month/review`. The MVP needs leaders to review evidence posture,
track completion, and coach proof follow-up while keeping HQ sharing decisions
separate from chapter leadership authority.

## What It Adds

- President / VP proof-review guidance focused on accountability, HQ-ready
  proof, owner context, and member-role coverage.
- E-Board Member proof-review guidance focused on owner nudges, event-linked
  proof follow-up, and clearing context gaps before HQ review stalls.
- Generic chapter-leader guidance for Action Committee Chair without pretending
  that role owns President / VP or E-Board duties.
- A dedicated service for leader review focus so the page copy is backed by
  tested role logic.
- Tests proving President / VP, E-Board Member, generic chapter leader, member,
  and HQ operator behavior.

## Permission Posture

This goal does not create a new production permission model.

For the current local review build:

- President / VP and E-Board Member still map to `chapter_leader` visibility.
- `/rush-month/review` now gives them different proof-review priorities.
- Chapter leaders can inspect proof posture and follow-up needs.
- Admin and Super Admin remain the only local personas that can preview HQ
  sharing decisions.
- Proof decisions, proof uploads, public publishing, exports, reminders, role
  changes, membership writes, and external automations remain disabled.

## Safety Boundary

This goal does not:

- enable production auth
- enable broad browser writes
- create production users
- approve, reject, or request proof changes as a chapter leader
- upload proof files
- publish proof publicly
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The existing HQ decision write path remains approval-gated and mock-safe.

## How Staff Should Use It

Preview both leader roles:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=eboard.a@mymedlife.test
```

Open `/rush-month/review`.

- President / VP should see proof review framed as accountability and
  HQ-readiness without taking over HQ sharing.
- E-Board Member should see proof review framed as owner and event follow-up.
- Action Committee Chair should see generic chapter-leader proof guidance.
- Admin should still see HQ decision controls as disabled/future-safe local
  preview, not as a leader role focus panel.

## Follow-On

Goal 94 carries the same role clarity into `/chapter/members`, where President
/ VP coverage and approval-readiness duties are separated from E-Board member
follow-up and committee execution duties.
