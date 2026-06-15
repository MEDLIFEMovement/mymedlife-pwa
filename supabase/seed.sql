insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'member.a@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Maya Member"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'leader.a@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Leo Leader"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'coach@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Cam Coach"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'admin@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ari Admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'ds.admin@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dee Systems"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'super.admin@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sam Super"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'member.b@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Bea Member"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'unrelated@mymedlife.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Una Unrelated"}', now(), now())
on conflict (id) do nothing;

insert into app.profiles (id, display_name, email) values
  ('00000000-0000-4000-8000-000000000001', 'Maya Member', 'member.a@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000002', 'Leo Leader', 'leader.a@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000003', 'Cam Coach', 'coach@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000004', 'Ari Admin', 'admin@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000005', 'Dee Systems', 'ds.admin@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000006', 'Sam Super', 'super.admin@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000007', 'Bea Member', 'member.b@mymedlife.test'),
  ('00000000-0000-4000-8000-000000000008', 'Una Unrelated', 'unrelated@mymedlife.test')
on conflict (id) do nothing;

insert into app.chapters (id, name, campus, region, created_by) values
  ('10000000-0000-4000-8000-000000000001', 'Northview MEDLIFE', 'Northview University', 'Midwest', '00000000-0000-4000-8000-000000000004'),
  ('10000000-0000-4000-8000-000000000002', 'Lakeside MEDLIFE', 'Lakeside College', 'Northeast', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into app.memberships (id, user_id, chapter_id, role_key, status, approved_at, approved_by) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'general_member', 'approved', now(), '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'president_vp', 'approved', now(), '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'e_board_member', 'approved', now(), '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'general_member', 'approved', now(), '00000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'general_member', 'requested', null, null)
on conflict (id) do nothing;

insert into app.staff_role_assignments (id, user_id, role_key, status, assigned_by) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'coach', 'active', '00000000-0000-4000-8000-000000000006'),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000004', 'admin', 'active', '00000000-0000-4000-8000-000000000006'),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000005', 'ds_admin', 'active', '00000000-0000-4000-8000-000000000006'),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000006', 'super_admin', 'active', '00000000-0000-4000-8000-000000000006')
on conflict (id) do nothing;

insert into app.coach_chapter_assignments (id, coach_user_id, chapter_id, coach_type, status, starts_at, assigned_by, handoff_reason) values
  ('31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'portfolio', 'active', current_date - 30, '00000000-0000-4000-8000-000000000004', 'Fake seed portfolio for Goal 5 RLS tests')
on conflict (id) do nothing;

insert into app.campaigns (id, chapter_id, name, slug, objective, status, opened_by, opened_at) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Rush Month', 'rush-month-2026', 'Turn campus interest into action committee participation.', 'active', '00000000-0000-4000-8000-000000000002', now()),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Rush Month', 'rush-month-2026', 'Run a safe fake Rush Month campaign for isolation tests.', 'active', '00000000-0000-4000-8000-000000000004', now())
on conflict (id) do nothing;

insert into app.phases (id, chapter_id, campaign_id, title, objective, status) values
  ('41000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Invite week', 'Get students to the first Rush Month events.', 'active'),
  ('41000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Invite week', 'Fake second chapter phase.', 'active')
on conflict (id) do nothing;

insert into app.action_committees (id, chapter_id, name, committee_type, chair_user_id) values
  ('42000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Recruitment Action Committee', 'recruitment', '00000000-0000-4000-8000-000000000002'),
  ('42000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Social Action Committee', 'social', null)
on conflict (id) do nothing;

insert into app.action_templates (id, chapter_id, campaign_id, title, instructions, default_owner_role_key, evidence_required, points, kpi_key) values
  ('43000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Run invite push', 'Invite three students and record what happened.', 'general_member', 'Short testimonial, link, or note about the invite push.', 15, 'students_invited'),
  ('43000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'Run invite push', 'Fake second chapter assignment template.', 'general_member', 'Fake proof.', 10, 'students_invited')
on conflict (id) do nothing;

insert into app.assignments (id, chapter_id, campaign_id, phase_id, action_template_id, action_committee_id, title, instructions, assigned_to_user_id, assigned_to_role_key, assigned_by_user_id, status, evidence_required, points, kpi_key) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', 'Invite three students to Rush Month', 'Ask three students to attend the first event and submit a short reflection.', '00000000-0000-4000-8000-000000000001', 'general_member', '00000000-0000-4000-8000-000000000002', 'in_progress', 'Short testimonial, link, or note about the invite push.', 15, 'students_invited'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', '43000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', 'Lakeside invite task', 'Fake second chapter task for isolation tests.', '00000000-0000-4000-8000-000000000007', 'general_member', '00000000-0000-4000-8000-000000000004', 'in_progress', 'Fake proof.', 10, 'students_invited')
on conflict (id) do nothing;

insert into app.chapter_events (id, chapter_id, campaign_id, phase_id, action_committee_id, assignment_id, title, event_type, status, planned_by_user_id, owner_user_id, starts_at, ends_at, attendance_count, eligible_member_count, attendance_rate, nps_score, feedback_summary, warehouse_status) values
  ('51000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Rush Month kickoff social', 'social', 'feedback_collected', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 24, 80, 0.30, 72, 'Students said the kickoff helped freshmen meet friends quickly.', 'disabled'),
  ('51000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', 'Lakeside fake event', 'social', 'planning', null, '00000000-0000-4000-8000-000000000007', now() + interval '4 days', now() + interval '4 days' + interval '2 hours', null, null, null, null, null, 'disabled')
on conflict (id) do nothing;

insert into app.luma_event_links (id, chapter_id, campaign_id, phase_id, chapter_event_id, luma_event_id, luma_event_url, status, linked_by, linked_at) values
  ('52000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'mock-luma-rush-kickoff', 'https://lu.ma/mock-rush-kickoff', 'mocked', '00000000-0000-4000-8000-000000000002', now())
on conflict (id) do nothing;

update app.chapter_events
set luma_event_link_id = '52000000-0000-4000-8000-000000000001'
where id = '51000000-0000-4000-8000-000000000001';

insert into app.evidence_items (id, assignment_id, chapter_id, chapter_event_id, submitted_by_user_id, evidence_type, summary, url, target_audiences, proof_categories, messenger_type, lifecycle_stage, hesitation_addressed, status, sharing_status, nps_score, activity_label) values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'link', 'I met two freshmen who said the kickoff made MEDLIFE feel welcoming instead of intimidating.', 'https://drive.google.com/mock/bridge-video', array['student', 'chapter_leader'], array['belonging', 'identity'], 'student', 'rush_month', 'Will I find friends here?', 'pending_review', 'submitted', 72, 'Rush Month kickoff social'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000007', 'text', 'Fake Lakeside testimonial for RLS isolation.', null, array['student'], array['belonging'], 'student', 'rush_month', 'Will I belong?', 'pending_review', 'submitted', null, 'Lakeside fake event')
on conflict (id) do nothing;

insert into app.points_events (id, chapter_id, campaign_id, assignment_id, chapter_event_id, evidence_item_id, awarded_to_user_id, points_delta, reason, created_by) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 15, 'Fake points for completing invite action.', '00000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into app.kpi_events (id, chapter_id, campaign_id, phase_id, assignment_id, chapter_event_id, evidence_item_id, metric_key, metric_value, unit, source, created_by) values
  ('71000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'students_invited', 3, 'students', 'seed', '00000000-0000-4000-8000-000000000002'),
  ('71000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', null, '51000000-0000-4000-8000-000000000001', null, 'event_nps', 72, 'nps', 'seed', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into app.events (id, event_type, actor_user_id, chapter_id, campaign_id, assignment_id, chapter_event_id, payload, correlation_id) values
  ('80000000-0000-4000-8000-000000000001', 'testimonial_submitted', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', '{"mockOnly":true,"summary":"Fake bridge video submitted"}', 'seed-rush-month-proof'),
  ('80000000-0000-4000-8000-000000000002', 'luma_attendance_import_mocked', '00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', null, '51000000-0000-4000-8000-000000000001', '{"mockOnly":true,"attendanceCount":24}', 'seed-rush-month-luma')
on conflict (id) do nothing;

insert into app.integration_events (id, source_event_id, chapter_id, event_type, destination, external_object_type, external_object_id, status, payload, created_by) values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'luma_attendance_import_mocked', 'luma', 'event', 'mock-luma-rush-kickoff', 'mocked', '{"mockOnly":true,"liveWrite":false}', '00000000-0000-4000-8000-000000000004'),
  ('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'hubspot_handoff_mocked', 'hubspot', 'contact', null, 'disabled', '{"mockOnly":true,"liveWrite":false}', '00000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into app.automation_outbox (id, source_event_id, integration_event_id, chapter_id, destination, event_type, payload, idempotency_key, status) values
  ('82000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'luma', 'luma_attendance_import_mocked', '{"mockOnly":true,"liveWrite":false}', 'seed:luma_attendance_import_mocked:northview', 'mocked'),
  ('82000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'hubspot', 'hubspot_handoff_mocked', '{"mockOnly":true,"liveWrite":false}', 'seed:hubspot_handoff_mocked:northview', 'disabled')
on conflict (id) do nothing;

insert into app.audit_logs (id, actor_user_id, chapter_id, action, target_table, target_id, after_value, reason) values
  ('90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'seeded_fake_goal_5_data', 'chapters', '10000000-0000-4000-8000-000000000001', '{"mockOnly":true}', 'Local-only Goal 5 seed data')
on conflict (id) do nothing;
