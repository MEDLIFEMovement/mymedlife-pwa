begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'General member can read chapter events only for their own approved chapter'
);

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'General member cannot read another chapter event'
);

select is(
  (select count(*)::int from app.luma_event_links),
  0,
  'General member cannot read Luma event links directly'
);

select throws_ok(
  $$
    update app.chapter_events
    set attendance_count = 999
    where id = '51000000-0000-4000-8000-000000000001'
  $$,
  'P0001',
  'chapter event updates must use app.update_chapter_event_authoritative_fields',
  'General member cannot bypass the audited chapter-event update path'
);

select is(
  (
    select attendance_count
    from app.chapter_events
    where id = '51000000-0000-4000-8000-000000000001'
  ),
  24,
  'General member direct chapter-event update is blocked'
);

select throws_ok(
  $$
    insert into app.points_events (
      id,
      chapter_id,
      campaign_id,
      chapter_event_id,
      awarded_to_user_id,
      points_delta,
      reason,
      created_by
    ) values (
      'd3330000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      25,
      'Member direct points insert should be blocked.',
      '00000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  null,
  'General member cannot forge points evidence through direct inserts'
);

select throws_ok(
  $$
    insert into app.automation_outbox (
      id,
      source_event_id,
      chapter_id,
      destination,
      event_type,
      payload,
      idempotency_key,
      status
    ) values (
      'd3330000-0000-4000-8000-000000000002',
      '80000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'luma',
      'member_forged_outbox',
      '{"mockOnly":true}',
      'goal-333-member-forged-outbox',
      'mocked'
    )
  $$,
  '42501',
  null,
  'General member cannot forge automation outbox evidence'
);

select throws_ok(
  $$
    insert into app.audit_logs (
      id,
      actor_user_id,
      chapter_id,
      action,
      target_table,
      target_id,
      after_value,
      reason
    ) values (
      'd3330000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'member_forged_event_loop_audit',
      'chapter_events',
      '51000000-0000-4000-8000-000000000001',
      '{"mockOnly":true}',
      'Member direct event-loop audit insert should be blocked.'
    )
  $$,
  '42501',
  null,
  'General member cannot forge audit evidence'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'Coach can read chapter events for their assigned portfolio chapter'
);

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'Coach cannot read chapter events outside their portfolio'
);

select is(
  (select count(*)::int from app.luma_event_links),
  1,
  'Coach can read Luma links for their assigned portfolio chapter'
);

select throws_ok(
  $$
    insert into app.luma_event_links (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      chapter_event_id,
      luma_event_id,
      luma_event_url,
      status,
      linked_by
    ) values (
      'd3330000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'coach-created-link',
      'https://lu.ma/coach-created-link',
      'mocked',
      '00000000-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  null,
  'Coach can read Luma links but cannot create or manage them directly'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'Chapter leader can read chapter events for their own chapter'
);

select is(
  (
    select count(*)::int
    from app.chapter_events
    where chapter_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'Chapter leader cannot read chapter events for another chapter'
);

select is(
  (select count(*)::int from app.luma_event_links),
  1,
  'Chapter leader can read Luma links for their own chapter'
);

select throws_ok(
  $$
    update app.chapter_events
    set attendance_count = 26
    where id = '51000000-0000-4000-8000-000000000001'
  $$,
  'P0001',
  'chapter event updates must use app.update_chapter_event_authoritative_fields',
  'Chapter leader cannot bypass the audited chapter-event update path with a direct table update'
);

select is(
  (
    select attendance_count
    from app.chapter_events
    where id = '51000000-0000-4000-8000-000000000001'
  ),
  24,
  'Chapter leader direct chapter-event update is blocked until the audited helper is used'
);

select lives_ok(
  $$
    insert into app.luma_event_links (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      chapter_event_id,
      luma_event_id,
      luma_event_url,
      status,
      linked_by
    ) values (
      'd3330000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'leader-created-link',
      'https://lu.ma/leader-created-link',
      'mocked',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  'Chapter leader can create a mocked Luma link for their own chapter'
);

select is(
  (
    select count(*)::int
    from app.luma_event_links
    where id = 'd3330000-0000-4000-8000-000000000005'
  ),
  1,
  'Leader-created Luma link is visible after insert'
);

select throws_ok(
  $$
    insert into app.luma_event_links (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      chapter_event_id,
      luma_event_id,
      luma_event_url,
      status,
      linked_by
    ) values (
      'd3330000-0000-4000-8000-000000000006',
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '41000000-0000-4000-8000-000000000002',
      '51000000-0000-4000-8000-000000000002',
      'cross-chapter-link',
      'https://lu.ma/cross-chapter-link',
      'mocked',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot create a Luma link for another chapter'
);

select throws_ok(
  $$
    insert into app.luma_event_links (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      chapter_event_id,
      luma_event_id,
      luma_event_url,
      status,
      linked_by
    ) values (
      'd3330000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'pending-link',
      'https://lu.ma/pending-link',
      'pending',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot create a live-looking or pending Luma link status through normal app paths'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select is(
  (
    select count(*)::int
    from app.chapter_events
    where id in (
      '51000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000002'
    )
  ),
  2,
  'Admin can read known launch-lane chapter events across chapters for support'
);

select is(
  (
    select count(*)::int
    from app.luma_event_links
    where id in (
      '52000000-0000-4000-8000-000000000001',
      'd3330000-0000-4000-8000-000000000005'
    )
  ),
  2,
  'Admin can read known launch-lane Luma links for support review'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select is(
  (
    select count(*)::int
    from app.chapter_events
    where id in (
      '51000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000002'
    )
  ),
  2,
  'DS Admin inherits support read access for known launch-lane chapter events'
);

select is(
  (
    select count(*)::int
    from app.luma_event_links
    where id in (
      '52000000-0000-4000-8000-000000000001',
      'd3330000-0000-4000-8000-000000000005'
    )
  ),
  2,
  'DS Admin inherits support read access for known launch-lane Luma links'
);

select * from finish();
rollback;
