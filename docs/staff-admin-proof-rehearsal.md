# Staff/Admin Signed-In Proof TEST Rehearsal

This packet is a no-write operator rehearsal for Staff/Admin signed-in proof.
It is only for local or staging practice with TEST users and must not be copied
into production `signed-in-route-proof.csv`, a rollout packet, or any proof
gate.

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
test.staff.support@example.test,staff,/staff?view=chapters,passed,2026-07-10T16:00:00Z,TEST staging rehearsal only; approved staff/support coach with chapters read posture; reviewer fills real staging timestamp; does not count as production proof
test.ds.admin@example.test,admin,/admin,passed,2026-07-10T16:01:00Z,TEST staging rehearsal only; approved DS Admin with admin backend read posture; reviewer fills real staging timestamp; does not count as production proof
test.super.admin@example.test,admin,/admin,passed,2026-07-10T16:02:00Z,TEST staging rehearsal only; approved Super Admin with admin backend read posture; reviewer fills real staging timestamp; does not count as production proof
test.member.only@example.test,staff,/app,failed,2026-07-10T16:03:00Z,TEST staging negative only; member-only account must not satisfy Staff/Admin proof; does not count as production proof
```

The first three rows rehearse the approved staff/support, DS Admin, and Super
Admin pass cases. The last row rehearses an unauthorized member account failing
Staff/Admin proof while recording the observed member route for diagnosis.

## Packet-Ready Mapping

If these rows were production evidence, the importer would normalize the
workspaces to their route-backed destinations:

```csv
email,workspace,expectedPath,observedPath,status,checkedAt,notes
test.staff.support@example.test,staff_command_center,/staff?view=chapters,/staff?view=chapters,passed,2026-07-10T16:00:00Z,TEST staging rehearsal only; approved staff/support coach with chapters read posture; reviewer fills real staging timestamp; does not count as production proof
test.ds.admin@example.test,admin_backend,/admin,/admin,passed,2026-07-10T16:01:00Z,TEST staging rehearsal only; approved DS Admin with admin backend read posture; reviewer fills real staging timestamp; does not count as production proof
test.super.admin@example.test,admin_backend,/admin,/admin,passed,2026-07-10T16:02:00Z,TEST staging rehearsal only; approved Super Admin with admin backend read posture; reviewer fills real staging timestamp; does not count as production proof
test.member.only@example.test,staff_command_center,/staff?view=chapters,/app,failed,2026-07-10T16:03:00Z,TEST staging negative only; member-only account must not satisfy Staff/Admin proof; does not count as production proof
```

This mapped output is still TEST-only and must be rejected for production
proof.

## Validation Path

Use the existing proof tooling to rehearse schema shape and guardrails:

```bash
pnpm production:signed-in-route-proof-readiness --out /tmp/staff-admin-proof-rehearsal-readiness.md
pnpm production:signed-in-route-proof:check
pnpm auth:role-access-invariants --out /tmp/staff-admin-role-auth
pnpm staff-admin-proof-rehearsal --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv --out /tmp/staff-admin-proof-rehearsal.md --review-note-out /tmp/staff-admin-proof-rehearsal-review-note.md
pnpm vitest run tests/production-signed-in-route-proof-import.test.ts tests/staff-admin-proof-rehearsal.test.ts tests/staff-admin-proof-rehearsal-review-note.test.ts tests/figma-sandbox-signed-in-role-proof.test.ts tests/role-visibility.test.ts tests/staff-command-center.test.ts tests/admin-management.test.ts
```

If an operator imports a rehearsal CSV locally, write it only to a scratch
directory such as `/tmp/staff-admin-proof-rehearsal-rollout-csv`. Do not replace
the real production rollout CSV folder.

## Production Promotion Checklist

Before any row can become production evidence, replace the TEST rehearsal rows
with reviewer-owned hosted production browser evidence:

- real production Auth user
- production profile row
- approved staff or admin membership row
- qualifying staff/support, DS Admin, or Super Admin role
- observed hosted route from `https://www.mymedlife.org/login`
- reviewer name or initials in notes
- real `checkedAt` timestamp from the hosted browser check
