# Goal 155: Integration Live-Send Preflight

## Purpose

Goal 155 strengthens `/admin/integration-outbox` for DS/Admin review. The route
already showed structured integration events, automation outbox rows, audit
posture, and blocked controls. This goal adds a live-send preflight checklist so
reviewers can see exactly what must be true before any external automation is
approved.

## What It Adds

- A typed live-send preflight checklist in the admin integration outbox
  workspace.
- Checklist items for:
  - source event
  - payload and idempotency
  - audit readback
  - destination policy
  - secrets and sends boundary
- Ready, watch, and blocked counts.
- Explicit locked controls for live-send approval, retries, payload edits, queue
  unlocks, secret display, and external workers.
- Tests for mock-safe review, DS Admin hidden audit detail posture, raw queue
  readback, and live-send-like rows.

## Permission Posture

This goal is read-only.

It does not:

- approve live sends
- retry failed sends
- edit payloads
- unlock queue rows
- show integration secrets
- start external workers
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- expose DS Admin to row-level chapter/member audit details

Admin, DS Admin, and Super Admin can inspect the checklist. Chapter members,
chapter leaders, and coaches cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=ds.admin@mymedlife.test
http://localhost:3000/admin/integration-outbox
```

The page should show the Live-send preflight checklist with source event,
payload/idempotency, audit readback, destination policy, and secrets-boundary
items. It should show `0` browser writes, `0` external sends, `0` secrets, and
locked controls for queue mutations and external automation.

## Next Step

Before any live integration runs, Nick and the DS team still need to approve
destination contracts, payload schemas, idempotency and retry policy, audit
readback, rollback/disable procedure, integration secrets handling, and first
pilot scope.
