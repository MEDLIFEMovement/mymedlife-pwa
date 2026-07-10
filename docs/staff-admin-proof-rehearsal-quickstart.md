# Staff/Admin TEST Rehearsal Quickstart

Use this when you want the shortest path to the staff/admin rehearsal chain.
It is a TEST-only helper for the rehearsal packet, not production evidence.

## Run this first

```bash
pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv
```

## You need these inputs

- `tests/fixtures/staff-admin-proof-rehearsal.test.csv`
- the exported-note build step from the same rehearsal packet
- the on-disk reviewer note and manifest created by the chain command

## Expected PASS lines

- `PASS TEST rehearsal rows mapped cleanly.`
- `Staff/Admin TEST rehearsal artifact round-trip checked: PASS`

## Common failure cases

- `FAIL TEST rehearsal rows still have a boundary issue.` means the CSV rows do not map cleanly to the TEST rehearsal boundary yet.
- `Staff/Admin TEST rehearsal artifact round-trip checked: FAIL` means the reviewer note and manifest no longer match on disk.
- A missing `reviewNoteFixturePath=tests/fixtures/staff-admin-proof-rehearsal-review-note.test.md` line means the reviewer-note path drifted.
- A missing `routeTargets=/staff?view=chapters,/admin,/app` line means the route boundary is no longer pinned to the rehearsal packet.
- Any mention of production proof means the packet drifted out of TEST-only territory.

## Boundary reminder

- TEST-only rehearsal output
- blocked from production proof
- do not use this quickstart as live production evidence
- keep the negative member row visible
