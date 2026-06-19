-- Goal 115: local chapter leader proof decisions.
-- This keeps browser saves, member nudges, public proof publishing, and
-- external sends disabled.

drop policy if exists "points_events_insert_leaders_or_staff"
on app.points_events;

create policy "points_events_insert_via_leader_proof_function_only"
on app.points_events for insert to authenticated
with check (false);

drop policy if exists "kpi_events_insert_leaders_or_staff"
on app.kpi_events;

create policy "kpi_events_insert_via_leader_proof_function_only"
on app.kpi_events for insert to authenticated
with check (false);

create or replace function app.can_record_leader_proof_decision(
  assignment_row app.assignments
)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_super_admin()
    or (
      app.is_chapter_leader(assignment_row.chapter_id)
      and not app.has_staff_role(array['coach', 'admin', 'ds_admin'])
    )
$$;

create or replace function app.record_leader_proof_decision(
  evidence_uuid uuid,
  decision_input text,
  review_note text
)
returns table (
  evidence_item_id uuid,
  assignment_id uuid,
  approval_id uuid,
  points_event_id uuid,
  kpi_event_id uuid,
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
  target_evidence app.evidence_items%rowtype;
  target_assignment app.assignments%rowtype;
  approval_uuid uuid := gen_random_uuid();
  points_uuid uuid;
  kpi_uuid uuid;
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_decision text := lower(btrim(coalesce(decision_input, '')));
  normalized_note text := btrim(coalesce(review_note, ''));
  approval_decision app.approval_decision;
  next_evidence_status app.evidence_status;
  next_assignment_status app.assignment_status;
  event_type text;
  audit_action text;
  should_award_points boolean := false;
  award_user_uuid uuid;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if char_length(normalized_note) < 12 then
    raise exception 'leader proof decision note must explain the decision' using errcode = '22023';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid
  for update;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if target_evidence.assignment_id is null then
    raise exception 'leader proof decisions require assignment evidence' using errcode = '22023';
  end if;

  select *
  into target_assignment
  from app.assignments
  where id = target_evidence.assignment_id
  for update;

  if not found then
    raise exception 'assignment not found' using errcode = 'P0002';
  end if;

  if target_assignment.chapter_id <> target_evidence.chapter_id then
    raise exception 'assignment and proof chapter mismatch' using errcode = '22023';
  end if;

  if not app.can_record_leader_proof_decision(target_assignment) then
    raise exception 'actor cannot record leader proof decision' using errcode = '42501';
  end if;

  if target_evidence.status in ('approved', 'rejected') or target_assignment.status = 'approved' then
    raise exception 'proof already has a final leader decision' using errcode = '22023';
  end if;

  if target_evidence.status <> 'pending_review' or target_assignment.status <> 'submitted' then
    raise exception 'proof is not ready for leader decision' using errcode = '22023';
  end if;

  case normalized_decision
    when 'approve' then
      approval_decision := 'approved_for_sharing';
      next_evidence_status := 'approved';
      next_assignment_status := 'approved';
      event_type := 'evidence_approved';
      audit_action := 'leader_proof_approved';
      should_award_points := true;
    when 'request_changes' then
      approval_decision := 'changes_requested';
      next_evidence_status := 'changes_requested';
      next_assignment_status := 'changes_requested';
      event_type := 'evidence_changes_requested';
      audit_action := 'leader_proof_changes_requested';
    when 'reject' then
      approval_decision := 'not_shared';
      next_evidence_status := 'rejected';
      next_assignment_status := 'changes_requested';
      event_type := 'evidence_rejected';
      audit_action := 'leader_proof_rejected';
    else
      raise exception 'unsupported leader proof decision' using errcode = '22023';
  end case;

  award_user_uuid := coalesce(
    target_assignment.assigned_to_user_id,
    target_evidence.submitted_by_user_id
  );

  update app.evidence_items
  set status = next_evidence_status
  where id = target_evidence.id;

  update app.assignments
  set status = next_assignment_status
  where id = target_assignment.id;

  insert into app.approvals (
    id,
    evidence_item_id,
    chapter_id,
    reviewer_user_id,
    decision,
    review_type,
    note
  ) values (
    approval_uuid,
    target_evidence.id,
    target_evidence.chapter_id,
    actor_uuid,
    approval_decision,
    'chapter_proof_decision',
    normalized_note
  );

  if should_award_points then
    points_uuid := gen_random_uuid();
    kpi_uuid := gen_random_uuid();

    insert into app.points_events (
      id,
      chapter_id,
      campaign_id,
      assignment_id,
      chapter_event_id,
      evidence_item_id,
      approval_id,
      awarded_to_user_id,
      points_delta,
      reason,
      created_by
    ) values (
      points_uuid,
      target_assignment.chapter_id,
      target_assignment.campaign_id,
      target_assignment.id,
      target_assignment.chapter_event_id,
      target_evidence.id,
      approval_uuid,
      award_user_uuid,
      target_assignment.points,
      'Leader approved chapter proof for completion.',
      actor_uuid
    );

    insert into app.kpi_events (
      id,
      chapter_id,
      campaign_id,
      phase_id,
      assignment_id,
      chapter_event_id,
      evidence_item_id,
      metric_key,
      metric_value,
      unit,
      source,
      created_by
    ) values (
      kpi_uuid,
      target_assignment.chapter_id,
      target_assignment.campaign_id,
      target_assignment.phase_id,
      target_assignment.id,
      target_assignment.chapter_event_id,
      target_evidence.id,
      target_assignment.kpi_key,
      1,
      'completion',
      'leader_proof_decision',
      actor_uuid
    );
  end if;

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
    event_type,
    actor_uuid,
    target_assignment.chapter_id,
    target_assignment.campaign_id,
    target_assignment.id,
    target_assignment.chapter_event_id,
    jsonb_build_object(
      'source', 'app.record_leader_proof_decision',
      'evidenceItemId', target_evidence.id,
      'approvalId', approval_uuid,
      'decision', normalized_decision,
      'pointsEventId', points_uuid,
      'kpiEventId', kpi_uuid,
      'memberNudge', false,
      'publicPublish', false,
      'hqSharingDecision', false,
      'liveExternalWrite', false
    ),
    'leader_proof_decision:' || target_evidence.id::text || ':' || approval_uuid::text
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
    event_type,
    'internal',
    'evidence_item',
    target_evidence.id::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.record_leader_proof_decision',
      'approvalId', approval_uuid,
      'decision', normalized_decision,
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
    event_type,
    jsonb_build_object(
      'source', 'app.record_leader_proof_decision',
      'evidenceItemId', target_evidence.id,
      'approvalId', approval_uuid,
      'decision', normalized_decision,
      'memberNudge', false,
      'publicPublish', false,
      'liveExternalWrite', false
    ),
    'leader_proof_decision:' || target_evidence.id::text || ':' || approval_uuid::text,
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
    audit_action,
    'evidence_items',
    target_evidence.id,
    jsonb_build_object(
      'assignmentStatus', target_assignment.status,
      'evidenceStatus', target_evidence.status
    ),
    jsonb_build_object(
      'assignmentStatus', next_assignment_status,
      'evidenceStatus', next_evidence_status,
      'approvalId', approval_uuid,
      'pointsEventId', points_uuid,
      'kpiEventId', kpi_uuid,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid,
      'publicPublish', false
    ),
    'Local Goal 115 leader proof decision write path.'
  );

  evidence_item_id := target_evidence.id;
  assignment_id := target_assignment.id;
  approval_id := approval_uuid;
  points_event_id := points_uuid;
  kpi_event_id := kpi_uuid;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_record_leader_proof_decision(app.assignments) to authenticated;
grant execute on function app.record_leader_proof_decision(uuid, text, text) to authenticated;
