begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.review_packet_records),
  0,
  'Members cannot read review packet records'
);

select throws_ok(
  $$
    select * from app.upsert_review_packet_record(
      'pilot_scope',
      'MYMEDLIFE_PILOT_CHAPTER',
      'Boston College MEDLIFE',
      'Member should be blocked.'
    )
  $$,
  '42501',
  'Only admin, DS Admin, or Super Admin can record review packet values.',
  'Members cannot record review packet values'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    select * from app.upsert_review_packet_record(
      'pilot_scope',
      'MYMEDLIFE_PILOT_CHAPTER',
      'Boston College MEDLIFE',
      'Nick approved the first pilot chapter.'
    )
  $$,
  'Admin can record a pilot packet value'
);

select is(
  (
    select value
    from app.review_packet_records
    where category = 'pilot_scope'
      and record_key = 'MYMEDLIFE_PILOT_CHAPTER'
  ),
  'Boston College MEDLIFE',
  'Pilot packet value is persisted'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'review_packet_recorded'
      and target_table = 'review_packet_records'
  ),
  1,
  'Pilot packet write creates an audit log row'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    select * from app.upsert_review_packet_record(
      'production_launch',
      'MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF',
      'prod-abc123',
      'Recorded approved production project ref.'
    )
  $$,
  'DS Admin can record a production launch packet value'
);

select is(
  (
    select count(*)::int
    from app.review_packet_records
    where category = 'production_launch'
      and record_key = 'MYMEDLIFE_PRODUCTION_SUPABASE_PROJECT_REF'
  ),
  1,
  'Production launch packet value is persisted'
);

select *
from finish();

rollback;
