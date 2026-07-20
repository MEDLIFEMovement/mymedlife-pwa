-- Members may read only evidence that has completed both approval gates.
-- Private storage objects remain protected by their existing bucket policies.

drop policy if exists "evidence_select_scoped" on app.evidence_items;

create policy "evidence_select_scoped"
on app.evidence_items for select to authenticated
using (
  (
    status = 'approved'
    and sharing_status = 'approved_for_sharing'
  )
  or submitted_by_user_id = auth.uid()
  or app.is_chapter_leader(chapter_id)
  or app.is_coach_for_chapter(chapter_id)
  or app.is_admin()
);
