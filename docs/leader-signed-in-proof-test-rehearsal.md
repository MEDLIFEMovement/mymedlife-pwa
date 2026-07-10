# Leader Signed-In Proof TEST Rehearsal

This file is for local or staging rehearsal only.

Do not copy any row from this file into:
- `signed-in-route-proof.csv`
- `production-rollout-packet.json`
- `production-live-data-counts.txt`
- `production-invite-gate.md`

`TEST`, staging, local, preview, and screenshot-only evidence do **not** count as approved production signed-in proof.

## Purpose

Use this packet to rehearse the Leader signed-in proof flow without confusing it with real rollout evidence.

The real production Leader proof sequence is:
1. Start from a clean signed-out browser session.
2. Open `https://www.mymedlife.org/login`.
3. Sign in as a real approved production Leader account.
4. Confirm workspace `leader_command_center`.
5. Confirm expected route `/leader?view=overview`.
6. Record `email`, `workspace`, `observedPath`, `status`, `checkedAt`, and `notes`.

## TEST rehearsal source rows

Reviewer source CSV schema:

```csv
email,workspace,observedPath,status,checkedAt,notes
test.leader.chapter@example.test,leader,/leader?view=overview,passed,2026-07-10T12:00:00Z,TEST approved leader rehearsal row only
test.member.only@example.test,leader,/app,failed,2026-07-10T12:05:00Z,TEST unauthorized member-only negative row
```

Expected packet-ready mapping:
- `leader` maps to `leader_command_center`
- expected path is `/leader?view=overview`

## Scratch-only validation path

Use the existing readiness and drift checks to rehearse the packet shape:

```bash
node scripts/check-production-signed-in-route-proof-readiness.mjs --out /tmp/leader-proof-readiness.md
node scripts/check-production-signed-in-route-proof-drift.mjs
node scripts/check-role-access-invariants.mjs --out /tmp/leader-role-auth
```

If you want to rehearse the import shape locally, use a scratch CSV only:

```bash
pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.test.csv --out-dir /tmp/leader-proof-rehearsal
```

That rehearsal import is useful for operator practice only. The production importer must still reject `TEST` rehearsal rows as production proof.

## Negative cases that must stay negative

- member-only user must not satisfy Leader proof
- staff or coach user must not satisfy Leader proof
- DS or admin user must not satisfy Leader proof
- missing profile must not satisfy Leader proof
- missing approved membership must not satisfy Leader proof
- missing qualifying Leader role must not satisfy Leader proof

## Production boundary reminder

Real production proof still requires:
- real production Auth user
- real production profile row
- approved launch-chapter membership row
- qualifying Leader role row
- non-header `signed-in-route-proof.csv`
- approved `production-rollout-packet.json`
- approved `production-live-data-counts.txt`
- reviewer-owned hosted browser proof
