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
- testimonial/proof submissions and HQ sharing decisions
- points ledger truth
- KPI ledger truth
- internal events
- integration intent and outbox records
- audit logs

n8n should remain an external orchestration layer. It can later consume approved
outbox rows, but it should not own permissions, membership truth, assignments,
testimonial sharing decisions, points, KPIs, or the student-facing experience.

## Clarified Operating Model

In myMEDLIFE, "proof" usually means a student testimonial, bridge video, link,
or short reflection submitted after a chapter activity. It is not primarily a
chapter-level evidence approval workflow.

Action Committees organize experiences such as Luma events, fundraisers, local
volunteering events, mobile clinic support, or other campaign actions. After the
experience, MEDLIFE may collect:

- Luma event or attendance context
- NPS or student feedback form results
- student testimonials, bridge videos, links, or other proof of experience

Chapter leaders and Action Committee leaders can submit and organize this
material. MEDLIFE HQ decides whether a testimonial/proof item should be shared
with other chapters, universities, or public online surfaces.

Proof should also be treated as a reusable belief-building library asset, not
only as evidence that an assignment happened. A useful proof item should help
answer a specific hesitation or internal question for a specific audience: Is
MEDLIFE legitimate? Is it ethical? Is it safe? Will I belong? Can I afford it?
Can I lead this? Will this help me become the kind of person I want to become?

This means proof records need enough metadata to be useful later across
campaigns, nurture, coaching, AI search, and approved automation:

- target audience, such as student, parent, advisor, alumni, chapter founder,
  chapter leader, or traveler
- proof category, such as trust, ethics, impact, safety, value, capability,
  belonging, fundraising/access, future/career, or identity
- messenger type, such as student, parent, coach, staff, physician, local
  partner, advisor, or alumni
- lifecycle stage or hesitation being answered
- format, source event, campaign, consent, and sharing status

The strongest proof is usually specific, human, and close to the experience:
raw bridge videos, student reflections, event photos, turnout context, quotes,
and measurable outcomes. The app should preserve that authenticity while still
giving HQ clear review, consent, and sharing controls.

The main operating loop should be event-centered:

1. A student or small group is assigned to plan a campus activity.
2. The activity belongs to an Action Committee such as recruiting, fundraising,
   local volunteering, social/community, or campaign support.
3. The students create or link the activity in Luma.
4. Members promote the activity online and on campus.
5. Students attend the activity.
6. MEDLIFE records attendance totals, participation rate, basic NPS/feedback,
   and testimonials or bridge videos.
7. MEDLIFE HQ decides which proof and learnings should be shared with other
   chapters or universities.
8. The warehouse later stores cross-chapter event performance so MEDLIFE can see
   what is working.

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
| `coach` | Coach | Staff role plus assigned chapter portfolio |
| `admin` | Admin | General MEDLIFE staff |
| `ds_admin` | DS Admin | Data systems and integration administration |
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

### `staff_role_assignments`

Platform or staff role assignment for MEDLIFE employees and trusted operators.
Use this for Coach, Admin, DS Admin, and Super Admin roles instead of forcing
platform roles into chapter memberships.

Key fields:

- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `role_key text not null references roles(key)`
- `status staff_role_status not null`
- `assigned_by uuid references profiles(id)`
- `assigned_at timestamptz not null`
- `ended_at timestamptz`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- unique constraint on active `user_id`, `role_key`

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

Student and chapter-leader roles should live here. Coaches, Admins, DS Admins,
and Super Admins should live in `staff_role_assignments`. Coach chapter
portfolio access should come from `coach_chapter_assignments` because coach
ownership changes by year, phase, and staffing needs.

### `coach_chapter_assignments`

Time-bounded relationship between a coach and a chapter.

Key fields:

- `id uuid primary key`
- `coach_user_id uuid not null references profiles(id)`
- `chapter_id uuid not null references chapters(id)`
- `coach_type coach_assignment_type not null`
- `status assignment_owner_status not null`
- `starts_at date not null`
- `ends_at date`
- `assigned_by uuid references profiles(id)`
- `handoff_reason text`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Use `coach_type` values such as `expansion` and `portfolio`. This supports a
chapter starting with an expansion coach and later being handed off to a
portfolio coach. A DS Admin, Admin, or Super Admin should be able to reassign a
chapter if a staff member leaves or portfolios change.

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

### `action_committees`

Chapter committee lane that organizes campus events and campaign activity.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `name text not null`
- `committee_type text not null`
- `status committee_status not null`
- `chair_user_id uuid references profiles(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Examples include fundraising, local volunteering, recruiting, social/community,
and campaign-specific committees.

### `chapter_events`

Campus activity planned by an Action Committee or chapter leader. This is the
operating object for fundraisers, local volunteering events, med talks, social
events, recruiting events, and similar activities.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `phase_id uuid references phases(id)`
- `action_committee_id uuid references action_committees(id)`
- `assignment_id uuid references assignments(id)`
- `luma_event_link_id uuid references luma_event_links(id)`
- `title text not null`
- `event_type text not null`
- `status chapter_event_status not null`
- `planned_by_user_id uuid references profiles(id)`
- `owner_user_id uuid references profiles(id)`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `promotion_summary text`
- `attendance_count integer`
- `eligible_member_count integer`
- `attendance_rate numeric`
- `nps_score numeric`
- `feedback_summary text`
- `warehouse_status external_sync_status not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

This table should let MEDLIFE answer: what did the committee run, who owned it,
how many students came, what percentage of the chapter participated, what was
the feedback, and should other universities copy it?

### `assignments`

Concrete action assigned to a user or role inside a chapter.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid not null references campaigns(id)`
- `phase_id uuid references phases(id)`
- `action_template_id uuid references action_templates(id)`
- `action_committee_id uuid references action_committees(id)`
- `chapter_event_id uuid references chapter_events(id)`
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

Student testimonial/proof submitted for an assignment or chapter activity.
Examples include bridge videos, testimonial text, links, or mock file
references.

Key fields:

- `id uuid primary key`
- `assignment_id uuid references assignments(id)`
- `chapter_id uuid not null references chapters(id)`
- `chapter_event_id uuid references chapter_events(id)`
- `submitted_by_user_id uuid not null references profiles(id)`
- `evidence_type evidence_type not null`
- `summary text not null`
- `url text`
- `storage_path text`
- `target_audiences text[] not null default '{}'`
- `proof_categories text[] not null default '{}'`
- `messenger_type text`
- `lifecycle_stage text`
- `hesitation_addressed text`
- `status evidence_status not null`
- `sharing_status content_sharing_status not null`
- `nps_score numeric`
- `activity_label text`
- `submitted_at timestamptz not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

At least one of `assignment_id` or `chapter_event_id` should be set.

### `approvals`

HQ or authorized staff decision about a testimonial/proof item. This should
mostly represent whether MEDLIFE wants to share the submitted proof with other
chapters, universities, or public online surfaces. It should not imply that
E-Board or Action Committee leaders are approving proof.

Key fields:

- `id uuid primary key`
- `evidence_item_id uuid not null references evidence_items(id)`
- `chapter_id uuid not null references chapters(id)`
- `reviewer_user_id uuid not null references profiles(id)`
- `decision approval_decision not null`
- `review_type text not null`
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
- `chapter_event_id uuid references chapter_events(id)`
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
- `chapter_event_id uuid references chapter_events(id)`
- `evidence_item_id uuid references evidence_items(id)`
- `metric_key text not null`
- `metric_value numeric not null`
- `unit text`
- `source text not null`
- `created_by uuid references profiles(id)`
- `created_at timestamptz not null`

### `events`

Structured internal product event stream for meaningful app actions. This is
different from `chapter_events`, which are real campus activities.

Key fields:

- `id uuid primary key`
- `event_type text not null`
- `actor_user_id uuid references profiles(id)`
- `chapter_id uuid references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `assignment_id uuid references assignments(id)`
- `chapter_event_id uuid references chapter_events(id)`
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
- `chapter_event_planned`
- `chapter_event_promoted`
- `chapter_event_completed`
- `chapter_event_attendance_recorded`
- `testimonial_submitted`
- `testimonial_approved_for_sharing`
- `testimonial_not_shared`
- `points_awarded`
- `kpi_event_recorded`
- `nps_score_recorded`
- `luma_event_linked`
- `luma_attendance_import_mocked`
- `hubspot_handoff_mocked`
- `coach_assignment_changed`
- `coach_decision_logged`
- `phase_completed`

### `luma_event_links`

Mock-safe or future real Luma event relationship.

Key fields:

- `id uuid primary key`
- `chapter_id uuid not null references chapters(id)`
- `campaign_id uuid references campaigns(id)`
- `phase_id uuid references phases(id)`
- `chapter_event_id uuid references chapter_events(id)`
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
- `app.is_ds_admin()`
- `app.can_manage_integrations()`
- `app.is_super_admin()`

## Permission Plan By Role

### General Member

Can read:

- own profile
- own approved/requested memberships
- chapter basics for approved chapters
- Rush Month campaigns, phases, and assignments visible to general members
- own testimonial/proof submissions
- own actions, points, recognition, and public chapter impact summaries
- chapter leaderboards intended for friendly student competition
- non-sensitive integration status summaries for own chapter

Can create:

- own chapter join requests
- testimonial/proof for assignments or chapter activities visible to them
- internal app events for their actions

Can update:

- own profile
- own pending testimonial/proof before HQ review, if the app supports edits

Can never access:

- coach-only dashboards
- private testimonial/proof that is not intended for chapter-visible recognition
  or leaderboards
- leadership-only SOP/KPI data
- admin settings
- role approval controls
- raw automation payloads

### Action Committee Member

Can read:

- everything a General Member can read
- committee assignments for their chapter and role
- status for committee actions they own

Can create:

- testimonial/proof for committee assignments or organized events
- internal action-started and evidence-submitted events

Can update:

- own pending testimonial/proof before HQ review

Can never access:

- platform admin settings
- unrelated member private testimonial/proof
- final role approval controls

### Action Committee Chair

Can read:

- committee-lane assignments in their chapter
- submitted testimonials/proof for committee actions they organize
- committee progress summaries

Can create:

- committee assignment drafts or requests if enabled by chapter leadership
- Luma event link records or event setup requests when enabled
- testimonial/proof submissions for events they organize
- internal events for coordination activity

Can update:

- committee action status where assigned

Can never access:

- platform admin settings
- unrelated chapters
- HQ testimonial sharing decisions unless surfaced back to the chapter
- super-admin controls

Action Committee Chairs do not approve proof. They organize events and submit
testimonials/proof to MEDLIFE HQ.

### E-Board Member

Can read:

- chapter campaign progress
- leadership assignments in their chapter
- submitted testimonial/proof status for chapter activities they help run

Can create:

- assignments inside approved chapter campaigns if chapter policy allows
- testimonial/proof submissions for chapter activities

Can update:

- assignments they own or manage

Can never access:

- platform integration settings
- unrelated chapters
- HQ testimonial sharing controls unless explicitly granted as staff
- super-admin controls

### President / VP

Can read:

- chapter campaign, assignment, testimonial/proof status, points, KPI, and event
  summaries for their chapter
- chapter membership requests
- coach-readable chapter state

Can create:

- chapter campaigns
- phases and assignments from approved templates
- chapter testimonial/proof submissions
- role approvals for chapter-scoped roles
- chapter-scoped events and outbox records

Can update:

- chapter campaign status
- chapter assignments
- membership status for chapter-scoped roles

Can never access:

- platform-wide admin settings
- unrelated chapters
- HQ testimonial sharing controls unless separately granted as staff
- super-admin emergency overrides

### Coach

Can read:

- assigned portfolio chapters represented by active `coach_chapter_assignments`
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
- chapter, testimonial/proof, impact, and support data needed for staff work

Can create:

- configuration records where explicitly allowed
- HQ testimonial sharing decisions if assigned to that operating role
- audited support events

Can update:

- support-safe records within assigned admin scope

Can never access:

- DS Admin or Super Admin integration credentials and connection controls
- emergency override powers unless separately granted
- secrets or service role credentials

### DS Admin

Can read:

- integration configuration status
- outbox and integration event details needed to manage systems safely
- operational records needed to debug HubSpot, Luma, n8n, warehouse, or Power BI
  sync behavior

Can create/update:

- HubSpot, Luma, n8n, warehouse, and Power BI connection settings
- approved external-send controls
- integration health and retry controls

Can never access:

- unnecessary student private content beyond what is needed for integration
  debugging
- super-admin emergency powers unless separately granted

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
| `chapters` | approved members, active coach assignments, admin | admin/super admin | president/vp for limited chapter fields, admin | super admin only |
| `roles` | authenticated users | super admin | super admin | super admin |
| `staff_role_assignments` | self, admin, DS admin, super admin | super admin | super admin | super admin only |
| `memberships` | self, chapter leaders, admin | self join request, chapter leader invite | president/vp/admin approvals | super admin only |
| `coach_chapter_assignments` | assigned coach, admin, DS admin, super admin | admin, DS admin, super admin | admin, DS admin, super admin | super admin only |
| `campaigns` | chapter members, coach portfolio, admin | president/vp, admin | president/vp, admin | super admin only |
| `phases` | chapter members, coach portfolio, admin | president/vp, admin | president/vp, admin | super admin only |
| `action_templates` | chapter leaders, coach portfolio, admin | admin or president/vp from approved SOP | admin or president/vp | super admin only |
| `action_committees` | chapter members, active coach assignments, admin | president/vp, admin | president/vp, action committee chair for own committee, admin | super admin only |
| `chapter_events` | chapter members for visible events, active coach assignments, admin | action committee chairs, president/vp, admin | event owners, action committee chairs, president/vp, admin | super admin only |
| `assignments` | assigned users/roles, chapter leaders, coach portfolio, admin | chapter leaders | chapter leaders, assigned owner for status only | super admin only |
| `evidence_items` | submitter, chapter leaders for chapter activity status, active coach assignments, admin | assigned user or chapter organizer | submitter before HQ review, staff for sharing status | super admin only |
| `approvals` | submitter, HQ staff, admin, DS admin, super admin | authorized HQ staff/admin | no normal update after create | super admin only |
| `points_events` | user, chapter leaders, coach portfolio, admin | review flow/system | append-only | super admin correction event preferred |
| `kpi_events` | chapter members for summaries, coach portfolio, admin | review flow/system | append-only | super admin correction event preferred |
| `events` | actor, chapter leaders, coach portfolio, admin | app flows/system | append-only | super admin only |
| `luma_event_links` | chapter leaders, coach portfolio, admin | chapter leaders/admin mocked | chapter leaders/admin mocked | super admin only |
| `integration_events` | chapter leaders summary, coach summary, admin/DS admin detail | app flows/system | status updates by DS admin/system | super admin only |
| `automation_outbox` | chapter leaders summary, coach summary, admin/DS admin detail | app flows/system | DS admin/system status only | super admin only |
| `audit_logs` | admin, DS admin, super admin, limited self/chapter views if needed | system/admin | append-only | never through app |

## Chapter-Scoped Rules

Most rows should include `chapter_id` directly. This keeps RLS policies
straightforward and avoids expensive joins through campaigns or assignments for
every access check.

Rules:

- A user can read chapter-scoped rows only when they have an approved membership
  for that chapter, an active coach assignment for that chapter, or an admin,
  DS admin, or super-admin role.
- Chapter leader writes require approved `president_vp`, `e_board_member`, or
  explicitly approved `action_committee_chair` roles depending on the table.
- Members can only create testimonial/proof submissions for assignments or
  chapter activities visible to their approved role or assigned directly to
  their user.
- Cross-chapter reads are denied by default.

## Coach Portfolio Rules

Represent coach portfolio access with `coach_chapter_assignments`, not only
chapter membership rows.

Rules:

- A coach can read operational state for chapters where they have an active
  coach assignment.
- Coach assignment type should distinguish expansion coach from portfolio coach.
- Coach assignments should support start/end dates so yearly portfolio changes
  and staff transitions are clean.
- A coach can create coach decision logs for those chapters.
- A coach cannot approve student membership truth unless a later role explicitly
  grants that ability.
- A coach cannot see chapters outside their portfolio.

## Admin Rules

Admin roles need extra care because broad access can become invisible.

Rules:

- `admin` should be used for general MEDLIFE staff support operations, not
  unchecked global power.
- `ds_admin` should manage HubSpot, Luma, n8n, warehouse, Power BI, API, and
  connection controls.
- `super_admin` should be reserved for platform settings, emergency overrides,
  and global administration.
- All admin, DS admin, and super-admin writes should produce audit logs.
- Service role access should stay server-only and never appear in client code.

## Audit Logging Requirements

Audit logs are required for:

- membership approvals and rejections
- role changes
- coach assignment changes and coach handoffs
- campaign open/close decisions
- assignment creation or reassignment
- action committee creation or chair changes
- chapter event planning, promotion, attendance, feedback, and warehouse sync
- testimonial/proof submissions
- HQ testimonial sharing decisions
- points awards or corrections
- KPI event corrections
- NPS score imports or recorded feedback summaries
- integration status changes
- outbox approval for any real external send
- admin, DS admin, and super-admin configuration changes
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
  `assignedToRoleKey`, `actionCommitteeId`, `chapterEventId`, and
  `assignedByUserId` to `Assignment` persistence types.
- Add `ActionCommittee` and `ChapterEvent` persistence types. `ChapterEvent`
  should represent campus events, while `Event` should remain the internal app
  event log.
- Add `submittedByUserId`, `url`, `storagePath`, `sharingStatus`, `npsScore`,
  `activityLabel`, `chapterEventId`, and `submittedAt` to `EvidenceItem`
  persistence types.
- Treat `Approval` as an HQ content-sharing review record, not an E-Board proof
  review. Add `reviewerUserId`, `reviewType`, and `reviewedAt`.
- Add a `CoachChapterAssignment` persistence type for expansion and portfolio
  coach assignments.
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

1. What exact statuses should MEDLIFE HQ use for testimonial sharing decisions?
   Current draft uses submitted, in HQ review, approved for sharing, not shared,
   and archived.
2. Should NPS scores be stored directly on testimonial/proof rows, only as KPI
   events, on chapter events, or all three with a clear source of truth?
3. Should coach assignment history be visible to chapter leaders, or only to
   coaches/admins?
4. Which staff roles besides Admin can decide that a testimonial should be
   shared with other universities or public online surfaces?
5. Should DS Admins be separate from Super Admins in production from day one, or
   should one trusted group hold both roles during the first pilot?
6. Which Action Committee types should be canonical in the database at launch?

## Goal 4 Assumptions

- The repo remains on the Next.js, TypeScript, Tailwind, Supabase, and Vercel
  path unless Nick/team intentionally choose a stack change.
- Supabase Auth will be used for sign-in, but no live auth is wired in Goal 4.
- The first live implementation should prioritize Rush Month and avoid
  all-campaign generalization.
- Draft SQL is review material, not an applied migration.
- External writes remain disabled until explicitly approved.
