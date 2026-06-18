# Goal 106: Start a Chapter Campaign Plan

## Purpose

Goal 106 deepens the seventh non-Rush starter campaign. Start a Chapter turns
campus interest into founding-team formation, first events, readiness gates, and
coach handoff before a new chapter enters normal operations.

## What It Adds

- A typed Start a Chapter campaign plan service.
- A campaign-detail panel on `/campaigns/start-a-chapter`.
- Five mock-safe campaign phases:
  - confirm campus interest
  - build the founding team
  - plan first chapter events
  - review readiness gates
  - prepare coach handoff
- Owner-role visibility for Admin, Coach, and Action Committee Chair.
- KPI signals, structured events, proof prompts, disabled outbox destinations,
  closeout checks, and safety reminders for each phase.
- Tests proving the plan is role-aware, event-backed, and still at zero browser
  writes and zero external sends.

## Permission Posture

This goal is read-only.

It does not:

- create chapters
- approve founding teams
- edit roles
- edit memberships
- contact prospects
- update HubSpot
- create Luma events
- enable browser writes
- send warehouse, Power BI, n8n, SMS, email, or AI writes

Members do not see this deeper Start a Chapter panel. DS Admin remains routed
to integration/outbox safety instead of campaign truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/campaigns/start-a-chapter
```

The page should show the Start a Chapter campaign plan with five phases, zero
writes, zero sends, and the owner-role sequence:

```text
Admin
Coach
Action Committee Chair
Admin
Coach
```

## Next Step

The reusable campaign foundation now has deepened local plans for all seven
required non-Rush starter shells. Next work should turn the strongest approved
campaign plan into a production write-enabled workflow only after auth, RLS,
audit, rollback, and integration approval are complete.
