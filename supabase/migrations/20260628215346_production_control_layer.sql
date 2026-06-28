-- Production readiness control layer for feature flags, theme tokens, step-up
-- sessions, and explicit production approval records.
--
-- This migration defines durable local/staging/prod-ready control tables and
-- audited mutation functions. It does not enable production Luma, n8n,
-- HubSpot, warehouse, AI, SMS/email, or any external sends.

do $$ begin
  create type app.control_environment as enum ('local', 'preview', 'staging', 'production');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type app.feature_flag_status as enum (
    'enabled',
    'disabled',
    'staging_only',
    'mock_only',
    'internal_only',
    'scheduled',
    'emergency_disabled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type app.feature_flag_kind as enum ('module', 'provider');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type app.theme_snapshot_status as enum ('draft', 'active', 'archived', 'scheduled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type app.theme_audit_action as enum (
    'theme_draft_saved',
    'theme_published',
    'theme_rolled_back',
    'theme_default_restored',
    'theme_contrast_override'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type app.production_approval_scope as enum (
    'feature_flag',
    'theme_publish',
    'luma_write',
    'external_integration',
    'pilot_gate',
    'rollback'
  );
exception when duplicate_object then null;
end $$;

create table app.admin_step_up_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.profiles(id) on delete cascade,
  method text not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > verified_at)
);

create index admin_step_up_sessions_user_fresh_idx
on app.admin_step_up_sessions (user_id, expires_at)
where revoked_at is null;

create table app.production_control_approvals (
  id uuid primary key default gen_random_uuid(),
  environment app.control_environment not null,
  scope app.production_approval_scope not null,
  target_key text not null,
  approval_reference text not null,
  reason text not null,
  approved_by uuid not null references app.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (char_length(trim(approval_reference)) >= 4),
  check (char_length(trim(reason)) >= 12)
);

create index production_control_approvals_lookup_idx
on app.production_control_approvals (environment, scope, target_key, created_at desc);

create table app.feature_flag_overrides (
  id uuid primary key default gen_random_uuid(),
  environment app.control_environment not null,
  flag_key text not null,
  flag_kind app.feature_flag_kind not null,
  status app.feature_flag_status not null,
  reason text not null,
  changed_by uuid not null references app.profiles(id),
  step_up_session_id uuid references app.admin_step_up_sessions(id),
  approval_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment, flag_key),
  check (char_length(trim(flag_key)) >= 3),
  check (char_length(trim(reason)) >= 8)
);

create index feature_flag_overrides_environment_idx
on app.feature_flag_overrides (environment, flag_kind, flag_key);

create table app.feature_flag_audit_records (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references app.profiles(id),
  actor_email text not null,
  actor_role text not null check (actor_role in ('ds_admin', 'super_admin')),
  environment app.control_environment not null,
  flag_key text not null,
  old_status app.feature_flag_status,
  new_status app.feature_flag_status not null,
  reason text not null,
  approval_reference text,
  step_up_session_id uuid references app.admin_step_up_sessions(id),
  created_at timestamptz not null default now()
);

create index feature_flag_audit_records_latest_idx
on app.feature_flag_audit_records (environment, created_at desc);

create table app.theme_snapshots (
  id uuid primary key default gen_random_uuid(),
  environment app.control_environment not null,
  status app.theme_snapshot_status not null,
  tokens jsonb not null,
  reason text not null,
  created_by uuid not null references app.profiles(id),
  updated_by uuid not null references app.profiles(id),
  published_at timestamptz,
  rollback_of_id uuid references app.theme_snapshots(id),
  approval_reference text,
  step_up_session_id uuid references app.admin_step_up_sessions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(tokens) = 'object'),
  check (char_length(trim(reason)) >= 8)
);

create unique index theme_snapshots_active_unique
on app.theme_snapshots (environment)
where status = 'active';

create index theme_snapshots_environment_idx
on app.theme_snapshots (environment, status, updated_at desc);

create table app.theme_audit_records (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references app.profiles(id),
  actor_email text not null,
  actor_role text not null check (actor_role in ('ds_admin', 'super_admin')),
  environment app.control_environment not null,
  action app.theme_audit_action not null,
  theme_id uuid not null references app.theme_snapshots(id) on delete cascade,
  reason text not null,
  contrast_override boolean not null default false,
  approval_reference text,
  step_up_session_id uuid references app.admin_step_up_sessions(id),
  created_at timestamptz not null default now()
);

create index theme_audit_records_latest_idx
on app.theme_audit_records (environment, created_at desc);

create trigger set_feature_flag_overrides_updated_at before update on app.feature_flag_overrides
for each row execute function app.set_updated_at();

create trigger set_theme_snapshots_updated_at before update on app.theme_snapshots
for each row execute function app.set_updated_at();

alter table app.admin_step_up_sessions enable row level security;
alter table app.production_control_approvals enable row level security;
alter table app.feature_flag_overrides enable row level security;
alter table app.feature_flag_audit_records enable row level security;
alter table app.theme_snapshots enable row level security;
alter table app.theme_audit_records enable row level security;

create policy "admin_step_up_sessions_select_own_or_super"
on app.admin_step_up_sessions for select to authenticated
using (user_id = auth.uid() or app.is_super_admin());

create policy "production_control_approvals_select_ds_only"
on app.production_control_approvals for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create policy "feature_flag_overrides_select_ds_only"
on app.feature_flag_overrides for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create policy "feature_flag_audit_records_select_ds_only"
on app.feature_flag_audit_records for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create policy "theme_snapshots_select_ds_only"
on app.theme_snapshots for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create policy "theme_audit_records_select_ds_only"
on app.theme_audit_records for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create or replace function app.current_actor_email()
returns text
language sql
stable
security definer
set search_path = app, public, auth
as $$
  select coalesce(
    (select profiles.email from app.profiles profiles where profiles.id = auth.uid()),
    ''
  )
$$;

create or replace function app.current_admin_control_role()
returns text
language sql
stable
security definer
set search_path = app, public
as $$
  select case
    when app.is_super_admin() then 'super_admin'
    when app.is_ds_admin() then 'ds_admin'
    else 'blocked'
  end
$$;

create or replace function app.is_production_sensitive_feature(flag_key text)
returns boolean
language sql
immutable
as $$
  select flag_key in (
    'integration_luma',
    'integration_hubspot',
    'integration_shopify',
    'integration_givelively',
    'integration_bigquery',
    'integration_powerbi',
    'integration_n8n',
    'integration_openai',
    'mcp_read_only_analytics'
  )
$$;

create or replace function app.has_fresh_admin_step_up(
  session_uuid uuid,
  max_age interval default interval '5 minutes'
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.admin_step_up_sessions sessions
    where sessions.id = session_uuid
      and sessions.user_id = auth.uid()
      and sessions.revoked_at is null
      and sessions.verified_at >= now() - max_age
      and sessions.expires_at > now()
  )
$$;

create or replace function app.record_admin_step_up_session(
  method text,
  ttl_minutes integer default 10
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  session_uuid uuid := gen_random_uuid();
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not (app.is_ds_admin() or app.is_super_admin()) then
    raise exception 'DS Admin or Super Admin required' using errcode = '42501';
  end if;

  if ttl_minutes < 1 or ttl_minutes > 30 then
    raise exception 'step-up ttl must be between 1 and 30 minutes';
  end if;

  insert into app.admin_step_up_sessions (
    id,
    user_id,
    method,
    verified_at,
    expires_at
  ) values (
    session_uuid,
    actor_uuid,
    method,
    now(),
    now() + make_interval(mins => ttl_minutes)
  );

  insert into app.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    actor_uuid,
    'admin_step_up_verified',
    'admin_step_up_sessions',
    session_uuid,
    null,
    jsonb_build_object('method', method, 'expiresAt', now() + make_interval(mins => ttl_minutes)),
    'Admin step-up verification recorded.'
  );

  return session_uuid;
end;
$$;

create or replace function app.record_production_control_approval(
  approval_environment app.control_environment,
  approval_scope app.production_approval_scope,
  target_key text,
  approval_reference text,
  reason text,
  expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  approval_uuid uuid := gen_random_uuid();
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not (app.is_ds_admin() or app.is_super_admin()) then
    raise exception 'DS Admin or Super Admin required' using errcode = '42501';
  end if;

  if approval_environment <> 'production' then
    raise exception 'production approval records are only for production gates';
  end if;

  if char_length(trim(approval_reference)) < 4 or char_length(trim(reason)) < 12 then
    raise exception 'approval reference and reason are required';
  end if;

  insert into app.production_control_approvals (
    id,
    environment,
    scope,
    target_key,
    approval_reference,
    reason,
    approved_by,
    expires_at
  ) values (
    approval_uuid,
    approval_environment,
    approval_scope,
    target_key,
    approval_reference,
    reason,
    actor_uuid,
    expires_at
  );

  insert into app.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    actor_uuid,
    'production_control_approval_recorded',
    'production_control_approvals',
    approval_uuid,
    null,
    jsonb_build_object(
      'environment', approval_environment,
      'scope', approval_scope,
      'targetKey', target_key,
      'approvalReference', approval_reference
    ),
    reason
  );

  return approval_uuid;
end;
$$;

create or replace function app.upsert_feature_flag_override(
  flag_environment app.control_environment,
  target_flag_key text,
  flag_kind app.feature_flag_kind,
  next_status app.feature_flag_status,
  reason text,
  approval_reference text default null,
  step_up_session_uuid uuid default null
)
returns table (
  override_id uuid,
  old_status app.feature_flag_status,
  new_status app.feature_flag_status,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  actor_role text := app.current_admin_control_role();
  existing app.feature_flag_overrides%rowtype;
  next_override_id uuid;
  flag_audit_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  production_sensitive boolean :=
    flag_environment = 'production'
    and next_status not in ('disabled', 'emergency_disabled')
    and app.is_production_sensitive_feature(target_flag_key);
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if actor_role not in ('ds_admin', 'super_admin') then
    raise exception 'DS Admin or Super Admin required' using errcode = '42501';
  end if;

  if char_length(trim(reason)) < 8 then
    raise exception 'feature flag changes require a clear reason';
  end if;

  if production_sensitive then
    if approval_reference is null or char_length(trim(approval_reference)) < 4 then
      raise exception 'production-sensitive feature flags require an approval reference' using errcode = '42501';
    end if;

    if not app.has_fresh_admin_step_up(step_up_session_uuid) then
      raise exception 'fresh step-up is required for production-sensitive feature flags' using errcode = '42501';
    end if;
  end if;

  select *
  into existing
  from app.feature_flag_overrides overrides
  where overrides.environment = flag_environment
    and overrides.flag_key = target_flag_key
  for update;

  old_status := case when found then existing.status else null end;

  insert into app.feature_flag_overrides (
    environment,
    flag_key,
    flag_kind,
    status,
    reason,
    changed_by,
    approval_reference,
    step_up_session_id
  ) values (
    flag_environment,
    target_flag_key,
    flag_kind,
    next_status,
    reason,
    actor_uuid,
    approval_reference,
    step_up_session_uuid
  )
  on conflict (environment, flag_key) do update
  set
    flag_kind = excluded.flag_kind,
    status = excluded.status,
    reason = excluded.reason,
    changed_by = excluded.changed_by,
    approval_reference = excluded.approval_reference,
    step_up_session_id = excluded.step_up_session_id,
    updated_at = now()
  returning id into next_override_id;

  insert into app.feature_flag_audit_records (
    id,
    actor_user_id,
    actor_email,
    actor_role,
    environment,
    flag_key,
    old_status,
    new_status,
    reason,
    approval_reference,
    step_up_session_id
  ) values (
    flag_audit_uuid,
    actor_uuid,
    app.current_actor_email(),
    actor_role,
    flag_environment,
    target_flag_key,
    old_status,
    next_status,
    reason,
    approval_reference,
    step_up_session_uuid
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    'feature_flag_status_changed',
    'feature_flag_overrides',
    next_override_id,
    case when old_status is null then null else jsonb_build_object('status', old_status) end,
    jsonb_build_object(
      'environment', flag_environment,
      'flagKey', target_flag_key,
      'status', next_status,
      'approvalReference', approval_reference,
      'featureFlagAuditId', flag_audit_uuid
    ),
    reason
  );

  override_id := next_override_id;
  new_status := next_status;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

create or replace function app.save_theme_control_snapshot(
  theme_environment app.control_environment,
  theme_status app.theme_snapshot_status,
  tokens jsonb,
  reason text,
  contrast_override boolean default false,
  approval_reference text default null,
  step_up_session_uuid uuid default null,
  rollback_of_uuid uuid default null
)
returns table (
  theme_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  actor_role text := app.current_admin_control_role();
  next_theme_id uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  theme_action app.theme_audit_action;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if actor_role not in ('ds_admin', 'super_admin') then
    raise exception 'DS Admin or Super Admin required' using errcode = '42501';
  end if;

  if jsonb_typeof(tokens) <> 'object' then
    raise exception 'theme tokens must be a JSON object';
  end if;

  if char_length(trim(reason)) < 8 then
    raise exception 'theme changes require a clear reason';
  end if;

  if theme_environment = 'production' and theme_status in ('active', 'scheduled') then
    if approval_reference is null or char_length(trim(approval_reference)) < 4 then
      raise exception 'production theme publish requires an approval reference' using errcode = '42501';
    end if;

    if not app.has_fresh_admin_step_up(step_up_session_uuid) then
      raise exception 'fresh step-up is required for production theme publish' using errcode = '42501';
    end if;
  end if;

  if theme_status = 'active' then
    update app.theme_snapshots
    set status = 'archived'
    where environment = theme_environment
      and status = 'active';
  end if;

  insert into app.theme_snapshots (
    id,
    environment,
    status,
    tokens,
    reason,
    created_by,
    updated_by,
    published_at,
    rollback_of_id,
    approval_reference,
    step_up_session_id
  ) values (
    next_theme_id,
    theme_environment,
    theme_status,
    tokens,
    reason,
    actor_uuid,
    actor_uuid,
    case when theme_status = 'active' then now() else null end,
    rollback_of_uuid,
    approval_reference,
    step_up_session_uuid
  );

  theme_action := case
    when rollback_of_uuid is not null then 'theme_rolled_back'::app.theme_audit_action
    when theme_status = 'active' and contrast_override then 'theme_contrast_override'::app.theme_audit_action
    when theme_status = 'active' then 'theme_published'::app.theme_audit_action
    else 'theme_draft_saved'::app.theme_audit_action
  end;

  insert into app.theme_audit_records (
    actor_user_id,
    actor_email,
    actor_role,
    environment,
    action,
    theme_id,
    reason,
    contrast_override,
    approval_reference,
    step_up_session_id
  ) values (
    actor_uuid,
    app.current_actor_email(),
    actor_role,
    theme_environment,
    theme_action,
    next_theme_id,
    reason,
    contrast_override,
    approval_reference,
    step_up_session_uuid
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    'theme_control_snapshot_saved',
    'theme_snapshots',
    next_theme_id,
    null,
    jsonb_build_object(
      'environment', theme_environment,
      'status', theme_status,
      'themeAction', theme_action,
      'approvalReference', approval_reference
    ),
    reason
  );

  theme_id := next_theme_id;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant select on app.admin_step_up_sessions to authenticated;
grant select on app.production_control_approvals to authenticated;
grant select on app.feature_flag_overrides to authenticated;
grant select on app.feature_flag_audit_records to authenticated;
grant select on app.theme_snapshots to authenticated;
grant select on app.theme_audit_records to authenticated;
grant execute on function app.current_actor_email() to authenticated;
grant execute on function app.current_admin_control_role() to authenticated;
grant execute on function app.is_production_sensitive_feature(text) to authenticated;
grant execute on function app.has_fresh_admin_step_up(uuid, interval) to authenticated;
grant execute on function app.record_admin_step_up_session(text, integer) to authenticated;
grant execute on function app.record_production_control_approval(app.control_environment, app.production_approval_scope, text, text, text, timestamptz) to authenticated;
grant execute on function app.upsert_feature_flag_override(app.control_environment, text, app.feature_flag_kind, app.feature_flag_status, text, text, uuid) to authenticated;
grant execute on function app.save_theme_control_snapshot(app.control_environment, app.theme_snapshot_status, jsonb, text, boolean, text, uuid, uuid) to authenticated;
