begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

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
    'd5000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 member proof assignment',
    'Fake in-progress assignment for member proof metadata submission.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_member_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000002',
    '43000000-0000-4000-8000-000000000002',
    '42000000-0000-4000-8000-000000000002',
    'Goal 15 cross-chapter proof assignment',
    'Fake in-progress assignment that Northview member must not submit proof for.',
    '00000000-0000-4000-8000-000000000007',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_cross_chapter_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 leader proof assignment',
    'Fake in-progress chapter assignment that a chapter leader may help submit.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake leader-collected proof metadata only.',
    5,
    'goal_15_leader_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 coach blocked proof assignment',
    'Fake coach-owned assignment that should not use normal student proof submission.',
    null,
    'coach',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_coach_blocked_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 admin blocked proof assignment',
    'Fake assignment that Admin must not submit as student proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_admin_blocked_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 DS admin blocked proof assignment',
    'Fake assignment that DS Admin must not submit as student proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_ds_admin_blocked_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 super admin blocked proof assignment',
    'Fake assignment that Super Admin must not submit through the normal proof path.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_super_admin_blocked_proof'
  ),
  (
    'd5000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 short summary proof assignment',
    'Fake assignment for summary validation.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'in_progress',
    'Fake proof metadata only.',
    5,
    'goal_15_short_summary'
  ),
  (
    'd5000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 15 not-started proof assignment',
    'Fake not-started assignment that needs action start before proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'not_started',
    'Fake proof metadata only.',
    5,
    'goal_15_not_started'
  );

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

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
      'd6000000-0000-4000-8000-000000000101',
      'd5000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      'bridge_video',
      'Direct insert should be blocked by Goal 15.'
    )
  $$,
  '42501',
  null,
  'Member cannot bypass the proof metadata function with direct evidence insert'
);

select lives_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000001',
    'bridge_video',
    'This bridge video explains why the Rush social helped freshmen feel welcome.',
    'https://drive.google.com/mock/goal-15-bridge-video',
    array['student', 'chapter_leader'],
    array['belonging', 'rush_month'],
    'student',
    'rush_month',
    'Will I find friends here?',
    'Goal 15 Rush social proof',
    84
  ) $$,
  'Assigned member can submit proof metadata through the audited function'
);

select is(
  (
    select status::text
    from app.assignments
    where id = 'd5000000-0000-4000-8000-000000000001'
  ),
  'submitted',
  'Proof metadata function updates assignment status to submitted'
);

select is(
  (
    select count(*)::int
    from app.evidence_items
    where assignment_id = 'd5000000-0000-4000-8000-000000000001'
      and submitted_by_user_id = '00000000-0000-4000-8000-000000000001'
      and status = 'pending_review'
      and sharing_status = 'submitted'
      and storage_path is null
  ),
  1,
  'Proof metadata row is created without storage upload'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'evidence_submitted'
      and assignment_id = 'd5000000-0000-4000-8000-000000000001'
  ),
  1,
  'Proof metadata submission creates one internal event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'evidence_submitted'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'Proof metadata submission creates one recorded integration event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'evidence_submitted'
      and destination = 'n8n'
      and status = 'disabled'
  ),
  1,
  'Proof metadata submission creates one disabled outbox row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'evidence_submitted'
      and target_table = 'evidence_items'
  ),
  1,
  'Proof metadata submission creates one audit log'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000001',
    'bridge_video',
    'Trying to submit the same already-submitted assignment again.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Already-submitted assignment cannot be submitted again'
);

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000002',
    'testimonial_text',
    'Cross-chapter proof should not be accepted from this member.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Member cannot submit proof for another chapter assignment'
);

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000008',
    'testimonial_text',
    'Too short'
  ) $$,
  '22023',
  'proof summary must describe what happened',
  'Short proof summaries are rejected'
);

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000009',
    'testimonial_text',
    'A not-started assignment should be started before proof is submitted.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Not-started assignments cannot receive proof metadata yet'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000003',
    'testimonial_text',
    'Chapter leader collected this testimonial from a Rush Month participant.',
    null,
    array['student'],
    array['belonging'],
    'chapter_leader',
    'rush_month',
    'Will MEDLIFE feel welcoming?',
    'Leader-collected Goal 15 proof',
    null
  ) $$,
  'Chapter leader can submit proof metadata for visible chapter work'
);

select is(
  (
    select count(*)::int
    from app.evidence_items
    where assignment_id = 'd5000000-0000-4000-8000-000000000003'
      and submitted_by_user_id = '00000000-0000-4000-8000-000000000002'
  ),
  1,
  'Leader proof metadata records the leader as submitter'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000004',
    'testimonial_text',
    'Coach should not submit proof through the normal student proof path.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Coach cannot submit proof through the normal proof path'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000005',
    'testimonial_text',
    'Admin should not submit proof as student truth.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Admin cannot submit proof as student truth'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000006',
    'testimonial_text',
    'DS Admin should not submit proof as student truth.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'DS Admin cannot submit proof as student truth'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.submit_assignment_proof_metadata(
    'd5000000-0000-4000-8000-000000000007',
    'testimonial_text',
    'Super Admin should use HQ review paths, not normal proof submission.'
  ) $$,
  '42501',
  'actor cannot submit proof for this assignment',
  'Super Admin cannot use the normal proof submission path'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'evidence_submitted'
      and status in ('approved_for_live_send', 'sent')
  ),
  0,
  'Proof metadata submission does not approve or send external automation'
);

select is(
  (
    select count(*)::int
    from app.evidence_items
    where storage_path is not null
      and assignment_id::text like 'd5000000-%'
  ),
  0,
  'Goal 15 stores metadata only and performs no proof file uploads'
);

reset role;

select * from finish();

rollback;
