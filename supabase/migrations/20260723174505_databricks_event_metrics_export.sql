create table app.warehouse_export_runs (
  id uuid primary key default gen_random_uuid(),
  destination text not null default 'databricks'
    check (destination = 'databricks'),
  dataset text not null default 'event_metrics'
    check (dataset = 'event_metrics'),
  mode text not null check (mode in ('backfill', 'incremental')),
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed')),
  trigger_source text not null default 'manual'
    check (trigger_source in ('manual', 'scheduled', 'replay')),
  requested_by uuid references app.profiles(id) on delete set null,
  retry_of_run_id uuid references app.warehouse_export_runs(id) on delete set null,
  attempt integer not null default 1 check (attempt > 0),
  batch_key text not null unique,
  checkpoint_before timestamptz,
  checkpoint_after timestamptz,
  source_row_count integer not null default 0 check (source_row_count >= 0),
  exported_row_count integer not null default 0 check (exported_row_count >= 0),
  payload_sha256 text,
  statement_id text,
  statement_ids text[] not null default '{}'::text[],
  started_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  completed_at timestamptz,
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index warehouse_export_runs_one_running
on app.warehouse_export_runs (destination, dataset)
where status = 'running';

create index warehouse_export_runs_completed_idx
on app.warehouse_export_runs (destination, dataset, completed_at desc);

create table app.warehouse_export_failures (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references app.warehouse_export_runs(id) on delete cascade,
  error_code text not null,
  error_message text not null,
  source_payload jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0 check (retry_count >= 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index warehouse_export_failures_open_idx
on app.warehouse_export_failures (run_id, created_at desc)
where resolved_at is null;

create trigger set_warehouse_export_runs_updated_at
before update on app.warehouse_export_runs
for each row execute function app.set_updated_at();

alter table app.warehouse_export_runs enable row level security;
alter table app.warehouse_export_failures enable row level security;

create policy "warehouse_export_runs_select_ds_admin"
on app.warehouse_export_runs for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create policy "warehouse_export_failures_select_ds_admin"
on app.warehouse_export_failures for select to authenticated
using (app.is_ds_admin() or app.is_super_admin());

create or replace function app.get_databricks_event_metrics_export(
  checkpoint_before_input timestamptz default null,
  checkpoint_through_input timestamptz default now(),
  cursor_updated_at_input timestamptz default null,
  cursor_event_id_input uuid default null,
  page_size_input integer default 500
)
returns table (
  event_id uuid,
  chapter_id uuid,
  campaign_id uuid,
  title text,
  event_type text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  current_rsvp_count bigint,
  attendance_count bigint,
  eligible_member_count integer,
  attendance_rate numeric,
  attendance_points_awarded bigint,
  source_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with event_metrics as (
    select
      chapter_event.id as event_id,
      chapter_event.chapter_id,
      chapter_event.campaign_id,
      chapter_event.title,
      chapter_event.event_type,
      chapter_event.status::text,
      chapter_event.starts_at,
      chapter_event.ends_at,
      coalesce(rsvp.current_count, 0)::bigint as current_rsvp_count,
      coalesce(attendance.actual_count, 0)::bigint as attendance_count,
      chapter_event.eligible_member_count,
      case
        when chapter_event.eligible_member_count is null
          or chapter_event.eligible_member_count = 0
          then null
        else least(
          1,
          coalesce(attendance.actual_count, 0)::numeric
            / chapter_event.eligible_member_count
        )
      end as attendance_rate,
      coalesce(points.attendance_points, 0)::bigint as attendance_points_awarded,
      greatest(
        chapter_event.updated_at,
        coalesce(loop_activity.latest_at, '-infinity'::timestamptz),
        coalesce(points.latest_at, '-infinity'::timestamptz)
      ) as source_updated_at
    from app.chapter_events chapter_event
    left join lateral (
      select
        count(*) filter (
          where latest_intent.event_type = 'event_rsvp_recorded'
        ) as current_count
      from (
        select distinct on (event.actor_user_id)
          event.actor_user_id,
          event.event_type
        from app.events event
        where event.chapter_event_id = chapter_event.id
          and event.actor_user_id is not null
          and event.event_type in (
            'event_rsvp_recorded',
            'event_rsvp_cancelled'
          )
        order by
          event.actor_user_id,
          event.occurred_at desc,
          event.created_at desc,
          event.id desc
      ) latest_intent
    ) rsvp on true
    left join lateral (
      select count(distinct event.actor_user_id) as actual_count
      from app.events event
      where event.chapter_event_id = chapter_event.id
        and event.actor_user_id is not null
        and event.event_type = 'event_attendance_recorded'
    ) attendance on true
    left join lateral (
      select max(event.occurred_at) as latest_at
      from app.events event
      where event.chapter_event_id = chapter_event.id
        and event.event_type in (
          'event_rsvp_recorded',
          'event_rsvp_cancelled',
          'event_attendance_recorded'
        )
    ) loop_activity on true
    left join lateral (
      select
        coalesce(sum(point.points_delta), 0) as attendance_points,
        max(point.created_at) as latest_at
      from app.points_events point
      where point.chapter_event_id = chapter_event.id
        and point.reason ~*
          '^[[:space:]]*attendance confirmed([[:space:]]|$)'
    ) points on true
  )
  select *
  from event_metrics
  where (
      checkpoint_before_input is null
      or source_updated_at > checkpoint_before_input
    )
    and source_updated_at <= checkpoint_through_input
    and (
      cursor_updated_at_input is null
      or (source_updated_at, event_id) >
        (cursor_updated_at_input, cursor_event_id_input)
    )
  order by source_updated_at, event_id
  limit greatest(1, least(page_size_input, 500));
$$;

revoke all on function app.get_databricks_event_metrics_export(
  timestamptz,
  timestamptz,
  timestamptz,
  uuid,
  integer
)
from public, anon, authenticated;
grant execute on function app.get_databricks_event_metrics_export(
  timestamptz,
  timestamptz,
  timestamptz,
  uuid,
  integer
)
to service_role;

grant select on app.warehouse_export_runs to authenticated;
grant select on app.warehouse_export_failures to authenticated;
