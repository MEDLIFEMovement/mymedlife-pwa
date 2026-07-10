# Leader Signed-In Proof TEST Rehearsal

This packet is a no-write operator rehearsal for Leader signed-in proof. It is
only for local or staging practice with TEST users and must not be copied into
production `signed-in-route-proof.csv`, a rollout packet, or the invite gate.

## Boundary

- Use only TEST/local/staging accounts.
- Do not create production users.
- Do not send invites.
- Do not write production Supabase rows.
- Do not use provider calls.
- Do not count preview-cookie, local actor, staging, TEST, Figma, or sample
  evidence as production proof.

## Reviewer Source CSV

The import command expects reviewer source columns:

```csv
email,workspace,observedPath,status,checkedAt,notes
test.leader.chapter@example.test,leader,/leader?view=overview,passed,2026-07-10T15:00:00Z,TEST staging rehearsal only; approved TEST Leader with action_committee_chair role; reviewer fills real staging timestamp; does not count as production proof
test.member.only@example.test,leader,/app,failed,2026-07-10T15:05:00Z,TEST staging negative only; member-only account must not satisfy Leader proof; does not count as production proof
```

The first row rehearses the approved Leader pass. The second row rehearses an
unauthorized role failing Leader proof while recording the observed non-Leader
route for diagnosis.

## Packet-Ready Mapping

If these rows were production evidence, the importer would normalize the Leader
workspace to `leader_command_center` and fill the expected path:

```csv
email,workspace,expectedPath,observedPath,status,checkedAt,notes
test.leader.chapter@example.test,leader_command_center,/leader?view=overview,/leader?view=overview,passed,2026-07-10T15:00:00Z,TEST staging rehearsal only; approved TEST Leader with action_committee_chair role; reviewer fills real staging timestamp; does not count as production proof
test.member.only@example.test,leader_command_center,/leader?view=overview,/app,failed,2026-07-10T15:05:00Z,TEST staging negative only; member-only account must not satisfy Leader proof; does not count as production proof
```

This mapped output is still TEST-only and must be rejected for production proof.

## Validation Path

Use the existing proof tooling to rehearse schema shape and guardrails:

```bash
pnpm production:signed-in-route-proof-readiness --out /tmp/leader-proof-readiness.md
pnpm production:signed-in-route-proof:check
pnpm auth:role-access-invariants --out /tmp/leader-role-auth
pnpm vitest tests/production-signed-in-route-proof-import.test.ts tests/leader-signed-in-proof-test-rehearsal-doc.test.ts
```

If an operator imports a rehearsal CSV locally, write it only to a scratch
directory such as `/tmp/leader-proof-rehearsal-rollout-csv`. Do not replace the
real production rollout CSV folder.

## Production Promotion Checklist

Before any row can become production evidence, replace the TEST rehearsal rows
with reviewer-owned hosted production browser evidence:

- real production Auth user
- production profile row
- approved launch-chapter membership row
- qualifying Leader role: `action_committee_chair`, `e_board_member`, or
  `president_vp`
- observed hosted route from `https://www.mymedlife.org/login`
- reviewer name or initials in notes
- real `checkedAt` timestamp from the hosted browser check

