# Audit / Outbox Zero-Send Evidence Checklist

This checklist helps a non-technical operator prove that pilot activity was
recorded, reviewed, and kept free of unapproved external sends.

Use it for the five pilot chapters before the broader invite gate opens.

## What The Operator Must Be Able To Answer

For each pilot chapter or pilot event row, answer all of these in plain English:

1. Which app action happened?
2. Which user or role did it?
3. Which chapter or event did it belong to?
4. Was it recorded in audit or readback evidence?
5. Did it produce an outbox event?
6. If it did, was the outbox row held, blocked, or mock-safe rather than sent
   externally?
7. Who reviewed it?
8. When was it reviewed?

## Evidence Sources

### App / Readback

Use the app and read-only review surfaces for:

- action name
- user or role
- chapter id
- event id
- route evidence
- points readback
- RSVP or attendance readback

### Audit Log

Use the audit log for:

- actor identity
- target table or record
- before/after summary
- reason or note
- timestamp

### Integration Outbox

Use the integration outbox for:

- whether an outbox event exists
- whether the row is disabled, mock-safe, blocked, or live-send related
- whether the row was approved, sent, failed, or dead-lettered
- destination name
- any blocked live-send controls that still need approval

### Luma Or Other Read-Only Source

Use read-only event sources only for:

- chapter to event mapping
- event id
- event name
- event URL
- RSVP count
- attendance or check-in count

## What Counts As Good Evidence

For a pilot row to count, the reviewer should be able to point to:

- one real app action
- one real actor
- one real chapter or event
- one audit or readback record
- one outbox posture record
- one reviewer name or email
- one checked-at timestamp

## What Should Not Count

Do not count any of these as audit/outbox proof by themselves:

- a screenshot with no record behind it
- a row that only looks correct in a Test or sandbox environment
- a Luma event without app or audit evidence
- a row with a live external send still enabled
- a row with missing reviewer or timestamp
- a row with a placeholder actor, chapter, or event id

## What Zero-Send Means

Zero-send means the chapter or event was reviewed in a posture where:

- no unapproved external send was allowed
- any outbox row stayed disabled, mock-safe, blocked, or otherwise held
- the reviewer can explain why nothing was sent

Zero-send does not mean “nothing happened.” It means the app activity was
recorded and reviewed without turning into an unapproved external send.

## Suggested Operator Flow

1. Start with the pilot chapter source sheet.
2. Confirm the chapter and event mapping.
3. Check the audit row or audit readback for the action.
4. Check the integration outbox posture for the same action.
5. Confirm the outbox row stayed blocked, disabled, or mock-safe if it exists.
6. Record the reviewer and timestamp.
7. Mark the row ready only if all required fields are present.

## Relation To The Pilot Proof Packet

This checklist feeds the `pilot-event-proof.csv` evidence used by:

- `pnpm rollout:pilot-proof-import --proof pilot-event-proof-source.csv --out-dir rollout-csv`
- `pnpm production:pilot-event-proof --packet production-rollout-packet.json`

It also supports the final invite gate, which still remains blocked until the
broader packet, live counts, signed-in proof, and human approval are ready.
