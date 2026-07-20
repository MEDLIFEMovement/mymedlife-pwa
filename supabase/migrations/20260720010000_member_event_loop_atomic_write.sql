create or replace function app.record_member_event_loop_step(
  actor_uuid uuid,
  chapter_event_uuid uuid,
  operation_input text
)
returns table (
  result_code text,
  event_id uuid,
  points_awarded integer,
  attendance_count integer
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  operation_rsvp constant text := 'rsvp';
  operation_cancel_rsvp constant text := 'cancel_rsvp';
  operation_checkin constant text := 'checkin';
  event_rsvp_recorded constant text := 'event_rsvp_recorded';
  event_rsvp_cancelled constant text := 'event_rsvp_cancelled';
  event_attendance_recorded constant text := 'event_attendance_recorded';
  member_event_loop_source constant text := 'member_event_loop';
  target_profile app.profiles%rowtype;
  target_event app.chapter_events%rowtype;
  target_membership app.memberships%rowtype;
  latest_intent app.events%rowtype;
  existing_points app.points_events%rowtype;
  inserted_points_id uuid;
  next_attendance_count integer;
  next_attendance_rate numeric;
begin
  if operation_input not in (operation_rsvp, operation_cancel_rsvp, operation_checkin) then
    raise exception 'unsupported member event-loop operation' using errcode = '22023';
  end if;

  -- Serialize one member's intent and attendance writes for one event.
  perform pg_advisory_xact_lock(
    hashtextextended(chapter_event_uuid::text || ':' || actor_uuid::text, 0)
  );

  select *
  into target_profile
  from app.profiles
  where id = actor_uuid
    and status = 'active';

  if not found then
    raise exception 'active member profile not found' using errcode = 'P0002';
  end if;

  select *
  into target_event
  from app.chapter_events
  where id = chapter_event_uuid
  for update;

  if not found then
    raise exception 'chapter event not found' using errcode = 'P0002';
  end if;

  select *
  into target_membership
  from app.memberships
  where user_id = actor_uuid
    and chapter_id = target_event.chapter_id
    and status = 'approved'
  order by approved_at asc nulls last, created_at asc
  limit 1;

  if not found then
    raise exception 'approved chapter membership required' using errcode = '42501';
  end if;

  if target_event.status in ('completed', 'feedback_collected', 'shared', 'canceled') then
    raise exception 'member event loop is closed for this event' using errcode = '55000';
  end if;

  select *
  into latest_intent
  from app.events
  where chapter_event_id = chapter_event_uuid
    and actor_user_id = actor_uuid
    and event_type in (event_rsvp_recorded, event_rsvp_cancelled)
  order by occurred_at desc, created_at desc, id desc
  limit 1;

  select *
  into existing_points
  from app.points_events
  where chapter_event_id = chapter_event_uuid
    and awarded_to_user_id = actor_uuid
  order by created_at asc, id asc
  limit 1;

  if operation_input = operation_rsvp then
    if latest_intent.id is not null and latest_intent.event_type = event_rsvp_recorded then
      return query select
        'already_rsvpd'::text,
        target_event.id,
        0,
        coalesce(target_event.attendance_count, 0);
      return;
    end if;

    insert into app.events (
      event_type,
      actor_user_id,
      chapter_id,
      campaign_id,
      chapter_event_id,
      payload,
      correlation_id
    ) values (
      event_rsvp_recorded,
      actor_uuid,
      target_event.chapter_id,
      target_event.campaign_id,
      target_event.id,
      jsonb_build_object(
        'source', member_event_loop_source,
        'operation', operation_rsvp,
        'userId', actor_uuid,
        'userEmail', target_profile.email,
        'liveExternalWrite', false
      ),
      'member_event_loop:rsvp:' || target_event.id::text || ':' || actor_uuid::text
    );

    return query select
      'rsvp_recorded'::text,
      target_event.id,
      0,
      coalesce(target_event.attendance_count, 0);
    return;
  end if;

  if operation_input = operation_cancel_rsvp then
    if existing_points.id is not null then
      return query select
        'rsvp_cancel_blocked_checked_in'::text,
        target_event.id,
        existing_points.points_delta,
        coalesce(target_event.attendance_count, 0);
      return;
    end if;

    if latest_intent.id is null or latest_intent.event_type <> event_rsvp_recorded then
      return query select
        'rsvp_cancel_not_found'::text,
        target_event.id,
        0,
        coalesce(target_event.attendance_count, 0);
      return;
    end if;

    insert into app.events (
      event_type,
      actor_user_id,
      chapter_id,
      campaign_id,
      chapter_event_id,
      payload,
      correlation_id
    ) values (
      event_rsvp_cancelled,
      actor_uuid,
      target_event.chapter_id,
      target_event.campaign_id,
      target_event.id,
      jsonb_build_object(
        'source', member_event_loop_source,
        'operation', operation_cancel_rsvp,
        'userId', actor_uuid,
        'userEmail', target_profile.email,
        'previousRsvpEventId', latest_intent.id,
        'liveExternalWrite', false
      ),
      'member_event_loop:cancel_rsvp:' || target_event.id::text || ':' || actor_uuid::text
    );

    return query select
      'rsvp_cancelled'::text,
      target_event.id,
      0,
      coalesce(target_event.attendance_count, 0);
    return;
  end if;

  if existing_points.id is not null then
    select count(distinct awarded_to_user_id)::integer
    into next_attendance_count
    from app.points_events
    where chapter_event_id = target_event.id;

    return query select
      'already_checked_in'::text,
      target_event.id,
      existing_points.points_delta,
      next_attendance_count;
    return;
  end if;

  insert into app.points_events (
    chapter_id,
    campaign_id,
    chapter_event_id,
    awarded_to_user_id,
    points_delta,
    reason,
    created_by
  ) values (
    target_event.chapter_id,
    target_event.campaign_id,
    target_event.id,
    actor_uuid,
    20,
    'Attendance confirmed through the production-safe TEST event loop.',
    actor_uuid
  )
  returning id into inserted_points_id;

  select count(distinct awarded_to_user_id)::integer
  into next_attendance_count
  from app.points_events
  where chapter_event_id = target_event.id;

  next_attendance_rate := case
    when coalesce(target_event.eligible_member_count, 0) > 0
      then least(1, next_attendance_count::numeric / target_event.eligible_member_count)
    else null
  end;

  insert into app.events (
    event_type,
    actor_user_id,
    chapter_id,
    campaign_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_attendance_recorded,
    actor_uuid,
    target_event.chapter_id,
    target_event.campaign_id,
    target_event.id,
    jsonb_build_object(
      'source', member_event_loop_source,
      'checkedInUserId', actor_uuid,
      'attendanceCount', next_attendance_count,
      'pointsEventId', inserted_points_id,
      'pointsDelta', 20,
      'duplicatePointsPrevented', true,
      'liveExternalWrite', false
    ),
    'member_event_loop:checkin:' || target_event.id::text || ':' || actor_uuid::text
  );

  update app.chapter_events
  set attendance_count = next_attendance_count,
      attendance_rate = next_attendance_rate,
      updated_at = now()
  where id = target_event.id;

  return query select
    'checked_in'::text,
    target_event.id,
    20,
    next_attendance_count;
end;
$$;

revoke all on function app.record_member_event_loop_step(uuid, uuid, text)
from public, anon, authenticated;

grant execute on function app.record_member_event_loop_step(uuid, uuid, text)
to service_role;
