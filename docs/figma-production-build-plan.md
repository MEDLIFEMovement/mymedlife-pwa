# myMEDLIFE Figma Production Build Plan

Date: 2026-07-06
Owner lane: myMEDLIFE #5, read-only planning/spec consolidation

## Scope note

This document is a production-plan consolidation from the exported Figma code, route audits, button maps, visible-control audits, current readiness matrix, and the SOP rollout package.

It is not a claim that every single button in every exported mockup was manually clicked end-to-end in a live browser by this lane. A large amount of control coverage already exists in source-backed button maps and CTA-safety audits, and this plan uses those artifacts. If Coordinator wants a literal every-button acceptance inventory, that should be a separate dedicated audit pass.

## 1. Sources inspected

Primary exported Figma code:

- `/Users/codex/Desktop/myMEDLIFE App Prototype/`
- `/Users/codex/Desktop/Staff Command Center Dashboard/`
- `/Users/codex/Desktop/Student Leadership Command Center/`

Secondary comparison and planning sources:

- `/Users/codex/Documents/Codex/2026-07-06/ca/outputs/mymedlife-readiness-matrix-2026-07-06.md`
- `/Users/codex/mymedlife_FULL_SOP_ROLLOUT_CODEX_PACKAGE_2026-06-22.zip`

Useful source-backed repo docs reviewed:

- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/figma-code-contract.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/figma-route-audit.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/ui-functionality-wiring-audit.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/visible-controls-honesty-audit.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/figma-member-mobile-app-button-map.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/figma-leader-command-center-button-map.md`
- `/Users/codex/Documents/Codex/2026-06-16/mymedlife/work/mymedlife/docs/figma-staff-command-center-button-map.md`

## 2. Production plan matrix

Status key:

- `Built`: route/shell exists and is source-backed enough to review now
- `Partial`: source-backed shell exists, but important data/auth/write proof is still missing
- `Static/mock`: visible shell or local/Test behavior only
- `Not started`: no meaningful production-facing implementation yet

| Module / workflow | Figma/source intent | Current state | Data / auth / writes / integrations needed before production | QA / rollout evidence needed | Launch phase | Suggested owner | Model |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Login and role routing | One sign-in entry, then role-correct landing | Partial | Real production member, leader, staff, admin accounts and role rows; no role-picker truth | Signed-in browser proof by role | First launch | #2 | gpt-5.4 |
| Member home `/app` | Mobile student shell with events, points, stories, campaign, profile nav | Built | Real member/chapter data; keep Test data isolated | Signed-in member walkthrough | First launch | #1 + #2 | gpt-5.4 |
| Member events `/app/events` | Event feed and campaign-aware event browsing | Partial | Approved real event rows and chapter mappings | Browser proof plus real readback | First launch | #1 + #3 | gpt-5.4 |
| Member event detail / RSVP / check-in | Event detail, RSVP, check-in, points follow-through | Partial | Real RSVP/attendance/points evidence path; read-only Luma mapping first | Five-chapter pilot proof | First launch | #1 + #3 | gpt-5.4 |
| Member points / leaderboard | Personal points and chapter ranking | Partial | Real points ledger inputs from attendance/approved actions | Real event-loop proof | First launch | #1 + #3 | gpt-5.4 |
| Member stories | Stories feed, filters, review-safe sharing posture | Partial | Safe proof/story source model; explicit Test/review labeling | Honest blocked/read-only controls; no production proof contamination | Soon after launch-visible | #1 | gpt-5.4 |
| Member profile | Identity/role/profile handoff back to event loop | Partial | Real profile/role data; no fake-live claims | Signed-in member route proof | First launch | #1 + #2 | gpt-5.4 |
| Leader overview `/leader` | Chapter health, priorities, quick actions | Built | Real chapter/member data by leader scope | Signed-in leader proof | First launch | #1 + #2 | gpt-5.4 |
| Leader leaderboard / members / profile | Chapter rankings and member pipeline views | Partial | Real chapter/member rows; chapter-scoped permissions | Leader smoke and signed-in proof | First launch | #1 + #2 | gpt-5.4 |
| Leader committees / events / create event | Committee ops, event performance, create-event workflow | Partial | Chapter-scoped leader write rules; later approved Luma write path | No-send/no-live-write proof now; later pilot proof | First launch core, with blocked writes | #1 + #3 | gpt-5.4 |
| Leader impact / bridge / stories / training / succession | Richer culture and leadership surfaces | Static/mock | Real workflow model later; share/publish still blocked | Honest disabled/read-only posture | Later phase but keep visible | #1 | gpt-5.4 |
| Staff command center chapters | Cross-chapter portfolio, filters, detail drawer | Built | Real staff/coaching scope and chapter data | Signed-in staff proof | First launch | #1 + #2 | gpt-5.4 |
| Staff campaigns | Campaign operations and at-risk chapter views | Partial | Real campaign runtime later; current launch can stay read-only | Honest route-backed shell proof | Soon after launch | #1 + future lane | gpt-5.4 |
| Staff proof / UGC | Review queue, consent, visibility, review actions | Static/mock | Consent, storage, approval model, publication rules | Governance and safety proof | Later phase | future lane | gpt-5.5 |
| Staff best practices | Library of reusable chapter learnings | Static/mock | Curated content model and safe share/send rules | Read-only proof first | Later phase | future lane | gpt-5.4 |
| Staff campaign SOPs | SOP library and builder preview | Static/mock | Draft template model, versioning, permissions, publish gates | Draft/live separation proof | Later phase | future lane | gpt-5.5 |
| Admin backend `/admin` | DS/Admin shell, users, chapters, audits, integrations, system health | Partial | Real DS/admin accounts and scoped access; writes remain gated | Signed-in DS/admin proof | First launch safety lane | #1 + #2 | gpt-5.4 |
| Audit + integration outbox | Readback of what happened and what did not send | Partial | Real audit/outbox readback from pilot-safe path | Audit/outbox zero-send evidence | First launch | #3 + #4 | gpt-5.4 |
| Luma integration | Event mapping, RSVP, attendance, QR loop | Partial | Approved chapter-to-calendar mapping; no broad writes yet | Read-only mapping proof, then controlled pilot | First launch, gated | #3 | gpt-5.4 |
| Rollout / invite gate | Owner packet, live counts, signed-in proof, pilot proof | Partial | Returned owner CSVs, validated production counts, role proof | Final gate packet and evidence | First launch | #3 | gpt-5.4 |
| Test / sandbox isolation | Test rows clearly marked and excluded from proof | Built | Keep source guards strict | Repeated exclusion checks | First launch safety lane | #2 | gpt-5.4 |
| SLT Prep | Traveler readiness shell | Static/mock | Exact source confidence still weaker; future deposit/trip rules later | Explicit blocked/missing-source honesty | Later phase | future lane | gpt-5.4 |
| Coach command center | Portfolio validation, hold/advance/intervene workflows | Not started | Real coach scope, risk model, decision writes, audit | Role and workflow QA | Later phase | future lane | gpt-5.5 |
| Analytics / warehouse | Downstream KPI and reporting layer | Not started | KPI event definitions, warehouse consumer, no operational truth drift | Reconciliation and freshness proof | Later phase | future lane | gpt-5.4 |
| SOP runtime and imports | Structured campaign templates, phases, rules, triggers | Not started as production runtime | Draft template model, versioning, outbox-only trigger mapping, publish approval | Draft/live separation, import tests, no-side-effect proof | Later phase | future lane | gpt-5.5 |

## 3. First-launch lane vs later-phase modules

### First-launch lane

- Login and role routing
- Member app home
- Member events and event detail
- RSVP
- Attendance / check-in
- Points and leaderboards
- Leader command center core views
- Staff command center core shell
- Admin safety/review routes
- Luma read-only mapping and proof
- Audit / outbox zero-send posture
- Test / sandbox data isolation
- Rollout / invite gate evidence

### Visible now, but later-phase or read-only/blocked

- Member stories
- Member profile refinement beyond honest handoff
- Leader impact / bridge / stories / training / succession
- Staff campaigns deeper runtime behavior
- Staff proof / UGC
- Staff best practices
- Staff campaign SOPs
- SLT Prep

### Later platform work

- Coach command center
- Draft SOP template library
- SOP placement by role surface
- Draft/live separation guardrail
- DS/Admin SOP Builder
- Structured imports for all six campaign families
- Warehouse / KPI export layer
- Broad proof / UGC governance and publishing

### Do not build yet

- Live HubSpot sends or workflow mutation
- Broad live Luma writes
- Shopify / GiveLively / n8n live workflow side effects
- Any imported SOP draft affecting live member behavior

## 4. Drift list between current app and Figma source

Current or recent drift areas that matter most:

- Member Profile:
  - The raw member export shows a `Profile` nav label but not a strong dedicated profile screen. The app uses a route-backed `/profile` adaptation, so this needs honesty more than strict parity.
- Member Stories:
  - Source supports Stories clearly, but production behavior must stay review-only/blocked where upload/share/publish would imply live action.
- Member Events and Points:
  - These routes are launch-important and dedicated, but they were not originally as exact a code port as the home shell. They need continued source-fidelity tightening.
- SLT Prep:
  - Source confidence is weaker than the core member/leader/staff exports. It should remain blocked/source-confidence-low until exact source is approved.
- Staff/Admin integrations and provider surfaces:
  - Figma includes rich provider/system concepts, but the app must keep them read-only/blocked until audited live paths exist.
- SOP Builder and campaign runtime:
  - Figma shows the shell and workflow ideas, but the real structured runtime, permissions, and publish controls are later-phase work.

## 5. Data safety classes

### Real production rollout evidence

- Returned owner packet data
- Validated production account/role proof
- Approved chapter/event mappings
- Real pilot RSVP / attendance / points / audit / outbox evidence

### Static planning content

- Figma export source
- SOP rollout package docs
- Campaign catalog and placement maps
- Acceptance checklists and scoring guides

### Test / sandbox / fixture-only

- Local seeded actors and chapters
- Figma sample rows and mock metrics
- Preview-only story/profile/proof content
- Draft imported SOP templates

### Must never count as rollout proof

- Figma fixtures
- SOP sample/template rows
- Local Test data
- Preview/staging rows
- Mock provider events

## 6. Recommended next goals by thread

### #1

Goal: continue source-backed shell fidelity and route honesty on the launch lane.

Next best slices:

- Member Stories + Profile control honesty
- Remaining member/leader route parity gaps
- Visible but blocked/read-only handling for later-phase menus

Model: `gpt-5.4`

### #2

Goal: keep auth/role correctness and Test-data isolation strong.

Next best slices:

- Signed-in production route proof by role
- Draft/live separation safety for future SOP/template work
- Role-boundary tightening where source-backed UI expands

Model: `gpt-5.4`

### #3

Goal: own real rollout evidence, not shell fidelity.

Next best slices:

- Owner packet/live counts follow-through
- Five-chapter event-loop proof
- Audit/outbox zero-send evidence
- Read-only Luma mapping proof

Model: `gpt-5.4`

### #4

Goal: review/watch/smoke support without merge risk.

Next best slices:

- PR smoke and route-honesty watch
- Honest blocked/read-only control review
- Matrix hygiene and no-overclaim checks

Model: `gpt-5.4-mini`

### #5

Goal: keep the production map, acceptance criteria, and matrix scoring honest.

Next best slices:

- Consolidated future-module backlog map
- SOP package integration and placement planning
- Acceptance checklists for upcoming #1 lanes

Model: `gpt-5.4`

## 7. Matrix percentage recommendations

Conservative recommendation:

- Do not move launch-lane percentages for breadth of mockups alone.
- Move percentages for:
  - source-backed route truth
  - role correctness
  - honest disabled/read-only controls
  - signed-in proof
  - real pilot evidence
  - audit/outbox evidence
- The SOP package should not raise launch readiness by itself. It improves planning and backlog clarity, not production proof.

## 8. Risks and blockers

- Owner data remains the biggest non-UI blocker: rollout evidence cannot be invented from shell quality.
- Signed-in production proof by role is still missing.
- Five-chapter pilot evidence is still missing.
- Provider write surfaces are easy to overclaim because the Figma shells are rich; they must stay blocked until separately approved.
- Stories, proof, UGC, SOP, and campaign runtime work can leak fake readiness if Test/sample content is not kept clearly labeled.
- The exported code is strong enough to drive shell fidelity, but not every later-phase workflow in the mockups should be treated as launch scope.

## Bottom line

The actual exported Figma code is strong enough to define the visible product contract for member, leader, staff, and admin shells. The safe production path is to keep those shells, wire the first launch lane behind them one behavior family at a time, and score progress based on real route truth and rollout evidence rather than mock richness.
