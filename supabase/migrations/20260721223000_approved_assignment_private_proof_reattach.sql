-- An assignment may be approved before its media finishes HQ moderation.
-- Keep replacement uploads available only to the original submitter while the
-- evidence remains reviewable and has no private file attached.

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
        and assignments.status in ('submitted', 'changes_requested', 'approved')
    )
$$;

revoke all on function app.can_prepare_private_proof_upload(app.evidence_items)
from public, anon;

grant execute on function app.can_prepare_private_proof_upload(app.evidence_items)
to authenticated;
