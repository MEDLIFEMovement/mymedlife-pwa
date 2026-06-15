begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

set local role authenticated;

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.campaign_templates),
  2,
  'General member can read active HQ campaign templates'
);

select throws_ok(
  $$
    insert into app.campaign_templates (
      id,
      registry_key,
      name,
      slug,
      audience,
      summary
    ) values (
      'b0000000-0000-4000-8000-000000000001',
      'general_member_should_not_create_templates',
      'Bad Template',
      'bad-template',
      'chapter',
      'This insert should be blocked by RLS.'
    )
  $$,
  '42501',
  null,
  'General member cannot create HQ campaign templates'
);

select is(
  (select count(*)::int from app.phase_readiness_reviews),
  0,
  'General member cannot read readiness review records'
);

select is(
  (select count(*)::int from app.risk_flags),
  0,
  'General member cannot read operating risk records'
);

select is(
  (select count(*)::int from app.campaign_closeouts),
  0,
  'General member cannot read campaign closeouts'
);

select is(
  (select count(*)::int from app.campaign_role_assignments),
  1,
  'General member can see campaign role lanes for their chapter'
);

select is(
  (select count(*)::int from app.campaign_role_assignments where chapter_id = '10000000-0000-4000-8000-000000000002'),
  0,
  'General member cannot see another chapter campaign role lanes'
);

select throws_ok(
  $$
    update app.assignments
    set priority = 'urgent'
    where id = '50000000-0000-4000-8000-000000000001'
  $$,
  'assigned users can only update assignment status',
  'Assigned member cannot rewrite new assignment operating fields'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.campaign_role_assignments),
  1,
  'Chapter leader can read campaign officer lanes for their chapter'
);

select lives_ok(
  $$
    insert into app.campaign_role_assignments (
      id,
      chapter_id,
      campaign_id,
      user_id,
      role_key,
      role_label,
      lane,
      assigned_by
    ) values (
      'b2000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      'rush_follow_up_chair',
      'Rush Follow-Up Chair',
      'follow_up',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  'Chapter leader can assign a campaign lane inside their chapter'
);

select throws_ok(
  $$
    insert into app.campaign_role_assignments (
      id,
      chapter_id,
      campaign_id,
      user_id,
      role_key,
      role_label,
      lane,
      assigned_by
    ) values (
      'b2000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000007',
      'bad_cross_chapter_lane',
      'Bad Cross-Chapter Lane',
      'recruitment',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot assign campaign lanes for another chapter'
);

select is(
  (select count(*)::int from app.phase_readiness_reviews),
  1,
  'Chapter leader can read readiness reviews for their chapter'
);

select lives_ok(
  $$
    insert into app.phase_readiness_reviews (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      reviewer_user_id,
      readiness_status,
      decision_note
    ) values (
      'b3000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'ready',
      'Leader says the fake Rush phase is ready for coach validation.'
    )
  $$,
  'Chapter leader can mark a phase ready for review'
);

select throws_ok(
  $$
    insert into app.phase_readiness_reviews (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      reviewer_user_id,
      readiness_status,
      decision_note
    ) values (
      'b3000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      'validated',
      'Leader should not self-validate coach readiness.'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot validate readiness on behalf of coach/HQ'
);

select is(
  (select count(*)::int from app.risk_flags),
  1,
  'Chapter leader can read leader-visible risks only'
);

select is(
  (select count(*)::int from app.risk_flags where visibility = 'coach_private'),
  0,
  'Chapter leader cannot read coach-private risks'
);

select lives_ok(
  $$
    insert into app.risk_flags (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      severity,
      visibility,
      signal,
      response_plan,
      created_by
    ) values (
      'b4000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'medium',
      'leader_visible',
      'Leader flagged that follow-up coverage is thin.',
      'Recruit one more helper before the next event.',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  'Chapter leader can create leader-visible risk flags'
);

select throws_ok(
  $$
    insert into app.risk_flags (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      severity,
      visibility,
      signal,
      response_plan,
      created_by
    ) values (
      'b4000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'high',
      'coach_private',
      'Leader should not create coach-private notes.',
      'This should fail.',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'Chapter leader cannot create coach-private risk flags'
);

select lives_ok(
  $$
    insert into app.campaign_closeouts (
      id,
      chapter_id,
      campaign_id,
      status,
      submitted_by,
      goals_summary,
      results_summary
    ) values (
      'b5000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'draft',
      '00000000-0000-4000-8000-000000000002',
      'Fake Rush Month goals summary.',
      'Fake Rush Month results summary.'
    )
  $$,
  'Chapter leader can create a draft campaign closeout'
);

select lives_ok(
  $$
    update app.campaign_closeouts
    set status = 'submitted',
      submitted_at = now()
    where id = 'b5000000-0000-4000-8000-000000000001'
  $$,
  'Chapter leader can submit a campaign closeout'
);

select throws_ok(
  $$
    update app.campaign_closeouts
    set status = 'validated',
      validated_by = '00000000-0000-4000-8000-000000000002',
      validated_at = now()
    where id = 'b5000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  null,
  'Chapter leader cannot validate their own campaign closeout'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000003';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (select count(*)::int from app.risk_flags where chapter_id = '10000000-0000-4000-8000-000000000001'),
  3,
  'Coach can read leader-visible and coach-private risks for portfolio chapter'
);

select lives_ok(
  $$
    insert into app.risk_flags (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      severity,
      visibility,
      signal,
      response_plan,
      created_by
    ) values (
      'b4000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      'high',
      'coach_private',
      'Coach is watching whether lead quality is real.',
      'Ask chapter to reconcile lead count before next phase.',
      '00000000-0000-4000-8000-000000000003'
    )
  $$,
  'Coach can create coach-private risk flags for portfolio chapter'
);

select throws_ok(
  $$
    insert into app.risk_flags (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      severity,
      visibility,
      signal,
      response_plan,
      created_by
    ) values (
      'b4000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      '41000000-0000-4000-8000-000000000002',
      'high',
      'coach_private',
      'Coach should not reach outside their portfolio.',
      'This should fail.',
      '00000000-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  null,
  'Coach cannot create risk flags outside their portfolio'
);

select lives_ok(
  $$
    insert into app.phase_readiness_reviews (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      reviewer_user_id,
      readiness_status,
      decision_note
    ) values (
      'b3000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '41000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
      'validated',
      'Coach validates fake Rush readiness after seeing owners and follow-up plan.'
    )
  $$,
  'Coach can validate readiness for portfolio chapter'
);

select lives_ok(
  $$
    update app.campaign_closeouts
    set status = 'validated',
      validated_by = '00000000-0000-4000-8000-000000000003',
      validated_at = now()
    where id = 'b5000000-0000-4000-8000-000000000001'
  $$,
  'Coach can validate submitted campaign closeout for portfolio chapter'
);

select is(
  (select count(*)::int from app.campaign_closeouts where chapter_id = '10000000-0000-4000-8000-000000000002'),
  0,
  'Coach cannot read closeouts outside their portfolio'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    insert into app.campaign_templates (
      id,
      registry_key,
      name,
      slug,
      audience,
      summary
    ) values (
      'b0000000-0000-4000-8000-000000000002',
      'ds_admin_should_not_create_templates',
      'DS Admin Template',
      'ds-admin-template',
      'staff',
      'DS Admins manage integrations, not campaign content templates.'
    )
  $$,
  '42501',
  null,
  'DS Admin cannot create HQ campaign content templates'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select lives_ok(
  $$
    insert into app.campaign_templates (
      id,
      registry_key,
      name,
      slug,
      audience,
      summary,
      created_by
    ) values (
      'b0000000-0000-4000-8000-000000000003',
      'admin_can_create_templates',
      'Admin-created Fake Template',
      'admin-created-fake-template',
      'staff',
      'Admin-owned fake template for Goal 7 RLS test.',
      '00000000-0000-4000-8000-000000000004'
    )
  $$,
  'Admin can create HQ campaign content templates'
);

reset role;

select * from finish();

rollback;
