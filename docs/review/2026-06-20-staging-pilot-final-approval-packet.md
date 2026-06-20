# Staging Pilot Final Approval Packet

Date: 2026-06-20
Issue: `MED-486`
Primary hosted build: `https://staging.mymedlife.org`
Companion notes:
- `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`
- `docs/review/2026-06-20-staging-pilot-approval-checklist.md`

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

Unless a reviewer explicitly approves something broader, the recommended live
pilot shape is:

- exact scope: one chapter only
- product surface: Rush Month only
- student count: 5-15 students
- leader coverage: one chapter leader owner
- support coverage: one coach owner and one HQ/admin owner
- DS coverage: one DS owner
- event/NPS operations: manual first
- proof uploads and sharing: off
- role or membership writes: off
- external systems: off

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

3. Hosted review routes
   - `/admin/staff-dry-run`
   - `/admin/design-qa`
   - `/offline`
   - `/admin/pilot-scope`
   - `/admin/first-write`
   - `/admin/integration-outbox`
   - `/admin/operations`
   - `/admin/launch-gate`

4. Latest PR preview for newer packet copy
   - `https://mymedlife-pwa-git-fix-med-486-stag-07feff-nellis-6036s-projects.vercel.app`
   - use this for the newest review-packet language when alias drift is the
     question

## Current build recommendation

Use this split until the alias decision is made:

- use `staging.mymedlife.org` for Supabase-backed staging evidence
- use the PR preview URL for the newest `MED-486` packet copy
- use a signed-in reviewer browser session when checking the staging domain
- do not call the pilot ready until the team explicitly decides whether the
  staging alias should be re-pointed or whether the split review path is enough
  for final sign-off

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

## Scope of this pass

No app behavior changed in this pass.

This pass only tightened:
- review-packet wording
- hosted evidence capture
- blocker visibility
- approval guidance for reviewers

No new browser writes, external sends, auth changes, migration changes, or
integration activations were introduced here.

## Final approval questions

These are the exact questions this packet is asking reviewers to answer:

### 1. Is the staging build aligned?

Record:
- approved branch or deployment:
- owner of that decision:
- if the alias must move, who will move it:

### 2. Did the staff dry run pass well enough for a tiny live pilot?

Record:
- reviewer names:
- date:
- build used:
- what passed:
- what was confusing:
- required follow-up before invitations:

### 3. Did the hosted build pass device and accessibility review?

Record:
- phone:
- tablet:
- desktop:
- offline or installed PWA:
- keyboard-only:
- screen-reader or label audit:
- blocking issue, if any:

### 4. Is the pilot scope locked?

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

Record:
- approved first write lane:
- rollback owner:
- disable-write owner:
- required audit/readback proof:
- approver after drill:

### 6. Is the integration hold explicit and approved?

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
