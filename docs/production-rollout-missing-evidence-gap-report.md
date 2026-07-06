# Production Rollout Missing-Evidence Gap Report

This is the rerunnable operator checklist for the myMEDLIFE rollout evidence
lane.

It is read-only. It does not send email, create users, write production data,
query production counts, apply returned owner files, or approve launch.

## Current Blocker Summary

- owner packets: 7/7 sent
- returned owner CSVs: 0/7 returned
- validated owner CSVs: 0/7 validated
- shared rollout CSV assembly: not started
- production rollout packet: missing
- production live-data counts: missing
- signed-in production proof: missing
- five-chapter pilot proof: missing
- audit/outbox zero-send proof: missing
- support / rollback / production-apply owners: missing
- final invite gate output: missing

## Missing-Evidence Checklist

### 1. Returned owner CSVs and validated owner folders

- Required evidence: returned folders under `returned-owner-packets/<owner-slug>/`
  that match the canonical handoff thread `19f36afa1eb273a4`
- What counts:
  - real returned owner CSV folders
  - dry-run intake that says the returned files are tied to the approved handoff
  - validated owner folders after Coordinator-approved apply
- What does not count:
  - sent-only packets
  - draft sheets
  - partial folders
  - Test/Figma/sample rows
  - files from the wrong owner slug

### 2. Shared rollout CSV assembly

- Required evidence: a complete `rollout-csv/` folder with approved data rows
  for chapters, users, memberships, staff roles, coach assignments, campaigns,
  Luma calendars, pilot proof, launch owners, and signed-in route proof
- What counts:
  - validated assembled CSVs with real rollout rows
  - a clean `pnpm rollout:check-csv --dir rollout-csv`
- What does not count:
  - header-only folders
  - sample templates
  - partial CSV sets
  - local rehearsal exports

### 3. Production rollout packet

- Required evidence: `production-rollout-packet.json`
- What counts:
  - packet build from the validated shared CSV folder
  - `pnpm rollout:check production-rollout-packet.json` passing
- What does not count:
  - packet-shaped docs
  - template files
  - incomplete CSV inputs
  - screenshots of packet contents

### 4. Live production counts

- Required evidence: `production-live-data-counts.txt`
- What counts:
  - real count output from the approved production data path after apply
- What does not count:
  - external exports
  - warehouse-only aggregates
  - snapshots
  - local mock counts

### 5. Signed-in member / leader / staff / admin proof

- Required evidence: real production rows for member, leader, staff, and admin
- What counts:
  - `signed-in-route-proof.csv` rows that land on the expected production
    routes
  - the required account classes for `/app`, `/leader?view=overview`,
    `/staff?view=chapters`, and `/admin`
- What does not count:
  - local/Test/Figma/sandbox proof
  - preview cookies
  - screenshots alone
  - missing-profile setup rows

### 6. Five-chapter pilot event proof

- Required evidence: five real pilot chapters with RSVP, attendance, points,
  audit, and zero-send evidence
- What counts:
  - `pilot-event-proof.csv` rows with real chapter coverage
  - recorded audit evidence
  - zero-send outbox posture
  - reviewer identity and timestamp
- What does not count:
  - one-chapter checks
  - Luma-only evidence
  - screenshots alone
  - SOP/sample content

### 7. Audit / outbox zero-send proof

- Required evidence: audit readback plus zero-send outbox readback for the
  pilot rows
- What counts:
  - recorded audit evidence
  - `outboxStatus=zero_sends`
  - valid reviewer email
  - valid `checkedAt`
- What does not count:
  - provider exports by themselves
  - local rehearsal notes
  - rows with live-send posture enabled
  - sample rows

### 8. Support / rollback / production-apply owners

- Required evidence: named launch owners with current handoff records
- What counts:
  - active support owner
  - active rollback owner
  - active production-apply owner
- What does not count:
  - placeholder names
  - inferred ownership
  - stale owner maps

### 9. Final invite gate output

- Required evidence: `production-invite-gate.md`
- What counts:
  - the final read-only gate report after every upstream dependency exists
- What does not count:
  - deploy success
  - CI success
  - any single provider export
  - any single proof class by itself

## What Must Stay Excluded

- Test rows
- Figma rows
- sandbox rows
- SOP/sample/template content
- staging rows
- provider exports alone
- screenshots without real account/data evidence
- local rehearsal notes
- preview-cookie proof
- any row with live-send posture still enabled

## What To Rerun After Owner Returns Arrive

1. Save returned files under `returned-owner-packets/<owner-slug>/`.
2. Run the owner-return intake dry run only.
3. Review the dry-run report before any apply step.
4. After Coordinator approval, run `--apply`.
5. Rerun current status so the operator sees which downstream evidence is still
   absent.

The current-status command is the best read-only summary once the owner returns
land:

```bash
pnpm rollout:current-status \
  --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets \
  --recipient-assignments .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv \
  --owner-send-tracker .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv \
  --csv-dir rollout-csv \
  --packet production-rollout-packet.json \
  --live-data-counts production-live-data-counts.txt \
  --out production-rollout-current-status.md
```

## Operator Bottom Line

This report is the missing-evidence checklist, not the evidence itself.

Nothing in the matrix should move until the returned owner CSVs are real, the
shared CSVs are assembled, the packet exists, the live counts exist, the
production signed-in proof exists, the five-chapter pilot proof exists, the
audit/outbox zero-send proof exists, and the final invite gate passes.

