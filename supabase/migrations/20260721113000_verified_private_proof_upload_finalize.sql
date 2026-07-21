-- Finalization must prove the exact private Storage object exists and matches
-- the approved upload ticket before durable metadata can claim success.

create or replace function app.record_verified_private_proof_upload(
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
  target_evidence app.evidence_items%rowtype;
  expected_storage_path text;
  stored_metadata jsonb;
  stored_mime_type text;
  stored_byte_size bigint;
begin
  if auth.uid() is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if not app.can_prepare_private_proof_upload(target_evidence) then
    if target_evidence.storage_path is not null then
      raise exception 'proof already has private upload' using errcode = '22023';
    end if;

    raise exception 'actor cannot manage private proof upload' using errcode = '42501';
  end if;

  expected_storage_path := app.build_private_proof_storage_path(
    target_evidence,
    original_file_name_input
  );

  if storage_path_input <> expected_storage_path then
    raise exception 'private proof storage path did not match the approved convention'
      using errcode = '22023';
  end if;

  select object.metadata
  into stored_metadata
  from storage.objects object
  where object.bucket_id = 'proof-submissions-private'
    and object.name = expected_storage_path
  limit 1;

  if not found then
    raise exception 'private proof storage object not found' using errcode = '22023';
  end if;

  stored_mime_type := coalesce(
    stored_metadata ->> 'mimetype',
    stored_metadata ->> 'contentType'
  );

  begin
    stored_byte_size := coalesce(
      (stored_metadata ->> 'size')::bigint,
      (stored_metadata ->> 'contentLength')::bigint
    );
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'private proof storage metadata was invalid'
        using errcode = '22023';
  end;

  if stored_mime_type is null or lower(stored_mime_type) <> lower(mime_type_input) then
    raise exception 'private proof storage mime type did not match the approved ticket'
      using errcode = '22023';
  end if;

  if stored_byte_size is null or stored_byte_size <> byte_size_input then
    raise exception 'private proof storage size did not match the approved ticket'
      using errcode = '22023';
  end if;

  return query
  select *
  from app.record_private_proof_upload(
    evidence_uuid,
    storage_path_input,
    original_file_name_input,
    mime_type_input,
    byte_size_input,
    consent_to_medlife_review_input,
    consent_to_future_sharing_input
  );
end;
$$;

revoke all on function app.record_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) from public, anon, authenticated;

revoke all on function app.record_verified_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) from public, anon, authenticated;

grant execute on function app.record_verified_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) to authenticated;
