begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

insert into app.hubspot_sync_runs (
  id,
  mode,
  status,
  requested_by,
  completed_at
) values (
  '83000000-0000-4000-8000-000000000001',
  'backfill',
  'succeeded',
  '00000000-0000-4000-8000-000000000005',
  now()
);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::int from app.hubspot_sync_runs),
  0,
  'General members cannot read HubSpot sync evidence'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select is(
  (select count(*)::int from app.hubspot_sync_runs),
  1,
  'DS Admin can read HubSpot sync evidence'
);

select throws_ok(
  $$ insert into app.hubspot_sync_runs (mode, requested_by) values ('incremental', '00000000-0000-4000-8000-000000000005') $$,
  '42501',
  'permission denied for table hubspot_sync_runs',
  'Authenticated admins cannot bypass the server-only sync action with direct inserts'
);

reset role;
set local role service_role;

select lives_ok(
  $$ insert into app.hubspot_company_imports (hubspot_company_id, name, last_seen_run_id) values ('company-test', 'TEST Chapter Company', '83000000-0000-4000-8000-000000000001') $$,
  'Service role can write app-owned HubSpot source snapshots'
);

select * from finish();
rollback;
