create extension if not exists pgcrypto;

create schema if not exists app;

create type app.profile_status as enum ('active', 'inactive');
create type app.chapter_status as enum ('active', 'inactive', 'archived');
create type app.membership_status as enum ('requested', 'approved', 'rejected', 'inactive');
create type app.staff_role_status as enum ('active', 'inactive', 'ended');
create type app.coach_assignment_type as enum ('expansion', 'portfolio');
create type app.assignment_owner_status as enum ('active', 'inactive', 'ended');
create type app.committee_status as enum ('active', 'inactive', 'archived');
create type app.chapter_event_status as enum (
  'idea',
  'planning',
  'published',
  'promoting',
  'completed',
  'feedback_collected',
  'shared',
  'canceled'
);
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
create type app.content_sharing_status as enum (
  'submitted',
  'in_hq_review',
  'approved_for_sharing',
  'not_shared',
  'archived'
);
create type app.approval_decision as enum (
  'approved_for_sharing',
  'not_shared',
  'changes_requested'
);
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
  ('coach', 'Coach', false, 60),
  ('admin', 'Admin', false, 70),
  ('ds_admin', 'DS Admin', false, 80),
  ('super_admin', 'Super Admin', false, 90);

create table app.staff_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  role_key text not null references app.roles(key),
  status app.staff_role_status not null default 'active',
  assigned_by uuid references app.profiles(id),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role_key in ('coach', 'admin', 'ds_admin', 'super_admin'))
    and (ended_at is null or ended_at >= assigned_at)
  )
);

create unique index staff_role_assignments_active_unique
on app.staff_role_assignments (user_id, role_key)
where status = 'active';

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
  unique (user_id, chapter_id, role_key),
  check (role_key in (
    'general_member',
    'action_committee_member',
    'action_committee_chair',
    'e_board_member',
    'president_vp'
  ))
);

create table app.coach_chapter_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_user_id uuid not null references app.profiles(id) on delete cascade,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  coach_type app.coach_assignment_type not null,
  status app.assignment_owner_status not null default 'active',
  starts_at date not null,
  ends_at date,
  assigned_by uuid references app.profiles(id),
  handoff_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
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
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  title text not null,
  objective text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status app.phase_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table app.action_templates (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
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

create table app.action_committees (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  name text not null,
  committee_type text not null,
  status app.committee_status not null default 'active',
  chair_user_id uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null references app.campaigns(id) on delete cascade,
  phase_id uuid references app.phases(id) on delete set null,
  action_template_id uuid references app.action_templates(id) on delete set null,
  action_committee_id uuid references app.action_committees(id) on delete set null,
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

create table app.chapter_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  action_committee_id uuid references app.action_committees(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  title text not null,
  event_type text not null,
  status app.chapter_event_status not null default 'idea',
  planned_by_user_id uuid references app.profiles(id),
  owner_user_id uuid references app.profiles(id),
  starts_at timestamptz,
  ends_at timestamptz,
  promotion_summary text,
  attendance_count integer check (attendance_count is null or attendance_count >= 0),
  eligible_member_count integer check (eligible_member_count is null or eligible_member_count >= 0),
  attendance_rate numeric check (attendance_rate is null or attendance_rate between 0 and 1),
  nps_score numeric check (nps_score is null or nps_score between -100 and 100),
  feedback_summary text,
  warehouse_status app.external_sync_status not null default 'disabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

alter table app.assignments
add column chapter_event_id uuid references app.chapter_events(id) on delete set null;

create table app.luma_event_links (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
  luma_event_id text,
  luma_event_url text,
  status app.external_sync_status not null default 'disabled',
  linked_by uuid references app.profiles(id),
  linked_at timestamptz,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app.chapter_events
add column luma_event_link_id uuid references app.luma_event_links(id) on delete set null;

create table app.evidence_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references app.assignments(id) on delete set null,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
  submitted_by_user_id uuid not null references app.profiles(id),
  evidence_type app.evidence_type not null,
  summary text not null,
  url text,
  storage_path text,
  target_audiences text[] not null default '{}',
  proof_categories text[] not null default '{}',
  messenger_type text,
  lifecycle_stage text,
  hesitation_addressed text,
  status app.evidence_status not null default 'pending_review',
  sharing_status app.content_sharing_status not null default 'submitted',
  nps_score numeric check (nps_score is null or nps_score between -100 and 100),
  activity_label text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (assignment_id is not null or chapter_event_id is not null)
);

create table app.approvals (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null references app.evidence_items(id) on delete cascade,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  reviewer_user_id uuid not null references app.profiles(id),
  decision app.approval_decision not null,
  review_type text not null default 'hq_content_sharing',
  note text not null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table app.points_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
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
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
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
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
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
  updated_at timestamptz not null default now(),
  check (attempt_count >= 0)
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

create index memberships_user_chapter_idx on app.memberships (user_id, chapter_id);
create index memberships_chapter_status_idx on app.memberships (chapter_id, status);
create index coach_chapter_assignments_active_idx on app.coach_chapter_assignments (coach_user_id, chapter_id, status);
create index assignments_chapter_status_idx on app.assignments (chapter_id, status);
create index evidence_items_chapter_status_idx on app.evidence_items (chapter_id, status, sharing_status);
create index points_events_awarded_to_idx on app.points_events (awarded_to_user_id, chapter_id);
create index kpi_events_chapter_metric_idx on app.kpi_events (chapter_id, metric_key);
create index events_chapter_type_idx on app.events (chapter_id, event_type, occurred_at);
create index integration_events_chapter_status_idx on app.integration_events (chapter_id, destination, status);
create index automation_outbox_status_idx on app.automation_outbox (status, available_at);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on app.profiles
for each row execute function app.set_updated_at();
create trigger set_chapters_updated_at before update on app.chapters
for each row execute function app.set_updated_at();
create trigger set_staff_role_assignments_updated_at before update on app.staff_role_assignments
for each row execute function app.set_updated_at();
create trigger set_memberships_updated_at before update on app.memberships
for each row execute function app.set_updated_at();
create trigger set_coach_chapter_assignments_updated_at before update on app.coach_chapter_assignments
for each row execute function app.set_updated_at();
create trigger set_campaigns_updated_at before update on app.campaigns
for each row execute function app.set_updated_at();
create trigger set_phases_updated_at before update on app.phases
for each row execute function app.set_updated_at();
create trigger set_action_templates_updated_at before update on app.action_templates
for each row execute function app.set_updated_at();
create trigger set_action_committees_updated_at before update on app.action_committees
for each row execute function app.set_updated_at();
create trigger set_assignments_updated_at before update on app.assignments
for each row execute function app.set_updated_at();
create trigger set_chapter_events_updated_at before update on app.chapter_events
for each row execute function app.set_updated_at();
create trigger set_luma_event_links_updated_at before update on app.luma_event_links
for each row execute function app.set_updated_at();
create trigger set_evidence_items_updated_at before update on app.evidence_items
for each row execute function app.set_updated_at();
create trigger set_integration_events_updated_at before update on app.integration_events
for each row execute function app.set_updated_at();
create trigger set_automation_outbox_updated_at before update on app.automation_outbox
for each row execute function app.set_updated_at();

create or replace function app.enforce_assignment_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
  if app.is_chapter_leader(old.chapter_id) or app.is_admin() then
    return new;
  end if;

  if new.id <> old.id
    or new.chapter_id <> old.chapter_id
    or new.campaign_id <> old.campaign_id
    or new.phase_id is distinct from old.phase_id
    or new.action_template_id is distinct from old.action_template_id
    or new.action_committee_id is distinct from old.action_committee_id
    or new.chapter_event_id is distinct from old.chapter_event_id
    or new.title <> old.title
    or new.instructions <> old.instructions
    or new.assigned_to_user_id is distinct from old.assigned_to_user_id
    or new.assigned_to_role_key is distinct from old.assigned_to_role_key
    or new.assigned_by_user_id is distinct from old.assigned_by_user_id
    or new.due_at is distinct from old.due_at
    or new.evidence_required <> old.evidence_required
    or new.points <> old.points
    or new.kpi_key <> old.kpi_key
    or new.created_at <> old.created_at then
    raise exception 'assigned users can only update assignment status';
  end if;

  return new;
end;
$$;

create trigger enforce_assignment_update_bounds before update on app.assignments
for each row execute function app.enforce_assignment_update_bounds();

create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function app.has_staff_role(role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.staff_role_assignments staff_roles
    where staff_roles.user_id = auth.uid()
      and staff_roles.role_key = any(role_keys)
      and staff_roles.status = 'active'
  )
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
    'president_vp'
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
  select app.has_staff_role(array['coach'])
    and exists (
      select 1
      from app.coach_chapter_assignments coach_assignments
      where coach_assignments.coach_user_id = auth.uid()
        and coach_assignments.chapter_id = chapter_uuid
        and coach_assignments.status = 'active'
        and coach_assignments.starts_at <= current_date
        and (coach_assignments.ends_at is null or coach_assignments.ends_at >= current_date)
    )
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_staff_role(array['admin', 'ds_admin', 'super_admin'])
$$;

create or replace function app.is_ds_admin()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_staff_role(array['ds_admin', 'super_admin'])
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_staff_role(array['super_admin'])
$$;

create or replace function app.can_manage_integrations()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_ds_admin() or app.is_super_admin()
$$;

create or replace function app.can_read_assignment(assignment_row app.assignments)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select assignment_row.assigned_to_user_id = auth.uid()
    or app.has_chapter_role(assignment_row.chapter_id, array[assignment_row.assigned_to_role_key])
    or app.is_chapter_leader(assignment_row.chapter_id)
    or app.is_coach_for_chapter(assignment_row.chapter_id)
    or app.is_admin()
$$;

create or replace function app.can_submit_evidence_for_assignment(assignment_uuid uuid, chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.assignments assignments
    where assignments.id = assignment_uuid
      and assignments.chapter_id = chapter_uuid
      and app.can_read_assignment(assignments)
  )
$$;

create or replace function app.can_submit_evidence_for_chapter_event(chapter_event_uuid uuid, chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.chapter_events chapter_events
    where chapter_events.id = chapter_event_uuid
      and chapter_events.chapter_id = chapter_uuid
      and (
        chapter_events.owner_user_id = auth.uid()
        or chapter_events.planned_by_user_id = auth.uid()
        or app.is_chapter_member(chapter_events.chapter_id)
        or app.is_chapter_leader(chapter_events.chapter_id)
        or app.is_coach_for_chapter(chapter_events.chapter_id)
        or app.is_admin()
      )
  )
$$;

alter table app.profiles enable row level security;
alter table app.chapters enable row level security;
alter table app.roles enable row level security;
alter table app.staff_role_assignments enable row level security;
alter table app.memberships enable row level security;
alter table app.coach_chapter_assignments enable row level security;
alter table app.campaigns enable row level security;
alter table app.phases enable row level security;
alter table app.action_templates enable row level security;
alter table app.action_committees enable row level security;
alter table app.assignments enable row level security;
alter table app.chapter_events enable row level security;
alter table app.luma_event_links enable row level security;
alter table app.evidence_items enable row level security;
alter table app.approvals enable row level security;
alter table app.points_events enable row level security;
alter table app.kpi_events enable row level security;
alter table app.events enable row level security;
alter table app.integration_events enable row level security;
alter table app.automation_outbox enable row level security;
alter table app.audit_logs enable row level security;

grant usage on schema app to authenticated, service_role;
grant select, insert, update, delete on all tables in schema app to authenticated, service_role;
grant usage, select on all sequences in schema app to authenticated, service_role;
grant execute on all functions in schema app to authenticated, service_role;

create policy "profiles_select_self_or_staff"
on app.profiles for select to authenticated
using (id = auth.uid() or app.is_admin());

create policy "profiles_insert_self"
on app.profiles for insert to authenticated
with check (id = auth.uid());

create policy "profiles_update_self_or_staff"
on app.profiles for update to authenticated
using (id = auth.uid() or app.is_admin())
with check (id = auth.uid() or app.is_admin());

create policy "chapters_select_scoped"
on app.chapters for select to authenticated
using (app.is_chapter_member(id) or app.is_coach_for_chapter(id) or app.is_admin());

create policy "chapters_update_president_or_staff"
on app.chapters for update to authenticated
using (app.has_chapter_role(id, array['president_vp']) or app.is_admin())
with check (app.has_chapter_role(id, array['president_vp']) or app.is_admin());

create policy "roles_select_authenticated"
on app.roles for select to authenticated
using (true);

create policy "roles_manage_super_admin"
on app.roles for all to authenticated
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "staff_roles_select_self_or_staff"
on app.staff_role_assignments for select to authenticated
using (user_id = auth.uid() or app.is_admin() or app.is_ds_admin() or app.is_super_admin());

create policy "staff_roles_manage_super_admin"
on app.staff_role_assignments for all to authenticated
using (app.is_super_admin())
with check (app.is_super_admin());

create policy "memberships_select_scoped"
on app.memberships for select to authenticated
using (
  user_id = auth.uid()
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "memberships_insert_self_request"
on app.memberships for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'requested'
  and role_key in ('general_member', 'action_committee_member')
);

create policy "memberships_update_chapter_president_or_staff"
on app.memberships for update to authenticated
using (app.has_chapter_role(chapter_id, array['president_vp']) or app.is_admin())
with check (app.has_chapter_role(chapter_id, array['president_vp']) or app.is_admin());

create policy "coach_assignments_select_scoped"
on app.coach_chapter_assignments for select to authenticated
using (coach_user_id = auth.uid() or app.is_admin() or app.is_ds_admin());

create policy "coach_assignments_manage_admin_ds"
on app.coach_chapter_assignments for all to authenticated
using (app.is_admin() or app.is_ds_admin())
with check (app.is_admin() or app.is_ds_admin());

create policy "campaigns_select_scoped"
on app.campaigns for select to authenticated
using (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "campaigns_manage_leaders_or_staff"
on app.campaigns for all to authenticated
using (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin())
with check (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin());

create policy "phases_select_scoped"
on app.phases for select to authenticated
using (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "phases_manage_leaders_or_staff"
on app.phases for all to authenticated
using (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin())
with check (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin());

create policy "action_templates_select_leaders_coaches_staff"
on app.action_templates for select to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "action_templates_manage_president_or_staff"
on app.action_templates for all to authenticated
using (app.has_chapter_role(chapter_id, array['president_vp']) or app.is_admin())
with check (app.has_chapter_role(chapter_id, array['president_vp']) or app.is_admin());

create policy "action_committees_select_chapter_scoped"
on app.action_committees for select to authenticated
using (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "action_committees_manage_leaders_or_staff"
on app.action_committees for all to authenticated
using (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin())
with check (app.has_chapter_role(chapter_id, array['president_vp', 'e_board_member']) or app.is_admin());

create policy "chapter_events_select_chapter_scoped"
on app.chapter_events for select to authenticated
using (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "chapter_events_insert_organizers"
on app.chapter_events for insert to authenticated
with check (
  app.has_chapter_role(chapter_id, array['action_committee_chair', 'e_board_member', 'president_vp'])
  or app.is_admin()
);

create policy "chapter_events_update_owner_leaders_staff"
on app.chapter_events for update to authenticated
using (
  owner_user_id = auth.uid()
  or planned_by_user_id = auth.uid()
  or app.has_chapter_role(chapter_id, array['action_committee_chair', 'e_board_member', 'president_vp'])
  or app.is_admin()
)
with check (
  owner_user_id = auth.uid()
  or planned_by_user_id = auth.uid()
  or app.has_chapter_role(chapter_id, array['action_committee_chair', 'e_board_member', 'president_vp'])
  or app.is_admin()
);

create policy "luma_links_select_leaders_coaches_staff"
on app.luma_event_links for select to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "luma_links_manage_mock_safe"
on app.luma_event_links for all to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_admin())
with check (
  (app.is_chapter_leader(chapter_id) or app.is_admin())
  and status in ('not_linked', 'linked', 'mocked', 'disabled')
);

create policy "assignments_select_visible"
on app.assignments for select to authenticated
using (app.can_read_assignment(assignments));

create policy "assignments_insert_leaders_or_staff"
on app.assignments for insert to authenticated
with check (app.is_chapter_leader(chapter_id) or app.is_admin());

create policy "assignments_update_leaders_or_assignee_status"
on app.assignments for update to authenticated
using (
  app.is_chapter_leader(chapter_id)
  or app.is_admin()
  or assigned_to_user_id = auth.uid()
  or app.has_chapter_role(chapter_id, array[assigned_to_role_key])
)
with check (
  app.is_chapter_leader(chapter_id)
  or app.is_admin()
  or (
    (
      assigned_to_user_id = auth.uid()
      or app.has_chapter_role(chapter_id, array[assigned_to_role_key])
    )
    and status in ('not_started', 'in_progress', 'submitted', 'changes_requested')
  )
);

create policy "evidence_select_scoped"
on app.evidence_items for select to authenticated
using (
  submitted_by_user_id = auth.uid()
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "evidence_insert_submitter_for_visible_work"
on app.evidence_items for insert to authenticated
with check (
  submitted_by_user_id = auth.uid()
  and sharing_status = 'submitted'
  and status = 'pending_review'
  and (
    (assignment_id is not null and app.can_submit_evidence_for_assignment(assignment_id, chapter_id))
    or (chapter_event_id is not null and app.can_submit_evidence_for_chapter_event(chapter_event_id, chapter_id))
  )
);

create policy "evidence_update_submitter_pending_or_staff"
on app.evidence_items for update to authenticated
using (
  app.is_admin()
  or (
    submitted_by_user_id = auth.uid()
    and status = 'pending_review'
    and sharing_status in ('submitted', 'in_hq_review')
  )
)
with check (
  app.is_admin()
  or (
    submitted_by_user_id = auth.uid()
    and status = 'pending_review'
    and sharing_status in ('submitted', 'in_hq_review')
  )
);

create policy "approvals_select_scoped"
on app.approvals for select to authenticated
using (
  app.is_admin()
  or exists (
    select 1
    from app.evidence_items evidence
    where evidence.id = approvals.evidence_item_id
      and evidence.submitted_by_user_id = auth.uid()
  )
);

create policy "approvals_insert_hq_staff_only"
on app.approvals for insert to authenticated
with check (app.is_admin());

create policy "points_events_select_scoped"
on app.points_events for select to authenticated
using (
  awarded_to_user_id = auth.uid()
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "points_events_insert_leaders_or_staff"
on app.points_events for insert to authenticated
with check (app.is_chapter_leader(chapter_id) or app.is_admin());

create policy "kpi_events_select_scoped"
on app.kpi_events for select to authenticated
using (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "kpi_events_insert_leaders_or_staff"
on app.kpi_events for insert to authenticated
with check (app.is_chapter_leader(chapter_id) or app.is_admin());

create policy "events_select_scoped"
on app.events for select to authenticated
using (
  actor_user_id = auth.uid()
  or (chapter_id is not null and app.is_chapter_leader(chapter_id))
  or (chapter_id is not null and app.is_coach_for_chapter(chapter_id))
  or app.is_admin()
);

create policy "events_insert_actor_or_staff"
on app.events for insert to authenticated
with check (
  (
    actor_user_id = auth.uid()
    and (
      chapter_id is null
      or app.is_chapter_member(chapter_id)
      or app.is_coach_for_chapter(chapter_id)
    )
  )
  or app.is_admin()
);

create policy "integration_events_select_staff_only"
on app.integration_events for select to authenticated
using (app.is_admin() or app.is_ds_admin());

create policy "integration_events_insert_recorded_or_mocked"
on app.integration_events for insert to authenticated
with check (
  (
    app.is_chapter_leader(chapter_id)
    or app.is_coach_for_chapter(chapter_id)
    or app.is_admin()
  )
  and status in ('recorded', 'approved_for_mock', 'mocked', 'disabled')
);

create policy "integration_events_update_ds_admin_only"
on app.integration_events for update to authenticated
using (app.can_manage_integrations())
with check (app.can_manage_integrations());

create policy "automation_outbox_select_staff_only"
on app.automation_outbox for select to authenticated
using (app.is_admin() or app.is_ds_admin());

create policy "automation_outbox_insert_recorded_or_mocked"
on app.automation_outbox for insert to authenticated
with check (
  (
    app.is_chapter_leader(chapter_id)
    or app.is_coach_for_chapter(chapter_id)
    or app.is_admin()
  )
  and status in ('recorded', 'approved_for_mock', 'mocked', 'disabled')
);

create policy "automation_outbox_update_ds_admin_only"
on app.automation_outbox for update to authenticated
using (app.can_manage_integrations())
with check (app.can_manage_integrations());

create policy "audit_logs_select_staff_only"
on app.audit_logs for select to authenticated
using (app.is_admin() or app.is_ds_admin() or app.is_super_admin());

create policy "audit_logs_insert_staff_only"
on app.audit_logs for insert to authenticated
with check (app.is_admin() or app.is_ds_admin() or app.is_super_admin());
