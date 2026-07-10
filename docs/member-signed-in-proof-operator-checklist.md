# Member Signed-In Proof Operator Checklist

This is a TEST-only operator checklist for preparing signed-in proof on the member mobile loop.

It does **not** create production proof, and it does **not** replace the real production evidence packet.

## Exact member route sequence

1. `/login?redirectTo=/app`
2. `/app`
3. `/app/events`
4. `/app/events/[eventId]`
5. `/app/points`
6. `/profile`
7. back into the same member loop

## What is locally or staging provable now

- route continuity through the member shell
- visible `TEST` labels on sandbox-facing content
- read-only navigation and return-path behavior
- rehearsal docs and proof commands

## What blocks real production proof

- no approved production rollout packet
- no real production live-data counts
- no real production route evidence rows for member, leader, staff/support, and DS/admin
- no imported `signed-in-route-proof.csv` from real production evidence

## Evidence collection order

1. Keep rehearsal evidence separate from production evidence.
2. Rehearse the member route path locally or in staging only.
3. Collect real production proof rows only after the rollout packet and live counts exist.
4. Import real rows into `signed-in-route-proof.csv` only from production evidence.

## Read-only commands

- `pnpm production:signed-in-route-proof-readiness --out /tmp/production-signed-in-route-proof-readiness.md`
- `pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json`
- `pnpm production:signed-in-route-proof:check`

## Rehearsal evidence row shape

Use this structure for local or staging rehearsal notes, but do not copy it into the production proof CSV:

```text
label,route,status,checkedAt,notes
TEST member app,/app,passed,2026-07-10T00:00:00Z,Rehearsal only
TEST events,/app/events,passed,2026-07-10T00:01:00Z,Rehearsal only
TEST event detail,/app/events/[eventId],passed,2026-07-10T00:02:00Z,Rehearsal only
TEST points,/app/points,passed,2026-07-10T00:03:00Z,Rehearsal only
TEST profile,/profile,passed,2026-07-10T00:04:00Z,Rehearsal only
```

## Notes

- Visible fake or sandbox-facing content must keep `TEST`.
- Preview-cookie, localhost, local sandbox, staging, Figma, and missing-profile evidence do not count as production proof.
- Production proof only begins when the real packet, counts, and real route rows exist.
