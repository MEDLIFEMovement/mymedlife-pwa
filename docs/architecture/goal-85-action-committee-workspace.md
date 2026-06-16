# Goal 85: Action Committee Workspace

## Purpose

Goal 85 makes `/action-committees` more useful for the actual MEDLIFE action
committee operating model. The page already listed committee lanes and example
events, but it did not tell each role what to do next.

This goal adds a role-aware workspace summary so general members, action
committee members, action committee chairs, leaders, coaches, admins, DS admins,
and super admins can review the committee operating loop without enabling
production writes.

## What It Adds

- A role-aware committee workspace service.
- A new `/action-committees` panel that answers "What should I do next?"
- Priority event focus cards with event action, proof prompt, and Luma status.
- Structured events to watch for future automation readiness.
- Safety reminders that Luma, reminders, proof sharing, warehouse, Power BI,
  HubSpot, n8n, SMS, email, and AI writes remain disabled.
- Tests for committee member, committee chair, coach, and DS admin views.

## Role Behavior

- General Member: find one real event or action to join.
- Action Committee Member: support one event and know the proof prompt.
- Action Committee Chair: confirm owner, promotion task, feedback plan, and
  proof prompt.
- Chapter Leader: check whether committees are creating real event work.
- Coach: spot committees with weak event or feedback/proof loops.
- Admin: review committee operations without owning chapter truth.
- DS Admin: no committee event truth; use admin outbox screens instead.
- Super Admin: review full local operating model and safety posture.

## Safety Boundary

This goal does not:

- enable production auth
- enable browser write controls
- create or update Luma events
- send reminders
- upload proof files
- publish proof publicly
- send warehouse, Power BI, HubSpot, n8n, SMS, email, or AI writes
- create real assignments, events, points, KPIs, or audit rows

All content remains local/mock-safe.

## Next Step

The next useful slice is to connect the committee workspace more tightly to
member-facing event attendance and proof/testimonial intake, still using local
mock-safe data and disabled external integrations.
