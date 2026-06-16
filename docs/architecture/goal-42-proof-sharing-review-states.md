# Goal 42: Proof-Sharing Review States

## Purpose

Goal 42 adds a structured HQ proof-sharing posture board to `/proof-library`.

This reflects the clarified product rule:

- proof means testimonials, bridge videos, UGC, photos, or chapter recaps
- students and chapters can submit proof/testimonials
- MEDLIFE HQ decides whether proof can be shared broadly later
- chapter leaders can track posture, but they do not publish proof
- DS Admin does not own proof truth

## Review States

The board classifies proof into:

- `needs_consent_or_context`
- `ready_for_hq_review`
- `future_public_candidate`
- `internal_learning`
- `private_not_shared`

Bridge videos and alumni UGC require special consent/context posture before any
future sharing decision.

## Safety Boundary

The board is read-only. It does not:

- approve proof
- request proof revisions
- publish proof publicly
- create a public proof page
- export proof to a warehouse
- trigger HubSpot, Luma, n8n, Power BI, SMS, email, or AI workflows

All rows report `canBePublishedNow: false` and `externalExportPosture:
disabled`.

## Implementation Notes

- `src/services/proof-sharing-review.ts` owns role visibility, review-state
  classification, counts, and disabled publishing/export posture.
- `src/components/proof-sharing-review-panel.tsx` renders the board.
- `/proof-library` mounts the panel above the existing proof cards.
- `tests/proof-sharing-review.test.ts` covers role visibility, classification,
  counts, and disabled publishing/export posture.
