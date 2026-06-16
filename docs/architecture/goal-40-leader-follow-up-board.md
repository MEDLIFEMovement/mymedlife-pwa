# Goal 40: Leader Follow-Up Board

## Purpose

Goal 40 adds a read-only follow-up queue to `/rush-month/actions` so leaders,
coaches, HQ admins, and super admins can quickly see:

- which assignments need proof review
- which owners need a nudge
- which proof/testimonial rows need revision
- which completions can be recognized
- that reminders and external automation are still disabled

This helps the Rush Month MVP feel more like an operating system and less like
a list of cards.

## Role Behavior

- General members do not see the leader board; they continue to see their own
  actions.
- Chapter leaders see member and leader rows in priority order.
- Coaches see non-approved work relevant to readiness review.
- Admins see HQ proof/support posture.
- DS admins do not see assignment follow-up truth.
- Super admins see the full local board.

## Safety Boundary

The board is read-only. It does not:

- send reminders
- save assignment changes
- approve or reject proof
- publish proof
- write to Supabase from the browser
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI workflows

Every row explicitly reports reminder posture as disabled.

## Implementation Notes

- `src/services/leader-follow-up-board.ts` owns the prioritization rules.
- `src/components/leader-follow-up-board-panel.tsx` renders the board.
- `/rush-month/actions` mounts the panel above the existing assignment list.
- `tests/leader-follow-up-board.test.ts` covers role visibility, priority
  ordering, and disabled reminder posture.
