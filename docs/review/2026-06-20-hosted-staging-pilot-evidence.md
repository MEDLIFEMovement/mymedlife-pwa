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

Final approval packet:
- use `docs/review/2026-06-20-staging-pilot-final-approval-packet.md` as the
  single go or no-go packet for the first hosted write and one-chapter live MVP
  pilot decision

## What was confirmed on hosted staging

### 0. Deployment alignment explains the staging mismatch

Read-only source inspected: Vercel deployment overview for the active
`staging.mymedlife.org` alias

Observed in Vercel:
- custom domain `staging.mymedlife.org` is attached to a preview deployment
- deployment ID shown in Vercel: `9WJ1fTVa6`
- source branch shown in Vercel: `feat/MED-494-hosted-staging-read-write-proof`
- source commit shown in Vercel: `fc7afd6`
- deployment status is `Ready`

Interpretation:
- the staging domain is not currently serving the `MED-486` review-packet branch
- the mismatch between the latest local review packet work and the hosted staging
  UI is a deployment-alignment issue, not just reviewer confusion
- until the staging alias points at the newer review packet deployment, hosted
  reviewers will keep seeing the older admin packet language

### 0.5 Clean-session access currently lands on Vercel login

Read-only source inspected:
- one-off headless browser check against `https://staging.mymedlife.org/login`
- signed-in Safari session check on the same hosted staging domain

Observed:
- a clean browser session does not land on myMEDLIFE first
- it is redirected to a Vercel login URL before the app review route loads
- a normal signed-in Safari session **can** still open the hosted staging review
  routes directly

Interpretation:
- hosted staging is reviewable today for a reviewer who already has the needed
  browser session
- hosted staging is not yet a friction-free clean-session review path
- this matters for pilot review because phone, tablet, and accessibility proof
  should be tied to the same reviewer path the approvers will actually use

### 0.6 Hosted auth gate and reviewer identity are behaving as real session controls

Read-only source inspected:
- signed-in Safari session on `https://staging.mymedlife.org/login`
- hosted sign-out and invalid-email validation state after sign-out

Observed:
- the hosted login route shows a real staging sign-in gate rather than skipping
  directly into the app
- the signed-in Safari session showed an authenticated staging state for
  `admin@mymedlife.test`
- the visible sign-out control worked and returned the route to a signed-out
  state
- after sign-out, the route showed `No staging session yet`
- attempting to submit the form without a valid email showed inline validation:
  `Enter a valid email address.`

Interpretation:
- the hosted auth gate is real and visible on staging
- reviewer identity on staging follows the actual auth session, not just route
  navigation
- switching hosted role context for review should be treated as a full sign-out
  and sign-in step until the team approves a cleaner reviewer path

### 0.7 Signed-in staging review path is now re-proven end to end

Read-only source inspected:
- signed-in Safari session restored on `https://staging.mymedlife.org/login`
- hosted home route after sign-in
- hosted `/admin/staff-dry-run` route after sign-in

Observed:
- signing back in as `admin@mymedlife.test` returned the hosted session to the
  admin-facing home route on `https://staging.mymedlife.org/`
- the hosted home route shows:
  - `LOCAL SUPABASE REVIEW DATA`
  - `Reading hosted staging Supabase data for the signed-in session.`
  - actor `Ari Admin`
  - email `admin@mymedlife.test`
  - identity source `Local auth session`
  - auth session `signed_in`
  - the role-switcher note `Signed-in local auth user controls the current role.`
- the same signed-in session can directly open
  `https://staging.mymedlife.org/admin/staff-dry-run`
- the hosted dry-run route still shows:
  - `8` steps
  - `24` checks
  - `0` writes
  - `0` sends

Interpretation:
- the intended staging reviewer path does work once the reviewer is inside the
  hosted auth session
- staged review identity is visibly tied to the auth session, not to a route
  toggle or mock role switch
- the current blocker is not "can staging auth reach the review routes"; it is
  whether the team accepts this signed-in reviewer path and records the
  remaining pilot approvals around it

### 1. Staff dry run is live on staging

Route: `/admin/staff-dry-run`

Observed on hosted staging:
- route loads for the signed-in admin session
- `8` steps are listed
- `24` checks are listed
- expected browser writes remain `0`
- expected external sends remain `0`
- local write rehearsal packet count visible: `9`
- ready packet count visible: `5`
- candidate packet count visible: `9`
- rehearsal send count visible: `0`

Current hosted limitation:
- this hosted route still shows older copy, including language that says the
  rehearsal happens "before staging"
- the newer structured review-note template from PR `#121` is not yet visible
  on the hosted domain

Hosted review snapshot recorded on 2026-06-20:
- reviewer lane: Codex route-level hosted review
- signed-in actor visible on the route: `admin@mymedlife.test`
- build under review: `https://staging.mymedlife.org`
- review scope: hosted packet read-through plus route-level safety checks, not a
  human multi-device walkthrough

What passed in this hosted read-through:
- the staff dry-run packet loads on staging and is readable without exposing
  browser writes or external sends
- the packet still shows the eight-step review order for:
  - admin safety posture
  - member week
  - leader follow-up
  - event and NPS readiness
  - proof upload intake
  - HQ proof review
  - coach readout
  - DS Admin safety readout
- the safety assertions remain conservative across the route:
  - no production auth
  - no public proof
  - no external automation
  - no browser write controls
- the local write rehearsal mirror is still clearly a review surface rather than
  a write console

What felt confusing on the hosted build:
- the lead sentence still says the dry run happens "before staging" even though
  the packet is now being reviewed on staging
- the route mixes two different ideas in one surface:
  - staff dry-run walkthrough steps
  - local write rehearsal packet status
- the action-start packet still uses `Local Supabase Auth mode is selected` as
  the first blocker, which reads like a local-only implementation note rather
  than a clean hosted staging decision boundary
- reviewers could still misread packet readiness as pilot approval if they do
  not also look at `/admin/pilot-scope`, `/admin/first-write`, and
  `/admin/integration-outbox`

Current hosted interpretation:
- the staff dry-run packet is usable as staging review evidence today
- it is not yet the final clean hosted approval packet because the copy still
  carries older local-review wording and mixed packet/readiness concepts

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

Hosted detail now visible on this route:
- one-chapter Rush Month pilot is the only route marked `recommended after gates`
- recommended first real pilot size is still:
  - `1 chapter`
  - `5-15 student users`
  - `1 coach`
  - `1 HQ owner`
- the route explicitly lists required approvals before that pilot:
  - `staging environment`
  - `auth/onboarding`
  - `first write path via /admin/first-write`
  - `proof consent/storage posture`
  - `named coach/support owner`
- the route explicitly says these must stay manual or disabled:
  - `Luma writes`
  - `HubSpot sync`
  - `n8n automation`
  - `warehouse exports`
  - `public proof sharing`

Hosted minimum-pilot path now visible on this route:
- sign in and land in chapter context: `blocked`
- member sees what to do next: `staff rehearsal`
- member starts an assigned action: `first live candidate`
- leader follow-up: `manual first`
- event attendance and NPS: `manual first`
- proof/testimonial intake: `blocked`
- coach support posture: `manual first`

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

Hosted proof and operator details now visible on staging:
- packet status badge: `blocked until flags`
- fake member sign-in instruction is visible:
  - `member.a@mymedlife.test`
  - password shown as local fake seed only
- the five-step packet sequence is visible on staging:
  - confirm the packet is not blocked
  - sign in as the fake member
  - start the candidate action
  - return to the verification packet
  - verify event, integration event, and audit rows
- the route explicitly says the first write does **not** approve production
  writes
- the route lists exact proof to collect after the drill:
  - screenshot of `/admin/first-write` with required checks green
  - screenshot of the selected action detail route before start
  - screenshot after redirect showing the `started` result
  - readback proof that assignment status is `in_progress`
  - evidence of one internal event row, one integration event row, and one
    audit log row
  - evidence that automation outbox sends and external writes stayed at zero

Current hosted interpretation:
- staging already supports review of the narrow first-write lane
- staging does not yet prove that the first hosted write is approved to run
- staging now exposes the exact owner lane and proof shape for the first hosted
  write approval, even though the write itself remains blocked

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

### 5. Integration hold is explicit on hosted staging

Route: `/admin/integration-outbox`

Observed on hosted staging:
- route loads for the signed-in admin session
- structured integration event count visible: `1`
- automation outbox row count visible: `1`
- raw event count visible: `1`
- raw queue row count visible: `1`
- live sends visible: `0`
- secrets visible: `0`
- HubSpot handoff contract is the only contract currently marked `ready`
- Luma, warehouse / Power BI, and AI contracts remain in `watch`
- live-send preflight checklist shows `5 ready`, `0 blocked`, `0 writes`, and
  `0 sends`
- the page explicitly says it reads current event and outbox posture only and
  does not mutate queue state

Hosted evidence visible on this route:
- one internal `membership_approved` integration event is visible
- one disabled HubSpot outbox row is visible
- one audit row is visible
- all live controls remain blocked, including send approval, retry, payload
  edits, queue unlocks, secret access, warehouse export, and AI summaries

Current hosted interpretation:
- the integration hold is now visible on staging in plain language, not just in
  docs
- DS and launch reviewers can inspect event, outbox, audit, and contract
  posture without gaining browser-side mutation controls
- the first pilot can keep external systems explicitly off while still proving
  that downstream contract structure exists

### 6. Design QA route is live on hosted staging and exposes one real keyboard risk

Route: `/admin/design-qa`

Observed on hosted staging:
- route loads for the signed-in admin session
- top-line counts visible on staging are:
  - items: `11`
  - ready: `5`
  - review: `5`
  - blocked: `1`
  - mobile checks: `8`
  - accessibility checks: `7`
  - device checks: `7`
  - writes: `0`
- the hosted route includes the Figma target link, the mobile route smoke
  checklist, the keyboard and screen-reader smoke checklist, and the
  device-and-PWA release smoke checklist
- the route explicitly says final production visual QA is still blocked before
  launch
- desktop Safari on the hosted build renders the review route with:
  - the top-line design QA counts visible without overflow
  - the `Phone-sized route smoke` section present
  - the `Keyboard and screen-reader smoke` section present
  - the `Device and PWA release smoke` section present
- the desktop Safari render is readable as a launch-review route today, but it
  does not substitute for real phone, tablet, or installed-PWA checks
- in a signed-in Safari session, the accessibility tree also shows:
  - the skip link before navigation
  - a readable top-level heading and main review copy
  - the local role context for `admin@mymedlife.test`
- at a phone-like Safari window width (`430px`), the hosted route still exposes:
  - mobile quick navigation links
  - the phone-sized route smoke checklist
  - the keyboard and screen-reader smoke checklist
  - the device and PWA smoke checklist
- at a tablet-like Safari window width (`940px`), the hosted route still keeps
  the device and PWA smoke plan readable without obvious text overlap

Quick hosted keyboard observation in Safari:
- on the first `Tab` from the page, focus appears to move to the hidden
  `vercel.live/_next-live/feedback/feedback.html` iframe instead of staying in
  the app's visible skip-link or primary-content flow
- the same hidden Vercel Live feedback iframe is visible in the Safari
  accessibility tree as a second hosted scroll area, which makes the keyboard
  risk look more like staging-shell noise than missing app semantics

Current hosted interpretation:
- staging now exposes the design and accessibility review packet directly on the
  hosted build
- the remaining device and accessibility gate is no longer just abstract: there
  is at least one real release-build keyboard behavior that should be reviewed
  before pilot invitations
- the current hosted build does pass one narrower desktop rendering check:
  Safari can load the full design QA packet, including the phone, accessibility,
  and PWA smoke-plan sections, without hiding the launch-blocking guidance
- this does not block staging review itself, but it is real evidence that the
  accessibility gate should stay open until keyboard behavior is rechecked on
  the final hosted review path

### 6.5 Signed-in home route shows the same hosted keyboard issue

Route: `/`

Observed on hosted staging:
- after restoring the signed-in admin session, the first `Tab` on the hosted
  home route again moved focus to the hidden
  `vercel.live/_next-live/feedback/feedback.html` iframe
- the visible skip link and the main app navigation still exist in the
  accessibility tree, but they do not receive the first keyboard focus in this
  hosted Safari path

Interpretation:
- the keyboard issue is not limited to `/admin/design-qa` or `/offline`
- it appears to be cross-route behavior on the hosted staging shell
- this makes the keyboard concern stronger evidence for the accessibility gate,
  even though the rest of the signed-in staging review flow still works

### 7. Offline recovery route is live on hosted staging and keeps the copy honest

Route: `/offline`

Observed on hosted staging:
- route loads directly on the hosted build
- visible heading: `You are offline`
- the main recovery copy says the app can show this screen without saving
  private chapter data on the device
- visible return actions are:
  - `Home`
  - `Rush Month`
  - `Actions`
- the route explicitly states that offline mode does not:
  - submit assignments
  - upload proof
  - update points
  - send nudges
  - run external automation

Hosted accessibility-semantic readback:
- the route exposes a visible top-level heading in the accessibility tree
- the route content is short and specific enough to read as one recovery state
  rather than a hidden dashboard
- the route does not imply private cache, offline writes, or background sends
- in desktop Safari, the recovery route renders as one narrow centered card with
  all three return actions visible at once and the disabled-offline limitations
  still visible near the bottom of the card
- in a phone-like Safari window width (`430px`), the same hosted route still
  shows:
  - the `You are offline` heading
  - the short recovery explanation
  - all three return actions
  - the disabled-offline limitations note inside the same visible card

Quick hosted keyboard observation in Safari:
- on the first `Tab` from the page, focus again appears to move to the hidden
  `vercel.live/_next-live/feedback/feedback.html` iframe instead of the visible
  recovery actions

Current hosted interpretation:
- the offline route itself is aligned with the pilot-safety message
- the keyboard issue appears to be cross-route on hosted staging rather than a
  one-page quirk
- the current hosted route passes a desktop layout sanity check, but not a real
  installed-PWA or mobile-device proof check
- this is still not full device or installed-PWA proof, but it is stronger
  release-build evidence than a route plan alone

### 8. Admin operations route proves the hosted review packet is still stale

Route: `/admin/operations`

Observed on hosted staging in Safari:
- route loads for the signed-in admin session
- top-line runbook counts visible on staging:
  - runbooks: `8`
  - ready: `3`
  - blocked: `5`
  - launch: `no`
  - sends: `0`
  - secrets: `0`
- the route still shows an older pilot-support summary and recommendation:
  - summary says Phase 2 can close by naming pilot owners and merging the hosted
    review lane
  - recommended next move still says:
    - `Merge PR #120`
    - `keep staging on the merged codepath`
    - `record whether production schema stays deferred`
- the same route still names `Hosted staging review packet` as `review ready`
  while pointing reviewers to merge and closure work that is older than the
  current `MED-486` packet set

Current hosted interpretation:
- this is stronger evidence that `staging.mymedlife.org` is not serving the
  newest review-packet copy
- the build-alignment blocker is not theoretical reviewer confusion anymore; the
  hosted route itself still references an older approval lane
- until the staging alias is explicitly confirmed or re-pointed, the final
  `MED-486` packet cannot honestly claim that the hosted build and the repo
  packet are aligned

### 9. PR preview proves the newer packet copy, but not the Supabase-backed staging path

Preview deployment inspected:
- `https://mymedlife-pwa-git-fix-med-486-stag-07feff-nellis-6036s-projects.vercel.app`

Route checked:
- `/admin/operations`

Observed on the PR preview:
- the route loads the newer `MED-486` operations and pilot-support copy
- the newer pilot-support summary is visible:
  - name the first pilot owners
  - prove the dry-run and rollback posture
  - make stop rules explicit before any real student invitation
- the newer recommended next move is visible:
  - finish the staff dry run
  - name the chapter and owner lanes
  - capture the remaining device/accessibility evidence
  - confirm the first approved hosted write path
  - keep uploads and external sends disabled
- the preview route also shows:
  - `MOCK-SEEDED REVIEW DATA`
  - `Using mock data because MYMEDLIFE_DATA_SOURCE is not set to supabase`

Current interpretation:
- the PR preview proves the latest review-packet copy is deployed somewhere
- the staging alias and the PR preview are serving materially different review
  contexts right now:
  - `staging.mymedlife.org` = Supabase-backed staging evidence path with older
    packet copy
  - PR preview URL = newer packet copy with mock-seeded review data
- the cleanest short-term reviewer path is:
  - use the PR preview URL to review the newest packet language
  - use `staging.mymedlife.org` for Supabase-backed staging evidence
  - decide whether the staging alias should be re-pointed before final pilot
    sign-off

## Recommended defaults from current evidence

These are proposed defaults from the current packet and hosted evidence. They
are not final approvals.

### 1. Staging build alignment

Proven evidence:
- `staging.mymedlife.org` is the Supabase-backed staging path
- the PR preview has the newest packet copy
- signed-in reviewer access works today

Proposed default answer:
- make `staging.mymedlife.org` the final signoff target
- until alias alignment is fixed, use the split review path:
  - staging for Supabase-backed evidence
  - PR preview for newest packet copy
  - signed-in reviewer session as the intended access path
  - sign-out/sign-in for role switching

Unresolved approval owner:
- platform/app owner

### 2. Staff dry run

Proven evidence:
- hosted dry-run route loads
- `8` steps and `24` checks are visible
- `0` writes and `0` sends are visible
- confusing wording is already captured in the packet

Proposed default answer:
- conditional pass for tiny pilot review

Unresolved approval owner:
- staff reviewer

### 3. Device and accessibility review

Proven evidence:
- desktop Safari render pass exists
- signed-in phone-like and tablet-like width smoke exists
- offline route honesty is confirmed
- hidden Vercel iframe takes first keyboard focus across hosted routes

Proposed default answer:
- desktop Safari: pass
- signed-in phone-like width: provisional pass
- signed-in tablet-like width: provisional pass
- offline route: pass
- keyboard: open, likely hosted-shell issue
- screen-reader or label audit: still required

Unresolved approval owner:
- product or QA reviewer

### 4. Pilot scope and owners

Proven evidence:
- staging already recommends one chapter, Rush Month only, and `action_started`
  first
- seeded chapter context is strongest for `UCLA MEDLIFE`

Proposed default answer:
- one chapter only
- Rush Month only
- `5-10` students
- proposed planning chapter: `UCLA MEDLIFE`
- owner names remain pending by role

Unresolved approval owner:
- Nick or HQ, plus DS for DS ownership

### 5. First hosted write

Proven evidence:
- `/admin/first-write` already frames `action_started` as the narrow candidate
- the packet already lists the expected proof after the drill

Proposed default answer:
- first hosted write lane: `action_started`
- rollback owner: pending platform/app owner
- disable-write owner: pending DS/platform owner
- proof before any second write:
  - before/after route evidence
  - assignment status `in_progress`
  - one internal event row
  - one integration event row
  - one audit log row
  - zero outbox sends
  - zero external writes

Unresolved approval owner:
- Kiomi or launch approver

### 6. Integration hold

Proven evidence:
- hosted staging already shows the hold posture
- live sends remain at zero

Proposed default answer:
- HubSpot, Luma writes, n8n, warehouse/Power BI, SMS/email, and AI stay off
- no read-only exception unless explicitly approved

Unresolved approval owner:
- DS

## What is still missing before we can honestly say staging is ready for a controlled live MVP pilot

## Decision checklist for approvers

Use this as the shortest path to a real pilot decision:

1. Platform / app owner
   - confirm whether `staging.mymedlife.org` should keep following the current
     preview deployment or be re-pointed to the newer review-packet branch
   - if the hosted staff-dry-run copy needs to match PR `#121`, fix the alias
     before the final review round

2. Product / launch reviewer
   - run the release-build device matrix:
     - phone
     - tablet
     - desktop
     - offline or PWA recovery
     - keyboard-only
     - screen-reader or label audit
   - record whether the Safari keyboard focus issue is only preview-noise or a
     real app-flow problem

3. Nick / HQ
   - name the exact pilot chapter or internal cohort
   - name the chapter leader owner, coach owner, HQ/admin owner, and support
     channel
   - approve the stop rules and pause-message owner

4. Kiomi / launch approvers
   - confirm whether `action_started` is the first hosted write lane
   - name the rollback owner and disable-write owner
   - confirm what hosted audit and readback proof must be reviewed before a
     second write lane can open

5. DS
   - explicitly sign off that HubSpot, Luma writes, n8n, warehouse, Power BI,
     SMS, email, and AI stay off for the first pilot
   - name the day-one integration or outbox escalation owner
   - note any read-only exception if one is allowed

Companion worksheet:
- use `docs/review/2026-06-20-staging-pilot-approval-checklist.md` to record
  the actual approval answers in one place once reviewers respond

Only after all five are done can this note support the statement:
`ready for a controlled one-chapter live MVP pilot`

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
- the hosted design QA route and offline route are now both visible on staging,
  cross-route Safari keyboard observations are recorded, desktop Safari render
  checks exist, and signed-in Safari narrow-window smoke checks now exist for
  phone-like and tablet-like layouts, but the actual phone, tablet,
  installed-PWA, and full accessibility pass are still missing from the release
  build evidence packet

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
- integration hold and blocked live-send controls are visible on the hosted
  build
- the design QA route is live on staging and still keeps final launch blocked
- the offline recovery route is live on staging and keeps offline limitations
  explicit

Hosted staging does not yet prove pilot readiness end to end because:
- the current domain is still missing the newest review-note packet
- a clean browser session currently lands on Vercel login before the app, so
  reviewer access is still session-dependent
- device and accessibility evidence is still missing
- named pilot owners are still missing
- the first hosted write is still blocked on staging

As of 2026-06-20, the honest status is:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`
