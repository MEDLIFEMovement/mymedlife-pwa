-- Goal 500: allow the hosted Luma pilot attendance import to persist
-- attendance-backed points through a narrow audited function while direct
-- browser inserts into app.points_events remain blocked.

create or replace function app.record_luma_attendance_points_event(
  chapter_event_uuid uuid,
  awarded_to_user_uuid uuid,
  points_delta_input integer,
  reason_text text
)
returns setof app.points_events
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_event app.chapter_events%rowtype;
  existing_row app.points_events%rowtype;
  created_row app.points_events%rowtype;
  normalized_reason text := btrim(coalesce(reason_text, ''));
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.can_manage_integrations() then
    raise exception 'DS Admin or Super Admin required' using errcode = '42501';
  end if;

  if points_delta_input <= 0 then
    raise exception 'points delta must be positive' using errcode = '22023';
  end if;

  if normalized_reason = '' then
    raise exception 'reason is required' using errcode = '22023';
  end if;

  if normalized_reason not like 'Luma pilot attendance confirmed for %' then
    raise exception 'reason must describe the Luma attendance pilot' using errcode = '22023';
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
    from app.luma_event_links
    where chapter_event_id = target_event.id
  ) then
    raise exception 'chapter event must be linked to a Luma event' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = awarded_to_user_uuid
      and memberships.chapter_id = target_event.chapter_id
      and memberships.status = 'approved'
  ) then
    raise exception 'awarded member must have an approved chapter membership' using errcode = '22023';
  end if;

  select *
  into existing_row
  from app.points_events
  where chapter_event_id = target_event.id
    and awarded_to_user_id = awarded_to_user_uuid
    and reason like 'Luma pilot attendance confirmed for %'
  order by created_at asc
  limit 1;

  if found then
    return next existing_row;
    return;
  end if;

  insert into app.points_events (
    chapter_id,
    campaign_id,
    assignment_id,
    chapter_event_id,
    evidence_item_id,
    approval_id,
    awarded_to_user_id,
    points_delta,
    reason,
    created_by
  ) values (
    target_event.chapter_id,
    target_event.campaign_id,
    target_event.assignment_id,
    target_event.id,
    null,
    null,
    awarded_to_user_uuid,
    points_delta_input,
    normalized_reason,
    actor_uuid
  )
  returning *
  into created_row;

  return next created_row;
end;
$$;

revoke all on function app.record_luma_attendance_points_event(uuid, uuid, integer, text) from public;
grant execute on function app.record_luma_attendance_points_event(uuid, uuid, integer, text) to authenticated;
