# myMEDLIFE User Story Gap Report

Date: 2026-07-07
Owner lane: myMEDLIFE #5, planning/docs only
Linear planning reference: MED-512
Purpose: convert the story inventory into practical backlog and launch-truth
guidance for viability review.

Supporting delivery artifact: `docs/user-stories/delivery-backlog.md` decomposes
the master inventory into PR-sized UI, data/safety, QA, rollout-evidence, and
planning slices.

## Compact Backlog Table

| ID | Persona | Route / surface | Current status | Main blocker |
| --- | --- | --- | --- | --- |
| MVP-MEM-01 | member | `/login`, `/app` | partial | Real production member account proof |
| MVP-MEM-02 | member | `/app` | built shell / mock-safe data | Real member/chapter data |
| MVP-MEM-03 | member | `/app/events` | partial | Approved real event rows |
| MVP-MEM-04 | member | `/app/events/[eventId]?step=rsvp` | preview-only | RSVP write/readback proof |
| MVP-MEM-05 | member | `/app/events/[eventId]?step=checkin` | preview-only | Attendance/QR proof |
| MVP-MEM-06 | member | `/app/points` | partial | Real points ledger and award authority |
| MVP-LDR-01 | leader | `/leader?view=overview` | built shell / partial data | Production leader proof |
| MVP-LDR-02 | leader | `/leader?view=events`, attendance | partial | Real event/attendance data |
| MVP-LDR-03 | leader | `/leader?view=leaderboard` | partial | Real points ledger |
| MVP-STF-01 | coach/staff | `/staff?view=chapters` | built shell / partial data | Production staff proof and real portfolio data |
| MVP-STF-02 | coach/staff | staff event/leaderboard views | partial | Real event/points readback |
| MVP-STF-03 | coach/staff | `/staff?view=admin` | partial | Role proof and admin authority |
| MVP-ADM-01 | admin | `/admin/users`, `/admin/chapters`, `/admin/access` | partial | Owner CSVs and production rows |
| MVP-ADM-02 | admin | `/admin/launch-gate` | staged | Missing production evidence |
| MVP-DSA-01 | DS admin | `/admin`, embedded admin | built shell / partial ops | Production DS admin route proof |
| MVP-DSA-02 | DS admin | audit/outbox/integrations/API/MCP | partial / preview-only | Provider/outbox/audit proof |
| MVP-SUP-01 | super admin | cross-shell review | partial | Real production proof by role |
| MVP-SUP-02 | super admin | final invite gate | blocked | Owner data, live counts, signed-in proof, pilot proof |

## Launch Truth Summary

### Built Or Strong Local Review

- Shared `/login` entry.
- Member `/app`, `/app/events`, `/app/stories`, `/app/points`, `/profile`.
- Member event detail route with RSVP, check-in, and points preview steps.
- Leader `/leader` shell and menu family.
- Staff `/staff` shell and secondary nav.
- Admin `/admin` dark shell/menu family and route-level review pages.
- Smoke coverage for major launch routes.
- Readiness services that keep production launch gates explicit.

### Preview-Only Or Mock-Safe

- RSVP, check-in, attendance, and points loops.
- Member Stories/feed and proof/story interactions.
- Leader create-event, committees, member profile, support/culture, training,
  values, succession, bridge/video/story surfaces.
- Staff campaigns, proof/UGC, best practices, campaign SOPs.
- DS Admin integrations, API keys, MCP Connections, System Health, Audit Logs,
  module/provider controls.
- SLT Prep routes.

### Blocked

- Real production owner data and rollout packet.
- Production live data counts.
- Real signed-in proof for member, leader, staff/support, DS/admin.
- Real pilot event proof for RSVP, attendance, points, audit, and zero-send.
- Final invite gate.
- Live provider writes or sends.
- Browser-facing production writes.

### Rollout Gaps

- Owner-returned CSVs remain the first external evidence blocker.
- HubSpot/Luma exports can only fill specific data gaps, not replace app proof.
- Supabase/myMEDLIFE live readback is still required for live counts and app
  truth.
- Signed-in route proof must be collected from real production accounts.
- Audit/outbox zero-send proof must come from real pilot activity.

## Duplicate Stories Across Routes Or Roles

- Proof appears as member submission, leader review, staff moderation, admin
  evidence, and rollout proof. These must stay separate.
- Events appear as member event discovery, leader event operations, staff event
  monitoring, admin Luma mapping, and rollout pilot proof. These must stay
  separate.
- Points appear as member readback, leader leaderboard, staff leaderboard,
  admin policy, and rollout proof. These must stay separate.
- Admin appears both as standalone DS Admin and embedded Staff -> Admin. The
  story set should keep staff handoff separate from DS admin authority.

## Stories That Are Too Large And Should Be Split

- "Member app" should split into home/nav, events, RSVP, check-in, points,
  stories, profile, and SLT entry.
- "Leader command center" should split into overview, events/attendance,
  leaderboard, member/profile handoff, create event, committees/tasks, and
  training/culture/succession.
- "Staff command center" should split into chapters/portfolio, campaigns,
  proof/UGC, best practices, campaign SOPs, admin handoff, and staff event/points
  readback.
- "Admin backend" should split into shell/menu, users/chapters/access, launch
  gate, audit/outbox, integrations/API/MCP, system health, and write-readiness.

## Stories That Are Too Vague

- "Proof" needs acceptance criteria for source, consent, storage, moderation,
  publishing, audit, and evidence exclusions.
- "Points" needs acceptance criteria for readback versus award authority.
- "Production readiness" needs acceptance criteria for owner CSVs, live counts,
  signed-in proof, pilot proof, audit/outbox, and final gate.
- "Integrations" needs acceptance criteria for read-only status, no direct
  provider writes, outbox contract, retry/replay rules, and secrets handling.

## Missing Narrow-Launch Stories

These should be added as delivery backlog items before launch can be called
ready:

1. Production signed-in route proof capture by role.
2. Owner CSV intake and validation.
3. Production live data count readback.
4. Luma read-only mapping proof.
5. Pilot event proof for RSVP, attendance, points, audit, and zero-send.
6. Audit/outbox zero-send evidence from real pilot activity.
7. Mobile/device QA sign-off for the member event loop.
8. TEST-label removal/replacement gate for any production-visible rows.

## UI Coverage Without Enough Operating Or Data Proof

- Member event loop looks complete enough to demo, but real RSVP/check-in/points
  proof is missing.
- Leader create-event and event operations are visible, but live event writes
  and Luma actions are blocked.
- Staff portfolio and campaign surfaces look operational, but real intervention,
  export, provider, and production chapter data are missing.
- Admin shell looks demo-ready, but API/MCP/provider/module/user/chapter writes
  are blocked.
- Stories/proof/UGC surfaces look rich, but real consent/storage/moderation is
  not complete.

## Prioritized Narrow-Launch Gap Report

1. Validate owner-returned CSVs when they arrive.
2. Build or refresh production rollout packet from approved real data only.
3. Capture production live data counts from Supabase/myMEDLIFE.
4. Capture production signed-in route proof for member, leader, staff/support,
   and DS/admin.
5. Capture Luma read-only mapping proof for pilot event loop.
6. Run controlled pilot proof for RSVP, attendance, points, audit, and outbox
   zero-send.
7. Complete mobile/device QA for the member app event loop.
8. Run final invite gate only after all evidence is present.

## Recommended Next-Step Sequence For Delivery Backlog

### Step 1 - Story Triage

- Adopt the IDs in `narrow-launch-mvp-stories.md` as the MVP story spine.
- Map each story to one owner lane: #1 member UI, #2 leader UI, #3 staff/admin
  UI, data/safety lane, #4 QA, #5 planning, or #3 rollout evidence depending on
  the current team split.
- Keep rollout evidence stories separate from UI stories.

### Step 2 - Acceptance Criteria Tightening

- For each UI story, add route smoke and source-fidelity acceptance checks.
- For each data/auth story, add proof-source and TEST/sandbox exclusion checks.
- For each write/integration story, add fail-closed and no-provider-write checks.

### Step 3 - Implementation Backlog

- Finish shell fidelity/control honesty for any route still drifting from
  exported Figma/source.
- Keep all live write/provider work blocked until a matching safety contract and
  approval exist.
- Do not combine UI shell PRs with production evidence or provider access work.

### Step 4 - Rollout Evidence Backlog

- Wait for real owner data before claiming rollout progress.
- Use HubSpot/Luma only as read-only/static support when a specific field gap
  proves it is needed.
- Collect production proof in the order: packet, live counts, signed-in routes,
  pilot proof, audit/outbox zero-send, final gate.

## What The Tech Team Can Build Next From This Output

- A story-to-test traceability table that links MVP story IDs to route/component
  tests.
- Separate delivery tickets for member event-loop production proof, leader
  event/attendance proof, staff portfolio proof, and DS/Admin launch gate proof.
- A QA checklist that verifies every visible fake row is TEST-labeled.
- A rollout evidence checklist that refuses local/sandbox/Figma/TEST proof.

## Matrix Note

This gap report is planning/documentation only. It should not move readiness
percentages by itself.
