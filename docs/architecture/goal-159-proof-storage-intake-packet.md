# Goal 159: Proof Storage Intake Packet

## Purpose

Goal 159 extends `/proof-library/upload` with a concrete storage-intake packet
for reviewers. It shows how a future proof upload would be prepared without
creating a Supabase Storage bucket, signed upload URL, storage object, public
proof URL, external export, or AI summary.

## What It Adds

- `storagePacket` on `getProofUploadIntakeWorkspace(actor)`
- future function name: `app.prepare_proof_upload_intake`
- private bucket and public bucket preview
- normalized storage-path preview for the sample bridge video
- required metadata list
- raw proof reader boundary
- readiness checks shared with the upload-intake validation
- future records for storage object, evidence item, structured event, disabled
  outbox, and audit action
- moderation queue before any proof can be reused
- locked controls for signed upload URLs, storage writes, `storage_path`
  persistence, public URLs, and raw-proof automation exports

## Safety Boundary

This goal keeps every upload and publish path disabled:

- no browser file upload
- no signed upload URL
- no `storage.objects` write
- no `evidence_items.storage_path` persistence
- no public proof URL
- no public proof publishing
- no export to n8n, warehouse, Power BI, HubSpot, Luma, SMS, email, or AI

The packet is review evidence only. It helps Nick, HQ, DS, and security inspect
the storage shape before a later approved storage goal creates real buckets or
upload writes.

## Review Path

1. Open `/proof-library/upload` as `member.a@mymedlife.test`,
   `leader.a@mymedlife.test`, `admin@mymedlife.test`, or
   `super.admin@mymedlife.test`.
2. Confirm the Goal 159 storage packet shows `upload_disabled` now and
   `proof_upload_intake_recorded` as the future result.
3. Confirm raw proof readers exclude DS Admin and public proof publishing stays
   locked.
4. Confirm future records include `proof_upload_requested`, disabled outbox
   posture, and `proof_upload_intake_prepared`.
5. Keep uploads blocked until storage/RLS, consent, moderation, deletion,
   rollback, and audit-readback evidence are approved.
