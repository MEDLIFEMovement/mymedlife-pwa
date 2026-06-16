# Goal 15 Proof Submission Write

Status: local Supabase implementation only.

Goal 15 adds the first local proof/testimonial metadata write path:
`app.submit_assignment_proof_metadata(...)`.

This does not wire the browser UI to save proof. It does not upload files,
publish proof publicly, connect production Supabase, enable live auth, or send
HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes.

## What The Function Does

When an allowed local actor submits proof metadata, the function writes one
transactional bundle:

1. Update the assignment status to `submitted`.
2. Create one `evidence_items` metadata row.
3. Create one structured internal `events` row.
4. Create one `integration_events` row with destination `internal` and status
   `recorded`.
5. Create one `automation_outbox` row with status `disabled`.
6. Create one `audit_logs` row.

If any step fails, the transaction rolls back.

## What Proof Means Here

Proof is testimonial material or experience evidence from a student/chapter
operator, such as:

- bridge video metadata
- testimonial text
- event photo/link metadata
- recap note
- external link metadata

Goal 15 stores metadata only. Storage uploads remain out of scope.

## Who Can Submit Proof Metadata Locally

Allowed:

- assigned member for their own in-progress assignment
- chapter leader for visible in-progress chapter work

Blocked:

- member from another chapter
- coach
- admin
- DS admin
- super admin through the normal proof-submission path
- any not-started, submitted, approved, canceled, or otherwise non-submittable
  assignment

## Why Direct Inserts Are Blocked

Direct `evidence_items` inserts can create proof rows without assignment status,
events, outbox, or audit logs. Goal 15 replaces the direct insert policy with a
function-only path so proof metadata, event history, disabled outbox intent, and
audit history stay together.

## What Stays Disabled

- browser save controls
- production auth
- production Supabase
- file uploads and storage writes
- public proof sharing
- HQ sharing decisions
- real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

## Tests

The RLS/security coverage lives in:

- `supabase/tests/database/rls_goal_15.test.sql`

The tests prove:

- direct evidence inserts are blocked
- assigned members can submit proof metadata through the function
- chapter leaders can submit proof metadata for visible chapter work
- cross-chapter proof submission is blocked
- coach, admin, DS admin, and super admin are blocked from the normal proof
  submission path
- short proof summaries are rejected
- not-started assignments cannot receive proof yet
- metadata submission creates evidence, event, integration event, disabled
  outbox, and audit log rows
- no file storage path is written
- no outbox row is approved or sent

## Next Step

Goal 16 should implement local HQ proof-sharing decisions with the same safety
pattern:

- one narrow database function
- RLS tests first
- Admin/Super Admin only
- no public publishing
- no warehouse or automation send
