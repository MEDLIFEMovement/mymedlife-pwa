# Rollout Evidence Import Validation Packet

Date: 2026-07-10

Workstream:

- Rollout Data and Pilot Proof Builder
- Linear phase / step IDs: `P6.1-P6.8`, `P7.1-P7.4`

Model used for this packet:

- `gpt-5.4-mini` with `low` reasoning

Escalation note:

- no escalation was needed for the current validation pass

Purpose:

This packet records the current import-validation state for pilot and rollout
evidence handling.

It is evidence-backed and no-write. It does not create production users, write
Supabase rows, send invitations, or change provider state.

## 1. Files/modules changed or inspected

Inspected scripts:

- `scripts/create-production-signed-in-route-proof-import.mjs`
- `scripts/create-production-pilot-event-proof-import.mjs`
- `scripts/check-production-rollout-csv-folder.mjs`
- `scripts/build-production-rollout-packet.mjs`

Inspected supporting services:

- `src/services/production-signed-in-route-proof-import.ts`
- `src/services/production-pilot-event-proof-import.ts`
- `src/services/production-rollout-packet-builder.ts`
- `src/services/production-rollout-bootstrap.ts`

Inspected tests:

- `tests/production-signed-in-route-proof-import-script.test.ts`
- `tests/production-pilot-event-proof-import-script.test.ts`
- `tests/production-rollout-owner-packet-assembly-script.test.ts`
- `tests/production-rollout-csv-templates.test.ts`

No application code was changed for this packet.

## 2. Database / API / integration impact

- no production database writes
- no provider writes
- no invitation sends
- no external API changes
- no auth or role changes

This packet validates the local import and packet-building path only.

## 3. Exact validation rules and missing fields

### Signed-in production route proof source CSV

Required columns:

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

Missing fields that still block a real packet:

- no real production source rows
- no packet-backed imported CSV in `rollout-csv/`
- no passed member row for `/app`
- no passed leader row for `/leader?view=overview`
- no passed staff row for `/staff?view=chapters`
- no passed admin row for `/admin`

### Pilot event proof source CSV

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

Missing fields that still block a real packet:

- no real pilot source rows
- no packet-backed imported CSV in `rollout-csv/`
- fewer than five real pilot chapters
- no attendance/check-in evidence
- no matching attendance/points proof
- no audit evidence
- no zero-external-send evidence

### Shared rollout CSV folder

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

Missing fields or blockers:

- no returned owner packet folder has arrived in this worktree
- `rollout-csv/` is still not present locally
- the import chain has no real owner-return input yet

### Rollout packet

Required packet file:

- `production-rollout-packet.json`

Missing blockers:

- no validated owner returns
- no assembled `rollout-csv/`
- no real signed-in proof CSV
- no real pilot proof CSV

### Live production counts

Required file:

- `production-live-data-counts.txt`

Missing blockers:

- no approved read-only production counts run has been captured in this worktree
- no live data file exists locally

## 4. Exact tests, commands, and results

Validation command run:

```bash
"/Users/codex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" node_modules/vitest/vitest.mjs tests/production-signed-in-route-proof-import-script.test.ts tests/production-pilot-event-proof-import-script.test.ts tests/production-rollout-owner-packet-assembly-script.test.ts tests/production-rollout-csv-templates.test.ts
```

Result:

- `4 passed`
- `10 passed`
- no failures

What that means:

- the signed-in import script writes `signed-in-route-proof.csv` and protects existing rows
- the pilot proof import script writes `pilot-event-proof.csv` and protects existing rows
- owner-packet assembly fails on header-only or missing owner inputs
- rollout CSV templates still generate the required files and stay free of fake proof rows

## 5. PR / commit / evidence links

Current local branch:

- `codex/launch-proof-operator-packet`

Current head:

- `20722d12551df70d914a9c77d9b1e674324125d4`

No PR has been opened from this packet yet.

## 6. Current state

- `tested`

This is not yet:

- `production-verified`
- `rollout-ready`

## 7. Remaining blockers and next smallest goal

Remaining blockers:

- real returned owner packet folders
- validated owner-return intake output
- assembled `rollout-csv/`
- `production-rollout-packet.json`
- `production-live-data-counts.txt`
- signed-in production proof rows
- pilot proof rows
- final invite-gate output

Next smallest goal:

- turn the existing importer and packet checks into a ready-to-use operator flow for the first real signed-in and pilot CSVs when those evidence files arrive

## 8. Exact folder and row-count plan

### Returned owner packets

Landing path:

- `returned-owner-packets/<owner-slug>/`

Expected shape:

- one owner folder per returned owner packet
- CSV files only
- no blank templates

Row expectations:

- row counts must be real, non-header rows from the owner packet
- current owner-packet thresholds are enforced by the packet status tooling

### Shared `rollout-csv/` assembly folder

Landing path:

- `rollout-csv/`

Required files and minimum row thresholds:

- `chapters.csv` - at least `30` active chapter rows
- `users.csv` - at least `500` approved student/leader rows
- `memberships.csv` - at least `500` approved student/leader rows
- `staff-roles.csv` - at least `1` active staff role row
- `coach-assignments.csv` - at least `30` rows, one per active chapter
- `campaigns.csv` - at least `30` rows, one per active chapter
- `luma-calendars.csv` - at least `30` rows, one per active chapter
- `pilot-event-proof.csv` - at least `5` ready pilot rows
- `launch-owners.csv` - at least `3` rows
- `signed-in-route-proof.csv` - at least `4` passed proof rows

### Rollout packet

Landing path:

- `production-rollout-packet.json` at repo root

Validation order:

- build from the current `rollout-csv/`
- run `pnpm rollout:check production-rollout-packet.json`

### Live production counts

Landing path:

- `production-live-data-counts.txt` at repo root

Validation order:

- run `pnpm production:data-counts --out production-live-data-counts.txt`
- keep it as read-only aggregate proof only

### Signed-in proof source CSV

Landing path:

- `signed-in-route-proof-source.csv` beside the repo or in an operator handoff folder
- imported file lands at `rollout-csv/signed-in-route-proof.csv`

Minimum passed rows:

- `4`

### Pilot proof source CSV

Landing path:

- `pilot-event-proof-source.csv` beside the repo or in an operator handoff folder
- imported file lands at `rollout-csv/pilot-event-proof.csv`

Minimum ready rows:

- `5`

### Final invite-gate output

Landing path:

- `production-invite-gate.md` at repo root

Prerequisites:

- real packet
- real live counts
- real signed-in proof
- real pilot proof

## 9. What counts as real evidence vs tooling only

Real evidence:

- returned owner packet folder with real CSVs
- assembled `rollout-csv/`
- `production-rollout-packet.json`
- `production-live-data-counts.txt`
- imported signed-in proof rows
- imported pilot proof rows
- `production-invite-gate.md`

Tooling only:

- operator packets
- request templates
- receipt templates
- validation docs
- import/check commands
- readiness scoreboards

## 10. Matrix movement rules

No matrix movement:

- docs changes
- templates
- validation commands
- status packets
- shell or smoke progress

Potential matrix movement:

- first returned owner packet passes dry run
- `rollout-csv/` assembles from real returns
- `production-rollout-packet.json` validates
- `production-live-data-counts.txt` exists from the read-only count path
- signed-in proof reaches the required 4 real passed rows
- pilot proof reaches the required 5 real ready rows
- `production-invite-gate.md` passes

## 11. First-artifact execution plan

When the first returned owner packet arrives:

1. place it under `returned-owner-packets/<owner-slug>/`
2. run the dry-run owner intake command only
3. if the report is not ready, stop and request corrected files
4. if the report is ready, pause for Coordinator-approved apply
5. after apply approval, refresh owner status

When the first signed-in or pilot source CSV arrives:

1. confirm the file name and required columns
2. run the matching import command
3. rebuild the rollout packet
4. run the matching proof check
5. stop if rows fail validation or if the imported CSV is only header-level

## 12. Operator bottom line

The first real external artifact still matters most. Until it arrives, this
packet is ready but the rollout evidence lane is still waiting on humans.

## Bottom line

The import-validation path is working and tested, but the rollout evidence
itself is still missing. The lane can validate real rows as soon as they arrive,
yet no rollout percentage should move until those external artifacts are real.
