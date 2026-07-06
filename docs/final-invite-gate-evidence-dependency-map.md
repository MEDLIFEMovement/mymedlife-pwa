# Final Invite Gate Evidence Dependency Map

This is the operator map for the last myMEDLIFE rollout gate.

It shows what must exist, in what order, before the final invite gate can be
run honestly. It is read-only. It does not create users, send invites, write
production data, query production Supabase, or approve launch.

## Current Blocker Summary

- owner packets: 7/7 sent
- returned owner CSVs: 0/7 returned
- validated owner CSVs: 0/7 validated
- production rollout packet: missing
- production live-data counts: missing
- signed-in production proof: missing
- five-chapter pilot proof: missing
- final invite gate: not ready

## Evidence Order

### 1. Returned owner CSVs

- Owning lane: owner-return monitor and rollout evidence builder
- Source of truth: canonical owner handoff thread `19f36afa1eb273a4`
- What can be prepared now: owner request docs, owner email drafts, tracker,
  follow-up report, current-status report
- What still requires real evidence: returned folders under
  `returned-owner-packets/<owner-slug>/`
- What must not count: sent-only packets, drafts, placeholder rows, or any
  folder that has not been returned by an owner

### 2. Approved rollout packet

- Owning lane: rollout packet assembly
- Source of truth: validated shared CSV folder and packet build
- What can be prepared now: CSV templates, workbook, intake status, chapter
  matrix, gap report, apply plan
- What still requires real evidence: `production-rollout-packet.json`
- What must not count: header-only CSVs, sample rows, Test/Figma rows, or
  partial packet folders

### 3. Five-chapter pilot proof

- Owning lane: pilot proof and audit/outbox readiness
- Source of truth: `pilot-event-proof.csv`
- What can be prepared now: the checklist, operator runbook, Luma request
  template, audit/outbox proof readiness map
- What still requires real evidence: five ready rows with RSVP, attendance,
  points, audit, zero-send, reviewer, and timestamp
- What must not count: one-chapter checks, screenshots alone, Luma-only
  evidence, or sample/SOP rows

### 4. Live production data counts

- Owning lane: live data proof
- Source of truth: `production-live-data-counts.txt`
- What can be prepared now: the live-data proof request and count readiness
  docs
- What still requires real evidence: count output from the approved production
  data path
- What must not count: external exports, snapshots, or warehouse-only
  aggregates

### 5. Signed-in production proof

- Owning lane: signed-in proof
- Source of truth: `signed-in-route-proof.csv`
- What can be prepared now: the preflight guide, gaps report, drift check, and
  import path
- What still requires real evidence: one passed row each for member, leader,
  staff, and admin, plus the pilot-chapter route coverage required by the gate
- What must not count: local/Test/Figma/sandbox proof, preview cookies,
  screenshots alone, or missing-profile sessions

### 6. Audit / outbox zero-send proof

- Owning lane: audit/outbox readiness
- Source of truth: audit log and integration outbox readback tied to the pilot
  rows
- What can be prepared now: the audit/outbox checklist and proof-readiness map
- What still requires real evidence: recorded audit evidence, zero-send outbox
  posture, reviewer identity, and checked-at timestamp for each pilot row
- What must not count: sample rows, local rehearsal notes, provider exports by
  themselves, or live-send-enabled rows

### 7. Final invite gate

- Owning lane: invite-gate review
- Source of truth: `production:invite-gate`
- What can be prepared now: route smoke, packet validation, and all upstream
  readiness docs
- What still requires real evidence: every upstream dependency above
- What must not count: deploy success, CI success, or any single provider
  export used as proof by itself

## What Each Lane Owns

- Owner-return lane: collect and validate returned owner CSVs
- Rollout packet lane: assemble the 30-chapter packet and apply plan
- Luma lane: map calendars and support pilot event proof
- Pilot proof lane: prove RSVP, attendance, points, audit, and zero-send
- Live-count lane: capture production counts after approved apply
- Signed-in proof lane: prove member, leader, staff, and admin routing
- Audit/outbox lane: prove the event loop stayed recorded and zero-send safe
- Invite-gate lane: combine all upstream evidence into the final approval check

## Exact Later Commands

Run these only when the needed inputs exist.

### After returned owner CSVs arrive

```bash
pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets --out production-rollout-owner-return-intake.md
pnpm rollout:owner-return-intake --returns-dir returned-owner-packets --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets --out production-rollout-owner-return-intake.md --apply
pnpm rollout:current-status --owner-dir .codex-artifacts/production-rollout-owner-handoff/rollout-owner-packets --recipient-assignments .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv --owner-send-tracker .codex-artifacts/production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv --out production-rollout-current-status.md
```

### After the packet is assembled

```bash
pnpm rollout:check-csv --dir rollout-csv
pnpm rollout:build --chapters rollout-csv/chapters.csv --users rollout-csv/users.csv --memberships rollout-csv/memberships.csv --staff-roles rollout-csv/staff-roles.csv --coach-assignments rollout-csv/coach-assignments.csv --campaigns rollout-csv/campaigns.csv --luma-calendars rollout-csv/luma-calendars.csv --pilot-event-proof rollout-csv/pilot-event-proof.csv --launch-owners rollout-csv/launch-owners.csv --signed-in-route-proof rollout-csv/signed-in-route-proof.csv --out production-rollout-packet.json
pnpm rollout:check production-rollout-packet.json
```

### After pilot proof exists

```bash
pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv
pnpm production:pilot-event-proof --packet production-rollout-packet.json
```

### After production data is applied

```bash
pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv
pnpm production:data-counts > production-live-data-counts.txt
pnpm production:signed-in-route-proof --packet production-rollout-packet.json
```

### Final gate

```bash
pnpm production:invite-gate --packet production-rollout-packet.json --live-data-counts production-live-data-counts.txt --out production-invite-gate.md
```

## What Must Not Count

- Test rows
- Figma rows
- sandbox rows
- SOP/sample rows
- staging rows
- screenshots alone
- provider exports alone
- local rehearsal notes
- preview-cookie proof
- any row with live-send posture still enabled

## Operator Bottom Line

The final invite gate can only run after the owner returns, packet, pilot
proof, live counts, signed-in proof, and audit/outbox zero-send evidence are
all real.

Until then, the honest answer remains:

`not ready for final invite gate`
