# Goal 77: Write Sequence Planner

## Purpose

Goal 77 adds `/admin/write-sequence`, a staff-only control-room surface for the
Rush Month write promotion order.

The project now has local-only write coverage for membership approval, leader
assignment creation, action start, proof metadata, leader proof decisions, HQ
proof decisions, and coach decisions. Goal 77 is now being used as the
review-facing subset planner for those implemented Phase 2 writes while later
gates such as private uploads, points/KPI materialization, and SLT checklist
completion remain separate.

## What It Adds

- `getWriteSequencePlanner(...)` in `src/services/write-sequence-planner.ts`
- `WriteSequencePlannerPanel` in `src/components/write-sequence-planner-panel.tsx`
- `/admin/write-sequence`
- route metadata, route registry, navigation, smoke-manifest, stakeholder review,
  MVP progress, and release-readiness updates
- tests for admin visibility, DS Admin safety review, hidden operating roles,
  student journey order, technical promotion order, and zero external sends

## Student Journey Versus Promotion Order

The review journey is:

1. chapter membership is approved
2. leader assigns action
3. member starts action
4. member submits proof/testimonial metadata
5. leader reviews proof for chapter completion
6. HQ decides whether proof can be shared
7. coach logs advance / hold / intervene decision

Within the currently implemented subset, the safe promotion order is:

1. `membership_approved`
2. `action_assigned`
3. `action_started`
4. `evidence_submitted`
5. `leader_proof_decision_logged`
6. `hq_sharing_decision_logged`
7. `coach_decision_logged`

This subset intentionally does not claim that proof upload, points/KPI
materialization, or SLT checklist completion are ready. Those remain separate
later Phase 2 gates.

## Safety Boundary

This goal does not:

- enable production Supabase Auth
- enable production Supabase writes
- enable broad browser writes
- upload files
- publish proof
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes
- make DS Admin an owner of student/chapter truth

Every operation in the planner keeps external sends at zero and names the
expected tables, structured events, audit evidence, and disabled outbox posture.

## Next Review Step

Open `/chapter/members` first and review the membership approval packet. After
membership readback, audit evidence, and disabled outbox posture are proven,
use `/admin/write-sequence` to walk through the next local write packets in
order.
