begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select is(
  (
    select count(*)::int
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'app'
      and procedure.prosecdef
      and has_function_privilege('anon', procedure.oid, 'EXECUTE')
  ),
  0,
  'Anonymous users cannot execute app SECURITY DEFINER functions'
);

select is(
  (
    select count(*)::int
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'app'
      and procedure.prosecdef
      and has_function_privilege('public', procedure.oid, 'EXECUTE')
  ),
  0,
  'PUBLIC cannot execute app SECURITY DEFINER functions'
);

select ok(
  has_function_privilege(
    'authenticated',
    'app.approve_chapter_membership(uuid,uuid,text,text)',
    'EXECUTE'
  ),
  'Authenticated access remains available for a supported member RPC'
);

select ok(
  has_function_privilege(
    'service_role',
    'app.toggle_member_story_like(uuid,uuid)',
    'EXECUTE'
  ),
  'Service-role access remains available for a server-only transaction'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'app.enforce_assignment_update_bounds()',
    'EXECUTE'
  ),
  'Authenticated users cannot call the assignment trigger function directly'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'app.enforce_chapter_event_update_bounds()',
    'EXECUTE'
  ),
  'Authenticated users cannot call the chapter-event trigger function directly'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'app.enforce_membership_update_bounds()',
    'EXECUTE'
  ),
  'Authenticated users cannot call the membership trigger function directly'
);

select is(
  (
    select count(*)::int
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'app'
      and procedure.proname in (
        'enforce_assignment_update_bounds',
        'enforce_chapter_event_update_bounds',
        'enforce_membership_update_bounds'
      )
      and has_function_privilege('service_role', procedure.oid, 'EXECUTE')
  ),
  0,
  'Service role cannot call trigger-only enforcement functions directly'
);

select * from finish();
rollback;
