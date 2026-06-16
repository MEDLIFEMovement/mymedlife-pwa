-- Goal 14: first local Supabase write path for starting an assignment.
-- This migration stays local-first. It does not add production auth, browser
-- sign-in, proof uploads, or external integration sends.

create or replace function app.can_start_assignment_action(assignment_row app.assignments)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select assignment_row.status in ('not_started', 'changes_requested')
    and (
      assignment_row.assigned_to_user_id = auth.uid()
      or app.has_chapter_role(
        assignment_row.chapter_id,
        array[assignment_row.assigned_to_role_key]
      )
      or (
        assignment_row.assigned_to_role_key = 'coach'
        and app.is_coach_for_chapter(assignment_row.chapter_id)
      )
      or app.is_super_admin()
    )
$$;

create or replace function app.enforce_assignment_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
declare
  is_action_start_function boolean :=
    current_user = 'postgres'
    and current_setting('app.assignment_write_context', true) = 'start_assignment_action';
begin
  if new.status = 'in_progress'
    and old.status in ('not_started', 'changes_requested')
    and not is_action_start_function then
    raise exception 'assignment start must use app.start_assignment_action';
  end if;

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

create or replace function app.start_assignment_action(assignment_uuid uuid)
returns table (
  assignment_id uuid,
  previous_status app.assignment_status,
  next_status app.assignment_status,
  event_id uuid,
  integration_event_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_assignment app.assignments%rowtype;
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  select *
  into target_assignment
  from app.assignments
  where id = assignment_uuid
  for update;

  if not found then
    raise exception 'assignment not found' using errcode = 'P0002';
  end if;

  if not app.can_start_assignment_action(target_assignment) then
    raise exception 'actor cannot start this assignment' using errcode = '42501';
  end if;

  perform set_config('app.assignment_write_context', 'start_assignment_action', true);

  update app.assignments
  set status = 'in_progress'
  where id = target_assignment.id;

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
    'action_started',
    actor_uuid,
    target_assignment.chapter_id,
    target_assignment.campaign_id,
    target_assignment.id,
    target_assignment.chapter_event_id,
    jsonb_build_object(
      'source', 'app.start_assignment_action',
      'previousStatus', target_assignment.status,
      'nextStatus', 'in_progress',
      'mockSafe', true
    ),
    'action_started:' || target_assignment.id::text || ':' || actor_uuid::text
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
    target_assignment.chapter_id,
    'action_started',
    'internal',
    'assignment',
    target_assignment.id::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.start_assignment_action',
      'liveExternalWrite', false
    ),
    actor_uuid
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
    target_assignment.chapter_id,
    'action_started',
    'assignments',
    target_assignment.id,
    jsonb_build_object('status', target_assignment.status),
    jsonb_build_object(
      'status', 'in_progress',
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid
    ),
    'Local Goal 14 action-start write path.'
  );

  assignment_id := target_assignment.id;
  previous_status := target_assignment.status;
  next_status := 'in_progress';
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_start_assignment_action(app.assignments) to authenticated;
grant execute on function app.start_assignment_action(uuid) to authenticated;
