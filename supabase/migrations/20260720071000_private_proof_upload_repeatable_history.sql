-- Keep every upload/removal attempt append-only while allowing a submitter to
-- replace a removed private file. The original RPCs use evidence-level key
-- prefixes; the source event id makes each durable history entry unique.

create or replace function app.ensure_private_proof_outbox_idempotency()
returns trigger
language plpgsql
set search_path = app, public
as $$
begin
  if new.event_type in ('proof_upload_recorded', 'proof_upload_removed') then
    new.idempotency_key := new.idempotency_key || ':' || new.source_event_id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_private_proof_outbox_idempotency
on app.automation_outbox;

create trigger ensure_private_proof_outbox_idempotency
before insert on app.automation_outbox
for each row
execute function app.ensure_private_proof_outbox_idempotency();

