-- Goal 344: first local audited chapter-event authoritative update path.
-- This keeps browser writes, RSVP writes, attendance imports, points
-- materialization, Luma sync, outbox sends, and rollout evidence out of scope.

create or replace function app.can_update_chapter_event_authoritative_fields(
  chapter_event_row app.chapter_events
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_chapter_leader(chapter_event_row.chapter_id)
    or app.is_admin()
$$;

create or replace function app.enforce_chapter_event_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
declare
  is_authoritative_update_function boolean :=
    current_user = 'postgres'
    and coalesce(current_setting('app.chapter_event_write_context', true), '') =
      'update_chapter_event_authoritative_fields';
  is_system_seed boolean :=
    current_user = 'postgres'
    and auth.uid() is null;
begin
  if is_authoritative_update_function or is_system_seed then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.chapter_id is distinct from old.chapter_id
    or new.campaign_id is distinct from old.campaign_id
    or new.phase_id is distinct from old.phase_id
    or new.action_committee_id is distinct from old.action_committee_id
    or new.assignment_id is distinct from old.assignment_id
    or new.title is distinct from old.title
    or new.event_type is distinct from old.event_type
    or new.status is distinct from old.status
    or new.planned_by_user_id is distinct from old.planned_by_user_id
    or new.owner_user_id is distinct from old.owner_user_id
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
    or new.promotion_summary is distinct from old.promotion_summary
    or new.attendance_count is distinct from old.attendance_count
    or new.eligible_member_count is distinct from old.eligible_member_count
    or new.attendance_rate is distinct from old.attendance_rate
    or new.nps_score is distinct from old.nps_score
    or new.feedback_summary is distinct from old.feedback_summary
    or new.warehouse_status is distinct from old.warehouse_status
    or new.luma_event_link_id is distinct from old.luma_event_link_id
    or new.created_at is distinct from old.created_at then
    raise exception 'chapter event updates must use app.update_chapter_event_authoritative_fields';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_chapter_event_update_bounds on app.chapter_events;

create trigger enforce_chapter_event_update_bounds
before update on app.chapter_events
for each row
execute function app.enforce_chapter_event_update_bounds();

create or replace function app.update_chapter_event_authoritative_fields(
  chapter_event_uuid uuid,
  field_patch jsonb,
  audit_reason_input text
)
returns table (
  chapter_event_id uuid,
  updated_fields text[],
  event_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_event app.chapter_events%rowtype;
  next_status app.chapter_event_status;
  next_starts_at timestamptz;
  next_ends_at timestamptz;
  next_attendance_count integer;
  next_eligible_member_count integer;
  next_attendance_rate numeric;
  next_nps_score numeric;
  key text;
  changed_fields text[] := '{}'::text[];
  event_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if jsonb_typeof(field_patch) <> 'object' or field_patch = '{}'::jsonb then
    raise exception 'authoritative chapter event patch must be a non-empty object'
      using errcode = '22023';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'chapter event update reason must be at least 12 characters'
      using errcode = '22023';
  end if;

  select *
  into target_event
  from app.chapter_events
  where id = chapter_event_uuid
  for update;

  if not found then
    raise exception 'chapter event not found' using errcode = 'P0002';
  end if;

  if not app.can_update_chapter_event_authoritative_fields(target_event) then
    raise exception 'actor cannot update authoritative chapter event fields'
      using errcode = '42501';
  end if;

  next_status := target_event.status;
  next_starts_at := target_event.starts_at;
  next_ends_at := target_event.ends_at;
  next_attendance_count := target_event.attendance_count;
  next_eligible_member_count := target_event.eligible_member_count;
  next_attendance_rate := target_event.attendance_rate;
  next_nps_score := target_event.nps_score;

  for key in
    select jsonb_object_keys(field_patch)
  loop
    case key
      when 'status' then
        if jsonb_typeof(field_patch -> key) = 'null' then
          raise exception 'status cannot be null' using errcode = '22023';
        end if;

        next_status := (field_patch ->> key)::app.chapter_event_status;

        if next_status is distinct from target_event.status then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'starts_at' then
        next_starts_at := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::timestamptz
        end;

        if next_starts_at is distinct from target_event.starts_at then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'ends_at' then
        next_ends_at := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::timestamptz
        end;

        if next_ends_at is distinct from target_event.ends_at then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'attendance_count' then
        next_attendance_count := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::integer
        end;

        if next_attendance_count is distinct from target_event.attendance_count then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'eligible_member_count' then
        next_eligible_member_count := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::integer
        end;

        if next_eligible_member_count is distinct from target_event.eligible_member_count then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'attendance_rate' then
        next_attendance_rate := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::numeric
        end;

        if next_attendance_rate is distinct from target_event.attendance_rate then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'nps_score' then
        next_nps_score := case
          when jsonb_typeof(field_patch -> key) = 'null' then null
          else (field_patch ->> key)::numeric
        end;

        if next_nps_score is distinct from target_event.nps_score then
          changed_fields := array_append(changed_fields, key);
        end if;
      when 'promotion_summary', 'feedback_summary' then
        raise exception 'narrative chapter event updates remain blocked pending product decision'
          using errcode = '22023';
      else
        raise exception 'field % is outside the first audited chapter event update subset', key
          using errcode = '22023';
    end case;
  end loop;

  if array_length(changed_fields, 1) is null then
    raise exception 'no authoritative chapter event changes were requested'
      using errcode = '22023';
  end if;

  if next_ends_at is not null and next_starts_at is not null and next_ends_at < next_starts_at then
    raise exception 'event end time cannot be before start time' using errcode = '22023';
  end if;

  if next_attendance_count is not null and next_attendance_count < 0 then
    raise exception 'attendance count must be zero or greater' using errcode = '22023';
  end if;

  if next_eligible_member_count is not null and next_eligible_member_count < 0 then
    raise exception 'eligible member count must be zero or greater' using errcode = '22023';
  end if;

  if next_attendance_rate is not null and (next_attendance_rate < 0 or next_attendance_rate > 1) then
    raise exception 'attendance rate must be between 0 and 1' using errcode = '22023';
  end if;

  if next_nps_score is not null and (next_nps_score < -100 or next_nps_score > 100) then
    raise exception 'nps score must be between -100 and 100' using errcode = '22023';
  end if;

  perform set_config('app.chapter_event_write_context', 'update_chapter_event_authoritative_fields', true);

  update app.chapter_events
  set status = next_status,
      starts_at = next_starts_at,
      ends_at = next_ends_at,
      attendance_count = next_attendance_count,
      eligible_member_count = next_eligible_member_count,
      attendance_rate = next_attendance_rate,
      nps_score = next_nps_score
  where id = target_event.id;

  perform set_config('app.chapter_event_write_context', '', true);

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
    'chapter_event_authoritative_updated',
    actor_uuid,
    target_event.chapter_id,
    target_event.campaign_id,
    target_event.assignment_id,
    target_event.id,
    jsonb_build_object(
      'source', 'app.update_chapter_event_authoritative_fields',
      'changedFields', changed_fields,
      'liveExternalWrite', false
    ),
    'chapter_event_authoritative_updated:' || target_event.id::text || ':' || actor_uuid::text
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
    target_event.chapter_id,
    'chapter_event_authoritative_updated',
    'chapter_events',
    target_event.id,
    jsonb_strip_nulls(jsonb_build_object(
      'status', target_event.status,
      'starts_at', target_event.starts_at,
      'ends_at', target_event.ends_at,
      'attendance_count', target_event.attendance_count,
      'eligible_member_count', target_event.eligible_member_count,
      'attendance_rate', target_event.attendance_rate,
      'nps_score', target_event.nps_score
    )),
    jsonb_strip_nulls(jsonb_build_object(
      'status', next_status,
      'starts_at', next_starts_at,
      'ends_at', next_ends_at,
      'attendance_count', next_attendance_count,
      'eligible_member_count', next_eligible_member_count,
      'attendance_rate', next_attendance_rate,
      'nps_score', next_nps_score,
      'changedFields', changed_fields,
      'eventId', event_uuid
    )),
    normalized_reason
  );

  chapter_event_id := target_event.id;
  updated_fields := changed_fields;
  event_id := event_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_update_chapter_event_authoritative_fields(app.chapter_events) to authenticated;
grant execute on function app.update_chapter_event_authoritative_fields(uuid, jsonb, text) to authenticated;
