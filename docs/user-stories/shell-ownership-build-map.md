# myMEDLIFE Shell Ownership Build Map

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Purpose: turn the repo-truth story package and delivery backlog into durable
long-running ownership lanes for `#1`, `#2`, `#3`, `#4`, and `#5`.

## Sources And Truth Rules

Primary sources:

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/launch-truth-summary.md`
- `docs/user-stories/delivery-backlog.md`
- `docs/user-stories/builder-next-goals.md`
- `docs/user-stories/narrow-launch-gap-priority-table.md`
- `docs/user-stories/member-shell-acceptance-packet.md`
- `docs/user-stories/leader-shell-acceptance-packet.md`
- `docs/user-stories/staff-admin-shell-acceptance-packet.md`

Rules:

- Repo truth wins for implementation status.
- Figma/exported code defines visual intent and acceptance shape.
- Screenshots are acceptance references only.
- Visible fake/sandbox/Figma-derived people, chapters, events, stories, proof
  rows, campaigns, SOPs, audit actors, placeholder owners, provider examples,
  and fake metrics must show `TEST`.
- Shell/UI work can move `Scope/UI` and sometimes `QA/Ops`; it does not prove
  `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## Ownership Map

| Thread | Durable owner lane | Primary shell/routes | Do not touch without Coordinator approval |
| --- | --- | --- | --- |
| `#1` | General Member App | `/app`, `/app/events`, `/app/events/[eventId]`, `/app/points`, `/app/stories`, `/profile`, `/app/slt-prep`, member shell components/tests | `/leader`, `/staff`, `/admin`, auth/session helpers, provider code, rollout evidence |
| `#2` | Student Leadership / Chapter Command Center | `/leader?view=*`, leader shell/menu, leader member/profile, events, attendance, committees, leaderboard, values, succession, training, support/culture components/tests | `/app`, `/staff`, `/admin`, member writes, staff/admin writes, rollout evidence |
| `#3` | Staff / DS Admin shell family | `/staff?view=*`, `/staff?view=admin`, `/admin`, staff chapter drawer, embedded Admin, Proof/UGC, Campaigns, SOPs, dark Admin menu, admin review panels/tests | `/app`, `/leader`, owner CSV apply, invite gate, production proof, provider/API live writes |
| `#4` | Release / QA watch | PR status, checks, public no-write smoke, visual QA, TEST-label review, evidence classification | Product code, implementation files, production/provider access, matrix edits |
| `#5` | Planning / story audit / backlog | story docs, backlog, shell packets, stale-steering repair, acceptance maps | Product code, rollout proof capture, provider/API access, matrix edits |

## #1 General Member App Build Order

| Order | Slice | Module/surface | Likely file families | Acceptance checks | Can move | Must not count as rollout proof |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Member event-to-points continuity | `/app/events` -> event detail -> RSVP/check-in posture -> `/app/points` | `src/app/app/events/*`, `src/app/app/points/page.tsx`, `src/components/figma-member-mobile-home.tsx`, member route tests, e2e smoke | Source-faithful member shell, route-backed event/detail/points path, preview-safe RSVP/check-in/attendance/points copy, visible `TEST` rows | `Scope/UI`, `QA/Ops` if tested/smoked | RSVP writes, attendance writes, points awards, Luma proof, pilot proof |
| 2 | Home-to-profile continuity | `/app` -> `/profile` | `src/app/app/*`, `src/app/profile/page.tsx`, member shell/nav tests | Profile entry is route-backed, private/contact/traveler data is read-only/blocked, fake identity has `TEST` | `Scope/UI`, `QA/Ops` | profile/contact writes, HubSpot sync, production signed-in proof |
| 3 | Stories feed/detail fidelity | `/app/stories` | `src/app/app/stories/page.tsx`, `src/components/figma-member-stories-page.tsx`, story route tests | IG-style feed feel from exported source, preview-only reactions/share/save/comment/publish controls, `TEST` fake stories | `Scope/UI`, `QA/Ops` | consent approval, publishing, provider sync, proof evidence |
| 4 | SLT member-shell handoff | `/app/slt-prep` | `src/app/app/slt-prep/page.tsx`, `src/app/slt-prep/*`, member SLT docs/tests | Reads as a General Member App surface, not live travel/payment workflow; all unfinished controls blocked/preview-only | `Scope/UI`, `QA/Ops` | payments, forms/Drive, Shopify, HubSpot, Luma, Zoom, trip registration, staff approval |
| 5 | Member mobile QA support | mobile `/app` flow | no product files unless assigned; QA notes/screenshots | iPhone/Android route confidence for event/detail/points/home/profile | `QA/Ops` | Data/Auth, Writes/Integrations, Rollout Gate |

## #2 Student Leadership Build Order

| Order | Slice | Module/surface | Likely file families | Acceptance checks | Can move | Must not count as rollout proof |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Service-backed menu/view continuity | `/leader?view=*` | `src/app/leader/page.tsx`, `src/components/figma-leader-command-center.tsx`, `src/components/leader-app-shell.tsx`, leader routing tests | Source-backed menu families visible, direct URLs/reloads preserve view, no hidden unfinished menu items | `Scope/UI`, `QA/Ops` | production role proof, member mutations, event writes |
| 2 | Succession/support/member-profile handoffs | values, succession, training, member/profile | leader support/culture components, `tests/figma-leader-support-screens.test.tsx`, leader page tests | Controls are route-backed or preview-only; fake leaders/members/chapters/examples have `TEST` | `Scope/UI`, `QA/Ops` | succession writes, promotion, assignment, contact sends |
| 3 | Event/attendance follow-through | leader events and attendance | leader command center, event/attendance views/tests | Attendance, committee ownership, and follow-up controls read as read-only/preview-safe | `Scope/UI`, `QA/Ops` | Luma sync, attendance imports, notifications, points awards |
| 4 | Leaderboard/readback polish | leader leaderboard/comparison | leader leaderboard components/tests | Points are readback only; leaderboard fake rows have `TEST`; no award/export authority | `Scope/UI`, `QA/Ops` | point mutations, rewards, production leaderboard proof |
| 5 | Committees/tasks preview honesty | committees, tasks, assignments | leader committee/task panels/tests | Assignment-looking controls remain blocked or preview-only | `Scope/UI`, `QA/Ops` | task writes, role/member mutations, notifications |

## #3 Staff / DS Admin Build Order

| Order | Slice | Module/surface | Likely file families | Acceptance checks | Can move | Must not count as rollout proof |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chapter drawer / embedded Admin loop | `/staff?view=chapters`, `/staff?view=admin` | `src/app/staff/page.tsx`, `src/components/figma-staff-command-center.tsx`, `src/components/staff-app-shell.tsx`, staff tests | Staff top nav, chapter drawer/detail, embedded Admin handoff, and back affordance are coherent and reversible | `Scope/UI`, `QA/Ops` | owner CSV apply, invites, production proof |
| 2 | Proof/UGC review next steps | staff proof/review surfaces | staff command center/proof panels, proof docs/tests | Review/moderation/publish-looking controls are blocked/preview-only; fake proof/UGC rows have `TEST` | `Scope/UI`, `QA/Ops` | proof ingestion, consent approval, publishing, social/provider sync |
| 3 | Staff/Admin walkthrough fidelity | staff top nav + dark Admin menu | staff/admin shell components, `src/components/figma-admin-panel.tsx`, admin tests | Renato-facing walkthrough preserves source-backed staff top nav, dark Admin menu family, Command Center/back affordance | `Scope/UI`, `QA/Ops` | live admin writes, secrets, API/MCP/provider readiness |
| 4 | Integrations/API/MCP blocked-state parity | `/admin`, integrations, API keys, MCP | admin integration/API/MCP panels/tests | Provider verbs are masked, blocked, read-only, or preview-only; no secret exposure | `Scope/UI`, `QA/Ops` | key reveal/copy/rotate/revoke, MCP connect, provider test/send |
| 5 | System Health/Audit/Users/Chapters clarity | admin ops and review panels | admin system health, audit log, users, chapters, access tests | Ops/review panels explain read-only/preview truth and blocked mutations | `Scope/UI`, `QA/Ops` | audit mutation, live repair, user/role/chapter writes, launch gate advancement |

## #4 Release / QA Watch Build Order

| Order | Slice | Surface | Acceptance checks | Can move | Must not count as rollout proof |
| --- | --- | --- | --- | --- | --- |
| 1 | Active PR board classification | current PR wave | Label PRs as green, behind-only, failing, blocked, or needing builder refresh | `QA/Ops` only when tied to checks | mergeability as production readiness |
| 2 | Three-shell visual QA | member, leader, staff/admin shells | Source evidence named, visible `TEST` labels, no silent dead controls, blocked actions stay honest | `QA/Ops` | screenshot-only rollout proof |
| 3 | Public no-write smoke | hosted public routes | Useful route/shell confidence after merge waves | `QA/Ops` | Data/Auth, Writes/Integrations, Rollout Gate |
| 4 | Mobile/member QA | member event/points loop | iPhone/Android where available for `/app`, events, detail, points | `QA/Ops` | production account proof or pilot proof |

## #5 Planning Build Order

1. Refresh this map after the next merge wave.
2. Retire stale steering notes quickly.
3. Keep leader guidance centered on `/leader?view=*` continuity until the shell
   base is stable.
4. Keep `#3` centered on Staff / DS Admin shell ownership, not rollout packet
   ownership.
5. Keep launch-truth language strict: built, preview-only, blocked, and
   rollout-proof are different states.

## Access Boundary

No real access is needed for the shell/UI, TEST-label, visual QA, or planning
work above.

Real access or returned data is needed later for owner CSV validation,
production live counts, production signed-in proof, pilot event proof,
audit/outbox zero-send proof, HubSpot/Luma static export comparisons, and any
provider/API write activation.
