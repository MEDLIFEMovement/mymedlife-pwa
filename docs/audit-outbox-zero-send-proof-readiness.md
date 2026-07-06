# Audit / Outbox Zero-Send Proof Readiness

Use this when the team is preparing real five-chapter pilot evidence for the
final invite-gate path.

This is a readiness map only. It does not read production data, write
production data, create users, send invites, send email, call provider APIs, or
approve launch.

## What Audit Evidence Is Required

For each pilot chapter row, the reviewer must be able to show:

- one real app action
- one real actor or reviewer
- one real chapter and event
- one recorded audit proof state
- one checked-at timestamp
- one reviewer email tied to a real rollout user

For the packet-ready pilot proof row, this maps to:

- `auditRecorded=yes` in the source sheet
- `auditEvidence=recorded` in `pilot-event-proof.csv`
- valid `checkedAt`
- valid `reviewedByEmail`
- app route evidence for the event, attendance, points, audit, and outbox views

## What Outbox Zero-Send Evidence Is Required

For each pilot chapter row, the reviewer must be able to show:

- whether an outbox row exists
- whether the outbox posture stayed blocked, disabled, or mock-safe
- that no unapproved external send occurred
- which reviewer confirmed the posture and when

For the packet-ready pilot proof row, this maps to:

- `zeroExternalSends=yes` in the source sheet
- `outboxStatus=zero_sends` in `pilot-event-proof.csv`
- `outboxRoute` pointing to a known app route
- a reviewer and timestamp

## Which Code Already Checks This

These surfaces already enforce or explain the audit/outbox proof shape:

- `src/services/production-pilot-event-proof.ts`
  - blocks rows unless `auditEvidence === "recorded"`
  - blocks rows unless `outboxStatus === "zero_sends"`
  - blocks missing or invalid `checkedAt`
  - blocks missing or unknown `reviewedByEmail`
  - blocks local, preview, staging, sample, and setup-only source markers
- `src/services/production-invite-gate.ts`
  - treats five-chapter pilot proof as a required invite-gate check
  - keeps the gate blocked until RSVP, attendance, points, audit, and outbox
    proof all exist
- `src/services/admin-integration-outbox-workspace.ts`
  - defines the read-only integration outbox review posture
  - exposes blocked controls and live-send preflight questions
- `docs/audit-outbox-zero-send-evidence-checklist.md`
  - plain-English checklist for reviewers
- `docs/five-chapter-pilot-proof-operator-runbook.md`
  - source sheet, import path, and packet-level dry-run flow

Tests already covering this path:

- `tests/production-pilot-event-proof.test.ts`
- `tests/production-invite-gate.test.ts`
- `tests/admin-integration-outbox-workspace.test.ts`

## Which Evidence Must Eventually Be Real

These rows and files must eventually come from real launch evidence, not local
rehearsal or planning:

- `rollout-csv/pilot-event-proof.csv`
- `production-rollout-packet.json`
- real audit log readback tied to the pilot action
- real outbox readback tied to the pilot action
- real reviewer identity and timestamp
- real signed-in route proof after production users and app rows exist
- real live data count proof after the approved packet is applied

Luma or other read-only sources can support event mapping and event facts, but
they do not replace the app, audit, or outbox evidence.

## What Must Not Count

Do not count any of these as audit/outbox zero-send proof:

- Test rows
- sandbox rows
- Figma rows
- preview or staging evidence
- SOP or sample content
- screenshots without a real underlying row
- local-only rehearsal notes
- provider exports by themselves
- rows with missing reviewer or timestamp
- rows with live-send posture still enabled

## Exact Later Command Sequence

Run these only after the approved packet inputs, real pilot evidence, and
reviewer sheet exist.

1. Convert the reviewed pilot sheet into the packet-ready proof file:

```bash
pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv
```

2. Recheck the CSV folder and rebuild the packet:

```bash
pnpm rollout:check-csv --dir rollout-csv
pnpm rollout:build --chapters rollout-csv/chapters.csv --users rollout-csv/users.csv --memberships rollout-csv/memberships.csv --staff-roles rollout-csv/staff-roles.csv --coach-assignments rollout-csv/coach-assignments.csv --campaigns rollout-csv/campaigns.csv --luma-calendars rollout-csv/luma-calendars.csv --pilot-event-proof rollout-csv/pilot-event-proof.csv --launch-owners rollout-csv/launch-owners.csv --signed-in-route-proof rollout-csv/signed-in-route-proof.csv --out production-rollout-packet.json
pnpm rollout:check production-rollout-packet.json
```

3. Run the focused pilot proof check:

```bash
pnpm production:pilot-event-proof --packet production-rollout-packet.json
```

4. After production users and rows exist, add the real signed-in route proof and
   live data count proof:

```bash
pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv
pnpm production:data-counts > production-live-data-counts.txt
```

5. Only after the packet, pilot proof, signed-in proof, and live counts exist,
   run the final read-only invite gate:

```bash
pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --out production-invite-gate.md
```

## Operator Bottom Line

Audit/outbox zero-send proof is not a separate optional attachment. It is part
of what makes a pilot chapter count as ready.

The chapter should not count if the team cannot show:

- recorded audit evidence
- zero-send outbox posture
- valid reviewer identity
- valid timestamp
- route-backed app proof
