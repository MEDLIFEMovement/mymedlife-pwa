-- Goal 18: local leader assignment creation.
-- This keeps browser save controls, production auth, and external sends disabled.

drop policy if exists "assignments_insert_leaders_or_staff"
on app.assignments;

create policy "assignments_insert_via_create_function_only"
on app.assignments for insert to authenticated
with check (false);

create or replace function app.can_create_chapter_assignment(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_super_admin()
    or (
      app.is_chapter_leader(chapter_uuid)
      and not app.has_staff_role(array['coach', 'admin', 'ds_admin'])
    )
$$;

create or replace function app.create_chapter_assignment(
  chapter_uuid uuid,
  campaign_uuid uuid,
  assignment_title text,
  assignment_instructions text,
  evidence_required_input text,
  kpi_key_input text,
  points_input integer default 0,
  assigned_to_user_uuid uuid default null,
  assigned_to_role text default null,
  phase_uuid uuid default null,
  action_template_uuid uuid default null,
  action_committee_uuid uuid default null,
  chapter_event_uuid uuid default null,
  due_at_input timestamptz default null,
  priority_input app.assignment_priority default 'normal',
  expected_output_input text default null,
  support_role_labels_input text[] default '{}'::text[],
  late_next_step_input text default null
)
returns table (
  assignment_id uuid,
  event_id uuid,
  integration_event_id uuid,
  outbox_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  new_assignment_uuid uuid := gen_random_uuid();
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_title text := btrim(coalesce(assignment_title, ''));
  normalized_instructions text := btrim(coalesce(assignment_instructions, ''));
  normalized_evidence text := btrim(coalesce(evidence_required_input, ''));
  normalized_kpi text := btrim(coalesce(kpi_key_input, ''));
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.can_create_chapter_assignment(chapter_uuid) then
    raise exception 'actor cannot create assignments for this chapter' using errcode = '42501';
  end if;

  if assigned_to_user_uuid is null and assigned_to_role is null then
    raise exception 'assignment must target a user or role' using errcode = '22023';
  end if;

  if char_length(normalized_title) < 5 then
    raise exception 'assignment title is too short' using errcode = '22023';
  end if;

  if char_length(normalized_instructions) < 12 then
    raise exception 'assignment instructions must explain the action' using errcode = '22023';
  end if;

  if char_length(normalized_evidence) < 5 then
    raise exception 'assignment evidence requirement is too short' using errcode = '22023';
  end if;

  if char_length(normalized_kpi) < 2 then
    raise exception 'assignment KPI key is required' using errcode = '22023';
  end if;

  if points_input < 0 or points_input > 1000 then
    raise exception 'assignment points must be between 0 and 1000' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from app.campaigns campaigns
    where campaigns.id = campaign_uuid
      and campaigns.chapter_id = chapter_uuid
  ) then
    raise exception 'campaign does not belong to chapter' using errcode = '22023';
  end if;

  if phase_uuid is not null and not exists (
    select 1
    from app.phases phases
    where phases.id = phase_uuid
      and phases.chapter_id = chapter_uuid
      and phases.campaign_id = campaign_uuid
  ) then
    raise exception 'phase does not belong to campaign and chapter' using errcode = '22023';
  end if;

  if action_template_uuid is not null and not exists (
    select 1
    from app.action_templates templates
    where templates.id = action_template_uuid
      and templates.chapter_id = chapter_uuid
      and templates.campaign_id = campaign_uuid
  ) then
    raise exception 'action template does not belong to campaign and chapter' using errcode = '22023';
  end if;

  if action_committee_uuid is not null and not exists (
    select 1
    from app.action_committees committees
    where committees.id = action_committee_uuid
      and committees.chapter_id = chapter_uuid
  ) then
    raise exception 'action committee does not belong to chapter' using errcode = '22023';
  end if;

  if chapter_event_uuid is not null and not exists (
    select 1
    from app.chapter_events chapter_events
    where chapter_events.id = chapter_event_uuid
      and chapter_events.chapter_id = chapter_uuid
      and chapter_events.campaign_id = campaign_uuid
  ) then
    raise exception 'chapter event does not belong to campaign and chapter' using errcode = '22023';
  end if;

  if assigned_to_user_uuid is not null and not exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = assigned_to_user_uuid
      and memberships.chapter_id = chapter_uuid
      and memberships.status = 'approved'
  ) then
    raise exception 'assigned user is not an approved chapter member' using errcode = '22023';
  end if;

  if assigned_to_role is not null and not exists (
    select 1
    from app.roles roles
    where roles.key = assigned_to_role
      and roles.chapter_scoped = true
  ) then
    raise exception 'assigned role must be a chapter-scoped role' using errcode = '22023';
  end if;

  insert into app.assignments (
    id,
    chapter_id,
    campaign_id,
    phase_id,
    action_template_id,
    action_committee_id,
    chapter_event_id,
    title,
    instructions,
    assigned_to_user_id,
    assigned_to_role_key,
    assigned_by_user_id,
    status,
    due_at,
    evidence_required,
    points,
    kpi_key,
    priority,
    expected_output,
    support_role_labels,
    late_next_step,
    risk_flagged
  ) values (
    new_assignment_uuid,
    chapter_uuid,
    campaign_uuid,
    phase_uuid,
    action_template_uuid,
    action_committee_uuid,
    chapter_event_uuid,
    normalized_title,
    normalized_instructions,
    assigned_to_user_uuid,
    assigned_to_role,
    actor_uuid,
    'not_started',
    due_at_input,
    normalized_evidence,
    points_input,
    normalized_kpi,
    priority_input,
    nullif(btrim(coalesce(expected_output_input, '')), ''),
    coalesce(support_role_labels_input, '{}'::text[]),
    nullif(btrim(coalesce(late_next_step_input, '')), ''),
    false
  );

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    campaign_id,
    assignment_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'action_assigned',
    actor_uuid,
    chapter_uuid,
    campaign_uuid,
    new_assignment_uuid,
    chapter_event_uuid,
    jsonb_build_object(
      'source', 'app.create_chapter_assignment',
      'assignmentTitle', normalized_title,
      'assignedToUserId', assigned_to_user_uuid,
      'assignedToRole', assigned_to_role,
      'liveExternalWrite', false
    ),
    'action_assigned:' || new_assignment_uuid::text
  );

  insert into app.integration_events (
    id,
    source_event_id,
    chapter_id,
    event_type,
    destination,
    external_object_type,
    external_object_id,
    status,
    payload,
    created_by
  ) values (
    integration_event_uuid,
    event_uuid,
    chapter_uuid,
    'action_assigned',
    'internal',
    'assignment',
    new_assignment_uuid::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.create_chapter_assignment',
      'liveExternalWrite', false
    ),
    actor_uuid
  );

  insert into app.automation_outbox (
    id,
    source_event_id,
    integration_event_id,
    chapter_id,
    destination,
    event_type,
    payload,
    idempotency_key,
    status
  ) values (
    outbox_uuid,
    event_uuid,
    integration_event_uuid,
    chapter_uuid,
    'n8n',
    'action_assigned',
    jsonb_build_object(
      'source', 'app.create_chapter_assignment',
      'assignmentId', new_assignment_uuid,
      'liveExternalWrite', false
    ),
    'action_assigned:' || new_assignment_uuid::text,
    'disabled'
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    chapter_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    chapter_uuid,
    'action_assigned',
    'assignments',
    new_assignment_uuid,
    null,
    jsonb_build_object(
      'status', 'not_started',
      'assignmentTitle', normalized_title,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid
    ),
    'Local Goal 18 leader assignment creation path.'
  );

  assignment_id := new_assignment_uuid;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_create_chapter_assignment(uuid) to authenticated;
grant execute on function app.create_chapter_assignment(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer,
  uuid,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  timestamptz,
  app.assignment_priority,
  text,
  text[],
  text
) to authenticated;
