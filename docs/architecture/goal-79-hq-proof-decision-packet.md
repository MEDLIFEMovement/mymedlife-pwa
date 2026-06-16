# Goal 79: HQ Proof Decision Packet

## Purpose

Goal 79 adds `/admin/hq-proof-write`, a staff-only operator packet for the
third local Rush Month write: `hq_sharing_decision_logged`.

This packet exists so HQ can review the prerequisites, route sequence, stop
conditions, and readback evidence before anyone tests the local HQ
proof-sharing decision form.

## What It Adds

- `getHqProofDecisionPacket(...)` in
  `src/services/hq-proof-decision-verification-packet.ts`
- `HqProofDecisionVerificationPanel` in
  `src/components/hq-proof-decision-verification-panel.tsx`
- `/admin/hq-proof-write`
- route metadata, route registry, role navigation, smoke manifest, stakeholder
  review path, and write-sequence updates
- unit tests for blocked, ready, observed, audit-warning, and role-visibility
  states

## Safety Boundary

The packet does not:

- enable production Supabase
- create real users
- upload proof files
- publish proof publicly
- export proof to a warehouse
- generate AI summaries
- trigger n8n, HubSpot, Luma, Power BI, SMS, or email writes

The page is a read-only safety surface. The only browser write it prepares is
the existing localhost-only HQ decision path on `/rush-month/review`, and that
path still requires explicit local env flags plus a fake Admin or Super Admin
Supabase Auth session.

## Required Order

1. Prove action-start readback on `/admin/first-write`.
2. Prove proof/testimonial metadata readback on `/admin/proof-write`.
3. Open `/admin/hq-proof-write`.
4. Sign in locally as `admin@mymedlife.test`.
5. Record one HQ proof-sharing decision on `/rush-month/review`.
6. Return to `/admin/hq-proof-write` and confirm readback evidence.

## Readback Evidence

The packet expects:

- proof status changed to `approved` or `changes_requested`
- internal event row records `hq_sharing_decision_logged`
- integration event records future automation intent
- automation outbox row exists with `disabled` status
- audit log records the guarded HQ decision

Approval rows are written by the database function, but the packet intentionally
uses the existing read-only app snapshot: proof status, event, integration
event, disabled outbox, and audit log. That keeps the review surface simple and
aligned with the current app data model.

## Roles

- Admin can read the packet and is the default fake local operator.
- Super Admin can read and operate the packet locally.
- DS Admin can read the safety posture but does not own proof decisions.
- Members, leaders, and coaches cannot read this packet.

## Next Step

After this packet is reviewed, the next safe MVP slice is a leader-assignment
or coach-decision operator packet only after the HQ decision readback evidence
is proven.
