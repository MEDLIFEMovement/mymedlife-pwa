# Goal 16 HQ Proof Sharing Decision

Status: local Supabase implementation only.

Goal 16 adds the first local HQ proof/testimonial sharing decision write path:
`app.record_hq_proof_sharing_decision(...)`.

This does not wire browser review controls to save decisions. It does not
publish proof publicly, upload files, connect production Supabase, enable live
auth, or send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes.

## What The Function Does

When an allowed HQ actor records a sharing decision, the function writes one
transactional bundle:

1. Update the `evidence_items` review and sharing status.
2. Create one `approvals` row for the HQ content-sharing decision.
3. Create one structured internal `events` row.
4. Create one `integration_events` row with destination `internal` and status
   `recorded`.
5. Create one `automation_outbox` row with status `disabled`.
6. Create one `audit_logs` row.

If any step fails, the transaction rolls back.

## Decision Meanings

- `approved_for_sharing`: HQ thinks the proof can become a reusable example for
  other chapters or universities later.
- `not_shared`: HQ accepts the proof internally, but does not want to share it
  broadly.
- `changes_requested`: HQ needs more context, consent, quality, or detail before
  making a final sharing decision.

## Who Can Record Decisions Locally

Allowed:

- Admin
- Super Admin

Blocked:

- General Member
- Chapter Leader / E-Board
- Coach
- DS Admin

Reason: proof is student/chapter-generated, but MEDLIFE HQ owns broad sharing
decisions. DS Admin can support integration/outbox operations later, but should
not own content truth.

## Why Direct Inserts Are Blocked

Direct `approvals` inserts can create HQ decisions without evidence status,
events, disabled outbox intent, or audit logs. Goal 16 replaces direct approval
inserts with a function-only path so the full decision record stays together.

Goal 16 also tightens direct evidence updates so DS Admin cannot directly change
proof sharing status.

## What Stays Disabled

- browser save controls
- production auth
- production Supabase
- file uploads and storage writes
- public proof sharing or publishing
- real HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

## Tests

The RLS/security coverage lives in:

- `supabase/tests/database/rls_goal_16.test.sql`

The tests prove:

- General Members, Chapter Leaders, Coaches, and DS Admins cannot record HQ
  sharing decisions
- Chapter Leaders and Admins cannot bypass the function with direct approval
  inserts
- DS Admin cannot directly update proof sharing status
- Admin can record approved-for-sharing, not-shared, and changes-requested
  decisions through the function
- Super Admin can record an HQ sharing decision
- final sharing decisions cannot be silently overwritten
- short decision notes are rejected
- HQ decisions create approval, event, integration event, disabled outbox, and
  audit log rows
- no outbox row is approved for live send or sent

## Next Step

Goal 17 should plan the proof/video storage layer without enabling uploads yet:

- storage bucket strategy
- file metadata fields
- consent and reuse requirements
- upload permissions
- virus/scanning or moderation assumptions
- no public publishing until explicitly approved
