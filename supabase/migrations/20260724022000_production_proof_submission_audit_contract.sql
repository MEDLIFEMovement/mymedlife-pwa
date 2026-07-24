-- Make the existing app-owned proof submission transaction production-honest.
-- The browser gate remains environment-controlled; this wrapper preserves the
-- original RLS/auth checks and replaces the stale local-only audit description.

alter function app.submit_assignment_proof_metadata(
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
) rename to submit_assignment_proof_metadata_internal;

revoke all on function app.submit_assignment_proof_metadata_internal(
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
) from public, anon, authenticated, service_role;

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
  submitted_row record;
begin
  select *
  into submitted_row
  from app.submit_assignment_proof_metadata_internal(
    assignment_uuid,
    evidence_kind,
    proof_summary,
    proof_url,
    target_audiences_input,
    proof_categories_input,
    messenger_type_input,
    lifecycle_stage_input,
    hesitation_addressed_input,
    activity_label_input,
    nps_score_input
  );

  update app.audit_logs
  set reason = 'App-owned proof/testimonial metadata submission.'
  where id = submitted_row.audit_log_id;

  assignment_id := submitted_row.assignment_id;
  evidence_item_id := submitted_row.evidence_item_id;
  event_id := submitted_row.event_id;
  integration_event_id := submitted_row.integration_event_id;
  outbox_id := submitted_row.outbox_id;
  audit_log_id := submitted_row.audit_log_id;

  return next;
end;
$$;

revoke all on function app.submit_assignment_proof_metadata(
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
) from public, anon, service_role;

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
