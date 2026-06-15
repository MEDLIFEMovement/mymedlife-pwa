-- Goal 6 draft only.
-- Do not apply this file as a migration.
--
-- Purpose:
-- Capture the recommended Goal 7 schema direction after reviewing the Goal 5
-- local Supabase foundation against the MEDLIFE Sales SOP knowledge base.
--
-- Goal 7 should convert the approved parts of this sketch into a real
-- migration, seed data, RLS policies, and pgTAP tests.

-- Global, HQ-owned campaign templates.
-- These should eventually be seeded from the campaign registry.
create table app.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  registry_key text not null unique,
  name text not null,
  slug text not null unique,
  audience text not null,
  summary text not null,
  annual_order integer,
  status text not null default 'draft',
  default_kpis jsonb not null default '[]'::jsonb,
  source_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'active', 'archived'))
);

-- Global phase templates that define readiness gates and required outputs.
create table app.campaign_phase_templates (
  id uuid primary key default gen_random_uuid(),
  campaign_template_id uuid not null references app.campaign_templates(id) on delete cascade,
  title text not null,
  phase_order integer not null,
  objective text not null,
  entry_criteria jsonb not null default '[]'::jsonb,
  exit_criteria jsonb not null default '[]'::jsonb,
  required_outputs jsonb not null default '[]'::jsonb,
  coach_validation_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_template_id, phase_order)
);

-- Link chapter campaign instances back to HQ templates.
alter table app.campaigns
add column campaign_template_id uuid references app.campaign_templates(id),
add column semester text,
add column academic_year text;

alter table app.phases
add column phase_template_id uuid references app.campaign_phase_templates(id),
add column readiness_status text not null default 'not_ready',
add column coach_validation_status text not null default 'not_required',
add column required_outputs jsonb not null default '[]'::jsonb,
add column entry_criteria jsonb not null default '[]'::jsonb,
add column exit_criteria jsonb not null default '[]'::jsonb,
add check (readiness_status in ('not_ready', 'ready', 'validated', 'blocked', 'waived')),
add check (coach_validation_status in ('not_required', 'pending', 'validated', 'blocked', 'waived'));

-- Campaign-specific ownership lanes, such as Recruitment Director, SLT
-- Officer, Fundraising Officer, Engagement Director, Secretary, Treasurer,
-- Social Media, Follow-Up Chair, Past Traveler, or Ambassador.
create table app.campaign_role_assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  user_id uuid not null references app.profiles(id) on delete cascade,
  role_key text not null,
  role_label text not null,
  lane text not null,
  status text not null default 'active',
  starts_at date not null default current_date,
  ends_at date,
  assigned_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'inactive', 'ended')),
  check (ends_at is null or ends_at >= starts_at)
);

create unique index campaign_role_assignments_active_unique
on app.campaign_role_assignments (campaign_id, user_id, role_key)
where status = 'active';

-- Chapter-specific readiness reviews.
create table app.phase_readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  phase_id uuid not null references app.phases(id) on delete cascade,
  reviewer_user_id uuid not null references app.profiles(id),
  readiness_status text not null,
  decision_note text not null,
  blocker_summary text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (readiness_status in ('ready', 'validated', 'blocked', 'waived'))
);

-- Coach-visible risk and escalation records.
create table app.risk_flags (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
  severity text not null,
  signal text not null,
  root_cause text,
  owner_user_id uuid references app.profiles(id),
  response_plan text not null,
  status text not null default 'open',
  due_at timestamptz,
  coach_note text,
  created_by uuid references app.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('low', 'medium', 'high', 'critical')),
  check (status in ('open', 'watching', 'escalated', 'resolved', 'dismissed'))
);

-- Campaign learning and handoff object.
create table app.campaign_closeouts (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  status text not null default 'draft',
  submitted_by uuid references app.profiles(id),
  validated_by uuid references app.profiles(id),
  goals_summary text not null,
  results_summary text not null,
  kpi_summary jsonb not null default '{}'::jsonb,
  proof_summary text,
  top_contributors jsonb not null default '[]'::jsonb,
  lessons_learned text,
  unresolved_risks text,
  recommendations text,
  next_handoff text,
  submitted_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id),
  check (status in ('draft', 'submitted', 'validated', 'returned', 'archived'))
);

-- Assignment refinements needed by the SOP task object.
alter table app.assignments
add column priority text not null default 'normal',
add column expected_output text,
add column support_role_labels text[] not null default '{}',
add column late_next_step text,
add column risk_flagged boolean not null default false,
add check (priority in ('low', 'normal', 'high', 'urgent'));

-- Evidence refinements needed before production storage.
-- The existing app.evidence_type enum should be expanded in a real migration
-- with care because PostgreSQL enum changes are not always reversible.
-- Candidate values:
-- testimonial_text, bridge_video, event_photo, attendance_log, feedback_form,
-- tracker_screenshot, planning_doc, recap_note, external_link, mock_file.
