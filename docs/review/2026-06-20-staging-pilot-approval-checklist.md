# Staging Pilot Approval Checklist

Date: 2026-06-20
Primary build under review: `https://staging.mymedlife.org`
Companion evidence note: `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`

## Why this note exists

This is the shortest path from "the MVP looks good" to "we are actually ready
for a tiny live pilot." It turns the remaining staging decisions into one
approval worksheet so Nick, Kiomi, DS, and launch reviewers can answer the real
go or no-go questions without hunting across multiple routes.

This note does not approve a broad launch. It is only for the first controlled
one-chapter live MVP pilot.

## Target statement

We can say the app is ready for a controlled one-chapter live MVP pilot only
when all of the following are true:

- the hosted staging build is the intended review packet
- the staff dry run is completed and recorded
- phone, tablet, desktop, offline/PWA, and accessibility checks are recorded
- the exact pilot cohort and day-one owners are named
- the first hosted write lane is approved with rollback ownership
- all other writes and external systems remain off unless separately approved

## Review order

1. Confirm the staging build being reviewed.
2. Review `/admin/staff-dry-run`.
3. Review `/admin/design-qa` and `/offline`.
4. Review `/admin/pilot-scope`.
5. Review `/admin/first-write`.
6. Review `/admin/integration-outbox`.
7. Record the decisions below in one place.

## Approval worksheet

### 1. Platform or app owner

Decision needed:
- Should `staging.mymedlife.org` stay on the current preview deployment, or be
  re-pointed to the newer review-packet branch before final sign-off?

Record:
- owner:
- decision date:
- branch or deployment approved:
- if re-point needed, who will do it:

Approval standard:
- the staging domain must point at the review packet the team believes it is
  approving

### 2. Staff dry run

Route:
- `/admin/staff-dry-run`

Record:
- reviewer names:
- review date:
- build used:
- what passed:
- what felt confusing:
- follow-up needed before pilot:

Approval standard:
- the team can walk the staff rehearsal in order and understands where pilot
  boundaries still hold

### 3. Device, offline, and accessibility checks

Routes:
- `/admin/design-qa`
- `/offline`

Record:
- phone result:
- tablet result:
- desktop result:
- offline or installed-PWA result:
- keyboard-only result:
- screen-reader or label-audit result:
- release-blocking issue found:

Approval standard:
- the staging build is usable on the pilot devices and any accessibility issue
  is either fixed or explicitly judged non-blocking for the tiny pilot

### 4. Nick and HQ pilot scope decision

Route:
- `/admin/pilot-scope`

Record:
- exact pilot chapter or internal cohort:
- launch window:
- maximum student count:
- chapter leader owner:
- coach owner:
- HQ/admin owner:
- DS owner:
- pause or support channel:
- who approves student-facing pause or correction messages:

Approval standard:
- the first pilot is intentionally small, named, and owned by real people

### 5. Kiomi or launch approver first-write decision

Route:
- `/admin/first-write`

Recommended first hosted write:
- `action_started`

Record:
- approved first hosted write lane:
- rollback owner:
- disable-write owner:
- required audit/readback proof before a second write opens:
- who signs off after the drill:

Approval standard:
- only one narrow write lane is approved first, and the team knows exactly who
  can stop it or roll it back

### 6. DS integration hold decision

Route:
- `/admin/integration-outbox`

Record:
- HubSpot writes off: yes or no
- Luma writes off: yes or no
- n8n writes off: yes or no
- warehouse or Power BI writes off: yes or no
- SMS or email sends off: yes or no
- AI actions off: yes or no
- any approved read-only exception:
- outbox or integration escalation owner:

Approval standard:
- the first pilot keeps the app and Supabase as source of truth and does not
  silently turn on downstream systems

## Recommended default pilot posture

Unless a reviewer explicitly approves something broader, the safe default is:

- one chapter only
- Rush Month only
- 5-15 students
- 1 chapter leader owner
- 1 coach owner
- 1 HQ/admin owner
- 1 DS owner
- manual-first event attendance and NPS
- first hosted write limited to `action_started`
- proof uploads, proof sharing, membership approvals, role changes, and all
  external sends remain off

## Exit checklist

Mark the pilot as ready only if every item below is true:

- staging domain is pointing at the intended review packet
- staff dry run is completed on the hosted build
- phone, tablet, desktop, offline/PWA, and accessibility evidence is recorded
- pilot chapter or cohort and all day-one owners are named
- `action_started` or another single narrow lane is explicitly approved as the
  first hosted write
- rollback owner and disable-write owner are named
- audit and readback proof for that lane is defined before the drill
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI remain off unless
  separately approved

## Honest status wording

Use this wording if some items above are still open:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`

Use this wording only after the full worksheet is complete:

`ready for a controlled one-chapter live MVP pilot`
