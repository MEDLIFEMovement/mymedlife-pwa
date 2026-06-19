# Goal 98: Role Model Review Checkpoint

## Purpose

Goal 98 consolidates the Goal 90-97 role/persona and responsibility work into
one admin-visible checkpoint for Nick review. Reviewers should be able to see
which fake local actor to use, which route to open, and what pass signal proves
the local MVP role model is understandable before any live auth or write
approval.

## What It Adds

- A Goal 90-97 role model checkpoint inside the `/admin` release-readiness
  panel.
- Eight explicit route checks covering President / VP, E-Board, roster,
  assignment responsibility, write sequence responsibility, and admin summary
  review.
- A zero browser-write and zero external-send posture on every checkpoint item.
- Tests proving the checkpoint is visible to admin reviewers and hidden from
  chapter/coach roles.

## Permission Posture

This goal is read-only.

The checkpoint does not:

- enable production auth
- enable browser writes
- change roles or memberships
- create assignments or proof
- open public proof sharing
- send reminders, HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI
  writes

It helps reviewers decide whether the local role model is clear enough to move
to auth/onboarding approval. It does not approve live writes.

## Review Path

Open `/admin` as:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=admin@mymedlife.test
```

Review the release-readiness panel and use the Goal 90-97 role model checkpoint
to walk these surfaces:

- `/rush-month/dashboard` as `leader.a@mymedlife.test`
- `/rush-month/dashboard` as `eboard.a@mymedlife.test`
- `/rush-month/actions` as `leader.a@mymedlife.test`
- `/rush-month/review` as `eboard.a@mymedlife.test`
- `/chapter/members` as `leader.a@mymedlife.test`
- `/admin/assignment-write` as `admin@mymedlife.test`
- `/admin/write-sequence` as `admin@mymedlife.test`
- `/admin` as `admin@mymedlife.test`

Each item should show `0 writes` and `0 sends`.

## Next Step

Nick should review the checkpoint and decide whether the local role model is
clear enough to proceed to the auth/onboarding approval discussion.
