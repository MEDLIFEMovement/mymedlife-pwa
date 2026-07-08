# Staff / Admin Next Slice Brief

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Builder owner: `#3` Staff / DS Admin shell family

## Live Repo Context

The staff/admin lane has recent merged progress:

- `#510` tightened embedded admin review posture.
- `#511` tightened admin command center return cues.
- `#515` is an admin-only phase 2 command center cue follow-on, healthy but
  freshness-blocked/rerunning when checked.
- `#516` is an admin review route-label follow-on, green but behind when
  checked.
- `#503` remains the real staff/admin blocker around chapter drawer continuity.

This means #3 should not broaden into rollout evidence or provider access. The
next safe slice depends on #503: finish or unblock chapter drawer continuity
first, then move into Proof / UGC -> embedded Admin loop coherence.

## Exact Next Recommended Slice

**After #503 clears: Proof / UGC review queue -> embedded Admin -> Chapters loop
coherence.**

If #503 is still blocked, #3 should stay on the smallest-safe #503 fix instead
of starting a new staff/admin surface.

The goal is to make staff review work feel like one source-backed walkthrough:
chapter context, proof/UGC review posture, embedded Admin return cues, and safe
admin review labels should all point to the same preview/read-only truth.

## Why This Is Best From Repo Truth

Admin return cues and embedded admin posture have improved, but staff review
flows can still feel fragmented if Proof/UGC review, chapter drawer context, and
Admin handoff copy do not agree. This slice has high demo value and low
rollout-risk if it stays shell-only.

It also avoids the trap of treating #3 as rollout packet owner. #3 owns Staff /
DS Admin shell continuity.

## Likely File Families

Inspect first:

- `src/app/staff/page.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/staff-app-shell.tsx`
- `src/components/staff-command-center-panel.tsx`
- `src/components/staff-portfolio-toolbar.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/review-path/page.tsx`
- `src/app/admin/chapters/page.tsx`
- `src/components/figma-admin-panel.tsx`
- `tests/staff-page.test.tsx`
- `tests/staff-command-center.test.ts`
- `tests/admin-review-handoff-pages.test.tsx`
- `tests/admin-management-pages.test.tsx`

Avoid:

- `/app`, `/leader`
- owner CSV apply
- rollout packet
- invite gate
- production proof rows
- provider/API live writes
- user/role/chapter production mutations
- launch-gate advancement

## Figma / Exported-Source Acceptance Checks

- Staff top nav and chapter drawer/detail context remain source-backed and
  readable.
- Proof / UGC review surfaces show clear next-step cues without claiming live
  moderation or publishing.
- Embedded Admin keeps dark Admin shell/menu fidelity and clear return/back
  affordance.
- Chapters loop copy explains preview/read-only state and does not imply owner
  truth application.
- Top-right alert/profile/header elements do not overlap or obscure review
  cues.

## TEST-Label Expectations

Visible fake/sandbox/Figma-derived content must show `TEST`, including:

- staff/admin users
- chapters and schools
- portfolio rows
- proof/UGC cards
- review actors
- campaign/SOP examples if visible
- audit/admin-change rows
- provider/API placeholders
- fake metrics and placeholder owners

Keep product/provider/menu terms clean: MEDLIFE, myMEDLIFE, Luma, HubSpot,
Hootsuite, Smile.io, n8n, Events, Points, API Keys, MCP Connections, roles, and
menu labels should not be prefixed.

## Visible But Preview-Only

Keep these visible if source-backed, but do not make them sound live:

- proof review / approve / reject / publish controls
- UGC moderation controls
- chapter interventions and follow-ups
- exports and survey sends
- Admin user/role/chapter mutations
- provider sync/test/send verbs
- API key and MCP actions
- launch gate and release readiness actions

## Matrix Columns

If landed and tested/smoked, this slice may support:

- `Scope/UI`
- `QA/Ops`

It must not move:

- `Data/Auth`
- `Writes/Integrations`
- `Rollout Gate`

## What Does Not Count As Rollout Proof

- staff/admin screenshots
- public no-write smoke
- TEST chapter/proof/admin rows
- preview admin route labels
- embedded Admin handoff copy
- local actor proof

## Blockers To Starting Safely

Do not start if:

- #503 is still blocked and needs the same file family,
- #515 or #516 is actively editing the same admin route labels/cues,
- the slice starts applying owner CSV data or creating launch packet evidence,
- it enables proof publishing, provider/API writes, user/role/chapter writes, or
  launch gate advancement.
