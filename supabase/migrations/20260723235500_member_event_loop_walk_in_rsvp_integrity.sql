alter function app.record_member_event_loop_step(uuid, uuid, text)
rename to record_member_event_loop_step_without_walk_in_rsvp;

create function app.record_member_event_loop_step(
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
  target_profile app.profiles%rowtype;
  target_event app.chapter_events%rowtype;
  latest_intent app.events%rowtype;
begin
  if operation_input = 'checkin' then
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

    if not exists (
      select 1
      from app.memberships
      where user_id = actor_uuid
        and chapter_id = target_event.chapter_id
        and status = 'approved'
    ) then
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
      and event_type in ('event_rsvp_recorded', 'event_rsvp_cancelled')
    order by occurred_at desc, created_at desc, id desc
    limit 1;

    if latest_intent.id is null or latest_intent.event_type <> 'event_rsvp_recorded' then
      insert into app.events (
        event_type,
        actor_user_id,
        chapter_id,
        campaign_id,
        chapter_event_id,
        payload,
        correlation_id
      ) values (
        'event_rsvp_recorded',
        actor_uuid,
        target_event.chapter_id,
        target_event.campaign_id,
        target_event.id,
        jsonb_build_object(
          'source', 'member_event_loop',
          'operation', 'checkin',
          'walkIn', true,
          'userId', actor_uuid,
          'userEmail', target_profile.email,
          'liveExternalWrite', false
        ),
        'member_event_loop:rsvp:' || target_event.id::text || ':' || actor_uuid::text
      );
    end if;
  end if;

  return query
  select *
  from app.record_member_event_loop_step_without_walk_in_rsvp(
    actor_uuid,
    chapter_event_uuid,
    operation_input
  );
end;
$$;

revoke all on function app.record_member_event_loop_step_without_walk_in_rsvp(uuid, uuid, text)
from public, anon, authenticated, service_role;

revoke all on function app.record_member_event_loop_step(uuid, uuid, text)
from public, anon, authenticated;

grant execute on function app.record_member_event_loop_step(uuid, uuid, text)
to service_role;
