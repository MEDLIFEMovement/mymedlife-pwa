-- Allow the original submitter to remove an uncommitted storage object when
-- the audited metadata finalization fails after a signed direct upload.

drop policy if exists "private_proof_upload_delete_submitter_or_hq"
on storage.objects;

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
      and (
        (
          evidence.storage_path = name
          and app.can_remove_private_proof_upload(evidence)
        )
        or (
          evidence.storage_path is null
          and app.can_prepare_private_proof_upload(evidence)
        )
      )
  )
);
