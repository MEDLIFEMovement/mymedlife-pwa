# Goal 32: Proof Submission Result States

Goal 32 defines the plain-English result states for the future
`evidence_submitted` browser save.

This goal does not enable proof saves, uploads, public proof sharing, live auth,
or external automation. It makes the future proof/testimonial experience
reviewable before activation.

## Product Meaning

In myMEDLIFE, proof is not a chapter leader approval workflow. Proof is a
testimonial, bridge video, photo, link, or recap that helps MEDLIFE understand
what happened and decide whether the story should be shared more broadly with
other chapters or universities.

Chapter operators can submit proof. MEDLIFE headquarters owns the later
sharing decision.

## Result States

The result-state contract includes:

- `proof_submitted`
- `write_disabled`
- `upload_disabled`
- `action_not_ready`
- `already_submitted`
- `permission_denied`
- `missing_auth`
- `assignment_not_found`
- `summary_too_short`
- `server_error`

Only `proof_submitted` may create evidence metadata and a disabled outbox row in
the future. Every other state must avoid creating duplicate evidence or
automation records.

## Current Behavior

The action detail page now shows:

- the current disabled proof browser result
- the future result for the selected mock proof input
- the disabled server result shape
- every possible proof submission result state

The current result is always `write_disabled`.

## What Stays Disabled

- browser proof save controls
- production Supabase
- live auth/browser sessions
- direct file uploads
- public proof sharing or publishing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS/email, and AI writes

## Files

- `src/services/proof-submission-result-states.ts`
- `src/components/proof-submission-result-states-panel.tsx`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/proof-submission-result-states.test.ts`

## Next Approval Needed

Nick/team should approve a later activation goal before any proof result state
is connected to a real browser write, upload, or public sharing workflow.
