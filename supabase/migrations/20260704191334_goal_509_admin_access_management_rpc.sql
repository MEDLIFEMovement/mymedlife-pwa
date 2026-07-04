-- Goal 509: audited admin user access management foundation.
-- This adds a server-side path for DS Admin / Super Admin access changes without
-- enabling browser-direct table writes or external sends.

create or replace function app.enforce_membership_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
  if current_setting('app.admin_access_change', true) = 'enabled'
    and app.is_ds_admin() then
    if new.id <> old.id
      or new.user_id <> old.user_id
      or new.chapter_id <> old.chapter_id
      or new.role_key <> old.role_key
      or new.requested_at <> old.requested_at
      or new.created_at <> old.created_at then
      raise exception 'admin access changes cannot rewrite membership identity'
        using errcode = '22023';
    end if;

    if new.status not in ('approved', 'inactive') then
      raise exception 'admin access changes can only approve or deactivate memberships'
        using errcode = '22023';
    end if;

    if new.status = 'approved'
      and (new.approved_by is null or new.approved_at is null) then
      raise exception 'admin access approval must record approved_at and approved_by'
        using errcode = '22023';
    end if;

    return new;
  end if;

  if not app.can_approve_chapter_membership(old.chapter_id) then
    raise exception 'memberships can only be updated by approved membership reviewers'
      using errcode = '42501';
  end if;

  if old.status <> 'requested' then
    raise exception 'only requested memberships can be approved'
      using errcode = '22023';
  end if;

  if new.status <> 'approved' then
    raise exception 'membership approval must set status to approved'
      using errcode = '22023';
  end if;

  if new.id <> old.id
    or new.user_id <> old.user_id
    or new.chapter_id <> old.chapter_id
    or new.role_key <> old.role_key
    or new.requested_at <> old.requested_at
    or new.created_at <> old.created_at then
    raise exception 'membership approval cannot rewrite identity or request metadata'
      using errcode = '22023';
  end if;

  if new.approved_by is null or new.approved_at is null then
    raise exception 'membership approval must record approved_at and approved_by'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function app.admin_get_user_workspace_summary(target_user_uuid uuid)
returns table (
  default_workspace text,
  allowed_workspaces text[]
)
language plpgsql
stable
security definer
set search_path = app, public
as $$
declare
  chapter_roles text[];
  staff_roles text[];
  has_student_access boolean;
  has_leader_access boolean;
  has_staff_preview boolean;
  has_staff_workspace boolean;
  has_admin_workspace boolean;
begin
  select coalesce(array_agg(distinct memberships.role_key), '{}'::text[])
  into chapter_roles
  from app.memberships memberships
  where memberships.user_id = target_user_uuid
    and memberships.status = 'approved';

  select coalesce(array_agg(distinct staff.role_key), '{}'::text[])
  into staff_roles
  from app.staff_role_assignments staff
  where staff.user_id = target_user_uuid
    and staff.status = 'active';

  has_student_access := cardinality(chapter_roles) > 0;
  has_leader_access := chapter_roles && array[
    'action_committee_chair',
    'e_board_member',
    'president_vp'
  ];
  has_staff_preview := staff_roles && array['coach', 'admin', 'ds_admin', 'super_admin'];
  has_staff_workspace := staff_roles && array['coach', 'admin', 'super_admin'];
  has_admin_workspace := staff_roles && array['ds_admin', 'super_admin'];

  allowed_workspaces := array_remove(array[
    case when has_student_access or has_staff_preview then 'student_app' end,
    case when has_leader_access or has_staff_preview then 'leader_command_center' end,
    case when has_staff_workspace then 'staff_command_center' end,
    case when has_admin_workspace then 'admin_backend' end
  ], null);

  default_workspace := case
    when staff_roles && array['ds_admin', 'super_admin'] then 'admin_backend'
    when has_staff_workspace then 'staff_command_center'
    when has_leader_access then 'leader_command_center'
    when has_student_access then 'student_app'
    else 'student_app'
  end;

  return next;
end;
$$;

create or replace function app.admin_user_access_snapshot(target_user_uuid uuid)
returns jsonb
language sql
stable
security definer
set search_path = app, public
as $$
  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'id', profiles.id,
        'email', profiles.email,
        'status', profiles.status
      )
      from app.profiles profiles
      where profiles.id = target_user_uuid
    ),
    'memberships', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', memberships.id,
          'chapterId', memberships.chapter_id,
          'roleKey', memberships.role_key,
          'status', memberships.status
        )
        order by memberships.chapter_id, memberships.role_key
      )
      from app.memberships memberships
      where memberships.user_id = target_user_uuid
    ), '[]'::jsonb),
    'staffRoles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', staff.id,
          'roleKey', staff.role_key,
          'status', staff.status
        )
        order by staff.role_key
      )
      from app.staff_role_assignments staff
      where staff.user_id = target_user_uuid
    ), '[]'::jsonb),
    'coachPortfolio', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', coach_assignments.id,
          'chapterId', coach_assignments.chapter_id,
          'status', coach_assignments.status,
          'startsAt', coach_assignments.starts_at,
          'endsAt', coach_assignments.ends_at
        )
        order by coach_assignments.chapter_id
      )
      from app.coach_chapter_assignments coach_assignments
      where coach_assignments.coach_user_id = target_user_uuid
    ), '[]'::jsonb)
  )
$$;

create or replace function app.admin_change_user_access(
  target_user_uuid uuid,
  operation_input text,
  chapter_uuid uuid default null,
  role_key_input text default null,
  audit_reason_input text default null
)
returns table (
  operation text,
  target_user_id uuid,
  membership_id uuid,
  staff_role_assignment_id uuid,
  coach_assignment_id uuid,
  audit_log_id uuid,
  default_workspace text,
  allowed_workspaces text[]
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  normalized_operation text := btrim(coalesce(operation_input, ''));
  normalized_role text := btrim(coalesce(role_key_input, ''));
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
  changed_membership app.memberships%rowtype;
  changed_staff_role app.staff_role_assignments%rowtype;
  changed_coach_assignment app.coach_chapter_assignments%rowtype;
  audit_uuid uuid := gen_random_uuid();
  before_snapshot jsonb;
  after_snapshot jsonb;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.is_ds_admin() then
    raise exception 'DS Admin or Super Admin access required'
      using errcode = '42501';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'admin access change reason must be at least 12 characters'
      using errcode = '22023';
  end if;

  perform 1
  from app.profiles profiles
  where profiles.id = target_user_uuid
  for update;

  if not found then
    raise exception 'target profile not found' using errcode = 'P0002';
  end if;

  if actor_uuid = target_user_uuid and normalized_operation in (
    'deactivate_user',
    'remove_staff_role',
    'set_staff_role',
    'remove_coach_portfolio'
  ) then
    raise exception 'admins cannot perform destructive access changes on their own account'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from app.staff_role_assignments staff
    where staff.user_id = target_user_uuid
      and staff.role_key = 'super_admin'
      and staff.status = 'active'
  ) and not app.is_super_admin() then
    raise exception 'only a Super Admin can change a Super Admin account'
      using errcode = '42501';
  end if;

  perform set_config('app.admin_access_change', 'enabled', true);

  before_snapshot := app.admin_user_access_snapshot(target_user_uuid);

  if normalized_operation = 'set_chapter_role' then
    if chapter_uuid is null then
      raise exception 'chapter_uuid is required for set_chapter_role'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from app.roles roles
      where roles.key = normalized_role
        and roles.chapter_scoped = true
    ) then
      raise exception 'set_chapter_role requires a chapter-scoped role'
        using errcode = '22023';
    end if;

    update app.memberships memberships
    set status = 'inactive',
        updated_at = now()
    where memberships.user_id = target_user_uuid
      and memberships.chapter_id = chapter_uuid
      and memberships.status = 'approved'
      and memberships.role_key <> normalized_role;

    insert into app.memberships (
      user_id,
      chapter_id,
      role_key,
      status,
      approved_at,
      approved_by
    ) values (
      target_user_uuid,
      chapter_uuid,
      normalized_role,
      'approved',
      now(),
      actor_uuid
    )
    on conflict (user_id, chapter_id, role_key)
    do update set
      status = 'approved',
      approved_at = now(),
      approved_by = actor_uuid,
      updated_at = now()
    returning * into changed_membership;
  elsif normalized_operation = 'remove_chapter_membership' then
    if chapter_uuid is null then
      raise exception 'chapter_uuid is required for remove_chapter_membership'
        using errcode = '22023';
    end if;

    update app.memberships memberships
    set status = 'inactive',
        updated_at = now()
    where memberships.user_id = target_user_uuid
      and memberships.chapter_id = chapter_uuid
      and memberships.status <> 'inactive';

    select *
    into changed_membership
    from app.memberships memberships
    where memberships.user_id = target_user_uuid
      and memberships.chapter_id = chapter_uuid
    order by memberships.updated_at desc
    limit 1;
  elsif normalized_operation = 'set_staff_role' then
    if not exists (
      select 1
      from app.roles roles
      where roles.key = normalized_role
        and roles.chapter_scoped = false
    ) then
      raise exception 'set_staff_role requires a staff role'
        using errcode = '22023';
    end if;

    if normalized_role = 'super_admin' and not app.is_super_admin() then
      raise exception 'only a Super Admin can assign super admin access'
        using errcode = '42501';
    end if;

    insert into app.staff_role_assignments (
      user_id,
      role_key,
      status,
      assigned_by,
      assigned_at,
      ended_at
    ) values (
      target_user_uuid,
      normalized_role,
      'active',
      actor_uuid,
      now(),
      null
    )
    on conflict (user_id, role_key) where status = 'active'
    do update set
      assigned_by = actor_uuid,
      assigned_at = now(),
      ended_at = null,
      updated_at = now()
    returning * into changed_staff_role;
  elsif normalized_operation = 'remove_staff_role' then
    if not exists (
      select 1
      from app.roles roles
      where roles.key = normalized_role
        and roles.chapter_scoped = false
    ) then
      raise exception 'remove_staff_role requires a staff role'
        using errcode = '22023';
    end if;

    if normalized_role = 'super_admin' and not app.is_super_admin() then
      raise exception 'only a Super Admin can remove super admin access'
        using errcode = '42501';
    end if;

    update app.staff_role_assignments staff
    set status = 'inactive',
        ended_at = now(),
        updated_at = now()
    where staff.user_id = target_user_uuid
      and staff.role_key = normalized_role
      and staff.status = 'active'
    returning * into changed_staff_role;
  elsif normalized_operation = 'set_coach_portfolio' then
    if chapter_uuid is null then
      raise exception 'chapter_uuid is required for set_coach_portfolio'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from app.staff_role_assignments staff
      where staff.user_id = target_user_uuid
        and staff.role_key = 'coach'
        and staff.status = 'active'
    ) then
      raise exception 'target user needs an active coach role before portfolio assignment'
        using errcode = '22023';
    end if;

    select *
    into changed_coach_assignment
    from app.coach_chapter_assignments coach_assignments
    where coach_assignments.coach_user_id = target_user_uuid
      and coach_assignments.chapter_id = chapter_uuid
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
        chapter_uuid,
        'portfolio',
        'active',
        current_date,
        actor_uuid,
        normalized_reason
      )
      returning * into changed_coach_assignment;
    end if;
  elsif normalized_operation = 'remove_coach_portfolio' then
    if chapter_uuid is null then
      raise exception 'chapter_uuid is required for remove_coach_portfolio'
        using errcode = '22023';
    end if;

    update app.coach_chapter_assignments coach_assignments
    set status = 'ended',
        ends_at = current_date,
        updated_at = now(),
        handoff_reason = normalized_reason
    where coach_assignments.coach_user_id = target_user_uuid
      and coach_assignments.chapter_id = chapter_uuid
      and coach_assignments.status = 'active';

    select *
    into changed_coach_assignment
    from app.coach_chapter_assignments coach_assignments
    where coach_assignments.coach_user_id = target_user_uuid
      and coach_assignments.chapter_id = chapter_uuid
    order by coach_assignments.updated_at desc
    limit 1;
  elsif normalized_operation = 'deactivate_user' then
    update app.profiles
    set status = 'inactive',
        updated_at = now()
    where id = target_user_uuid;

    update app.memberships
    set status = 'inactive',
        updated_at = now()
    where user_id = target_user_uuid
      and status <> 'inactive';

    update app.staff_role_assignments
    set status = 'inactive',
        ended_at = now(),
        updated_at = now()
    where user_id = target_user_uuid
      and status = 'active';

    update app.coach_chapter_assignments
    set status = 'ended',
        ends_at = current_date,
        updated_at = now(),
        handoff_reason = normalized_reason
    where coach_user_id = target_user_uuid
      and status = 'active';
  elsif normalized_operation = 'reactivate_user' then
    update app.profiles
    set status = 'active',
        updated_at = now()
    where id = target_user_uuid;
  else
    raise exception 'unsupported admin access operation'
      using errcode = '22023';
  end if;

  after_snapshot := app.admin_user_access_snapshot(target_user_uuid);

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
    'admin_user_access.' || normalized_operation,
    'profiles',
    target_user_uuid,
    before_snapshot,
    after_snapshot,
    normalized_reason
  );

  return query
  select
    normalized_operation,
    target_user_uuid,
    changed_membership.id,
    changed_staff_role.id,
    changed_coach_assignment.id,
    audit_uuid,
    workspace.default_workspace,
    workspace.allowed_workspaces
  from app.admin_get_user_workspace_summary(target_user_uuid) workspace;
end;
$$;

revoke all on function app.admin_get_user_workspace_summary(uuid) from public, anon;
revoke all on function app.admin_change_user_access(uuid, text, uuid, text, text) from public, anon;
revoke all on function app.admin_user_access_snapshot(uuid) from public, anon;

grant execute on function app.admin_change_user_access(uuid, text, uuid, text, text) to authenticated, service_role;
