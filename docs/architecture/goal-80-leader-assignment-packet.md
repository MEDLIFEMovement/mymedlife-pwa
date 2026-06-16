# Goal 80: Leader Assignment Packet

## Purpose

Goal 80 adds `/admin/assignment-write`, a staff-only operator packet for the
fourth local Rush Month write: `action_assigned`.

This packet prepares a controlled localhost-only test where a fake chapter
leader creates one new assignment without sending reminders or external
automation.

## What It Adds

- `getLeaderAssignmentPacket(...)` in
  `src/services/leader-assignment-verification-packet.ts`
- `LeaderAssignmentVerificationPanel` in
  `src/components/leader-assignment-verification-panel.tsx`
- `/admin/assignment-write`
- route metadata, route registry, role navigation, smoke manifest, stakeholder
  review path, and write-sequence updates
- unit tests for blocked, ready, duplicate-title, observed, audit-warning, and
  role-visibility states

## Safety Boundary

The packet does not:

- enable production Supabase
- create real users
- approve membership or roles
- send reminder emails or SMS
- create HubSpot handoffs
- create Luma writes
- run n8n workflows
- trigger warehouse, Power BI, or AI writes

The page is a read-only safety surface. The actual assignment-create write
still lives on `/rush-month/actions` and requires localhost Supabase, fake
local auth, UUID-backed chapter/campaign rows, no duplicate assignment title,
and explicit local env flags.

## Required Order

1. Prove action-start readback on `/admin/first-write`.
2. Prove proof/testimonial metadata readback on `/admin/proof-write`.
3. Prove HQ proof decision readback on `/admin/hq-proof-write`.
4. Open `/admin/assignment-write`.
5. Sign in locally as `leader.a@mymedlife.test`.
6. Create one assignment on `/rush-month/actions`.
7. Return to `/admin/assignment-write` and confirm readback evidence.

## Readback Evidence

The packet expects:

- new assignment row exists
- internal event row records `action_assigned`
- integration event records future reminder/handoff intent
- automation outbox row exists with `disabled` status
- audit log records the guarded leader assignment creation

## Roles

- Admin can read the packet.
- Super Admin can read the packet.
- DS Admin can read the safety posture but does not own assignment truth.
- Chapter leaders use the operating route when the packet allows local testing,
  but they do not read the HQ safety packet directly.
- Members and coaches cannot read this packet.

## Next Step

After this packet is reviewed, the next safe MVP slice is the coach-decision
operator packet for `coach_decision_logged`.
