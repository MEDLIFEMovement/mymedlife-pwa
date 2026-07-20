begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

set local role service_role;

insert into app.hubspot_sync_runs (
  id,
  mode,
  status,
  trigger_source,
  requested_by
) values (
  '83000000-0000-4000-8000-000000000011',
  'incremental',
  'running',
  'scheduled',
  null
);

select is(
  (select trigger_source from app.hubspot_sync_runs where id = '83000000-0000-4000-8000-000000000011'),
  'scheduled',
  'Scheduled runs retain an explicit system trigger source'
);

select throws_ok(
  $$ insert into app.hubspot_sync_runs (mode, status, trigger_source) values ('incremental', 'running', 'scheduled') $$,
  '23505',
  null,
  'Only one HubSpot sync run may own the running lock'
);

update app.hubspot_sync_runs
set status = 'failed', completed_at = now()
where id = '83000000-0000-4000-8000-000000000011';

insert into app.hubspot_sync_runs (
  id,
  mode,
  status,
  trigger_source,
  retry_of_run_id,
  requested_by,
  completed_at
) values (
  '83000000-0000-4000-8000-000000000012',
  'incremental',
  'succeeded',
  'replay',
  '83000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000005',
  now()
);

select is(
  (select retry_of_run_id from app.hubspot_sync_runs where id = '83000000-0000-4000-8000-000000000012'),
  '83000000-0000-4000-8000-000000000011'::uuid,
  'Replay runs retain lineage to the incomplete source run'
);

select ok(
  (select heartbeat_at is not null from app.hubspot_sync_runs where id = '83000000-0000-4000-8000-000000000012'),
  'Every run has a durable heartbeat timestamp'
);

select * from finish();
rollback;
