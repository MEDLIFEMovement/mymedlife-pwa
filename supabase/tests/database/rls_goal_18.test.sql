begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    insert into app.assignments (
      id,
      chapter_id,
      campaign_id,
      title,
      instructions,
      assigned_to_user_id,
      assigned_to_role_key,
      assigned_by_user_id,
      evidence_required,
      points,
      kpi_key
    ) values (
      'd8000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Direct insert assignment',
      'Direct insert should be blocked.',
      '00000000-0000-4000-8000-000000000001',
      'general_member',
      '00000000-0000-4000-8000-000000000002',
      'Submit fake proof.',
      5,
      'direct_insert'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot bypass the assignment creation function with direct insert'
);

select lives_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Run a dorm invite table',
    'Set up a dorm invite table and invite students to the next Rush event.',
    'Short testimonial or recap about who was invited and what happened.',
    'students_invited',
    10,
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    null,
    null,
    'high',
    'One completed invite table and a short recap.',
    array['Recruitment Director'],
    'Leader checks in before the next event.'
  ) $$,
  'Chapter leader can create a chapter-scoped assignment through the audited function'
);

select is(
  (
    select count(*)::int
    from app.assignments
    where title = 'Run a dorm invite table'
      and chapter_id = '10000000-0000-4000-8000-000000000001'
      and assigned_by_user_id = '00000000-0000-4000-8000-000000000002'
      and assigned_to_user_id = '00000000-0000-4000-8000-000000000001'
      and status = 'not_started'
  ),
  1,
  'Created assignment is chapter-scoped and starts not_started'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'action_assigned'
      and actor_user_id = '00000000-0000-4000-8000-000000000002'
      and payload->>'liveExternalWrite' = 'false'
  ),
  1,
  'Assignment creation records one internal action_assigned event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'action_assigned'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'Assignment creation records one integration-ready event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'action_assigned'
      and destination = 'n8n'
      and status = 'disabled'
  ),
  1,
  'Assignment creation creates one disabled outbox row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'action_assigned'
      and target_table = 'assignments'
  ),
  1,
  'Assignment creation records one audit log'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Run a dorm invite table',
    'Trying to create the same assignment twice in one chapter should fail.',
    'Submit fake proof.',
    'duplicate_assignment',
    10,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '23505',
  'duplicate assignment title exists for this chapter campaign',
  'Assignment creation rejects duplicate chapter assignment titles'
);

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Cross chapter assignment',
    'Trying to assign work outside this leader chapter should fail.',
    'Submit fake proof.',
    'cross_chapter',
    5,
    '00000000-0000-4000-8000-000000000007',
    'general_member'
  ) $$,
  '42501',
  'actor cannot create assignments for this chapter',
  'Chapter leader cannot create assignments for another chapter'
);

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    'Wrong campaign assignment',
    'Trying to use another chapter campaign should fail.',
    'Submit fake proof.',
    'wrong_campaign',
    5,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '22023',
  'campaign does not belong to chapter',
  'Assignment creation validates campaign chapter ownership'
);

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Bad member assignment',
    'Trying to assign work to an unapproved member should fail.',
    'Submit fake proof.',
    'bad_member',
    5,
    '00000000-0000-4000-8000-000000000008',
    'general_member'
  ) $$,
  '22023',
  'assigned user is not an approved chapter member',
  'Assignment creation requires assigned users to be approved chapter members'
);

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Bad points assignment',
    'Trying to use unsafe points should fail.',
    'Submit fake proof.',
    'bad_points',
    1001,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '22023',
  'assignment points must be between 0 and 1000',
  'Assignment creation validates points bounds'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Member-created assignment',
    'General members should not assign chapter work.',
    'Submit fake proof.',
    'member_assignment',
    5,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '42501',
  'actor cannot create assignments for this chapter',
  'General member cannot create assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Coach-created assignment',
    'Coaches should not own student assignment truth in this path.',
    'Submit fake proof.',
    'coach_assignment',
    5,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '42501',
  'actor cannot create assignments for this chapter',
  'Coach cannot create student assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Admin-created assignment',
    'Admin should not own routine chapter assignment truth.',
    'Submit fake proof.',
    'admin_assignment',
    5,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '42501',
  'actor cannot create assignments for this chapter',
  'Admin cannot create routine chapter assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'DS Admin-created assignment',
    'DS Admin should not own student assignment truth.',
    'Submit fake proof.',
    'ds_assignment',
    5,
    '00000000-0000-4000-8000-000000000001',
    'general_member'
  ) $$,
  '42501',
  'actor cannot create assignments for this chapter',
  'DS Admin cannot create routine chapter assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.create_chapter_assignment(
    '10000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Super admin assignment',
    'Super Admin can create an audited break-glass assignment for review.',
    'Submit fake proof.',
    'super_admin_assignment',
    5,
    '00000000-0000-4000-8000-000000000007',
    'general_member'
  ) $$,
  'Super Admin can create an audited break-glass assignment'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'action_assigned'
      and status in ('approved_for_live_send', 'sent')
  ),
  0,
  'Assignment creation does not approve or send external automation'
);

reset role;

select * from finish();

rollback;
