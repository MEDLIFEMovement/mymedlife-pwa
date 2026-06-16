# Goal 62: Proof Submission Server Action

Goal 62 adds the second approved local browser-to-Supabase write slice for the
Rush Month MVP loop:

```text
member starts assigned action -> member submits proof/testimonial metadata
```

This goal does not add file uploads, public proof publishing, production auth,
or real external automation.

## What This Adds

- A local-only server action on `/rush-month/actions/[assignmentId]` for proof
  / testimonial metadata.
- A proof submission panel that only enables when every local safety check
  passes.
- A proof readback state that only confirms success when the refreshed
  assignment status is `submitted`.
- Environment safety reporting for the new proof metadata write flag.
- Tests for proof write readiness, result mapping, readback, environment
  posture, and browser-write gate behavior.

## Local Write Requirements

The proof metadata form stays disabled unless all of these are true:

- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`
- `MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`
- `MYMEDLIFE_ALLOW_PROOF_UPLOADS=false`
- The actor comes from a signed-in local Supabase Auth session.
- The assignment ID is a UUID, not a mock string ID.
- The signed-in actor is allowed to submit proof for the assignment.
- The assignment status is `in_progress` or `changes_requested`.
- The proof/testimonial summary has enough context for HQ review.

## Database Function

The server action calls the existing local database function:

```text
app.submit_assignment_proof_metadata(...)
```

That function is responsible for writing the related records together:

- assignment status update to `submitted`
- evidence/proof metadata row
- internal `evidence_submitted` event
- integration event row for future automation pickup
- disabled automation outbox row
- audit log row

The app does not insert directly into those tables from the browser.

## Safety Boundary

Still disabled:

- production Supabase
- production users
- production auth
- proof uploads or file storage writes
- public proof sharing or publishing
- HQ proof-sharing decision browser writes
- coach decision browser writes
- assignment creation browser writes
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The proof metadata path is intentionally narrow. It exists to prove the second
safe local operating-loop write before expanding the MVP into uploads, HQ
review, points/KPIs, coach decisions, and later automation.

## Local Review Path

Use the fake local assignment:

```text
50000000-0000-4000-8000-000000000003
```

Recommended flow:

1. Start local Supabase and reset seed data.
2. Enable local reads, local auth, and the action-start write flag.
3. Sign in as `member.a@mymedlife.test` with password `password`.
4. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
5. Start the action and confirm it refreshes to `in_progress`.
6. Enable `MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`.
7. Keep `MYMEDLIFE_ALLOW_PROOF_UPLOADS=false`.
8. Submit the proof/testimonial metadata form.
9. Confirm the refreshed page reads assignment status `submitted`.

## Why This Matters

Rush Month MVP needs more than a pretty read-only shell. The app must prove that
a student can take action and submit proof/testimonial metadata while
myMEDLIFE/Supabase remains the source of truth and every automation-ready record
is structured for future n8n pickup.

Goal 62 moves the MVP closer to that end-to-end operating loop without crossing
the unsafe boundary into file uploads, public publishing, or live integrations.
