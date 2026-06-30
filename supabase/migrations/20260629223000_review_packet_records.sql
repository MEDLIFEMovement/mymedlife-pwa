-- Goal 494/500: persist review-packet values for pilot scope and production
-- launch readiness without exposing secrets or enabling live writes.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'app'::regnamespace
      and typname = 'review_packet_category'
  ) then
    create type app.review_packet_category as enum (
      'pilot_scope',
      'production_launch'
    );
  end if;
end
$$;

create table if not exists app.review_packet_records (
  id uuid primary key default gen_random_uuid(),
  category app.review_packet_category not null,
  record_key text not null,
  value text not null,
  reason text,
  actor_role text not null check (actor_role in ('admin', 'ds_admin', 'super_admin')),
  updated_by uuid not null references app.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, record_key)
);

create index if not exists review_packet_records_category_idx
on app.review_packet_records (category, updated_at desc);

create trigger set_review_packet_records_updated_at before update on app.review_packet_records
for each row execute function app.set_updated_at();

alter table app.review_packet_records enable row level security;

drop policy if exists "review_packet_records_select_admin_review" on app.review_packet_records;
create policy "review_packet_records_select_admin_review"
on app.review_packet_records for select to authenticated
using (app.is_admin() or app.is_ds_admin() or app.is_super_admin());

drop policy if exists "review_packet_records_insert_admin_review" on app.review_packet_records;
create policy "review_packet_records_insert_admin_review"
on app.review_packet_records for insert to authenticated
with check (app.is_admin() or app.is_ds_admin() or app.is_super_admin());

drop policy if exists "review_packet_records_update_admin_review" on app.review_packet_records;
create policy "review_packet_records_update_admin_review"
on app.review_packet_records for update to authenticated
using (app.is_admin() or app.is_ds_admin() or app.is_super_admin())
with check (app.is_admin() or app.is_ds_admin() or app.is_super_admin());

create or replace function app.current_review_packet_role()
returns text
language sql
stable
security definer
set search_path = app, public
as $$
  select case
    when app.is_super_admin() then 'super_admin'
    when app.is_ds_admin() then 'ds_admin'
    when app.is_admin() then 'admin'
    else 'blocked'
  end
$$;

create or replace function app.upsert_review_packet_record(
  packet_category app.review_packet_category,
  packet_key text,
  packet_value text,
  packet_reason text default null
)
returns table(
  record_id uuid,
  old_value text,
  new_value text,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public, auth
as $$
declare
  actor_role text := app.current_review_packet_role();
  normalized_key text := btrim(packet_key);
  normalized_value text := btrim(packet_value);
  normalized_reason text := nullif(btrim(coalesce(packet_reason, '')), '');
  existing app.review_packet_records%rowtype;
  upserted app.review_packet_records%rowtype;
  audit_id uuid := gen_random_uuid();
begin
  if actor_role = 'blocked' then
    raise exception 'Only admin, DS Admin, or Super Admin can record review packet values.'
      using errcode = '42501';
  end if;

  if auth.uid() is null then
    raise exception 'Authenticated review packet session required.'
      using errcode = '42501';
  end if;

  if normalized_key = '' then
    raise exception 'review packet key is required'
      using errcode = '22023';
  end if;

  if normalized_value = '' then
    raise exception 'review packet value is required'
      using errcode = '22023';
  end if;

  if normalized_reason is not null and length(normalized_reason) < 8 then
    raise exception 'review packet reason must be at least 8 characters when provided'
      using errcode = '22023';
  end if;

  select *
  into existing
  from app.review_packet_records records
  where records.category = packet_category
    and records.record_key = normalized_key
  for update;

  insert into app.review_packet_records (
    category,
    record_key,
    value,
    reason,
    actor_role,
    updated_by
  )
  values (
    packet_category,
    normalized_key,
    normalized_value,
    normalized_reason,
    actor_role,
    auth.uid()
  )
  on conflict (category, record_key)
  do update set
    value = excluded.value,
    reason = excluded.reason,
    actor_role = excluded.actor_role,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning *
  into upserted;

  insert into app.audit_logs (
    id,
    actor_user_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  )
  values (
    audit_id,
    auth.uid(),
    'review_packet_recorded',
    'review_packet_records',
    upserted.id,
    case
      when existing.id is null then null
      else jsonb_build_object(
        'category', existing.category,
        'record_key', existing.record_key,
        'value', existing.value,
        'reason', existing.reason,
        'actor_role', existing.actor_role
      )
    end,
    jsonb_build_object(
      'category', upserted.category,
      'record_key', upserted.record_key,
      'value', upserted.value,
      'reason', upserted.reason,
      'actor_role', upserted.actor_role
    ),
    coalesce(
      normalized_reason,
      format('Recorded %s review packet value for %s.', packet_category::text, normalized_key)
    )
  );

  return query
  select
    upserted.id,
    existing.value,
    upserted.value,
    audit_id;
end;
$$;

grant select, insert, update on app.review_packet_records to authenticated;
grant execute on function app.current_review_packet_role() to authenticated;
grant execute on function app.upsert_review_packet_record(
  app.review_packet_category,
  text,
  text,
  text
) to authenticated;
