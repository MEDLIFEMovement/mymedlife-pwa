begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

insert into app.assignments (
  id,
  chapter_id,
  campaign_id,
  phase_id,
  action_template_id,
  action_committee_id,
  title,
  instructions,
  assigned_to_user_id,
  assigned_to_role_key,
  assigned_by_user_id,
  status,
  evidence_required,
  points,
  kpi_key
) values
  (
    'c5000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 member start assignment',
    'Fake not-started assignment for the Goal 14 action-start write path.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_member_start'
  ),
  (
    'c5000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000002',
    '43000000-0000-4000-8000-000000000002',
    '42000000-0000-4000-8000-000000000002',
    'Goal 14 cross-chapter assignment',
    'Fake not-started assignment that Northview member must not start.',
    '00000000-0000-4000-8000-000000000007',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_cross_chapter'
  ),
  (
    'c5000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 leader start assignment',
    'Fake not-started assignment for President/VP action-start coverage.',
    null,
    'president_vp',
    '00000000-0000-4000-8000-000000000004',
    'not_started',
    'Fake leader proof later.',
    5,
    'goal_14_leader_start'
  ),
  (
    'c5000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 coach start assignment',
    'Fake not-started assignment for coach-owned action-start coverage.',
    null,
    'coach',
    '00000000-0000-4000-8000-000000000004',
    'not_started',
    'Fake coach proof later.',
    5,
    'goal_14_coach_start'
  ),
  (
    'c5000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 coach blocked member assignment',
    'Fake member-owned assignment that coach must not start.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_coach_blocked_member'
  ),
  (
    'c5000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 admin blocked assignment',
    'Fake assignment that Admin must not start as student truth.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_admin_blocked'
  ),
  (
    'c5000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 DS admin blocked assignment',
    'Fake assignment that DS Admin must not start as student truth.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_ds_admin_blocked'
  ),
  (
    'c5000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 14 super admin break-glass assignment',
    'Fake assignment that Super Admin can start as an audited local break-glass path.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof later.',
    5,
    'goal_14_super_admin_start'
  );

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    update app.assignments
    set status = 'in_progress'
    where id = 'c5000000-0000-4000-8000-000000000001'
  $$,
  'P0001',
  'assignment start must use app.start_assignment_action',
  'Assigned member cannot bypass the action-start function'
);

select lives_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000001') $$,
  'Assigned member can start their own visible assignment through the audited function'
);

select is(
  (
    select status::text
    from app.assignments
    where id = 'c5000000-0000-4000-8000-000000000001'
  ),
  'in_progress',
  'Assigned member action-start function updates assignment status'
);

select throws_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000001') $$,
  '42501',
  'actor cannot start this assignment',
  'Already-started assignment cannot be started again'
);

select throws_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000002') $$,
  '42501',
  'actor cannot start this assignment',
  'Member cannot start another chapter assignment'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    update app.assignments
    set status = 'in_progress'
    where id = 'c5000000-0000-4000-8000-000000000003'
  $$,
  'P0001',
  'assignment start must use app.start_assignment_action',
  'Chapter leader cannot bypass the action-start function'
);

select lives_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000003') $$,
  'Chapter leader can start a chapter-scoped leader assignment through the audited function'
);

select is(
  (
    select status::text
    from app.assignments
    where id = 'c5000000-0000-4000-8000-000000000003'
  ),
  'in_progress',
  'Chapter leader action-start function updates leader assignment status'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000004') $$,
  'Coach can start coach-owned portfolio work through the audited function'
);

select is(
  (
    select status::text
    from app.assignments
    where id = 'c5000000-0000-4000-8000-000000000004'
  ),
  'in_progress',
  'Coach action-start function updates coach-owned assignment status'
);

select throws_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000005') $$,
  '42501',
  'actor cannot start this assignment',
  'Coach cannot start member-owned student work'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'action_started'
      and assignment_id = 'c5000000-0000-4000-8000-000000000001'
  ),
  1,
  'Action start creates one structured internal event'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'action_started'
      and external_object_id = 'c5000000-0000-4000-8000-000000000001'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'Action start creates one recorded integration event without external send'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'action_started'
      and target_id = 'c5000000-0000-4000-8000-000000000001'
  ),
  1,
  'Action start creates one audit log'
);

select throws_ok(
  $$
    update app.assignments
    set status = 'in_progress'
    where id = 'c5000000-0000-4000-8000-000000000006'
  $$,
  'P0001',
  'assignment start must use app.start_assignment_action',
  'Admin cannot bypass the action-start function'
);

select throws_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000006') $$,
  '42501',
  'actor cannot start this assignment',
  'Admin cannot start routine student truth assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    update app.assignments
    set status = 'in_progress'
    where id = 'c5000000-0000-4000-8000-000000000007'
  $$,
  'P0001',
  'assignment start must use app.start_assignment_action',
  'DS Admin cannot bypass the action-start function'
);

select throws_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000007') $$,
  '42501',
  'actor cannot start this assignment',
  'DS Admin cannot start student truth assignments'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.start_assignment_action('c5000000-0000-4000-8000-000000000008') $$,
  'Super Admin can use the audited local break-glass action-start path'
);

select is(
  (
    select status::text
    from app.assignments
    where id = 'c5000000-0000-4000-8000-000000000008'
  ),
  'in_progress',
  'Super Admin break-glass action-start updates assignment status'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'action_started'
  ),
  0,
  'Action start does not create outbox rows or external send attempts'
);

reset role;

select * from finish();

rollback;
