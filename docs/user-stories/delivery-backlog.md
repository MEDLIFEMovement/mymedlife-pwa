# myMEDLIFE Narrow Launch Delivery Backlog

Date: 2026-07-07
Owner lane: myMEDLIFE #5, planning/docs only
Linear planning reference: MED-512
Purpose: decompose the repo-truth story inventory into PR-sized delivery slices
for the narrow launch lane without overstating production readiness.

## Source And Truth Rules

- Repo implementation truth wins for current status.
- Figma/exported code is the visual and navigation contract, not production
  evidence.
- Local, TEST, sandbox, Figma, screenshot, smoke, and preview evidence never
  counts as rollout proof.
- Visible fake/sandbox/Figma-derived people, chapters, events, stories, proof,
  campaigns, SOPs, audit actors, and metrics must keep `TEST` visible until
  replaced by approved real data or hidden.
- Browser writes, provider writes, invites, production users, owner CSV apply,
  live counts, signed-in proof, pilot proof, and final invite gate remain
  separate rollout/data work.

## Sources Inspected

- `docs/user-stories/master-user-story-inventory.md`
- `docs/user-stories/narrow-launch-mvp-stories.md`
- `docs/user-stories/user-story-gap-report.md`
- Repo `origin/main` as of `4f64e80` (`Tighten staff route honesty (#433)`)
- `src/app/login/page.tsx`
- `src/app/app/*`
- `src/app/leader/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/admin/*`
- `src/components/figma-member-mobile-home.tsx`
- `src/components/figma-member-stories-page.tsx`
- `src/components/figma-leader-command-center.tsx`
- `src/components/figma-leader-create-event-screen.tsx`
- `src/components/figma-leader-stories-screen.tsx`
- `src/components/figma-leader-training-screen.tsx`
- `src/components/figma-staff-command-center.tsx`
- `src/components/figma-admin-panel.tsx`
- `src/services/member-launch-lane-events.ts`
- `src/services/events-points-launch-lane.ts`
- `src/services/launch-lane-points-readback.ts`
- `src/services/production-launch-gate.ts`
- `src/services/production-signed-in-route-proof-readiness.ts`
- `src/services/write-readiness.ts`
- `tests/e2e/launch-smoke.spec.ts`

## Owner Lanes

| Lane | Delivery focus |
| --- | --- |
| `#1` | General Member App UI/source fidelity and route/control honesty only. |
| `#2` | Student Leadership / Chapter Command Center UI/source fidelity and route/control honesty only. |
| `#3` | Staff / DS Admin Command Center UI/source fidelity and route/control honesty only. |
| `#4` | Release watch, browser smoke, visual QA, and evidence classification. |
| `Data/Safety` | Auth, role, privacy, RLS, server-boundary, write-safety, and readback contracts. |
| `Rollout Evidence` | Owner CSVs, production packet, live counts, signed-in proof, pilot proof, zero-send, final gate. |
| `#5` | Planning, story slicing, acceptance packets, and repo-truth audit refreshes. |

## Prioritized Backlog

| Backlog ID | Parent story | Work type | Owner | Current truth | PR-sized slice | Acceptance / evidence | Blockers and must-not-move |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BL-001 | MEM-003, MEM-004, MEM-005, MEM-006 | UI | #1 | partial / preview-only | Member `/app/events` + event detail + points handoff fidelity polish. | `/app/events`, `/app/events/[eventId]`, RSVP, check-in, and `/app/points` stay source-faithful, route-backed, TEST-labeled, and preview-safe. | Do not touch auth, real RSVP writes, attendance writes, points ledger, Luma, rollout proof. |
| BL-002 | MEM-007 | UI | #1 | preview-only | Member Stories IG-style feed and reader/detail final parity. | Feed/detail match exported member source; reactions/share/save/comment/publish controls are blocked or preview-only. | No story publishing, consent claims, provider sync, or proof evidence claims. |
| BL-003 | MEM-008 | UI | #1 | partial | Member Profile source-fidelity and privacy-copy pass. | `/profile` keeps member shell expectations; private/contact/traveler fields are read-only or blocked; fake identity is TEST-labeled. | No profile writes, HubSpot/contact sync, emergency/traveler data writes, signed-in proof claims. |
| BL-004 | MEM-009 | UI | #1 | preview-only | `/app/slt-prep` member-shell integration closeout. | SLT entry reads like General Member App surface, not standalone travel app; bottom-nav and TEST labels preserved. | No payment, form, Drive, Shopify, HubSpot, Luma, Zoom, trip registration, or staff approval writes. |
| BL-005 | MEM-002 | UI | #1 | built shell / mock-safe | Member bottom-nav consistency and no-silent-tap sweep. | Home, Events, Stories, Points, Profile, and SLT entry route or clearly block; mobile shell remains exported-source faithful. | No leader/staff/admin files; no data/auth or rollout proof. |
| BL-006 | MEM-006 | UI | #1 | partial | Points page readback wording and leaderboard preview honesty. | `/app/points` explains preview/read-only points and keeps event earning handoff. | No Smile.io/rewards/provider sync, no award authority, no production leaderboard proof. |
| BL-007 | MEM-003 | QA | #4 | partial | Member event loop mobile browser certification. | Capture mobile/desktop no-write evidence for `/app`, `/app/events`, detail, RSVP, check-in, points. | Screenshots prove UI only; no Data/Auth, Writes, or Rollout Gate movement. |
| BL-008 | MEM-001 | Data/Safety | Data/Safety | partial | Member signed-in proof readiness guard refresh. | Tooling/docs distinguish real production account proof from preview cookies and TEST actors. | Does not create accounts, profiles, invites, or production proof rows. |
| BL-009 | MEM-004, MEM-005 | Data/Safety | Data/Safety | preview-only | RSVP/check-in/attendance write-readiness contract. | Fail-closed boundaries for RSVP, QR, attendance, audit, and points prerequisites are tested. | No browser-facing write enablement, no Luma write, no pilot proof movement. |
| BL-010 | MEM-006 | Data/Safety | Data/Safety | partial | Points/leaderboard award authority contract. | Points readback vs award authority is explicit; duplicate, role, event, proof prerequisites are guarded. | No Smile.io/rewards/provider write or production ledger mutation. |
| BL-011 | MEM-007, STF-004 | Data/Safety | Data/Safety | preview-only | Story/proof identity, consent, and storage boundary contract. | Fake story/proof data excluded from production proof; consent/storage/publish prerequisites are named and fail closed. | No proof upload, consent approval, story publish, or provider sync. |
| BL-012 | LDR-001 | UI | #2 | built shell / partial data | Leader overview parity and menu route audit after latest shell wave. | `/leader?view=overview` menu families remain visible, route-backed, TEST-labeled, and source-faithful. | No member/staff/admin files; no real data or role changes. |
| BL-013 | LDR-002 | UI | #2 | partial | Leader event/attendance handoff closeout. | Event, attendance, RSVP, and follow-up surfaces route correctly and say preview/read-only where needed. | No event creation writes, attendance import, Luma sync, follow-up sends. |
| BL-014 | LDR-003 | UI | #2 | partial | Leader leaderboard/comparison source-fidelity polish. | Leaderboard rows, comparisons, and points summaries are readable and TEST-labeled. | No point mutations, exports, rewards, provider sync, production leaderboard proof. |
| BL-015 | LDR-004 | UI | #2 | preview-only | Leader member/profile handoff parity. | Member profile preview opens inside leader shell; promote/contact/role/proof controls are blocked/read-only. | No private data expansion, member mutation, role change, assignment write. |
| BL-016 | LDR-005 | UI | #2 | preview-only | Leader create-event preview honesty. | Create Event route/panel is visible; publish, sync, reminder, copy/send controls are disabled/preview-only. | No myMEDLIFE or Luma event writes; no outbox sends. |
| BL-017 | LDR-006 | UI | #2 | preview-only | Committees/tasks visible-control honesty. | Committee/task controls are route-backed or blocked; fake assignments are TEST-labeled. | No task writes, committee/role/member mutations, notifications, points awards. |
| BL-018 | LDR-007 | UI | #2 | preview-only | Training, Values, Succession, Impact, Bridge Videos, MEDLIFE Stories parity sweep. | Support/culture surfaces route and stay preview-safe with TEST content. | No publish/share/assign/promote/succession writes or rollout evidence. |
| BL-019 | LDR-002, LDR-003 | QA | #4 | partial | Leader shell browser smoke and screenshot evidence packet. | `/leader` key views smoke cleanly with no-write proof and visual comparison notes. | QA screenshots do not move production evidence or rollout gate. |
| BL-020 | LDR-004, LDR-006 | Data/Safety | Data/Safety | staged / preview-only | Leader role/member/profile access boundary contract. | Member profile, committee, assignment, promotion, and succession boundaries are explicit and fail closed. | No production role changes or private profile writes. |
| BL-021 | STF-001 | UI | #3 | built shell / partial data | Staff portfolio/header/nav final parity sweep. | `/staff?view=chapters` top nav, header actions, portfolio rows, filters, and detail handoffs are source-faithful. | No intervention writes, export, reminders, survey sends, rollout evidence. |
| BL-022 | STF-002 | UI | #3 | partial | Staff chapter detail and intervention-control honesty. | Chapter drawer/detail opens without overlap; action controls are blocked/read-only with TEST rows. | No notes, follow-ups, coach assignment changes, exports, notifications. |
| BL-023 | STF-003 | UI | #3 | preview-only | Staff Campaigns / Rush Month deeper parity. | Campaign list/detail/review routes stay source-backed and preview-safe. | No campaign publish, QR/contact lead capture, provider sync, invite sends, points awards. |
| BL-024 | STF-004 | UI | #3 | preview-only | Staff Proof / UGC visible-control closeout. | Proof library/feed/review/moderation controls are route-backed or blocked; fake UGC is TEST-labeled. | No proof ingestion, consent approval, publish, social/provider sync. |
| BL-025 | STF-005 | UI | #3 | preview-only | Best Practices and Campaign SOPs visible-control honesty. | Staff SOP and best-practice panels stay visible, route-backed, TEST/sample-labeled, and preview-only. | No SOP publish, rollback, task generation, n8n/provider send. |
| BL-026 | STF-006, DSA-001 | UI | #3 | partial | Embedded Staff Admin handoff and Command Center back affordance parity. | `/staff?view=admin` and `/admin` preserve dark shell/menu and safe back affordance. | No admin write authority granted from staff UI. |
| BL-027 | DSA-001 | UI | #3 | built shell / partial ops | DS Admin dark shell/menu final parity. | Overview, Users, Chapters, Modules, Luma Events, Points, Integrations, Audit Logs, System Health, API Keys, MCP Connections, Settings remain visible where source-backed. | No module toggles, user/role/chapter mutations, provider writes. |
| BL-028 | DSA-002 | UI | #3 | preview-only | Integrations / API Keys / MCP blocked-state clarity. | API/MCP/provider controls show masked, blocked, preview-only, or read-only state. | No secrets exposed, no key rotate/revoke/copy live, no provider connect/test/send. |
| BL-029 | DSA-003 | UI | #3 | partial | System Health + Audit Logs read-only clarity. | System health/audit panels remain route-backed and explain missing production evidence. | No live health operations, audit mutation, incident actions. |
| BL-030 | ADM-002 | UI | #3 | partial | Users / Chapters / Access review surface parity. | Admin review pages load and label TEST/sample rows; mutation controls are blocked or audited-only. | No owner CSV apply, user/invite/role/chapter write, production evidence movement. |
| BL-031 | ADM-003, SUP-002 | UI | #3 | staged / blocked | Launch Gate and Release Readiness copy clarity. | Gate visibly refuses launch while owner data, live counts, signed-in proof, pilot proof, and approval are missing. | No final gate movement from UI text or screenshots. |
| BL-032 | STF-001, DSA-001 | QA | #4 | partial | Staff/Admin visual QA and public no-write smoke. | Capture `/staff`, `/staff?view=admin`, `/admin`, Audit, System Health, API/MCP screenshots with TEST labels. | QA evidence is UI/QA only, not production proof. |
| BL-033 | STF-001, STF-002 | Data/Safety | Data/Safety | partial | Coach/staff portfolio intervention safety contract. | Intervention, notes, follow-up, assignment, export, and notification write boundaries are fail-closed. | No staff UI write enablement or rollout proof. |
| BL-034 | ADM-002, SUP-002 | Data/Safety | Data/Safety | blocked | Admin master-data / owner-truth safety contract. | Safety layer separates owner-truth validation from #3 rollout evidence application. | No production owner CSV apply, live counts, invites, or launch packet changes. |
| BL-035 | ADM-004, DSA-002 | Data/Safety | Data/Safety | partial / preview-only | Audit/outbox send-safety contract. | Retry/replay/send/dead-letter/provider sync remain fail-closed with idempotency needs named. | No outbox mutation, provider write, or pilot proof movement. |
| BL-036 | ADM-003, DSA-004 | Data/Safety | Data/Safety | staged | Production signed-in proof readiness tooling refresh. | Required role proof classes and allowed/not-allowed evidence are explicit and tested. | No production account creation or proof capture. |
| BL-037 | SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Owner CSV intake monitor and validation plan. | Tracks 7/7 sent, returned count, validated count, and required fields without using mock data. | Cannot proceed to packet/live counts until real returns exist. |
| BL-038 | SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Production rollout packet assembly from approved real data. | Packet uses owner-approved rows only and excludes TEST/Figma/sandbox content. | No invite gate until signed-in, live counts, pilot proof, and approval exist. |
| BL-039 | SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Live data count readback. | Supabase/myMEDLIFE live counts are captured with timestamp/reviewer/source once approved. | No static mock, local, or Figma rows count. |
| BL-040 | DSA-004, SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Production signed-in route proof capture. | Real member, leader, staff/support, and DS/admin accounts prove `/app`, `/leader?view=overview`, `/staff?view=chapters`, `/admin`. | No preview cookies, actor switchers, staging, screenshots without account proof. |
| BL-041 | MEM-004, MEM-005, MEM-006, SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Pilot event proof for RSVP, attendance, points. | Real pilot event evidence ties RSVP, attendance, points, audit/outbox zero-send together. | No fake pilot, TEST event, provider mock, or screenshot-only proof. |
| BL-042 | ADM-004, SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Audit/outbox zero-send production proof. | Real pilot shows no unauthorized sends/writes with audit/outbox evidence. | No local or preview audit rows count. |
| BL-043 | SUP-002 | Rollout Evidence | Rollout Evidence | blocked | Final invite gate packet and approval. | All required evidence present and Coordinator/Nick explicitly approve. | No planning doc, deploy, smoke pass, or UI PR opens gate. |
| BL-044 | All MVP UI stories | QA | #4 | partial | Three-shell PR acceptance checklist refresh. | #4 verifies source evidence, file scope, visible TEST labels, blocked controls, checks, and smoke. | QA does not assign implementation or move rollout proof. |
| BL-045 | MEM-002, LDR-001, STF-001, DSA-001 | QA | #4 | partial | Visible TEST label audit after each shell PR. | Browser review fails if fake visible rows lack `TEST`; product/provider/menu terms stay clean. | Does not require renaming internal variables or real product labels. |
| BL-046 | MEM-003, MEM-006 | QA | #4 | partial | Mobile device QA for member event/points loop. | iPhone Safari/Chrome and Android Chrome checks where available, with screenshots or recordings. | Mobile screenshots alone do not prove Data/Auth/Writes/Rollout. |
| BL-047 | All MVP stories | Planning | #5 | planning-only | Story-to-test traceability map. | Each MVP story links to route/component/service/e2e tests or names missing coverage. | Does not edit implementation or move matrix percentages. |
| BL-048 | All MVP stories | Planning | #5 | planning-only | Backlog grooming into Linear-ready tickets. | Convert backlog rows into clean tickets with owner, model, acceptance criteria, and blocked boundaries. | Linear scope signals are not implementation proof. |
| BL-049 | All MVP stories | Planning | #5 | planning-only | Repo-truth refresh after next shell PR wave. | Re-read `origin/main`, update story statuses only when repo evidence changes. | No production readiness claims from merged UI only. |
| BL-050 | All MVP stories | Planning | #5 | planning-only | Matrix crosswalk refresh. | Map each backlog row to Scope/UI, Data/Auth, Writes/Integrations, QA/Ops, Rollout Gate. | Planning alone does not move matrix percentages. |

## First 12 Recommended Assignments

1. `BL-001` to `#1`: member events/detail/RSVP/check-in/points handoff polish.
2. `BL-012` to `#2`: leader overview/menu route audit after latest leader PRs.
3. `BL-021` to `#3`: staff portfolio/header/nav final parity sweep.
4. `BL-044` to `#4`: three-shell PR acceptance checklist refresh.
5. `BL-009` to `Data/Safety`: RSVP/check-in/attendance fail-closed contract.
6. `BL-036` to `Data/Safety`: production signed-in proof readiness tooling refresh.
7. `BL-037` to `Rollout Evidence`: owner CSV intake monitor.
8. `BL-046` to `#4`: mobile QA for member event/points loop.
9. `BL-028` to `#3`: Integrations / API Keys / MCP blocked-state clarity.
10. `BL-015` to `#2`: leader member/profile handoff parity.
11. `BL-006` to `#1`: member points readback and leaderboard preview honesty.
12. `BL-047` to `#5`: story-to-test traceability map.

## Built Vs Preview-Only Vs Blocked Summary

Built or strong local review:

- Login route and role-aware shell routing.
- General Member App shell and bottom navigation.
- Member event detail preview route family.
- Student Leadership shell/menu family.
- Staff Command Center shell/menu family.
- DS Admin dark shell/menu family.
- Smoke and focused tests for many launch surfaces.

Preview-only or mock-safe:

- RSVP/check-in/attendance/points loop.
- Member stories/proof surfaces.
- Leader create-event, committees/tasks, member profile, support/culture,
  values, succession, training, bridge/video/story surfaces.
- Staff campaigns, proof/UGC, best practices, campaign SOPs.
- Admin integrations, API keys, MCP, System Health, Audit Logs, module/provider
  controls.

Blocked before rollout:

- Owner-returned CSVs and validation.
- Production rollout packet from approved real data.
- Production live counts.
- Production signed-in route proof by role.
- Pilot event proof for RSVP, attendance, points, audit, and zero-send.
- Final invite gate approval.
- Any provider write or external send.

## Matrix Guidance

This backlog is planning/documentation only and should not move readiness
percentages by itself. A landed/smoked UI slice may support modest `Scope/UI`
and `QA/Ops` movement for the affected module. `Data/Auth`,
`Writes/Integrations`, and `Rollout Gate` should move only from matching real
evidence, safety contracts, production proof, or approved rollout artifacts.
