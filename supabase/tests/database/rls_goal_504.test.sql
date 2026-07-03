begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$
    insert into app.chapter_luma_calendars (
      chapter_id,
      environment,
      calendar_id,
      calendar_label,
      status
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'staging',
      'cal-member-should-fail',
      'Member attempt',
      'linked'
    )
  $$,
  '42501',
  null,
  'General members cannot insert chapter Luma calendar mappings directly'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select lives_ok(
  $$ select * from app.set_chapter_luma_calendar(
    '10000000-0000-4000-8000-000000000001',
    'staging',
    'cal-ucla-1234',
    'UCLA chapter calendar',
    'linked',
    false,
    'Saved in app for the staging event loop.',
    'Record the first saved chapter calendar mapping.',
    null
  ) $$,
  'DS Admin can persist a chapter Luma calendar through the audited function'
);

select is(
  (
    select count(*)::int
    from app.chapter_luma_calendars
    where chapter_id = '10000000-0000-4000-8000-000000000001'
      and environment = 'staging'
      and calendar_id = 'cal-ucla-1234'
  ),
  1,
  'Saved chapter calendar row is stored in app.chapter_luma_calendars'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::int
    from app.chapter_luma_calendars
    where chapter_id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'Chapter leaders can read the saved Luma calendar mapping for their chapter'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000007';

select is(
  (
    select count(*)::int
    from app.chapter_luma_calendars
    where chapter_id = '10000000-0000-4000-8000-000000000001'
  ),
  0,
  'Members outside the chapter scope cannot read that chapter calendar mapping'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'chapter_luma_calendar_saved'
      and target_table = 'chapter_luma_calendars'
  ),
  1,
  'Saving the chapter calendar mapping records one audit log row'
);

select * from finish();
rollback;
