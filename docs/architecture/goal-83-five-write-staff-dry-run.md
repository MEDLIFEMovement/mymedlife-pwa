# Goal 83: Five-Write Staff Dry-Run Rehearsal

## Purpose

Goal 83 makes `/admin/staff-dry-run` a more useful rehearsal surface for HQ
reviewers. The current page now shows seven guarded write packets in one place
so staff can rehearse the Rush Month operating loop plus membership approval
readiness without turning on production auth, uploads, or external automation.

## What It Adds

- A seven-write rehearsal section on `/admin/staff-dry-run`
- Runtime packet status mirrored from the existing write-sequence planner
- Packet links for:
  - action-start packet
  - proof metadata packet
  - leader proof decision packet
  - HQ proof decision packet
  - leader assignment packet
  - coach decision packet
  - membership approval readiness packet
- Operating-route links, fake local actor emails, packet decisions, readback
  counts, staging posture, rehearsal actions, and stop conditions
- Tests proving the staff dry run includes all seven packets and keeps external
  sends at zero

## Safety Boundary

This goal does not:

- enable production auth
- enable browser write controls
- run the local write drill
- upload proof files
- publish proof publicly
- invite pilot students
- send HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The staff dry-run page can show local browser write candidates, but the dry run
itself still expects `0` actual writes and `0` external sends.

## How Staff Should Use It

Reviewers should open `/admin/staff-dry-run`, follow the fake local actor email
for each packet, then open the packet and operating route listed on each card.
The packet decision and stop condition explain whether a local write can be
tested, what evidence should be collected, and when the reviewer must stop.

This is rehearsal evidence only. It does not approve staging, live users,
student pilots, production writes, proof publishing, or external integrations.

## Next Step

The next useful slice is to run the staff dry run in a browser, collect any
missing review notes, then decide whether the first staging/auth/write approval
plan is ready for Nick, Kiomi, and Renato to review.
