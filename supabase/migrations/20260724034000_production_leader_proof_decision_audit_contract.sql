-- Make the existing app-owned leader proof decision transaction production-honest.
-- The browser gate remains environment-controlled; this wrapper preserves the
-- original role, chapter, state, points/KPI, and audit transaction while
-- removing the stale local-only audit description.

alter function app.record_leader_proof_decision(uuid, text, text)
  rename to record_leader_proof_decision_internal;

revoke all on function app.record_leader_proof_decision_internal(uuid, text, text)
  from public, anon, authenticated, service_role;

revoke all on function app.can_record_leader_proof_decision(app.assignments)
  from public, anon, authenticated, service_role;

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
  decision_row record;
begin
  select *
  into decision_row
  from app.record_leader_proof_decision_internal(
    evidence_uuid,
    decision_input,
    review_note
  );

  update app.audit_logs
  set reason = 'App-owned leader proof decision.'
  where id = decision_row.audit_log_id;

  evidence_item_id := decision_row.evidence_item_id;
  assignment_id := decision_row.assignment_id;
  approval_id := decision_row.approval_id;
  points_event_id := decision_row.points_event_id;
  kpi_event_id := decision_row.kpi_event_id;
  event_id := decision_row.event_id;
  integration_event_id := decision_row.integration_event_id;
  outbox_id := decision_row.outbox_id;
  audit_log_id := decision_row.audit_log_id;

  return next;
end;
$$;

revoke all on function app.record_leader_proof_decision(uuid, text, text)
  from public, anon, service_role;

grant execute on function app.record_leader_proof_decision(uuid, text, text)
  to authenticated;
