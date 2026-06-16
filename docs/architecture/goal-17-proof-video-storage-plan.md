# Goal 17 Proof And Video Storage Plan

Status: planning and disabled readiness only.

Goal 17 prepares the proof/video storage architecture without creating buckets,
wiring uploads, publishing proof, or sending external automation.

## What This Adds

- A small TypeScript storage-readiness service:
  - `src/services/proof-storage-readiness.ts`
- Unit tests proving uploads stay disabled:
  - `tests/proof-storage-readiness.test.ts`
- This architecture note for human review.

## Storage Shape

Use two future storage concepts:

- `proof-submissions-private`: private raw files submitted by students or
  chapter operators.
- `proof-library-public`: future curated/public assets only after HQ approval
  and explicit publishing approval.

Do not make raw upload storage public.

## Allowed Future File Types

The first expected file types are:

- MP4 video
- QuickTime/MOV video
- JPEG image
- PNG image
- WebP image
- PDF

The current planned maximum file size is 500 MB. This is intentionally generous
for phone-recorded bridge videos, but should be revisited before production.

## Required Metadata

Future upload metadata should include:

- evidence item ID
- chapter ID
- submitter user ID
- original file name
- MIME type
- byte size
- storage path
- consent for MEDLIFE review
- consent for future sharing
- created timestamp

Later production work should also consider duration, checksum, transcript,
moderation status, consent version, and whether a person is identifiable in the
video/photo.

## Access Boundaries

Raw private uploads should be readable only by:

- submitter
- Admin
- Super Admin

Curated/public-library assets can later be visible to:

- submitter
- chapter leaders
- coaches
- Admin
- Super Admin

DS Admin should not own proof content truth. DS Admin may later help manage
storage/integration infrastructure, but not decide proof content visibility.

## What Stays Disabled

- browser uploads
- Supabase Storage bucket creation
- public proof URLs
- automatic proof publishing
- external moderation or AI summaries
- warehouse or n8n export of raw files

## Next Implementation Gate

Before uploads are implemented, the team should approve:

- exact bucket names
- storage RLS policies
- file size limits
- accepted MIME types
- consent language
- raw-file retention rules
- who can view raw uploads
- whether leaders can see raw files or only proof status/metadata
- how public proof publishing is separated from HQ sharing approval
