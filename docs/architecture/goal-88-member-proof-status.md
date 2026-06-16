# Goal 88: Member Proof Status

## Purpose

Goal 88 makes `/rush-month/evidence` easier for students and reviewers to
understand. The page already listed mock proof/testimonial rows, but it did not
plainly answer what happens after a student prepares or submits proof.

This goal adds a compact proof status summary that explains:

1. which visible actions still need proof
2. which proof is waiting for HQ review
3. which proof needs more context
4. which proof is approved for internal learning
5. why public publishing and external exports are still disabled

## What It Adds

- A typed proof status service derived from existing assignments and evidence
  rows.
- A mobile-first proof status panel on `/rush-month/evidence`.
- Tests for member, leader, coach, admin, approved-proof, and DS Admin
  boundaries.
- README and AGENTS guardrail updates.

## Role Behavior

- Member: sees a simple "what is happening with my proof?" summary for visible
  member actions.
- Chapter Leader / Action Committee Chair: sees follow-up states across visible
  member and leader work.
- Coach: can read proof status as a chapter-health signal.
- Admin / Super Admin: can inspect local proof status without publishing.
- DS Admin: cannot read student proof status or testimonial truth.

## Future Structured Records

The status panel names future records the real app should eventually create:

- `evidence_submitted`
- `proof_status_viewed`
- `hq_proof_review_requested`
- `evidence_changes_requested`
- `evidence_approved_for_internal_learning`
- `automation_outbox_recorded`
- `audit_log_recorded`

## Safety Boundary

This goal does not:

- save proof
- upload files
- publish proof publicly
- create real proof status rows
- export proof to a warehouse or reporting tool
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- change production Supabase, auth, RLS, or storage settings

All behavior remains local/read-only/mock-safe.

## Next Step

The next useful slice is to give chapter leaders a clearer evidence follow-up
board that separates member proof follow-up from HQ broad-sharing decisions.
