# Goal 112: Coach Support Notes Workspace

## Purpose

Goal 112 makes the coach-notes part of the MVP visible on `/coach`. Coaches
need more than an advance / hold / intervene selector: they need a clear place
to review the rationale, pending proof, risk response, owner check-in, and
escalation posture before a decision is saved later.

## What It Adds

- A typed coach support notes service.
- A coach support notes panel on `/coach`.
- Five read-only note areas:
  - decision rationale
  - pending evidence
  - risk response
  - owner check-in
  - escalation packet posture
- Source signals from assignments, evidence, KPIs, and risk rows.
- Role boundaries:
  - Coach, Admin, and Super Admin can inspect notes.
  - Chapter members, chapter leaders, and DS Admin cannot.
- Tests proving the workspace is role-scoped, write-safe, and driven by the
  current read model.

Goal 154 extends this workspace with a coach intervention checklist covering
proof review, stalled work, decision notes, risk response, and the escalation
boundary. That checklist helps coaches prepare a hold/intervene check-in before
any note save, coach decision, nudge, escalation, or external send is approved.

## Permission Posture

This goal is read-only.

It does not:

- save coach notes
- enable coach decision writes
- reassign coaches
- send escalation packets
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- expose DS Admin to student proof, points, KPIs, or coach-private notes

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=coach@mymedlife.test
http://localhost:3000/coach
```

The page should show coach support notes with the current local decision,
currently `intervene` in mock fallback, five note areas, coach-private note
count, the Goal 154 intervention checklist, `0` writes, and `0` sends. DS Admin
should not see the coach notes workspace.

## Next Step

Before live launch, the team still needs approved production auth, coach
portfolio assignment truth, RLS review, audit readback, and explicit write
activation before any coach note or coach decision can be saved.
