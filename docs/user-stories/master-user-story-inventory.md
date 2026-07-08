# myMEDLIFE Master User Story Inventory

Date: 2026-07-07
Owner lane: myMEDLIFE #5, planning/docs only
Linear planning reference: MED-512
Purpose: capture current repo implementation truth as user stories, then make
the built/partial/preview-only/blocked line clear for MVP planning.

## Source Rules

- Repo implementation truth wins for current status.
- Figma/exported code and #5 source maps define intended visual and navigation
  shape, not production readiness.
- Screenshots/mockups are acceptance references only.
- Linear references in repo docs are scope signals only.
- Local, sandbox, Figma, preview, TEST, staging, smoke, or demo evidence never
  counts as production rollout proof.
- Visible fake/sandbox/Figma-derived rows must keep `TEST` visible until they
  are replaced by approved real data or hidden.

## Sources Inspected

- Repo truth refresh checked against this repo checkout on `origin/main` commit
  `bc091ee` (`Add shell acceptance planning packets (#501)`), which includes
  the recent member event return continuity, member points continuity, member
  stories reader preview honesty, leader live-route continuity, staff proof
  review next steps, staff chapter drawer follow-through, embedded admin back
  affordance, and shell acceptance packet work.
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/AGENTS.md`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/docs/01-one-page-brief.md`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/docs/02-user-stories.md`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/docs/functionality-map.md`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/app`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/static-route-metadata.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/launch-lane-auth-readiness.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/mvp-coverage-checklist.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/write-readiness.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/production-launch-gate.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/src/services/production-signed-in-route-proof-readiness.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/e2e/launch-smoke.spec.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/member-launch-lane-events.test.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/launch-lane-points-readback.test.ts`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/member-stories-profile-pages.test.tsx`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/leader-page.test.tsx`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/staff-page.test.tsx`
- `/Users/codex/Documents/Codex/2026-07-06/new-chat/mymedlife-staff-admin/tests/admin-control-center.test.ts`
- `/Users/codex/Documents/Codex/2026-07-06/ca/outputs/mymedlife-readiness-matrix-2026-07-06.md`
- `/Users/codex/Documents/Codex/2026-07-06/mymedlife-5/docs/figma-production-build-plan.md`
- `/Users/codex/Documents/Codex/2026-07-06/mymedlife-5/docs/real-data-source-to-rollout-evidence-crosswalk.md`

## External User-Story Guidance Status

The local scan found the repo's own story-writing standard in
`docs/02-user-stories.md`. No separate attached external user-story guidance
document was available in this workspace. This inventory uses
`docs/02-user-stories.md` for story format and acceptance-criteria quality, but
does not use it as proof that a feature is implemented.

## Status Key

| Status | Meaning |
| --- | --- |
| `built` | Route/shell/control exists and is route-backed enough to review locally. |
| `partial` | Important route or service exists, but data/auth/write/production proof is incomplete. |
| `preview-only` | Visible UI exists for review, but actions are intentionally read-only, disabled, or blocked. |
| `mock-safe` | Demonstrable with local/mock/TEST data only and excluded from production proof. |
| `staged` | Safety contract, readiness service, or future write/readiness path exists, but live behavior is not enabled. |
| `blocked` | Product direction is visible, but launch/use is blocked by missing approval, real data, proof, or integration contract. |
| `not implemented` | No meaningful route/service evidence found for the story in the current repo truth pass. |

## Current Implementation Truth

Current builder ownership for this story package:

- `#1` owns General Member App shell continuity: member home, events, event
  detail, RSVP/check-in posture, points visibility, stories, profile, and SLT
  entry.
- `#2` owns Student Leadership / Chapter Command Center continuity: broader
  `/leader?view=*` menu/view restoration first, then member/profile, event,
  attendance, leaderboard, values, succession, and training handoffs.
- `#3` owns Staff / DS Admin shell continuity: staff Chapters loop, chapter
  drawer, embedded Admin, Proof / UGC, Best Practices, Campaign SOPs, and dark
  Admin review surfaces. `#3` is not the rollout packet, owner CSV, or
  invite-gate evidence owner in the current shell model.
- `#4` owns PR watch, focused browser checks, visual QA, and no-write smoke
  classification.
- `#5` owns repo-truth planning, story audit, backlog grooming, and stale
  steering repair.

### Member Stories

#### MEM-001 - Sign In And Land In Member App

As a member, I want to sign in once and land in the member app so that I can
start from the correct workspace.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/login`, `/app` |
| Current status | `partial` |
| Repo evidence | `src/app/login/page.tsx`, `src/app/app/page.tsx`, `src/app/app/member-mobile-shell-page.tsx`, `src/services/launch-lane-auth-readiness.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real production member account, approved role/profile rows, signed-in route proof. |
| Local/read-only/production note | Local preview and sandbox review supported; not production-ready proof. |

Acceptance criteria:

- Signed-out visitors are routed to `/login`.
- A member or preview member can open `/app`.
- Non-member actors are redirected to their correct landing route.
- Production readiness requires real account proof, not preview cookie or TEST user proof.

Launch-readiness note: route shell is working, but production signed-in proof is
still missing.

#### MEM-002 - See Member Home And Next Action

As a member, I want to see my current home, next action, events, points, and
navigation so that I know what to do next.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app` |
| Current status | `built` for shell, `mock-safe` for data |
| Repo evidence | `src/components/figma-member-mobile-home.tsx`, `src/app/app/member-home-page.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/figma-production-build-plan.md` |
| Dependencies / blockers | Real member/chapter/event rows and production account proof. |
| Local/read-only/production note | Uses preview/mock-safe data today; visible fake data must stay `TEST` labeled. |

Acceptance criteria:

- Member bottom navigation remains visible and source-faithful.
- Home routes to events, stories, points, and profile without silent dead taps.
- Fake member, chapter, story, or event content is visibly marked `TEST`.
- No local home screenshot is treated as rollout proof.

Launch-readiness note: good shell coverage, but real launch data and signed-in
proof are still missing.

#### MEM-003 - Browse Events

As a member, I want to browse upcoming events so that I can choose the next
chapter activity.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/events` |
| Current status | `partial` |
| Repo evidence | `src/app/app/events/page.tsx`, `src/components/figma-member-mobile-home.tsx`, `src/services/member-launch-lane-events.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Approved real event rows, chapter mapping, production account proof. |
| Local/read-only/production note | Event list is reviewable with preview data; not production event proof. |

Acceptance criteria:

- `/app/events` loads from the member shell.
- Event cards route to event detail.
- The route preserves the Figma mobile app navigation pattern.
- TEST/mock event rows cannot populate rollout evidence.

Launch-readiness note: event browsing exists, but real event source and proof are
not complete.

#### MEM-004 - RSVP To An Event

As a member, I want to RSVP to an event so that my chapter knows I plan to
attend.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/events/[eventId]?step=rsvp` |
| Current status | `preview-only` |
| Repo evidence | `src/app/app/events/[eventId]/page.tsx`, `tests/e2e/launch-smoke.spec.ts`, `src/services/member-launch-lane-events.ts` |
| Dependencies / blockers | Approved RSVP write path, Luma/provider boundary, audit/readback proof. |
| Local/read-only/production note | Browser can walk the RSVP preview; it does not prove live RSVP write readiness. |

Acceptance criteria:

- RSVP state is route-backed and visibly understandable.
- The UI must not imply a production RSVP was written unless real write proof exists.
- Luma sharing/reminder/provider controls stay disabled or preview-only.
- Production RSVP proof requires real rows and audit/outbox evidence.

Launch-readiness note: strong preview route, blocked for production writes.

#### MEM-005 - Check In With QR / Attendance Preview

As a member, I want to check in at an event so that attendance can count toward
points.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/events/[eventId]?step=checkin` |
| Current status | `preview-only` |
| Repo evidence | `src/app/app/events/[eventId]/page.tsx`, `tests/e2e/launch-smoke.spec.ts`, `src/services/launch-lane-event-snapshots.ts` |
| Dependencies / blockers | Real check-in/attendance source, approved QR path, audit proof. |
| Local/read-only/production note | QR/check-in is preview-safe; not a real attendance record. |

Acceptance criteria:

- Check-in step is reachable from event detail.
- QR/check-in UI is clearly preview-only unless a live path is approved.
- Confirm check-in must not silently write attendance.
- Attendance proof requires real event and audit/readback evidence.

Launch-readiness note: route exists, live attendance is blocked.

#### MEM-006 - See Points And Simple Leaderboard

As a member, I want to see my points and chapter leaderboard so that I
understand event impact and recognition.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/points` |
| Current status | `partial` |
| Repo evidence | `src/app/app/points/page.tsx`, `src/services/launch-lane-points-readback.ts`, `tests/launch-lane-points-readback.test.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real points ledger, award authority, duplicate handling, production proof. |
| Local/read-only/production note | Readback exists with mock/sandbox data; point awards are not production truth. |

Acceptance criteria:

- `/app/points` displays points and leaderboard readback.
- Points hand off back to events for earning opportunities.
- UI does not claim Smile.io/rewards/provider sync or production awards.
- TEST/mock points cannot count as rollout proof.

Launch-readiness note: useful readback exists; real ledger authority remains
blocked.

#### MEM-007 - Read MEDLIFE Stories Feed

As a member, I want to browse MEDLIFE stories so that I can see mission moments
without accidentally publishing or changing content.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/stories` |
| Current status | `preview-only` |
| Repo evidence | `src/app/app/stories/page.tsx`, `src/components/figma-member-mobile-home.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/member-stories-ig-feed-source-fidelity-handoff.md` |
| Dependencies / blockers | Consent/storage/governance model, real story/proof source, moderation. |
| Local/read-only/production note | Story data is preview content and must be TEST-labeled where fake. |

Acceptance criteria:

- Stories route preserves exported/Figma mobile feed intent.
- Reactions, saves, shares, comments, and publishing are read-only, blocked, or preview-only.
- Story/proof identity does not imply real consent or production evidence.
- TEST/Figma story content stays excluded from rollout proof.

Launch-readiness note: visible and reviewable, not production content governance.

#### MEM-008 - View Profile And Role Context

As a member, I want to see my profile and role context so that I understand who
I am in myMEDLIFE without exposing private data.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/profile` |
| Current status | `partial` |
| Repo evidence | `src/app/profile/page.tsx`, `src/services/local-actor-context.ts`, `tests/e2e/launch-smoke.spec.ts`, `docs/member-stories-profile-control-honesty-acceptance-checklist.md` |
| Dependencies / blockers | Real profile data, privacy rules, profile edit authority, production account proof. |
| Local/read-only/production note | Profile review is read-only/local-safe today. |

Acceptance criteria:

- Member profile route opens from bottom nav.
- Private contact, emergency, traveler, or SLT profile writes are blocked unless approved.
- Fake profile names stay visibly `TEST`.
- Local actor/profile evidence does not count as production signed-in proof.

Launch-readiness note: profile visibility exists; profile write/privacy proof is
not complete.

#### MEM-009 - Open SLT Prep From Member App

As an eligible traveler, I want SLT Prep reachable inside the member app so that
trip readiness is visible without leaving the student app context.

| Field | Value |
| --- | --- |
| Persona | member |
| Route / surface | `/app/slt-prep`, `/slt-prep/*` |
| Current status | `preview-only` |
| Repo evidence | `src/app/app/slt-prep/page.tsx`, `src/app/slt-prep/*`, `docs/slt-prep-figma-source-map.md`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real traveler data, payment/forms/provider boundaries, staff approval model. |
| Local/read-only/production note | SLT routes are visible but must not imply travel/payment readiness. |

Acceptance criteria:

- `/app/slt-prep` keeps the member-shell entry/handoff.
- Standalone `/slt-prep/*` routes remain preview-safe.
- Payments, forms/Drive, Shopify, HubSpot, Luma, Zoom, reminders, notifications, staff approval, flight submission, and trip registration stay blocked/read-only.
- TEST/mock traveler data never counts as production proof.

Launch-readiness note: outside narrow first launch unless Coordinator expands
scope.

### Leader Stories

#### LDR-001 - Open Leader Command Center

As a leader, I want to open the chapter command center so that I can understand
chapter health and priorities.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=overview` |
| Current status | `built` for shell, `partial` for real data |
| Repo evidence | `src/app/leader/page.tsx`, `src/components/figma-leader-command-center.tsx`, `src/services/leader-command-center-routing.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real leader account, chapter-scoped member/event/points data. |
| Local/read-only/production note | Preview actor proof is not production signed-in proof. |

Acceptance criteria:

- Leader route is role-gated.
- Overview/menu structure stays source-faithful.
- Metrics use TEST/mock labels where fake.
- Real readiness needs production leader route proof.

Launch-readiness note: strong shell coverage, real data proof missing.

#### LDR-002 - Review Events And Attendance

As a leader, I want to review event performance and attendance so that I can
follow up on chapter participation.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=events`, `/leader?view=attendance` |
| Current status | `partial` |
| Repo evidence | `src/services/events-points-launch-lane.ts`, `src/services/launch-lane-points-readback.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real event, RSVP, attendance, and permissioned chapter data. |
| Local/read-only/production note | Readback is reviewable; attendance mutation is not production-ready. |

Acceptance criteria:

- Event and attendance views are route-backed.
- Event-create or attendance-follow-up controls are blocked/preview-only unless approved.
- Attendance counts are not treated as production truth unless sourced from real approved rows.
- Leader can navigate back to overview/leaderboard.

Launch-readiness note: visible route coverage exists; operational proof is
missing.

#### LDR-003 - See Chapter And Member Leaderboards

As a leader, I want to see chapter and member leaderboards so that I can
recognize momentum and spot gaps.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=leaderboard`, `/leader?view=members` |
| Current status | `partial` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `src/components/figma-leader-command-center.tsx`, `src/services/launch-lane-points-readback.ts` |
| Dependencies / blockers | Real points ledger and award authority. |
| Local/read-only/production note | Local leaderboards are readback only. |

Acceptance criteria:

- Leaderboard surfaces route correctly.
- Leaderboard mutation, point awards, rewards, and exports stay blocked.
- Fake member/chapter names remain `TEST` labeled where applicable.
- Production movement requires real ledger proof.

Launch-readiness note: UI exists; production scoring authority missing.

#### LDR-004 - Inspect Member Profile Handoff

As a leader, I want to inspect member profile context so that I can support the
right students without changing private data.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=member_profile` |
| Current status | `preview-only` |
| Repo evidence | `src/components/figma-leader-command-center.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/leader-remaining-controls-parity-acceptance-checklist.md` |
| Dependencies / blockers | Privacy boundary, member profile data permissions, role-scoped access proof. |
| Local/read-only/production note | Profile/action controls must not mutate members. |

Acceptance criteria:

- Member profile handoff opens inside leader shell.
- Promote, role, assignment, contact, proof, or follow-up controls are blocked/read-only.
- Private member data is not exposed beyond approved leader scope.
- TEST profile content stays marked.

Launch-readiness note: review surface exists; data/privacy proof incomplete.

#### LDR-005 - Create Or Stage Events

As a leader, I want to preview event creation so that I understand how event
operations will work before live creation is approved.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=create_event` |
| Current status | `preview-only` |
| Repo evidence | `src/components/figma-leader-create-event-screen.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/functionality-map.md` |
| Dependencies / blockers | Approved local event write, Luma write contract, audit/outbox/readback. |
| Local/read-only/production note | Create-event controls must not create production Luma/myMEDLIFE rows. |

Acceptance criteria:

- Create Event route/panel is visible and route-backed.
- Event publish, Luma sync, reminders, copy/send, and provider controls are disabled or preview-only.
- No button silently succeeds without a write contract.
- Production event creation requires separate approval.

Launch-readiness note: route is useful for review; live creation blocked.

#### LDR-006 - Coordinate Committees And Tasks

As a leader, I want committee and task surfaces so that I can understand
ownership without creating fake assignments.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=committees`, assignment/action-board surfaces |
| Current status | `preview-only` |
| Repo evidence | `src/components/figma-leader-command-center.tsx`, `src/services/write-readiness.ts`, `docs/assignments-action-board-visible-controls-acceptance-checklist.md` |
| Dependencies / blockers | Assignment schema/RLS/write authority, audit/outbox, notification safety. |
| Local/read-only/production note | Task creation/completion is blocked unless separately approved. |

Acceptance criteria:

- Committee/task views remain visible if source-backed.
- Create, assign, complete, escalate, and notify controls do not write.
- Assignment data uses TEST labels where fake.
- Production assignment proof requires real server boundary and audit.

Launch-readiness note: visible planning surface, not live assignment system.

#### LDR-007 - Use Training, Values, Succession, And Culture Support

As a leader, I want training, values, succession, impact, bridge video, and story
resources so that I can strengthen chapter leadership.

| Field | Value |
| --- | --- |
| Persona | leader |
| Route / surface | `/leader?view=training`, `values`, `succession`, `impact`, `bridge_videos`, `stories` |
| Current status | `preview-only` |
| Repo evidence | `src/components/figma-leader-training-screen.tsx`, `src/components/figma-leader-stories-screen.tsx`, `tests/e2e/launch-smoke.spec.ts`, readiness matrix PR notes |
| Dependencies / blockers | Content governance, proof/story consent, member privacy, role-change authority. |
| Local/read-only/production note | Culture/support content is reviewable but not operational truth. |

Acceptance criteria:

- Menu items remain visible and route-backed.
- Share/publish/assign/promote/succession controls are blocked or preview-only.
- Fake leader/member/story content is TEST-labeled.
- No story/proof/training preview becomes rollout evidence.

Launch-readiness note: useful shell fidelity, post-MVP operational depth.

### Coach / Staff Stories

#### STF-001 - Open Staff Portfolio

As coach/staff, I want to open a chapter portfolio so that I can identify which
chapters need support.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=chapters` |
| Current status | `built` for shell, `partial` for real data |
| Repo evidence | `src/app/staff/page.tsx`, `src/components/figma-staff-command-center.tsx`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real coach/staff account, approved chapter portfolio data. |
| Local/read-only/production note | Staff portfolio uses preview/readback data today. |

Acceptance criteria:

- Staff route is role-gated.
- Portfolio overview, chapter table, filters, and detail handoffs are visible.
- Fake chapters/staff actors/metrics stay TEST-labeled.
- Production readiness needs real staff sign-in and chapter data proof.

Launch-readiness note: source-backed shell exists; real rollout data missing.

#### STF-002 - Filter And Inspect Chapters

As coach/staff, I want to filter and inspect chapters so that I can prioritize
interventions.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=chapters` detail drawer |
| Current status | `partial` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `src/services/launch-lane-points-readback.ts`, `src/components/figma-staff-command-center.tsx` |
| Dependencies / blockers | Real portfolio rows, coach assignment data, intervention write approval. |
| Local/read-only/production note | Filters/detail are reviewable; intervention writes blocked. |

Acceptance criteria:

- Filters preserve RSVP, attendance, and points columns.
- Chapter detail opens without losing route context.
- Survey, intervention, note, export, and follow-up actions are preview-only/blocked.
- Staff screenshots do not count as live chapter proof.

Launch-readiness note: useful staff support surface, no live interventions.

#### STF-003 - Review Campaign Operations

As coach/staff, I want campaign operations visible so that I can understand
where chapters are in the launch campaign.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=campaigns`, `/campaigns`, `/campaigns/[campaignSlug]` |
| Current status | `preview-only` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `src/app/campaigns/page.tsx`, `docs/campaigns-rush-month-visible-controls-acceptance-checklist.md` |
| Dependencies / blockers | Real campaign runtime, launch/publish authority, proof/points/write contracts. |
| Local/read-only/production note | Campaign launch/sync/export/publish controls are blocked. |

Acceptance criteria:

- Campaigns route/panel is visible and route-backed.
- Rush Month state does not imply real campaign publish.
- Export, sync, provider, invite, proof, and points controls remain blocked/preview-only.
- TEST campaign instances cannot count as production evidence.

Launch-readiness note: visible planning surface, not live campaign runtime.

#### STF-004 - Review Proof / UGC

As coach/staff, I want proof and UGC review surfaces so that I can see what will
need moderation without pretending review is live.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=proof_ugc`, `/proof-library`, `/proof-library/upload` |
| Current status | `preview-only` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `src/app/proof-library/page.tsx`, `src/app/proof-library/upload/page.tsx`, `docs/proof-evidence-ugc-visible-controls-acceptance-checklist.md` |
| Dependencies / blockers | Consent, storage, moderation, publication, role access, audit. |
| Local/read-only/production note | Proof upload/publish/provider fetch is blocked. |

Acceptance criteria:

- Proof/UGC route is visible and clearly preview-only.
- Upload, import, review, moderate, publish, social/provider sync, and consent approvals do not write.
- Fake proof/story content is TEST-labeled.
- Production proof requires real consent and approved evidence source.

Launch-readiness note: governance preview only.

#### STF-005 - Use Best Practices And Campaign SOPs

As coach/staff, I want best practices and campaign SOPs visible so that I can
review future operating guidance safely.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=best_practices`, `/staff?view=sops` |
| Current status | `preview-only` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `docs/sop-rollout-production-map.md`, `docs/staff-secondary-surfaces-next-pass-acceptance-checklist.md` |
| Dependencies / blockers | Draft/live SOP boundary, approval workflow, versioning, publish/rollback rules. |
| Local/read-only/production note | SOP publish/live activation is blocked. |

Acceptance criteria:

- Best Practices and Campaign SOP menus route to visible panels.
- New SOP, publish, rollback, send, sync, or live activation controls are blocked.
- SOP/sample content is TEST/sample-labeled and excluded from rollout proof.
- Real SOP runtime remains post-MVP.

Launch-readiness note: useful future planning shell, not launch-critical runtime.

#### STF-006 - Enter Admin Handoff Safely

As coach/staff, I want the staff admin handoff to show what is restricted so
that I do not accidentally enter DS/Admin workflows.

| Field | Value |
| --- | --- |
| Persona | coach/staff |
| Route / surface | `/staff?view=admin` |
| Current status | `partial` |
| Repo evidence | `src/app/staff/page.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/renato-admin-demo-pr-acceptance-checklist.md` |
| Dependencies / blockers | Real staff/admin role boundaries and DS/admin proof. |
| Local/read-only/production note | Non-admin staff are blocked/parked; super/admin preview can enter embedded admin. |

Acceptance criteria:

- Non-admin staff see a safe blocked state.
- Admin-capable actors can preview embedded admin without live writes.
- Command Center/back affordance returns to staff shell.
- No role escalation occurs from UI controls.

Launch-readiness note: route honesty exists; production role proof still needed.

### Admin Stories

#### ADM-001 - Review Admin Control Center

As an admin, I want a control center so that I can review readiness without
triggering writes.

| Field | Value |
| --- | --- |
| Persona | admin |
| Route / surface | `/admin`, admin route family |
| Current status | `partial` |
| Repo evidence | `src/app/admin/page.tsx`, `src/components/figma-admin-panel.tsx`, `src/services/mvp-coverage-checklist.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real admin account/role proof, production data, final review evidence. |
| Local/read-only/production note | Admin review is read-only/preview-safe. |

Acceptance criteria:

- Admin route is role-gated.
- Overview/menu items stay visible where source-backed.
- Admin writes, user/role changes, module toggles, and provider actions remain blocked unless approved.
- Local admin review is not rollout proof.

Launch-readiness note: admin shell is strong, operational readiness incomplete.

#### ADM-002 - Review Users, Chapters, And Access

As an admin, I want users, chapters, and access surfaces so that I can audit
who should be in the rollout before any invite gate opens.

| Field | Value |
| --- | --- |
| Persona | admin |
| Route / surface | `/admin/users`, `/admin/chapters`, `/admin/access` |
| Current status | `partial` |
| Repo evidence | `src/app/admin/users/page.tsx`, `src/app/admin/chapters/page.tsx`, `src/app/admin/access/page.tsx`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Owner-returned CSVs, production user/chapter rows, approved role assignments. |
| Local/read-only/production note | Local rows cannot become production owner truth. |

Acceptance criteria:

- Admin can open users, chapters, and access review pages.
- User/role/chapter mutations are blocked or require audited approved path.
- TEST/Figma/sample rows are excluded from owner packet/live counts.
- Production movement requires real owner data and live readback.

Launch-readiness note: review surfaces exist; real data missing.

#### ADM-003 - Review Launch Gate And Release Readiness

As an admin, I want launch gate and release readiness checklists so that go/no-go
decisions are auditable.

| Field | Value |
| --- | --- |
| Persona | admin |
| Route / surface | `/admin/launch-gate`, `/admin/release-readiness`, `/admin/design-qa` |
| Current status | `staged` |
| Repo evidence | `src/services/production-launch-gate.ts`, `src/services/mvp-release-readiness.ts`, `src/services/core-production-launch-readiness.ts`, readiness matrix |
| Dependencies / blockers | Owner CSVs, live counts, signed-in proof, pilot proof, audit/outbox zero-send proof. |
| Local/read-only/production note | Gate is reviewable but verdict remains not live ready. |

Acceptance criteria:

- Gate clearly says launch is not ready while evidence is missing.
- Browser writes and external writes remain 0 unless approved.
- Required evidence classes are visible.
- Final invite gate cannot pass from planning docs or screenshots.

Launch-readiness note: readiness framework exists; rollout evidence blocked.

#### ADM-004 - Review Audit And Outbox

As an admin, I want audit and outbox posture visible so that external actions
are traceable and safely disabled.

| Field | Value |
| --- | --- |
| Persona | admin |
| Route / surface | `/admin/audit-log`, `/admin/integration-outbox` |
| Current status | `partial` |
| Repo evidence | `src/app/admin/audit-log/page.tsx`, `src/app/admin/integration-outbox/page.tsx`, `tests/e2e/launch-smoke.spec.ts`, `docs/functionality-map.md` |
| Dependencies / blockers | Real audit rows from approved flows, outbox idempotency/retry/send contract. |
| Local/read-only/production note | Preview audit/outbox rows are not production evidence. |

Acceptance criteria:

- Audit and outbox routes load for admin/DS actors.
- Retry, replay, send, dead-letter, provider sync, and mutation controls stay blocked.
- Audit entries using sample actors remain TEST-labeled.
- Production pilot proof must include real audit/outbox zero-send evidence.

Launch-readiness note: safety review surface exists; live evidence missing.

### DS Admin Stories

#### DSA-001 - Use Dark DS Admin Shell

As a DS admin, I want a recognizable admin shell so that I can review system
posture quickly.

| Field | Value |
| --- | --- |
| Persona | DS admin |
| Route / surface | `/admin`, embedded `/staff?view=admin` |
| Current status | `built` for shell, `partial` for production ops |
| Repo evidence | `src/components/figma-admin-panel.tsx`, `src/app/admin/page.tsx`, `tests/e2e/launch-smoke.spec.ts`, Renato/admin checklists |
| Dependencies / blockers | Real DS admin route proof, production ops data, provider contracts. |
| Local/read-only/production note | Safe to demo if controls remain blocked/read-only; not operationally live. |

Acceptance criteria:

- Overview, Users, Chapters, Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API Keys, MCP Connections, Settings remain visible where source-backed.
- Embedded admin preserves Command Center/back affordance.
- Menu actions route or switch panels without silent dead controls.
- Fake/mock admin content stays TEST-labeled.

Launch-readiness note: demo-ready shell, not live admin operations.

#### DSA-002 - Review Integrations, API Keys, And MCP Connections

As a DS admin, I want integrations/API/MCP surfaces visible so that I can verify
they are blocked before live use.

| Field | Value |
| --- | --- |
| Persona | DS admin |
| Route / surface | `/admin` panels, `/admin/integrations/luma`, `/admin/integration-outbox` |
| Current status | `preview-only` |
| Repo evidence | `tests/e2e/launch-smoke.spec.ts`, `src/components/figma-admin-panel.tsx`, `docs/admin-backend-remaining-controls-acceptance-checklist.md` |
| Dependencies / blockers | Approved provider contracts, secrets handling, audit/outbox, DS approval. |
| Local/read-only/production note | API keys are masked; provider writes are blocked. |

Acceptance criteria:

- Integrations/API/MCP menu items are visible and explain blocked state.
- API key reveal/copy/rotate/revoke, provider connect, sync, test send, MCP write/connect changes do not run live.
- No secret values are exposed in UI/docs/screenshots.
- Production provider readiness needs separate approval and proof.

Launch-readiness note: control-honesty surface, not live integration readiness.

#### DSA-003 - Review System Health

As a DS admin, I want system health visible so that launch blockers are easy to
see without running live operations.

| Field | Value |
| --- | --- |
| Persona | DS admin |
| Route / surface | `/admin/system-health`, `/admin` System Health panel |
| Current status | `partial` |
| Repo evidence | `src/app/admin/system-health/page.tsx`, `src/components/admin-system-health-review-panel.tsx`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Production monitoring, backup, incident owner, live counts, CI/RLS evidence. |
| Local/read-only/production note | Review-only; no live operational action. |

Acceptance criteria:

- System Health is route-backed.
- Health actions do not mutate production or imply live incident response.
- Missing production health evidence remains visible.
- Public smoke is separate from rollout readiness.

Launch-readiness note: useful review surface; live operational proof missing.

#### DSA-004 - Verify Production Signed-In Proof Readiness

As a DS admin, I want signed-in proof requirements clear so that production
access is validated only with real accounts.

| Field | Value |
| --- | --- |
| Persona | DS admin |
| Route / surface | admin proof/readiness docs and services |
| Current status | `staged` |
| Repo evidence | `src/services/production-signed-in-route-proof-readiness.ts`, `docs/production-signed-in-proof-readiness-acceptance-checklist.md`, readiness matrix |
| Dependencies / blockers | Real member, leader, staff/support, DS/admin production accounts and route evidence. |
| Local/read-only/production note | Local proof cannot satisfy production signed-in proof. |

Acceptance criteria:

- Required routes are `/app`, `/leader?view=overview`, `/staff?view=chapters`, `/admin`.
- Preview-cookie, local sandbox, TEST/Figma, SOP sample, staging, and fake screenshots are blocked as proof.
- Packet/live-count blockers remain explicit.
- No production access is requested by planning docs alone.

Launch-readiness note: readiness checklist exists; actual route proof missing.

### Super Admin Stories

#### SUP-001 - Review Across Member, Leader, Staff, And Admin

As a super admin, I want to review all shell families so that I can understand
the whole launch posture.

| Field | Value |
| --- | --- |
| Persona | super admin |
| Route / surface | `/app`, `/leader`, `/staff`, `/admin`, `/staff?view=admin` |
| Current status | `partial` |
| Repo evidence | `src/services/role-visibility.ts`, `src/services/local-actor-context.ts`, `tests/e2e/launch-smoke.spec.ts` |
| Dependencies / blockers | Real super admin account, route proof, production data packet. |
| Local/read-only/production note | Cross-shell preview is not final production proof. |

Acceptance criteria:

- Super admin can preview allowed review surfaces without unsafe writes.
- Embedded admin handoff is route-backed and reversible.
- No super-admin preview creates production users/invites/data.
- Real proof requires production account route evidence.

Launch-readiness note: strong review posture, no rollout approval by itself.

#### SUP-002 - Approve Final Invite Gate

As a super admin, I want a final invite-gate decision packet so that live
student invitations only happen after proof exists.

| Field | Value |
| --- | --- |
| Persona | super admin |
| Route / surface | `/admin/launch-gate`, rollout packet tooling |
| Current status | `blocked` |
| Repo evidence | `src/services/production-launch-gate.ts`, `src/services/production-rollout-gap-report.ts`, `docs/real-data-source-to-rollout-evidence-crosswalk.md`, readiness matrix |
| Dependencies / blockers | Owner CSVs, live counts, production signed-in proof, pilot proof, audit/outbox zero-send proof, human approval. |
| Local/read-only/production note | No planning artifact, screenshot, or smoke pass opens the invite gate. |

Acceptance criteria:

- Gate requires real owner data and validated evidence.
- TEST/Figma/sandbox/mock/staging data is excluded.
- Provider exports are supporting context only unless approved as specific artifact inputs.
- Final approval is explicit and human-owned.

Launch-readiness note: correctly not ready.

#### SUP-003 - Govern Future Write Promotion

As a super admin, I want browser writes promoted one at a time so that safety
evidence stays auditable.

| Field | Value |
| --- | --- |
| Persona | super admin |
| Route / surface | `/admin/write-sequence`, `/admin/first-write`, write-readiness services |
| Current status | `staged` |
| Repo evidence | `src/services/write-readiness.ts`, `src/services/phase-2-safe-prep.ts`, `src/app/admin/write-sequence/page.tsx`, `AGENTS.md` |
| Dependencies / blockers | Auth/RLS/security evidence, audit/rollback, staging proof, DS approval. |
| Local/read-only/production note | Browser-facing writes remain disabled by default. |

Acceptance criteria:

- Write readiness says writes are disabled unless approved.
- Each future write names tables, audit, integration event, outbox, and rollback needs.
- External sends remain off.
- One write can be promoted only after evidence exists.

Launch-readiness note: important post-MVP safety path, not current launch proof.

## Preview-Only, Mock-Safe, Staged, Or Blocked Stories

High-priority preview/mock/staged stories:

- `MEM-004` RSVP to event: route-backed preview, no production RSVP write.
- `MEM-005` QR/check-in: route-backed preview, no production attendance write.
- `MEM-006` points/leaderboard: readback exists, production award authority missing.
- `MEM-007` stories feed: preview-only until consent/storage/moderation exist.
- `LDR-005` create/stage event: visible but Luma/provider writes blocked.
- `LDR-006` committee/task coordination: visible, no assignment writes.
- `STF-003` campaign operations: visible, no publish/export/sync/invite writes.
- `STF-004` Proof/UGC: visible, no consent/storage/publish path.
- `ADM-003` launch gate: staged/readiness framework, missing evidence.
- `DSA-002` integrations/API/MCP: blocked/preview-only.
- `SUP-002` final invite gate: blocked until real rollout evidence exists.

## Missing Or Underdefined Stories Needed For Narrow Launch

- Production signed-in route proof by persona needs operational execution, not
  just readiness docs.
- Real owner CSV intake and validation stories need to be tied to the story set
  as rollout blockers.
- Member RSVP, check-in, attendance, and points need separate data/proof stories
  so the team does not treat the preview loop as complete.
- Audit/outbox zero-send proof needs a launch-lane story attached to pilot proof.
- Luma read-only mapping proof needs a story separate from broad live Luma writes.
- Device/mobile QA needs explicit launch story coverage for the member app.

## Duplicate Or Oversized Story Signals

- The older `docs/02-user-stories.md` combines `/chapter`, `/rush-month`, and
  current `/app` member behavior. MVP stories should split member home, events,
  RSVP, check-in, points, stories, and profile.
- "Proof" appears across member, leader, staff, admin, and rollout evidence.
  It needs separate stories for proof intake, proof review, proof governance,
  and pilot proof.
- "Admin readiness" is too broad as one story. Split users/chapters/access,
  launch gate, audit/outbox, integrations/API/MCP, and system health.
- "Leader support/culture" is post-MVP unless narrowed to visible menu/preview
  honesty.

## Contradictions And Gaps

- Visible event RSVP/check-in/points flows look close to an operating loop, but
  write/readiness services still block production browser writes.
- Admin/DS surfaces look operational, but API keys, integrations, MCP,
  provider sync, module toggles, users/roles, and system-health actions remain
  read-only or blocked.
- Figma/SOP/story/proof surfaces imply rich content governance, but consent,
  storage, moderation, and production evidence rules are not live.
- The readiness matrix has strong UI/QA progress, but rollout gaps remain:
  owner CSVs, live counts, signed-in route proof, pilot proof, and final invite
  gate.

## Matrix Note

This story inventory is planning/documentation only. It should not move matrix
percentages by itself.
