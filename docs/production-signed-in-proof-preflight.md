# Production Signed-In Proof Preflight

This is a read-only operator index for the signed-in proof lane.

Use it when you need to answer one question honestly:

`Are we only rehearsing with local/Test data, or are we actually ready to collect real production signed-in proof?`

## Rule Zero

Local, sandbox, Test, Figma, SOP/sample, preview-cookie, staging, and copied
screenshot evidence do **not** count as production signed-in proof.

Do not copy local artifacts into:

- `signed-in-route-proof.csv`
- the production rollout packet
- the invite gate

## The Four Real Production Proof Classes

When real production proof collection begins, the required account classes are:

- member -> `/app`
- leader -> `/leader?view=overview`
- staff/support -> `/staff?view=chapters`
- DS/admin -> `/admin`

These are separate proof classes. A broader staff/admin reviewer account does
not replace member or leader proof.

## Use The Right Command

### 1. Local rehearsal only

Use this when reviewers are working with sandbox/Test actors:

```bash
pnpm figma-seed:proof-separation
```

This compares local sandbox role QA against the current production proof gap
state and repeats that sandbox/Test evidence is excluded from production proof.

### 2. Production proof readiness checklist

Use this before any real production proof rows exist:

```bash
pnpm production:signed-in-route-proof-readiness --out production-signed-in-route-proof-readiness.md
```

This is the safest plain-English starting point for operators. It lists:

- the four required production proof classes
- the exact routes each must land on
- what cannot count as proof
- the later import/check sequence
- the blockers that still remain when the rollout packet or live counts are missing

### 3. Role access invariant map

Use this when a reviewer is unsure whether a role combination should own a
route or only preview it:

```bash
pnpm auth:role-access-invariants --out .codex-artifacts/auth
```

This is read-only. It explains owner versus preview access for the four proof
classes and selected mixed-role actors.

### 4. Proof gap readout

Use this after a real production rollout packet exists:

```bash
pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json
```

This marks each proof class as present, missing, wrong path, unsafe source, or
not enough evidence.

### 5. Route drift check

Use this before or during proof collection if you need to confirm the expected
routes still match current launch-lane metadata:

```bash
pnpm production:signed-in-route-proof:check
```

This does not inspect production accounts or packet rows. It only checks route
expectations and blocked source markers.

### 6. Import real proof rows

Use this only after real production route evidence exists:

```bash
pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv
```

This writes local `signed-in-route-proof.csv` only. It refuses local/Test/Figma,
preview, staging, SOP/sample, and missing-profile evidence markers.

## Recommended Safe Order

If you are still in rehearsal:

1. `pnpm figma-seed:proof-separation`
2. `pnpm auth:role-access-invariants`

If you are preparing for real production proof but do not yet have production
rows:

1. `pnpm production:signed-in-route-proof-readiness --out production-signed-in-route-proof-readiness.md`
2. `pnpm production:signed-in-route-proof:check`

If you have real production proof rows and a real packet:

1. `pnpm rollout:signed-in-proof-import --proof signed-in-route-proof-source.csv --out-dir rollout-csv`
2. rebuild `production-rollout-packet.json`
3. `pnpm production:signed-in-route-proof-gaps --packet production-rollout-packet.json`
4. `pnpm production:signed-in-route-proof --packet production-rollout-packet.json`

## Still Blocked Until Real Production Evidence Exists

Production signed-in proof is still not complete until all of these exist:

- an approved production rollout packet
- real production user/profile/role rows
- real production route evidence for member, leader, staff/support, and DS/admin
- production live data counts
- final invite-gate review

If any of those are missing, the honest answer is still:

`production signed-in proof is not ready yet`
