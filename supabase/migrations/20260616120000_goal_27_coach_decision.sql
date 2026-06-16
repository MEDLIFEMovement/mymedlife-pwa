-- Goal 27: local coach decision logging.
-- This keeps browser save controls, production auth, and external sends disabled.

drop policy if exists "phase_readiness_reviews_insert_leaders_coaches_staff"
on app.phase_readiness_reviews;

create policy "phase_readiness_reviews_insert_leader_ready_only"
on app.phase_readiness_reviews for insert to authenticated
with check (
  app.is_chapter_leader(chapter_id)
  and reviewer_user_id = auth.uid()
  and readiness_status in ('ready', 'blocked')
);

create or replace function app.can_log_coach_decision(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = app, public
as $$
  select app.is_coach_for_chapter(chapter_uuid)
    or app.has_staff_role(array['admin', 'super_admin'])
$$;

create or replace function app.log_coach_decision(
  chapter_uuid uuid,
  campaign_uuid uuid,
  phase_uuid uuid,
  decision_input text,
  decision_note text,
  blocker_summary_input text default null
)
returns table (
  review_id uuid,
  event_id uuid,
  integration_event_id uuid,
  outbox_id uuid,
  audit_log_id uuid,
  next_readiness_status app.readiness_status,
  next_coach_validation_status app.coach_validation_status
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  actor_uuid uuid := auth.uid();
  target_phase app.phases%rowtype;
  review_uuid uuid := gen_random_uuid();
  event_uuid uuid := gen_random_uuid();
  integration_event_uuid uuid := gen_random_uuid();
  outbox_uuid uuid := gen_random_uuid();
  audit_uuid uuid := gen_random_uuid();
  normalized_decision text := lower(btrim(coalesce(decision_input, '')));
  normalized_note text := btrim(coalesce(decision_note, ''));
  normalized_blocker_summary text := nullif(btrim(coalesce(blocker_summary_input, '')), '');
begin
  if actor_uuid is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if normalized_decision not in ('advance', 'hold', 'intervene') then
    raise exception 'coach decision must be advance, hold, or intervene' using errcode = '22023';
  end if;

  if char_length(normalized_note) < 12 then
    raise exception 'coach decision note must explain the decision' using errcode = '22023';
  end if;

  if normalized_decision = 'intervene'
    and char_length(coalesce(normalized_blocker_summary, '')) < 8 then
    raise exception 'intervene decisions need a blocker summary' using errcode = '22023';
  end if;

  select *
  into target_phase
  from app.phases
  where id = phase_uuid
    and chapter_id = chapter_uuid
    and campaign_id = campaign_uuid
  for update;

  if not found then
    raise exception 'phase not found for chapter and campaign' using errcode = 'P0002';
  end if;

  if not app.can_log_coach_decision(target_phase.chapter_id) then
    raise exception 'actor cannot log coach decision for this chapter' using errcode = '42501';
  end if;

  case normalized_decision
    when 'advance' then
      next_readiness_status := 'validated';
      next_coach_validation_status := 'validated';
    when 'hold' then
      next_readiness_status := 'ready';
      next_coach_validation_status := 'pending';
    when 'intervene' then
      next_readiness_status := 'blocked';
      next_coach_validation_status := 'blocked';
  end case;

  update app.phases
  set readiness_status = next_readiness_status,
      coach_validation_status = next_coach_validation_status
  where id = target_phase.id;

  insert into app.phase_readiness_reviews (
    id,
    chapter_id,
    campaign_id,
    phase_id,
    reviewer_user_id,
    readiness_status,
    decision_note,
    blocker_summary
  ) values (
    review_uuid,
    target_phase.chapter_id,
    target_phase.campaign_id,
    target_phase.id,
    actor_uuid,
    next_readiness_status,
    normalized_note,
    normalized_blocker_summary
  );

  insert into app.events (
    id,
    event_type,
    actor_user_id,
    chapter_id,
    campaign_id,
    payload,
    correlation_id
  ) values (
    event_uuid,
    'coach_decision_logged',
    actor_uuid,
    target_phase.chapter_id,
    target_phase.campaign_id,
    jsonb_build_object(
      'source', 'app.log_coach_decision',
      'phaseId', target_phase.id,
      'reviewId', review_uuid,
      'coachDecision', normalized_decision,
      'readinessStatus', next_readiness_status,
      'coachValidationStatus', next_coach_validation_status,
      'liveExternalWrite', false
    ),
    'coach_decision:' || target_phase.id::text || ':' || event_uuid::text
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
    target_phase.chapter_id,
    'coach_decision_logged',
    'internal',
    'phase_readiness_review',
    review_uuid::text,
    'recorded',
    jsonb_build_object(
      'source', 'app.log_coach_decision',
      'coachDecision', normalized_decision,
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
    target_phase.chapter_id,
    'n8n',
    'coach_decision_logged',
    jsonb_build_object(
      'source', 'app.log_coach_decision',
      'phaseId', target_phase.id,
      'reviewId', review_uuid,
      'coachDecision', normalized_decision,
      'liveExternalWrite', false
    ),
    'coach_decision:' || target_phase.id::text || ':' || event_uuid::text,
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
    target_phase.chapter_id,
    'coach_decision_logged',
    'phases',
    target_phase.id,
    jsonb_build_object(
      'readinessStatus', target_phase.readiness_status,
      'coachValidationStatus', target_phase.coach_validation_status
    ),
    jsonb_build_object(
      'coachDecision', normalized_decision,
      'readinessStatus', next_readiness_status,
      'coachValidationStatus', next_coach_validation_status,
      'reviewId', review_uuid,
      'eventId', event_uuid,
      'integrationEventId', integration_event_uuid,
      'outboxId', outbox_uuid
    ),
    'Local Goal 27 coach decision logging path.'
  );

  review_id := review_uuid;
  event_id := event_uuid;
  integration_event_id := integration_event_uuid;
  outbox_id := outbox_uuid;
  audit_log_id := audit_uuid;

  return next;
end;
$$;

grant execute on function app.can_log_coach_decision(uuid) to authenticated;
grant execute on function app.log_coach_decision(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text
) to authenticated;
