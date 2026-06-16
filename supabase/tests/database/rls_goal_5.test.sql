begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.assignments),
  1,
  'Chapter A member sees only their visible Chapter A assignment'
);

select is(
  (select count(*)::int from app.assignments where chapter_id = '10000000-0000-4000-8000-000000000002'),
  0,
  'Chapter A member cannot read Chapter B assignments'
);

select is(
  (select count(*)::int from app.profiles),
  1,
  'General member can read only their own profile'
);

select is(
  (select count(*)::int from app.evidence_items),
  1,
  'General member can read their own proof submission'
);

select lives_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    '50000000-0000-4000-8000-000000000001',
    'text',
    'Fake member-submitted Rush Month proof for RLS test.'
  ) $$,
  'Assigned member can submit proof for visible work through the audited function'
);

select throws_ok(
  $$
    insert into app.evidence_items (
      id,
      assignment_id,
      chapter_id,
      submitted_by_user_id,
      evidence_type,
      summary
    ) values (
      '60000000-0000-4000-8000-000000000102',
      '50000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
      'text',
      'This should not cross chapter boundaries.'
    )
  $$,
  '42501',
  null,
  'Chapter A member cannot submit proof for Chapter B work'
);

select throws_ok(
  $$
    update app.assignments
    set points = 999
    where id = '50000000-0000-4000-8000-000000000001'
  $$,
  'assigned users can only update assignment status',
  'Assigned member cannot rewrite assignment points'
);

select is(
  (select points from app.assignments where id = '50000000-0000-4000-8000-000000000001'),
  15,
  'Assignment points stay unchanged after blocked member update'
);

update app.assignments
set status = 'submitted'
where id = '50000000-0000-4000-8000-000000000001';

select is(
  (select status::text from app.assignments where id = '50000000-0000-4000-8000-000000000001'),
  'submitted',
  'Assigned member can update allowed assignment status'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.memberships where chapter_id = '10000000-0000-4000-8000-000000000001'),
  4,
  'Chapter leader can read approved and requested memberships for their chapter'
);

select lives_ok(
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
      '50000000-0000-4000-8000-000000000101',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Leader-created fake assignment',
      'RLS test assignment.',
      '00000000-0000-4000-8000-000000000001',
      'general_member',
      '00000000-0000-4000-8000-000000000002',
      'Submit a fake note.',
      5,
      'fake_metric'
    )
  $$,
  'Chapter leader can create assignments for their chapter'
);

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
      '50000000-0000-4000-8000-000000000102',
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      'Cross-chapter fake assignment',
      'This should fail.',
      '00000000-0000-4000-8000-000000000007',
      'general_member',
      '00000000-0000-4000-8000-000000000002',
      'Submit fake proof.',
      5,
      'fake_metric'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot create assignments for another chapter'
);

select throws_ok(
  $$
    insert into app.approvals (
      id,
      evidence_item_id,
      chapter_id,
      reviewer_user_id,
      decision,
      note
    ) values (
      '61000000-0000-4000-8000-000000000101',
      '60000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'approved_for_sharing',
      'E-board should not make HQ sharing decisions.'
    )
  $$,
  '42501',
  null,
  'Chapter E-board cannot approve proof for broad sharing'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.chapters),
  1,
  'Coach can read only assigned portfolio chapters'
);

select is(
  (select count(*)::int from app.assignments where chapter_id = '10000000-0000-4000-8000-000000000002'),
  0,
  'Coach cannot read assignments outside their portfolio'
);

select lives_ok(
  $$
    insert into app.events (
      id,
      event_type,
      actor_user_id,
      chapter_id,
      payload
    ) values (
      '80000000-0000-4000-8000-000000000101',
      'coach_decision_logged',
      '00000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      '{"decision":"hold","mockOnly":true}'
    )
  $$,
  'Coach can log a mock coach decision event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    insert into app.approvals (
      id,
      evidence_item_id,
      chapter_id,
      reviewer_user_id,
      decision,
      note
    ) values (
      '61000000-0000-4000-8000-000000000102',
      '60000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000004',
      'approved_for_sharing',
      'Admin approves fake proof for sharing in local RLS test.'
    )
  $$,
  'Admin can create HQ proof sharing decisions'
);

select is(
  (select count(*)::int from app.automation_outbox),
  3,
  'Admin can read seed and proof-submission outbox rows for support'
);

update app.automation_outbox
set status = 'approved_for_live_send'
where id = '82000000-0000-4000-8000-000000000002';

select is(
  (select status::text from app.automation_outbox where id = '82000000-0000-4000-8000-000000000002'),
  'disabled',
  'Admin cannot approve live external sends'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    update app.automation_outbox
    set status = 'approved_for_live_send'
    where id = '82000000-0000-4000-8000-000000000002'
  $$,
  'DS Admin can manage outbox status when live sends are later approved'
);

select is(
  (select status::text from app.automation_outbox where id = '82000000-0000-4000-8000-000000000002'),
  'approved_for_live_send',
  'DS Admin outbox update took effect'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000008';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.chapters),
  0,
  'Requested/unapproved member cannot read chapter data'
);

select is(
  (select count(*)::int from app.assignments),
  0,
  'Requested/unapproved member cannot read assignments'
);

select is(
  (select count(*)::int from app.integration_events),
  0,
  'Normal users cannot read raw integration payload rows'
);

select throws_ok(
  $$
    insert into app.events (
      id,
      event_type,
      actor_user_id,
      chapter_id,
      payload
    ) values (
      '80000000-0000-4000-8000-000000000102',
      'coach_decision_logged',
      '00000000-0000-4000-8000-000000000008',
      '10000000-0000-4000-8000-000000000001',
      '{"decision":"fake-cross-chapter-event","mockOnly":true}'
    )
  $$,
  '42501',
  null,
  'Unapproved user cannot insert chapter-scoped events for another chapter'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    insert into app.staff_role_assignments (
      id,
      user_id,
      role_key,
      status,
      assigned_by
    ) values (
      '30000000-0000-4000-8000-000000000101',
      '00000000-0000-4000-8000-000000000008',
      'admin',
      'active',
      '00000000-0000-4000-8000-000000000006'
    )
  $$,
  'Super Admin can assign staff roles'
);

reset role;

select * from finish();

rollback;
