-- Goal 16: local HQ proof/testimonial sharing decisions.
-- This keeps public publishing and external sends disabled.

create or replace function app.can_record_hq_proof_sharing_decision()
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.has_staff_role(array['admin', 'super_admin'])
$$;

drop policy if exists "approvals_insert_hq_staff_only"
on app.approvals;

create policy "approvals_insert_via_hq_sharing_function_only"
on app.approvals for insert to authenticated
with check (false);

drop policy if exists "evidence_update_submitter_pending_or_staff"
on app.evidence_items;

create policy "evidence_update_submitter_pending_only"
on app.evidence_items for update to authenticated
using (
  submitted_by_user_id = auth.uid()
  and status = 'pending_review'
  and sharing_status in ('submitted', 'in_hq_review')
)
with check (
  submitted_by_user_id = auth.uid()
  and status = 'pending_review'
  and sharing_status in ('submitted', 'in_hq_review')
);

create or replace function app.record_hq_proof_sharing_decision(
  evidence_uuid uuid,
  decision_input app.approval_decision,
  review_note text
)
returns table (
  evidence_item_id uuid,
  approval_id uuid,
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
  approval_uuid uuid := gen_random_uuid();
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_note text := btrim(coalesce(review_note, ''));
  next_evidence_status app.evidence_status;
  next_sharing_status app.content_sharing_status;
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not app.can_record_hq_proof_sharing_decision() then
    raise exception 'actor cannot record HQ proof sharing decision' using errcode = '42501';
  end if;

  if decision_input is null then
    raise exception 'HQ sharing decision is required' using errcode = '22023';
  end if;

  if char_length(normalized_note) < 12 then
    raise exception 'HQ sharing note must explain the decision' using errcode = '22023';
  end if;

  select *
  into target_evidence
  from app.evidence_items
  where id = evidence_uuid
  for update;

  if not found then
    raise exception 'evidence item not found' using errcode = 'P0002';
  end if;

  if target_evidence.sharing_status in ('approved_for_sharing', 'not_shared', 'archived') then
    raise exception 'proof already has a final sharing decision' using errcode = '22023';
  end if;

  case decision_input
    when 'approved_for_sharing' then
      next_evidence_status := 'approved';
      next_sharing_status := 'approved_for_sharing';
    when 'not_shared' then
      next_evidence_status := 'approved';
      next_sharing_status := 'not_shared';
    when 'changes_requested' then
      next_evidence_status := 'changes_requested';
      next_sharing_status := 'in_hq_review';
    else
      raise exception 'unsupported HQ sharing decision' using errcode = '22023';
  end case;

  update app.evidence_items
  set status = next_evidence_status,
      sharing_status = next_sharing_status
  where id = target_evidence.id;

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
    decision_input,
    'hq_content_sharing',
    normalized_note
  );

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    assignment_id,
    chapter_event_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'hq_sharing_decision_logged',
    actor_uuid,
    target_evidence.chapter_id,
    target_evidence.assignment_id,
    target_evidence.chapter_event_id,
    jsonb_build_object(
      'source', 'app.record_hq_proof_sharing_decision',
      'evidenceItemId', target_evidence.id,
      'approvalId', approval_uuid,
      'decision', decision_input,
      'publicPublish', false,
      'liveExternalWrite', false
    ),
    'hq_sharing_decision:' || target_evidence.id::text || ':' || approval_uuid::text
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
    target_evidence.chapter_id,
    'hq_sharing_decision_logged',
    'internal',
    'evidence_item',
    target_evidence.id::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.record_hq_proof_sharing_decision',
      'approvalId', approval_uuid,
      'decision', decision_input,
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
    target_evidence.chapter_id,
    'n8n',
    'hq_sharing_decision_logged',
    jsonb_build_object(
      'source', 'app.record_hq_proof_sharing_decision',
      'evidenceItemId', target_evidence.id,
      'approvalId', approval_uuid,
      'decision', decision_input,
      'publicPublish', false,
      'liveExternalWrite', false
    ),
    'hq_sharing_decision:' || target_evidence.id::text || ':' || approval_uuid::text,
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
    target_evidence.chapter_id,
    'hq_sharing_decision_logged',
    'evidence_items',
    target_evidence.id,
    jsonb_build_object(
      'status', target_evidence.status,
      'sharingStatus', target_evidence.sharing_status
    ),
    jsonb_build_object(
      'status', next_evidence_status,
      'sharingStatus', next_sharing_status,
      'approvalId', approval_uuid,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid
    ),
    'Local Goal 16 HQ proof/testimonial sharing decision.'
  );

  evidence_item_id := target_evidence.id;
  approval_id := approval_uuid;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_record_hq_proof_sharing_decision() to authenticated;
grant execute on function app.record_hq_proof_sharing_decision(
  uuid,
  app.approval_decision,
  text
) to authenticated;
