-- SECURITY DEFINER functions in the app schema must not inherit PostgreSQL's
-- default PUBLIC execute privilege. Preserve the effective authenticated and
-- service-role access that existed before this migration while removing every
-- anonymous/public entry point.

do $$
declare
  target_function record;
  authenticated_was_allowed boolean;
  service_role_was_allowed boolean;
begin
  for target_function in
    select procedure.oid, procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'app'
      and procedure.prosecdef
  loop
    authenticated_was_allowed := has_function_privilege(
      'authenticated',
      target_function.oid,
      'EXECUTE'
    );
    service_role_was_allowed := has_function_privilege(
      'service_role',
      target_function.oid,
      'EXECUTE'
    );

    execute format(
      'revoke execute on function %s from public, anon',
      target_function.signature
    );

    if authenticated_was_allowed then
      execute format(
        'grant execute on function %s to authenticated',
        target_function.signature
      );
    end if;

    if service_role_was_allowed then
      execute format(
        'grant execute on function %s to service_role',
        target_function.signature
      );
    end if;
  end loop;
end;
$$;
