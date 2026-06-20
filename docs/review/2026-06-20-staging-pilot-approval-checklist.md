# Staging Pilot Approval Checklist

Date: 2026-06-20
Primary build under review: `https://staging.mymedlife.org`
Companion evidence note: `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`
Final approval packet: `docs/review/2026-06-20-staging-pilot-final-approval-packet.md`
Approval delta: `docs/review/2026-06-20-staging-pilot-approval-delta.md`

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

## Ten-minute reviewer scripts

Use these only to make review faster. They do not replace the final approval
decisions.

### `/admin/design-qa`

1. Confirm the top summary counts are visible without clipping.
2. Confirm the route still shows three sections:
   - phone-sized route smoke
   - keyboard and screen-reader smoke
   - device and PWA release smoke
3. Press `Tab` once and note whether focus lands inside the visible app or in
   the hidden Vercel feedback iframe.
4. Confirm the route still reads as a review packet, not as launch approval.
5. Record whether the keyboard issue feels like hosted-shell noise or a real
   pilot blocker.

### `/offline`

1. Confirm the `You are offline` heading is visible immediately.
2. Confirm all three return actions are visible:
   - `Home`
   - `Rush Month`
   - `Actions`
3. Confirm the bottom note still says offline mode does not submit, upload,
   update points, send nudges, or run external automation.
4. Press `Tab` once and note whether focus lands on a visible action or in the
   hidden Vercel feedback iframe.

### `/admin/pilot-scope`

1. Confirm the route still recommends one chapter and Rush Month only.
2. Treat `UCLA MEDLIFE` as a planning placeholder unless Nick or HQ says
   otherwise.
3. Decide whether `5-10` students is accepted as the tiny-pilot default or
   should be replaced.
4. Fill only the owner fields that are ready to be named now.

## Fastest reply format

If the reviewers want the shortest possible path, they can reply to the latest
email, PR comment, or Linear thread by copying this block and either:

- replying `approved as written`, or
- replacing only the fields they want to change

Default proposed answers from current evidence:

```text
Platform/build:
- approved build: staging.mymedlife.org should become the final signoff target; until alias alignment is fixed, use staging for Supabase-backed evidence and the PR preview for newest packet copy
- signed-in reviewer session is the intended staging path: yes
- alias re-point needed: pending platform/app-owner decision
- alias owner: pending platform/app owner
- role-switch expectation approved: sign out and sign back in for role changes

Staff dry run:
- reviewer names: pending human reviewer confirmation
- what passed: route loads; 8 steps; 24 checks; 0 writes; 0 sends; 9 rehearsal packets visible
- what felt confusing: before staging wording; walkthrough mixed with rehearsal status; Local Supabase Auth mode wording is too implementation-specific
- follow-up before pilot: confirm reviewer agrees with these notes and record any invitation blockers

Device/accessibility:
- phone: provisional pass from signed-in phone-like width evidence; real phone check still needed
- tablet: provisional pass from signed-in tablet-like width evidence; real tablet check still needed
- desktop: pass in hosted Safari
- offline or PWA: offline route passes; installed-PWA check still needed
- keyboard: open; likely hosted-shell issue tied to hidden Vercel iframe
- screen reader or label audit: still required
- blocking issue: human reviewer must decide whether the iframe focus issue is non-blocking for the tiny pilot

Pilot scope:
- chapter or cohort: proposed planning default = UCLA MEDLIFE; final chapter still pending Nick/HQ
- launch window: pending Nick/HQ
- max students: 5-10
- chapter leader owner: pending Nick/HQ
- coach owner: pending Nick/HQ
- HQ/admin owner: pending Nick/HQ
- DS owner: pending DS
- pause/support channel: pending HQ/admin
- pause-message approver: pending HQ/admin

First hosted write:
- approved first write lane: action_started
- rollback owner: pending platform/app owner
- disable-write owner: pending DS/platform owner
- audit/readback proof required: before/after route evidence; assignment status in_progress; one internal event row; one integration event row; one audit row; zero outbox sends; zero external writes
- approver after drill: pending Kiomi/launch approver

Integration hold:
- HubSpot off: yes
- Luma writes off: yes
- n8n off: yes
- warehouse/Power BI off: yes
- SMS/email off: yes
- AI actions off: yes
- read-only exception: none unless explicitly approved
- escalation owner: pending DS
```

## Approval worksheet

## Smallest remaining approval delta

If the reviewers agree with the recommended defaults, the only things still
needed are:

- final platform/app-owner decision on staging-target alignment
- one human accessibility confirmation pass
- named pilot owners and support path
- first hosted write approval ownership
- DS confirmation that downstream systems stay off

### 1. Platform or app owner

Decision needed:
- Should `staging.mymedlife.org` stay on the current preview deployment, or be
  re-pointed to the newer review-packet branch before final sign-off?
- Is the intended reviewer path a signed-in browser session on the staging
  domain, or should clean-session access work first?
- Is role-specific review expected to follow the signed-in auth identity for
  now, with full sign-out and sign-in used when a reviewer needs to switch
  roles?

Record:
- owner:
- decision date:
- branch or deployment approved:
- reviewer access path approved:
- role-switch expectation approved:
- if re-point needed, who will do it:

Approval standard:
- the staging domain must point at the review packet the team believes it is
  approving
- reviewers understand that the hosted auth session is what currently controls
  role-specific review on staging

Recommended default answer:
- final signoff target should become `staging.mymedlife.org`
- until alias alignment is fixed, use the split path already described in the
  final packet

What still requires human confirmation:
- platform/app owner must confirm whether alias re-point is required
- platform/app owner must confirm the reviewer access path is acceptable

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

Recommended default answer:
- conditional pass for tiny pilot review

What still requires human confirmation:
- human reviewer must confirm they agree with the current pass/confusion notes

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
- repo-side accessibility sanity check:
  - `src/components/app-shell.tsx` defines a skip link to `#main-content`
  - the same file defines the matching `id="main-content"` focus target
  - shared navigation uses explicit `aria-label` values
  - `src/app/offline/page.tsx` exposes semantic `main` and `h1` structure

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

Recommended default answer:
- desktop Safari: pass
- signed-in phone-like width: provisional pass
- signed-in tablet-like width: provisional pass
- offline route: pass
- keyboard: open, likely hosted-shell issue
- screen-reader or label audit: still required

What still requires human confirmation:
- one human keyboard pass
- one screen-reader or label-audit smoke pass
- explicit human judgment on the iframe focus issue

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

Recommended default answer:
- one chapter only
- Rush Month only
- `5-10` students
- proposed planning chapter: `UCLA MEDLIFE`
- all owner names remain pending by role until Nick/HQ and DS confirm them

Guardrail:
- `UCLA MEDLIFE` is a planning default only, because the hosted route still
  exposes the broader seeded `5-15` range and does not by itself approve the
  final pilot chapter

What still requires human confirmation:
- exact chapter or internal cohort
- launch window
- all day-one owners and support path

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

Recommended default answer:
- `action_started` first
- proof required before any second write:
  - before/after route evidence
  - assignment status `in_progress`
  - one internal event row
  - one integration event row
  - one audit log row
  - zero outbox sends
  - zero external writes

What still requires human confirmation:
- explicit approval of `action_started`
- rollback owner
- disable-write owner
- approver after drill

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

Recommended default answer:
- keep HubSpot, Luma writes, n8n, warehouse/Power BI, SMS/email, and AI off
- no read-only exception unless explicitly approved

What still requires human confirmation:
- DS sign-off
- escalation owner

## Recommended default pilot posture

Unless a reviewer explicitly approves something broader, the safe default is:

- one chapter only
- Rush Month only
- 5-10 students
- proposed planning chapter: `UCLA MEDLIFE`
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
