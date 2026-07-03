begin;

create table app.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null,
  environment text not null check (environment in ('local', 'staging', 'production')),
  label text not null,
  description text not null default '',
  enabled boolean not null default false,
  approval_policy text not null check (
    approval_policy in ('standard', 'production_confirmation', 'production_blocked')
  ),
  controls_external_write boolean not null default false,
  created_by uuid references app.profiles(id) on delete set null,
  updated_by uuid references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flags_key_environment_unique unique (flag_key, environment)
);

create table app.theme_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null,
  environment text not null check (environment in ('local', 'staging', 'production')),
  label text not null,
  value text not null,
  value_type text not null check (value_type in ('color', 'text')),
  group_name text not null default 'core',
  created_by uuid references app.profiles(id) on delete set null,
  updated_by uuid references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theme_settings_key_environment_unique unique (setting_key, environment)
);

create index feature_flags_environment_idx
on app.feature_flags (environment, flag_key);

create index theme_settings_environment_idx
on app.theme_settings (environment, setting_key);

create trigger set_feature_flags_updated_at before update on app.feature_flags
for each row execute function app.set_updated_at();

create trigger set_theme_settings_updated_at before update on app.theme_settings
for each row execute function app.set_updated_at();

create or replace function app.can_manage_rollout_controls()
returns boolean
language sql
stable
as $$
  select app.is_ds_admin() or app.is_super_admin();
$$;

create or replace function app.set_feature_flag(
  flag_key_input text,
  environment_input text,
  enabled_input boolean,
  label_input text,
  description_input text,
  reason_input text,
  approval_policy_input text default 'standard',
  controls_external_write_input boolean default false,
  confirmation_input text default null
)
returns table (
  flag_id uuid,
  audit_log_id uuid,
  flag_key text,
  environment text,
  enabled boolean,
  approval_policy text,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = app, public
as $$
declare
  normalized_environment text := lower(btrim(coalesce(environment_input, '')));
  normalized_policy text := lower(btrim(coalesce(approval_policy_input, 'standard')));
  trimmed_reason text := btrim(coalesce(reason_input, ''));
  existing_row app.feature_flags%rowtype;
  saved_row app.feature_flags%rowtype;
  audit_uuid uuid;
begin
  if not app.can_manage_rollout_controls() then
    raise exception 'actor cannot manage rollout controls'
      using errcode = '42501';
  end if;

  if normalized_environment not in ('local', 'staging', 'production') then
    raise exception 'invalid rollout environment'
      using errcode = '22023';
  end if;

  if normalized_policy not in ('standard', 'production_confirmation', 'production_blocked') then
    raise exception 'invalid feature flag approval policy'
      using errcode = '22023';
  end if;

  if char_length(trimmed_reason) < 8 then
    raise exception 'approval reason is required'
      using errcode = '22023';
  end if;

  if normalized_environment = 'production'
     and normalized_policy <> 'standard'
     and upper(coalesce(confirmation_input, '')) <> 'PRODUCTION' then
    raise exception 'type PRODUCTION to confirm production rollout changes'
      using errcode = '22023';
  end if;

  if normalized_environment = 'production'
     and normalized_policy = 'production_blocked'
     and enabled_input then
    raise exception 'production enablement remains blocked for this flag until explicit approval'
      using errcode = '42501';
  end if;

  select *
  into existing_row
  from app.feature_flags
  where feature_flags.flag_key = flag_key_input
    and feature_flags.environment = normalized_environment;

  insert into app.feature_flags (
    flag_key,
    environment,
    label,
    description,
    enabled,
    approval_policy,
    controls_external_write,
    created_by,
    updated_by
  ) values (
    flag_key_input,
    normalized_environment,
    btrim(coalesce(label_input, flag_key_input)),
    btrim(coalesce(description_input, '')),
    enabled_input,
    normalized_policy,
    controls_external_write_input,
    auth.uid(),
    auth.uid()
  )
  on conflict on constraint feature_flags_key_environment_unique
  do update set
    label = excluded.label,
    description = excluded.description,
    enabled = excluded.enabled,
    approval_policy = excluded.approval_policy,
    controls_external_write = excluded.controls_external_write,
    updated_by = auth.uid()
  returning *
  into saved_row;

  insert into app.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    auth.uid(),
    'feature_flag_updated',
    'feature_flags',
    saved_row.id,
    case when existing_row.id is null then null else to_jsonb(existing_row) end,
    jsonb_build_object(
      'flagKey', saved_row.flag_key,
      'environment', saved_row.environment,
      'enabled', saved_row.enabled,
      'approvalPolicy', saved_row.approval_policy,
      'controlsExternalWrite', saved_row.controls_external_write
    ),
    trimmed_reason
  )
  returning id into audit_uuid;

  flag_id := saved_row.id;
  audit_log_id := audit_uuid;
  flag_key := saved_row.flag_key;
  environment := saved_row.environment;
  enabled := saved_row.enabled;
  approval_policy := saved_row.approval_policy;
  updated_at := saved_row.updated_at;
  return next;
end;
$$;

create or replace function app.set_theme_setting(
  setting_key_input text,
  environment_input text,
  label_input text,
  value_input text,
  value_type_input text,
  group_name_input text,
  reason_input text,
  confirmation_input text default null
)
returns table (
  setting_id uuid,
  audit_log_id uuid,
  setting_key text,
  environment text,
  value text,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = app, public
as $$
declare
  normalized_environment text := lower(btrim(coalesce(environment_input, '')));
  normalized_value_type text := lower(btrim(coalesce(value_type_input, 'text')));
  trimmed_reason text := btrim(coalesce(reason_input, ''));
  trimmed_value text := btrim(coalesce(value_input, ''));
  existing_row app.theme_settings%rowtype;
  saved_row app.theme_settings%rowtype;
  audit_uuid uuid;
begin
  if not app.can_manage_rollout_controls() then
    raise exception 'actor cannot manage rollout controls'
      using errcode = '42501';
  end if;

  if normalized_environment not in ('local', 'staging', 'production') then
    raise exception 'invalid rollout environment'
      using errcode = '22023';
  end if;

  if normalized_value_type not in ('color', 'text') then
    raise exception 'invalid theme value type'
      using errcode = '22023';
  end if;

  if trimmed_value = '' then
    raise exception 'theme value is required'
      using errcode = '22023';
  end if;

  if char_length(trimmed_reason) < 8 then
    raise exception 'approval reason is required'
      using errcode = '22023';
  end if;

  if normalized_environment = 'production'
     and upper(coalesce(confirmation_input, '')) <> 'PRODUCTION' then
    raise exception 'type PRODUCTION to confirm production rollout changes'
      using errcode = '22023';
  end if;

  select *
  into existing_row
  from app.theme_settings
  where theme_settings.setting_key = setting_key_input
    and theme_settings.environment = normalized_environment;

  insert into app.theme_settings (
    setting_key,
    environment,
    label,
    value,
    value_type,
    group_name,
    created_by,
    updated_by
  ) values (
    setting_key_input,
    normalized_environment,
    btrim(coalesce(label_input, setting_key_input)),
    trimmed_value,
    normalized_value_type,
    btrim(coalesce(group_name_input, 'core')),
    auth.uid(),
    auth.uid()
  )
  on conflict on constraint theme_settings_key_environment_unique
  do update set
    label = excluded.label,
    value = excluded.value,
    value_type = excluded.value_type,
    group_name = excluded.group_name,
    updated_by = auth.uid()
  returning *
  into saved_row;

  insert into app.audit_logs (
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    auth.uid(),
    'theme_setting_updated',
    'theme_settings',
    saved_row.id,
    case when existing_row.id is null then null else to_jsonb(existing_row) end,
    jsonb_build_object(
      'settingKey', saved_row.setting_key,
      'environment', saved_row.environment,
      'value', saved_row.value,
      'valueType', saved_row.value_type,
      'groupName', saved_row.group_name
    ),
    trimmed_reason
  )
  returning id into audit_uuid;

  setting_id := saved_row.id;
  audit_log_id := audit_uuid;
  setting_key := saved_row.setting_key;
  environment := saved_row.environment;
  value := saved_row.value;
  updated_at := saved_row.updated_at;
  return next;
end;
$$;

grant select on app.feature_flags to authenticated;
grant insert, update, delete on app.feature_flags to authenticated;
grant select on app.theme_settings to authenticated;
grant insert, update, delete on app.theme_settings to authenticated;

grant execute on function app.can_manage_rollout_controls() to authenticated, service_role;
grant execute on function app.set_feature_flag(
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  boolean,
  text
) to authenticated, service_role;
grant execute on function app.set_theme_setting(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated, service_role;

alter table app.feature_flags enable row level security;
alter table app.theme_settings enable row level security;

create policy "feature_flags_select_rollout_admin_only"
on app.feature_flags for select to authenticated
using (app.can_manage_rollout_controls());

create policy "feature_flags_write_rollout_admin_only"
on app.feature_flags for all to authenticated
using (app.can_manage_rollout_controls())
with check (app.can_manage_rollout_controls());

create policy "theme_settings_select_rollout_admin_only"
on app.theme_settings for select to authenticated
using (app.can_manage_rollout_controls());

create policy "theme_settings_write_rollout_admin_only"
on app.theme_settings for all to authenticated
using (app.can_manage_rollout_controls())
with check (app.can_manage_rollout_controls());

commit;
