-- Goal 509: audited admin chapter management foundation.
-- This keeps chapter operations behind a DS Admin / Super Admin RPC so the app
-- does not need browser-direct table writes for chapter setup and ownership.

create or replace function app.admin_chapter_snapshot(chapter_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path = app, public
as $$
  select jsonb_build_object(
    'chapter', (
      select jsonb_build_object(
        'id', chapters.id,
        'name', chapters.name,
        'campus', chapters.campus,
        'region', chapters.region,
        'status', chapters.status
      )
      from app.chapters chapters
      where chapters.id = chapter_uuid
    ),
    'coachAssignments', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', coach_assignments.id,
          'coachUserId', coach_assignments.coach_user_id,
          'status', coach_assignments.status,
          'startsAt', coach_assignments.starts_at,
          'endsAt', coach_assignments.ends_at
        )
        order by coach_assignments.created_at
      )
      from app.coach_chapter_assignments coach_assignments
      where coach_assignments.chapter_id = chapter_uuid
    ), '[]'::jsonb),
    'studentLeaders', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', memberships.id,
          'userId', memberships.user_id,
          'roleKey', memberships.role_key,
          'status', memberships.status
        )
        order by memberships.role_key, memberships.created_at
      )
      from app.memberships memberships
      where memberships.chapter_id = chapter_uuid
        and memberships.role_key in (
          'action_committee_chair',
          'e_board_member',
          'president_vp'
        )
    ), '[]'::jsonb),
    'activeMemberCount', (
      select count(*)::int
      from app.memberships memberships
      where memberships.chapter_id = chapter_uuid
        and memberships.status = 'approved'
    ),
    'activeEventCount', (
      select count(*)::int
      from app.chapter_events chapter_events
      where chapter_events.chapter_id = chapter_uuid
        and chapter_events.status <> 'canceled'
    ),
    'historicalRecordCount', (
      select
        (
          select count(*)::int
          from app.events events
          where events.chapter_id = chapter_uuid
        )
        + (
          select count(*)::int
          from app.points_events points_events
          where points_events.chapter_id = chapter_uuid
        )
        + (
          select count(*)::int
          from app.kpi_events kpi_events
          where kpi_events.chapter_id = chapter_uuid
        )
        + (
          select count(*)::int
          from app.audit_logs audit_logs
          where audit_logs.chapter_id = chapter_uuid
        )
    )
  )
$$;

create or replace function app.admin_manage_chapter(
  operation_input text,
  chapter_uuid uuid default null,
  name_input text default null,
  campus_input text default null,
  region_input text default null,
  status_input text default null,
  target_user_uuid uuid default null,
  role_key_input text default null,
  audit_reason_input text default null
)
returns table (
  operation text,
  chapter_id uuid,
  membership_id uuid,
  coach_assignment_id uuid,
  audit_log_id uuid,
  chapter_status text,
  active_member_count integer,
  active_event_count integer,
  historical_record_count integer
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  normalized_operation text := btrim(coalesce(operation_input, ''));
  normalized_name text := nullif(btrim(coalesce(name_input, '')), '');
  normalized_campus text := nullif(btrim(coalesce(campus_input, '')), '');
  normalized_region text := nullif(btrim(coalesce(region_input, '')), '');
  normalized_status text := nullif(btrim(coalesce(status_input, '')), '');
  normalized_role text := nullif(btrim(coalesce(role_key_input, '')), '');
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
  changed_chapter app.chapters%rowtype;
  changed_membership app.memberships%rowtype;
  changed_coach_assignment app.coach_chapter_assignments%rowtype;
  audit_uuid uuid := gen_random_uuid();
  before_snapshot jsonb := null;
  after_snapshot jsonb;
  target_chapter_uuid uuid := chapter_uuid;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.is_ds_admin() then
    raise exception 'DS Admin or Super Admin access required'
      using errcode = '42501';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'admin chapter change reason must be at least 12 characters'
      using errcode = '22023';
  end if;

  perform set_config('app.admin_access_change', 'enabled', true);

  if normalized_operation = 'create_chapter' then
    if normalized_name is null or normalized_campus is null then
      raise exception 'chapter name and campus are required for create_chapter'
        using errcode = '22023';
    end if;

    insert into app.chapters (
      name,
      campus,
      region,
      status,
      created_by
    ) values (
      normalized_name,
      normalized_campus,
      normalized_region,
      coalesce(normalized_status, 'active')::app.chapter_status,
      actor_uuid
    )
    returning * into changed_chapter;

    target_chapter_uuid := changed_chapter.id;
  else
    if target_chapter_uuid is null then
      raise exception 'chapter_uuid is required for this admin chapter operation'
        using errcode = '22023';
    end if;

    perform 1
    from app.chapters chapters
    where chapters.id = target_chapter_uuid
    for update;

    if not found then
      raise exception 'target chapter not found' using errcode = 'P0002';
    end if;

    before_snapshot := app.admin_chapter_snapshot(target_chapter_uuid);
  end if;

  if normalized_operation = 'update_chapter' then
    update app.chapters chapters
    set name = coalesce(normalized_name, chapters.name),
        campus = coalesce(normalized_campus, chapters.campus),
        region = coalesce(normalized_region, chapters.region),
        status = coalesce(normalized_status::app.chapter_status, chapters.status)
    where chapters.id = target_chapter_uuid
    returning * into changed_chapter;
  elsif normalized_operation = 'archive_chapter' then
    update app.chapters
    set status = 'archived'
    where id = target_chapter_uuid
    returning * into changed_chapter;
  elsif normalized_operation = 'disable_chapter' then
    update app.chapters
    set status = 'inactive'
    where id = target_chapter_uuid
    returning * into changed_chapter;
  elsif normalized_operation = 'assign_coach' then
    if target_user_uuid is null then
      raise exception 'target_user_uuid is required for assign_coach'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from app.staff_role_assignments staff
      where staff.user_id = target_user_uuid
        and staff.role_key = 'coach'
        and staff.status = 'active'
    ) then
      raise exception 'target user needs an active coach role before chapter assignment'
        using errcode = '22023';
    end if;

    update app.coach_chapter_assignments coach_assignments
    set status = 'ended',
        ends_at = current_date,
        updated_at = now(),
        handoff_reason = normalized_reason
    where coach_assignments.chapter_id = target_chapter_uuid
      and coach_assignments.status = 'active'
      and coach_assignments.coach_user_id <> target_user_uuid;

    select *
    into changed_coach_assignment
    from app.coach_chapter_assignments coach_assignments
    where coach_assignments.chapter_id = target_chapter_uuid
      and coach_assignments.coach_user_id = target_user_uuid
      and coach_assignments.status = 'active'
    limit 1;

    if not found then
      insert into app.coach_chapter_assignments (
        coach_user_id,
        chapter_id,
        coach_type,
        status,
        starts_at,
        assigned_by,
        handoff_reason
      ) values (
        target_user_uuid,
        target_chapter_uuid,
        'portfolio',
        'active',
        current_date,
        actor_uuid,
        normalized_reason
      )
      returning * into changed_coach_assignment;
    end if;

    select *
    into changed_chapter
    from app.chapters
    where id = target_chapter_uuid;
  elsif normalized_operation = 'remove_coach' then
    update app.coach_chapter_assignments coach_assignments
    set status = 'ended',
        ends_at = current_date,
        updated_at = now(),
        handoff_reason = normalized_reason
    where coach_assignments.chapter_id = target_chapter_uuid
      and coach_assignments.status = 'active';

    select *
    into changed_coach_assignment
    from app.coach_chapter_assignments coach_assignments
    where coach_assignments.chapter_id = target_chapter_uuid
    order by coach_assignments.updated_at desc
    limit 1;

    select *
    into changed_chapter
    from app.chapters
    where id = target_chapter_uuid;
  elsif normalized_operation = 'assign_student_leader' then
    if target_user_uuid is null then
      raise exception 'target_user_uuid is required for assign_student_leader'
        using errcode = '22023';
    end if;

    if normalized_role not in (
      'action_committee_chair',
      'e_board_member',
      'president_vp'
    ) then
      raise exception 'assign_student_leader requires a student leader role'
        using errcode = '22023';
    end if;

    insert into app.memberships (
      user_id,
      chapter_id,
      role_key,
      status,
      approved_at,
      approved_by
    ) values (
      target_user_uuid,
      target_chapter_uuid,
      normalized_role,
      'approved',
      now(),
      actor_uuid
    )
    on conflict on constraint memberships_user_id_chapter_id_role_key_key
    do update set
      status = 'approved',
      approved_at = now(),
      approved_by = actor_uuid,
      updated_at = now()
    returning * into changed_membership;

    select *
    into changed_chapter
    from app.chapters
    where id = target_chapter_uuid;
  elsif normalized_operation = 'remove_student_leader' then
    if target_user_uuid is null then
      raise exception 'target_user_uuid is required for remove_student_leader'
        using errcode = '22023';
    end if;

    update app.memberships memberships
    set status = 'inactive',
        updated_at = now()
    where memberships.chapter_id = target_chapter_uuid
      and memberships.user_id = target_user_uuid
      and memberships.role_key in (
        'action_committee_chair',
        'e_board_member',
        'president_vp'
      )
      and memberships.status <> 'inactive';

    select *
    into changed_membership
    from app.memberships memberships
    where memberships.chapter_id = target_chapter_uuid
      and memberships.user_id = target_user_uuid
      and memberships.role_key in (
        'action_committee_chair',
        'e_board_member',
        'president_vp'
      )
    order by memberships.updated_at desc
    limit 1;

    select *
    into changed_chapter
    from app.chapters
    where id = target_chapter_uuid;
  elsif normalized_operation <> 'create_chapter' then
    raise exception 'unsupported admin chapter operation'
      using errcode = '22023';
  end if;

  if changed_chapter.id is null then
    raise exception 'admin chapter operation did not return a chapter'
      using errcode = 'P0002';
  end if;

  after_snapshot := app.admin_chapter_snapshot(changed_chapter.id);

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
    changed_chapter.id,
    'admin_chapter.' || normalized_operation,
    'chapters',
    changed_chapter.id,
    before_snapshot,
    after_snapshot,
    normalized_reason
  );

  return query
  select
    normalized_operation,
    changed_chapter.id,
    changed_membership.id,
    changed_coach_assignment.id,
    audit_uuid,
    changed_chapter.status::text,
    (after_snapshot ->> 'activeMemberCount')::integer,
    (after_snapshot ->> 'activeEventCount')::integer,
    (after_snapshot ->> 'historicalRecordCount')::integer;
end;
$$;

revoke all on function app.admin_chapter_snapshot(uuid) from public, anon;
revoke all on function app.admin_manage_chapter(text, uuid, text, text, text, text, uuid, text, text) from public, anon;

grant execute on function app.admin_manage_chapter(text, uuid, text, text, text, text, uuid, text, text) to authenticated, service_role;
