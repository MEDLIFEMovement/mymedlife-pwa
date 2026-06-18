# Goal 160: Membership Approval Packet

## Purpose

Goal 160 extends `/chapter/members` with a mock-safe membership approval packet.
The MVP needs leaders and HQ reviewers to see how a future join request approval
would work before production auth, RLS, audit readback, welcome messages, CRM
syncs, or external automation are approved.

## What It Adds

- `membershipApprovalPacket` on `getChapterMembershipWorkspace(actor, data)`
- future function name: `app.approve_chapter_membership`
- join-request payload preview for the first visible request
- current result: `membership_writes_disabled`
- future result: `membership_approved`
- readiness checks for reviewer access, live-auth dependency, disabled writes,
  and disabled external sends
- future records for the membership row, structured event, disabled outbox, and
  audit action
- review prompts for chapter fit, requested role, profile mapping, and audit
  readback
- locked controls for approval, membership-row creation, role assignment,
  welcome messages, and CRM sync

## Role Boundary

Chapter leaders, Admin, and Super Admin can inspect the packet. Coaches can
read roster health but do not receive a membership approval packet. General
members and DS Admin remain outside chapter membership truth.

## Safety Boundary

This goal does not enable:

- production auth
- join request approval writes
- membership-row writes
- chapter role assignment
- committee lane changes
- member deactivation
- welcome emails or SMS
- HubSpot, n8n, warehouse, Power BI, Luma, or AI writes

The packet is review evidence only. A later approved write goal must add the
server action/RPC, RLS tests, audit readback, rollback path, and localhost-only
activation controls before any membership write is tested.

Goal 161 adds the result-state family for this packet so reviewers can inspect
the future success, disabled, validation, auth, permission, welcome-disabled,
CRM-disabled, duplicate, and error states before any write is enabled.

Goal 162 adds the write-readiness packet for this future approval path. It names
the still-missing SQL/RLS implementation, required tests, write-plan entry,
browser-write gate, and disabled welcome/CRM posture before any approval control
can open.

## Review Path

1. Open `/chapter/members` as `leader.a@mymedlife.test`,
   `admin@mymedlife.test`, or `super.admin@mymedlife.test`.
2. Confirm the packet shows `app.approve_chapter_membership`,
   `membership_writes_disabled`, and the future `membership_approved` result.
3. Confirm the payload references the join request, applicant email, requested
   role, committee lane, chapter, and approving actor.
4. Confirm future records include `membership_approved`, disabled outbox, and
   audit action.
5. Confirm Goal 162 shows the SQL function and RLS tests are still blocked.
6. Keep membership writes blocked until production auth, RLS, audit readback,
   rollback, and external-send boundaries are approved.
