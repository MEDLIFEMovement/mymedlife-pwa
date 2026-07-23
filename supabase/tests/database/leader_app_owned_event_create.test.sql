begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.create_chapter_event_for_leader(
    '82000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Member-created event',
    'social',
    'This must not be created.',
    '2030-08-01T18:00:00Z',
    '2030-08-01T20:00:00Z',
    'in_person',
    'Student center',
    null,
    40,
    '2030-07-31T23:59:59Z',
    'Team Bonding & Social Events',
    'Other Activities',
    'Member should not create chapter events.'
  ) $$,
  '42501',
  'actor cannot create chapter events',
  'General member cannot create a chapter event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select * from app.create_chapter_event_for_leader(
    '82000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Coach-created event',
    'social',
    'This must not be created.',
    '2030-08-01T18:00:00Z',
    '2030-08-01T20:00:00Z',
    'in_person',
    'Student center',
    null,
    40,
    '2030-07-31T23:59:59Z',
    'Team Bonding & Social Events',
    'Other Activities',
    'Coach should not create chapter events.'
  ) $$,
  '42501',
  'actor cannot create chapter events',
  'Coach cannot create a chapter event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select throws_ok(
  $$
    insert into app.chapter_events (
      chapter_id,
      title,
      event_type,
      status,
      planned_by_user_id,
      owner_user_id,
      starts_at
    ) values (
      '10000000-0000-4000-8000-000000000001',
      'Direct insert bypass',
      'social',
      'published',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000002',
      '2030-08-01T18:00:00Z'
    )
  $$,
  '42501',
  null,
  'Leader cannot bypass the audited function with a direct event insert'
);

select throws_ok(
  $$ select * from app.create_chapter_event_for_leader(
    '82000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'No',
    'social',
    null,
    '2030-08-01T18:00:00Z',
    null,
    'in_person',
    'Student center',
    null,
    null,
    null,
    'Team Bonding & Social Events',
    null,
    'Leader uses an invalid short title.'
  ) $$,
  '22023',
  'event title must be between 3 and 160 characters',
  'Invalid event titles are rejected'
);

select throws_ok(
  $$ select * from app.create_chapter_event_for_leader(
    '82000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'Invalid timing event',
    'social',
    null,
    '2030-08-01T20:00:00Z',
    '2030-08-01T18:00:00Z',
    'in_person',
    'Student center',
    null,
    null,
    null,
    'Team Bonding & Social Events',
    null,
    'Leader uses an invalid time range.'
  ) $$,
  '22023',
  'event end time cannot be before start time',
  'Invalid event timing is rejected'
);

create temp table leader_event_create_result as
select * from app.create_chapter_event_for_leader(
  '82000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000001',
  'TEST App-Owned Service Night',
  'volunteer',
  'TEST service event created inside myMEDLIFE.',
  '2030-08-01T18:00:00Z',
  '2030-08-01T20:00:00Z',
  'hybrid',
  'Student center',
  'https://example.org/test-meeting',
  40,
  '2030-07-31T23:59:59Z',
  'Service Learning Prep & Awareness',
  'Moving Mountains',
  'Leader creates the app-owned launch test event.'
);

select ok(
  (select chapter_event_id is not null from leader_event_create_result),
  'Leader event creation returns the chapter-event id'
);

select is(
  (
    select title || ':' || status::text || ':' || location_type || ':' || capacity::text
    from app.chapter_events
    where id = (select chapter_event_id from leader_event_create_result)
  ),
  'TEST App-Owned Service Night:published:hybrid:40',
  'The app-owned event stores the published operational fields'
);

set local role postgres;

select is(
  (
    select count(*)::int
    from app.events
    where id = (select event_id from leader_event_create_result)
      and event_type = 'chapter_event_created'
  ),
  1,
  'Event creation records one internal event'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where id = (select audit_log_id from leader_event_create_result)
      and action = 'chapter_event_created'
  ),
  1,
  'Event creation records one audit row'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where source_event_id = (select event_id from leader_event_create_result)
  ),
  0,
  'Event creation records no integration event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where source_event_id = (select event_id from leader_event_create_result)
  ),
  0,
  'Event creation records no automation outbox row'
);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

create temp table duplicate_event_create_result as
select * from app.create_chapter_event_for_leader(
  '82000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000001',
  'TEST App-Owned Service Night',
  'volunteer',
  'TEST service event created inside myMEDLIFE.',
  '2030-08-01T18:00:00Z',
  '2030-08-01T20:00:00Z',
  'hybrid',
  'Student center',
  'https://example.org/test-meeting',
  40,
  '2030-07-31T23:59:59Z',
  'Service Learning Prep & Awareness',
  'Moving Mountains',
  'Leader safely retries the app-owned event request.'
);

select is(
  (select chapter_event_id from duplicate_event_create_result),
  (select chapter_event_id from leader_event_create_result),
  'A duplicate request returns the original event'
);

select ok(
  (select deduplicated from duplicate_event_create_result),
  'A duplicate request is labeled as deduplicated'
);

select is(
  (
    select count(*)::int
    from app.chapter_events
    where creation_request_id = '82000000-0000-4000-8000-000000000005'
  ),
  1,
  'A duplicate request creates no duplicate chapter event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select lives_ok(
  $$ select * from app.create_chapter_event_for_leader(
    '82000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    'TEST Admin-Supported Chapter Event',
    'info',
    'TEST cross-chapter support event.',
    '2030-09-01T18:00:00Z',
    null,
    'in_person',
    'Chapter room',
    null,
    null,
    null,
    'Recruitment & Membership Tracking',
    null,
    'Admin creates a support event for an active chapter.'
  ) $$,
  'Admin can create an app-owned event for an active chapter'
);

select is(
  (
    select count(*)::int
    from app.chapter_events
    where creation_request_id = '82000000-0000-4000-8000-000000000006'
      and chapter_id = '10000000-0000-4000-8000-000000000002'
  ),
  1,
  'Admin event creation stays scoped to the requested chapter'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select throws_ok(
  $$
    update app.chapter_events
    set location_name = 'Unauthorized direct edit'
    where id = (select chapter_event_id from leader_event_create_result)
  $$,
  'P0001',
  'chapter event updates must use app.update_chapter_event_authoritative_fields',
  'Leader cannot bypass the update guard for new event fields'
);

select * from finish();
rollback;
