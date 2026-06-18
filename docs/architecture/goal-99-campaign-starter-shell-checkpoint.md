# Goal 99: Campaign Starter Shell Checkpoint

## Purpose

Goal 99 makes the required non-Rush starter campaign shells reviewable as one
clear checkpoint. The final MVP goal names these shells explicitly, so reviewers
should not need to infer coverage from the full campaign catalog.

## What It Adds

- A starter-shell readiness service for the seven required campaign shells:
  - Planning / Goal Setting
  - Chapter Engagement
  - SLT Promotion
  - Moving Mountains
  - Leadership Transition
  - Grow the Movement
  - Start a Chapter
- A `/campaigns` readiness panel for chapter leaders, coaches, admins, and super
  admins.
- A visible count of required shells present, missing shells, browser writes, and
  external sends.
- Per-shell route, action-lane count, KPI count, student promise, operating
  rhythm, and next build step.
- Tests proving the required shells exist, stay at zero writes/sends, expose
  missing shell gaps, and stay hidden from members and DS Admin.

## Permission Posture

This goal is read-only.

The checkpoint does not:

- enable production auth
- enable browser writes
- create or edit campaign templates
- publish campaign SOPs
- create assignments or events
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

It proves starter-shell coverage only. Rush Month remains the only campaign with
an end-to-end local operating loop.

## Review Path

Open `/campaigns` as one of:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=leader.a@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=coach@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
MYMEDLIFE_LOCAL_ACTOR_EMAIL=super.admin@mymedlife.test
```

The Required Starter Shells panel should show:

- `7/7` present
- `0` missing
- `0` writes
- `0` sends
- one card for each required campaign shell

Members should continue to see simple active-campaign behavior. DS Admin should
remain routed toward integration/outbox safety instead of campaign truth.

## Follow-On

Goal 100 deepens Planning / Goal Setting into the first non-Rush campaign plan
with role tasks, proof prompts, KPI signals, structured events, disabled outbox
posture, and closeout rules.
