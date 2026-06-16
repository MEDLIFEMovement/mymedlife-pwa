# Goal 34: Coach Decision Result States

Goal 34 defines the plain-English result states for the future
`coach_decision_logged` browser save.

This goal does not enable coach decision saves, live auth, n8n escalation
packets, or external automation. It makes the future coach decision experience
reviewable before activation.

## Product Meaning

Coaches help MEDLIFE understand whether a chapter should advance, hold, or
receive intervention. A coach decision should become auditable app truth only
after auth, RLS, and browser-write activation are approved.

An intervention decision may shape a future escalation packet, but n8n should
not send that packet until external automation is explicitly approved.

## Result States

The result-state contract includes:

- `advance_recorded`
- `hold_recorded`
- `intervention_recorded`
- `write_disabled`
- `escalation_disabled`
- `permission_denied`
- `portfolio_not_assigned`
- `missing_auth`
- `note_too_short`
- `blocker_summary_required`
- `server_error`

Only the three positive coach decisions may create a readiness review and a
disabled outbox row in the future. No state may send an escalation packet.

## Current Behavior

The coach page now shows:

- the current disabled coach decision browser result
- the future result for the selected mock decision
- the disabled server result shape
- every possible coach decision result state

The current result is always `write_disabled`.

## What Stays Disabled

- browser coach decision save controls
- production Supabase
- live auth/browser sessions
- n8n escalation packets
- HubSpot, Luma, warehouse, Power BI, SMS/email, and AI writes

## Files

- `src/services/coach-decision-result-states.ts`
- `src/components/coach-decision-result-states-panel.tsx`
- `src/app/coach/page.tsx`
- `tests/coach-decision-result-states.test.ts`

## Next Approval Needed

Nick/team should approve a later activation goal before any coach decision
result state is connected to a real browser write or escalation workflow.
