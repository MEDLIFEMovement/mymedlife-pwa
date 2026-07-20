-- Keep raw proof private while allowing signed-in members to read media only
-- after both moderation and sharing approval gates have completed.

drop policy if exists "private_proof_upload_select_scoped"
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
        (
          evidence.status = 'approved'
          and evidence.sharing_status = 'approved_for_sharing'
        )
        or evidence.submitted_by_user_id = auth.uid()
        or app.has_staff_role(array['admin', 'super_admin'])
      )
  )
);
