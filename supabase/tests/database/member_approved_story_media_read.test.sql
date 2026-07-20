begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

set local role service_role;

update app.evidence_items
set evidence_type = 'event_photo',
    status = 'approved',
    sharing_status = 'approved_for_sharing',
    storage_path = 'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000001/approved.jpg'
where id = '60000000-0000-4000-8000-000000000001';

update app.evidence_items
set evidence_type = 'event_photo',
    status = 'pending_review',
    sharing_status = 'submitted',
    storage_path = 'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000004/pending.jpg'
where id = '60000000-0000-4000-8000-000000000004';

insert into storage.objects (bucket_id, name, owner, owner_id, metadata)
values
  (
    'proof-submissions-private',
    'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000001/approved.jpg',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    jsonb_build_object('mimetype', 'image/jpeg', 'size', 1000)
  ),
  (
    'proof-submissions-private',
    'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000004/pending.jpg',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    jsonb_build_object('mimetype', 'image/jpeg', 'size', 1000)
  );

set local role authenticated;
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claim.sub" = '00000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)::integer
    from storage.objects
    where name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000001/approved.jpg'
  ),
  1,
  'A signed-in member may read media after both story approval gates pass'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where name = 'chapters/10000000-0000-4000-8000-000000000001/evidence/60000000-0000-4000-8000-000000000004/pending.jpg'
  ),
  0,
  'A signed-in member cannot read pending raw proof media'
);

select * from finish();
rollback;
