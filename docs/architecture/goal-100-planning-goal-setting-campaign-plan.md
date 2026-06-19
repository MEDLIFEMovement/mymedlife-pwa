# Goal 100: Planning / Goal Setting Campaign Plan

## Purpose

Goal 100 deepens the first non-Rush starter campaign. Planning / Goal Setting is
the natural next campaign because it defines goals, owner lanes, action calendar,
risks, and coach check-ins before later campaigns can run well.

## What It Adds

- A typed Planning / Goal Setting campaign plan service.
- A campaign-detail panel on `/campaigns/planning-goal-setting`.
- Five mock-safe campaign phases:
  - set the chapter goal
  - assign owner lanes
  - publish first actions
  - name the risks
  - prepare coach check-in
- Owner-role visibility for President / VP, E-Board Member, Action Committee
  Chair, and Coach.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Leader access to the required starter campaign details while non-required
  templates remain hidden from leaders.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- create goals
- create campaign templates
- create assignments or events
- write proof
- schedule coach check-ins
- enable browser writes
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

Members do not see this deeper planning panel. DS Admin remains routed to
integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/planning-goal-setting
```

The page should show the Planning / Goal Setting campaign plan with five phases,
zero writes, zero sends, and the owner-role sequence:

```text
President / VP
E-Board Member
Action Committee Chair
President / VP
Coach
```

## Follow-On

Goal 101 deepens Chapter Engagement using the same pattern: role tasks, proof
prompts, KPI signals, structured events, disabled outbox posture, and closeout
rules.
