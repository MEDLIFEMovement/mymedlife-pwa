-- Make HubSpot reconciliation schedulable, observable, and safely replayable.

alter table app.hubspot_sync_runs
  add column trigger_source text not null default 'manual'
    check (trigger_source in ('manual', 'scheduled', 'replay')),
  add column retry_of_run_id uuid references app.hubspot_sync_runs(id) on delete set null,
  add column attempt integer not null default 1 check (attempt >= 1),
  add column heartbeat_at timestamptz;

update app.hubspot_sync_runs
set heartbeat_at = coalesce(completed_at, started_at)
where heartbeat_at is null;

alter table app.hubspot_sync_runs
  alter column heartbeat_at set default now(),
  alter column heartbeat_at set not null;

update app.hubspot_sync_runs
set
  status = 'failed',
  completed_at = now(),
  error_summary = 'Recovered abandoned HubSpot sync during scheduler migration.'
where status = 'running';

create unique index hubspot_sync_runs_one_running
on app.hubspot_sync_runs ((status))
where status = 'running';

create index hubspot_sync_runs_trigger_started_idx
on app.hubspot_sync_runs (trigger_source, started_at desc);

create index hubspot_sync_runs_retry_of_idx
on app.hubspot_sync_runs (retry_of_run_id)
where retry_of_run_id is not null;
