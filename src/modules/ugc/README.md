# UGC And Proof Module

## What This Owns
- Proof metadata, evidence requirements, UGC review, consent posture, and feed publishing readiness.

## What This Does Not Own
- Raw file upload storage, public publishing, external sends, or points calculation internals.

## Routes
- `/rush-month/evidence`
- proof review/admin packet routes.
- staff proof and feed studio views.

## Components And Services
- Proof submission panels, proof status panels, leader review workspaces, and UGC review surfaces.

## Data Models
- Evidence rows, proof status, consent gates, review decisions, and feed post metadata.

## Flags
- `ugc_feed_proof`
- Disabled UGC must not break events, Luma, points, or staff analytics.

## Permissions
- Members submit own proof. Leaders review chapter proof. Staff/admin inspect broader review posture.

## Integrations
- Uploads and public publishing are approval-gated.

## Tests
- `tests/evidence-page.test.tsx`
- `tests/proof-submission-write.test.ts`
- `tests/leader-proof-decision-workspace.test.ts`

## Safe Modification
- Keep consent and review state transitions in services, not UI-only branches.

## TODOs
- Move proof and feed services into this module.
