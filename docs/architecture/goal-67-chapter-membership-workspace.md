# Goal 67: Chapter Membership Workspace

## Purpose

Goal 67 adds a read-only chapter membership and role-management workspace. The
final MVP requires leaders to manage members and admins to understand users,
roles, chapters, and membership posture. This goal makes that surface visible
without enabling sensitive membership or role writes.

## What It Adds

- `/chapter/members`
- `getChapterMembershipWorkspace(actor, data)`
- chapter roster follow-up cards
- join-request visibility for leaders/admins/super admins
- role coverage checks for:
  - General Member
  - Action Committee Member
  - Action Committee Chair
  - E-Board Member
  - President / VP
- disabled future controls for:
  - approving join requests
  - assigning chapter roles
  - moving committee lanes
  - deactivating members
- audit and outbox previews for future automation readiness

Goal 160 extends this same route with a membership approval packet. The packet
previews `app.approve_chapter_membership`, the join-request payload, readiness
checks, future membership row, structured event, disabled outbox, audit action,
review prompts, and locked controls before any join approval is enabled.
Goal 161 adds the matching membership approval result states so the same route
can show the current disabled result and future enabled result before any write
control exists.

## Role Rules

- Chapter leaders can read roster health, join requests, role coverage, and
  disabled controls for their chapter.
- Coaches can read roster health and role coverage, but do not own membership
  approval.
- Admin and Super Admin can inspect support posture.
- General members do not see leader member-management queues.
- DS Admin does not read or own chapter membership truth.

## Safety Rules

- No production auth is enabled.
- No production Supabase project is connected.
- No membership approval write is enabled.
- No role approval write is enabled.
- No committee lane write is enabled.
- No member deactivation write is enabled.
- Future events are named, but external automations remain disabled.

## Why This Matters

This closes a visible MVP gap without weakening the security model. Leaders can
now understand who needs follow-up and where role coverage is thin, while the
actual permission-changing actions remain blocked until the auth/RLS/admin
mutation path is explicitly approved.

Goal 160 narrows the next review step: reviewers can now inspect the first
future approval packet directly on `/chapter/members` without creating a
membership row, assigning a role, sending a welcome message, or syncing CRM.
