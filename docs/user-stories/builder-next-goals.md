# myMEDLIFE Builder Next Goals

Date: 2026-07-08
Owner lane: myMEDLIFE #5, planning/docs only
Planning base: PR #548 active builder truth refresh plus the current member,
leader, and Staff/Admin queue context.

Purpose: paste-ready next-goal packets for Coordinator once the current shell
wave settles. These are planning slices, not proof that the work is already
implemented.

## Universal Rules For Every Builder

- Stay inside the assigned shell family.
- Use repo truth for implementation status and Figma/exported code for visual
  intent.
- Keep visible fake/sandbox/Figma-derived content labeled `TEST`.
- Keep unfinished controls route-backed, read-only, blocked, disabled, or
  preview-only. No silent dead controls.
- Do not claim Data/Auth, Writes/Integrations, or Rollout Gate movement from a
  shell/UI PR alone.
- Do not request production/provider access for these shell slices.

## #1 General Member App Packet

Target thread: `#1`
Suggested model: `gpt-5.4` medium/high
Backlog IDs: `DB-001`, `DB-002`, `DB-003`.

Plain-English goal: after `#523/#536` clear, tighten the member event
participation path so a reviewer can move from `/app` into `/app/events`, open
event detail, understand the RSVP/check-in posture, and land in `/app/points`
without the UI implying live RSVP, attendance, or points writes.

In scope:

- `/app`
- `/app/events`
- `/app/events/[eventId]`
- `/app/points`
- member bottom nav and member-only route handoffs touched by that path
- focused member route/component/browser checks

Do not touch:

- `/leader`, `/staff`, `/admin`
- auth/session helpers unless Coordinator explicitly approves
- Luma/provider code, points ledger authority, RSVP/check-in/attendance writes,
  rollout evidence, owner CSVs, live counts, signed-in proof, or pilot proof

Acceptance checks:

- Event list/detail and points handoff preserve member shell visual intent.
- RSVP/check-in/attendance copy is preview-safe and does not claim production
  writes.
- Points are readback/preview-safe; no fake award authority or provider reward
  sync.
- Visible fake member, chapter, event, story/proof, campaign, and points rows
  show `TEST`.
- Focused tests or browser smoke cover the route path touched by the PR.

Matrix movement limits:

- Can support modest `Scope/UI` and `QA/Ops` if landed and tested/smoked.
- Must not move `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #2 Student Leadership Packet

Target thread: `#2`
Suggested model: `gpt-5.4` high for route/menu restoration, `gpt-5.4` medium
for smaller preview-honesty follow-ups.
Backlog IDs: `DB-005`, `DB-006`, `DB-007`.

Plain-English goal: let `#545/#547` settle, then use the service-backed
`/leader?view=*` shell continuity as the base for succession, values,
leadership training, member/profile, event review, and attendance handoffs
without enabling leader writes.

In scope:

- `/leader?view=*`
- leader shell/menu/view routing
- leader values, succession, leadership training, member/profile, event,
  attendance, committee, and support/culture handoff surfaces when directly
  connected to the selected slice
- focused leader route/component/browser checks

Do not touch:

- `/app`, `/staff`, `/admin`
- production roles, member mutations, event creation writes, attendance imports,
  Luma/provider sync, notifications, points awards, rollout proof, or live
  counts

Acceptance checks:

- Source-backed menu/view families remain visible and route-backed.
- Controls that sound operational are read-only, blocked, disabled, or
  preview-only.
- Visible fake leaders, members, chapters, events, succession examples,
  leaderboard rows, and story/training samples show `TEST`.
- Older leaderboard-first planning is not used as the primary steering unless
  the menu/route continuity base is already stable.
- Focused tests or browser smoke cover the changed leader views.

Matrix movement limits:

- Can support modest Leader `Scope/UI` and `QA/Ops` if landed and tested/smoked.
- Must not move `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #3 Staff / DS Admin Packet

Target thread: `#3`
Suggested model: `gpt-5.4` high for broad staff/admin shell coherence,
`gpt-5.4` medium for narrower blocked-control clusters.
Backlog IDs: `DB-009`, `DB-010`, `DB-011`, `DB-012`.

Plain-English goal: let `#522` and the behind-only Staff/Admin follow-ons settle,
then keep the staff chapter drawer, embedded Admin, Chapters loop, Proof/UGC
review posture, and dark DS Admin menu family coherent and demo-safe without
turning staff/admin preview surfaces into rollout evidence or
live admin operations.

In scope:

- `/staff?view=chapters`
- staff chapter drawer/detail handoffs
- `/staff?view=admin`
- `/admin` and source-backed admin review panels directly related to the slice
- Proof/UGC review next-step copy and embedded Admin handoff copy
- focused staff/admin route/component/browser checks

Do not touch:

- `/app`, `/leader`
- owner CSV apply, rollout packet, invite gate, production proof rows, provider
  writes, API key live actions, MCP live connects, audit mutation, user/role/
  chapter production writes, or launch-gate advancement

Acceptance checks:

- Staff top nav, drawer/detail flow, embedded Admin handoff, and dark Admin menu
  stay recognizable and source-backed.
- Review/approve/publish/export/sync/send/test/retry/replay controls are
  blocked, read-only, disabled, or preview-only.
- Visible fake staff/admin users, chapters, audit actors, proof/UGC rows,
  provider examples, API placeholders, and fake metrics show `TEST`.
- Staff/Admin shell work does not drift into rollout evidence ownership.
- Focused tests or browser smoke cover the changed staff/admin route family.

Matrix movement limits:

- Can support modest Staff/Admin `Scope/UI` and `QA/Ops` if landed and
  tested/smoked.
- Must not move `Data/Auth`, `Writes/Integrations`, or `Rollout Gate`.

## #4 QA / Release Watch Packet

Target thread: `#4`
Suggested model: `gpt-5.3-codex-spark` for simple watch summaries,
`gpt-5.4-mini` for acceptance/classification packets.
Backlog IDs: `DB-013`, `DB-014`.

Plain-English goal: keep the active PR board honest and classify each evidence
type correctly. A green shell PR can support UI/QA confidence, but it cannot
become rollout proof.

In scope:

- PR status, checks, behind-only vs failing vs blocked classification
- public no-write smoke when Coordinator asks
- visual QA notes for source fidelity and visible `TEST` compliance
- shell-specific reviewer acceptance checks

Do not touch:

- product code
- implementation files for #1/#2/#3
- production/provider access
- matrix edits
- rollout evidence claims

Acceptance checks:

- Every watched PR is classified as green, behind-only, failing, blocked, or
  needs builder refresh.
- #4 calls out whether evidence is UI, QA/Ops, Data/Auth, Writes/Integrations,
  or Rollout Gate relevant.
- Visible fake content without `TEST` is a QA failure.
- Public no-write smoke is useful for route/shell confidence, not production
  proof.

Matrix movement limits:

- Can support `QA/Ops` only when tied to real checks/smoke.
- Must not move rollout proof from screenshots, TEST data, or smoke alone.

## #5 Planning Follow-Through

Target thread: `#5`
Suggested model: `gpt-5.5` medium
Backlog ID: `DB-015`

Keep the story package, delivery backlog, and gap priority table current after
the next merge wave. Retire stale steering quickly, especially:

- #2 leaderboard-first advice when service-backed `/leader?view=*` continuity is
  the stronger current gap.
- #3 rollout/invite-gate ownership when #3 is now staff/admin shell owner.
- Any wording that treats preview shells, smoke, screenshots, or TEST rows as
  rollout proof.
