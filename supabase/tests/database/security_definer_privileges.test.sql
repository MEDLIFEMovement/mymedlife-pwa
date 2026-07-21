begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

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

select * from finish();
rollback;
