begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.feature_flag_overrides),
  0,
  'Member cannot read production control feature flags'
);

select throws_ok(
  $$
    insert into app.feature_flag_overrides (
      environment,
      flag_key,
      flag_kind,
      status,
      reason,
      changed_by
    ) values (
      'staging',
      'integration_luma',
      'provider',
      'enabled',
      'Member direct write should be blocked.',
      '00000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  null,
  'Member cannot directly insert feature flag overrides'
);

select throws_ok(
  $$
    select * from app.upsert_feature_flag_override(
      'staging',
      'integration_luma',
      'provider',
      'enabled',
      'Member function write should be blocked.'
    )
  $$,
  '42501',
  'DS Admin or Super Admin required',
  'Member cannot use the feature flag mutation function'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    select * from app.upsert_feature_flag_override(
      'staging',
      'integration_luma',
      'provider',
      'enabled',
      'Enable Luma event loop for staging proof only.'
    )
  $$,
  'DS Admin can upsert a staging feature flag through the audited function'
);

select is(
  (
    select status::text
    from app.feature_flag_overrides
    where environment = 'staging'
      and flag_key = 'integration_luma'
  ),
  'enabled',
  'Staging feature flag override is persisted'
);

select is(
  (
    select count(*)::int
    from app.feature_flag_audit_records
    where environment = 'staging'
      and flag_key = 'integration_luma'
  ),
  1,
  'Staging feature flag change creates a durable feature flag audit row'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'feature_flag_status_changed'
      and target_table = 'feature_flag_overrides'
  ),
  1,
  'Staging feature flag change creates a general audit log row'
);

select throws_ok(
  $$
    select * from app.upsert_feature_flag_override(
      'production',
      'integration_luma',
      'provider',
      'enabled',
      'Enable production Luma without approval should fail.'
    )
  $$,
  '42501',
  'production-sensitive feature flags require an approval reference',
  'Production-sensitive feature flag requires explicit approval reference'
);

select throws_ok(
  $$
    select * from app.upsert_feature_flag_override(
      'production',
      'integration_luma',
      'provider',
      'enabled',
      'Enable production Luma without step-up should fail.',
      'NICK-APPROVED'
    )
  $$,
  '42501',
  'fresh step-up is required for production-sensitive feature flags',
  'Production-sensitive feature flag requires fresh step-up'
);

select ok(
  app.record_admin_step_up_session('local_password_reauth', 10) is not null,
  'DS Admin can record a fresh step-up session'
);

select lives_ok(
  $$
    select app.record_production_control_approval(
      'production',
      'feature_flag',
      'integration_luma',
      'NICK-APPROVED',
      'Nick approved production Luma flag test path.'
    )
  $$,
  'DS Admin can record an explicit production approval'
);

select lives_ok(
  $$
    select * from app.upsert_feature_flag_override(
      'production',
      'integration_luma',
      'provider',
      'enabled',
      'Enable production Luma after explicit approval and fresh step-up.',
      'NICK-APPROVED',
      (
        select id
        from app.admin_step_up_sessions
        where user_id = '00000000-0000-4000-8000-000000000005'
        order by created_at desc
        limit 1
      )
    )
  $$,
  'DS Admin can enable a production-sensitive feature only after approval and step-up'
);

select is(
  (
    select count(*)::int
    from app.production_control_approvals
    where target_key = 'integration_luma'
  ),
  1,
  'Production approval record is persisted'
);

select lives_ok(
  $$
    select * from app.save_theme_control_snapshot(
      'staging',
      'draft',
      '{"font":{"hex":"#10223f"},"background":{"hex":"#ffffff"}}'::jsonb,
      'Save reviewed staging theme draft.'
    )
  $$,
  'DS Admin can save a staging theme snapshot through the audited function'
);

select is(
  (
    select count(*)::int
    from app.theme_audit_records
    where environment = 'staging'
  ),
  1,
  'Staging theme snapshot creates a durable theme audit row'
);

reset role;

select * from finish();

rollback;
