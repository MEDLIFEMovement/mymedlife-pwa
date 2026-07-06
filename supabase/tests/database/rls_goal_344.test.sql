begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"attendance_count":25}'::jsonb,
    'Member should not update chapter event metrics directly.'
  ) $$,
  '42501',
  'actor cannot update authoritative chapter event fields',
  'General member cannot call the authoritative chapter-event update helper'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"attendance_count":25}'::jsonb,
    'Coach should not update chapter event metrics directly.'
  ) $$,
  '42501',
  'actor cannot update authoritative chapter event fields',
  'Coach cannot call the authoritative chapter-event update helper'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{}'::jsonb,
    'Leader tried an empty chapter event patch.'
  ) $$,
  '22023',
  'authoritative chapter event patch must be a non-empty object',
  'Empty chapter-event patch is rejected'
);

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"promotion_summary":"new copy"}'::jsonb,
    'Leader should not bypass the blocked narrative lane.'
  ) $$,
  '22023',
  'narrative chapter event updates remain blocked pending product decision',
  'Narrative field updates remain blocked in the authoritative helper'
);

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"title":"New title"}'::jsonb,
    'Leader should not change deferred title fields in this first path.'
  ) $$,
  '22023',
  'field title is outside the first audited chapter event update subset',
  'Deferred authoritative fields are rejected from the first helper'
);

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"status":null}'::jsonb,
    'Leader should not null the event status.'
  ) $$,
  '22023',
  'status cannot be null',
  'Status cannot be nulled through the authoritative helper'
);

select throws_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000001',
    '{"starts_at":"2026-07-10T18:00:00.000Z","ends_at":"2026-07-10T17:00:00.000Z"}'::jsonb,
    'Leader should not save an end time before the start time.'
  ) $$,
  '22023',
  'event end time cannot be before start time',
  'Invalid chapter-event timing is rejected'
);

create temp table authoritative_update_result as
select * from app.update_chapter_event_authoritative_fields(
  '51000000-0000-4000-8000-000000000001',
  jsonb_build_object(
    'status', 'completed',
    'starts_at', '2026-07-10T17:00:00.000Z',
    'ends_at', '2026-07-10T19:00:00.000Z',
    'attendance_count', 26,
    'eligible_member_count', 81,
    'attendance_rate', 0.32,
    'nps_score', 81
  ),
  'Leader updates launch-lane authoritative event metrics locally.'
);

select is(
  (select chapter_event_id from authoritative_update_result),
  '51000000-0000-4000-8000-000000000001'::uuid,
  'Authoritative helper returns the updated chapter-event id'
);

select is(
  (select cardinality(updated_fields) from authoritative_update_result),
  7,
  'Authoritative helper reports each changed field'
);

select is(
  (
    select status::text || ':' || attendance_count::text || ':' || eligible_member_count::text || ':' || coalesce(nps_score::text, 'null')
    from app.chapter_events
    where id = '51000000-0000-4000-8000-000000000001'
  ),
  'completed:26:81:81',
  'Leader authoritative helper updates status and launch-lane event metrics'
);

select is(
  (
    select count(*)::int
    from app.events
    where id = (select event_id from authoritative_update_result)
      and event_type = 'chapter_event_authoritative_updated'
  ),
  1,
  'Authoritative helper records one internal event row'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select is(
  (
    select count(*)::int
    from app.audit_logs
    where id = (select audit_log_id from authoritative_update_result)
      and action = 'chapter_event_authoritative_updated'
      and target_table = 'chapter_events'
  ),
  1,
  'Authoritative helper records one audit row'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where source_event_id = (select event_id from authoritative_update_result)
  ),
  0,
  'Authoritative helper creates no integration event rows'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where source_event_id = (select event_id from authoritative_update_result)
  ),
  0,
  'Authoritative helper creates no automation outbox rows'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select lives_ok(
  $$ select * from app.update_chapter_event_authoritative_fields(
    '51000000-0000-4000-8000-000000000002',
    '{"status":"published","attendance_count":12}'::jsonb,
    'Admin updates cross-chapter event status for support testing.'
  ) $$,
  'Admin can use the authoritative helper for cross-chapter support updates'
);

select is(
  (
    select status::text || ':' || attendance_count::text
    from app.chapter_events
    where id = '51000000-0000-4000-8000-000000000002'
  ),
  'published:12',
  'Admin authoritative helper can update a cross-chapter event locally'
);

select * from finish();
rollback;
