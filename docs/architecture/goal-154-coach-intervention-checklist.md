# Goal 154: Coach Intervention Checklist

## Purpose

Goal 154 strengthens the coach readout on `/coach`. Coaches already had support
notes, portfolio posture, result states, and a disabled decision path. This goal
adds a short intervention checklist that turns proof, stalled work, risk, and
KPI posture into a concrete check-in plan.

## What It Adds

- A typed coach intervention checklist inside the coach support notes workspace.
- Checklist items for:
  - proof review
  - stalled work
  - decision note
  - risk response
  - escalation boundary
- Counts for ready, watch, and blocked checklist items.
- Visible locked controls for coach note saves, coach decisions, member nudges,
  escalation packets, and external automation.
- Tests proving the checklist is role-scoped, read-only, and driven by the
  current assignments, evidence, KPI decision, and risk rows.

## Permission Posture

This goal is read-only.

It does not:

- save coach notes
- save coach decisions
- reassign coaches
- nudge members
- send escalation packets
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- expose DS Admin to student proof, points, KPIs, or coach-private notes

Coach, Admin, and Super Admin can inspect the checklist. Chapter members,
chapter leaders, and DS Admin cannot.

## Review Path

Open:

```text
MYMEDLIFE_LOCAL_ACTOR_EMAIL=coach@mymedlife.test
http://localhost:3000/coach
```

The page should show the Coach intervention checklist with proof review,
stalled work, decision note, risk response, and escalation-boundary items. It
should show `0` writes, `0` sends, and locked controls for note saves, coach
decision saves, nudges, escalation sends, and external automation.

## Next Step

Before this becomes production behavior, Nick and the DS team still need to
approve production auth, coach portfolio assignment truth, chapter-scoped RLS,
audit readback, support-note retention, coach-decision rollback, and the exact
escalation-send policy.
