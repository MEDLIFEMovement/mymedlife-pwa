begin;

create or replace function app.can_manage_rollout_controls()
returns boolean
language sql
stable
set search_path = app, public
as $$
  select app.is_ds_admin() or app.is_super_admin();
$$;

commit;
