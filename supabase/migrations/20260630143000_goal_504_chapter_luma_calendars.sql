begin;

create table app.chapter_luma_calendars (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  environment text not null check (environment in ('local', 'staging', 'production')),
  calendar_id text not null,
  calendar_label text not null,
  is_default boolean not null default false,
  status text not null default 'linked' check (
    status in ('not_linked', 'linked', 'mocked', 'pending', 'failed', 'disabled')
  ),
  linked_by uuid references app.profiles(id) on delete set null,
  linked_at timestamptz null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapter_luma_calendars_chapter_environment_unique unique (chapter_id, environment)
);

create index chapter_luma_calendars_environment_idx
on app.chapter_luma_calendars (environment, chapter_id);

create trigger set_chapter_luma_calendars_updated_at
before update on app.chapter_luma_calendars
for each row execute function app.set_updated_at();

create or replace function app.set_chapter_luma_calendar(
  chapter_id_input uuid,
  environment_input text,
  calendar_id_input text,
  calendar_label_input text,
  status_input text default 'linked',
  is_default_input boolean default false,
  notes_input text default null,
  reason_input text default '',
  confirmation_input text default null
)
returns table (
  calendar_mapping_id uuid,
  audit_log_id uuid,
  chapter_id uuid,
  environment text,
  calendar_label text,
  status text,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = app, public
as $$
declare
  normalized_environment text := lower(btrim(coalesce(environment_input, '')));
  normalized_status text := lower(btrim(coalesce(status_input, 'linked')));
  trimmed_calendar_id text := btrim(coalesce(calendar_id_input, ''));
  resolved_label text := btrim(coalesce(calendar_label_input, ''));
  trimmed_reason text := btrim(coalesce(reason_input, ''));
  trimmed_notes text := nullif(btrim(coalesce(notes_input, '')), '');
  existing_row app.chapter_luma_calendars%rowtype;
  saved_row app.chapter_luma_calendars%rowtype;
  audit_uuid uuid;
begin
  if not app.can_manage_integrations() then
    raise exception 'actor cannot manage chapter Luma calendars'
      using errcode = '42501';
  end if;

  if normalized_environment not in ('local', 'staging', 'production') then
    raise exception 'invalid rollout environment'
      using errcode = '22023';
  end if;

  if normalized_status not in ('not_linked', 'linked', 'mocked', 'pending', 'failed', 'disabled') then
    raise exception 'invalid chapter Luma calendar status'
      using errcode = '22023';
  end if;

  if trimmed_calendar_id = '' then
    raise exception 'calendar id is required'
      using errcode = '22023';
  end if;

  if resolved_label = '' then
    resolved_label := 'Chapter Luma calendar';
  end if;

  if char_length(trimmed_reason) < 8 then
    raise exception 'approval reason is required'
      using errcode = '22023';
  end if;

  if normalized_environment = 'production'
     and upper(coalesce(confirmation_input, '')) <> 'PRODUCTION' then
    raise exception 'type PRODUCTION to confirm production calendar mapping changes'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from app.chapters
    where chapters.id = chapter_id_input
  ) then
    raise exception 'unknown chapter id'
      using errcode = '22023';
  end if;

  select *
  into existing_row
  from app.chapter_luma_calendars
  where chapter_luma_calendars.chapter_id = chapter_id_input
    and chapter_luma_calendars.environment = normalized_environment;

  insert into app.chapter_luma_calendars (
    chapter_id,
    environment,
    calendar_id,
    calendar_label,
    is_default,
    status,
    linked_by,
    linked_at,
    notes
  ) values (
    chapter_id_input,
    normalized_environment,
    trimmed_calendar_id,
    resolved_label,
    is_default_input,
    normalized_status,
    auth.uid(),
    now(),
    trimmed_notes
  )
  on conflict on constraint chapter_luma_calendars_chapter_environment_unique
  do update set
    calendar_id = excluded.calendar_id,
    calendar_label = excluded.calendar_label,
    is_default = excluded.is_default,
    status = excluded.status,
    linked_by = auth.uid(),
    linked_at = now(),
    notes = excluded.notes
  returning *
  into saved_row;

  if is_default_input then
    update app.chapter_luma_calendars
    set is_default = false
    where environment = normalized_environment
      and id <> saved_row.id
      and is_default = true;
  end if;

  insert into app.audit_logs (
    actor_user_id,
    chapter_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    auth.uid(),
    chapter_id_input,
    'chapter_luma_calendar_saved',
    'chapter_luma_calendars',
    saved_row.id,
    case when existing_row.id is null then null else to_jsonb(existing_row) end,
    jsonb_build_object(
      'chapterId', saved_row.chapter_id,
      'environment', saved_row.environment,
      'calendarId', saved_row.calendar_id,
      'calendarLabel', saved_row.calendar_label,
      'status', saved_row.status,
      'isDefault', saved_row.is_default
    ),
    trimmed_reason
  )
  returning id into audit_uuid;

  calendar_mapping_id := saved_row.id;
  audit_log_id := audit_uuid;
  chapter_id := saved_row.chapter_id;
  environment := saved_row.environment;
  calendar_label := saved_row.calendar_label;
  status := saved_row.status;
  updated_at := saved_row.updated_at;
  return next;
end;
$$;

grant select, insert, update, delete on app.chapter_luma_calendars to authenticated, service_role;
grant execute on function app.set_chapter_luma_calendar(
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text
) to authenticated, service_role;

alter table app.chapter_luma_calendars enable row level security;

create policy "chapter_luma_calendars_select_scoped"
on app.chapter_luma_calendars for select to authenticated
using (
  app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);

create policy "chapter_luma_calendars_manage_integrations_only"
on app.chapter_luma_calendars for all to authenticated
using (app.can_manage_integrations())
with check (app.can_manage_integrations());

commit;
