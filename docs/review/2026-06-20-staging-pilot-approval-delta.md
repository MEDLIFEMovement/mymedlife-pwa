# Staging Pilot Approval Delta

Date: 2026-06-20
Issue: `MED-486`
Primary hosted build: `https://staging.mymedlife.org`

## Why this note exists

This is the shortest reviewer-facing summary of the `MED-486` packet.

It does not create approvals by itself. It only separates:

- what current evidence already supports
- what this packet recommends by default
- what still needs a named human decision

Use this note when someone wants the decision delta without reading the full
packet first.

## Honest current status

Keep the current status as:

`staging reviewable, pilot posture visible, controlled live MVP pilot not yet approved`

Do not replace that status until the remaining approval-owned blanks are
explicitly answered.

## Decision delta

| Area | Current evidence supports | Recommended default | Still needs human confirmation |
|---|---|---|---|
| Staging build alignment | Signed-in staging review works; alias and preview are not fully aligned | final signoff target should be `staging.mymedlife.org`; use PR preview only for newest packet copy until alias alignment is settled | platform/app owner confirms final target, access path, and whether alias re-point is required |
| Staff dry run | route loads; `8` steps; `24` checks; `0` writes; `0` sends | conditional pass for tiny pilot review | human reviewer confirms the pass/confusion notes and names any pre-pilot follow-up |
| Device and accessibility | desktop Safari pass; signed-in phone-like and tablet-like width evidence; offline route pass; keyboard concern appears cross-route | desktop pass; phone/tablet provisional pass; offline pass; keyboard remains open; screen-reader or label audit still required | one human keyboard pass, one screen-reader or label-audit pass, and explicit judgment on the hidden Vercel iframe issue |
| Pilot scope | staging already points reviewers toward one chapter, Rush Month only, and `action_started` first | one chapter, Rush Month only, `5-10` students, planning placeholder `UCLA MEDLIFE` only | Nick/HQ and DS must name the real chapter or cohort, launch window, owners, and support path |
| First hosted write | `/admin/first-write` already frames the narrow proof shape | first hosted write should be `action_started` | Kiomi or launch approver must approve the lane and name rollback, disable-write, and post-drill approver owners |
| Integration hold | staging keeps live sends at zero and shows hold posture clearly | HubSpot, Luma writes, n8n, warehouse or Power BI, SMS or email, and AI actions stay off | DS must explicitly confirm the hold and name the escalation owner |

## What reviewers can treat as prefilled

Unless a reviewer wants to change them, these are the defaults already
supported by the packet:

- signed-in reviewer path is the intended temporary staging path
- role switching should happen through sign-out and sign-in
- `action_started` is the first-write candidate
- downstream systems stay off
- `UCLA MEDLIFE` is a planning placeholder only

## What still cannot be assumed

Do not assume any of the following without an explicit human reply:

- that the pilot chapter is approved
- that the staging alias decision is approved
- that the accessibility gate is closed
- that the first hosted write is approved
- that named owners and pause path are settled

## Fastest approval path

Reviewers can:

- reply `approved as written`, or
- replace only the rows they want to change in the checklist reply block

Primary packet:
- `docs/review/2026-06-20-staging-pilot-final-approval-packet.md`

Checklist:
- `docs/review/2026-06-20-staging-pilot-approval-checklist.md`

Hosted evidence:
- `docs/review/2026-06-20-hosted-staging-pilot-evidence.md`
