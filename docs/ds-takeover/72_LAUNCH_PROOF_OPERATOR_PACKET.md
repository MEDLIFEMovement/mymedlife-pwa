# Launch-Proof Operator Packet

Last updated: 2026-07-10

This is the plain-English operator packet for the rollout-proof lane.

It exists so that when real rollout artifacts arrive, Coordinator and DS can
move immediately without mixing up shell progress and rollout proof.

This packet is docs-only guidance. It does not authorize production writes,
provider changes, user creation, invitation sends, or rollout claims.

## Bottom line

The repo is ready to process rollout proof, but this worktree still does not
contain the real rollout artifacts.

Right now, the local proof state is still blocked by missing external evidence:

- no returned owner packet folders are present locally
- no trusted `rollout-csv/` folder exists locally
- no `production-rollout-packet.json` exists locally
- no `production-live-data-counts.txt` exists locally
- no packet-backed signed-in proof rows exist locally
- no packet-backed pilot proof rows exist locally
- no `production-invite-gate.md` exists locally

## What does not count as rollout proof

These are real project progress, but they do **not** move rollout readiness by
themselves:

- merged shell or UI PRs
- public smoke
- TEST-labeled screens
- preview review
- sandbox, localhost, or staging checks
- screenshots with no real reviewer, route, and timestamp evidence

## The proof chain

The rollout-proof chain is:

1. first returned owner packet arrives
2. owner-return dry run passes
3. trusted rollout CSV folder is assembled and validated
4. rollout packet is built and validated
5. live production counts are captured
6. signed-in production role proof is imported and checked
7. pilot proof is imported and checked
8. final invite gate runs

If one step is missing, downstream steps are still not real.

## Operator table

| Step | Artifact that must exist | Who provides it | Where it goes | What counts as real proof | Next command or check |
| --- | --- | --- | --- | --- | --- |
| First owner return | `returned-owner-packets/<owner-slug>/` | launch owner / HQ / whoever is returning that owner packet | under repo root in `returned-owner-packets/` | one real owner folder exists, contains returned CSVs, and is not blank | `pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir production-rollout-owner-handoff/rollout-owner-packets --recipient-assignments production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv --owner-send-tracker production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-owner-return-intake.md` |
| Owner intake pass | `production-rollout-owner-return-intake.md` | Coordinator / DS operator running the read-only dry run | repo root | dry run says files are readable, expected, header-valid, and safe to accept | if clean, pause for explicit apply approval, then refresh status with `pnpm rollout:current-status ... --out production-rollout-current-status.md` |
| Shared rollout CSV folder | `rollout-csv/` with filled CSVs | Coordinator after validated owner returns, plus reviewer imports for signed-in and pilot proof | repo root `rollout-csv/` | all required CSVs exist and contain real rows, not header-only placeholders | `pnpm rollout:check-csv --dir rollout-csv` |
| Rollout packet | `production-rollout-packet.json` | Coordinator / DS operator | repo root | packet builds from real rollout CSVs and passes validation | `pnpm rollout:build ... --out production-rollout-packet.json` then `pnpm rollout:check production-rollout-packet.json` |
| Live counts proof | `production-live-data-counts.txt` | DS / platform / approved operator using the read-only count path | repo root | saved output from the production count check, produced without row writes | `pnpm production:data-counts --out production-live-data-counts.txt` |
| Signed-in role proof | source file `signed-in-route-proof-source.csv`, then built file `rollout-csv/signed-in-route-proof.csv` | reviewer(s) with real production users, then Coordinator / DS operator imports it | source CSV can live beside repo; imported file must land in `rollout-csv/` | one real passed row each for member, leader, staff/support, and admin/DS admin | `pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv`, then rebuild packet, then `pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json`, `pnpm production:signed-in-route-proof --packet production-rollout-packet.json`, and `pnpm production:signed-in-route-proof:check` |
| Pilot proof | source file `pilot-event-proof-source.csv`, then built file `rollout-csv/pilot-event-proof.csv` | reviewer(s) with real pilot chapters, then Coordinator / DS operator imports it | source CSV can live beside repo; imported file must land in `rollout-csv/` | at least five real pilot chapters with RSVP, attendance or check-in, points, audit, and zero-external-send evidence | `pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv`, then rebuild packet, then `pnpm production:pilot-event-proof --packet production-rollout-packet.json` |
| Final invite gate | `production-invite-gate.md` | Coordinator only after all upstream proof is real | repo root | final gate report says ready using the real packet and real live counts | `pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --out production-invite-gate.md` |

## Exact artifact expectations

### Returned owner packet

What must exist:

- `returned-owner-packets/<owner-slug>/`

What must be inside:

- returned CSV files for that owner packet
- real returned files, not blank templates

Immediate fail conditions:

- empty folder
- wrong owner folder
- unreadable CSVs
- bad headers
- secret-like or credential-like content pasted into the files

### Shared rollout CSV folder

Expected filled files:

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

What does not count:

- header-only templates
- partial folders missing required files
- sample or TEST rows standing in for launch data

### Signed-in production role proof

Reviewer source file:

- `signed-in-route-proof-source.csv`

Required source columns:

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

- one real production passed row for each proof class:
  - member to `/app`
  - leader to `/leader?view=overview`
  - staff/support to `/staff?view=chapters`
  - admin/DS admin to `/admin`

What does not count:

- preview-cookie sessions
- sandbox, localhost, or staging sessions
- Test/Figma rows
- setup-only sessions
- screenshots with no packet-backed row

### Live production counts

Artifact:

- `production-live-data-counts.txt`

What counts:

- saved output from `pnpm production:data-counts --out production-live-data-counts.txt`
- read-only aggregate counts only
- no row writes

What does not count:

- screenshots of dashboards
- hand-entered totals in chat or email
- sandbox counts

### Pilot proof

Reviewer source file:

- `pilot-event-proof-source.csv`

Required source columns:

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

- at least five real pilot chapters
- at least one RSVP
- at least one attendance or check-in
- points count matches attendance count
- audit recorded is yes
- zero external sends is yes

What does not count:

- one chapter only
- a TEST event
- an event with no attendance proof
- an event with mismatched attendance and points
- missing audit or missing outbox posture

## Exact operator sequence

### When the first owner return arrives

1. Place the returned folder under `returned-owner-packets/<owner-slug>/`.
2. Run the owner-return dry run only.
3. Read `production-rollout-owner-return-intake.md`.
4. If it is not ready, stop and request corrected files.
5. If it is ready, pause for explicit apply approval.
6. After approval, run the apply step.
7. Refresh `production-rollout-current-status.md`.

### When signed-in proof rows arrive

1. Keep reviewer evidence in `signed-in-route-proof-source.csv`.
2. Import it into `rollout-csv/signed-in-route-proof.csv`.
3. Rebuild `production-rollout-packet.json`.
4. Run the signed-in gap check.
5. Run the signed-in readiness check.
6. Keep the drift check visible with `pnpm production:signed-in-route-proof:check`.

### When pilot proof rows arrive

1. Keep reviewer evidence in `pilot-event-proof-source.csv`.
2. Import it into `rollout-csv/pilot-event-proof.csv`.
3. Rebuild `production-rollout-packet.json`.
4. Run `pnpm production:pilot-event-proof --packet production-rollout-packet.json`.

### When live counts are approved

1. Run the read-only count proof command.
2. Save the output as `production-live-data-counts.txt`.
3. Do not treat the count proof as a substitute for packet, signed-in proof, or pilot proof.

### When all upstream proof is real

1. Confirm:
   - owner returns are validated
   - `rollout-csv/` is valid
   - `production-rollout-packet.json` is valid
   - `production-live-data-counts.txt` is present
   - signed-in proof is passed
   - pilot proof is passed
2. Run the final invite gate.
3. Only if `production-invite-gate.md` is ready can rollout-readiness language move.

## Current blockers

These still require real external artifacts:

- returned owner packet folders
- validated owner intake output
- real shared rollout CSVs
- real rollout packet
- real live production counts output
- real signed-in production role proof
- real five-chapter pilot proof
- final invite gate output

## Best DS summary

The repo can process rollout proof now, but rollout proof itself is still
missing. The next real unlock is the first returned owner packet folder. Until
that exists, shell wins should stay clearly separated from rollout readiness.

## Repo truth behind this packet

This packet is based on current `main` repo truth in:

- `package.json` rollout and production scripts
- `scripts/create-production-rollout-owner-return-intake.mjs`
- `scripts/check-production-rollout-current-status.mjs`
- `scripts/check-production-rollout-csv-folder.mjs`
- `scripts/build-production-rollout-packet.mjs`
- `scripts/create-production-signed-in-route-proof-import.mjs`
- `scripts/create-production-pilot-event-proof-import.mjs`
- `scripts/check-production-live-data-counts.mjs`
- `scripts/check-production-invite-gate.mjs`
