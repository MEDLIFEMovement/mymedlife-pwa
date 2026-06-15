-- DRAFT ONLY - NOT APPLIED.
-- Do not run this against production or a real Supabase project until Nick
-- approves Goal 5 and the schema/RLS plan has been reviewed.

create extension if not exists pgcrypto;

create schema if not exists app;

create type app.profile_status as enum ('active', 'inactive');
create type app.chapter_status as enum ('active', 'inactive', 'archived');
create type app.membership_status as enum ('requested', 'approved', 'rejected', 'inactive');
create type app.campaign_status as enum ('draft', 'active', 'complete', 'archived');
create type app.phase_status as enum ('not_started', 'active', 'complete');
create type app.assignment_status as enum (
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'changes_requested',
  'canceled'
);
create type app.evidence_type as enum ('text', 'link', 'mock_file');
create type app.evidence_status as enum (
  'pending_review',
  'approved',
  'rejected',
  'changes_requested'
);
create type app.approval_decision as enum ('approved', 'rejected', 'changes_requested');
create type app.integration_destination as enum (
  'internal',
  'n8n',
  'hubspot',
  'luma',
  'warehouse',
  'power_bi'
);
create type app.integration_status as enum (
  'recorded',
  'approved_for_mock',
  'mocked',
  'approved_for_live_send',
  'sent',
  'failed',
  'disabled'
);
create type app.outbox_status as enum (
  'recorded',
  'approved_for_mock',
  'mocked',
  'approved_for_live_send',
  'sent',
  'failed',
  'dead_lettered',
  'disabled'
);
create type app.external_sync_status as enum (
  'not_linked',
  'linked',
  'mocked',
  'pending',
  'failed',
  'disabled'
);

create table app.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  status app.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campus text not null,
  region text,
  status app.chapter_status not null default 'active',
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.roles (
  key text primary key,
  label text not null,
  chapter_scoped boolean not null default true,
  sort_order integer not null
);

insert into app.roles (key, label, chapter_scoped, sort_order) values
  ('general_member', 'General Member', true, 10),
  ('action_committee_member', 'Action Committee Member', true, 20),
  ('action_committee_chair', 'Action Committee Chair', true, 30),
  ('e_board_member', 'E-Board Member', true, 40),
  ('president_vp', 'President / VP', true, 50),
  ('coach', 'Coach', true, 60),
  ('admin', 'Admin', false, 70),
  ('super_admin', 'Super Admin', false, 80);

create table app.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  role_key text not null references app.roles(key),
  status app.membership_status not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chapter_id, role_key)
);

create table app.campaigns (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  name text not null,
  slug text not null,
  objective text not null,
  status app.campaign_status not null default 'draft',
  opened_by uuid references app.profiles(id),
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug)
);

create table app.phases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  title text not null,
  objective text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status app.phase_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.action_templates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  title text not null,
  instructions text not null,
  default_owner_role_key text references app.roles(key),
  evidence_required text not null,
  points integer not null default 0 check (points >= 0),
  kpi_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  phase_id uuid references app.phases(id) on delete set null,
  action_template_id uuid references app.action_templates(id) on delete set null,
  title text not null,
  instructions text not null,
  assigned_to_user_id uuid references app.profiles(id),
  assigned_to_role_key text references app.roles(key),
  assigned_by_user_id uuid references app.profiles(id),
  status app.assignment_status not null default 'not_started',
  due_at timestamptz,
  evidence_required text not null,
  points integer not null default 0 check (points >= 0),
  kpi_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assigned_to_user_id is not null or assigned_to_role_key is not null)
);

create table app.evidence_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references app.assignments(id) on delete cascade,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  submitted_by_user_id uuid not null references app.profiles(id),
  evidence_type app.evidence_type not null,
  summary text not null,
  url text,
  storage_path text,
  status app.evidence_status not null default 'pending_review',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.approvals (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null references app.evidence_items(id) on delete cascade,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  reviewer_user_id uuid not null references app.profiles(id),
  decision app.approval_decision not null,
  note text not null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table app.points_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  evidence_item_id uuid references app.evidence_items(id) on delete set null,
  approval_id uuid references app.approvals(id) on delete set null,
  awarded_to_user_id uuid not null references app.profiles(id),
  points_delta integer not null,
  reason text not null,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.kpi_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  evidence_item_id uuid references app.evidence_items(id) on delete set null,
  metric_key text not null,
  metric_value numeric not null,
  unit text,
  source text not null,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now()
);

create table app.events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_user_id uuid references app.profiles(id),
  chapter_id uuid references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table app.luma_event_links (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  luma_event_id text,
  luma_event_url text,
  status app.external_sync_status not null default 'disabled',
  linked_by uuid references app.profiles(id),
  linked_at timestamptz,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.integration_events (
  id uuid primary key default gen_random_uuid(),
  source_event_id uuid references app.events(id) on delete set null,
  chapter_id uuid references app.chapters(id) on delete cascade,
  event_type text not null,
  destination app.integration_destination not null,
  external_object_type text,
  external_object_id text,
  status app.integration_status not null default 'recorded',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.automation_outbox (
  id uuid primary key default gen_random_uuid(),
  source_event_id uuid references app.events(id) on delete set null,
  integration_event_id uuid references app.integration_events(id) on delete set null,
  chapter_id uuid references app.chapters(id) on delete cascade,
  destination app.integration_destination not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status app.outbox_status not null default 'recorded',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app.profiles(id),
  chapter_id uuid references app.chapters(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  before_value jsonb,
  after_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function app.has_chapter_role(chapter_uuid uuid, role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = auth.uid()
      and memberships.chapter_id = chapter_uuid
      and memberships.role_key = any(role_keys)
      and memberships.status = 'approved'
  )
$$;

create or replace function app.is_chapter_member(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_chapter_role(chapter_uuid, array[
    'general_member',
    'action_committee_member',
    'action_committee_chair',
    'e_board_member',
    'president_vp',
    'coach'
  ])
$$;

create or replace function app.is_chapter_leader(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_chapter_role(chapter_uuid, array[
    'action_committee_chair',
    'e_board_member',
    'president_vp'
  ])
$$;

create or replace function app.is_coach_for_chapter(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_chapter_role(chapter_uuid, array['coach'])
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = auth.uid()
      and memberships.role_key in ('admin', 'super_admin')
      and memberships.status = 'approved'
  )
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = auth.uid()
      and memberships.role_key = 'super_admin'
      and memberships.status = 'approved'
  )
$$;

alter table app.profiles enable row level security;
alter table app.chapters enable row level security;
alter table app.roles enable row level security;
alter table app.memberships enable row level security;
alter table app.campaigns enable row level security;
alter table app.phases enable row level security;
alter table app.action_templates enable row level security;
alter table app.assignments enable row level security;
alter table app.evidence_items enable row level security;
alter table app.approvals enable row level security;
alter table app.points_events enable row level security;
alter table app.kpi_events enable row level security;
alter table app.events enable row level security;
alter table app.luma_event_links enable row level security;
alter table app.integration_events enable row level security;
alter table app.automation_outbox enable row level security;
alter table app.audit_logs enable row level security;

-- Draft policy examples. These are intentionally incomplete and should be
-- reviewed before Goal 5 implementation.

create policy "profiles can read own profile"
on app.profiles for select
using (id = auth.uid() or app.is_admin());

create policy "members can read approved chapter"
on app.chapters for select
using (app.is_chapter_member(id) or app.is_admin());

create policy "members can read own memberships"
on app.memberships for select
using (
  user_id = auth.uid()
  or app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member'])
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "chapter leaders can manage assignments"
on app.assignments for all
using (app.is_chapter_leader(chapter_id) or app.is_admin())
with check (app.is_chapter_leader(chapter_id) or app.is_admin());

create policy "assigned users can read assignments"
on app.assignments for select
using (
  assigned_to_user_id = auth.uid()
  or app.has_chapter_role(chapter_id, array[assigned_to_role_key])
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "assigned users can create evidence"
on app.evidence_items for insert
with check (
  submitted_by_user_id = auth.uid()
  and exists (
    select 1
    from app.assignments assignments
    where assignments.id = assignment_id
      and assignments.chapter_id = evidence_items.chapter_id
      and (
        assignments.assigned_to_user_id = auth.uid()
        or app.has_chapter_role(assignments.chapter_id, array[assignments.assigned_to_role_key])
      )
  )
);

create policy "evidence readers"
on app.evidence_items for select
using (
  submitted_by_user_id = auth.uid()
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "events are chapter scoped"
on app.events for select
using (
  actor_user_id = auth.uid()
  or (chapter_id is not null and app.is_chapter_leader(chapter_id))
  or (chapter_id is not null and app.is_coach_for_chapter(chapter_id))
  or app.is_admin()
);

create policy "outbox details are admin scoped"
on app.automation_outbox for select
using (
  app.is_admin()
  or (chapter_id is not null and app.is_chapter_leader(chapter_id))
  or (chapter_id is not null and app.is_coach_for_chapter(chapter_id))
);
