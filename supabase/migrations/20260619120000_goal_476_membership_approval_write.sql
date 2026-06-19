-- Goal 476: local membership approval write.
-- This keeps welcome sends, CRM syncs, and all external writes disabled.

drop policy if exists "memberships_update_chapter_president_or_staff"
on app.memberships;

create policy "memberships_update_via_approved_function_only"
on app.memberships for update to authenticated
using (false)
with check (false);

create or replace function app.can_approve_chapter_membership(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_super_admin()
    or app.has_staff_role(array['admin'])
    or app.is_chapter_leader(chapter_uuid)
$$;

create or replace function app.enforce_membership_update_bounds()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
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

drop trigger if exists enforce_membership_update_bounds on app.memberships;

create trigger enforce_membership_update_bounds before update on app.memberships
for each row execute function app.enforce_membership_update_bounds();

create or replace function app.approve_chapter_membership(
  chapter_uuid uuid,
  join_request_uuid uuid,
  requested_role_key_input text,
  audit_reason_input text
)
returns table (
  membership_id uuid,
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
  requested_row app.memberships%rowtype;
  approved_row app.memberships%rowtype;
  applicant_profile app.profiles%rowtype;
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
  normalized_role text := btrim(coalesce(requested_role_key_input, ''));
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.can_approve_chapter_membership(chapter_uuid) then
    raise exception 'actor cannot approve chapter membership for this chapter'
      using errcode = '42501';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'approval reason must be at least 12 characters'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from app.roles roles
    where roles.key = normalized_role
      and roles.chapter_scoped = true
  ) then
    raise exception 'membership approval requires a chapter-scoped role'
      using errcode = '22023';
  end if;

  select *
  into requested_row
  from app.memberships memberships
  where memberships.id = join_request_uuid
    and memberships.chapter_id = chapter_uuid
    and memberships.status = 'requested'
  for update;

  if not found then
    raise exception 'requested membership row not found'
      using errcode = 'P0002';
  end if;

  if requested_row.role_key <> normalized_role then
    raise exception 'requested role must match the visible join request'
      using errcode = '22023';
  end if;

  select *
  into applicant_profile
  from app.profiles profiles
  where profiles.id = requested_row.user_id;

  if not found then
    raise exception 'applicant profile not found'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from app.memberships memberships
    where memberships.user_id = requested_row.user_id
      and memberships.chapter_id = chapter_uuid
      and memberships.status = 'approved'
      and memberships.id <> requested_row.id
  ) then
    raise exception 'duplicate approved membership exists for this chapter'
      using errcode = '23505';
  end if;

  update app.memberships memberships
  set status = 'approved',
      approved_at = now(),
      approved_by = actor_uuid
  where memberships.id = requested_row.id
  returning * into approved_row;

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'membership_approved',
    actor_uuid,
    chapter_uuid,
    jsonb_build_object(
      'source', 'app.approve_chapter_membership',
      'applicantEmail', applicant_profile.email,
      'requestedRoleKey', approved_row.role_key,
      'liveExternalWrite', false,
      'welcomeEnabled', false,
      'crmSyncEnabled', false
    ),
    'membership_approved:' || approved_row.id::text
  );

  insert into app.integration_events (
    id,
    source_event_id,
    chapter_id,
    event_type,
    destination,
    external_object_type,
    status,
    payload,
    created_by
  ) values (
    integration_event_uuid,
    event_uuid,
    chapter_uuid,
    'membership_approved',
    'internal',
    'membership',
    'recorded',
    jsonb_build_object(
      'mockOnly', true,
      'liveWrite', false,
      'applicantEmail', applicant_profile.email,
      'requestedRoleKey', approved_row.role_key
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
    'hubspot',
    'membership_approved',
    jsonb_build_object(
      'mockOnly', true,
      'liveWrite', false,
      'applicantEmail', applicant_profile.email,
      'welcomeEnabled', false,
      'crmSyncEnabled', false
    ),
    'membership_approved:' || approved_row.id::text,
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
    'membership_approved',
    'memberships',
    approved_row.id,
    jsonb_build_object(
      'status', requested_row.status,
      'approvedAt', requested_row.approved_at,
      'approvedBy', requested_row.approved_by
    ),
    jsonb_build_object(
      'status', approved_row.status,
      'approvedAt', approved_row.approved_at,
      'approvedBy', approved_row.approved_by,
      'roleKey', approved_row.role_key
    ),
    normalized_reason
  );

  return query
  select
    approved_row.id,
    event_uuid,
    integration_event_uuid,
    outbox_uuid,
    audit_uuid;
end;
$$;

grant execute on function app.can_approve_chapter_membership(uuid) to authenticated, service_role;
grant execute on function app.approve_chapter_membership(uuid, uuid, text, text) to authenticated, service_role;
