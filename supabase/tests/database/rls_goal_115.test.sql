begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

insert into app.assignments (
  id,
  chapter_id,
  campaign_id,
  phase_id,
  chapter_event_id,
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
    'd9000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'Goal 115 approve proof',
    'Approve this submitted proof for chapter completion.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'submitted',
    'Short testimonial from the owner.',
    15,
    'students_invited'
  ),
  (
    'd9000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'Goal 115 request changes proof',
    'Request changes for this submitted proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'submitted',
    'Short testimonial from the owner.',
    12,
    'follow_up_completed'
  ),
  (
    'd9000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'Goal 115 reject proof',
    'Reject this submitted proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'submitted',
    'Short testimonial from the owner.',
    8,
    'proof_quality'
  ),
  (
    'd9000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'Goal 115 not ready proof',
    'This assignment is not submitted yet.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'in_progress',
    'Short testimonial from the owner.',
    6,
    'not_ready'
  ),
  (
    'd9000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000002',
    'Goal 115 super admin proof',
    'Super Admin can support this submitted proof.',
    '00000000-0000-4000-8000-000000000007',
    'general_member',
    '00000000-0000-4000-8000-000000000004',
    'submitted',
    'Short testimonial from the owner.',
    10,
    'students_invited'
  ),
  (
    'd9000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'Goal 115 committee chair proof',
    'Committee chair can review this submitted proof.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000010',
    'submitted',
    'Short testimonial from the owner.',
    9,
    'students_invited'
  );

insert into app.evidence_items (
  id,
  assignment_id,
  chapter_id,
  chapter_event_id,
  submitted_by_user_id,
  evidence_type,
  summary,
  sharing_status,
  status,
  target_audiences,
  proof_categories,
  messenger_type,
  lifecycle_stage,
  hesitation_addressed,
  activity_label
) values
  (
    'd9100000-0000-4000-8000-000000000001',
    'd9000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 115 proof ready for leader approval.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 approve proof'
  ),
  (
    'd9100000-0000-4000-8000-000000000002',
    'd9000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 115 proof that needs clearer context.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 changes proof'
  ),
  (
    'd9100000-0000-4000-8000-000000000003',
    'd9000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 115 proof that should be rejected.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 reject proof'
  ),
  (
    'd9100000-0000-4000-8000-000000000004',
    'd9000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 115 proof is not ready because assignment is still in progress.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 not ready proof'
  ),
  (
    'd9100000-0000-4000-8000-000000000005',
    'd9000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000007',
    'testimonial_text',
    'Goal 115 second-chapter proof for Super Admin support.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 super proof'
  ),
  (
    'd9100000-0000-4000-8000-000000000006',
    'd9000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 115 proof for committee chair review.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 115 committee chair proof'
  );

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    insert into app.approvals (
      id,
      evidence_item_id,
      chapter_id,
      reviewer_user_id,
      decision,
      review_type,
      note
    ) values (
      'd9200000-0000-4000-8000-000000000001',
      'd9100000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'approved_for_sharing',
      'chapter_proof_decision',
      'Direct approval insert should be blocked.'
    )
  $$,
  '42501',
  null,
  'Leader cannot bypass the leader proof function with direct approval insert'
);

select throws_ok(
  $$
    insert into app.points_events (
      id,
      chapter_id,
      campaign_id,
      assignment_id,
      evidence_item_id,
      awarded_to_user_id,
      points_delta,
      reason,
      created_by
    ) values (
      'd9300000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'd9000000-0000-4000-8000-000000000001',
      'd9100000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      15,
      'Direct points insert should be blocked.',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Leader cannot bypass the leader proof function with direct points insert'
);

select throws_ok(
  $$
    insert into app.kpi_events (
      id,
      chapter_id,
      campaign_id,
      assignment_id,
      evidence_item_id,
      metric_key,
      metric_value,
      source,
      created_by
    ) values (
      'd9400000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'd9000000-0000-4000-8000-000000000001',
      'd9100000-0000-4000-8000-000000000001',
      'students_invited',
      1,
      'direct_insert',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Leader cannot bypass the leader proof function with direct KPI insert'
);

update app.evidence_items
set status = 'approved'
where id = 'd9100000-0000-4000-8000-000000000001';

select is(
  (
    select status::text
    from app.evidence_items
    where id = 'd9100000-0000-4000-8000-000000000001'
  ),
  'pending_review',
  'Leader direct evidence update is blocked by RLS'
);

select lives_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000001',
    'approve',
    'This proof has enough context to count for the chapter action.'
  ) $$,
  'Leader can approve submitted proof through the audited function'
);

select is(
  (
    select assignments.status::text || ':' || evidence.status::text
    from app.assignments assignments
    join app.evidence_items evidence on evidence.assignment_id = assignments.id
    where evidence.id = 'd9100000-0000-4000-8000-000000000001'
  ),
  'approved:approved',
  'Leader approval updates assignment and proof status'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.approvals
    where evidence_item_id = 'd9100000-0000-4000-8000-000000000001'
      and reviewer_user_id = '00000000-0000-4000-8000-000000000002'
      and review_type = 'chapter_proof_decision'
  ),
  1,
  'Leader approval creates one chapter proof approval row'
);

select is(
  (
    select count(*)::int
    from app.points_events
    where evidence_item_id = 'd9100000-0000-4000-8000-000000000001'
      and points_delta = 15
      and awarded_to_user_id = '00000000-0000-4000-8000-000000000001'
  ),
  1,
  'Leader approval creates one points event for the assigned member'
);

select is(
  (
    select count(*)::int
    from app.kpi_events
    where evidence_item_id = 'd9100000-0000-4000-8000-000000000001'
      and metric_key = 'students_invited'
      and source = 'leader_proof_decision'
  ),
  1,
  'Leader approval creates one KPI event'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'evidence_approved'
      and actor_user_id = '00000000-0000-4000-8000-000000000002'
      and payload->>'publicPublish' = 'false'
      and payload->>'hqSharingDecision' = 'false'
  ),
  1,
  'Leader approval creates one internal event without public publishing'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'evidence_approved'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'Leader approval creates one recorded integration event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'evidence_approved'
      and destination = 'n8n'
      and status = 'disabled'
  ),
  1,
  'Leader approval creates one disabled outbox row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'leader_proof_approved'
      and target_id = 'd9100000-0000-4000-8000-000000000001'
      and after_value->>'publicPublish' = 'false'
  ),
  1,
  'Leader approval creates one audit log'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000001',
    'reject',
    'A final approval should not be silently overwritten.'
  ) $$,
  '22023',
  'proof already has a final leader decision',
  'Final leader proof decisions cannot be silently overwritten'
);

select lives_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000002',
    'request_changes',
    'Please add who attended and why the proof should count.'
  ) $$,
  'Leader can request changes on submitted proof'
);

select is(
  (
    select assignments.status::text || ':' || evidence.status::text
    from app.assignments assignments
    join app.evidence_items evidence on evidence.assignment_id = assignments.id
    where evidence.id = 'd9100000-0000-4000-8000-000000000002'
  ),
  'changes_requested:changes_requested',
  'Change request returns assignment and proof to changes requested'
);

select is(
  (
    select (
      select count(*)::int
      from app.points_events
      where evidence_item_id = 'd9100000-0000-4000-8000-000000000002'
    ) + (
      select count(*)::int
      from app.kpi_events
      where evidence_item_id = 'd9100000-0000-4000-8000-000000000002'
    )
  ),
  0,
  'Change request does not award points or KPI movement'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'evidence_changes_requested'
      and payload->>'memberNudge' = 'false'
  ),
  1,
  'Change request records one internal event without member nudges'
);

select lives_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000003',
    'reject',
    'This proof does not match the assigned action.'
  ) $$,
  'Leader can reject proof through the audited function'
);

select is(
  (
    select assignments.status::text || ':' || evidence.status::text
    from app.assignments assignments
    join app.evidence_items evidence on evidence.assignment_id = assignments.id
    where evidence.id = 'd9100000-0000-4000-8000-000000000003'
  ),
  'changes_requested:rejected',
  'Reject marks proof rejected and assignment changes requested'
);

select is(
  (
    select (
      select count(*)::int
      from app.points_events
      where evidence_item_id = 'd9100000-0000-4000-8000-000000000003'
    ) + (
      select count(*)::int
      from app.kpi_events
      where evidence_item_id = 'd9100000-0000-4000-8000-000000000003'
    )
  ),
  0,
  'Reject does not award points or KPI movement'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'leader_proof_rejected'
      and target_id = 'd9100000-0000-4000-8000-000000000003'
  ),
  1,
  'Reject creates one audit log'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'General members should not approve chapter proof.'
  ) $$,
  '42501',
  'actor cannot record leader proof decision',
  'General member cannot record leader proof decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'Coaches should not approve chapter proof.'
  ) $$,
  '42501',
  'actor cannot record leader proof decision',
  'Coach cannot record leader proof decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'Admin should not own routine chapter proof truth.'
  ) $$,
  '42501',
  'actor cannot record leader proof decision',
  'Admin cannot record routine leader proof decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'DS Admin should not own routine chapter proof truth.'
  ) $$,
  '42501',
  'actor cannot record leader proof decision',
  'DS Admin cannot record routine leader proof decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000005',
    'approve',
    'A UCLA chapter leader should not decide another chapter proof.'
  ) $$,
  '42501',
  'actor cannot record leader proof decision',
  'Chapter leaders cannot record proof decisions outside their chapter'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000010';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000006',
    'request_changes',
    'Committee chair needs clearer detail before this proof should count.'
  ) $$,
  'Approved chapter leader roles can record a chapter proof decision'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'Too short'
  ) $$,
  '22023',
  'leader proof decision note must explain the decision',
  'Short leader proof decision notes are rejected'
);

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000004',
    'approve',
    'This proof should not be decided while the assignment is still in progress.'
  ) $$,
  '22023',
  'proof is not ready for leader decision',
  'Leader proof decisions require submitted assignments and pending proof'
);

select throws_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000099',
    'approve',
    'Missing proof should fail without writing anything.'
  ) $$,
  'P0002',
  'evidence item not found',
  'Missing proof is rejected'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.record_leader_proof_decision(
    'd9100000-0000-4000-8000-000000000005',
    'approve',
    'Super Admin can support this chapter proof decision without external sends.'
  ) $$,
  'Super Admin can record an audited leader proof decision'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type in ('evidence_approved', 'evidence_changes_requested', 'evidence_rejected')
      and status in ('approved_for_live_send', 'sent')
  ),
  0,
  'Leader proof decisions do not approve or send external automation'
);

reset role;

select * from finish();

rollback;
