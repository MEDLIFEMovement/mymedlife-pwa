# Hosted Staging Pilot Evidence

Date: 2026-06-20
Host: `https://staging.mymedlife.org`
Reviewer lane: Admin signed in as `admin@mymedlife.test` unless noted otherwise

## Why this note exists

This note captures what is true on the hosted staging build right now, separate
from newer local review-packet work that may still be waiting on merge or
deployment. It is meant to help Nick, Kiomi, DS, and launch reviewers see which
parts of the Phase 2 pilot-readiness gate are already visible on staging and
which parts still need explicit approval or fresher hosted evidence.

## What was confirmed on hosted staging

### 1. Staff dry run is live on staging

Route: `/admin/staff-dry-run`

Observed on hosted staging:
- route loads for the signed-in admin session
- `8` steps are listed
- `24` checks are listed
- expected browser writes remain `0`
- expected external sends remain `0`

Current hosted limitation:
- this hosted route still shows older copy, including language that says the
  rehearsal happens "before staging"
- the newer structured review-note template from PR `#121` is not yet visible
  on the hosted domain

### 2. Pilot scope guidance is live on staging

Route: `/admin/pilot-scope`

Observed on hosted staging:
- recommended first real pilot is `one chapter` or `one internal staff-plus-chapter rehearsal group`
- recommended live scope is Rush Month only
- expected first pilot size is `1 chapter, 5-15 student users, 1 coach, 1 HQ owner`
- recommended first live write is `action_started`
- event attendance and NPS are recommended as `manual first`
- external writes are explicitly kept disabled
- `browser writes = 0`
- `external sends = 0`

Named decision owners visible on staging:
- `Nick/team` for the first pilot group
- `Kiomi` for the first write path
- `HQ ops` for manual versus Luma/NPS import
- `HQ ops` for proof consent and sharing rules
- `Coach lead` for named support ownership
- `Data Solutions` for keeping external writes disabled

### 3. First-write drill is live on staging but still blocked

Route: `/admin/first-write`

Observed on hosted staging:
- `8` checks are listed
- `4` checks are ready
- `2` readback items are already visible
- expected browser writes remain `0`
- expected external sends remain `0`
- candidate action is `Invite three students to Rush Month`
- candidate assignment uses a Supabase UUID

Current hosted blockers shown on staging:
- `Local Supabase Auth mode is selected` is still blocked
- local write master switch is still blocked
- action-start write switch is still blocked
- readback for internal event and integration event rows is still missing
- audit log proof still requires a manual check

Current hosted interpretation:
- staging already supports review of the narrow first-write lane
- staging does not yet prove that the first hosted write is approved to run

### 4. Leader membership workspace keeps approval writes locked

Route: `/chapter/members`
Role context observed: `leader.a@mymedlife.test`

Observed on hosted staging:
- join requests visible: `0`
- thin roles visible: `4`
- enabled controls visible: `0`
- membership approvals, role changes, committee moves, and deactivation remain
  disabled
- future welcome messages and HubSpot updates are explicitly disabled
- audit and integration events are described as future internal records that
  should happen before any external automation

Current hosted interpretation:
- role-aware review is working
- permission-changing chapter writes remain correctly locked

## What is still missing before we can honestly say staging is ready for a controlled live MVP pilot

### 1. Staff dry-run evidence packet on the hosted build

Still needed:
- reviewer names
- review date
- exact build used
- what passed
- what felt confusing

Reason:
- the hosted route is live, but the clearer PR `#121` note template is not yet
  deployed on the staging domain

### 2. Device and accessibility proof tied to the hosted build

Still needed:
- phone result
- tablet result
- desktop result
- offline or PWA recovery result
- keyboard-only result
- screen-reader or label-audit result

Reason:
- the hosted route plan exists in the codebase, but this evidence is not yet
  recorded from the staging build itself

### 3. Exact pilot group and named day-one owners

Still needed:
- chapter or internal cohort name
- chapter leader owner
- coach owner
- HQ/admin owner
- DS owner
- pause or support channel

Reason:
- staging shows the recommended scope, but not the final named pilot decision

### 4. First hosted write approval and rollback ownership

Still needed:
- explicit approval that `action_started` is the first hosted write lane
- named rollback owner
- named disable-write owner
- hosted audit and readback proof expectations

Reason:
- staging shows the right narrow write candidate, but still presents it as
  blocked

### 5. Explicit DS sign-off on the integration hold

Still needed:
- confirmation that HubSpot, Luma writes, n8n, warehouse, Power BI, SMS,
  email, and AI remain off for the first pilot
- any approved read-only exception, if one exists
- replay or escalation owner for future outbox review

Reason:
- staging already states that external writes stay disabled, but the launch
  packet still needs a named owner sign-off

## Bottom line

Hosted staging already proves the conservative pilot posture:
- role-aware read-only review works
- pilot scope is intentionally small
- `action_started` is the narrow first-write candidate
- membership and external writes remain locked

Hosted staging does not yet prove pilot readiness end to end because:
- the current domain is still missing the newest review-note packet
- device and accessibility evidence is still missing
- named pilot owners are still missing
- the first hosted write is still blocked on staging

As of 2026-06-20, the honest status is:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`
