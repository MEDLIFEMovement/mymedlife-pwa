# Proof Artifact Receipt Packet

Last updated: 2026-07-10

This is the plain-English receipt packet for the rollout-proof lane.

Use it the moment a real proof artifact arrives so Coordinator or DS can answer
four questions without guessing:

1. Is this the right file or folder?
2. Where does it go?
3. What must it look like before it counts?
4. What read-only or local validation step happens next?

This packet stays docs-only. It does not authorize production writes,
invitation sends, user creation, or provider changes.

## Core rule

An artifact only counts if it is real production evidence and it matches the
repo contract below.

These do **not** count:

- TEST or sandbox exports
- staging-only evidence
- screenshots without the backing file
- copied sample CSVs
- header-only templates
- chat summaries standing in for files

## Receipt table

| Artifact | Correct location | What it must look like | Next check |
| --- | --- | --- | --- |
| Returned owner packet folder | `returned-owner-packets/<owner-slug>/` | real returned CSV files for exactly one owner packet, not blank templates | run the owner-return dry run |
| Shared rollout CSV folder | `rollout-csv/` | all required CSVs present and filled with real rows | `pnpm rollout:check-csv --dir rollout-csv` |
| Rollout packet | `production-rollout-packet.json` at repo root | built from real `rollout-csv/` data and readable as a valid packet | `pnpm rollout:check production-rollout-packet.json` |
| Live production counts | `production-live-data-counts.txt` at repo root | saved output from the read-only production count command | use as input to later invite-gate review |
| Signed-in proof source CSV | usually `signed-in-route-proof-source.csv` beside the repo or in an operator handoff folder | reviewer rows for real production member, leader, staff, and admin checks | `pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv` |
| Pilot proof source CSV | usually `pilot-event-proof-source.csv` beside the repo or in an operator handoff folder | reviewer rows for real pilot event-loop proof | `pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv` |

## 1. Returned owner packet folder contract

### Correct contract

Artifact:

- one returned folder under `returned-owner-packets/<owner-slug>/`

What it should contain:

- returned CSV files for that owner packet
- real returned files, not blank templates

What fails receipt immediately:

- empty folder
- wrong owner slug folder
- unreadable CSVs
- header-only placeholders
- pasted secrets, passwords, tokens, API keys, or credential-like content

### Plain-English receipt checklist

When the first owner folder arrives:

1. confirm it is under `returned-owner-packets/<owner-slug>/`
2. confirm it contains actual CSV files
3. confirm the files are not blank templates
4. do **not** apply anything yet
5. run the owner-return dry run only
6. if the dry run is not ready, stop and request corrected files

Next step:

- `pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir production-rollout-owner-handoff/rollout-owner-packets --recipient-assignments production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv --owner-send-tracker production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-return-intake.md`

## 2. `rollout-csv/` assembly folder contract

### Correct contract

Artifact:

- `rollout-csv/`

Required files:

- `chapters.csv`
- `users.csv`
- `memberships.csv`
- `staff-roles.csv`
- `coach-assignments.csv`
- `campaigns.csv`
- `luma-calendars.csv`
- `pilot-event-proof.csv`
- `launch-owners.csv`
- `signed-in-route-proof.csv`

What fails receipt immediately:

- missing required files
- header-only files
- sample rows, TEST rows, or placeholder rows standing in for launch data

### Plain-English receipt checklist

When `rollout-csv/` appears:

1. confirm the folder is named exactly `rollout-csv/`
2. confirm all ten required CSVs are present
3. confirm this is not just a template folder
4. run the CSV folder validation
5. if validation fails, stop and fix rows before building the packet

Next step:

- `pnpm rollout:check-csv --dir rollout-csv`

## 3. `production-rollout-packet.json` contract

### Correct contract

Artifact:

- `production-rollout-packet.json`

Correct location:

- repo root

What counts:

- packet was built from real `rollout-csv/` input
- packet is readable JSON
- packet passes the rollout packet check

What fails receipt immediately:

- hand-written or manually edited packet with no trusted CSV build path
- unreadable JSON
- packet that exists but fails validation

### Plain-English receipt checklist

When `production-rollout-packet.json` appears:

1. confirm it is at repo root
2. confirm it came from the current `rollout-csv/` inputs
3. run the packet validation check
4. if validation fails, stop and fix the upstream CSV inputs

Next step:

- `pnpm rollout:check production-rollout-packet.json`

## 4. `production-live-data-counts.txt` contract

### Correct contract

Artifact:

- `production-live-data-counts.txt`

Correct location:

- repo root

What counts:

- saved output from `pnpm production:data-counts --out production-live-data-counts.txt`
- read-only aggregate count proof

What fails receipt immediately:

- numbers copied manually from chat, email, or screenshots
- sandbox or staging counts
- any file that did not come from the read-only count path

### Plain-English receipt checklist

When `production-live-data-counts.txt` appears:

1. confirm the filename is exact
2. confirm it is the saved output of the read-only count command
3. confirm nobody is treating it as a substitute for the rollout packet or proof CSVs
4. keep it ready for later invite-gate review

Next step:

- later use with `pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --out production-invite-gate.md`

## 5. Signed-in proof source CSV contract

### Correct contract

Source artifact:

- `signed-in-route-proof-source.csv`

Expected columns:

- `email`
- `workspace`
- `observedPath`
- `status`
- `checkedAt`

Optional:

- `notes`

Allowed workspace aliases:

- member: `member`, `student`, `app`
- leader: `leader`, `student_leader`, `chapter_leader`
- staff: `staff`, `coach`, `sales_coach`
- admin: `admin`, `ds_admin`, `super_admin`

What counts:

- real production reviewer rows
- one passed row each for:
  - member to `/app`
  - leader to `/leader?view=overview`
  - staff/support to `/staff?view=chapters`
  - admin/DS admin to `/admin`

What fails receipt immediately:

- preview-cookie sessions
- sandbox, local, or staging evidence
- missing required columns
- screenshots with no backing CSV row

### Plain-English receipt checklist

When `signed-in-route-proof-source.csv` arrives:

1. confirm the required columns exist
2. confirm the rows are for real production checks, not preview or staging
3. confirm all four proof classes are represented or note which are still missing
4. import the file into `rollout-csv/`
5. rebuild the packet and run the signed-in proof checks

Next steps:

- `pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv`
- rebuild `production-rollout-packet.json`
- `pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json`
- `pnpm production:signed-in-route-proof --packet production-rollout-packet.json`
- `pnpm production:signed-in-route-proof:check`

## 6. Pilot proof source CSV contract

### Correct contract

Source artifact:

- `pilot-event-proof-source.csv`

Expected columns:

- `chapterId`
- `eventName`
- `lumaEventId`
- `rsvpCount`
- `attendanceCount`
- `pointsAwardedCount`
- `auditRecorded`
- `zeroExternalSends`
- `eventRoute`
- `attendanceRoute`
- `pointsRoute`
- `auditRoute`
- `outboxRoute`
- `checkedAt`
- `reviewedByEmail`

Optional:

- `status`
- `notes`

What counts:

- real pilot reviewer rows
- at least five real pilot chapters
- RSVP, attendance or check-in, and points evidence all line up
- audit is recorded
- zero external sends is confirmed

What fails receipt immediately:

- fewer than five real chapters
- missing required columns
- no attendance proof
- mismatched attendance and points counts
- missing audit or missing outbox posture
- TEST-only event evidence

### Plain-English receipt checklist

When `pilot-event-proof-source.csv` arrives:

1. confirm required columns exist
2. confirm the rows are real pilot evidence, not sample rows
3. confirm there are at least five real chapters or note the current count honestly
4. import the file into `rollout-csv/`
5. rebuild the packet and run the pilot proof check

Next steps:

- `pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv`
- rebuild `production-rollout-packet.json`
- `pnpm production:pilot-event-proof --packet production-rollout-packet.json`

## Short operator flow

If a proof artifact arrives, do this in order:

1. put it in the exact location above
2. confirm it matches the exact contract above
3. run only the next listed check
4. stop immediately on a failed check
5. do not treat the artifact as rollout proof until that check passes

## Bottom line

This receipt packet removes ambiguity, not blockers.

Real rollout readiness still does not move until real external artifacts arrive
and pass the repo-backed checks above.
