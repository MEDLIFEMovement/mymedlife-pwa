# myMEDLIFE Narrow Launch MVP Stories

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Linear planning reference: MED-512
Purpose: provide a cleaned, MVP-ready story set for the narrow launch lane,
without overstating production readiness.

Repo-truth checkpoint: derived from the refreshed master inventory compared
against this repo checkout on `origin/main` commit `86d378c` (`Add next shell
slice briefs (#517)`). Current main includes the repo-truth story package,
builder delivery map, member home/profile continuity, member Stories feed
parity, member event/points return continuity, embedded Admin review posture,
admin command center return cues, and next-shell slice brief planning.

## MVP Scope Frame

The narrow launch lane is:

- login
- member app
- leader command center
- staff preview/support
- DS Admin/admin review surfaces
- events
- RSVP
- QR/check-in
- attendance
- points
- simple leaderboards

Everything else should stay visible only when source-backed, and should remain
read-only, preview-only, disabled, or future-wired until separately approved.

## Current Builder Ownership

- `#1` owns General Member App continuity.
- `#2` owns Student Leadership / Chapter Command Center continuity.
- `#3` owns Staff / DS Admin shell continuity, not rollout packet or invite-gate
  evidence.
- `#4` owns release watch, focused checks, visual QA, and no-write smoke
  classification.
- `#5` owns planning, story audit, backlog grooming, and stale-steering repair.

## MVP Story Writing Rules

- Use: "As a [persona], I want [capability] so that [outcome]."
- Keep one user outcome per story.
- Include route/surface evidence.
- Acceptance criteria must be observable in the app or in readiness tooling.
- Never mark a story production-ready from local, TEST, sandbox, Figma, smoke,
  screenshot, or preview evidence alone.

## Story Status Summary

| Status | Launch Meaning |
| --- | --- |
| Built shell | User can see and navigate the surface. |
| Partial | User path exists but real data/auth/proof/write readiness is missing. |
| Preview-only | User can review the intended behavior, but actions are blocked. |
| Blocked | Story cannot support launch until named evidence or approval exists. |

## Current MVP Story Spine

| Persona | MVP IDs | Current repo-truth summary |
| --- | --- | --- |
| member | `MVP-MEM-01` through `MVP-MEM-06` | Member shell, home/profile, Stories, events, and points are reviewable; RSVP/check-in/attendance writes and real points authority remain blocked. |
| leader | `MVP-LDR-01` through `MVP-LDR-03` | Leader command center is visible and active route-continuity work is underway; event/attendance/leaderboard data remains partial and write-blocked. |
| coach/staff | `MVP-STF-01` through `MVP-STF-03` | Staff shell is reviewable; chapter drawer/admin continuity is still constrained by #503 until that branch clears. |
| admin | `MVP-ADM-01` through `MVP-ADM-02` | Admin review and launch-gate posture are visible/staged; owner CSVs, production rows, invites, and gate advancement remain blocked. |
| DS admin | `MVP-DSA-01` through `MVP-DSA-02` | Dark admin shell and safety surfaces are reviewable; provider/API/MCP/audit/outbox live operations remain blocked. |
| super admin | `MVP-SUP-01` through `MVP-SUP-02` | Cross-shell review is partial; final invite approval is blocked until real production evidence exists. |

## Member MVP Stories

### MVP-MEM-01 - Sign In And Route To Member App

As a member, I want to sign in and land in the member app so that I can start
from the right workspace.

Route/surface: `/login`, `/app`
Current readiness: partial
Production note: requires real member account proof.

Acceptance criteria:

- `/login` is the single sign-in entry point.
- Member role lands on `/app`.
- Non-member roles do not access member-only surfaces unless in approved preview.
- Preview cookie/local actor proof is not production signed-in proof.

### MVP-MEM-02 - See Member Home And Bottom Navigation

As a member, I want a mobile home with clear navigation so that I can reach
events, stories, points, and profile quickly.

Route/surface: `/app`
Current readiness: built shell, mock-safe data
Production note: fake visible content must be TEST-labeled.

Acceptance criteria:

- Home, Events, Stories, Points, and Profile navigation remain visible and
  source-faithful.
- Every visible nav item routes somewhere real or is clearly blocked.
- Fake member/chapter/event/story/points data shows `TEST` where applicable.
- No route smoke or screenshot is counted as rollout proof.

### MVP-MEM-03 - Browse Launch Events

As a member, I want to browse launch events so that I can choose where to show
up next.

Route/surface: `/app/events`
Current readiness: partial
Production note: real event source and chapter mapping still required.

Acceptance criteria:

- Member can open `/app/events` from the app shell.
- Event cards include clear date/time/location/context.
- Event cards route to event detail.
- TEST/mock events are excluded from production evidence.

### MVP-MEM-04 - RSVP In Preview-Safe Flow

As a member, I want to RSVP from event detail so that I can understand the
intended attendance loop.

Route/surface: `/app/events/[eventId]?step=rsvp`
Current readiness: preview-only
Production note: production RSVP writes are blocked.

Acceptance criteria:

- RSVP state is route-backed.
- The UI does not claim that a live RSVP was saved unless a real write path is
  approved and proven.
- Luma/provider sharing/reminders stay blocked.
- Real rollout readiness requires RSVP readback proof.

### MVP-MEM-05 - Check In And See Attendance Preview

As a member, I want to check in through a QR/attendance preview so that I can
understand how attendance will lead to points.

Route/surface: `/app/events/[eventId]?step=checkin`
Current readiness: preview-only
Production note: production attendance writes are blocked.

Acceptance criteria:

- Check-in route is reachable from event RSVP/detail.
- QR/check-in is visibly preview-safe.
- No control silently records attendance.
- Real launch requires approved attendance source and audit/readback proof.

### MVP-MEM-06 - See Points And Simple Leaderboard

As a member, I want to see points and a simple leaderboard so that event impact
is understandable.

Route/surface: `/app/points`
Current readiness: partial
Production note: real points ledger and award authority are missing.

Acceptance criteria:

- `/app/points` opens from bottom nav and event handoff.
- Points and leaderboard are readable.
- No Smile.io, rewards, provider sync, or live award claim appears without
  proof.
- TEST/mock points are not production proof.

## Leader MVP Stories

### MVP-LDR-01 - Open Leader Overview

As a leader, I want a chapter command center overview so that I can see chapter
health and next priorities.

Route/surface: `/leader?view=overview`
Current readiness: built shell, partial real data
Production note: requires real leader signed-in proof.

Acceptance criteria:

- Leader route is role-gated.
- Overview and menu structure preserve the exported/Figma shell.
- Fake metrics/member names are TEST-labeled where applicable.
- Production readiness requires real leader account/role proof.

### MVP-LDR-02 - Review Event And Attendance Status

As a leader, I want event and attendance views so that I can follow up on
participation.

Route/surface: `/leader?view=events`, `/leader?view=attendance`
Current readiness: partial
Production note: real event and attendance data missing.

Acceptance criteria:

- Event and attendance menu items are route-backed.
- Create, edit, attendance import, and follow-up controls are blocked or
  preview-only.
- Attendance data does not imply production truth without approved rows.
- Leader can navigate to leaderboard/overview.

### MVP-LDR-03 - View Leaderboard Readback

As a leader, I want a simple leaderboard so that chapter momentum is visible.

Route/surface: `/leader?view=leaderboard`
Current readiness: partial
Production note: production points ledger is not approved.

Acceptance criteria:

- Leaderboard route opens and renders ranked rows.
- Point mutation, export, rewards, and provider sync controls stay blocked.
- TEST/mock member rows are labeled.
- Real movement requires ledger and route proof.

## Coach / Staff MVP Stories

### MVP-STF-01 - Open Staff Chapter Portfolio

As coach/staff, I want to open a chapter portfolio so that I can identify where
support is needed.

Route/surface: `/staff?view=chapters`
Current readiness: built shell, partial real data
Production note: requires real staff/support signed-in proof.

Acceptance criteria:

- Staff route is role-gated.
- Portfolio table, filters, and chapter detail handoffs are visible.
- Intervention, notes, export, reminders, and survey sends stay blocked.
- TEST/mock chapters/metrics remain visibly marked.

### MVP-STF-02 - Review Staff Event And Points Readback

As coach/staff, I want event, RSVP, attendance, and points readback so that I
can support chapters without creating live records.

Route/surface: `/staff?view=events`, `/staff?view=leaderboard`,
`/staff?view=chapters`
Current readiness: partial
Production note: real event/points proof missing.

Acceptance criteria:

- Staff event/leaderboard/chapter views are route-backed.
- Event and points totals are readable.
- Export, provider sync, proof ingestion, and intervention writes stay blocked.
- Production movement requires real live readback and signed-in proof.

### MVP-STF-03 - Use Admin Handoff Safely

As coach/staff, I want admin handoff rules to be clear so that restricted admin
work does not leak into staff preview.

Route/surface: `/staff?view=admin`
Current readiness: partial
Production note: role proof still required.

Acceptance criteria:

- Non-admin staff see safe blocked state.
- Admin-capable actors can preview embedded admin shell.
- Command Center/back affordance returns to staff.
- No staff UI grants admin writes.

## Admin MVP Stories

### MVP-ADM-01 - Review Users, Chapters, And Access

As an admin, I want users, chapters, and access visible so that launch data can
be reviewed before production use.

Route/surface: `/admin/users`, `/admin/chapters`, `/admin/access`
Current readiness: partial
Production note: real owner data still missing.

Acceptance criteria:

- Admin-only routes are guarded.
- Users/chapters/access rows are readable.
- User, role, chapter, invite, and owner-truth mutations stay blocked.
- TEST/Figma/sandbox rows cannot enter rollout packet evidence.

### MVP-ADM-02 - Review Launch Gate

As an admin, I want the launch gate to show what is missing so that the team
does not invite students too early.

Route/surface: `/admin/launch-gate`, readiness services
Current readiness: staged
Production note: final invite gate is blocked.

Acceptance criteria:

- Gate says not live ready while evidence is missing.
- Required owner data, live counts, route proof, pilot proof, audit/outbox, and
  approval blockers are visible.
- Browser writes and external writes remain 0.
- Planning docs do not move the gate.

## DS Admin MVP Stories

### MVP-DSA-01 - Review DS Admin Shell

As a DS admin, I want a dark admin shell with complete menu families so that I
can safely inspect operational posture.

Route/surface: `/admin`, embedded `/staff?view=admin`
Current readiness: built shell, partial operations
Production note: demo-safe if controls remain blocked.

Acceptance criteria:

- Overview, Users, Chapters, Modules, Luma Events, Points, Integrations, Audit
  Logs, System Health, API Keys, MCP Connections, and Settings remain visible
  where source-backed.
- Command Center/back affordance works in embedded staff admin.
- API/MCP/provider/write controls are blocked, masked, or preview-only.
- Fake/mock admin content is TEST-labeled.

### MVP-DSA-02 - Review Audit / Outbox / Provider Safety

As a DS admin, I want audit, outbox, integrations, API keys, and MCP states
visible so that no live side effect is hidden.

Route/surface: `/admin/audit-log`, `/admin/integration-outbox`, `/admin`,
`/admin/integrations/luma`
Current readiness: partial/preview-only
Production note: provider writes remain blocked.

Acceptance criteria:

- Audit and outbox routes/panels are visible.
- Send, retry, replay, dead-letter, provider sync, API key reveal/rotate, and
  MCP write/connect controls do not run live.
- Secrets are never displayed.
- Real pilot proof must include audit/outbox zero-send evidence.

## Super Admin MVP Stories

### MVP-SUP-01 - Review Cross-Shell Launch Posture

As a super admin, I want to review member, leader, staff, and admin shells so
that I can understand launch posture before approval.

Route/surface: `/app`, `/leader`, `/staff`, `/admin`
Current readiness: partial
Production note: cross-shell preview is not production proof.

Acceptance criteria:

- Super admin review does not bypass role/data/write gates.
- Shells stay source-faithful and TEST-labeled where fake.
- Preview access does not create users, invites, role changes, or writes.
- Real route proof is still collected per role.

### MVP-SUP-02 - Hold Final Invite Approval Until Evidence Exists

As a super admin, I want final invite approval blocked until evidence exists so
that student launch is safe.

Route/surface: `/admin/launch-gate`, rollout packet evidence
Current readiness: blocked
Production note: not ready.

Acceptance criteria:

- Owner-returned CSVs are validated.
- Production live counts exist.
- Real signed-in proof exists for member, leader, staff/support, and DS/admin.
- Pilot event proof covers RSVP, attendance, points, audit, and zero-send.
- Coordinator/Nick explicitly approve the final gate.

## Explicit Non-MVP Or Post-MVP Stories

These are valuable, but should not be required for the narrow launch:

- Full Proof/UGC governance and publishing.
- Broad SOP builder/runtime.
- Live HubSpot, Hootsuite, Smile.io, n8n, Shopify, GiveLively, warehouse, or
  Luma writes.
- Full coach intervention write system.
- SLT Prep production travel/payment/form/provider workflow.
- Advanced analytics/warehouse read models.
- Live notification/reminder/send system.

## MVP Launch Truth

Built or strong local review:

- Login route and role-aware shell routing.
- Member, leader, staff, and admin shells.
- Member event detail preview flow.
- Staff and admin route/menu smoke coverage.
- Readiness services and no-write guardrails.

Preview-only or mock-safe:

- RSVP/check-in/attendance loop.
- Points and leaderboards.
- Stories/proof surfaces.
- Leader create-event and task/committee surfaces.
- Staff campaign/proof/SOP surfaces.
- DS Admin integrations/API/MCP/system health.

Blocked before rollout:

- Owner CSV returns and validation.
- Production live data counts.
- Real signed-in route proof.
- Pilot event proof.
- Audit/outbox zero-send production evidence.
- Final invite gate approval.

## Matrix Note

This MVP story set is planning/documentation only. It should not move readiness
percentages by itself.
