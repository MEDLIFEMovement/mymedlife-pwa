# Goal 63: HQ Proof Decision Server Action

Goal 63 adds the third approved local browser-to-Supabase write slice for the
Rush Month MVP loop:

```text
member submits proof/testimonial metadata -> HQ records sharing decision
```

This goal does not publish proof, upload files, connect production auth, or send
real external automation.

## What This Adds

- A local-only server action on `/rush-month/review` for HQ proof/testimonial
  decisions.
- A review-page form that only enables when every local safety check passes.
- Read-only local Supabase evidence rows in the app review model.
- A readback state that confirms the refreshed proof status after a local HQ
  decision result.
- Environment safety reporting for the new HQ decision write flag.
- Tests for HQ decision readiness, result mapping, readback, route gate
  behavior, environment posture, and local evidence reads.

## Local Write Requirements

The HQ decision form stays disabled unless all of these are true:

- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true`
- The actor comes from a signed-in local Supabase Auth session.
- The evidence item ID is a UUID, not a mock string ID.
- The signed-in actor is Admin or Super Admin.
- The proof item does not already have a final approved state.
- The HQ decision note has enough context for audit review.
- Public proof sharing remains disabled.
- External sends remain disabled.

## Database Function

The server action calls the existing local database function:

```text
app.record_hq_proof_sharing_decision(evidence_uuid, decision_input, review_note)
```

The UI decisions map to database decisions as follows:

- `approved` -> `approved_for_sharing`
- `changes_requested` -> `changes_requested`
- `rejected` -> `not_shared`

The database function writes the related records together:

- evidence review and sharing status update
- approval decision row
- internal `hq_sharing_decision_logged` event
- integration event row for future automation pickup
- disabled automation outbox row
- audit log row

The browser never writes directly to those tables.

## Safety Boundary

Still disabled:

- production Supabase
- production users
- production auth
- proof uploads or file storage writes
- public proof sharing or publishing
- leader-owned proof approval for broad sharing
- coach decision browser writes
- assignment creation browser writes
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

HQ can record local review truth in this slice, but the app still does not share
or syndicate proof anywhere.

## Local Review Path

Use the fake local proof item:

```text
60000000-0000-4000-8000-000000000001
```

Recommended flow:

1. Start local Supabase and reset seed data.
2. Enable local reads, local auth, local writes, and the HQ decision write flag.
3. Sign in as `admin@mymedlife.test` with password `password`.
4. Open `/rush-month/review`.
5. Confirm the local proof queue appears.
6. Save a local HQ decision.
7. Confirm the refreshed page reads the expected proof status.

## Why This Matters

Nick clarified that proof is not an E-board approval workflow. Proof is a
testimonial or bridge-video style asset that MEDLIFE HQ reviews for learning,
belief-building, and future sharing. Goal 63 makes that ownership concrete:
students submit proof, HQ records the sharing decision, and myMEDLIFE/Supabase
keeps the source-of-truth record with automation-ready event/outbox rows.
