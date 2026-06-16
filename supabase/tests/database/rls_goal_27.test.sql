begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'advance',
      'Member should not log coach decisions.',
      null
    )
  $$,
  '42501',
  'actor cannot log coach decision for this chapter',
  'General member cannot log coach decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'advance',
      'Leader should not log coach decisions.',
      null
    )
  $$,
  '42501',
  'actor cannot log coach decision for this chapter',
  'Chapter leader cannot log coach decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'advance',
      'DS Admin should not log coach decisions.',
      null
    )
  $$,
  '42501',
  'actor cannot log coach decision for this chapter',
  'DS Admin cannot log coach decisions'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '41000000-0000-4000-8000-000000000002',
      'advance',
      'Coach should not log decisions outside their portfolio.',
      null
    )
  $$,
  '42501',
  'actor cannot log coach decision for this chapter',
  'Coach cannot log decisions outside their portfolio'
);

select lives_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'intervene',
      'Coach logs an intervention because the chapter needs targeted support.',
      'Lead follow-up is unclear.'
    )
  $$,
  'Coach can log an intervene decision for their portfolio chapter'
);

select is(
  (
    select readiness_status::text || '/' || coach_validation_status::text
    from app.phases
    where id = '41000000-0000-4000-8000-000000000001'
  ),
  'blocked/blocked',
  'Coach decision updates phase readiness and validation status'
);

select is(
  (
    select count(*)::int
    from app.phase_readiness_reviews
    where phase_id = '41000000-0000-4000-8000-000000000001'
      and reviewer_user_id = '00000000-0000-4000-8000-000000000003'
      and readiness_status = 'blocked'
      and blocker_summary = 'Lead follow-up is unclear.'
  ),
  1,
  'Coach decision creates one readiness review row'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'coach_decision_logged'
      and actor_user_id = '00000000-0000-4000-8000-000000000003'
      and payload ->> 'coachDecision' = 'intervene'
      and payload ->> 'liveExternalWrite' = 'false'
  ),
  1,
  'Coach decision creates one internal event without external writes'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'coach_decision_logged'
      and destination = 'internal'
      and status = 'recorded'
      and payload ->> 'liveExternalWrite' = 'false'
  ),
  1,
  'Coach decision creates one recorded integration event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'coach_decision_logged'
      and destination = 'n8n'
      and status = 'disabled'
      and payload ->> 'liveExternalWrite' = 'false'
  ),
  1,
  'Coach decision creates one disabled outbox row for future escalation packets'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'coach_decision_logged'
      and target_table = 'phases'
      and actor_user_id = '00000000-0000-4000-8000-000000000003'
  ),
  1,
  'Coach decision creates one audit log row'
);

select lives_ok(
  $$
    select * from app.log_coach_decision(
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '41000000-0000-4000-8000-000000000002',
      'hold',
      'Admin records a hold decision for support visibility.',
      null
    )
  $$,
  'Admin can log a hold decision through the audited function'
);

select *
from finish();

rollback;
