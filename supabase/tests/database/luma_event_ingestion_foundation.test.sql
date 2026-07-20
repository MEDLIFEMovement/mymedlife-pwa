begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

set local role service_role;

insert into app.luma_sync_runs (
  id,
  mode,
  status,
  trigger_source,
  chapter_id,
  calendar_id
) values (
  '84000000-0000-4000-8000-000000000001',
  'reconcile',
  'running',
  'scheduled',
  '10000000-0000-4000-8000-000000000001',
  'cal-test-production'
);

select is(
  (select trigger_source from app.luma_sync_runs where id = '84000000-0000-4000-8000-000000000001'),
  'scheduled',
  'Scheduled Luma runs retain an explicit system trigger source'
);

select throws_ok(
  $$ insert into app.luma_sync_runs (mode, status, trigger_source, chapter_id, calendar_id)
     values ('reconcile', 'running', 'scheduled', '10000000-0000-4000-8000-000000000001', 'cal-test-production') $$,
  '23505',
  null,
  'Only one Luma sync run may own the running lock'
);

update app.luma_sync_runs
set status = 'failed', completed_at = now()
where id = '84000000-0000-4000-8000-000000000001';

insert into app.luma_sync_runs (
  id,
  mode,
  status,
  trigger_source,
  requested_by,
  retry_of_run_id,
  chapter_id,
  calendar_id,
  completed_at
) values (
  '84000000-0000-4000-8000-000000000002',
  'reconcile',
  'succeeded',
  'replay',
  '00000000-0000-4000-8000-000000000005',
  '84000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'cal-test-production',
  now()
);

select is(
  (select retry_of_run_id from app.luma_sync_runs where id = '84000000-0000-4000-8000-000000000002'),
  '84000000-0000-4000-8000-000000000001'::uuid,
  'Replay runs retain lineage to the source run'
);

select ok(
  (select heartbeat_at is not null from app.luma_sync_runs where id = '84000000-0000-4000-8000-000000000002'),
  'Every Luma run has a durable heartbeat timestamp'
);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::int from app.luma_sync_runs),
  0,
  'General members cannot read Luma sync evidence'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select is(
  (select count(*)::int from app.luma_sync_runs),
  2,
  'DS Admin can read Luma sync evidence'
);

select throws_ok(
  $$ insert into app.luma_sync_runs (mode, chapter_id, calendar_id)
     values ('backfill', '10000000-0000-4000-8000-000000000001', 'cal-test-production') $$,
  '42501',
  'permission denied for table luma_sync_runs',
  'Authenticated admins cannot bypass the server-only sync action with direct inserts'
);

reset role;
set local role service_role;

select lives_ok(
  $$ insert into app.chapter_luma_calendars (
       chapter_id, environment, calendar_id, calendar_label, status
     ) values (
       '10000000-0000-4000-8000-000000000001', 'production', 'cal-test-production', 'TEST Production Calendar', 'linked'
     ) $$,
  'Service role can write an app-owned Luma calendar mapping'
);

select * from finish();
rollback;
