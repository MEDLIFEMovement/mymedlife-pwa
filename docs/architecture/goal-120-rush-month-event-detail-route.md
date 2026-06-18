# Goal 120: Rush Month Event Detail Route

Goal 120 adds a direct event-detail workspace at
`/rush-month/events/[eventId]`.

## Why

The Rush Month events list already showed event plans, NPS prompts, proof
prompts, and disabled Luma/outbox posture. Reviewers still needed one route that
answers: "What should I do next for this event?"

## Route

- `/rush-month/events/event-rush-social-001`

## What The Route Shows

- event owner and action committee
- timing, event type, and support lane
- role-aware next action
- expected student action
- feedback/NPS prompt
- proof prompt
- readiness checks
- future structured events
- disabled Luma, n8n, and warehouse outbox rows

## Role Boundary

- Members see an event game plan and are sent back to their actions.
- Action Committee Members see support action guidance.
- Action Committee Chairs see event execution ownership guidance.
- Chapter Leaders see assignment and owner follow-up guidance.
- Coaches see event risk context and are sent to the coach readout.
- Admin and Super Admin can inspect readiness/outbox posture.
- DS Admin is restricted from chapter event, attendance, NPS, and proof truth.

## Safety Boundary

This route does not:

- create or update Luma events
- import attendance
- send NPS reminders
- upload proof
- write event recaps
- write KPI events
- send n8n, HubSpot, warehouse, Power BI, SMS, email, or AI automation

All production event handling must later use approved server-side write paths,
RLS tests, audit records, and disabled-by-default outbox promotion.

## Files

- `src/app/rush-month/events/[eventId]/page.tsx`
- `src/services/rush-month-event-detail.ts`
- `src/components/rush-month-event-readiness-panel.tsx`
- `tests/rush-month-event-detail.test.ts`
