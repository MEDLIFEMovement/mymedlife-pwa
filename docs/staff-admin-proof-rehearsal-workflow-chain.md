# Staff/Admin TEST Rehearsal Workflow Chain

This is the top-level reviewer/operator map for the Staff/Admin TEST rehearsal
support lane. It ties together the help alias, quickstart, ops note, chain
command, and the read-only verifier without widening into production proof.

## Recommended order

1. Read the help alias:
   - `pnpm staff-admin-proof-rehearsal:help`
2. Use the quickstart when you want the shortest operator path:
   - `pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv`
3. Refer to the ops note when you need the TEST-only boundary and PASS text.
4. Run the chain command directly if you want the build + verify step in one go.
5. Run the workflow verifier when you want to check the docs stay aligned:
   - `pnpm staff-admin-proof-rehearsal:workflow-verify`

## What this chain covers

- exported note build
- manifest generation
- reviewer-note round trip on disk
- checksum and route-target linkage
- explicit TEST-only boundary wording

## What this chain does not cover

- production proof
- live UI shell behavior
- leader, staff/admin, or rollout edits
- any evidence that can be mistaken for production truth

## Expected PASS text

- `PASS TEST rehearsal rows mapped cleanly.`
- `Staff/Admin TEST rehearsal artifact round-trip checked: PASS`

## Inputs

- `tests/fixtures/staff-admin-proof-rehearsal.test.csv`
- the exported-note build step from the same rehearsal packet
- the reviewer note and manifest emitted by the chain command

## Boundary reminder

- TEST-only rehearsal output
- blocked from production proof
- keep the negative member row visible
