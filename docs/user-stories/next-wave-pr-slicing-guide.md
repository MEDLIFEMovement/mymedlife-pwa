# myMEDLIFE Next-Wave PR Slicing Guide

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: help `#1`, `#2`, `#3`, and `#4` keep PRs narrow, reviewable, and
non-overlapping during the next execution wave.

## Slicing Principles

1. One shell family per PR.
2. One route family or control cluster per PR.
3. Source/Figma acceptance evidence must be named.
4. TEST-label changes are allowed when visible fake content is in the touched
   surface, but do not rename internal variables just for TEST compliance.
5. Blocked/read-only/preview-only control honesty belongs in shell PRs.
6. Auth/data/write/provider/rollout proof belongs in separate approved lanes.
7. If a slice needs shared routing/auth helpers, pause and ask Coordinator.

## Recommended PR Shapes

| Good PR shape | Example | Why it is safe |
| --- | --- | --- |
| One route continuity slice | `/app/events` -> detail -> `/app/points` copy and route checks | stays member-owned and narrow |
| One menu/view restoration slice | `/leader?view=*` menu/view continuity | keeps leader routing coherent without touching other shells |
| One walkthrough cluster | staff chapter drawer -> embedded Admin -> Chapters loop | preserves staff/admin coherence while avoiding rollout data |
| One blocked-control cluster | Admin API Keys / MCP blocked verbs | high-risk controls stay honest without enabling writes |
| One QA packet | mobile member event loop screenshots and no-write smoke notes | moves QA confidence without implementation churn |

## Avoid These PR Shapes

| Risky PR shape | Why to avoid |
| --- | --- |
| Member + leader + staff changes in one PR | hard to review, high overlap risk |
| UI shell plus data/write contract in one PR | blurs Scope/UI with Data/Auth or Writes/Integrations |
| Staff/Admin shell plus rollout packet evidence | `#3` owns staff/admin shell, not rollout proof |
| TEST-label cleanup plus product copy redesign | hides source-fidelity changes inside broad text churn |
| Screenshot-matching redesign | screenshots are acceptance references, not source of truth |
| Provider/API verbs made clickable | implies live integrations before approval |

## #1 Member App Slicing

Best next slices:

1. Event-to-points continuity.
2. Home-to-profile route/control honesty.
3. Stories feed/detail source fidelity.
4. SLT member-shell handoff closeout.
5. Mobile QA support after member routes stabilize.

Likely files:

- `src/app/app/*`
- `src/app/profile/page.tsx`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- member route/component tests

Avoid:

- `/leader`, `/staff`, `/admin`
- auth/session helpers
- provider writes, points ledger authority, rollout proof

Stop and ask Coordinator if:

- a member slice needs shared auth/routing changes,
- a points slice starts changing award authority,
- an event slice starts enabling RSVP/check-in/attendance writes.

## #2 Student Leadership Slicing

Best next slices:

1. Service-backed `/leader?view=*` route/menu continuity.
2. Succession/support/member-profile handoff honesty.
3. Event/attendance handoff honesty.
4. Leaderboard/readback polish.
5. Committees/tasks preview honesty.

Likely files:

- `src/app/leader/page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/leader-app-shell.tsx`
- leader support/culture components
- leader route/component tests

Avoid:

- `/app`, `/staff`, `/admin`
- role/member writes, event writes, attendance imports, Luma/provider sync,
  notifications, points awards, rollout proof

Stop and ask Coordinator if:

- a route restoration requires shared app-router changes,
- a leader profile slice exposes private member data,
- a succession or committee slice starts persisting role/task changes.

## #3 Staff / DS Admin Slicing

Best next slices:

1. Staff chapter drawer / embedded Admin / Chapters loop.
2. Proof/UGC review next-step clarity.
3. Staff/Admin walkthrough and dark Admin menu fidelity.
4. Integrations / API Keys / MCP blocked-state parity.
5. System Health / Audit Logs / Users / Chapters read-only clarity.

Likely files:

- `src/app/staff/page.tsx`
- `src/app/admin/*`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `src/components/staff-app-shell.tsx`
- staff/admin route/component tests

Avoid:

- `/app`, `/leader`
- owner CSV apply, invite gate, production proof rows, provider/API live writes,
  user/role/chapter production mutations, launch-gate advancement

Stop and ask Coordinator if:

- staff/admin copy starts claiming production proof,
- admin controls start exposing secrets or live provider verbs,
- a shell slice starts touching rollout evidence files.

## #4 QA / Release Watch Slicing

Best next slices:

1. Active PR board classification.
2. Three-shell visual QA with TEST-label review.
3. Public no-write smoke after merge waves.
4. Member mobile QA for event/points loop.

Likely surfaces:

- GitHub PR checks and merge states.
- Browser screenshots/recordings when Coordinator asks.
- Route lists from the shell acceptance packets.

Avoid:

- product code edits,
- implementation assignments,
- production/provider access,
- matrix edits,
- rollout evidence claims.

Stop and ask Coordinator if:

- a PR changes shared helpers across shell lanes,
- smoke evidence is being treated as production proof,
- a builder asks #4 to approve live writes or provider access.

## Real Access Later Vs Local Work Now

Local/sandbox work is enough for:

- source-fidelity UI slices,
- TEST-label compliance,
- preview-only/control-honesty copy,
- focused route/component tests,
- public no-write smoke,
- visual QA screenshots,
- planning/backlog refreshes.

Real access or returned data is needed for:

- owner CSV validation,
- production rollout packet,
- live counts,
- production signed-in proof,
- pilot RSVP/attendance/points proof,
- audit/outbox zero-send proof,
- HubSpot/Luma static export comparison,
- provider/API write activation.

## Matrix Guardrail

- Shell PRs: possible `Scope/UI`, maybe `QA/Ops`.
- Test-only or smoke-only PRs: possible `QA/Ops`.
- Safety-contract PRs: possible `Data/Auth`, maybe `Writes/Integrations` only
  when write/provider boundaries are actually tested.
- Rollout evidence: only real owner data, real production accounts, live
  counts, pilot proof, audit/outbox proof, and final approval.
- Planning docs: no percentage movement by themselves.
