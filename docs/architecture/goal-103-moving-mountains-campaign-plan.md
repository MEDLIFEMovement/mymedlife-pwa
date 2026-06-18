# Goal 103: Moving Mountains Campaign Plan

## Purpose

Goal 103 deepens the fourth non-Rush starter campaign. Moving Mountains turns
mission energy into a concrete story, advocacy action, fundraising momentum,
supporter follow-up, and coach-readable movement health.

## What It Adds

- A typed Moving Mountains campaign plan service.
- A campaign-detail panel on `/campaigns/moving-mountains`.
- Five mock-safe campaign phases:
  - set the movement story
  - run the advocacy action
  - build fundraising momentum
  - follow up with new supporters
  - prepare Moving Mountains review
- Owner-role visibility for President / VP, Action Committee Chair, Action
  Committee Member, E-Board Member, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- process payments
- send fundraising appeals
- publish stories
- update supporter records
- create HubSpot records
- send email or SMS
- enable browser writes
- send warehouse, Power BI, n8n, or AI writes

Members do not see this deeper Moving Mountains panel. DS Admin remains routed
to integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/moving-mountains
```

The page should show the Moving Mountains campaign plan with five phases, zero
writes, zero sends, and the owner-role sequence:

```text
President / VP
Action Committee Chair
Action Committee Member
E-Board Member
Coach
```

## Next Step

Goal 104 now deepens Leadership Transition using the same pattern: role tasks,
proof prompts, KPI signals, structured events, disabled outbox posture, and
closeout rules.
