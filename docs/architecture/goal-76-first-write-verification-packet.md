# Goal 76: First-Write Verification Packet

## Purpose

Goal 76 turns the first-write drill into an operator-ready verification packet.

Goal 74 created the local action-start drill. Goal 75 added readback evidence.
Goal 76 combines those pieces into a plain-English packet that tells staff:

- which local env settings must be active
- which fake seed user signs in
- which route sequence to run
- what proof should be visible afterward
- when to stop the drill
- whether the result is strong enough to discuss staging review

## What It Adds

- `FirstWriteVerificationPacket`
- packet status states:
  - `blocked`
  - `ready_to_run_locally`
  - `needs_manual_audit_check`
  - `evidence_observed`
- env-setting guidance for the narrow action-start drill
- fake local member credential display
- operator sequence and expected proof
- stop conditions for unsafe drift
- tests for blocked, ready, audit-needed, and evidence-observed packet states

## Safety Rules

- This does not enable production auth.
- This does not enable writes by default.
- This does not add a new write path.
- This does not approve staging or production launch.
- This does not enable proof uploads, public proof sharing, or external sends.
- All HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI writes remain
  disabled unless Nick/team explicitly approve a future goal.

## Why This Matters

The first local write should be easy to run, but hard to misinterpret. The
packet keeps the staff review focused on one fake member starting one Rush Month
assignment, then proving assignment, event, integration event, audit log, and
zero-send readback before any staging discussion.
