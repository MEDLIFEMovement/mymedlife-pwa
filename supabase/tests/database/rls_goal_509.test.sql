begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000007',
    'set_staff_role',
    null,
    'coach',
    'General members must not change access.'
  ) $$,
  '42501',
  'DS Admin or Super Admin access required',
  'General member cannot call the admin access management RPC'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select throws_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000001',
    'set_chapter_role',
    '10000000-0000-4000-8000-000000000001',
    'action_committee_chair',
    'too short'
  ) $$,
  '22023',
  'admin access change reason must be at least 12 characters',
  'Admin access changes require a real audit reason'
);

create temp table admin_access_result as
select * from app.admin_change_user_access(
  '00000000-0000-4000-8000-000000000001',
  'set_chapter_role',
  '10000000-0000-4000-8000-000000000001',
  'action_committee_chair',
  'Promote Sofia into chapter leadership for workspace access testing.'
);

select is(
  (select default_workspace from admin_access_result),
  'leader_command_center',
  'Promoting a member to action committee chair immediately changes default workspace'
);

select ok(
  (select 'leader_command_center' = any(allowed_workspaces) from admin_access_result),
  'Promoted user can access the Student Command Center'
);

select is(
  (
    select count(*)::int
    from app.memberships
    where user_id = '00000000-0000-4000-8000-000000000001'
      and chapter_id = '10000000-0000-4000-8000-000000000001'
      and role_key = 'action_committee_chair'
      and status = 'approved'
  ),
  1,
  'Admin access RPC approves the requested chapter leader role'
);

select is(
  (
    select count(*)::int
    from app.memberships
    where user_id = '00000000-0000-4000-8000-000000000001'
      and chapter_id = '10000000-0000-4000-8000-000000000001'
      and role_key = 'general_member'
      and status = 'inactive'
  ),
  1,
  'Admin access RPC demotes old chapter role rows when setting a new chapter role'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_user_access.set_chapter_role'
      and target_table = 'profiles'
      and target_id = '00000000-0000-4000-8000-000000000001'
  ),
  1,
  'Chapter role access change records one audit row'
);

create temp table admin_staff_result as
select * from app.admin_change_user_access(
  '00000000-0000-4000-8000-000000000008',
  'set_staff_role',
  null,
  'coach',
  'Assign coach access during admin workspace testing.'
);

select is(
  (select default_workspace from admin_staff_result),
  'staff_command_center',
  'Assigning coach access immediately changes default workspace'
);

select is(
  (
    select count(*)::int
    from app.staff_role_assignments
    where user_id = '00000000-0000-4000-8000-000000000008'
      and role_key = 'coach'
      and status = 'active'
  ),
  1,
  'Admin access RPC creates an active staff role'
);

create temp table admin_portfolio_result as
select * from app.admin_change_user_access(
  '00000000-0000-4000-8000-000000000008',
  'set_coach_portfolio',
  '10000000-0000-4000-8000-000000000002',
  null,
  'Assign coach to the Lakeside portfolio for access testing.'
);

select is(
  (
    select count(*)::int
    from app.coach_chapter_assignments
    where coach_user_id = '00000000-0000-4000-8000-000000000008'
      and chapter_id = '10000000-0000-4000-8000-000000000002'
      and status = 'active'
  ),
  1,
  'Admin access RPC assigns coach portfolio scope'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_user_access.set_coach_portfolio'
      and target_id = '00000000-0000-4000-8000-000000000008'
  ),
  1,
  'Coach portfolio access change records one audit row'
);

select throws_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000008',
    'set_staff_role',
    null,
    'super_admin',
    'DS Admin should not assign Super Admin access.'
  ) $$,
  '42501',
  'only a Super Admin can assign super admin access',
  'DS Admin cannot assign Super Admin access'
);

select throws_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000006',
    'set_staff_role',
    null,
    'admin',
    'DS Admin should not change a Super Admin account.'
  ) $$,
  '42501',
  'only a Super Admin can change a Super Admin account',
  'DS Admin cannot change an existing Super Admin account'
);

select throws_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000005',
    'deactivate_user',
    null,
    null,
    'Self deactivation should be blocked for account safety.'
  ) $$,
  '42501',
  'admins cannot perform destructive access changes on their own account',
  'Admin access RPC blocks self-destructive deactivation'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';

select lives_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000005',
    'deactivate_user',
    null,
    null,
    'Deactivate DS Admin account during Super Admin safeguard testing.'
  ) $$,
  'Super Admin can deactivate a non-Super Admin account through the audited RPC'
);

select is(
  (
    select status::text
    from app.profiles
    where id = '00000000-0000-4000-8000-000000000005'
  ),
  'inactive',
  'Deactivation updates the profile status'
);

select is(
  (
    select count(*)::int
    from app.staff_role_assignments
    where user_id = '00000000-0000-4000-8000-000000000005'
      and status = 'active'
  ),
  0,
  'Deactivation removes active staff roles'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_user_access.deactivate_user'
      and target_id = '00000000-0000-4000-8000-000000000005'
  ),
  1,
  'Deactivation records one audit row'
);

select lives_ok(
  $$ select * from app.admin_change_user_access(
    '00000000-0000-4000-8000-000000000001',
    'deactivate_user',
    null,
    null,
    'Deactivate member with an app-created chapter membership.'
  ) $$,
  'Super Admin can deactivate a member whose membership has no HubSpot association key'
);

select is(
  (
    select count(*)::int
    from app.memberships
    where user_id = '00000000-0000-4000-8000-000000000001'
      and status <> 'inactive'
  ),
  0,
  'Deactivation closes every chapter membership, including app-created rows'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'admin_user_access.deactivate_user'
      and target_id = '00000000-0000-4000-8000-000000000001'
  ),
  1,
  'App-created membership deactivation records one transactional audit row'
);

select * from finish();

rollback;
