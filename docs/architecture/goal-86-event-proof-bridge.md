# Goal 86: Event Proof Bridge

## Purpose

Goal 86 connects Rush Month events to the proof/testimonial intake loop. The app
already had event readiness and proof upload readiness surfaces, but the member
journey needed a clearer bridge:

1. attend or support the event
2. answer the feedback/NPS prompt
3. prepare the proof/testimonial context
4. let HQ decide later what can be shared

This keeps the student experience simple while preserving the future event,
outbox, and audit model.

## What It Adds

- A Rush Month event-to-proof bridge service.
- A new `/rush-month/events` panel that shows event action, feedback prompt,
  proof prompt, future structured records, and disabled outbox destinations.
- Role-aware copy for member, action committee member, action committee chair,
  leader, coach, admin, DS admin, and super admin views.
- Tests proving the member loop, committee role focus, coach posture, DS admin
  restriction, and future automation/event posture.

## Role Behavior

- Member: attend, reflect, and share what mattered.
- Action Committee Member: support the event and help capture proof.
- Action Committee Chair: close the event loop with attendance, feedback, and
  proof follow-up.
- Chapter Leader: connect event attendance, NPS, proof, and assignments.
- Coach: treat event follow-through as a chapter health signal.
- Admin: review proof posture before sharing.
- DS Admin: no student event/proof truth; use integration/admin surfaces.
- Super Admin: inspect the full local event-to-proof loop.

## Future Structured Records

The bridge names the records the real app should eventually create:

- `chapter_event_attended`
- `luma_attendance_import_mocked`
- `event_feedback_submitted`
- `kpi_event_recorded`
- `evidence_submitted`
- `proof_consent_recorded`
- `automation_outbox_recorded`
- `audit_log_recorded`

## Safety Boundary

This goal does not:

- create/update Luma events
- import Luma attendance
- send NPS reminders
- upload proof files
- publish proof publicly
- send warehouse, Power BI, HubSpot, n8n, SMS, email, or AI writes
- create real attendance, feedback, proof, KPI, outbox, or audit rows

All new behavior is local/read-only/mock-safe.

## Next Step

The next useful slice is to make the member action detail page point more
clearly from a completed event/action into the proof/testimonial intake preview,
while keeping actual uploads and external automation disabled.
