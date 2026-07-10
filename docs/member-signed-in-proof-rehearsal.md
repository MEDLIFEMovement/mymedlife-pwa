# Member Signed-In Proof Rehearsal

This is a TEST-only rehearsal packet for the signed-in member proof path.

It is useful for local and staging preparation only. It does **not** count as production signed-in proof.

## Exact member route sequence

1. `/login?redirectTo=/app`
2. `/app`
3. `/app/events`
4. `/app/events/[eventId]`
5. `/app/points`
6. `/profile`
7. back into the same member loop

## What the rehearsal should preserve

- visible `TEST` labels on any sandbox-facing content
- mobile member shell continuity
- bottom-nav continuity across the member loop
- exact return-path trust for the member loop

## What cannot count as production proof

- preview-cookie sessions
- local sandbox or localhost sessions
- Test/Figma rows or screenshots
- SOP/sample or staging evidence
- missing-profile/setup-only sessions
- fake screenshots or copied sandbox artifacts

## Read-only proof commands

- `pnpm production:signed-in-route-proof-readiness --out /tmp/production-signed-in-route-proof-readiness.md`
- `pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json`
- `pnpm production:signed-in-route-proof:check`

## Next step

When real production evidence exists, build the production packet separately and keep this TEST-only rehearsal packet out of the rollout CSVs.
