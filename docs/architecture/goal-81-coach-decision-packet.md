# Goal 81: Coach Decision Packet

## Purpose

Goal 81 adds `/admin/coach-write`, a staff-only operator packet for the fifth
local Rush Month write: `coach_decision_logged`.

This packet prepares a controlled localhost-only test where a fake coach records
one advance / hold / intervene decision after the prior action-start, proof
metadata, HQ proof decision, and leader assignment readbacks have been proven.

## What It Adds

- `getCoachDecisionPacket(...)` in
  `src/services/coach-decision-verification-packet.ts`
- `CoachDecisionVerificationPanel` in
  `src/components/coach-decision-verification-panel.tsx`
- `/admin/coach-write`
- route metadata, route registry, role navigation, smoke manifest, stakeholder
  review path, write-sequence updates, MVP progress/readiness updates
- unit tests for blocked, ready, observed, audit-warning, and role-visibility
  states

## Safety Boundary

The packet does not:

- enable production Supabase
- create real users
- change coach portfolio assignments
- send n8n escalation packets
- create HubSpot notes
- send reminder emails or SMS
- create Luma writes
- trigger warehouse, Power BI, or AI writes

The page is a read-only safety surface. The actual coach decision write still
lives on `/coach` and requires localhost Supabase, fake local auth, UUID-backed
chapter/campaign/phase rows, explicit local env flags, and disabled escalation
automation.

## Required Order

1. Prove action-start readback on `/admin/first-write`.
2. Prove proof/testimonial metadata readback on `/admin/proof-write`.
3. Prove HQ proof decision readback on `/admin/hq-proof-write`.
4. Prove leader assignment readback on `/admin/assignment-write`.
5. Open `/admin/coach-write`.
6. Sign in locally as `coach@mymedlife.test`.
7. Record one coach decision on `/coach`.
8. Return to `/admin/coach-write` and confirm readback evidence.

## Readback Evidence

The packet expects:

- phase readiness review row exists
- internal event row records `coach_decision_logged`
- integration event records future escalation packet intent
- automation outbox row exists with `disabled` status
- audit log records the guarded coach decision

## Roles

- Admin can read the packet.
- Super Admin can read the packet.
- DS Admin can read the safety posture but does not own coach decision truth.
- Coaches use `/coach` when the packet allows local testing, but they do not
  read the HQ safety packet directly.
- Members and chapter leaders cannot read this packet.

## Next Step

After this packet is reviewed, the team can decide whether to run the full local
five-write dry run before approving any staging auth or first production write
path.
