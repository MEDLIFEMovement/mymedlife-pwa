begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.admin_manage_chapter(
    'create_chapter',
    null,
    'Test Pilot MEDLIFE',
    'Test Pilot University',
    'West Coast',
    'active',
    null,
    null,
    'General members must not create chapters.'
  ) $$,
  '42501',
  'DS Admin or Super Admin access required',
  'General member cannot call the admin chapter management RPC'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select throws_ok(
  $$ select * from app.admin_manage_chapter(
    'create_chapter',
    null,
    'Test Pilot MEDLIFE',
    'Test Pilot University',
    'West Coast',
    'active',
    null,
    null,
    'too short'
  ) $$,
  '22023',
  'admin chapter change reason must be at least 12 characters',
  'Admin chapter changes require a real audit reason'
);

create temp table admin_chapter_create_result as
select * from app.admin_manage_chapter(
  'create_chapter',
  null,
  'Test Pilot MEDLIFE',
  'Test Pilot University',
  'West Coast',
  'active',
  null,
  null,
  'Create a test chapter for admin chapter management coverage.'
);

select is(
  (
    select count(*)::int
    from app.chapters
    where id = (select chapter_id from admin_chapter_create_result)
      and name = 'Test Pilot MEDLIFE'
      and campus = 'Test Pilot University'
      and status = 'active'
  ),
  1,
  'Admin chapter RPC creates a real chapter row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_chapter.create_chapter'
      and target_table = 'chapters'
      and target_id = (select chapter_id from admin_chapter_create_result)
  ),
  1,
  'Chapter create records one audit row'
);

create temp table admin_chapter_update_result as
select * from app.admin_manage_chapter(
  'update_chapter',
  (select chapter_id from admin_chapter_create_result),
  'Test Renamed MEDLIFE',
  'Test Renamed University',
  'Northeast',
  null,
  null,
  null,
  'Update chapter metadata for admin chapter management coverage.'
);

select is(
  (
    select name || '|' || campus || '|' || region
    from app.chapters
    where id = (select chapter_id from admin_chapter_update_result)
  ),
  'Test Renamed MEDLIFE|Test Renamed University|Northeast',
  'Admin chapter RPC updates chapter name, school, and region'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_chapter.update_chapter'
      and target_id = (select chapter_id from admin_chapter_create_result)
  ),
  1,
  'Chapter update records one audit row'
);

create temp table admin_chapter_coach_result as
select * from app.admin_manage_chapter(
  'assign_coach',
  (select chapter_id from admin_chapter_create_result),
  null,
  null,
  null,
  null,
  '00000000-0000-4000-8000-000000000003',
  null,
  'Assign the test chapter to the seeded coach for admin coverage.'
);

select is(
  (
    select count(*)::int
    from app.coach_chapter_assignments
    where coach_user_id = '00000000-0000-4000-8000-000000000003'
      and chapter_id = (select chapter_id from admin_chapter_create_result)
      and status = 'active'
  ),
  1,
  'Admin chapter RPC assigns the active coach owner'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_chapter.assign_coach'
      and target_id = (select chapter_id from admin_chapter_create_result)
  ),
  1,
  'Coach assignment records one audit row'
);

create temp table admin_chapter_leader_result as
select * from app.admin_manage_chapter(
  'assign_student_leader',
  (select chapter_id from admin_chapter_create_result),
  null,
  null,
  null,
  null,
  '00000000-0000-4000-8000-000000000007',
  'president_vp',
  'Assign a student leader to the test chapter for admin coverage.'
);

select is(
  (
    select count(*)::int
    from app.memberships
    where user_id = '00000000-0000-4000-8000-000000000007'
      and chapter_id = (select chapter_id from admin_chapter_create_result)
      and role_key = 'president_vp'
      and status = 'approved'
  ),
  1,
  'Admin chapter RPC assigns a student leader membership'
);

select lives_ok(
  $$ select * from app.admin_manage_chapter(
    'remove_student_leader',
    (select chapter_id from admin_chapter_create_result),
    null,
    null,
    null,
    null,
    '00000000-0000-4000-8000-000000000007',
    null,
    'Remove the test student leader while preserving membership history.'
  ) $$,
  'Admin chapter RPC can remove a student leader without deleting history'
);

create temp table admin_chapter_archive_result as
select * from app.admin_manage_chapter(
  'archive_chapter',
  (select chapter_id from admin_chapter_create_result),
  null,
  null,
  null,
  null,
  null,
  null,
  'Archive the test chapter while preserving historical data.'
);

select is(
  (
    select status::text
    from app.chapters
    where id = (select chapter_id from admin_chapter_create_result)
  ),
  'archived',
  'Admin chapter RPC archives the chapter instead of hard deleting it'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_chapter.archive_chapter'
      and target_id = (select chapter_id from admin_chapter_create_result)
  ),
  1,
  'Chapter archive records one audit row'
);

select throws_ok(
  $$ select * from app.admin_manage_chapter(
    'delete_chapter',
    (select chapter_id from admin_chapter_create_result),
    null,
    null,
    null,
    null,
    null,
    null,
    'Hard delete is intentionally not a supported live admin operation.'
  ) $$,
  '22023',
  'unsupported admin chapter operation',
  'Hard delete is not exposed through the live chapter management RPC'
);

select * from finish();

rollback;
