# Goal 104: Leadership Transition Campaign Plan

## Purpose

Goal 104 deepens the fifth non-Rush starter campaign. Leadership Transition
turns outgoing-leader context into successor coverage, role handoff notes,
committee chair continuity, coach validation, and open-risk closeout.

## What It Adds

- A typed Leadership Transition campaign plan service.
- A campaign-detail panel on `/campaigns/leadership-transition`.
- Five mock-safe campaign phases:
  - map successor coverage
  - write role handoff notes
  - confirm committee chair handoff
  - prepare coach validation
  - close transition risks
- Owner-role visibility for President / VP, E-Board Member, Action Committee
  Chair, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- change roles
- approve successors
- edit memberships
- send transition reminders
- create HubSpot records
- send email or SMS
- enable browser writes
- send warehouse, Power BI, n8n, or AI writes

Members do not see this deeper Leadership Transition panel. DS Admin remains
routed to integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/leadership-transition
```

The page should show the Leadership Transition campaign plan with five phases,
zero writes, zero sends, and the owner-role sequence:

```text
President / VP
E-Board Member
Action Committee Chair
Coach
President / VP
```

## Next Step

Goals 105 and 106 now deepen Grow the Movement and Start a Chapter using the
same pattern: role tasks, proof prompts, KPI signals, structured events,
disabled outbox posture, and closeout rules.
