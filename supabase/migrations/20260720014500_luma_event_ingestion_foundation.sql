-- Server-only Luma event ingestion foundation.
-- Luma remains read-only. App-owned chapter events and provider links are the
-- operational read model, while source snapshots and failures stay reviewable.

create table app.chapter_luma_calendars (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  environment text not null check (environment in ('local', 'staging', 'production')),
  calendar_id text not null,
  calendar_label text not null,
  is_default boolean not null default false,
  status app.external_sync_status not null default 'pending',
  linked_by uuid references app.profiles(id),
  linked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, environment)
);

create table app.luma_sync_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('backfill', 'reconcile')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'partial', 'failed')),
  trigger_source text not null default 'manual'
    check (trigger_source in ('manual', 'scheduled', 'replay')),
  requested_by uuid references app.profiles(id),
  retry_of_run_id uuid references app.luma_sync_runs(id) on delete set null,
  attempt integer not null default 1 check (attempt >= 1),
  calendar_id text not null,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  checkpoint_before timestamptz,
  checkpoint_after timestamptz,
  heartbeat_at timestamptz not null default now(),
  source_event_count integer not null default 0 check (source_event_count >= 0),
  event_upsert_count integer not null default 0 check (event_upsert_count >= 0),
  materialized_event_count integer not null default 0 check (materialized_event_count >= 0),
  updated_event_count integer not null default 0 check (updated_event_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create table app.luma_event_imports (
  environment text not null check (environment in ('local', 'staging', 'production')),
  luma_event_id text not null,
  calendar_id text not null,
  chapter_id uuid not null references app.chapters(id) on delete cascade,
  event_name text not null,
  event_url text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text,
  location_label text,
  visibility text,
  registration_open boolean,
  source_created_at timestamptz,
  source_payload jsonb not null default '{}'::jsonb,
  materialized_chapter_event_id uuid references app.chapter_events(id) on delete set null,
  materialized_luma_link_id uuid references app.luma_event_links(id) on delete set null,
  reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending', 'materialized', 'conflict', 'ignored')),
  reconciliation_note text,
  last_seen_run_id uuid references app.luma_sync_runs(id) on delete set null,
  first_imported_at timestamptz not null default now(),
  last_imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (environment, luma_event_id)
);

create table app.luma_sync_failures (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references app.luma_sync_runs(id) on delete cascade,
  object_type text not null check (object_type in ('event', 'run')),
  external_id text,
  error_code text not null,
  error_message text not null,
  source_payload jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0 check (retry_count >= 0),
  retry_after timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index luma_event_links_provider_id_unique
on app.luma_event_links (luma_event_id)
where luma_event_id is not null;

create unique index luma_sync_runs_one_running
on app.luma_sync_runs ((status))
where status = 'running';

create index luma_sync_runs_trigger_started_idx
on app.luma_sync_runs (trigger_source, started_at desc);

create index luma_sync_runs_retry_of_idx
on app.luma_sync_runs (retry_of_run_id)
where retry_of_run_id is not null;

create index luma_event_imports_reconciliation_idx
on app.luma_event_imports (environment, reconciliation_status, last_imported_at desc);

create index luma_sync_failures_retry_idx
on app.luma_sync_failures (resolved_at, retry_after, retry_count);

create trigger set_chapter_luma_calendars_updated_at
before update on app.chapter_luma_calendars
for each row execute function app.set_updated_at();

create trigger set_luma_sync_runs_updated_at
before update on app.luma_sync_runs
for each row execute function app.set_updated_at();

create trigger set_luma_event_imports_updated_at
before update on app.luma_event_imports
for each row execute function app.set_updated_at();

alter table app.chapter_luma_calendars enable row level security;
alter table app.luma_sync_runs enable row level security;
alter table app.luma_event_imports enable row level security;
alter table app.luma_sync_failures enable row level security;

create policy "chapter_luma_calendars_select_ds_admin"
on app.chapter_luma_calendars for select to authenticated
using (app.is_ds_admin());

create policy "luma_sync_runs_select_ds_admin"
on app.luma_sync_runs for select to authenticated
using (app.is_ds_admin());

create policy "luma_event_imports_select_ds_admin"
on app.luma_event_imports for select to authenticated
using (app.is_ds_admin());

create policy "luma_sync_failures_select_ds_admin"
on app.luma_sync_failures for select to authenticated
using (app.is_ds_admin());

grant select on app.chapter_luma_calendars to authenticated;
grant select on app.luma_sync_runs to authenticated;
grant select on app.luma_event_imports to authenticated;
grant select on app.luma_sync_failures to authenticated;

grant select, insert, update, delete on app.chapter_luma_calendars to service_role;
grant select, insert, update, delete on app.luma_sync_runs to service_role;
grant select, insert, update, delete on app.luma_event_imports to service_role;
grant select, insert, update, delete on app.luma_sync_failures to service_role;
