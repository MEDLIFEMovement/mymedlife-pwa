begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$
    insert into app.feature_flags (
      flag_key,
      environment,
      label,
      description,
      enabled,
      approval_policy,
      controls_external_write
    ) values (
      'member_flag_attempt',
      'staging',
      'Member attempt',
      'General members should not change rollout controls.',
      true,
      'standard',
      false
    )
  $$,
  '42501',
  null,
  'General members cannot insert rollout controls directly'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';

select lives_ok(
  $$ select * from app.set_feature_flag(
    'staging_review_auth',
    'staging',
    true,
    'Staging review auth',
    'Allow approved reviewers through the staging auth gate.',
    'Enable the staging reviewer path for hosted QA.',
    'standard',
    false,
    null
  ) $$,
  'DS Admin can persist a staging feature flag through the audited function'
);

select is(
  (
    select count(*)::int
    from app.feature_flags
    where flag_key = 'staging_review_auth'
      and environment = 'staging'
      and enabled = true
  ),
  1,
  'Feature flag row is stored in app.feature_flags'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'feature_flag_updated'
      and target_table = 'feature_flags'
  ),
  1,
  'Feature flag save records one audit log row'
);

select throws_ok(
  $$ select * from app.set_feature_flag(
    'luma_event_create',
    'production',
    true,
    'Luma event create',
    'Production Luma event creation must stay separately approved.',
    'Attempt to widen production scope without a separate approval packet.',
    'production_blocked',
    true,
    'PRODUCTION'
  ) $$,
  '42501',
  'production enablement remains blocked for this flag until explicit approval',
  'Blocked production integration flags cannot be enabled through the function'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000006';

select throws_ok(
  $$ select * from app.set_theme_setting(
    'accent',
    'production',
    'Accent',
    '#2563eb',
    'color',
    'core',
    'Theme change without confirmation should stop here.',
    null
  ) $$,
  '22023',
  'type PRODUCTION to confirm production rollout changes',
  'Production theme changes require explicit confirmation text'
);

select lives_ok(
  $$ select * from app.set_theme_setting(
    'accent',
    'production',
    'Accent',
    '#2563eb',
    'color',
    'core',
    'Align production accent for launch review.',
    'PRODUCTION'
  ) $$,
  'Super Admin can persist a production theme token with confirmation'
);

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'theme_setting_updated'
      and target_table = 'theme_settings'
  ),
  1,
  'Theme save records one audit log row'
);

select is(
  (
    select count(*)::int
    from app.theme_settings
    where setting_key = 'accent'
      and environment = 'production'
      and value = '#2563eb'
  ),
  1,
  'Theme setting row is stored in app.theme_settings'
);

select * from finish();
rollback;
