# Rollout-Proof Request and Intake Kit

Last updated: 2026-07-10

This is the human-side request and intake kit for rollout proof.

Use it when Coordinator or DS needs to ask a human for a real proof artifact,
or when a real artifact arrives and needs a safe first receipt step.

This kit is template-only. It does not send messages, change production data,
or claim rollout readiness.

## Before using any template

Keep these rules visible:

- ask for real production evidence only
- do not ask for TEST, sandbox, localhost, preview, or staging evidence
- do not ask anyone to paste secrets, passwords, tokens, or private exports
- do not describe any proof artifact as already approved or already complete
- do not treat screenshots alone as rollout proof

## File naming and placement examples

Use these exact examples when you ask for or receive files:

- returned owner folder:
  - `returned-owner-packets/chapter-a-owner/`
- shared rollout folder:
  - `rollout-csv/`
- rollout packet:
  - `production-rollout-packet.json`
- live counts file:
  - `production-live-data-counts.txt`
- signed-in reviewer source:
  - `signed-in-route-proof-source.csv`
- pilot reviewer source:
  - `pilot-event-proof-source.csv`

If a file arrives with the wrong name, do not assume it is fine. Rename only
after confirming it really matches the expected contract.

## 1. Returned owner packet request template

Use this when asking a launch owner or HQ contact to send back one real owner
packet folder.

### Copy-paste template

Subject:

`myMEDLIFE rollout owner return needed - <owner or chapter name>`

Body:

Hi,

We are ready to receive your myMEDLIFE rollout owner return for `<owner or chapter name>`.

Please send back the completed owner packet as CSV files inside one folder for this owner only.

What to send back:

- the completed returned CSV files for this owner packet
- one owner folder only
- no blank templates

How it should be named:

- `returned-owner-packets/<owner-slug>/`

What does not count:

- an empty folder
- blank template CSVs
- screenshots instead of CSVs
- copied sample rows
- any file containing passwords, tokens, or private credential material

What happens next after receipt:

- we place the folder in the returned-owner intake location
- we run a dry-run safety and header check
- if the dry run fails, we will ask for corrected files
- if the dry run passes, the packet can move to the next review step

This request is for rollout evidence only. It does not mean launch is approved yet.

Thank you.

### Receipt checklist

When the folder arrives:

1. confirm it is one owner folder only
2. confirm it contains CSV files
3. confirm the files are not blank templates
4. confirm there are no secrets or credential-like values pasted into the files
5. place it under `returned-owner-packets/<owner-slug>/`
6. run the owner-return dry run only

## 2. Live production counts request template

Use this when DS or a platform operator needs to produce the approved read-only
count artifact.

### Copy-paste template

Subject:

`myMEDLIFE live production counts proof request`

Body:

Hi,

We need the read-only live production counts artifact for the narrow myMEDLIFE launch proof lane.

Please provide:

- the saved output file from the read-only production count check

Expected filename:

- `production-live-data-counts.txt`

What counts:

- the saved output from the approved read-only count command
- aggregate production counts only

What does not count:

- screenshots
- hand-entered numbers in chat or email
- staging or sandbox counts
- any export containing private row-level data

What happens next after receipt:

- we store the file at repo root
- we keep it as one required input for the final invite-gate review
- it will not be treated as a substitute for the rollout packet, signed-in proof, or pilot proof

This request does not authorize any production writes.

Thank you.

### Receipt checklist

When the file arrives:

1. confirm the filename is `production-live-data-counts.txt`
2. confirm it is the saved output of the read-only count process
3. confirm it is aggregate-only proof, not a raw export
4. place it at repo root
5. keep it ready for later invite-gate review

## 3. Signed-in role proof reviewer template

Use this when asking a reviewer to provide real production route evidence for
member, leader, staff, and admin.

### Copy-paste template

Subject:

`myMEDLIFE signed-in production route proof needed`

Body:

Hi,

We need reviewer evidence for real production signed-in route proof across the required myMEDLIFE workspaces.

Please provide one CSV named:

- `signed-in-route-proof-source.csv`

Required columns:

- `email`
- `workspace`
- `observedPath`
- `status`
- `checkedAt`

Optional:

- `notes`

Allowed workspace values:

- member
- leader
- staff
- admin

What counts:

- real production sign-in evidence
- one passed row each for:
  - member landing at `/app`
  - leader landing at `/leader?view=overview`
  - staff landing at `/staff?view=chapters`
  - admin landing at `/admin`

What does not count:

- preview-cookie sessions
- sandbox, local, or staging checks
- screenshots with no backing CSV row
- TEST/Figma proof
- setup-only or incomplete sessions

What happens next after receipt:

- we import the source CSV into `rollout-csv/signed-in-route-proof.csv`
- we rebuild the rollout packet
- we run the signed-in proof gap and readiness checks

This request is for rollout evidence only. It does not mean launch is approved.

Thank you.

### Receipt checklist

When the file arrives:

1. confirm the filename is `signed-in-route-proof-source.csv`
2. confirm all required columns exist
3. confirm the rows describe real production checks
4. confirm the four proof classes are represented or note which are still missing
5. do not accept screenshots alone as proof
6. import the CSV only after the receipt check is clean

## 4. Pilot proof reviewer template

Use this when asking a reviewer to provide real pilot event-loop evidence for
RSVP, attendance/check-in, points, audit, and zero-send posture.

### Copy-paste template

Subject:

`myMEDLIFE pilot event proof needed`

Body:

Hi,

We need reviewer evidence for real pilot event-loop proof in production.

Please provide one CSV named:

- `pilot-event-proof-source.csv`

Required columns:

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

- real pilot evidence from production
- at least five real pilot chapters
- RSVP, attendance/check-in, and points evidence that line up
- audit recorded
- zero external sends confirmed

What does not count:

- TEST events
- sample rows
- fewer than five real chapters presented as complete proof
- missing attendance proof
- mismatched attendance and points counts
- missing audit or missing outbox posture

What happens next after receipt:

- we import the source CSV into `rollout-csv/pilot-event-proof.csv`
- we rebuild the rollout packet
- we run the pilot proof readiness check

This request is for rollout evidence only. It does not mean launch is approved.

Thank you.

### Receipt checklist

When the file arrives:

1. confirm the filename is `pilot-event-proof-source.csv`
2. confirm all required columns exist
3. confirm the rows are real production pilot evidence
4. confirm there are at least five real chapters or note the current count honestly
5. confirm the event-loop evidence is not just RSVP-only
6. import the CSV only after the receipt check is clean

## 5. Coordinator / DS request-and-receipt checklist

Use this every time a human proof ask goes out or comes back.

### Before sending a request

1. choose the correct template above
2. keep the ask narrow to one artifact type
3. include the exact filename or folder name
4. include what counts and what does not count
5. avoid any wording that suggests launch is already approved

### When something is received

1. confirm the filename or folder name is correct
2. confirm the artifact type matches the request
3. confirm it is real production evidence, not TEST or staging evidence
4. confirm it is the backing file, not a screenshot summary
5. place it in the correct location
6. run only the next safe validation step from the operator packet
7. stop on failure and request correction rather than forcing it through

### Where to look next

After receipt, use:

- `72_LAUNCH_PROOF_OPERATOR_PACKET.md` for the full proof chain
- `73_PROOF_ARTIFACT_RECEIPT_PACKET.md` for contract and placement checks

## Bottom line

This kit makes the human side of rollout proof more repeatable, but it does not
change rollout readiness by itself. Real proof still depends on real external
artifacts arriving and passing the repo-backed checks.
