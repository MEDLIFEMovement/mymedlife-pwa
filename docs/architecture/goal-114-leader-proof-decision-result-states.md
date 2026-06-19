# Goal 114: Leader Proof Decision Result States

## Purpose

Goal 114 defines the plain-English result states for future chapter-level proof
decisions on `/rush-month/review`.

Goal 113 made the disabled Approve, Request changes, and Reject controls visible.
Goal 114 explains what each outcome would do once writes are approved, while
keeping all saves disabled.

## What It Adds

- A typed leader proof decision result-state service.
- A leader proof decision result-state panel on `/rush-month/review`.
- Admin result-state coverage for the sixth reviewed write family:
  `leader_proof_decision`.
- Tests proving:
  - current browser result is `write_disabled`
  - approval would create future points and KPI intent
  - request changes and reject do not award points
  - no leader result publishes proof publicly
  - member, coach, Admin, and DS Admin cannot own chapter proof decisions

## Permission Posture

This goal is read-only.

It does not:

- save leader proof decisions
- award points
- write KPI events
- nudge members
- publish proof
- change HQ proof-sharing decisions
- enable production Supabase
- enable browser writes
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

Chapter Leader and Super Admin are the future decision owners. Admin can inspect
support posture. DS Admin remains review-only and cannot own chapter proof truth.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/rush-month/review
```

The page should show:

- the leader proof decision workspace
- the leader proof decision result states panel
- current browser result `write_disabled`
- future result `proof_approved` for the ready proof sample
- future event `evidence_approved`
- future audit action `leader_proof_approved`
- no public proof publishing
- no enabled save controls

## Next Step

Before implementing the real local write, define the database function and RLS
tests for leader proof decisions, points events, KPI events, disabled outbox
rows, and audit logs. Keep HQ broad-sharing decisions separate.
