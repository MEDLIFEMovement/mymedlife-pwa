# myMEDLIFE Functionality Map

Date: 2026-07-04

Purpose: give reviewers a plain map from visible app surfaces to the simple backend lane that should own the behavior. This is intentionally not a second tracker; Linear and GitHub remain the execution record.

## Core Workspaces

| Workspace | Route | Shell/component | Primary audience | Guard/source of truth | Current state |
|---|---|---|---|---|---|
| Login | `/login` | login page + login form | all users | session + assigned roles | staging/local auth flow |
| General Member | `/app` | `FigmaMemberMobileHome` | members, committee members, eligible travelers | `canAccessMemberWorkspace`, landing route service | exact Figma shell, local state |
| Student Leader | `/leader` | `FigmaLeaderCommandCenter` | action committee chairs, e-board, student leaders | `canAccessLeaderWorkspace`, landing route service | exact Figma shell, local state |
| Staff / Coach | `/staff` | `FigmaStaffCommandCenter` | sales coaches, staff, sales admin | `canAccessStaffWorkspace`, landing route service | exact Figma shell, local state |
| Admin Backend | `/admin` | admin route family | DS Admin, Super Admin | admin route guards/services | secure review/admin surfaces |
| SLT Prep | `/app/slt-prep`, `/slt-prep/*` | SLT module | eligible travelers/staff | traveler eligibility + role guard | mock/readiness surfaces |

## Launch-Lane Services

| Behavior | Current owner | Routes/shells using it | Write posture |
|---|---|---|---|
| Event discovery/readback | `src/services/member-launch-lane-events.ts`, `src/services/rush-month-event-detail.ts` | `/app`, `/rush-month/events`, leader/staff event cards | read/mock-safe |
| Luma calendar mapping | `src/services/chapter-luma-calendars.ts`, `src/services/chapter-luma-calendar-store.ts` | event surfaces and `/admin/integrations/luma` | server/env only |
| Luma staging loop/status | `src/services/staging-luma-event-loop.ts`, `src/services/admin-luma-integration-status.ts` | event surfaces, `/admin/integrations/luma`, `/admin/integration-outbox` | staging/mock-safe, no production writes |
| RSVP state | `src/services/rush-month-event-rsvp.ts` | member event detail/check-in shell | local/staging-safe unless Luma RSVP flags approved |
| Attendance state | `src/services/launch-lane-event-snapshots.ts`, `src/services/event-loop.ts` | member/leader/staff event views | local/mock-safe |
| Points policy/readback | `src/services/launch-lane-points-policy.ts`, `src/services/launch-lane-points-readback.ts`, `src/services/points-kpi-ledger.ts` | `/app` points, leader/staff leaderboards | read/mock-safe until materialization approved |
| Assignment creation | `src/services/assignment-create-write.ts` | leader assign modal and Rush Month action admin routes | flag-gated, not production |
| Action started | `src/services/action-start-write.ts` | member action detail | flag-gated first-write lane |
| Proof metadata | `src/services/proof-submission-write.ts` | member evidence screens | flag-gated metadata only |
| Leader proof decision | `src/services/leader-proof-decision-write.ts` | leader proof/review surfaces | flag-gated local/staging only |
| Admin user/chapter management | `src/services/admin-management-write.ts`, `src/services/admin-chapter-management-write.ts` | `/admin/users`, `/admin/chapters` | flag-gated, audit required |
| Chapter type classification | `src/services/chapter-type.ts`, admin/staff/leader shell labels | admin chapter list/detail/forms, staff chapter list/detail, leader header | read/staging-safe; hosted RPC persistence later |
| Audit log | `src/services/admin-audit-log-review.ts` | `/admin/audit-log` | readback/review |
| Integration outbox | `src/services/admin-integration-outbox-workspace.ts` | `/admin/integration-outbox` | live sends remain disabled |

## Button Families And Target Behavior

| Button family | Visible in | Intended first backend target | Current status | Next safe implementation step |
|---|---|---|---|---|
| Create/Stage Event | `/leader`, `/staff` | local myMEDLIFE event, then approved Luma staging create/update | `placeholder_blocked` | use `/admin/integrations/luma` for provider readiness before write controls |
| RSVP | `/app`, event detail | local RSVP state, then approved Luma RSVP writeback | `placeholder_blocked` | prove one staging RSVP with no email send |
| Check-in / attendance | `/app`, leader/staff event views | local attendance state, then Luma attendance import | `placeholder_blocked` | import staging attendance readback only |
| Points / leaderboard | `/app`, `/leader`, `/staff`, `/admin` | points policy/readback services | `wired_staging` | materialize only after audit and duplicate handling |
| Submit evidence | `/app`, campaign/action detail | proof metadata service | `placeholder_blocked` | metadata first, uploads later |
| Review evidence | `/leader`, `/staff` | leader proof decision/HQ review services | `placeholder_blocked` | approve/request-changes staging proof loop |
| Assign task/action | `/leader`, Rush Month admin surfaces | assignment create service | `placeholder_blocked` | flag-gated leader assignment write |
| Promote emerging leader | `/leader` | future role/pipeline update service | `placeholder_blocked` | product decision on promotion model |
| Feed/story sharing | `/app`, `/leader`, `/staff` | feed/outbox/proof sharing services | `placeholder_blocked` | consent and moderation gate first |
| NPS send / content send | `/staff` | external-send outbox | `placeholder_blocked` | keep disabled until send policy approved |
| Luma provider setup | `/admin/integrations/luma` | secret-free provider status and outbox safety service | `wired_staging` | keep create/update/import controls blocked until separately approved |
| API keys / integrations | `/admin` | server-only secret/provider abstraction | `needs_decision` | keep raw-key entry out of browser routes |

## Route Guard Contract

- Workspace routes must use actual actor/session role data; hidden UI is not the security boundary.
- Staff/admin preview is read-only by default and must never submit, approve, reject, message, trigger integrations, or write data.
- Admin routes that expose users, chapters, integrations, audit logs, system health, API keys, or permissions require DS Admin or Super Admin.
- Luma provider setup must remain server-only. Raw keys must never appear in browser state, logs, audit details, normal rows, screenshots, or docs.

## Current PR Repair Note

The old MED-494 PR #125 is not the clean path forward: it is a draft and currently has 86 merge conflicts against `main`. The safer production direction is to extract the event/Luma/points behavior into small new PRs on top of the current Figma shell branches.
