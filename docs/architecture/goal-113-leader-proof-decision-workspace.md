# Goal 113: Leader Proof Decision Workspace

## Purpose

Goal 113 makes the leader proof-review flow explicit on `/rush-month/review`.
The MVP requirement says leaders need to approve, reject, or request changes on
evidence. This goal adds the local review surface for that workflow while
keeping all proof decision writes disabled.

## What It Adds

- A typed leader proof decision workspace service.
- A leader proof decision panel on `/rush-month/review`.
- Disabled decision controls for:
  - approve
  - request changes
  - reject
- Row-level posture for:
  - ready for approval
  - needs changes
  - not ready
  - already approved
- Future structured event and audit action labels for each recommended decision.
- Tests proving the workspace is role-scoped, write-safe, and separate from HQ
  broad-sharing decisions.

Goal 153 extends this same workspace with a leader proof review rubric covering
assignment fit, story context, points/KPI impact, and the HQ sharing boundary.
That rubric helps leaders judge proof quality before any future decision save
path is approved.

## Permission Posture

This goal is read-only.

It does not:

- save proof decisions
- update assignment status
- update points or KPI ledgers
- send member nudges
- publish proof
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- grant DS Admin access to student proof truth

Chapter leaders, Admin, and Super Admin can inspect the workspace. Members,
coaches, and DS Admin cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/rush-month/review
```

The page should show leader proof decisions with disabled Approve, Request
changes, and Reject controls, `0` writes, `0` sends, future structured event
labels, and a clear boundary that HQ still owns broad proof sharing.

## Next Step

Before this becomes a real write path, the team must approve production auth,
chapter-scoped RLS, audit readback, points/KPI ledger behavior, rollback, and
the exact notification/outbox policy for member nudges.
