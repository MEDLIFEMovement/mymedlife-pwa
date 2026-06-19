begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'jordan.pending@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Jordan Pending"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'taylor.pending@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Taylor Pending"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000014', 'authenticated', 'authenticated', 'morgan.pending@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Morgan Pending"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000015', 'authenticated', 'authenticated', 'riley.pending@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Riley Pending"}', now(), now())
on conflict (id) do nothing;

insert into app.profiles (id, display_name, email) values
  ('00000000-0000-4000-8000-000000000012', 'Jordan Pending', 'jordan.pending@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000013', 'Taylor Pending', 'taylor.pending@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000014', 'Morgan Pending', 'morgan.pending@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000015', 'Riley Pending', 'riley.pending@mymedlife.test');

insert into app.memberships (
  id,
  user_id,
  chapter_id,
  role_key,
  status,
  requested_at
) values
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'general_member', 'requested', now()),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'general_member', 'requested', now()),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'action_committee_member', 'requested', now()),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000001', 'general_member', 'requested', now()),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000001', 'general_member', 'requested', now());

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

update app.memberships
set status = 'approved',
    approved_at = now(),
    approved_by = '00000000-0000-4000-8000-000000000002'
where id = '20000000-0000-4000-8000-000000000005';

select is(
  (
    select count(*)::int
    from app.memberships
    where id = '20000000-0000-4000-8000-000000000005'
      and status = 'requested'
  ),
  1,
  'Chapter leader cannot bypass the membership approval function with a direct update'
);

select lives_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000005',
    'general_member',
    'Approve chapter join request for local roster testing.'
  ) $$,
  'Chapter leader can approve a visible join request through the audited function'
);

reset role;

select is(
  (
    select count(*)::int
    from app.memberships
    where id = '20000000-0000-4000-8000-000000000005'
      and status = 'approved'
      and approved_by = '00000000-0000-4000-8000-000000000002'
  ),
  1,
  'Membership approval updates the requested membership row to approved'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'membership_approved'
      and actor_user_id = '00000000-0000-4000-8000-000000000002'
      and payload->>'liveExternalWrite' = 'false'
  ),
  1,
  'Membership approval records one internal membership_approved event'
);

select is(
  (
    select count(*)::int
    from app.integration_events
    where event_type = 'membership_approved'
      and destination = 'internal'
      and status = 'recorded'
  ),
  1,
  'Membership approval records one integration-ready event'
);

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'membership_approved'
      and destination = 'hubspot'
      and status = 'disabled'
  ),
  1,
  'Membership approval creates one disabled outbox row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'membership_approved'
      and target_table = 'memberships'
  ),
  1,
  'Membership approval records one audit log'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select throws_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000012',
    'general_member',
    'DS Admin should not own chapter membership approvals.'
  ) $$,
  '42501',
  'actor cannot approve chapter membership for this chapter',
  'DS Admin cannot approve chapter membership'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select lives_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000012',
    'general_member',
    'Admin approves this join request for local HQ review.'
  ) $$,
  'Admin can approve chapter membership with an audit reason'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';

select lives_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000013',
    'general_member',
    'Super Admin approves this join request for local support coverage.'
  ) $$,
  'Super Admin can approve chapter membership'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000015',
    'general_member',
    'General members should not approve membership.'
  ) $$,
  '42501',
  'actor cannot approve chapter membership for this chapter',
  'General member cannot approve membership'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';

select throws_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000016',
    'general_member',
    'Coach should not own chapter membership approval.'
  ) $$,
  '42501',
  'actor cannot approve chapter membership for this chapter',
  'Coach cannot approve chapter membership'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';

select throws_ok(
  $$ select * from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000014',
    'action_committee_member',
    'Admin should not create a duplicate approved membership in the same chapter.'
  ) $$,
  '23505',
  'duplicate approved membership exists for this chapter',
  'Duplicate approved memberships are rejected'
);

select * from finish();
rollback;
