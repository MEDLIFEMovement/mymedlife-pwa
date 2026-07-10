# Staff/Admin TEST Rehearsal Support Packet Proposal

This packet is a support-only proposal for the Staff/Admin TEST rehearsal
workflow family. It is read-only, TEST-only, and blocked from production proof.

## Exact file set

The narrow support packet stays centered on these files:

- `docs/staff-admin-proof-rehearsal-workflow-chain.md`
- `docs/staff-admin-proof-rehearsal-quickstart.md`
- `docs/staff-admin-proof-rehearsal-ops-note.md`
- `docs/staff-admin-proof-rehearsal-front-door.md`
- `scripts/help-staff-admin-proof-rehearsal-chain.mjs`
- `scripts/run-staff-admin-proof-rehearsal-chain.mjs`
- `scripts/check-staff-admin-proof-rehearsal.mjs`
- `scripts/verify-staff-admin-proof-rehearsal-artifacts.mjs`
- `scripts/verify-staff-admin-proof-rehearsal-workflow-chain.mjs`
- `scripts/staff-admin-proof-rehearsal-front-door.mjs`
- the focused tests that lock those surfaces together

## Acceptance criteria

The support packet is acceptable when all of the following hold:

1. The reviewer/operator can discover the workflow from the front door without stitching the pieces together by hand.
2. The chain command runs the TEST rehearsal snapshot build and the round-trip verifier in one read-only step.
3. The quickstart shows the exact inputs, expected PASS text, and the most common failure cases.
4. The ops note keeps the TEST-only boundary explicit.
5. The workflow verifier confirms the docs still match the chain command and boundary wording.
6. Every surface keeps the packet clearly blocked from production proof.

## Out of scope

- production proof
- UI/product changes
- leader, staff/admin, or rollout behavior
- any evidence that could be mistaken for live production truth

## Promote vs park

Promote if the queue wants a low-risk support-only packet that makes the rehearsal workflow easier to run correctly on the first try.

Park if the queue is prioritizing product behavior, because this packet does not move live application capability; it only hardens operator readiness and TEST-only clarity.

## Reviewer proof commands

```bash
pnpm staff-admin-proof-rehearsal:front-door
pnpm staff-admin-proof-rehearsal:help
pnpm staff-admin-proof-rehearsal:chain --csv tests/fixtures/staff-admin-proof-rehearsal.test.csv
pnpm staff-admin-proof-rehearsal:workflow-verify
```

## Expected PASS text

- `PASS TEST rehearsal rows mapped cleanly.`
- `Staff/Admin TEST rehearsal artifact round-trip checked: PASS`
- `Staff/Admin TEST rehearsal workflow-chain verifier: PASS`

## Boundary reminder

- TEST-only rehearsal output
- blocked from production proof
- do not use this packet as live production evidence
- keep the negative member row visible
