# Goal 102: SLT Promotion Campaign Plan

## Purpose

Goal 102 deepens the third non-Rush starter campaign. SLT Promotion turns trip
interest into belief-building proof, info-session readiness, question follow-up,
student next steps, and coach-readable promotion health.

## What It Adds

- A typed SLT Promotion campaign plan service.
- A campaign-detail panel on `/campaigns/slt-promotion`.
- Five mock-safe campaign phases:
  - prepare belief-building proof
  - run the SLT info session
  - track questions and hesitations
  - move interested students to next step
  - prepare SLT promotion review
- Owner-role visibility for President / VP, Action Committee Chair, Action
  Committee Member, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- collect deposits
- send reminders
- create HubSpot records
- create Luma events
- send email or SMS
- enroll students in a trip
- publish proof
- enable browser writes
- send warehouse, Power BI, n8n, or AI writes

Members do not see this deeper SLT panel. DS Admin remains routed to
integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/slt-promotion
```

The page should show the SLT Promotion campaign plan with five phases, zero
writes, zero sends, and the owner-role sequence:

```text
President / VP
Action Committee Chair
Action Committee Member
President / VP
Coach
```

## Next Step

Goal 103 now deepens Moving Mountains using the same pattern: role tasks, proof
prompts, KPI signals, structured events, disabled outbox posture, and closeout
rules.
