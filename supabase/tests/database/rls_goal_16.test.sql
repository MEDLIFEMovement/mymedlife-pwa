begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

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
    'd7000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'bridge_video',
    'Goal 16 proof that a Rush social helped freshmen make friends.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I find friends here?',
    'Goal 16 Rush social proof'
  ),
  (
    'd7000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 16 proof that should be kept internal rather than shared broadly.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 16 internal-only proof'
  ),
  (
    'd7000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'testimonial_text',
    'Goal 16 proof where HQ needs the chapter to add more detail.',
    'submitted',
    'pending_review',
    array['chapter_leader'],
    array['event_quality'],
    'student',
    'rush_month',
    'Was the event worth attending?',
    'Goal 16 changes requested proof'
  ),
  (
    'd7000000-0000-4000-8000-000000000004',
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'bridge_video',
    'Goal 16 proof that already has a final sharing decision.',
    'approved_for_sharing',
    'approved',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I find friends here?',
    'Goal 16 final proof'
  ),
  (
    'd7000000-0000-4000-8000-000000000005',
    '50000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000007',
    'testimonial_text',
    'Goal 16 second-chapter proof for super admin review.',
    'submitted',
    'pending_review',
    array['student'],
    array['belonging'],
    'student',
    'rush_month',
    'Will I belong?',
    'Goal 16 super admin proof'
  );

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'approved_for_sharing',
    'Member should not be able to approve proof sharing.'
  ) $$,
  '42501',
  'actor cannot record HQ proof sharing decision',
  'General member cannot record HQ proof sharing decision'
);

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
      note
    ) values (
      'd7100000-0000-4000-8000-000000000001',
      'd7000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'approved_for_sharing',
      'Leader direct approval insert should be blocked.'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot bypass the HQ sharing function with direct approval insert'
);

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'approved_for_sharing',
    'Chapter leader should not be able to approve proof sharing.'
  ) $$,
  '42501',
  'actor cannot record HQ proof sharing decision',
  'Chapter leader cannot record HQ proof sharing decision'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'approved_for_sharing',
    'Coach should not be able to approve proof sharing.'
  ) $$,
  '42501',
  'actor cannot record HQ proof sharing decision',
  'Coach cannot record HQ proof sharing decision'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'approved_for_sharing',
    'DS Admin should not own HQ content sharing decisions.'
  ) $$,
  '42501',
  'actor cannot record HQ proof sharing decision',
  'DS Admin cannot record HQ proof sharing decision'
);

update app.evidence_items
set sharing_status = 'approved_for_sharing'
where id = 'd7000000-0000-4000-8000-000000000001';

select is(
  (
    select sharing_status::text
    from app.evidence_items
    where id = 'd7000000-0000-4000-8000-000000000001'
  ),
  'submitted',
  'DS Admin cannot directly update proof sharing status'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

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
      'd7100000-0000-4000-8000-000000000002',
      'd7000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000004',
      'approved_for_sharing',
      'Admin direct approval insert should be blocked so audit bundle is required.'
    )
  $$,
  '42501',
  null,
  'Admin cannot bypass the HQ sharing function with direct approval insert'
);

select lives_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'approved_for_sharing',
    'This proof clearly helps other chapters understand why Rush socials matter.'
  ) $$,
  'Admin can record an approved-for-sharing HQ decision through the audited function'
);

select is(
  (
    select status::text || ':' || sharing_status::text
    from app.evidence_items
    where id = 'd7000000-0000-4000-8000-000000000001'
  ),
  'approved:approved_for_sharing',
  'Approved-for-sharing decision updates proof review and sharing status'
);

select is(
  (
    select count(*)::int
    from app.approvals
    where evidence_item_id = 'd7000000-0000-4000-8000-000000000001'
      and reviewer_user_id = '00000000-0000-4000-8000-000000000004'
      and decision = 'approved_for_sharing'
      and review_type = 'hq_content_sharing'
  ),
  1,
  'HQ sharing decision creates one approval row'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'hq_sharing_decision_logged'
      and actor_user_id = '00000000-0000-4000-8000-000000000004'
      and payload->>'publicPublish' = 'false'
  ),
  1,
  'HQ sharing decision creates one internal event without public publishing'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'hq_sharing_decision_logged'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'HQ sharing decision creates one recorded integration event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'hq_sharing_decision_logged'
      and destination = 'n8n'
      and status = 'disabled'
  ),
  1,
  'HQ sharing decision creates one disabled outbox row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'hq_sharing_decision_logged'
      and target_id = 'd7000000-0000-4000-8000-000000000001'
  ),
  1,
  'HQ sharing decision creates one audit log'
);

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000001',
    'not_shared',
    'Trying to change a final decision should be blocked.'
  ) $$,
  '22023',
  'proof already has a final sharing decision',
  'Final HQ sharing decisions cannot be silently overwritten'
);

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000002',
    'not_shared',
    'Too short'
  ) $$,
  '22023',
  'HQ sharing note must explain the decision',
  'Short HQ sharing notes are rejected'
);

select lives_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000002',
    'not_shared',
    'This proof is useful internally but is not strong enough to share broadly.'
  ) $$,
  'Admin can record a not-shared HQ decision'
);

select is(
  (
    select status::text || ':' || sharing_status::text
    from app.evidence_items
    where id = 'd7000000-0000-4000-8000-000000000002'
  ),
  'approved:not_shared',
  'Not-shared decision keeps proof accepted but not broadly shared'
);

select lives_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000003',
    'changes_requested',
    'Please add more context about who attended and why the testimonial matters.'
  ) $$,
  'Admin can request proof changes before broad sharing'
);

select is(
  (
    select status::text || ':' || sharing_status::text
    from app.evidence_items
    where id = 'd7000000-0000-4000-8000-000000000003'
  ),
  'changes_requested:in_hq_review',
  'Changes-requested decision keeps proof in HQ review'
);

select throws_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000004',
    'not_shared',
    'Already-final proof should not receive another HQ decision.'
  ) $$,
  '22023',
  'proof already has a final sharing decision',
  'Already-final seeded proof cannot be decided again'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$ select * from app.record_hq_proof_sharing_decision(
    'd7000000-0000-4000-8000-000000000005',
    'approved_for_sharing',
    'Super Admin can approve this second-chapter proof without changing external systems.'
  ) $$,
  'Super Admin can record an HQ sharing decision'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'hq_sharing_decision_logged'
      and status in ('approved_for_live_send', 'sent')
  ),
  0,
  'HQ sharing decisions do not approve or send external automation'
);

reset role;

select * from finish();

rollback;
