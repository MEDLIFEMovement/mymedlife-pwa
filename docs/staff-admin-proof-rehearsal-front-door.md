# Staff/Admin TEST Rehearsal Front Door

This is the single operator entrypoint for the Staff/Admin TEST rehearsal
support family. It is read-only, TEST-only, and blocked from production proof.

## Start here

```bash
pnpm staff-admin-proof-rehearsal:front-door
```

## What it points to

1. `pnpm staff-admin-proof-rehearsal:help`
2. `pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv`
3. `pnpm staff-admin-proof-rehearsal:workflow-verify`

## Operator path

- Use the help alias when you want the shortest command lookup.
- Use the chain command when you want the exported note, manifest, and round-trip verifier in one go.
- Use the workflow verifier when you want to confirm the docs still match the chain.
- Use the ops note and quickstart as the boundary and failure-case reference.

## Expected PASS text

- `PASS TEST rehearsal rows mapped cleanly.`
- `Staff/Admin TEST rehearsal artifact round-trip checked: PASS`
- `Staff/Admin TEST rehearsal workflow-chain verifier: PASS`

## Boundary reminder

- TEST-only rehearsal output
- blocked from production proof
- do not use this front door as live production evidence
- keep the negative member row visible
