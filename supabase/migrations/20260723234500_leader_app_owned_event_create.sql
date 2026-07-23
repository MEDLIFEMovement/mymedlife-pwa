-- Create an app-owned chapter event before any external provider sync runs.
-- This transaction records only the operational event, one internal event,
-- and one audit row. Luma, messages, attendance, points, and exports stay off.

alter table app.chapter_events
  add column if not exists description text,
  add column if not exists location_type text,
  add column if not exists location_name text,
  add column if not exists virtual_url text,
  add column if not exists capacity integer,
  add column if not exists rsvp_deadline timestamptz,
  add column if not exists organizing_group text,
  add column if not exists campaign_label text,
  add column if not exists creation_request_id uuid;

alter table app.chapter_events
  drop constraint if exists chapter_events_location_type_valid;
alter table app.chapter_events
  add constraint chapter_events_location_type_valid
  check (
    location_type is null
    or location_type in ('in_person', 'virtual', 'hybrid')
  );

alter table app.chapter_events
  drop constraint if exists chapter_events_capacity_positive;
alter table app.chapter_events
  add constraint chapter_events_capacity_positive
  check (capacity is null or capacity > 0);

alter table app.chapter_events
  drop constraint if exists chapter_events_rsvp_deadline_before_start;
alter table app.chapter_events
  add constraint chapter_events_rsvp_deadline_before_start
  check (
    rsvp_deadline is null
    or starts_at is null
    or rsvp_deadline <= starts_at
  );

create unique index if not exists chapter_events_creation_request_unique
on app.chapter_events (creation_request_id)
where creation_request_id is not null;

create unique index if not exists events_chapter_event_created_request_unique
on app.events (correlation_id)
where event_type = 'chapter_event_created' and correlation_id is not null;

drop policy if exists "chapter_events_insert_organizers" on app.chapter_events;

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
    or new.description is distinct from old.description
    or new.location_type is distinct from old.location_type
    or new.location_name is distinct from old.location_name
    or new.virtual_url is distinct from old.virtual_url
    or new.capacity is distinct from old.capacity
    or new.rsvp_deadline is distinct from old.rsvp_deadline
    or new.organizing_group is distinct from old.organizing_group
    or new.campaign_label is distinct from old.campaign_label
    or new.creation_request_id is distinct from old.creation_request_id
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

revoke execute on function app.enforce_chapter_event_update_bounds()
from public, anon, authenticated, service_role;

create or replace function app.create_chapter_event_for_leader(
  request_uuid uuid,
  chapter_uuid uuid,
  title_input text,
  event_type_input text,
  description_input text,
  starts_at_input timestamptz,
  ends_at_input timestamptz,
  location_type_input text,
  location_name_input text,
  virtual_url_input text,
  capacity_input integer,
  rsvp_deadline_input timestamptz,
  organizing_group_input text,
  campaign_label_input text,
  audit_reason_input text
)
returns table (
  chapter_event_id uuid,
  event_id uuid,
  audit_log_id uuid,
  deduplicated boolean
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  normalized_title text := btrim(coalesce(title_input, ''));
  normalized_event_type text := lower(btrim(coalesce(event_type_input, '')));
  normalized_description text := nullif(btrim(coalesce(description_input, '')), '');
  normalized_location_type text := replace(
    lower(btrim(coalesce(location_type_input, ''))),
    '-',
    '_'
  );
  normalized_location_name text := nullif(btrim(coalesce(location_name_input, '')), '');
  normalized_virtual_url text := nullif(btrim(coalesce(virtual_url_input, '')), '');
  normalized_organizing_group text := btrim(coalesce(organizing_group_input, ''));
  normalized_campaign_label text := nullif(btrim(coalesce(campaign_label_input, '')), '');
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
  target_chapter app.chapters%rowtype;
  existing_event_uuid uuid;
  chapter_event_uuid uuid := gen_random_uuid();
  internal_event_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  correlation_key text := 'chapter_event_created:' || request_uuid::text;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if request_uuid is null then
    raise exception 'event creation request id is required' using errcode = '22023';
  end if;

  select *
  into target_chapter
  from app.chapters
  where id = chapter_uuid;

  if not found or target_chapter.status <> 'active' then
    raise exception 'active chapter not found' using errcode = 'P0002';
  end if;

  if not app.is_chapter_leader(chapter_uuid) and not app.is_admin() then
    raise exception 'actor cannot create chapter events' using errcode = '42501';
  end if;

  select events.id
  into existing_event_uuid
  from app.chapter_events events
  where events.creation_request_id = request_uuid
    and events.planned_by_user_id = actor_uuid;

  if found then
    return query
    select
      existing_event_uuid,
      internal_events.id,
      audit_logs.id,
      true
    from app.events internal_events
    join app.audit_logs audit_logs
      on audit_logs.target_id = existing_event_uuid
      and audit_logs.action = 'chapter_event_created'
    where internal_events.correlation_id = correlation_key
      and internal_events.chapter_event_id = existing_event_uuid
    order by audit_logs.created_at asc
    limit 1;
    return;
  end if;

  if char_length(normalized_title) < 3 or char_length(normalized_title) > 160 then
    raise exception 'event title must be between 3 and 160 characters'
      using errcode = '22023';
  end if;

  if normalized_event_type not in (
    'info',
    'fundraiser',
    'recruitment',
    'slt',
    'volunteer',
    'workshop',
    'social',
    'other'
  ) then
    raise exception 'unsupported chapter event type' using errcode = '22023';
  end if;

  if starts_at_input is null then
    raise exception 'event start time is required' using errcode = '22023';
  end if;

  if ends_at_input is not null and ends_at_input < starts_at_input then
    raise exception 'event end time cannot be before start time'
      using errcode = '22023';
  end if;

  if normalized_location_type not in ('in_person', 'virtual', 'hybrid') then
    raise exception 'unsupported event location type' using errcode = '22023';
  end if;

  if normalized_location_type in ('in_person', 'hybrid')
    and normalized_location_name is null then
    raise exception 'in-person events require a location'
      using errcode = '22023';
  end if;

  if normalized_location_type in ('virtual', 'hybrid')
    and normalized_virtual_url is null then
    raise exception 'virtual events require a meeting link'
      using errcode = '22023';
  end if;

  if capacity_input is not null and capacity_input <= 0 then
    raise exception 'event capacity must be greater than zero'
      using errcode = '22023';
  end if;

  if rsvp_deadline_input is not null and rsvp_deadline_input > starts_at_input then
    raise exception 'RSVP deadline cannot be after event start'
      using errcode = '22023';
  end if;

  if char_length(normalized_organizing_group) < 3 then
    raise exception 'organizing group is required' using errcode = '22023';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'event creation reason must be at least 12 characters'
      using errcode = '22023';
  end if;

  insert into app.chapter_events (
    id,
    chapter_id,
    title,
    event_type,
    status,
    planned_by_user_id,
    owner_user_id,
    starts_at,
    ends_at,
    promotion_summary,
    description,
    location_type,
    location_name,
    virtual_url,
    capacity,
    rsvp_deadline,
    organizing_group,
    campaign_label,
    creation_request_id,
    warehouse_status
  ) values (
    chapter_event_uuid,
    chapter_uuid,
    normalized_title,
    normalized_event_type,
    'published',
    actor_uuid,
    actor_uuid,
    starts_at_input,
    ends_at_input,
    normalized_description,
    normalized_description,
    normalized_location_type,
    normalized_location_name,
    normalized_virtual_url,
    capacity_input,
    rsvp_deadline_input,
    normalized_organizing_group,
    normalized_campaign_label,
    request_uuid,
    'disabled'
  );

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    internal_event_uuid,
    'chapter_event_created',
    actor_uuid,
    chapter_uuid,
    chapter_event_uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'source', 'app.create_chapter_event_for_leader',
      'title', normalized_title,
      'eventType', normalized_event_type,
      'startsAt', starts_at_input,
      'locationType', normalized_location_type,
      'liveExternalWrite', false
    )),
    correlation_key
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    chapter_id,
    action,
    target_table,
    target_id,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    chapter_uuid,
    'chapter_event_created',
    'chapter_events',
    chapter_event_uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'title', normalized_title,
      'eventType', normalized_event_type,
      'status', 'published',
      'startsAt', starts_at_input,
      'endsAt', ends_at_input,
      'locationType', normalized_location_type,
      'locationName', normalized_location_name,
      'virtualUrl', normalized_virtual_url,
      'capacity', capacity_input,
      'rsvpDeadline', rsvp_deadline_input,
      'organizingGroup', normalized_organizing_group,
      'campaignLabel', normalized_campaign_label,
      'eventId', internal_event_uuid,
      'liveExternalWrite', false
    )),
    normalized_reason
  );

  return query
  select chapter_event_uuid, internal_event_uuid, audit_uuid, false;
end;
$$;

revoke all on function app.create_chapter_event_for_leader(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  text,
  text,
  text,
  integer,
  timestamptz,
  text,
  text,
  text
) from public;

grant execute on function app.create_chapter_event_for_leader(
  uuid,
  uuid,
  text,
  text,
  text,
  timestamptz,
  timestamptz,
  text,
  text,
  text,
  integer,
  timestamptz,
  text,
  text,
  text
) to authenticated;
