# Production Rollout Owner Confirmation Package

This is the operator package for the named rollout owners who must confirm
support, rollback, and production-apply responsibility before the final invite
gate can be run honestly.

It is read-only. Codex does not send the confirmations, create users, write
production data, query production counts, or approve launch.

## Current State

- owner packets: 7/7 sent
- returned owner CSVs: 0/7 returned
- validated owner CSVs: 0/7 validated
- support owner: missing
- rollback owner: missing
- production-apply owner: missing
- launch decision owner: missing unless already modeled elsewhere
- final invite gate: not ready

## Required Owner Roles

### Support owner

Plain-English job:

- answers launch-day support questions
- coordinates first-response help when something looks off
- keeps the support lane visible during pilot and rollout

What confirms it:

- a named person in the rollout owner records
- an active `support` row in the launch-owners evidence
- a current handoff note or tracker entry that points to that person

### Rollback owner

Plain-English job:

- decides how to back out a bad launch step if something goes wrong
- keeps the rollback plan readable before invites or apply steps
- owns the stop-and-recover posture

What confirms it:

- a named person in the rollout owner records
- an active `rollback` row in the launch-owners evidence
- a current handoff note or tracker entry that points to that person

### Production-apply owner

Plain-English job:

- approves the actual production apply step
- signs off before production data is written
- keeps the launch evidence tied to a human decision

What confirms it:

- a named person in the rollout owner records
- an active `production_apply` row in the launch-owners evidence
- a current handoff note or tracker entry that points to that person

### Launch decision owner

Plain-English job:

- makes the final launch decision if the matrix or gate needs one named owner
- serves as the explicit sign-off contact when the invite gate is reviewed

What confirms it:

- a named person in the rollout owner records or invite-gate docs
- a clear reviewer or decision-owner entry in the launch evidence

## Draft-Only Manual Confirmation Copy

Use this text only as a manual draft. Codex should not send it.

> Hi team,
>
> We are still preparing the myMEDLIFE rollout evidence package. Before the
> final invite gate can open, we need the named owners for support, rollback,
> and production apply confirmed in the rollout records.
>
> Please confirm the following:
>
> - support owner
> - rollback owner
> - production-apply owner
> - launch decision owner, if that role is already being used
>
> For each role, please provide the named owner and confirm that the role is
> active for the launch lane. This is for review only and does not trigger
> invites, user creation, or production writes.
>
> Thank you.

## What Evidence Counts

Use one or more of these as confirmation evidence:

- the named owner appears in `launch-owners.csv` with the correct owner type
- the owner is listed in the current-status report as active or pending
- the owner appears in the owner handoff tracker or follow-up report
- the owner is referenced in the final invite-gate dependency map
- the owner is referenced in the current-state dashboard or missing-evidence report

The key requirement is that a human owner is named and visible in the rollout
evidence, not just implied by a planning note.

## What Cannot Count

- placeholder names
- Test/Figma/sample data
- unconfirmed CCs
- stale planning docs
- unsigned assumptions
- draft-only comments that were never promoted into the rollout evidence
- screenshots without the matching owner record
- any row that is not clearly marked active or confirmed

## What Must Not Happen

- No sends by Codex
- No invites
- No production users
- No production writes
- No provider access
- No live counts
- No packet build from incomplete returns
- No owner CSV edits here
- No returned-folder edits here

## How This Ties Into The Final Invite Gate

The final invite gate uses the owner confirmation as part of the evidence path
for the human handoff.

If the support, rollback, or production-apply owner is missing, the gate should
stay blocked even if the app is deployed and the docs are complete.

The owner confirmation package does not replace:

- returned owner CSV intake
- shared rollout CSV assembly
- production rollout packet build
- live production counts
- signed-in production proof
- five-chapter pilot proof
- audit/outbox zero-send proof

## Next Safe Step After Confirmations Arrive

Once the named owners are confirmed and Coordinator approves the update, record
the confirmation in the appropriate owner CSV or tracker artifact, then rerun:

```bash
pnpm rollout:current-status
pnpm rollout:current-status --owner-send-tracker production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv
pnpm rollout:current-status --recipient-assignments production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-recipient-assignments.csv --owner-send-tracker production-rollout-owner-handoff/production-rollout-owner-send-tracker/owner-send-tracker.csv
pnpm rollout:gaps production-rollout-packet.json --out production-rollout-gaps.md
```

If the owner confirmations change the missing-evidence picture, rerun the gap
report with the validated packet later on.

## Operator Bottom Line

The final invite gate is still blocked until the named owners are confirmed and
the downstream rollout evidence is real.
