alter table app.chapters
  add column if not exists is_test boolean not null default false;

create or replace function app.is_test_chapter(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select coalesce((select chapters.is_test from app.chapters chapters where chapters.id = chapter_uuid), false);
$$;

create or replace function app.is_test_user(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select exists (
    select 1
    from app.staff_role_assignments assignments
    where assignments.user_id = user_uuid
      and assignments.role_key = 'test'
      and assignments.status = 'active'
  );
$$;

insert into app.roles (key, label, chapter_scoped, sort_order)
values ('test', 'TEST', false, 95)
on conflict (key) do update set label = excluded.label, chapter_scoped = excluded.chapter_scoped;

alter table app.staff_role_assignments
  drop constraint if exists staff_role_assignments_role_key_check;

alter table app.staff_role_assignments
  add constraint staff_role_assignments_role_key_check
  check (role_key in ('coach', 'admin', 'ds_admin', 'super_admin', 'test'));

drop policy if exists "roles_select_authenticated" on app.roles;
create policy "roles_select_authenticated"
on app.roles for select to authenticated
using (key <> 'test' or app.is_admin());

drop policy if exists "chapters_select_scoped" on app.chapters;
create policy "chapters_select_scoped"
on app.chapters for select to authenticated
using (
  app.is_admin()
  or (
    not is_test
    and (app.is_chapter_member(id) or app.is_coach_for_chapter(id))
  )
);

create or replace function app.admin_set_chapter_test(
  target_chapter_uuid uuid,
  is_test_input boolean,
  audit_reason_input text
)
returns table (chapter_id uuid, is_test boolean, audit_log_id uuid)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  normalized_reason text := btrim(coalesce(audit_reason_input, ''));
  audit_uuid uuid := gen_random_uuid();
  before_value jsonb;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;
  if not app.is_admin() then
    raise exception 'Admin access required to mark TEST chapters' using errcode = '42501';
  end if;
  if char_length(normalized_reason) < 12 then
    raise exception 'chapter TEST marker reason must be at least 12 characters' using errcode = '22023';
  end if;

  select jsonb_build_object('is_test', chapters.is_test)
  into before_value
  from app.chapters chapters
  where chapters.id = target_chapter_uuid
  for update;
  if before_value is null then
    raise exception 'target chapter not found' using errcode = 'P0002';
  end if;

  update app.chapters set is_test = is_test_input where id = target_chapter_uuid;
  insert into app.audit_logs (
    id, actor_user_id, chapter_id, action, target_table, target_id,
    before_value, after_value, reason
  ) values (
    audit_uuid, actor_uuid, target_chapter_uuid, 'admin_chapter.test_marker',
    'chapters', target_chapter_uuid, before_value,
    jsonb_build_object('is_test', is_test_input), normalized_reason
  );

drop policy if exists "staff_roles_select_self_or_staff" on app.staff_role_assignments;
create policy "staff_roles_select_self_or_staff"
on app.staff_role_assignments for select to authenticated
using (
  app.is_admin()
  or (user_id = auth.uid() and not app.is_test_user(user_id))
);

drop policy if exists "memberships_select_scoped" on app.memberships;
create policy "memberships_select_scoped"
on app.memberships for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and not app.is_test_user(user_id)
    and (
      user_id = auth.uid()
      or app.is_chapter_leader(chapter_id)
      or app.is_coach_for_chapter(chapter_id)
    )
  )
);

drop policy if exists "coach_assignments_select_scoped" on app.coach_chapter_assignments;
create policy "coach_assignments_select_scoped"
on app.coach_chapter_assignments for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and coach_user_id = auth.uid()
  )
);

drop policy if exists "campaigns_select_scoped" on app.campaigns;
create policy "campaigns_select_scoped"
on app.campaigns for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "phases_select_scoped" on app.phases;
create policy "phases_select_scoped"
on app.phases for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "action_templates_select_leaders_coaches_staff" on app.action_templates;
create policy "action_templates_select_leaders_coaches_staff"
on app.action_templates for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "action_committees_select_chapter_scoped" on app.action_committees;
create policy "action_committees_select_chapter_scoped"
on app.action_committees for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "chapter_events_select_chapter_scoped" on app.chapter_events;
create policy "chapter_events_select_chapter_scoped"
on app.chapter_events for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "luma_links_select_leaders_coaches_staff" on app.luma_event_links;
create policy "luma_links_select_leaders_coaches_staff"
on app.luma_event_links for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_leader(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "points_events_select_scoped" on app.points_events;
create policy "points_events_select_scoped"
on app.points_events for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (
      awarded_to_user_id = auth.uid()
      or app.is_chapter_leader(chapter_id)
      or app.is_coach_for_chapter(chapter_id)
    )
  )
);

drop policy if exists "kpi_events_select_scoped" on app.kpi_events;
create policy "kpi_events_select_scoped"
on app.kpi_events for select to authenticated
using (
  app.is_admin()
  or (
    not app.is_test_chapter(chapter_id)
    and (app.is_chapter_member(chapter_id) or app.is_coach_for_chapter(chapter_id))
  )
);

drop policy if exists "events_select_scoped" on app.events;
create policy "events_select_scoped"
on app.events for select to authenticated
using (
  app.is_admin()
  or (
    (chapter_id is null and actor_user_id = auth.uid())
    or (
      chapter_id is not null
      and not app.is_test_chapter(chapter_id)
      and (
        actor_user_id = auth.uid()
        or app.is_chapter_leader(chapter_id)
        or app.is_coach_for_chapter(chapter_id)
      )
    )
  )
);

  return query select target_chapter_uuid, is_test_input, audit_uuid;
end;
$$;

revoke all on function app.admin_set_chapter_test(uuid, boolean, text) from public, anon;
grant execute on function app.admin_set_chapter_test(uuid, boolean, text) to authenticated, service_role;
