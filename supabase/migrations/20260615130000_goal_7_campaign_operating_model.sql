create type app.template_status as enum ('draft', 'active', 'archived');
create type app.readiness_status as enum ('not_ready', 'ready', 'validated', 'blocked', 'waived');
create type app.coach_validation_status as enum ('not_required', 'pending', 'validated', 'blocked', 'waived');
create type app.campaign_role_assignment_status as enum ('active', 'inactive', 'ended');
create type app.risk_severity as enum ('low', 'medium', 'high', 'critical');
create type app.risk_status as enum ('open', 'watching', 'escalated', 'resolved', 'dismissed');
create type app.risk_visibility as enum ('leader_visible', 'coach_private');
create type app.closeout_status as enum ('draft', 'submitted', 'validated', 'returned', 'archived');
create type app.assignment_priority as enum ('low', 'normal', 'high', 'urgent');

alter type app.evidence_type add value if not exists 'testimonial_text';
alter type app.evidence_type add value if not exists 'bridge_video';
alter type app.evidence_type add value if not exists 'event_photo';
alter type app.evidence_type add value if not exists 'attendance_log';
alter type app.evidence_type add value if not exists 'feedback_form';
alter type app.evidence_type add value if not exists 'tracker_screenshot';
alter type app.evidence_type add value if not exists 'planning_doc';
alter type app.evidence_type add value if not exists 'recap_note';
alter type app.evidence_type add value if not exists 'external_link';

alter table app.campaigns
add constraint campaigns_id_chapter_id_unique unique (id, chapter_id);

alter table app.phases
add constraint phases_id_chapter_campaign_unique unique (id, chapter_id, campaign_id);

create table app.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  registry_key text not null unique,
  name text not null,
  slug text not null unique,
  audience text not null,
  summary text not null,
  annual_order integer,
  status app.template_status not null default 'draft',
  default_kpis jsonb not null default '[]'::jsonb,
  source_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table app.campaigns
add column campaign_template_id uuid references app.campaign_templates(id),
add column semester text,
add column academic_year text;

alter table app.phases
add column phase_template_id uuid references app.campaign_phase_templates(id),
add column readiness_status app.readiness_status not null default 'not_ready',
add column coach_validation_status app.coach_validation_status not null default 'not_required',
add column required_outputs jsonb not null default '[]'::jsonb,
add column entry_criteria jsonb not null default '[]'::jsonb,
add column exit_criteria jsonb not null default '[]'::jsonb;

alter table app.assignments
add column priority app.assignment_priority not null default 'normal',
add column expected_output text,
add column support_role_labels text[] not null default '{}',
add column late_next_step text,
add column risk_flagged boolean not null default false;

create table app.campaign_role_assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null,
  user_id uuid not null references app.profiles(id) on delete cascade,
  role_key text not null,
  role_label text not null,
  lane text not null,
  status app.campaign_role_assignment_status not null default 'active',
  starts_at date not null default current_date,
  ends_at date,
  assigned_by uuid references app.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (campaign_id, chapter_id) references app.campaigns(id, chapter_id) on delete cascade,
  check (ends_at is null or ends_at >= starts_at)
);

create unique index campaign_role_assignments_active_unique
on app.campaign_role_assignments (campaign_id, user_id, role_key)
where status = 'active';

create table app.phase_readiness_reviews (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null,
  phase_id uuid not null,
  reviewer_user_id uuid not null references app.profiles(id),
  readiness_status app.readiness_status not null,
  decision_note text not null,
  blocker_summary text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (campaign_id, chapter_id) references app.campaigns(id, chapter_id) on delete cascade,
  foreign key (phase_id, chapter_id, campaign_id) references app.phases(id, chapter_id, campaign_id) on delete cascade,
  check (readiness_status <> 'not_ready')
);

create table app.risk_flags (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid references app.campaigns(id) on delete set null,
  phase_id uuid references app.phases(id) on delete set null,
  assignment_id uuid references app.assignments(id) on delete set null,
  chapter_event_id uuid references app.chapter_events(id) on delete set null,
  severity app.risk_severity not null,
  visibility app.risk_visibility not null default 'leader_visible',
  signal text not null,
  root_cause text,
  owner_user_id uuid references app.profiles(id),
  response_plan text not null,
  status app.risk_status not null default 'open',
  due_at timestamptz,
  created_by uuid references app.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.campaign_closeouts (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  campaign_id uuid not null,
  status app.closeout_status not null default 'draft',
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
  foreign key (campaign_id, chapter_id) references app.campaigns(id, chapter_id) on delete cascade
);

create index campaign_templates_status_idx on app.campaign_templates (status, annual_order);
create index campaign_phase_templates_campaign_order_idx on app.campaign_phase_templates (campaign_template_id, phase_order);
create index campaigns_template_idx on app.campaigns (campaign_template_id);
create index phases_readiness_idx on app.phases (chapter_id, campaign_id, readiness_status, coach_validation_status);
create index campaign_role_assignments_chapter_campaign_idx on app.campaign_role_assignments (chapter_id, campaign_id, status);
create index phase_readiness_reviews_chapter_campaign_idx on app.phase_readiness_reviews (chapter_id, campaign_id, phase_id, reviewed_at);
create index risk_flags_chapter_status_idx on app.risk_flags (chapter_id, status, severity, visibility);
create index campaign_closeouts_chapter_status_idx on app.campaign_closeouts (chapter_id, status);

create trigger set_campaign_templates_updated_at before update on app.campaign_templates
for each row execute function app.set_updated_at();
create trigger set_campaign_phase_templates_updated_at before update on app.campaign_phase_templates
for each row execute function app.set_updated_at();
create trigger set_campaign_role_assignments_updated_at before update on app.campaign_role_assignments
for each row execute function app.set_updated_at();
create trigger set_risk_flags_updated_at before update on app.risk_flags
for each row execute function app.set_updated_at();
create trigger set_campaign_closeouts_updated_at before update on app.campaign_closeouts
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
    or new.priority <> old.priority
    or new.expected_output is distinct from old.expected_output
    or new.support_role_labels is distinct from old.support_role_labels
    or new.late_next_step is distinct from old.late_next_step
    or new.risk_flagged <> old.risk_flagged
    or new.created_at <> old.created_at then
    raise exception 'assigned users can only update assignment status';
  end if;

  return new;
end;
$$;

create or replace function app.can_manage_campaign_templates()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_staff_role(array['admin', 'super_admin'])
$$;

alter table app.campaign_templates enable row level security;
alter table app.campaign_phase_templates enable row level security;
alter table app.campaign_role_assignments enable row level security;
alter table app.phase_readiness_reviews enable row level security;
alter table app.risk_flags enable row level security;
alter table app.campaign_closeouts enable row level security;

grant select, insert, update, delete on
  app.campaign_templates,
  app.campaign_phase_templates,
  app.campaign_role_assignments,
  app.phase_readiness_reviews,
  app.risk_flags,
  app.campaign_closeouts
to authenticated, service_role;

grant usage, select on all sequences in schema app to authenticated, service_role;
grant execute on function app.can_manage_campaign_templates() to authenticated, service_role;

create policy "campaign_templates_select_authenticated"
on app.campaign_templates for select to authenticated
using (true);

create policy "campaign_templates_manage_hq"
on app.campaign_templates for all to authenticated
using (app.can_manage_campaign_templates())
with check (app.can_manage_campaign_templates());

create policy "campaign_phase_templates_select_authenticated"
on app.campaign_phase_templates for select to authenticated
using (true);

create policy "campaign_phase_templates_manage_hq"
on app.campaign_phase_templates for all to authenticated
using (app.can_manage_campaign_templates())
with check (app.can_manage_campaign_templates());

create policy "campaign_role_assignments_select_scoped"
on app.campaign_role_assignments for select to authenticated
using (
  app.is_chapter_member(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "campaign_role_assignments_manage_leaders_or_staff"
on app.campaign_role_assignments for all to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_admin())
with check (
  app.is_admin()
  or (
    app.is_chapter_leader(chapter_id)
    and assigned_by = auth.uid()
  )
);

create policy "phase_readiness_reviews_select_leaders_coaches_staff"
on app.phase_readiness_reviews for select to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "phase_readiness_reviews_insert_leaders_coaches_staff"
on app.phase_readiness_reviews for insert to authenticated
with check (
  app.is_admin()
  or (
    app.is_coach_for_chapter(chapter_id)
    and reviewer_user_id = auth.uid()
    and readiness_status in ('ready', 'validated', 'blocked', 'waived')
  )
  or (
    app.is_chapter_leader(chapter_id)
    and reviewer_user_id = auth.uid()
    and readiness_status in ('ready', 'blocked')
  )
);

create policy "risk_flags_select_leaders_coaches_staff"
on app.risk_flags for select to authenticated
using (
  app.is_admin()
  or app.is_coach_for_chapter(chapter_id)
  or (
    visibility = 'leader_visible'
    and app.is_chapter_leader(chapter_id)
  )
);

create policy "risk_flags_insert_leaders_coaches_staff"
on app.risk_flags for insert to authenticated
with check (
  app.is_admin()
  or (
    app.is_coach_for_chapter(chapter_id)
    and created_by = auth.uid()
    and visibility in ('leader_visible', 'coach_private')
  )
  or (
    app.is_chapter_leader(chapter_id)
    and created_by = auth.uid()
    and visibility = 'leader_visible'
  )
);

create policy "risk_flags_update_leaders_coaches_staff"
on app.risk_flags for update to authenticated
using (
  app.is_admin()
  or app.is_coach_for_chapter(chapter_id)
  or (
    visibility = 'leader_visible'
    and app.is_chapter_leader(chapter_id)
  )
)
with check (
  app.is_admin()
  or app.is_coach_for_chapter(chapter_id)
  or (
    visibility = 'leader_visible'
    and app.is_chapter_leader(chapter_id)
  )
);

create policy "campaign_closeouts_select_leaders_coaches_staff"
on app.campaign_closeouts for select to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin());

create policy "campaign_closeouts_insert_leaders_or_staff"
on app.campaign_closeouts for insert to authenticated
with check (
  app.is_admin()
  or (
    app.is_chapter_leader(chapter_id)
    and submitted_by = auth.uid()
    and status in ('draft', 'submitted')
  )
);

create policy "campaign_closeouts_update_leaders_coaches_staff"
on app.campaign_closeouts for update to authenticated
using (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id) or app.is_admin())
with check (
  app.is_admin()
  or (
    app.is_chapter_leader(chapter_id)
    and (submitted_by is null or submitted_by = auth.uid())
    and status in ('draft', 'submitted')
  )
  or (
    app.is_coach_for_chapter(chapter_id)
    and (validated_by is null or validated_by = auth.uid())
    and status in ('validated', 'returned')
  )
);
