begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

do $$
begin
  perform *
  from app.approve_chapter_membership(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000005',
    'general_member',
    'Approve requested membership for Goal 160 private proof upload fixtures.'
  );
exception
  when others then
    null;
end;
$$;

reset role;

insert into app.assignments (
  id,
  chapter_id,
  campaign_id,
  phase_id,
  action_template_id,
  action_committee_id,
  title,
  instructions,
  assigned_to_user_id,
  assigned_to_role_key,
  assigned_by_user_id,
  status,
  evidence_required,
  points,
  kpi_key
) values
  (
    'd9500000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 160 member upload assignment',
    'Fake submitted assignment for private proof upload.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'submitted',
    'Attach one private bridge video.',
    10,
    'goal_160_private_upload'
  ),
  (
    'd9500000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'Goal 160 second upload assignment',
    'Fake submitted assignment for cross-user upload denial.',
    '00000000-0000-4000-8000-000000000001',
    'general_member',
    '00000000-0000-4000-8000-000000000002',
    'submitted',
    'Attach one private bridge video.',
    10,
    'goal_160_private_upload_second'
  );

insert into app.evidence_items (
  id,
  assignment_id,
  chapter_id,
  submitted_by_user_id,
  evidence_type,
  summary,
  status,
  sharing_status
) values
  (
    'd9600000-0000-4000-8000-000000000001',
    'd9500000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'bridge_video',
    'Goal 160 private upload bridge video metadata.',
    'pending_review',
    'submitted'
  ),
  (
    'd9600000-0000-4000-8000-000000000002',
    'd9500000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'bridge_video',
    'Goal 160 second private upload bridge video metadata.',
    'pending_review',
    'submitted'
  );

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

update app.evidence_items
set storage_path = 'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/bad-direct-write.mov'
where id = 'd9600000-0000-4000-8000-000000000001';

select is(
  (
    select coalesce(storage_path, '')
    from app.evidence_items
    where id = 'd9600000-0000-4000-8000-000000000001'
  ),
  '',
  'Member cannot directly write storage_path on evidence rows'
);

select lives_ok(
  $$ select * from app.prepare_proof_upload_intake(
    'd9600000-0000-4000-8000-000000000001',
    'Rush Social Bridge Video.MOV',
    'video/quicktime',
    12000000,
    true,
    false
  ) $$,
  'Submitter can prepare the private upload intake bundle'
);

select lives_ok(
  $$
    with prepared as (
      select *
      from app.prepare_proof_upload_intake(
        'd9600000-0000-4000-8000-000000000001',
        'Rush Social Bridge Video.MOV',
        'video/quicktime',
        12000000,
        true,
        false
      )
    )
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      owner_id,
      metadata,
      user_metadata
    )
    select
      private_bucket,
      storage_path,
      auth.uid(),
      auth.uid()::text,
      jsonb_build_object('mimetype', 'video/quicktime', 'size', 12000000),
      jsonb_build_object('source', 'rls_goal_160')
    from prepared
  $$,
  'Submitter can insert one storage object into the private bucket path'
);

select ok(
  (
    select
      position('evidence.storage_path IS NULL' in qual) > 0
      and position('can_prepare_private_proof_upload' in qual) > 0
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'private_proof_upload_delete_submitter_or_hq'
  ),
  'Delete policy admits submitter rollback while metadata finalization is uncommitted'
);

select lives_ok(
  $$ select * from app.record_verified_private_proof_upload(
    'd9600000-0000-4000-8000-000000000001',
    'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov',
    'Rush Social Bridge Video.MOV',
    'video/quicktime',
    12000000,
    true,
    false
  ) $$,
  'Submitter can record the audited private proof upload bundle'
);

select is(
  (
    select coalesce(storage_path, '') || ':' || sharing_status::text
    from app.evidence_items
    where id = 'd9600000-0000-4000-8000-000000000001'
  ),
  'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov:in_hq_review',
  'Recorded upload stores the private path and moves sharing status into HQ review'
);

select is(
  (
    select count(*)::int
    from app.events
    where event_type = 'proof_upload_recorded'
      and assignment_id = 'd9500000-0000-4000-8000-000000000001'
  ),
  1,
  'Private upload creates one internal event'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.automation_outbox
    where event_type = 'proof_upload_recorded'
      and destination = 'n8n'
      and status = 'disabled'
  ),
  1,
  'Private upload creates one disabled outbox row'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$ select * from app.record_verified_private_proof_upload(
    'd9600000-0000-4000-8000-000000000001',
    'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov',
    'Rush Social Bridge Video.MOV',
    'video/quicktime',
    12000000,
    true,
    false
  ) $$,
  '22023',
  'proof already has private upload',
  'Duplicate audited upload is rejected'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000008';
set local "request.jwt.claim.role" = 'authenticated';

select throws_ok(
  $$
    insert into storage.objects (
      bucket_id,
      name,
      owner,
      owner_id,
      metadata
    ) values (
      'proof-submissions-private',
      'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000002/other-member.mov',
      auth.uid(),
      auth.uid()::text,
      jsonb_build_object('mimetype', 'video/mp4', 'size', 1000)
    )
  $$,
  '42501',
  null,
  'Another same-chapter member cannot upload into someone else''s private proof path'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from storage.objects
    where bucket_id = 'proof-submissions-private'
      and name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov'
  ),
  0,
  'Chapter leader cannot read another user''s raw private upload'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from storage.objects
    where bucket_id = 'proof-submissions-private'
      and name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov'
  ),
  1,
  'Admin can read the private upload row for HQ cleanup'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000005';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from storage.objects
    where bucket_id = 'proof-submissions-private'
      and name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov'
  ),
  0,
  'DS Admin cannot read private student raw proof uploads'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from storage.objects
    where bucket_id = 'proof-submissions-private'
      and name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/rush-social-bridge-video.mov'
  ),
  1,
  'Submitter can read the raw storage row before cleanup'
);

select lives_ok(
  $$ select * from app.record_private_proof_upload_removal(
    'd9600000-0000-4000-8000-000000000001',
    'The student replaced the wrong private file with a corrected export.'
  ) $$,
  'Submitter can record the audited private proof removal bundle'
);

select is(
  (
    select coalesce(storage_path, '') || ':' || sharing_status::text
    from app.evidence_items
    where id = 'd9600000-0000-4000-8000-000000000001'
  ),
  ':submitted',
  'Removal clears the storage path and returns the proof row to metadata-only submitted state'
);

insert into storage.objects (
  bucket_id,
  name,
  owner,
  owner_id,
  metadata,
  user_metadata
) values (
  'proof-submissions-private',
  'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/corrected-rush-social-bridge-video.mov',
  auth.uid(),
  auth.uid()::text,
  jsonb_build_object('mimetype', 'video/quicktime', 'size', 12000000),
  jsonb_build_object('source', 'rls_goal_160_corrected')
);

select lives_ok(
  $$ select * from app.record_verified_private_proof_upload(
    'd9600000-0000-4000-8000-000000000001',
    'chapters/10000000-0000-4000-8000-000000000001/evidence/d9600000-0000-4000-8000-000000000001/corrected-rush-social-bridge-video.mov',
    'Corrected Rush Social Bridge Video.MOV',
    'video/quicktime',
    12000000,
    true,
    false
  ) $$,
  'Submitter can record a corrected private upload after audited removal'
);

select lives_ok(
  $$ select * from app.record_private_proof_upload_removal(
    'd9600000-0000-4000-8000-000000000001',
    'The corrected TEST file completed repeatable-history verification.'
  ) $$,
  'Submitter can record a second audited removal without rewriting history'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(distinct idempotency_key)::int
    from app.automation_outbox
    where event_type in ('proof_upload_recorded', 'proof_upload_removed')
      and payload->>'evidenceItemId' = 'd9600000-0000-4000-8000-000000000001'
  ),
  4,
  'Every upload and removal cycle keeps a unique disabled outbox history row'
);

set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000004';
set local "request.jwt.claim.role" = 'authenticated';

select is(
  (
    select count(*)::int
    from app.audit_logs
    where action = 'proof_upload_removed'
      and target_id = 'd9600000-0000-4000-8000-000000000001'
  ),
  2,
  'Each removal creates its own audit log entry'
);

reset role;

select * from finish();

rollback;
