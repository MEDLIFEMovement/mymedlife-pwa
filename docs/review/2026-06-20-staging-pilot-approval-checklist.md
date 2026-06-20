# Staging Pilot Approval Checklist

Date: 2026-06-20
Primary build under review: `https://staging.mymedlife.org`
Companion evidence note: `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`
Final approval packet: `docs/review/2026-06-20-staging-pilot-final-approval-packet.md`

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

## Fastest reply format

If the reviewers want the shortest possible path, they can reply to the latest
email, PR comment, or Linear thread by copying this block and filling only the
blank values:

```text
Platform/build:
- approved build:
- signed-in reviewer session is the intended staging path: yes/no
- alias re-point needed: yes/no
- alias owner:

Staff dry run:
- reviewer names:
- what passed:
- what felt confusing:
- follow-up before pilot:

Device/accessibility:
- phone:
- tablet:
- desktop:
- offline or PWA:
- keyboard:
- screen reader or label audit:
- blocking issue:

Pilot scope:
- chapter or cohort:
- launch window:
- max students:
- chapter leader owner:
- coach owner:
- HQ/admin owner:
- DS owner:
- pause/support channel:
- pause-message approver:

First hosted write:
- approved first write lane:
- rollback owner:
- disable-write owner:
- audit/readback proof required:
- approver after drill:

Integration hold:
- HubSpot off:
- Luma writes off:
- n8n off:
- warehouse/Power BI off:
- SMS/email off:
- AI actions off:
- read-only exception:
- escalation owner:
```

## Approval worksheet

### 1. Platform or app owner

Decision needed:
- Should `staging.mymedlife.org` stay on the current preview deployment, or be
  re-pointed to the newer review-packet branch before final sign-off?
- Is the intended reviewer path a signed-in browser session on the staging
  domain, or should clean-session access work first?

Record:
- owner:
- decision date:
- branch or deployment approved:
- reviewer access path approved:
- if re-point needed, who will do it:

Approval standard:
- the staging domain must point at the review packet the team believes it is
  approving

### 2. Staff dry run

Route:
- `/admin/staff-dry-run`

Evidence already recorded:
- reviewer lane: Codex route-level hosted review
- review date: `2026-06-20`
- build used: `https://staging.mymedlife.org`
- what passed:
  - route loads on hosted staging
  - `8` steps visible
  - `24` checks visible
  - `0` browser writes
  - `0` external sends
  - `9` local write rehearsal packets visible
- what felt confusing:
  - packet still says `before staging`
  - route mixes walkthrough steps with local write-rehearsal status
  - `Local Supabase Auth mode is selected` still reads like a local-only note

Use this as a starting point if the human reviewers agree with it, or replace it
with the final staff-run notes from the reviewer pass.

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

Evidence already recorded:
- desktop Safari on hosted staging loads `/admin/design-qa` and `/offline`
- signed-in Safari narrow-window smoke exists at:
  - phone-like width: `430px`
  - tablet-like width: `940px`
- `/offline` still shows:
  - the `You are offline` heading
  - the short recovery explanation
  - all three return actions
  - the disabled-offline limitations note
- current hosted keyboard concern:
  - first `Tab` appears to move to the hidden
    `vercel.live/_next-live/feedback/feedback.html` iframe
  - that iframe is visible in the Safari accessibility tree as a second hosted
    scroll area

Still missing from the evidence packet:
- real phone check
- real tablet check
- installed-PWA check
- full keyboard-only signoff
- full screen-reader or label-audit signoff

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
