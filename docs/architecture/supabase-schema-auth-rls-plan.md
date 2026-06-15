# Supabase Schema, Auth, And RLS Design Plan

Planning status: Goal 4 architecture document only. Do not wire the app to
Supabase, apply migrations, create real users, or enable external writes from
this goal.

Recommended model for this plan: GPT-5.5 Thinking or the strongest available
reasoning model.

Reason: this plan affects database shape, auth, role boundaries, RLS policies,
audit behavior, and future integration safety.

## Product Boundary

Supabase should become the myMEDLIFE app source of truth for:

- identity profile data linked to Supabase Auth
- chapter membership truth
- role approvals
- campaign status
- assignment truth
- evidence and proof review
- points ledger truth
- KPI ledger truth
- internal events
- integration intent and outbox records
- audit logs

n8n should remain an external orchestration layer. It can later consume approved
outbox rows, but it should not own permissions, membership truth, assignments,
proof decisions, points, KPIs, or the student-facing experience.

## Auth Model

Use Supabase Auth for identity. The app should not store passwords or auth
secrets in app tables.

Recommended approach:

- `auth.users` owns sign-in identity.
- `profiles.id` references `auth.users.id`.
- `profiles` stores app-facing name, email copy, status, and timestamps.
- Chapter access comes from approved membership rows, not from hard-coded client
  role flags.
- JWT claims may later cache high-level role hints for performance, but database
  membership rows remain the source of truth.
- All sensitive writes should be server-side or protected by explicit RLS
  policies.

## Role Keys

Use stable database keys even when UI labels change.

| Key | UI label | Scope |
| --- | --- | --- |
| `general_member` | General Member | Chapter |
| `action_committee_member` | Action Committee Member | Chapter |
| `action_committee_chair` | Action Committee Chair | Chapter |
| `e_board_member` | E-Board Member | Chapter |
| `president_vp` | President / VP | Chapter |
| `coach` | Coach | Chapter portfolio |
| `admin` | Admin | Platform or assigned admin scope |
| `super_admin` | Super Admin | Platform |

## Core Table Plan

All app tables should include `created_at` and `updated_at` unless they are
strict append-only ledgers. Append-only ledgers should include `created_at` and
avoid update/delete from normal app roles.

### `profiles`

App-facing profile for a Supabase Auth user.

Key fields:

- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `email text not null`
- `status profile_status not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `chapters`

University or school chapter.

Key fields:

- `id uuid primary key`
- `name text not null`
- `campus text not null`
- `region text`
- `status chapter_status not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `roles`

Static role lookup table.

Key fields:

- `key text primary key`
- `label text not null`
- `chapter_scoped boolean not null`
- `sort_order integer not null`

### `memberships`

Approved or requested role relationship between a profile and a chapter.

Recommendation: store one role per membership row, not an array of roles. This
makes RLS easier to inspect and test.

Key fields:

- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `chapter_id uuid not null references chapters(id)`
- `role_key text not null references roles(key)`
- `status membership_status not null`
- `requested_at timestamptz`
- `approved_at timestamptz`
- `approved_by uuid references profiles(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique constraint on `user_id`, `chapter_id`, `role_key`

Coach portfolio access should be represented by approved `coach` membership
rows for each chapter in the coach's portfolio.

### `campaigns`

Operating campaign such as Rush Month.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `name text not null`
- `slug text not null`
- `objective text not null`
- `status campaign_status not null`
- `opened_by uuid references profiles(id)`
- `opened_at timestamptz`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `phases`

Campaign week or stage.

Key fields:

- `id uuid primary key`
- `campaign_id uuid not null references campaigns(id)`
- `title text not null`
- `objective text not null`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `status phase_status not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `action_templates`

Reusable action definition from a campaign SOP.

Key fields:

- `id uuid primary key`
- `campaign_id uuid not null references campaigns(id)`
- `title text not null`
- `instructions text not null`
- `default_owner_role_key text references roles(key)`
- `evidence_required text not null`
- `points integer not null`
- `kpi_key text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `assignments`

Concrete action assigned to a user or role inside a chapter.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid not null references campaigns(id)`
- `phase_id uuid references phases(id)`
- `action_template_id uuid references action_templates(id)`
- `title text not null`
- `instructions text not null`
- `assigned_to_user_id uuid references profiles(id)`
- `assigned_to_role_key text references roles(key)`
- `assigned_by_user_id uuid references profiles(id)`
- `status assignment_status not null`
- `due_at timestamptz`
- `evidence_required text not null`
- `points integer not null`
- `kpi_key text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

At least one of `assigned_to_user_id` or `assigned_to_role_key` should be set.

### `evidence_items`

Proof submitted for an assignment.

Key fields:

- `id uuid primary key`
- `assignment_id uuid not null references assignments(id)`
- `chapter_id uuid not null references chapters(id)`
- `submitted_by_user_id uuid not null references profiles(id)`
- `evidence_type evidence_type not null`
- `summary text not null`
- `url text`
- `storage_path text`
- `status evidence_status not null`
- `submitted_at timestamptz not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `approvals`

Review decision for evidence.

Key fields:

- `id uuid primary key`
- `evidence_item_id uuid not null references evidence_items(id)`
- `chapter_id uuid not null references chapters(id)`
- `reviewer_user_id uuid not null references profiles(id)`
- `decision approval_decision not null`
- `note text not null`
- `reviewed_at timestamptz not null`
- `created_at timestamptz not null`

### `points_events`

Append-only points ledger.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `assignment_id uuid references assignments(id)`
- `evidence_item_id uuid references evidence_items(id)`
- `approval_id uuid references approvals(id)`
- `awarded_to_user_id uuid not null references profiles(id)`
- `points_delta integer not null`
- `reason text not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null`

### `kpi_events`

Append-only KPI ledger.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `phase_id uuid references phases(id)`
- `assignment_id uuid references assignments(id)`
- `evidence_item_id uuid references evidence_items(id)`
- `metric_key text not null`
- `metric_value numeric not null`
- `unit text`
- `source text not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null`

### `events`

Structured internal event stream for meaningful app actions.

Key fields:

- `id uuid primary key`
- `event_type text not null`
- `actor_user_id uuid references profiles(id)`
- `chapter_id uuid references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `assignment_id uuid references assignments(id)`
- `payload jsonb not null`
- `correlation_id text`
- `occurred_at timestamptz not null`
- `created_at timestamptz not null`

Example event types:

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

### `luma_event_links`

Mock-safe or future real Luma event relationship.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `phase_id uuid references phases(id)`
- `luma_event_id text`
- `luma_event_url text`
- `status external_sync_status not null`
- `linked_by uuid references profiles(id)`
- `linked_at timestamptz`
- `last_imported_at timestamptz`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `integration_events`

Records intended or mocked external integration activity.

Key fields:

- `id uuid primary key`
- `source_event_id uuid references events(id)`
- `chapter_id uuid references chapters(id)`
- `event_type text not null`
- `destination integration_destination not null`
- `external_object_type text`
- `external_object_id text`
- `status integration_status not null`
- `payload jsonb not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

An integration event does not mean a real external write happened. Real writes
remain disabled until explicitly approved.

### `automation_outbox`

Work record for future n8n or external orchestration.

Key fields:

- `id uuid primary key`
- `source_event_id uuid references events(id)`
- `integration_event_id uuid references integration_events(id)`
- `chapter_id uuid references chapters(id)`
- `destination integration_destination not null`
- `event_type text not null`
- `payload jsonb not null`
- `idempotency_key text not null unique`
- `status outbox_status not null`
- `attempt_count integer not null default 0`
- `available_at timestamptz not null`
- `locked_at timestamptz`
- `sent_at timestamptz`
- `last_error text`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Goal 4 and Rush Month MVP should only create recorded or mocked outbox rows.
`approved_for_live_send` and `sent` require later explicit approval.

### `audit_logs`

Append-only log for sensitive changes.

Key fields:

- `id uuid primary key`
- `actor_user_id uuid references profiles(id)`
- `chapter_id uuid references chapters(id)`
- `action text not null`
- `target_table text not null`
- `target_id uuid`
- `before_value jsonb`
- `after_value jsonb`
- `reason text`
- `created_at timestamptz not null`

## RLS Strategy

Use default-deny RLS.

Principles:

- Enable RLS on every app table.
- Prefer simple, inspectable policies.
- Use small `security definer` helper functions only for repeated role checks.
- Keep helper functions readable and covered by future SQL tests.
- Keep admin and super-admin writes audited.
- Never rely on client-only route guards for data protection.

Recommended helper functions:

- `app.current_user_id()`
- `app.has_chapter_role(chapter_uuid uuid, role_keys text[])`
- `app.is_chapter_member(chapter_uuid uuid)`
- `app.is_chapter_leader(chapter_uuid uuid)`
- `app.is_coach_for_chapter(chapter_uuid uuid)`
- `app.is_admin()`
- `app.is_super_admin()`

## Permission Plan By Role

### General Member

Can read:

- own profile
- own approved/requested memberships
- chapter basics for approved chapters
- Rush Month campaigns, phases, and assignments visible to general members
- own evidence submissions
- own points and KPI impact summaries
- non-sensitive integration status summaries for own chapter

Can create:

- own chapter join requests
- evidence for assignments visible to them
- internal app events for their actions

Can update:

- own profile
- own pending evidence before review, if the app supports edits

Can never access:

- coach-only dashboards
- other members' private proof by default
- admin settings
- role approval controls
- raw automation payloads

### Action Committee Member

Can read:

- everything a General Member can read
- committee assignments for their chapter and role
- status for committee actions they own

Can create:

- evidence for committee assignments they own
- internal action-started and evidence-submitted events

Can update:

- own pending committee evidence before review

Can never access:

- platform admin settings
- unrelated member private proof
- final role approval controls

### Action Committee Chair

Can read:

- committee-lane assignments in their chapter
- submitted evidence for committee actions
- committee progress summaries

Can create:

- committee assignment drafts or requests if enabled by chapter leadership
- internal events for coordination activity

Can update:

- committee action status where assigned
- review notes only if chapter leadership grants review authority

Can never access:

- platform admin settings
- unrelated chapters
- super-admin controls

Open question: confirm whether Action Committee Chairs can approve evidence or
only prepare proof for President/VP review.

### E-Board Member

Can read:

- chapter campaign progress
- leadership assignments in their chapter
- evidence queues assigned to E-Board review

Can create:

- assignments inside approved chapter campaigns if chapter policy allows
- evidence review events when granted review authority

Can update:

- assignments they own or manage
- evidence review decisions when granted review authority

Can never access:

- platform integration settings
- unrelated chapters
- super-admin controls

### President / VP

Can read:

- all chapter campaign, assignment, evidence, points, KPI, and event summaries
  for their chapter
- chapter membership requests
- coach-readable chapter state

Can create:

- chapter campaigns
- phases and assignments from approved templates
- evidence review decisions
- role approvals for chapter-scoped roles
- chapter-scoped events and outbox records

Can update:

- chapter campaign status
- chapter assignments
- membership status for chapter-scoped roles
- evidence decisions and review notes

Can never access:

- platform-wide admin settings
- unrelated chapters
- super-admin emergency overrides

### Coach

Can read:

- assigned portfolio chapters represented by approved `coach` membership rows
- campaign status, assignments, proof readiness, overdue work, KPI movement, and
  risk signals for portfolio chapters
- integration status summaries for portfolio chapters

Can create:

- coach decision events such as `coach_decision_logged`
- intervention notes if product scope approves

Can update:

- coach review state or decision logs, not student membership truth

Can never access:

- chapters outside their portfolio
- platform admin settings
- super-admin controls
- private user data unrelated to coaching context

### Admin

Can read:

- operational data needed for support within assigned admin scope
- integration and outbox summaries needed for troubleshooting

Can create:

- configuration records where explicitly allowed
- audited support events

Can update:

- support-safe records within assigned admin scope

Can never access:

- super-admin-only integration approvals
- emergency override powers unless separately granted
- secrets or service role credentials

### Super Admin

Can read:

- all app data needed for platform administration

Can create/update:

- platform roles and configuration
- integration approval settings
- emergency overrides
- audited administrative changes

Can never access:

- Supabase service role secrets through app tables
- anything outside applicable legal and privacy boundaries

## Table Access Summary

| Table | Read | Create | Update | Delete |
| --- | --- | --- | --- | --- |
| `profiles` | self, chapter leaders for chapter members, coach portfolio summaries, admin | self profile bootstrap | self profile, admin support | super admin only if ever allowed |
| `chapters` | approved members, coach portfolio, admin | admin/super admin | president/vp for limited chapter fields, admin | super admin only |
| `roles` | authenticated users | super admin | super admin | super admin |
| `memberships` | self, chapter leaders, coach portfolio summary, admin | self join request, chapter leader invite | president/vp/admin approvals | super admin only |
| `campaigns` | chapter members, coach portfolio, admin | president/vp, admin | president/vp, admin | super admin only |
| `phases` | chapter members, coach portfolio, admin | president/vp, admin | president/vp, admin | super admin only |
| `action_templates` | chapter leaders, coach portfolio, admin | admin or president/vp from approved SOP | admin or president/vp | super admin only |
| `assignments` | assigned users/roles, chapter leaders, coach portfolio, admin | chapter leaders | chapter leaders, assigned owner for status only | super admin only |
| `evidence_items` | submitter, chapter reviewers, coach portfolio, admin | assigned user | submitter before review, reviewers for status | super admin only |
| `approvals` | submitter, reviewers, chapter leaders, coach portfolio, admin | authorized reviewers | no normal update after create | super admin only |
| `points_events` | user, chapter leaders, coach portfolio, admin | review flow/system | append-only | super admin correction event preferred |
| `kpi_events` | chapter members for summaries, coach portfolio, admin | review flow/system | append-only | super admin correction event preferred |
| `events` | actor, chapter leaders, coach portfolio, admin | app flows/system | append-only | super admin only |
| `luma_event_links` | chapter leaders, coach portfolio, admin | chapter leaders/admin mocked | chapter leaders/admin mocked | super admin only |
| `integration_events` | chapter leaders, coach portfolio, admin | app flows/system | status updates by admin/system | super admin only |
| `automation_outbox` | chapter leaders summary, coach summary, admin detail | app flows/system | admin/system status only | super admin only |
| `audit_logs` | admin/super admin, limited self/chapter views if needed | system/admin | append-only | never through app |

## Chapter-Scoped Rules

Most rows should include `chapter_id` directly. This keeps RLS policies
straightforward and avoids expensive joins through campaigns or assignments for
every access check.

Rules:

- A user can read chapter-scoped rows only when they have an approved membership
  for that chapter, an approved coach portfolio role for that chapter, or an
  admin/super-admin role.
- Chapter leader writes require approved `president_vp`, `e_board_member`, or
  explicitly approved `action_committee_chair` roles depending on the table.
- Members can only create evidence for assignments visible to their approved
  role or assigned directly to their user.
- Cross-chapter reads are denied by default.

## Coach Portfolio Rules

For MVP, represent coach portfolio access with approved `coach` membership rows.

Rules:

- A coach can read operational state for chapters where they hold an approved
  `coach` membership row.
- A coach can create coach decision logs for those chapters.
- A coach cannot approve student membership truth unless a later role explicitly
  grants that ability.
- A coach cannot see chapters outside their portfolio.

## Admin Rules

Admin roles need extra care because broad access can become invisible.

Rules:

- `admin` should be used for support operations, not unchecked global power.
- `super_admin` should be reserved for platform settings, integration approvals,
  emergency overrides, and global administration.
- All admin and super-admin writes should produce audit logs.
- Service role access should stay server-only and never appear in client code.

## Audit Logging Requirements

Audit logs are required for:

- membership approvals and rejections
- role changes
- campaign open/close decisions
- assignment creation or reassignment
- evidence approvals, rejections, and change requests
- points awards or corrections
- KPI event corrections
- integration status changes
- outbox approval for any real external send
- admin and super-admin configuration changes
- emergency overrides

Audit logs should include actor, target, before/after values when useful, reason,
and timestamp. They should be append-only for normal app roles.

## TypeScript Mapping Notes

Current mock types are intentionally smaller than the database plan.

Recommended changes before Goal 5 implementation:

- Change `Membership.roles: ChapterRole[]` into either database-shaped one-role
  rows or add a separate app view model that groups membership roles for UI.
- Add stable role keys to TypeScript instead of relying only on display labels.
- Add `chapterId`, `campaignId`, `phaseId`, `assignedToUserId`,
  `assignedToRoleKey`, and `assignedByUserId` to `Assignment` persistence types.
- Add `submittedByUserId`, `url`, `storagePath`, and `submittedAt` to
  `EvidenceItem` persistence types.
- Add `reviewerUserId` and `reviewedAt` to `Approval` persistence types.
- Expand `PointsEvent` to include chapter, campaign, evidence, approval, actor,
  and signed point delta fields.
- Expand `KPIEvent` to include chapter, campaign, phase, metric key, value,
  unit, source, and actor fields.
- Add a first-class `Event` TypeScript type. Goal 3 has `IntegrationEvent` and
  `AutomationOutbox`, but not the internal event stream type.
- Expand `IntegrationEvent` and `AutomationOutbox` to use JSON payloads,
  idempotency keys, retry fields, and safe status transitions.
- Expand `AuditLog` to include chapter, target table, before/after JSON, reason,
  and timestamp.

Keep a separation between persistence types and UI view models. The UI may still
want grouped roles, friendly due labels, and display names.

## Draft Migration

A draft-only SQL sketch lives at:

- `docs/architecture/drafts/0001_supabase_schema_draft.sql`

It is intentionally not placed in `supabase/migrations`. It must not be applied
to any live Supabase project until Nick approves Goal 5 and the team reviews the
schema/RLS plan.

## Future RLS Test Plan

The future RLS test plan lives at:

- `docs/testing/rls-test-plan.md`

Goal 4 does not implement live RLS tests because no Supabase project is wired
yet.

## Open Questions

1. Should Action Committee Chairs be allowed to approve evidence, or only
   prepare proof for President/VP review?
2. Should E-Board review powers be automatic, or granted per campaign/phase?
3. Should coach portfolio access be stored only as `coach` membership rows, or
   should Goal 5 add a dedicated `coach_chapter_assignments` table?
4. Should General Members see chapter-level aggregate points/KPI summaries, or
   only their own contribution and public recognition?
5. What is the minimum audit detail MEDLIFE wants for student privacy while
   keeping operational accountability?
6. Who is allowed to approve an outbox row for real external sending after the
   mock-only phase ends?

## Goal 4 Assumptions

- The repo remains on the Next.js, TypeScript, Tailwind, Supabase, and Vercel
  path unless Nick/team intentionally choose a stack change.
- Supabase Auth will be used for sign-in, but no live auth is wired in Goal 4.
- The first live implementation should prioritize Rush Month and avoid
  all-campaign generalization.
- Draft SQL is review material, not an applied migration.
- External writes remain disabled until explicitly approved.
