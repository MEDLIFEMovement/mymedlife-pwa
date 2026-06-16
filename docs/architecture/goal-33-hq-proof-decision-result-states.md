# Goal 33: HQ Proof Decision Result States

Goal 33 defines the plain-English result states for the future
`hq_sharing_decision` browser save.

This goal does not enable HQ decision saves, public proof publishing, live auth,
or external automation. It makes the future headquarters review experience
reviewable before activation.

## Product Meaning

Proof/testimonials are belief-building assets. Students and chapter operators
submit them, then MEDLIFE headquarters decides whether they should be shared
with other universities, chapters, or online surfaces.

An HQ approval is not the same thing as public publishing. Publishing must stay
separate until a later approved proof-library and external-sharing workflow
exists.

## Result States

The result-state contract includes:

- `sharing_approved`
- `changes_requested`
- `decision_noted_without_sharing`
- `write_disabled`
- `public_sharing_disabled`
- `already_decided`
- `permission_denied`
- `missing_auth`
- `evidence_not_found`
- `note_too_short`
- `server_error`

Only the three positive HQ decisions may create an approval row and disabled
outbox row in the future. No state may publish proof directly.

## Current Behavior

The HQ review page now shows:

- the current disabled HQ decision browser result
- the future result for the selected mock decision
- the disabled server result shape
- every possible HQ decision result state

The current result is always `write_disabled`.

## What Stays Disabled

- browser HQ decision save controls
- production Supabase
- live auth/browser sessions
- public proof sharing or publishing
- warehouse exports
- HubSpot, Luma, n8n, Power BI, SMS/email, and AI writes

## Files

- `src/services/hq-proof-decision-result-states.ts`
- `src/components/hq-proof-decision-result-states-panel.tsx`
- `src/app/rush-month/review/page.tsx`
- `tests/hq-proof-decision-result-states.test.ts`

## Next Approval Needed

Nick/team should approve a later activation goal before any HQ proof decision
result state is connected to a real browser write, public proof-library update,
or external workflow.
