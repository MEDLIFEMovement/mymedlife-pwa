# Staff/Admin TEST Rehearsal Ops Note

This is a reviewer/operator note for the Staff/Admin TEST rehearsal artifact pipeline.
It is intentionally read-only, TEST-only, and blocked from production proof.

## One-line operator workflow

```bash
pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv
```

## Expected PASS text

- `PASS TEST rehearsal rows mapped cleanly.`
- `Staff/Admin TEST rehearsal artifact round-trip checked: PASS`

## Boundary reminder

- TEST-only rehearsal output
- blocked from production proof
- reviewer note, manifest, and checksum must stay aligned on disk
- do not use this note as production evidence
