# Goal 160: Private Proof Upload Write

## Purpose

Goal 160 turns the proof upload lane into a real localhost-only write path after
proof metadata already exists. It creates one private Supabase Storage bucket,
keeps the file private, records the upload through audited SQL functions, and
keeps public proof sharing plus external sends disabled.

## What It Adds

- `proof-submissions-private` storage bucket with file-size and MIME limits
- `storage.objects` RLS policies for:
  - submitter upload
  - submitter or HQ cleanup delete
  - submitter or HQ read
- `app.prepare_proof_upload_intake(...)`
- `app.record_private_proof_upload(...)`
- `app.record_private_proof_upload_removal(...)`
- `/proof-library/upload` queue cards for:
  - upload-ready proof metadata rows
  - attached private file state
  - removal cleanup

## Safety Boundary

This goal still keeps the broader launch boundary intact:

- no public proof bucket writes
- no public proof URL
- no HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI raw-file send
- no production auth or production storage config
- no DS Admin raw-file visibility

## Path Convention

Every private file uses this storage path shape:

`chapters/<chapter-id>/evidence/<evidence-item-id>/<normalized-file-name>`

That keeps the path chapter-scoped, evidence-scoped, and predictable for both
RLS and audit readback.

## Removal And Rollback

- Upload flow:
  1. prepare the path with `app.prepare_proof_upload_intake`
  2. upload the file to the private bucket
  3. persist `storage_path` plus event/outbox/audit with
     `app.record_private_proof_upload`
- If step 3 fails, the server action removes the uploaded object immediately so
  the database does not point at an orphaned file.
- Removal flow:
  1. delete the object from the private bucket
  2. clear `storage_path` and write event/outbox/audit with
     `app.record_private_proof_upload_removal`

## Review Notes

- raw-file access is limited to the submitter, Admin, and Super Admin
- chapter leaders can still see proof status in other routes, but not another
  student’s raw private upload
- future sharing consent is recorded at upload time, but public sharing still
  requires a separate HQ decision path
