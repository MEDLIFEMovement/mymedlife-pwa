begin;

select plan(14);

select has_table(
  'app',
  'warehouse_export_runs',
  'warehouse export runs table exists'
);
select has_table(
  'app',
  'warehouse_export_failures',
  'warehouse export failures table exists'
);
select has_function(
  'app',
  'get_databricks_event_metrics_export',
  array['timestamp with time zone']
);

select col_is_pk(
  'app',
  'warehouse_export_runs',
  'id',
  'warehouse export run id is the primary key'
);
select ok(
  exists (
    select 1
    from pg_index index_record
    join pg_class table_record on table_record.oid = index_record.indrelid
    join pg_namespace schema_record on schema_record.oid = table_record.relnamespace
    join pg_attribute column_record
      on column_record.attrelid = table_record.oid
      and column_record.attnum = any(index_record.indkey)
    where schema_record.nspname = 'app'
      and table_record.relname = 'warehouse_export_runs'
      and column_record.attname = 'batch_key'
      and index_record.indisunique
  ),
  'warehouse batch keys are unique'
);
select ok(
  (
    select count(*) = 3
    from pg_constraint constraint_record
    where constraint_record.contype = 'f'
      and constraint_record.conrelid in (
        'app.warehouse_export_runs'::regclass,
        'app.warehouse_export_failures'::regclass
      )
  ),
  'warehouse export lineage and actor references use foreign keys'
);

select is(
  (
    select relrowsecurity
    from pg_class
    where oid = 'app.warehouse_export_runs'::regclass
  ),
  true,
  'warehouse export runs use RLS'
);
select is(
  (
    select relrowsecurity
    from pg_class
    where oid = 'app.warehouse_export_failures'::regclass
  ),
  true,
  'warehouse export failures use RLS'
);

select is(
  (
    select array_agg(policyname::text order by policyname)
    from pg_policies
    where schemaname = 'app'
      and tablename = 'warehouse_export_runs'
  ),
  array['warehouse_export_runs_select_ds_admin'],
  'warehouse export runs expose only the admin read policy'
);
select is(
  (
    select array_agg(policyname::text order by policyname)
    from pg_policies
    where schemaname = 'app'
      and tablename = 'warehouse_export_failures'
  ),
  array['warehouse_export_failures_select_ds_admin'],
  'warehouse export failures expose only the admin read policy'
);

select ok(
  has_function_privilege(
    'service_role',
    'app.get_databricks_event_metrics_export(timestamp with time zone)',
    'EXECUTE'
  ),
  'service role can execute the aggregate export function'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'app.get_databricks_event_metrics_export(timestamp with time zone)',
    'EXECUTE'
  ),
  'authenticated users cannot execute the aggregate export function'
);

select ok(
  (
    select index_record.indisunique
    from pg_index index_record
    join pg_class index_name on index_name.oid = index_record.indexrelid
    join pg_namespace schema_record on schema_record.oid = index_name.relnamespace
    where schema_record.nspname = 'app'
      and index_name.relname = 'warehouse_export_runs_one_running'
  ),
  'only one warehouse export can run per dataset'
);

select ok(
  (
    select count(*) >= 4
    from pg_constraint constraint_record
    where constraint_record.contype = 'c'
      and constraint_record.conrelid in (
        'app.warehouse_export_runs'::regclass,
        'app.warehouse_export_failures'::regclass
      )
  ),
  'warehouse export status and count invariants use check constraints'
);

select * from finish();
rollback;
