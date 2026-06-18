# Goal 105: Grow the Movement Campaign Plan

## Purpose

Goal 105 deepens the sixth non-Rush starter campaign. Grow the Movement turns
chapter growth into referral owners, campus partnerships, alumni proof,
conversion follow-up, and coach-readable growth health.

## What It Adds

- A typed Grow the Movement campaign plan service.
- A campaign-detail panel on `/campaigns/grow-the-movement`.
- Five mock-safe campaign phases:
  - map referral owners
  - open campus partnerships
  - prepare alumni proof
  - follow up with interested students
  - prepare growth review
- Owner-role visibility for President / VP, Action Committee Chair, E-Board
  Member, Action Committee Member, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- create contacts
- send invites
- update HubSpot
- publish proof
- message alumni
- create referrals
- enable browser writes
- send warehouse, Power BI, n8n, SMS, email, or AI writes

Members do not see this deeper Grow the Movement panel. DS Admin remains routed
to integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/grow-the-movement
```

The page should show the Grow the Movement campaign plan with five phases, zero
writes, zero sends, and the owner-role sequence:

```text
President / VP
Action Committee Chair
E-Board Member
Action Committee Member
Coach
```

## Next Step

Goal 106 now deepens Start a Chapter using the same pattern: role tasks, proof
prompts, KPI signals, structured events, disabled outbox posture, and closeout
rules.
