alter table app.luma_sync_runs
  add column unchanged_event_count integer not null default 0
  check (unchanged_event_count >= 0);

comment on column app.luma_sync_runs.unchanged_event_count is
  'Provider events re-seen without changing the app-owned chapter event.';
