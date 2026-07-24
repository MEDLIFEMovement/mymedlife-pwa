-- Make the existing app-owned action-start transaction production-honest.
-- The browser gate remains environment-controlled; this wrapper preserves the
-- original auth/RLS transaction while removing stale local/mock audit metadata.

alter function app.start_assignment_action(uuid)
  rename to start_assignment_action_internal;

revoke all on function app.start_assignment_action_internal(uuid)
  from public, anon, authenticated, service_role;

revoke all on function app.can_start_assignment_action(app.assignments)
  from public, anon, authenticated, service_role;

create or replace function app.start_assignment_action(assignment_uuid uuid)
returns table (
  assignment_id uuid,
  previous_status app.assignment_status,
  next_status app.assignment_status,
  event_id uuid,
  integration_event_id uuid,
  audit_log_id uuid
)
language plpgsql
security definer
set search_path = app, public
as $$
declare
  started_row record;
begin
  select *
  into started_row
  from app.start_assignment_action_internal(assignment_uuid);

  update app.events
  set payload = payload - 'mockSafe'
  where id = started_row.event_id;

  update app.audit_logs
  set reason = 'App-owned assignment action start.'
  where id = started_row.audit_log_id;

  assignment_id := started_row.assignment_id;
  previous_status := started_row.previous_status;
  next_status := started_row.next_status;
  event_id := started_row.event_id;
  integration_event_id := started_row.integration_event_id;
  audit_log_id := started_row.audit_log_id;

  return next;
end;
$$;

revoke all on function app.start_assignment_action(uuid)
  from public, anon, service_role;

grant execute on function app.start_assignment_action(uuid) to authenticated;
