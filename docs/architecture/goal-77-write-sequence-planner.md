# Goal 77: Write Sequence Planner

## Purpose

Goal 77 adds `/admin/write-sequence`, a staff-only control-room surface for the
Rush Month write promotion order.

The project already has local-only server action patterns for action start,
proof metadata, HQ proof decisions, leader assignment creation, and coach
decisions. Goal 76 made the first action-start write operator-ready. Goal 77
shows how the rest of the operating-loop writes should be promoted safely after
that first write is proven.

## What It Adds

- `getWriteSequencePlanner(...)` in `src/services/write-sequence-planner.ts`
- `WriteSequencePlannerPanel` in `src/components/write-sequence-planner-panel.tsx`
- `/admin/write-sequence`
- route metadata, route registry, navigation, smoke-manifest, stakeholder review,
  MVP progress, and release-readiness updates
- tests for admin visibility, DS Admin safety review, hidden operating roles,
  student journey order, technical promotion order, and zero external sends

## Student Journey Versus Promotion Order

The real student journey is:

1. leader assigns action
2. member starts action
3. member submits proof/testimonial metadata
4. HQ decides whether proof can be shared
5. coach logs advance / hold / intervene decision

The safe technical promotion order starts with `action_started` because fake
seed assignments already exist. That lets staff prove one small, useful
browser-to-Supabase write before enabling broader leader/admin/coach mutation
paths.

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

Run `/admin/first-write` first. After action-start readback evidence is proven,
open `/admin/write-sequence` to choose the next local write promotion packet.
