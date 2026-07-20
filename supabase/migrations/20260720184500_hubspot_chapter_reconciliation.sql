-- Record complete-backfill chapter reconciliation without widening browser writes.

alter table app.hubspot_sync_runs
  add column if not exists chapter_deactivation_count integer not null default 0;
