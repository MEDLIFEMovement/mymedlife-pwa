-- Allow signed-in reviewers and pilot users to read the currently active
-- published theme snapshot without exposing draft or audit history.

drop policy if exists "theme_snapshots_select_active_authenticated"
on app.theme_snapshots;

create policy "theme_snapshots_select_active_authenticated"
on app.theme_snapshots for select to authenticated
using (status = 'active'::app.theme_snapshot_status);
