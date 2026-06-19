# Goal 153: Leader Proof Review Rubric

## Purpose

Goal 153 strengthens the leader proof-review loop on `/rush-month/review`.
Leaders already had disabled approve, request-changes, and reject controls. This
goal adds a plain-English rubric so the decision is based on consistent proof
quality before any future save path is approved.

## What It Adds

- A typed review rubric on each leader proof decision row.
- Rubric checks for:
  - assignment fit
  - story context
  - points and KPI impact
  - HQ/public-sharing boundary
- A story-context prompt for each proof row.
- A recommended decision rationale that tells leaders when to approve, request
  changes, wait, or avoid duplicate approval records.
- A visible points/KPI impact line on the review card.

## Permission Posture

This goal is read-only by default.

It does not:

- save leader proof decisions
- update assignment status
- update points or KPI ledgers
- send member nudges
- publish proof
- export proof to the warehouse or Power BI
- generate AI summaries
- send HubSpot, Luma, n8n, SMS, email, or other external writes

Chapter leaders, Admin, and Super Admin can inspect the rubric. Members,
coaches, and DS Admin remain out of the leader proof decision workspace.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
http://localhost:3000/rush-month/review
```

The page should show the leader proof decision workspace with the Review rubric
section, disabled Approve / Request changes / Reject controls, `0` writes, `0`
sends, future structured event labels, and a clear boundary that HQ still owns
broad proof sharing.

## Next Step

Before real leader proof decisions become production behavior, Nick and the DS
team still need to approve auth, chapter-scoped RLS, audit readback, points/KPI
ledger behavior, rollback evidence, notification policy, and proof consent or
storage requirements.
