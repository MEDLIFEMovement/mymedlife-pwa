# Foundation And Rush Month MVP Plan

Recommended model for this architecture plan: GPT-5.5 Thinking.

Reason: the plan touches stack choice, domain model, role boundaries,
event/outbox architecture, integration contracts, and future security posture.
Use this document as a foundation recommendation. Before implementing schema,
RLS, integration contracts, or AI/event design, Nick should switch to GPT-5.5
Thinking or the strongest available reasoning model for a review pass.

## Stack Recommendation

Recommend keeping this repo on:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel
- GitHub PR workflow
- Linear issue tracking

Do not silently mix in Kiomi's default Vite/TanStack/Hono/Cloudflare stack. If
the team decides Kiomi's stack should win, switch the repo intentionally before
building more business logic.

## Repo Foundation

The repo currently contains a minimal Next.js app with a prototype Rush Month
screen. Treat that screen as a mock UI shell only.

Before implementation continues, split real code into predictable layers:

- `src/components`: reusable UI components
- `src/features`: feature-specific UI and small client logic
- `src/services`: business logic such as assignment review and point awards
- `src/lib`: app utilities and configuration helpers
- `src/shared/types`: shared TypeScript domain types
- `src/shared/schemas`: validation schemas
- `tests`: important service and permission tests

## Core Domain Model

This is a planning model, not a final database migration.

### User

Represents a person who can sign in. Supabase Auth should own identity. The app
profile should store display name, contact preferences, and status.

### Chapter

Represents a university or school chapter. Most data is chapter-scoped.

### Membership

Joins a `User` to a `Chapter`. Stores membership status, approved roles, join
request state, and role approval metadata.

### Role

Defines app permissions such as General Member, Action Committee Member, Action
Committee Chair, E-Board Member, President/VP, Coach, Admin, and Super Admin.

### Campaign

Represents an operating campaign such as Rush Month, SLT Promotion, or Chapter
Engagement.

### Phase

Represents a campaign stage or week, including objective, start date, end date,
and status.

### ActionTemplate

Defines reusable campaign actions from SOPs: title, instructions, default role,
proof requirement, KPI target, and point value.

### Assignment

Represents a concrete action assigned to a person or role inside a chapter. It
stores owner, due date, status, proof requirement, and linked campaign/phase.

### EvidenceItem

Represents proof submitted for an assignment. MVP evidence can be text, a link,
or a mock file reference. Public promotion is out of scope.

### Approval

Represents a review decision for evidence: approved, rejected, or changes
requested. Stores reviewer, decision, reason, and timestamp.

### PointsEvent

Append-only ledger entry for points awarded or adjusted. Points should not be a
mutable counter without event history.

### KPIEvent

Append-only ledger entry for KPI movement such as invites sent, attendees, proof
approved, or campaign milestone completed.

### Event

Structured internal product event for meaningful app actions. This is the base
audit-friendly event stream.

### LumaEventLink

Stores mock-safe or future real Luma event identifiers, URLs, and attendance
import status for a chapter/campaign/phase.

### IntegrationEvent

Records an intended or mocked external integration event, such as a HubSpot
handoff or Luma attendance import. It should never imply a real external write
unless explicitly marked and approved.

### ExternalSyncStatus

Tracks the latest known sync posture for an external system and object, such as
Luma event linked, HubSpot handoff mocked, warehouse export pending, or n8n
disabled. This should summarize status only; the event log and outbox remain the
audit trail.

### AutomationOutbox

Records external work to be picked up later by n8n or another orchestrator. It
should include event type, payload, status, idempotency key, retry count, and
error detail.

### AuditLog

Records sensitive or administrative changes such as role approval, permission
changes, review decisions, and emergency overrides.

## Role And Permission Boundaries

Permissions are chapter-scoped by default.

### General Member

Can see own chapter, own assigned actions, own proof submissions, own points,
and approved recognition. Cannot see coach-only, admin-only, or other members'
private proof by default.

### Action Committee Member

Can own assigned campaign actions and submit proof. May see committee-level
actions where assigned by chapter leadership.

### Action Committee Chair

Can coordinate committee actions, view assigned committee progress, and prepare
proof packs. Can request updates from members but should not receive platform
admin power.

### E-Board Member

Can receive and manage leadership assignments, view relevant campaign progress,
and help review evidence when granted by chapter leadership.

### President/VP

Can open chapter campaigns, assign chapter actions, review proof, approve or
request changes, and view chapter progress, points, KPIs, and coach-ready state.

### Coach

Can see assigned chapter portfolio data, proof readiness, overdue work, KPI
movement, risk signals, and advance/hold/intervene recommendations. Coaches do
not own student membership truth.

### Admin

Can support configuration and operations within assigned admin scope. Admin does
not automatically receive Super Admin powers.

### Super Admin

Owns platform settings, integration settings, emergency overrides, and global
administration.

## Rush Month MVP Flow

### Chapter Leader Flow

1. Leader signs in.
2. Leader opens their chapter home.
3. Leader opens Rush Month.
4. Leader sees the current objective and this week's operating path.
5. Leader assigns role-based actions to E-Board members, Action Committee
   chairs, and general members.
6. Leader sees completion status by owner, due date, proof requirement, and KPI.
7. Leader reviews submitted evidence.
8. Leader approves, rejects, or requests changes.
9. Approved evidence creates points and KPI events.
10. Leader sees a coach-readable state: advance, hold, or intervene.

### General Member Flow

1. Member signs in.
2. Member sees their chapter and assigned actions.
3. Member understands exactly what to do next.
4. Member submits required proof or evidence.
5. Member sees review status.
6. Member sees points or recognition tied to meaningful action.

### Coach Flow

1. Coach signs in.
2. Coach sees assigned chapters.
3. Coach opens Rush Month progress for a chapter.
4. Coach sees overdue actions, proof pending, KPI movement, and risk signals.
5. Coach sees integration handoff status without triggering external writes.
6. Coach logs or confirms advance, hold, or intervene.

## Event Log And Outbox

The app must run end-to-end without n8n.

Every meaningful action should create a structured event. Examples:

- `user_signed_in`
- `chapter_join_requested`
- `role_approved`
- `campaign_opened`
- `action_assigned`
- `action_started`
- `evidence_submitted`
- `evidence_approved`
- `evidence_rejected`
- `points_awarded`
- `kpi_event_recorded`
- `luma_event_linked`
- `luma_attendance_import_mocked`
- `hubspot_handoff_mocked`
- `coach_decision_logged`
- `phase_completed`

Recommended event fields:

- `id`
- `event_type`
- `actor_user_id`
- `chapter_id`
- `campaign_id`
- `assignment_id`
- `payload`
- `occurred_at`
- `correlation_id`

Recommended outbox fields:

- `id`
- `source_event_id`
- `destination`
- `event_type`
- `payload`
- `idempotency_key`
- `status`
- `attempt_count`
- `available_at`
- `last_error`
- `created_at`
- `updated_at`

Outbox statuses:

- `recorded`
- `approved_for_mock`
- `mocked`
- `approved_for_live_send`
- `sent`
- `failed`
- `dead_lettered`

Rush Month MVP should record what needs to happen externally, but real external
writes stay disabled until explicitly approved.

## Integration Responsibilities

myMEDLIFE/Supabase owns:

- user permissions
- chapter membership truth
- role approvals
- assignment truth
- evidence/proof approval
- points ledger truth
- KPI truth
- campaign status truth
- student-facing UX

n8n later owns:

- HubSpot syncs
- Luma event creation and check-in imports
- reminder emails or texts
- coach escalation packets
- Power BI or warehouse exports
- AI-generated summaries
- retry/failure handling
- daily/weekly automation jobs

HubSpot later owns CRM and lifecycle context. Luma later owns event registration,
RSVP, QR/check-in, and attendance source data. Warehouse and Power BI later own
cross-system analytics and staff reporting.

## Next Build Cycle Task List

1. MED-412: Finish repo lane polish, README links, and PR workflow.
2. MED-413: Use GPT-5.5 Thinking to review the schema/RLS plan before migrations.
3. Create shared TypeScript domain types and validation schemas from this plan.
4. Add Supabase client config with documented environment variables, no live
   secrets.
5. Build role-aware mock routing for member, leader, coach, admin, and super
   admin surfaces.
6. Seed Rush Month campaign, phases, action templates, and assignment fixtures.
7. Build assignment creation/update service with structured event logging.
8. Build member action dashboard using mock-safe data.
9. Build evidence submission and review service with approval events.
10. Build points and KPI ledger stubs from approved evidence events.
11. Build integration event/outbox mock surfaces for Luma, HubSpot, warehouse,
    Power BI, and n8n.
12. Create the Discourse vs PWA Rush Month bake-off test script.

## Open Questions For Nick/Team

- Confirm final repo name: keep `MEDLIFEMovement/mymedlife-pwa` or rename to
  `MEDLIFEMovement/my-medlife-pwa`.
- Confirm the final stack choice before deeper business logic: stay with
  Next.js/Supabase/Vercel or switch to Kiomi's Vite/TanStack/Hono/Cloudflare
  standard.
- Confirm the first pilot chapter and whether demo data should use real chapter
  names or anonymized fixtures.
- Confirm which roles can review evidence in Rush Month MVP: President/VP only,
  E-Board plus President/VP, or Coach as a reviewer too.
- Confirm whether points are chapter-local, national, campaign-local, or all
  three.
- Confirm the minimum proof types for MVP: text, link, mock file, or Supabase
  Storage upload.
- Confirm the first n8n-readable event contract before any real automation work.

## Assumptions

- The dedicated custom PWA repo lane is now the source lane for myMEDLIFE.
- The existing Next.js scaffold is acceptable unless Nick/team explicitly choose
  Kiomi's alternate stack.
- Rush Month MVP should be mock-safe before live integrations.
- n8n should not be required for the Rush Month MVP.
- Supabase schema, RLS, and integration contracts need a stronger-model review
  before implementation.
