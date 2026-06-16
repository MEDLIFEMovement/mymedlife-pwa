# Goal 44: Campaign Closeout Readiness

## Purpose

Goal 44 adds a read-only campaign closeout/readiness panel to `/rush-month`.

The panel helps leaders, coaches, HQ admins, and super admins see whether Rush
Month is ready to advance, should hold for follow-up, or needs intervention.

## What It Reviews

- assignment completion
- proof/testimonial posture
- event feedback and NPS posture
- coach advance / hold / intervene decision

## Role Behavior

- Chapter leaders can read closeout readiness for their operating work.
- Coaches can read it before deciding advance / hold / intervene.
- Admins and super admins can read HQ support posture.
- General members do not see closeout details.
- DS Admin does not see closeout details.

## Safety Boundary

This panel does not:

- advance campaign phases
- save closeout records
- change coach decisions
- export warehouse rows
- send coach packets
- trigger n8n, HubSpot, Luma, Power BI, SMS, email, or AI workflows

Closeout writes and external exports remain `0`.

## Implementation Notes

- `src/services/campaign-closeout-readiness.ts` owns readiness state,
  closeout rows, role visibility, and disabled write/export posture.
- `src/components/campaign-closeout-readiness-panel.tsx` renders the board.
- `/rush-month` mounts the panel for allowed roles.
- `tests/campaign-closeout-readiness.test.ts` covers role visibility,
  disabled writes/exports, advance-ready state, and intervention state.
