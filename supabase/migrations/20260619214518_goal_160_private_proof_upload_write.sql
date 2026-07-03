-- Goal 160: local private proof upload writes with Supabase Storage.
-- This creates a private bucket, scoped storage policies, and audited upload
-- and removal functions while keeping public proof publishing and external
-- sends disabled.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'proof-submissions-private',
  'proof-submissions-private',
  false,
  524288000,
  array[
    'video/mp4',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    updated_at = now();

drop policy if exists "evidence_update_submitter_pending_only"
on app.evidence_items;

create policy "evidence_update_via_audited_functions_only"
on app.evidence_items for update to authenticated
using (false)
with check (false);

create or replace function app.normalize_private_proof_filename(
  original_file_name text
)
returns text
language sql
immutable
set search_path = app, public
as $$
  select regexp_replace(
    regexp_replace(
      lower(btrim(coalesce(original_file_name, ''))),
      '[^a-z0-9._-]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  )
$$;

create or replace function app.build_private_proof_storage_path(
  target_evidence app.evidence_items,
  original_file_name text
)
returns text
language sql
stable
security definer
set search_path = app, public
as $$
  select 'chapters/'
    || target_evidence.chapter_id::text
    || '/evidence/'
    || target_evidence.id::text
    || '/'
    || app.normalize_private_proof_filename(original_file_name)
$$;

create or replace function app.is_allowed_private_proof_mime_type(
  mime_type_input text
)
returns boolean
language sql
immutable
set search_path = app, public
as $$
  select mime_type_input = any (
    array[
      'video/mp4',
      'video/quicktime',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]::text[]
  )
$$;

create or replace function app.can_prepare_private_proof_upload(
  target_evidence app.evidence_items
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select auth.uid() is not null
    and target_evidence.assignment_id is not null
    and target_evidence.submitted_by_user_id = auth.uid()
    and target_evidence.status in ('pending_review', 'changes_requested')
    and target_evidence.sharing_status in ('submitted', 'in_hq_review')
    and target_evidence.storage_path is null
    and exists (
      select 1
      from app.assignments assignments
      where assignments.id = target_evidence.assignment_id
        and assignments.chapter_id = target_evidence.chapter_id
        and assignments.status in ('submitted', 'changes_requested')
    )
$$;

create or replace function app.can_remove_private_proof_upload(
  target_evidence app.evidence_items
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select auth.uid() is not null
    and target_evidence.assignment_id is not null
    and target_evidence.status in ('pending_review', 'changes_requested')
    and target_evidence.sharing_status in ('submitted', 'in_hq_review')
    and target_evidence.storage_path is not null
    and (
      target_evidence.submitted_by_user_id = auth.uid()
      or app.has_staff_role(array['admin', 'super_admin'])
    )
$$;

create or replace function app.prepare_proof_upload_intake(
  evidence_uuid uuid,
  original_file_name_input text,
  mime_type_input text,
  byte_size_input bigint,
  consent_to_medlife_review_input boolean,
  consent_to_future_sharing_input boolean
)
returns table (
  evidence_item_id uuid,
  chapter_id uuid,
  private_bucket text,
  storage_path text,
  normalized_file_name text
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  target_evidence app.evidence_items%rowtype;
  normalized_file_name_local text :=
    app.normalize_private_proof_filename(original_file_name_input);
begin
  if auth.uid() is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not consent_to_medlife_review_input then
    raise exception 'private review consent is required' using errcode = '22023';
  end if;

  if consent_to_future_sharing_input is null then
    raise exception 'future sharing consent choice is required' using errcode = '22023';
  end if;

  if char_length(normalized_file_name_local) = 0 then
    raise exception 'private proof file name is required' using errcode = '22023';
  end if;

  if not app.is_allowed_private_proof_mime_type(mime_type_input) then
    raise exception 'private proof file type is not allowed' using errcode = '22023';
  end if;

  if byte_size_input is null or byte_size_input < 1 then
    raise exception 'private proof file is required' using errcode = '22023';
  end if;

  if byte_size_input > 524288000 then
    raise exception 'private proof file is too large' using errcode = '22023';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid
  for update;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if not app.can_prepare_private_proof_upload(target_evidence) then
    if target_evidence.storage_path is not null then
      raise exception 'proof already has private upload' using errcode = '22023';
    end if;

    raise exception 'actor cannot manage private proof upload' using errcode = '42501';
  end if;

  evidence_item_id := target_evidence.id;
  chapter_id := target_evidence.chapter_id;
  private_bucket := 'proof-submissions-private';
  storage_path := app.build_private_proof_storage_path(
    target_evidence,
    original_file_name_input
  );
  normalized_file_name := normalized_file_name_local;

  return next;
end;
$$;

create or replace function app.record_private_proof_upload(
  evidence_uuid uuid,
  storage_path_input text,
  original_file_name_input text,
  mime_type_input text,
  byte_size_input bigint,
  consent_to_medlife_review_input boolean,
  consent_to_future_sharing_input boolean
)
returns table (
  evidence_item_id uuid,
  event_id uuid,
  integration_event_id uuid,
  outbox_id uuid,
  audit_log_id uuid,
  storage_path text
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_evidence app.evidence_items%rowtype;
  expected_storage_path text;
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  next_sharing_status app.content_sharing_status;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid
  for update;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if not app.can_prepare_private_proof_upload(target_evidence) then
    if target_evidence.storage_path is not null then
      raise exception 'proof already has private upload' using errcode = '22023';
    end if;

    raise exception 'actor cannot manage private proof upload' using errcode = '42501';
  end if;

  if not consent_to_medlife_review_input then
    raise exception 'private review consent is required' using errcode = '22023';
  end if;

  if consent_to_future_sharing_input is null then
    raise exception 'future sharing consent choice is required' using errcode = '22023';
  end if;

  if not app.is_allowed_private_proof_mime_type(mime_type_input) then
    raise exception 'private proof file type is not allowed' using errcode = '22023';
  end if;

  if byte_size_input is null or byte_size_input < 1 then
    raise exception 'private proof file is required' using errcode = '22023';
  end if;

  if byte_size_input > 524288000 then
    raise exception 'private proof file is too large' using errcode = '22023';
  end if;

  expected_storage_path := app.build_private_proof_storage_path(
    target_evidence,
    original_file_name_input
  );

  if storage_path_input <> expected_storage_path then
    raise exception 'private proof storage path did not match the approved convention'
      using errcode = '22023';
  end if;

  next_sharing_status := case
    when target_evidence.sharing_status = 'submitted'
      then 'in_hq_review'::app.content_sharing_status
    else target_evidence.sharing_status
  end;

  update app.evidence_items
  set storage_path = expected_storage_path,
      sharing_status = next_sharing_status
  where id = target_evidence.id;

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    assignment_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'proof_upload_recorded',
    actor_uuid,
    target_evidence.chapter_id,
    target_evidence.assignment_id,
    target_evidence.chapter_event_id,
    jsonb_build_object(
      'source', 'app.record_private_proof_upload',
      'evidenceItemId', target_evidence.id,
      'storageBucket', 'proof-submissions-private',
      'storagePath', expected_storage_path,
      'originalFileName', original_file_name_input,
      'mimeType', mime_type_input,
      'byteSize', byte_size_input,
      'consentToMedlifeReview', consent_to_medlife_review_input,
      'consentToFutureSharing', consent_to_future_sharing_input,
      'publicSharing', false,
      'liveExternalWrite', false
    ),
    'proof_upload_recorded:' || target_evidence.id::text || ':' || actor_uuid::text
  );

  insert into app.integration_events (
    id,
    source_event_id,
    chapter_id,
    event_type,
    destination,
    external_object_type,
    external_object_id,
    status,
    payload,
    created_by
  ) values (
    integration_event_uuid,
    event_uuid,
    target_evidence.chapter_id,
    'proof_upload_recorded',
    'internal',
    'evidence_item',
    target_evidence.id::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.record_private_proof_upload',
      'storageBucket', 'proof-submissions-private',
      'storagePath', expected_storage_path,
      'liveExternalWrite', false
    ),
    actor_uuid
  );

  insert into app.automation_outbox (
    id,
    source_event_id,
    integration_event_id,
    chapter_id,
    destination,
    event_type,
    payload,
    idempotency_key,
    status
  ) values (
    outbox_uuid,
    event_uuid,
    integration_event_uuid,
    target_evidence.chapter_id,
    'n8n',
    'proof_upload_recorded',
    jsonb_build_object(
      'source', 'app.record_private_proof_upload',
      'evidenceItemId', target_evidence.id,
      'storageBucket', 'proof-submissions-private',
      'storagePath', expected_storage_path,
      'rawFileExport', false
    ),
    'proof_upload_recorded:' || target_evidence.id::text || ':' || actor_uuid::text,
    'disabled'
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    chapter_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    target_evidence.chapter_id,
    'proof_upload_recorded',
    'evidence_items',
    target_evidence.id,
    jsonb_build_object(
      'storagePath', target_evidence.storage_path,
      'sharingStatus', target_evidence.sharing_status
    ),
    jsonb_build_object(
      'storageBucket', 'proof-submissions-private',
      'storagePath', expected_storage_path,
      'sharingStatus', next_sharing_status,
      'originalFileName', original_file_name_input,
      'mimeType', mime_type_input,
      'byteSize', byte_size_input,
      'consentToMedlifeReview', consent_to_medlife_review_input,
      'consentToFutureSharing', consent_to_future_sharing_input,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid
    ),
    'Local Goal 160 private proof upload write path.'
  );

  evidence_item_id := target_evidence.id;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;
  storage_path := expected_storage_path;

  return next;
end;
$$;

create or replace function app.record_private_proof_upload_removal(
  evidence_uuid uuid,
  removal_reason_input text
)
returns table (
  evidence_item_id uuid,
  event_id uuid,
  integration_event_id uuid,
  outbox_id uuid,
  audit_log_id uuid,
  removed_storage_path text
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_evidence app.evidence_items%rowtype;
  normalized_reason text := btrim(coalesce(removal_reason_input, ''));
  removed_storage_path_local text;
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if char_length(normalized_reason) < 12 then
    raise exception 'private proof removal reason is required' using errcode = '22023';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid
  for update;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if not app.can_remove_private_proof_upload(target_evidence) then
    if target_evidence.storage_path is null then
      raise exception 'proof has no private upload to remove' using errcode = '22023';
    end if;

    raise exception 'actor cannot manage private proof upload' using errcode = '42501';
  end if;

  removed_storage_path_local := target_evidence.storage_path;

  update app.evidence_items
  set storage_path = null,
      sharing_status = 'submitted'
  where id = target_evidence.id;

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    assignment_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'proof_upload_removed',
    actor_uuid,
    target_evidence.chapter_id,
    target_evidence.assignment_id,
    target_evidence.chapter_event_id,
    jsonb_build_object(
      'source', 'app.record_private_proof_upload_removal',
      'evidenceItemId', target_evidence.id,
      'removedStoragePath', removed_storage_path_local,
      'publicSharing', false,
      'liveExternalWrite', false
    ),
    'proof_upload_removed:' || target_evidence.id::text || ':' || actor_uuid::text
  );

  insert into app.integration_events (
    id,
    source_event_id,
    chapter_id,
    event_type,
    destination,
    external_object_type,
    external_object_id,
    status,
    payload,
    created_by
  ) values (
    integration_event_uuid,
    event_uuid,
    target_evidence.chapter_id,
    'proof_upload_removed',
    'internal',
    'evidence_item',
    target_evidence.id::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.record_private_proof_upload_removal',
      'removedStoragePath', removed_storage_path_local,
      'liveExternalWrite', false
    ),
    actor_uuid
  );

  insert into app.automation_outbox (
    id,
    source_event_id,
    integration_event_id,
    chapter_id,
    destination,
    event_type,
    payload,
    idempotency_key,
    status
  ) values (
    outbox_uuid,
    event_uuid,
    integration_event_uuid,
    target_evidence.chapter_id,
    'n8n',
    'proof_upload_removed',
    jsonb_build_object(
      'source', 'app.record_private_proof_upload_removal',
      'evidenceItemId', target_evidence.id,
      'removedStoragePath', removed_storage_path_local,
      'rawFileExport', false
    ),
    'proof_upload_removed:' || target_evidence.id::text || ':' || actor_uuid::text,
    'disabled'
  );

  insert into app.audit_logs (
    id,
    actor_user_id,
    chapter_id,
    action,
    target_table,
    target_id,
    before_value,
    after_value,
    reason
  ) values (
    audit_uuid,
    actor_uuid,
    target_evidence.chapter_id,
    'proof_upload_removed',
    'evidence_items',
    target_evidence.id,
    jsonb_build_object(
      'storagePath', removed_storage_path_local,
      'sharingStatus', target_evidence.sharing_status
    ),
    jsonb_build_object(
      'storagePath', null,
      'sharingStatus', 'submitted',
      'removedStoragePath', removed_storage_path_local,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid,
      'removalReason', normalized_reason
    ),
    'Local Goal 160 private proof upload removal path.'
  );

  evidence_item_id := target_evidence.id;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;
  removed_storage_path := removed_storage_path_local;

  return next;
end;
$$;

drop policy if exists "private_proof_upload_select_scoped"
on storage.objects;

drop policy if exists "private_proof_upload_insert_submitter_only"
on storage.objects;

drop policy if exists "private_proof_upload_delete_submitter_or_hq"
on storage.objects;

create policy "private_proof_upload_select_scoped"
on storage.objects for select to authenticated
using (
  bucket_id = 'proof-submissions-private'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'chapters'
  and (storage.foldername(name))[3] = 'evidence'
  and exists (
    select 1
    from app.evidence_items evidence
    where evidence.id::text = (storage.foldername(name))[4]
      and evidence.chapter_id::text = (storage.foldername(name))[2]
      and (
        evidence.submitted_by_user_id = auth.uid()
        or app.has_staff_role(array['admin', 'super_admin'])
      )
  )
);

create policy "private_proof_upload_insert_submitter_only"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'proof-submissions-private'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'chapters'
  and (storage.foldername(name))[3] = 'evidence'
  and exists (
    select 1
    from app.evidence_items evidence
    where evidence.id::text = (storage.foldername(name))[4]
      and evidence.chapter_id::text = (storage.foldername(name))[2]
      and evidence.storage_path is null
      and app.can_prepare_private_proof_upload(evidence)
  )
);

create policy "private_proof_upload_delete_submitter_or_hq"
on storage.objects for delete to authenticated
using (
  bucket_id = 'proof-submissions-private'
  and array_length(storage.foldername(name), 1) = 4
  and (storage.foldername(name))[1] = 'chapters'
  and (storage.foldername(name))[3] = 'evidence'
  and exists (
    select 1
    from app.evidence_items evidence
    where evidence.id::text = (storage.foldername(name))[4]
      and evidence.chapter_id::text = (storage.foldername(name))[2]
      and evidence.storage_path = name
      and app.can_remove_private_proof_upload(evidence)
  )
);

grant execute on function app.normalize_private_proof_filename(text) to authenticated;
grant execute on function app.build_private_proof_storage_path(
  app.evidence_items,
  text
) to authenticated;
grant execute on function app.is_allowed_private_proof_mime_type(text) to authenticated;
grant execute on function app.can_prepare_private_proof_upload(app.evidence_items)
to authenticated;
grant execute on function app.can_remove_private_proof_upload(app.evidence_items)
to authenticated;
grant execute on function app.prepare_proof_upload_intake(
  uuid,
  text,
  text,
  bigint,
  boolean,
  boolean
) to authenticated;
grant execute on function app.record_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) to authenticated;
grant execute on function app.record_private_proof_upload_removal(
  uuid,
  text
) to authenticated;
