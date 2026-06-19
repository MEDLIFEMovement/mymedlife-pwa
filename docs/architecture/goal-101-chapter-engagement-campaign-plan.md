# Goal 101: Chapter Engagement Campaign Plan

## Purpose

Goal 101 deepens the second non-Rush starter campaign. Chapter Engagement turns
chapter energy into recurring participation, event momentum, useful recognition,
retention follow-up, and coach-readable engagement health.

## What It Adds

- A typed Chapter Engagement campaign plan service.
- A campaign-detail panel on `/campaigns/chapter-engagement`.
- Five mock-safe campaign phases:
  - find this week's participation pulse
  - turn events into follow-up
  - recognize useful action
  - follow up before members disappear
  - prepare engagement review
- Owner-role visibility for E-Board Member, Action Committee Chair, Action
  Committee Member, President / VP, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- award points
- send nudges
- edit memberships
- create events
- publish proof
- enable browser writes
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

Members do not see this deeper engagement panel. DS Admin remains routed to
integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/chapter-engagement
```

The page should show the Chapter Engagement campaign plan with five phases, zero
writes, zero sends, and the owner-role sequence:

```text
E-Board Member
Action Committee Chair
Action Committee Member
President / VP
Coach
```

## Next Step

Goal 102 now deepens SLT Promotion using the same pattern: role tasks, proof
prompts, KPI signals, structured events, disabled outbox posture, and closeout
rules.
