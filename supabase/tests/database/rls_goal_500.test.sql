begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    insert into app.points_events (
      id,
      chapter_id,
      campaign_id,
      chapter_event_id,
      awarded_to_user_id,
      points_delta,
      reason,
      created_by
    ) values (
      'da000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      20,
      'Direct DS Admin insert should stay blocked.',
      '00000000-0000-4000-8000-000000000005'
    )
  $$,
  '42501',
  null,
  'DS Admin cannot bypass the Luma attendance points function with a direct insert'
);

select lives_ok(
  $$
    select * from app.record_luma_attendance_points_event(
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      20,
      'Luma pilot attendance confirmed for Rush Month kickoff social'
    )
  $$,
  'DS Admin can record one Luma attendance points row through the narrow function'
);

select is(
  (
    select count(*)::int
    from app.points_events
    where chapter_event_id = '51000000-0000-4000-8000-000000000001'
      and awarded_to_user_id = '00000000-0000-4000-8000-000000000001'
      and reason like 'Luma pilot attendance confirmed for %'
  ),
  1,
  'The first Luma attendance points call creates one matching points row'
);

select is(
  (
    select created_by
    from app.points_events
    where chapter_event_id = '51000000-0000-4000-8000-000000000001'
      and awarded_to_user_id = '00000000-0000-4000-8000-000000000001'
      and reason like 'Luma pilot attendance confirmed for %'
    order by created_at asc
    limit 1
  )::text,
  '00000000-0000-4000-8000-000000000005',
  'The recorded Luma attendance points row keeps the DS Admin actor'
);

select lives_ok(
  $$
    select * from app.record_luma_attendance_points_event(
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      20,
      'Luma pilot attendance confirmed for Rush Month kickoff social'
    )
  $$,
  'Repeating the same Luma attendance import stays idempotent'
);

select is(
  (
    select count(*)::int
    from app.points_events
    where chapter_event_id = '51000000-0000-4000-8000-000000000001'
      and awarded_to_user_id = '00000000-0000-4000-8000-000000000001'
      and reason like 'Luma pilot attendance confirmed for %'
  ),
  1,
  'Repeated imports do not create duplicate Luma attendance points rows'
);

select throws_ok(
  $$
    select * from app.record_luma_attendance_points_event(
      '51000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000007',
      20,
      'Luma pilot attendance confirmed for Lakeside fake event'
    )
  $$,
  '22023',
  'chapter event must be linked to a Luma event',
  'Unlinked events cannot use the Luma attendance points function'
);

select throws_ok(
  $$
    select * from app.record_luma_attendance_points_event(
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000008',
      20,
      'Luma pilot attendance confirmed for Rush Month kickoff social'
    )
  $$,
  '22023',
  'awarded member must have an approved chapter membership',
  'Requested or unrelated members cannot receive attendance points'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    select * from app.record_luma_attendance_points_event(
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      20,
      'Luma pilot attendance confirmed for Rush Month kickoff social'
    )
  $$,
  '42501',
  'DS Admin or Super Admin required',
  'General members cannot use the Luma attendance points function'
);

select *
from finish();

rollback;
