# Goal 68: Proof Upload Intake Readiness

## Purpose

Goal 68 adds a mock-safe proof and bridge-video upload intake surface. The MVP
needs students and leaders to understand what proof can be submitted, what
consent is required, what context HQ needs, and what will eventually be logged
before any file upload is enabled.

This goal does not upload files, create storage buckets, publish proof, export
raw files, or enable external automation.

## What It Adds

- `/proof-library/upload`
- `getProofUploadIntakeWorkspace(actor)`
- proof file requirement checks
- consent and context checklist
- disabled upload, publish, and export controls
- future structured event names
- disabled future outbox destinations
- DS Admin restricted state

## Safety Rules

- No production auth is enabled.
- No Supabase Storage bucket is created.
- No browser file upload is enabled.
- No public proof URL is created.
- No raw proof file is sent to n8n, HubSpot, Luma, warehouse, Power BI, SMS,
  email, or AI.
- HQ still owns future proof-sharing decisions.
- DS Admin can inspect integration posture elsewhere but does not read student
  proof content here.

## Future Events

When uploads are approved later, the app should create structured records such
as:

- `proof_upload_requested`
- `proof_upload_validated`
- `evidence_submitted`
- `proof_consent_recorded`
- `hq_proof_review_requested`
- `automation_outbox_recorded`
- `audit_log_recorded`

## Why This Matters

This closes the product gap between "proof metadata exists" and "students know
how proof upload will work." It also keeps the team honest: the UI can explain
the future upload path without pretending storage, consent, moderation, public
sharing, or automation are approved.
