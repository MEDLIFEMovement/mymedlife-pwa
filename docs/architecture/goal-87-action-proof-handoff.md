# Goal 87: Action Proof Handoff

## Purpose

Goal 87 makes the member action detail page clearer after the event-to-proof
bridge. `/rush-month/actions/[assignmentId]` already had proof preview and
write-gate panels, but the student-facing proof step was buried under technical
readiness details.

This goal adds a small handoff layer that answers:

1. what should I prepare after this action?
2. what makes the proof/testimonial useful?
3. who can submit or inspect it?
4. what future event/outbox/audit records would be created?
5. what remains disabled?

## What It Adds

- A typed action proof handoff service.
- A role-aware proof handoff panel on the action detail page.
- Tests for member, action committee chair, coach, leader, admin, and DS Admin
  behavior.
- README and AGENTS guardrail updates.

## Role Behavior

- Member: prepare a testimonial, link, note, or bridge-video context.
- Action Committee Member / Chair: capture the story while the event/action is
  fresh and make sure it answers a student hesitation.
- Chapter Leader: connect submitted proof to HQ review posture.
- Coach: read the handoff as a chapter health signal, not as a proof owner.
- Admin / Super Admin: inspect proof posture without publishing proof.
- DS Admin: cannot read student proof truth from this handoff.

## Future Structured Records

The handoff names the future records the real app should eventually create:

- `proof_handoff_opened`
- `evidence_submitted`
- `proof_consent_recorded`
- `hq_proof_review_requested`
- `automation_outbox_recorded`
- `audit_log_recorded`

## Safety Boundary

This goal does not:

- save proof from the handoff panel
- upload files
- publish proof publicly
- create real event, evidence, outbox, or audit rows
- trigger HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- change production Supabase, auth, RLS, or storage settings

All behavior remains local/read-only/mock-safe.

## Next Step

The next useful slice is to add a compact member-facing "after I submit proof"
review/status summary so students can understand pending HQ review, changes
requested, and approved/internal-only states without opening admin-oriented
screens.
