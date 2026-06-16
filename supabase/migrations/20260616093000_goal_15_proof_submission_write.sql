-- Goal 15: local proof/testimonial metadata submission.
-- This migration keeps uploads, public sharing, and external sends disabled.

create or replace function app.can_submit_assignment_proof_metadata(
  assignment_row app.assignments
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select assignment_row.status in ('in_progress', 'changes_requested')
    and not app.has_staff_role(array['coach', 'admin', 'ds_admin', 'super_admin'])
    and (
      assignment_row.assigned_to_user_id = auth.uid()
      or app.has_chapter_role(
        assignment_row.chapter_id,
        array[assignment_row.assigned_to_role_key]
      )
      or app.is_chapter_leader(assignment_row.chapter_id)
    )
$$;

drop policy if exists "evidence_insert_submitter_for_visible_work"
on app.evidence_items;

create policy "evidence_insert_via_proof_metadata_function_only"
on app.evidence_items for insert to authenticated
with check (false);

create or replace function app.submit_assignment_proof_metadata(
  assignment_uuid uuid,
  evidence_kind app.evidence_type,
  proof_summary text,
  proof_url text default null,
  target_audiences_input text[] default '{}'::text[],
  proof_categories_input text[] default '{}'::text[],
  messenger_type_input text default null,
  lifecycle_stage_input text default null,
  hesitation_addressed_input text default null,
  activity_label_input text default null,
  nps_score_input numeric default null
)
returns table (
  assignment_id uuid,
  evidence_item_id uuid,
  event_id uuid,
  integration_event_id uuid,
  outbox_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_assignment app.assignments%rowtype;
  evidence_uuid uuid := gen_random_uuid();
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_summary text := btrim(coalesce(proof_summary, ''));
  normalized_url text := nullif(btrim(coalesce(proof_url, '')), '');
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if char_length(normalized_summary) < 12 then
    raise exception 'proof summary must describe what happened' using errcode = '22023';
  end if;

  if nps_score_input is not null and (nps_score_input < -100 or nps_score_input > 100) then
    raise exception 'nps score must be between -100 and 100' using errcode = '22023';
  end if;

  select *
  into target_assignment
  from app.assignments
  where id = assignment_uuid
  for update;

  if not found then
    raise exception 'assignment not found' using errcode = 'P0002';
  end if;

  if not app.can_submit_assignment_proof_metadata(target_assignment) then
    raise exception 'actor cannot submit proof for this assignment' using errcode = '42501';
  end if;

  update app.assignments
  set status = 'submitted'
  where id = target_assignment.id;

  insert into app.evidence_items (
    id,
    assignment_id,
    chapter_id,
    chapter_event_id,
    submitted_by_user_id,
    evidence_type,
    summary,
    url,
    storage_path,
    target_audiences,
    proof_categories,
    messenger_type,
    lifecycle_stage,
    hesitation_addressed,
    status,
    sharing_status,
    nps_score,
    activity_label
  ) values (
    evidence_uuid,
    target_assignment.id,
    target_assignment.chapter_id,
    target_assignment.chapter_event_id,
    actor_uuid,
    evidence_kind,
    normalized_summary,
    normalized_url,
    null,
    coalesce(target_audiences_input, '{}'::text[]),
    coalesce(proof_categories_input, '{}'::text[]),
    nullif(btrim(coalesce(messenger_type_input, '')), ''),
    nullif(btrim(coalesce(lifecycle_stage_input, '')), ''),
    nullif(btrim(coalesce(hesitation_addressed_input, '')), ''),
    'pending_review',
    'submitted',
    nps_score_input,
    nullif(btrim(coalesce(activity_label_input, '')), '')
  );

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    campaign_id,
    assignment_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'evidence_submitted',
    actor_uuid,
    target_assignment.chapter_id,
    target_assignment.campaign_id,
    target_assignment.id,
    target_assignment.chapter_event_id,
    jsonb_build_object(
      'source', 'app.submit_assignment_proof_metadata',
      'evidenceItemId', evidence_uuid,
      'evidenceType', evidence_kind,
      'storageWrite', false,
      'publicSharing', false
    ),
    'evidence_submitted:' || target_assignment.id::text || ':' || actor_uuid::text
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
    target_assignment.chapter_id,
    'evidence_submitted',
    'internal',
    'evidence_item',
    evidence_uuid::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.submit_assignment_proof_metadata',
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
    target_assignment.chapter_id,
    'n8n',
    'evidence_submitted',
    jsonb_build_object(
      'source', 'app.submit_assignment_proof_metadata',
      'evidenceItemId', evidence_uuid,
      'liveExternalWrite', false
    ),
    'evidence_submitted:' || target_assignment.id::text || ':' || actor_uuid::text,
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
    target_assignment.chapter_id,
    'evidence_submitted',
    'evidence_items',
    evidence_uuid,
    jsonb_build_object('assignmentStatus', target_assignment.status),
    jsonb_build_object(
      'assignmentStatus', 'submitted',
      'evidenceItemId', evidence_uuid,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid
    ),
    'Local Goal 15 proof/testimonial metadata write path.'
  );

  assignment_id := target_assignment.id;
  evidence_item_id := evidence_uuid;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_submit_assignment_proof_metadata(app.assignments) to authenticated;
grant execute on function app.submit_assignment_proof_metadata(
  uuid,
  app.evidence_type,
  text,
  text,
  text[],
  text[],
  text,
  text,
  text,
  text,
  numeric
) to authenticated;
