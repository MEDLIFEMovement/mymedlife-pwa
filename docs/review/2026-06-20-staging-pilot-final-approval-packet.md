# Staging Pilot Final Approval Packet

Date: 2026-06-20
Issue: `MED-486`
Primary hosted build: `https://staging.mymedlife.org`
Companion notes:
- `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`
- `docs/review/2026-06-20-staging-pilot-approval-checklist.md`
- `docs/review/2026-06-20-staging-pilot-approval-delta.md`

## Purpose

This is the final approval packet for one specific decision:

Can myMEDLIFE move from hosted staging review into a controlled one-chapter live
MVP pilot?

This packet is not for broad launch approval. It is only for:
- one chapter
- Rush Month only
- 5-15 students
- one narrow hosted write lane first
- all external systems still disabled unless separately approved

## Current recommendation

Current recommendation: `no-go yet`

Reason:
- the staging packet is strong enough for review
- the safe first-write candidate is clear
- the pilot boundary is explicit
- desktop Safari checks now confirm the hosted design QA and offline routes
  render with the expected launch-blocking copy
- but the final human approvals are not fully recorded yet
- and the hosted `/admin/operations` route still references older merge-era
  review guidance, which is evidence that staging build alignment is still not
  settled
- the PR preview does show the newer packet copy, but it is mock-seeded review
  data rather than the Supabase-backed staging path

Use this exact wording today:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`

Use this wording only after every required decision below is recorded:

`ready for a controlled one-chapter live MVP pilot`

## Recommended pilot shape

Unless a reviewer explicitly approves something broader, the proposed planning
default is:

- exact scope: one chapter only
- product surface: Rush Month only
- student count: 5-10 students
- proposed planning chapter: `UCLA MEDLIFE`
- leader coverage: one chapter leader owner
- support coverage: one coach owner and one HQ/admin owner
- DS coverage: one DS owner
- event/NPS operations: manual first
- proof uploads and sharing: off
- role or membership writes: off
- external systems: off

This is a recommended default, not a final approval. The app and the hosted
packet still show the broader seeded recommendation of `5-15` students until
Nick or HQ confirms the final tiny pilot shape.

## Recommended first hosted write

Recommended first hosted write lane: `action_started`

Why this is the narrowest safe candidate:
- it stays inside the student action loop
- it does not require enabling proof uploads
- it does not require enabling leader approval writes
- it does not require turning on external sends
- the staging route already describes the audit and readback proof expected for
  this one lane

This packet does **not** approve any second write lane.

## Decision summary

| Decision area | Current status | What is already true | What still needs approval |
|---|---|---|---|
| Staging build alignment | Open | `staging.mymedlife.org` is reviewable in a signed-in Safari session, but `/admin/operations` still shows older merge-era packet guidance; the PR preview shows newer packet copy on mock-seeded review data; a clean browser session currently lands on Vercel login before the app | confirm whether the current preview deployment is the final review target for packet copy, whether the alias must be re-pointed, whether reviewers should split copy review and staging-data review temporarily, and whether the signed-in reviewer path is the intended staging access path |
| Staff dry run | Partially ready | `/admin/staff-dry-run` is live, readable, and keeps writes/sends at zero | record reviewer names, build reviewed, what passed, and what was confusing |
| Device and accessibility proof | Partially ready | `/admin/design-qa` and `/offline` are live on staging; desktop Safari rendering is confirmed; signed-in Safari narrow-window smoke now exists for phone-like and tablet-like widths; the hosted keyboard concern is still noted and appears tied to the hidden Vercel feedback iframe | record phone, tablet, desktop, offline/PWA, keyboard, and screen-reader or label-audit results |
| Pilot scope and owners | Open | `/admin/pilot-scope` already recommends one chapter, Rush Month only, and `action_started` first | name the exact cohort, launch window, chapter leader, coach, HQ/admin, DS owner, and pause/support channel |
| First hosted write lane | Open | `/admin/first-write` already frames `action_started` as the narrow candidate and lists proof needed after the drill | approve the lane, name rollback owner, name disable-write owner, and confirm audit/readback proof expectations |
| Integration hold | Partially ready | `/admin/integration-outbox` keeps downstream systems visibly disabled and review-only | DS must explicitly confirm HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI all stay off for the first pilot |

## Evidence index

Use these as the core review path:

1. Hosted evidence note
   - `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`

2. Fill-in approval worksheet
   - `docs/review/2026-06-20-staging-pilot-approval-checklist.md`
   - includes a copy-paste reply block plus the evidence already recorded so
     reviewers can confirm or correct instead of starting from blanks

3. Approval delta summary
   - `docs/review/2026-06-20-staging-pilot-approval-delta.md`
   - shows what current evidence already supports, what is only a proposed
     default, and which blanks still belong to human approvers

4. Hosted review routes
   - `/admin/staff-dry-run`
   - `/admin/design-qa`
   - `/offline`
   - `/admin/pilot-scope`
   - `/admin/first-write`
   - `/admin/integration-outbox`
   - `/admin/operations`
   - `/admin/launch-gate`

5. Latest PR preview for newer packet copy
   - `https://mymedlife-pwa-git-fix-med-486-stag-07feff-nellis-6036s-projects.vercel.app`
   - use this for the newest review-packet language when alias drift is the
     question

## Current build recommendation

Use this split until the alias decision is made:

- use `staging.mymedlife.org` for Supabase-backed staging evidence
- use the PR preview URL for the newest `MED-486` packet copy
- use a signed-in reviewer browser session when checking the staging domain
- treat the signed-in session as the real role context for review; switching
  roles means signing out and signing back in as another approved fake staging
  user
- do not call the pilot ready until the team explicitly decides whether the
  staging alias should be re-pointed or whether the split review path is enough
  for final sign-off

## How to approve this packet

Reviewers can use either of these paths:

- reply `approved as written` if the proposed defaults below are correct
- copy the reply block from the checklist and replace only the fields that
  should differ

The defaults below are intentionally conservative. They are proposed answers
from current evidence, not completed approvals.

## Approval delta at a glance

If reviewers accept the current evidence as written, this packet already
proposes the following defaults:

- staging should remain the final signoff target, even if packet-copy review
  temporarily uses the PR preview
- the staff dry run is a conditional pass for a tiny pilot review
- desktop Safari, narrow signed-in phone-like width, narrow signed-in
  tablet-like width, and the offline route all have enough evidence to stay in
  the packet
- the planning default pilot shape is one chapter, Rush Month only, `5-10`
  students, with `UCLA MEDLIFE` used only as a planning placeholder
- the first hosted write default remains `action_started`
- downstream systems remain off unless explicitly approved later

What the packet still needs from humans is narrower:

- one platform decision about final staging-target alignment
- one human confirmation pass on the device and accessibility notes
- named pilot owners and support path
- explicit first-write approval ownership
- explicit DS confirmation that downstream systems stay off

Use the delta summary note if a reviewer wants the shortest version of these
remaining asks:

- `docs/review/2026-06-20-staging-pilot-approval-delta.md`

## What still blocks completion of this goal

This goal is not complete until all six items below are explicitly answered and
recorded:

- staging build alignment decision
- hosted staff dry-run signoff
- phone, tablet, desktop, offline or PWA, and accessibility proof
- named pilot cohort and day-one owners
- first hosted write approval with rollback owner
- DS signoff that downstream systems stay off

Until those answers are recorded, the honest status stays:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`

## Recommended next moves

To close this goal without expanding scope, the next actions should stay
review-only and owner-specific:

1. Platform owner
   - decide whether `staging.mymedlife.org` stays on the current alias target
     or is re-pointed to the newer `MED-486` review packet deployment
   - confirm whether the signed-in reviewer browser session is the approved
     staging access path for now

2. Staff reviewer
   - walk `/admin/staff-dry-run`
   - record reviewer names, build used, what passed, and what still felt
     confusing

3. Product or QA reviewer
   - record phone, tablet, desktop, offline or installed-PWA, keyboard-only,
     and screen-reader or label-audit results
   - explicitly note whether the hosted keyboard focus issue is Vercel-shell
     noise or a real pilot blocker

4. Nick or HQ owner
   - name the exact pilot chapter or internal cohort
   - name the day-one chapter leader, coach, HQ/admin, and DS owners
   - name the pause or support channel and pause-message approver

5. Kiomi or launch approver
   - approve the first hosted write lane
   - name the rollback owner and disable-write owner
   - confirm the audit and readback proof required before any second write lane

6. DS
   - confirm HubSpot, Luma writes, n8n, warehouse, Power BI, SMS, email, and
     AI all stay off for the first pilot
   - name the day-one escalation owner for downstream or outbox questions

## Scope of this pass

No app behavior changed in this pass.

This pass only tightened:
- review-packet wording
- hosted evidence capture
- blocker visibility
- approval guidance for reviewers

Because this was a documentation and evidence pass only, I did not rerun lint,
typecheck, tests, or build.

No new browser writes, external sends, auth changes, migration changes, or
integration activations were introduced here.

## Final approval questions

These are the exact questions this packet is asking reviewers to answer:

### 1. Is the staging build aligned?

Current evidence:
- `staging.mymedlife.org` is the Supabase-backed staging evidence path
- the PR preview has the newest `MED-486` packet copy
- a clean browser session currently lands on Vercel login before the app
- a signed-in reviewer session can open the staging review routes directly

Recommended default answer:
- final approval target should become `staging.mymedlife.org`
- until alias alignment is fixed, use:
  - `staging.mymedlife.org` for Supabase-backed evidence
  - PR preview for newest packet copy
  - signed-in reviewer session as the intended access path
  - sign-out/sign-in for role switching

Why this is the default:
- it keeps final pilot evidence tied to the real staging domain
- it avoids pretending the PR preview and the staging alias are the same review
  target today

Still needs human confirmation:
- platform/app owner must confirm the final target
- platform/app owner must confirm whether alias re-point is required
- platform/app owner must confirm the signed-in reviewer path is acceptable for
  now

Record:
- approved branch or deployment:
- owner of that decision:
- if the alias must move, who will move it:

### 2. Did the staff dry run pass well enough for a tiny live pilot?

Current evidence:
- hosted staging route loads
- `8` steps are visible
- `24` checks are visible
- `0` writes and `0` sends are visible
- the staff packet is readable end to end in the signed-in staging reviewer
  lane

Recommended default answer:
- conditional pass for tiny pilot review

Why this is the default:
- the route already proves the walkthrough is readable and conservative on the
  hosted build
- the remaining issues are clarity issues, not evidence that the route is
  unsafe

Still needs human confirmation:
- reviewer names must be recorded
- a human reviewer must confirm they agree with the current pass/confusion notes
- any follow-up before invitations must be named explicitly

Record:
- reviewer names:
- date:
- build used:
- what passed:
- what was confusing:
- required follow-up before invitations:

### 3. Did the hosted build pass device and accessibility review?

Current evidence:
- desktop Safari render pass exists for `/admin/design-qa` and `/offline`
- signed-in Safari narrow-window smoke exists for:
  - phone-like width: `430px`
  - tablet-like width: `940px`
- `/offline` still shows the expected honest recovery copy and disabled
  limitations
- the hidden Vercel iframe still takes first `Tab` focus on hosted staging
- repo-side accessibility sanity check confirms:
  - the shared app shell exposes a skip link to `#main-content`
  - the shared shell includes a matching `id="main-content"` focus target
  - shared navigation uses explicit `aria-label` values
  - the offline route exposes a semantic `main` and visible `h1`

Recommended default answer:
- desktop Safari: pass
- signed-in phone-like width: provisional pass
- signed-in tablet-like width: provisional pass
- offline route: pass
- keyboard: open, likely hosted-shell issue
- screen reader or label audit: still required

Why this is the default:
- the current evidence is strong enough to separate route rendering from the
  remaining accessibility question
- the keyboard concern now looks cross-route and shell-related, but that still
  needs one human pass before it can be closed
- the repo-side shell semantics make it less likely that the first-focus issue
  comes from missing in-app skip-link or landmark wiring

Still needs human confirmation:
- one human keyboard-only pass
- one screen-reader or label-audit smoke pass
- explicit human judgment on whether the hosted iframe focus issue is
  non-blocking for the tiny pilot

Record:
- phone:
- tablet:
- desktop:
- offline or installed PWA:
- keyboard-only:
- screen-reader or label audit:
- blocking issue, if any:

### 4. Is the pilot scope locked?

Current evidence:
- staging already recommends one chapter, Rush Month only, and `action_started`
  first
- seeded chapter context is strongest for `UCLA MEDLIFE`
- the hosted planning route still shows the broader seeded `5-15` range, so
  this packet keeps `5-10` only as the tighter proposed default, not as a
  claimed hosted approval

Recommended default answer:
- one chapter only
- Rush Month only
- `5-10` students
- proposed planning chapter: `UCLA MEDLIFE`
- chapter leader owner: pending Nick/HQ
- coach owner: pending Nick/HQ
- HQ/admin owner: pending Nick/HQ
- DS owner: pending DS
- pause/support channel: pending HQ/admin
- pause-message approver: pending HQ/admin

Why this is the default:
- it keeps the first pilot smaller than the broader seeded `5-15` range
- it uses the strongest seeded chapter context without pretending that chapter
  has already been approved

Still needs human confirmation:
- Nick or HQ must name the actual pilot chapter or internal cohort
- Nick or HQ must name the day-one owners and support path
- DS must confirm the day-one DS owner

Record:
- exact chapter or internal cohort:
- launch window:
- maximum student count:
- chapter leader owner:
- coach owner:
- HQ/admin owner:
- DS owner:
- pause/support channel:
- pause-message approver:

### 5. Is the first hosted write approved?

Current evidence:
- `/admin/first-write` already frames `action_started` as the narrow candidate
- the route lists the readback and audit proof expected after the drill

Recommended default answer:
- first hosted write lane: `action_started`
- rollback owner: pending platform/app owner
- disable-write owner: pending DS/platform owner
- approver after drill: pending Kiomi/launch approver
- required proof before any second write opens:
  - before and after route evidence
  - assignment status becomes `in_progress`
  - one internal event row
  - one integration event row
  - one audit log row
  - zero outbox sends
  - zero external writes

Why this is the default:
- it is the narrowest save path
- it stays inside the student action loop
- it does not require proof upload, leader approval writes, or external sends

Still needs human confirmation:
- Kiomi or launch approver must explicitly approve this lane
- rollback and disable-write owners must be named
- the post-drill approver must be named

Record:
- approved first write lane:
- rollback owner:
- disable-write owner:
- required audit/readback proof:
- approver after drill:

### 6. Is the integration hold explicit and approved?

Current evidence:
- `/admin/integration-outbox` already shows the hold posture on hosted staging
- live sends remain at zero

Recommended default answer:
- HubSpot writes off
- Luma writes off
- n8n off
- warehouse or Power BI off
- SMS or email off
- AI actions off
- read-only exception: none unless explicitly approved
- escalation owner: pending DS

Why this is the default:
- it preserves the app and Supabase as source of truth for the first pilot
- it keeps the first pilot auditable and reversible

Still needs human confirmation:
- DS must explicitly approve the hold
- DS must name the day-one escalation owner
- any read-only exception must be named explicitly

Record:
- HubSpot off:
- Luma writes off:
- n8n off:
- warehouse or Power BI off:
- SMS or email off:
- AI actions off:
- any read-only exception:
- escalation owner:

## Go or no-go decision

Mark `go` only if every line below is true:

- the staging domain is pointing at the intended review target
- the hosted staff dry run is recorded
- the device and accessibility checks are recorded
- the exact pilot cohort and owners are named
- `action_started` or one equally narrow lane is explicitly approved first
- rollback owner and disable-write owner are named
- audit and readback proof expectations are fixed before the drill
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, and AI remain off unless
  separately approved

Decision:
- current status: `no-go yet`
- next status after answers are recorded: `go for a controlled one-chapter live MVP pilot`

## Reviewer signoff block

Platform or app owner:
- name:
- approved:
- date:
- notes:

Nick or product owner:
- name:
- approved:
- date:
- notes:

Kiomi or launch approver:
- name:
- approved:
- date:
- notes:

DS owner:
- name:
- approved:
- date:
- notes:

Coach or HQ operations owner:
- name:
- approved:
- date:
- notes:

## Final note

This packet is intentionally conservative. It is meant to prevent the team from
confusing "staging looks good" with "the live pilot is fully owned and safe to
run."
