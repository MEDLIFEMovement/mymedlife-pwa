-- Private proof functions must never inherit PostgreSQL's default PUBLIC
-- execute privilege. Keep only the authenticated functions required by the
-- supported upload, storage-policy, and audited removal paths.

revoke all on function app.normalize_private_proof_filename(text)
from public, anon, authenticated;
revoke all on function app.build_private_proof_storage_path(
  app.evidence_items,
  text
) from public, anon, authenticated;
revoke all on function app.is_allowed_private_proof_mime_type(text)
from public, anon, authenticated;
revoke all on function app.can_prepare_private_proof_upload(app.evidence_items)
from public, anon, authenticated;
revoke all on function app.can_remove_private_proof_upload(app.evidence_items)
from public, anon, authenticated;
revoke all on function app.prepare_proof_upload_intake(
  uuid,
  text,
  text,
  bigint,
  boolean,
  boolean
) from public, anon, authenticated;
revoke all on function app.record_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) from public, anon, authenticated;
revoke all on function app.record_verified_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) from public, anon, authenticated;
revoke all on function app.record_private_proof_upload_removal(uuid, text)
from public, anon, authenticated;

grant execute on function app.normalize_private_proof_filename(text)
to authenticated;
grant execute on function app.build_private_proof_storage_path(
  app.evidence_items,
  text
) to authenticated;
grant execute on function app.is_allowed_private_proof_mime_type(text)
to authenticated;
grant execute on function app.can_prepare_private_proof_upload(app.evidence_items)
to authenticated;
grant execute on function app.can_remove_private_proof_upload(app.evidence_items)
to authenticated;
grant execute on function app.prepare_proof_upload_intake(
  uuid,
  text,
  text,
  bigint,
  boolean,
  boolean
) to authenticated;
grant execute on function app.record_verified_private_proof_upload(
  uuid,
  text,
  text,
  text,
  bigint,
  boolean,
  boolean
) to authenticated;
grant execute on function app.record_private_proof_upload_removal(uuid, text)
to authenticated;
