# Figma Clickthrough Screen Inventory

This inventory turns the clickable Figma Make prototypes into an explicit build
map for myMEDLIFE.

Use it to answer:

- which screens are actually present in the mockups
- which buttons or nav items change the surface
- which local route or query-param state should own that surface
- where the Make prototype is clear, partial, or inconsistent

Observed on `2026-06-21` from the live Figma Make renders and refreshed on
`2026-06-22` through direct browser inspection of the Make preview iframe,
including a live walkthrough of the SOP Creation library and the Rush Month
builder steps screen. The local route inventory was tightened again on
`2026-06-23` while validating the chapter-leader route family against the
current app shell.

Latest inspection note:

- live browser access to the Make preview still worked even while the
  connector-backed `figma.whoami` check was failing on expired auth
- the iframe preview exposed readable navigation and screen text for the leader
  prototype, which is enough to keep validating route titles, quick actions,
  and first-viewport hierarchy
- for local browser parity checks, keep review runs on `localhost`
  consistently; the cookie-backed local role preview flow is more reliable
  there than when mixing `localhost` and `127.0.0.1`

Current verification checkpoint after the latest route passes:

- local `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` are green
- the chapter-leader route family has now been rechecked route by route against
  the Make preview, including `overview`, `members`, `member_profile`,
  `committees`, `events`, `impact`, `bridge_videos`, `succession`, and
  `feed_analytics`
- the member top-level route family also clears its focused route suite across
  campaigns, action detail, events, leaderboard, and profile
- remaining route drift is now more likely to be outside that family or inside
  deeper detail/empty/review states rather than obvious top-level missing
  routes

## 0. What Was Verified Live

These Make files were inspected as clickable prototypes, not static images:

- `myMEDLIFE App Prototype`
- `Student Leadership Command Center`
- `Staff Command Center Dashboard`
- `myMEDLIFE SLT Prep Phase`
- `SOP Creation Section`

Implementation note:

- the local admin backend lane now includes the shared owned route family for
  `/admin`, `/admin/review-path`, `/admin/nick-review`,
  `/admin/release-readiness`, `/admin/launch-gate`, `/admin/audit-log`,
  `/admin/integration-outbox`, `/admin/master-data`,
  `/admin/database-security`, `/admin/system-health`, `/admin/design-qa`,
  `/admin/operations`, `/admin/first-write`, `/admin/write-sequence`,
  `/admin/proof-write`, `/admin/hq-proof-write`, `/admin/assignment-write`,
  `/admin/coach-write`, `/admin/pilot-scope`, `/admin/permissions`,
  `/admin/committees`, `/admin/workflows`, `/admin/sop-library`, and
  `/admin/sop-builder/[campaignSlug]`
- the live SOP inspection now proves the library first viewport plus the Rush
  Month builder steps, role-matrix, completion, points/KPI, comms, preview,
  and version tabs as route-backed backend lanes
- the remaining backend gap is now the intentionally blocked mutation layer:
  reorder, create, persist, archive, schedule, rollback, and publish still
  stop at mock-safe review states instead of saving changes

Build rule:

- use the visible nav, buttons, and linked cards as the first source of truth
- treat the clickable prototype as a route and state map, not just a visual
  reference
- use the local route system to stabilize flows when the Make prototype is
  visually right but behaviorally inconsistent
- preserve required routes even when a Make clickthrough fails to expose the
  destination cleanly

SOP builder handling rule for this pass:

- use the full send package and SOP builder spec as the functional contract
- keep the now-verified SOP library and steps-builder screen as the current
  parity baseline
- continue tightening the remaining builder tabs from live inspection plus the
  build spec rather than treating the backend lane as a loose admin placeholder

## Canonical Role And Scope Overlay

Use these as the canonical product roles while the repo/runtime mapping catches
up:

- `student_member`
- `traveler`
- `committee_member`
- `committee_chair`
- `eboard_officer`
- `vice_president`
- `president`
- `coach`
- `department_staff`
- `sales_coach`
- `sales_admin`
- `ds_admin`
- `super_admin`

Use these as the canonical product scopes:

- `own`
- `committee`
- `chapter`
- `assigned_coach_portfolio`
- `department`
- `all_platform`
- `breakglass`

Current repo mismatch to keep explicit:

- local runtime audiences are still broader than this canonical set
- database keys and hosted policy names should stay stable until a later
  approved migration pass

## 1. Member Mobile App

Reference:

- `myMEDLIFE App Prototype`

### Home

Observed visible state:

- `UCLA MEDLIFE`
- `Hi, Sofia`
- `This Week's Priority`
- `Active Campaign`
- `My Actions`
- `My Points · Rush Month`
- `Upcoming Events`
- coach message from `Coach David Kim`
- bottom nav: `Home`, `Campaigns`, `Events`, `Points`, `Profile`
- chapter leaderboard CTA: `Full board`
- role jump controls: `Leader Hub`, `Coach View`, `Admin`

Expected local ownership:

- `/` for member home

Observed transitions:

- `Start next action` -> action detail
- `See all` -> should map to the member actions list
- `RSVP` -> should map to the selected event detail / RSVP route
- `Full board` -> leaderboard destination
- `Leader Hub` -> chapter leader surface
- `Coach View` -> coach surface
- `Admin` -> staff or admin surface

Notes:

- the live Make render clearly exposes the member home stack and the chapter
  leader jump
- `Full board` belongs to the chapter leaderboard block, not to the role-jump
  switcher
- `Coach View` and `Admin` are visible on the home surface, but their click
  behavior was less stable than the leader jump in earlier inspection passes,
  but the current live clickthrough does expose distinct `Coach Dashboard` and
  `Admin Console` surfaces
- keep the member-owned shell navigation to those same five destinations only:
  `Home`, `Campaigns`, `Events`, `Points`, and `Profile`
- deeper member routes like `Rush Month`, `My Actions`, `Proof`, or `Trip Prep`
  should stay CTA-owned or route-owned surfaces, not first-class items in the
  primary member nav
- keep the role jump controls compact near the bottom of the member home stack,
  after leaderboard and coach message context; they should read like
  three direct buttons, not a second explainer hero or a four-card panel
- keep the visible `Switch view` block tight: label plus the three role-jump
  buttons, without extra helper prose or a preview badge inside the product
  surface
- do not append a second quick-link card grid under `Switch view`; the mobile
  home should end with the role-jump cluster and the owned bottom-nav / review
  footer behavior

Recommended app mapping:

- active campaign open state -> `/campaigns`
- `Start next action` -> `/rush-month/actions/[assignmentId]`
- `See all` -> `/rush-month/actions`
- `RSVP` -> `/rush-month/events/[eventId]`
- `Full board` -> `/rush-month/leaderboard`
- `Leader Hub` -> `/chapter`
- `Coach View` -> `/coach`
- `Admin` -> `/staff?view=admin`

Handoff rule:

- when Home sends the member into a specific action, preserve that the action
  came from Home so the task route can offer an explicit return path instead of
  flattening the clickthrough into a generic deep link

### Campaigns

Observed visible state:

- title: `Rush Month`
- `Current Phase`
- `Campaign KPIs`
- `Assigned Actions by Role`
- `Why this campaign matters`
- CTA buttons: `View my actions`, `Submit evidence`

Hierarchy rule:

- keep the member campaign surface in this order:
  `Current Phase` -> `Campaign KPIs` -> `Assigned Actions by Role` ->
  `Why this campaign matters` -> CTA buttons
- if role focus is opened on the same route, treat it as a deeper same-screen
  state below that core campaign stack rather than replacing the primary
  campaign hierarchy

Expected local ownership:

- `/campaigns` or `/rush-month`

Observed transitions:

- `View my actions` -> current action loop
- `Submit evidence` -> proof submission flow for the featured action

Recommended app mapping:

- screen route -> `/campaigns`
- `View my actions` -> `/rush-month/actions`
- `Submit evidence` -> `/rush-month/actions/[assignmentId]`
- the campaign `Submit evidence` CTA should prefer a proof-ready assignment
  over a not-started task; if none is proof-ready, fall back to the broader
  evidence queue

Handoff rule:

- if the campaign surface opens a specific action or submit-evidence state, the
  action route should preserve that the member came from Campaigns

Notes:

- In the current Make render, `Why this campaign matters` behaves more like an
  expandable section than a separate route.

### Action Detail

Observed entry points:

- `Start next action` from Home
- `View my actions` from Campaigns

Observed visible state:

- heading: `Action Detail`
- featured task: `Invite 3 friends to the Intro GBM`
- `30 points if approved`
- `Why This Matters`
- `Step-by-Step Instructions`
- `Evidence Required`
- CTA: `Submit evidence`

Observed structure:

- route label first, then the task title as the main hero
- assignment status pill
- due date
- assignee label
- points reward
- why-it-matters explanation
- numbered steps
- evidence expectations

Build rule:

- the member action route should feel like a complete task screen, not a thin
  wrapper above the submit form
- keep `Action Detail` as the smaller route label and let the task title own
  the hero hierarchy, instead of promoting the route label above the actual
  task
- keep the evidence expectations and `Submit evidence` CTA in one owned section
  on the default task route instead of repeating the same proof prompt in both
  the hero and the lower task body

Expected local ownership:

- `/rush-month/actions/[assignmentId]`

Observed transition:

- `Submit evidence` -> evidence submission screen for the same assignment

Clickthrough note:

- in the inspected Make render, the `Submit evidence` clickthrough was not
  stable and could fall back to an event-style state instead of a clean
  assignment-scoped submit form
- do not mirror that inconsistency in the app; keep submit evidence attached
  to the current assignment route

### Submit Evidence

Observed visible state:

- heading: `Submit Evidence`
- `Submitting for`
- evidence type choices: `Screenshot`, `Link`, `Text`
- upload affordance
- privacy reminder and accuracy checkbox
- CTA: `Submit for review`

Expected local ownership:

- assignment-scoped proof flow reachable from action detail

Recommended app mapping:

- stay inside `/rush-month/actions/[assignmentId]` for the primary form flow
- a query-param-backed submit state on that same route is a valid local match
  for the Make clickthrough
- keep the submitted / pending-review confirmation on that same assignment
  route too (for example, a second query-param-backed state) instead of
  bouncing the member into a disconnected proof surface
- member proof-queue CTAs should deep-link into that same submit state instead
  of a disconnected intake surface
- keep `/rush-month/evidence` as the broader queue / history surface

State rule:

- the default action-detail route should show the task surface and the
  `Submit evidence` CTA, but not the full submit form yet
- the submit form itself should appear only when the route enters the explicit
  submit state, such as `?step=submit#submit-evidence`

### Events

Observed visible state:

- heading: `Events`
- event cards for `Tabling at Bruin Walk`, `Intro GBM`
- `Coming Up`
- repeated `RSVP` CTAs

Expected local ownership:

- `/rush-month/events`
- `/rush-month/events/[eventId]`

Recommended handoff rule:

- member event detail should point into a real next action route
- proof follow-up from event detail should deep-link into the same member
  submit-evidence state used elsewhere in the mobile loop
- member event detail should stay student-facing and avoid internal lane badges
  or review-only operations framing, including owner-role labels
- direct non-member landings on `/rush-month/actions/[assignmentId]` should
  snap back to the broader actions lane (or `/slt-prep` for traveler) instead
  of turning the member task route into a mixed review surface
- leader-side follow-up and assignment-card links should select the assignment
  inside `/rush-month/actions` rather than deep-linking the member-owned detail
  route

### Points

Observed visible state:

- heading: `Points & Recognition`
- top stats: `Total Points`, `This Week`, `Chapter Rank`
- `Points by Campaign`
- `Badges Earned`
- `Chapter Leaderboard — Rush Month`
- `Recent Approved Actions`
- `How points work`
- CTA: `See how to earn more points`

Expected local ownership:

- `/rush-month/leaderboard`

Notes:

- In the current Make render, the CTA does not visibly transition to a separate
  route. Treat it as explanatory content on the same surface unless design
  review says otherwise.
- If the local app keeps a points CTA anyway, route it to the next concrete
  member action rather than a generic actions hub.
- keep the points screen as one owned surface: leaderboard, recent approvals,
  and the explainer/CTA all belong on the same route

Handoff rule:

- if the points surface opens an action, preserve that the member came from
  Points / Recognition so the action route can explain why this is the next
  recognition-moving step

Local alignment note:

- keep the visible section label as `Points by Campaign`, not sentence-case
  `Points by campaign`
- if the route opens a next-step CTA, prefer the plain-language label
  `See how to earn more points` while still sending the member into the next
  concrete action route

### Profile

Observed state:

- the bottom-nav `Profile` item is visible in the Make render
- the current Make clickthrough did not expose a distinct profile screen

Expected local ownership:

- `/profile`

Build rule:

- keep `/profile` as a real member route even though the current Make prototype
  does not reveal a unique profile screen on click
- if Profile hands off to a specific action, preserve that origin so the action
  route still feels attached to the member-owned profile surface
- keep Profile lighter than Home or Campaigns: identity, role/scope, next step,
  and simple handoffs first; do not let it turn into a second campaign
  dashboard by default
- avoid duplicating points/rank dashboard stats in the profile hero; recognition
  belongs lower on the route as its own owned surface
- avoid review-only safety panels on the member profile surface; identity,
  recognition, next step, and chapter access should carry the route

Clickthrough note:

- in the inspected Make render, the bottom-nav `Profile` state behaved
  inconsistently and sometimes retained event-style content while highlighting
  `Profile`
- do not mirror that inconsistency in the app; keep `/profile` as a distinct
  and fully owned member destination

## 5. Admin Backend And SOP Builder Inventory Posture

These backend lanes are required by the full send package even though the live
Make inspection in this repo has focused more on member, leader, staff, and
SLT surfaces:

- `/admin/permissions`
- `/admin/permissions?section=routes|personas`
- `/admin/permissions?section=...&focus=...`
- `/admin/committees`
- `/admin/committees?section=committees|campaigns`
- `/admin/committees?section=...&focus=...`
- `/admin/workflows`
- `/admin/workflows?section=lanes|onboarding|writes`
- `/admin/workflows?section=...&focus=...`
- `/admin/sop-library`
- `/admin/master-data`
- `/admin/sop-library?query=...&status=...`
- `/admin/sop-builder/[campaignSlug]?tab=steps|role-matrix|completion|points-kpi|comms|preview|version`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...&mode=filter|add_step|add_step_after_last|duplicate_step|disable_step|publish|schedule|rollback`

Inventory rule:

- keep the current `/admin/*` review and safety packet routes
- add the backend configuration/library/builder lanes as dedicated admin
  surfaces, not as extra `view=` states on `/staff`
- keep the admin overview lane linked to permissions, master data,
  committees, workflows, and SOP tooling so `/admin` reads like the owned
  backend entry point rather than a disconnected packet
- keep workflow-registry section state and selected-record state on
  `/admin/workflows`
- keep permissions-registry section state and selected-record state on
  `/admin/permissions`
- keep committee-registry section state and selected-record state on
  `/admin/committees`
- keep master-data inventory state on `/admin/master-data`
- treat the SOP builder as workflow-logic inventory first:
  - library
  - builder tabs
  - step flow
  - role matrix
  - completion
  - points/KPI
  - comms
  - preview
  - version/publish
- keep library search/filter state on `/admin/sop-library`
- keep selected campaign detail on `/admin/sop-library?focus=...` instead of
  opening a disconnected registry detail page
- keep selected builder detail on the same route through `focus=...` instead of
  opening a disconnected backend screen
- on route-backed SOP builder tabs, open product surfaces through role-correct
  local preview handoffs so student, leader, and staff states are inspected as
  the intended actor, not as the admin reviewer
- in the version lane, keep the current template posture visible as the default
  selected record before older history and audit expectations

Current repo mismatch:

- the admin review packet is still more mature than the builder/configuration
  UX
- live inspection now confirms:
  - SOP library summary cards: `Total SOPs`, `Live`, `In Draft / Scheduled`,
    `Archived`
  - status filters: `All`, `Live`, `Draft`, `Scheduled`, `Archived`
  - a table-owned campaign list with status, version, step count, editor, and
    published date
  - a three-part steps builder with sections/versions/settings sidebar,
    workflow-step canvas, and right-side step detail panel
  - route-backed completion, points/KPI, comms, and preview tabs now render as
    dedicated workflow sections instead of generic selected-card placeholders
  - visible mutable builder controls now open route-owned mock-safe action
    states on the same builder screen instead of staying as dead buttons
  - completion now keeps completion types, evidence types, rule table, route
    handoffs, and audit posture visible on the same builder surface
  - points/KPI now keeps role-based point logic, chapter-point posture,
    approval-before-points, leaderboard visibility, and KPI summaries visible
  - comms now keeps trigger conditions, source-system posture, mock/live status,
    and explicit integration boundaries visible together
  - preview now shows role-by-role screen changes, action appearance, proof,
    approval, points, KPI, and communication impact in one table
- the remaining builder gap is now the intentional mutation stop line: the
  mutable-action review states exist locally, but real
  reorder/create/persist/archive/publish mutations are still blocked

### Leader Hub Jump

Observed visible state after clicking `Leader Hub` from the member home:

- heading: `Leader Hub`
- chapter: `UCLA MEDLIFE`
- summary metrics for members active, tasks assigned, tasks overdue, evidence
  pending
- `Rush Month Progress`
- `Risk Alerts`
- `Member Status`
- `Evidence Queue`
- CTAs: `Review all 7`, `Assign action`, `Review evidence`
- `Review all 7` should open the same explicit chapter-owned member-pipeline
  review state as the leader command-center quick action, not a plain members
  link
- return control: `Student view`

Recommended local ownership:

- do not treat this as the main desktop leader prototype
- use it as confirmation that the member app should expose a real role jump
  into chapter leadership work, while the full desktop surface lives in the
  dedicated `Student Leadership Command Center` file
- preserve that the student can return via `Student view` rather than treating
  the jump as a one-way escape from the member loop
- keep the handoff panel on the local route action-oriented, with the first
  visible links tied to member status review, assignment creation, and proof
  review
- keep the handoff copy tied to the originating member chapter context, so the
  jump reads like `Opened from UCLA MEDLIFE into Leader Hub` instead of a
  generic route change
- in local preview mode, `Student view` should restore the member preview actor
  before reopening `/` so the roundtrip behaves like a real return to Sofia's
  home screen instead of leaving the reviewer stranded in the leader cookie
- avoid review-only sample chips like `Boston College sample surface` in the
  visible shell; the route can still use sample chapter framing without
  advertising itself as a demo in the first viewport

### Coach View Jump

Observed visible state after clicking `Coach View` from the member home:

- heading: `Coach Dashboard`
- org label: `MEDLIFE National`
- greeting / scope line: `Hi, Coach David Kim · 4 chapters assigned`
- top metrics: `Avg Health`, `Total Overdue`, `Evidence Queue`
- `AI Weekly Summary`
- `Chapter Portfolio`
- `Coaching Priorities`
- CTA buttons: `Open chapter`, `Write coach note`, `Review risk reports`
- return control: `Student view`

Recommended local ownership:

- member role jump should open the coach-owned route family
- keep the surfaced title and handoff language tied to `Coach Dashboard`
- preserve that the student can return via `Student view`
- keep the handoff panel action-oriented with immediate links into coach notes
  and risk review before deeper coach routes
- keep the coach-owned first-viewport hierarchy in this order:
  top metrics -> `AI Weekly Summary` -> `Chapter Portfolio` ->
  `Coaching Priorities`
- keep the handoff copy tied to the originating member chapter context, so the
  jump reads like `Opened from UCLA MEDLIFE into Coach Dashboard`
- in local preview mode, `Student view` should restore the member preview actor
  before reopening `/` so the handoff truly returns to the student loop
- when `/coach?view=chapter_detail&chapter=...` is opened, resolve that chapter
  from the coach-owned portfolio itself and keep coach actions near the top of
  the detail state instead of falling back to the broader HQ staff drawer model
- when `/coach?view=feed_studio`, `/coach?view=proof_ugc`,
  `/coach?view=feed_analytics`, `/coach?view=hubspot`, or
  `/coach?view=best_practices` is opened as a handoff route, render the actual
  requested shared command-center screen on the coach route instead of a
  generic coach placeholder panel
- verified local route proof:
  - `/coach?view=chapter_detail&chapter=...` now renders the selected chapter
    as the route-level page title, with `Current support posture` below it
    instead of flattening the route into a staff-style drawer heading
  - `/coach?view=support_notes` now leads with `Support Notes` as the visible
    route title while keeping the chapter-specific note context lower in the
    page
- local parity note: once a chapter is selected, the route should read like a
  focused coach review state first and a chapter-switch surface second; avoid
  repeating the chapter name as two competing hero headings or leaving the full
  assigned-chapter list expanded as the main follow-on surface
- keep review-data badges out of the readable coach shell; source-status
  framing belongs in blocked states or admin/review routes instead

### Admin Jump

Observed visible state after clicking `Admin` from the member home:

- heading: `Admin Console`
- org label: `Platform Admin`
- system summary: `System health: 5 of 6 integrations active`
- top metrics: `Total Chapters`, `Active Users`, `Campaigns Running`,
  `Automation Jobs`
- `Integration Status`
- `User & Role Management`
- `Chapter Management`
- `Campaign Templates`
- `Audit Logs`
- `Automation Outbox (n8n)`
- CTA button: `View integration events`
- return control: `Student view`

Recommended local ownership:

- member role jump should open the staff/admin-owned route family
- default student-home handoff should land on the admin-owned staff view:
  `/staff?view=admin&source=member_home`
- keep the surfaced title and handoff language tied to `Admin Console`
- preserve that the student can return via `Student view`
- keep the handoff panel action-oriented with a direct path into integration
  review before broader admin navigation
- keep the handoff copy tied to the originating member chapter context, so the
  jump reads like `Opened from UCLA MEDLIFE into Admin Console`
- in local preview mode, `Student view` should restore the member preview actor
  before reopening `/` so HQ review can roundtrip back into the member home

## 2. Student Leadership Command Center

Reference:

- `Student Leadership Command Center`

Observed navigation:

- `Chapter Home`
- `Leaderboard`
- `Member Pipeline`
- `Member Profile`
- `Committees`
- `Events`
- `Impact`
- `Bridge Videos`
- `Succession`
- `Feed Analytics`

Recommended local ownership:

- `/chapter?view=overview`
- `/chapter?view=leaderboard`
- `/chapter?view=members`
- `/chapter?view=member_profile&member=<id>`
- `/chapter?view=committees`
- `/chapter?view=events`
- `/chapter?view=impact`
- `/chapter?view=bridge_videos`
- `/chapter?view=succession`
- `/chapter?view=feed_analytics`
- `/chapter/members` only for the separate approval / write-readiness lane, not
  as the primary command-center nav destination

Observed quick actions:

- `Create Event`
- `Assign Action`
- `Review Members`
- `Promote Emerging Leader`
- `Share Bridge Video`

Observed member-pipeline CTA cluster:

- `Export`
- `Add Member`

Build rule:

- treat `Create Event`, `Assign Action`, `Promote Emerging Leader`, and
  `Share Bridge Video` as chapter-owned quick-action states first, not just
  plain links to broad destination views
- the destination route should open with a visible task-mode handoff before it
  drops the leader into the larger events, succession, or bridge-video surface
- treat `Export` and `Add Member` the same way inside `Member Pipeline`: open a
  chapter-owned review state first, then hand off into `/chapter/members` for
  the broader approval or intake lane

Observed per-view intent:

- `Chapter Home` = chapter health, risk alerts, weekly priority, quick actions
- `Leaderboard` = chapter comparison and best-practice learning
- `Member Pipeline` = leadership-readiness table and filters
- `Member Profile` = person-level history, notes, and promotion actions
- `Committees` = committee health and unowned lanes
- `Impact` = local and global impact storytelling
- `Bridge Videos` = content library and sharing flow
- `Succession` = leadership gap analysis and timeline
- `Feed Analytics` = content engagement tied to action

Observed member-profile action cluster:

- `Promote to Chair`
- `Schedule Values Interview`
- `Assign Leadership Action`
- `Nominate for E-Board`
- `Add Note`

Build rule:

- treat member-profile actions as person-owned review states first, so the
  member context stays visible before any handoff into succession, assignment,
  or future note-writing lanes
- once `Assign Leadership Action` is opened from the profile, the next CTA
  should hand off directly into the broader action flow with that member still
  preserved in return context, rather than bouncing back through the generic
  member-pipeline screen first
- keep that member-profile action cluster visible in the first viewport with
  the selected person context; it should not fall below the chart/history
  panels before a reviewer can even see what the leader can do next
- if follow-up or feed-review context is present, keep it as a compact review
  band above the workbench rather than a large duplicate hero card; the
  selected member summary and leadership-action cluster should still dominate
  the first meaningful viewport
- keep `Add Note` in that same visible action cluster rather than hiding it as
  a later notes-only affordance; the prototype treats note capture as part of
  the primary leader decision set
- once `Add Note` is present in that primary action cluster, do not repeat a
  second `Add Note` button again inside the lower notes section; the notes
  panel should read as inherited context, not as a duplicate action toolbar
- keep subpanel headings distinct instead of repeating the exact same word as
  both eyebrow and title inside the same card; the profile should scan like a
  workbench, not stacked duplicated labels
- keep the route header compact: do not spend a full hero-style card only on
  the route title and person name before the actual person workbench begins;
  the selected member summary card and leadership-action cluster should own the
  first meaningful review surface
- keep the selected member summary card vertically snug to its own content
  instead of stretching to match the full height of lower charts and notes; the
  first viewport should read like a compact workbench, not a tall info column
- keep the summary facts inside that selected member card dense enough to scan
  in a compact two-column rhythm, so the profile block supports the action
  cluster instead of visually overpowering it
- `Assign Leadership Action` should hand off into the chapter-owned assignment
  lane with the selected member and pipeline context preserved, not flatten
  straight into a generic action route
- treat visible impact CTAs and `Share this story` highlight actions as
  impact-owned storytelling states first, then hand off into `Bridge Videos`
  with the impact context preserved
- treat `Submit Bridge Video` inside `Bridge Videos` as a bridge-library-owned
  review state first, then hand off into the broader proof lane
- when that proof lane opens, preserve the bridge-library route in a real
  return path so the proof-upload readiness surface still feels attached to the
  same chapter-owned bridge-video review context

Verified local handoff routes:

- `/chapter/members` opens the chapter-owned membership approval and role
  coverage workspace
- `/action-committees` opens the role-aware committee workspace and event
  operating examples
- `/proof-library/upload` opens the proof-upload readiness surface for the
  bridge-video / proof handoff
- `/rush-month/review` opens the leader follow-up and proof-decision surface
  that separates chapter accountability from HQ sharing authority

Verified leader-review behavior:

- chapter leaders should see the readable follow-up queue and leader
  proof-decision workspace on `/rush-month/review`
- chapter leaders should **not** see technical diagnostics such as
  `Leader proof decision result states`, `Local leader proof decision`, or
  `Leader decision locked`
- those deeper result-state and disabled-write diagnostics remain available for
  `super_admin` inspection only, so the chapter-owned review surface stays
  operational instead of reading like a packet/debug lane

Observed first viewport:

- compact left rail with brand, active campaign, grouped nav, and leader
  identity visible together
- chapter home hero with `Boston College MEDLIFE`
- the home hero uses a title-led layout rather than a large circular score
  badge; `E-Board roles`, `Committees active`, and `Health Score` sit as the
  compact right-side stat stack
- quick actions are present in the hero itself, and the chapter-metrics block
  follows immediately after that hero before the lower risk-review sections
- `Risk Alerts` and `This Week's Priority` still belong high on the surface,
  but they sit below the visible metrics cluster rather than replacing it
- the first four visible alerts should stay concrete and operational:
  `Member Engagement committee has no chair — inactive for 3 weeks`,
  `Fundraising committee has low activity — only 9 actions completed this
  month`, `No bridge videos submitted this month from 3 of 7 committees`, and
  `Follow-up overdue after 'Tabling: Quad Recruitment' (Jun 15)`
- the visible priority sentence is specific, not generic:
  `Activate Member Engagement committee, collect bridge videos from all chairs,
  and push the SLT sign-up campaign.`

Verified clickthrough screens:

- `Chapter Home` shows `Chapter Leadership Home`, chapter metrics, `Risk
  Alerts`, `This Week's Priority`, and the quick actions cluster; the live
  Make render places the chapter-metrics grid above the lower risk and
  priority review panels
- keep the home-screen alerts concrete instead of abstract review framing; the
  Make state explicitly calls out inactive Member Engagement ownership, low
  Fundraising activity, missing bridge-video coverage, and overdue follow-up
  after `Tabling: Quad Recruitment`
- keep the home priority sentence literal to the mockup:
  `Activate Member Engagement committee, collect bridge videos from all chairs,
  and push the SLT sign-up campaign.`
- keep the overview risk-alert cards compact in the first viewport: concrete
  alert title first, severity visible, and a narrow direct route action instead
  of a long explanatory review paragraph under every alert
- keep the overview priority block similarly compact: lead with the literal
  priority sentence and keep any follow-up route actions as small review links
  rather than a second explanatory paragraph
- the home hero itself should lead with the narrow CTA pair `Create Event` and
  `Assign Action`; `Review Members`, `Promote Emerging Leader`, and `Share
  Bridge Video` belong in the lower `Quick Actions` section instead of
  expanding the hero CTA cluster
- keep the top labels in exact title case from the Make render:
  `E-Board roles`, `Committees active`, `Health Score`, and `Chapter Metrics —`
  for the dated metrics section heading
- `Member Pipeline` shows the searchable pipeline table with route-owned member
  review context instead of collapsing straight into a person-detail surface;
  the `Export` and `Add Member` CTA cluster should stay visibly attached to
  that first viewport, not drift below the filter/table fold
- `Review Members` should open an explicit chapter-owned member-pipeline review
  state before the leader drops into a person-level member profile
- keep the plain pipeline route generic until a leader actually selects a
  person: top-level `Export` / `Add Member` actions should not silently carry
  a default member id, while row drill-ins should open the explicit
  `/chapter?view=member_profile&member=...` route
- the live Make clickthrough exposes the member-pipeline filter as a compact
  select-style control, so the local route should keep that first filter row
  feeling like one owned control instead of an expanded nav drawer
- keep the search field, pipeline-level filter, and visible member count packed
  into one compact control band above the table so the first viewport reads
  like an operating row, not stacked form sections
- keep the visible member-pipeline filter language literal to the Make control:
  `All Pipeline Levels`, `E-Board`, `Chair`, `Chair candidate`, `Active
  contributor`, and `General member`; any legacy follow-up slice can stay
  route-supported for review flows, but it should not replace the default
  visible control vocabulary
- `Leaderboard` shows region filtering, metric-pill sorting, an `Ideas to try`
  strip, ranked chapter cards, and per-row `Best practices` CTAs
- when `Best practices` opens the feed-analytics route, keep the benchmark
  chapter visible as a compact comparison card inside that destination surface
  so the chapter example stays concrete while leaders review posts and
  re-engagement targets
- keep the comparison header dense: metric pills should read as the primary
  control row, the region filter should stay compact, and the `Ideas to try`
  strip should remain comfortably in the first viewport with the top-ranked
  cards starting immediately below it
- local parity note: keep the leaderboard region filter behaving like one
  immediate route-owned control rather than a select-plus-apply form; changing
  the visible region should be enough to move the route state
- `Committees` shows aggregate committee counts, `Add Committee`, and
  committee-row health states including `Needs Attention` and `Inactive`
- `Events` shows `Create Event`, the `All Committees` filter, and a chapter
  events table that should behave like a selectable operating surface rather
  than a dead report
- `Impact` shows a story-first dashboard with local/global impact sections and
  direct storytelling CTAs
- in live browser inspection, even when the Make `Path to page or screen`
  control was set to `impact`, the more reliable visible CTA language still
  read `Share Bridge Video`, so prefer that action label over
  `Create Bridge Video` in the local route
- `Succession` expands into leadership-gap review, candidate pipeline, and the
  transition timeline
- `Feed Analytics` shows `Share to Feed`, `Ask Members to Respond`, engagement
  KPI cards, a recent-posts table, and re-engagement targets

Verified local route proof:

- `/chapter` is a leader-owned command-center route; member, coach, staff, and
  other non-leader roles should be sent back to their owned landing surface
  instead of seeing a generic chapter snapshot fallback with source-status
  chrome inside the readable product shell
- `/chapter?view=members` opens the member-pipeline review table as a
  chapter-owned primary surface without review-data chrome inside the readable
  command-center shell
- `/chapter?view=impact` opens the story-first impact dashboard as the primary
  command-center surface, not a review shell with extra source-status chrome
- `/chapter?view=succession&member=...` opens the leadership-gap, candidate,
  and transition-timeline surface as the active route-owned review state

Verified leader screen-title contract:

- `Chapter Home` opens `Chapter Leadership Home`
- `Leaderboard` stays `Leaderboard`
- `Member Pipeline` stays `Member Pipeline`
- `Committees` stays `Committees`
- `Events` stays `Events`
- `Impact` can expand into an impact-focused dashboard surface, but the nav
  contract remains `Impact`
- `Bridge Videos` stays `Bridge Videos`
- `Succession` expands into the leadership-succession surface
- `Feed Analytics` stays `Feed Analytics`

Local alignment note:

- keep the visible screen title as `Leaderboard`, not a descriptive slogan
- keep the visible screen title as `Events`, not `Events & attendance`
- keep the visible screen title as `Impact`, even when the surface expands into
  a fuller impact dashboard
- keep the nav contract as `Succession`, while the local surface heading stays
  `Leadership Succession` to match the Make clickthrough
- verified local route proof:
  - `/chapter?view=events` now renders `Events` as the visible route title
    while keeping the deeper attendance and proof operations below the
    first-viewport contract
- keep the visible screen title as `Feed Analytics`, not `Feed & Engagement
  Analytics`
- prefer `Re-engagement Targets` for the low-engagement follow-up section so
  the route language matches the mockup's action orientation
- keep the bridge-library screen title as `Bridge Videos`, not `Bridge Video
  Hub`

Clickthrough rule:

- the sidebar buttons, visible CTAs, and resulting panels are more reliable
  than the Make `Path to page or screen` field
- during live inspection, the preview changed screens while that path control
  continued to show `home`, so do not mirror that as local route truth
- use the visible screen state as the contract and map it onto explicit local
  query-param views

State rule:

- visible bridge-video category pills should map to explicit route state rather
  than static badges, so leaders can open filtered library views directly
- response-oriented feed CTAs should land in a specific member-follow-up state
  when the intent is re-engagement, not just the broad member workspace
- when that member review was opened from a selected post, keep the post
  summary and visible performance metrics inside the member-review context
  block so the leader never loses which content signal surfaced that student
- when a feed post is selected, surface that selected-post review state before
  the generic KPI cards so the route reads as a post-specific operating review,
  not just the overview dashboard with an extra panel appended later
- leaderboard region and metric controls should stay route-owned so chapter
  comparisons, best-practice handoffs, and return paths remain stable
- committee health rows should stay selectable/expandable states rather than a
  flat report table
- local chapter contract: keep committee inspection inside
  `/chapter?view=committees&committee=...`, and treat `Add Committee` as a
  chapter-owned review state before leaving for the broader committee workspace
- keep the plain `/chapter?view=committees` route generic: do not silently
  preselect a default committee or attach `Add Committee` to an inherited lane;
  the selected committee detail block should appear only once the route
  explicitly carries `committee=...`
- local events contract: keep the `All Committees` combobox as explicit
  `/chapter?view=events&eventCommittee=...` route state, and let `Create Event`
  open a chapter-owned review state before the broader event flow
- keep the committee filter behaving like one compact owned control instead of
  a form row with a second confirmation button; changing the visible
  `All Committees` select should be enough to move the route state
- event rows should stay chapter-owned first too:
  `/chapter?view=events&event=...` is the review state, and any generic
  Rush-Month event handoff should happen only after the selected event details
  stay visible inside the command center
- direct leader landings on `/rush-month/events` or
  `/rush-month/events/[eventId]` should snap back to the chapter-owned events
  route unless the URL is carrying the explicit chapter handoff source
  (`chapter_create_event` or `chapter_event_review`)
- when an event row is selected, show that chapter-owned event-detail state
  before the lower KPI strip so the table selection and the review handoff read
  as one continuous operating surface
- keep the events route structurally flat in the same way: the table and any
  selected-event review state belong in the top operating surface, while the
  generic event KPI strip should sit below as a sibling section
- local feed contract: treat `Share to Feed` and `Ask Members to Respond` as
  feed-owned handoff states first, not plain links to the broader bridge-video
  or member-review surfaces
- local bridge-video contract: treat per-card `Feature` as a selected-video
  review state inside `/chapter?view=bridge_videos&bridgeVideo=...` before any
  future write lane is opened
- once a bridge video is selected, do not immediately repeat that same entry in
  the lower library list; the selected-video review block should own the active
  asset, while the list below stays focused on adjacent bridge-video options
- when an impact story is selected, show that `Story in focus` review state
  before the broader highlight grid and before the lower local/global impact
  sections so the route still reads as a story-owned dashboard, not just the
  generic impact overview with a selected card appended later
- keep the campaign-impact section visible as its own lower sibling surface,
  rather than leaving the route as highlights plus stats only; the impact
  screen should carry chapter story, campaign progress, and local/global
  outcome sections together
- once a story is selected, do not immediately repeat that same story again in
  the lower highlight-card grid; the selected-story review block should own
  that narrative slot, with the remaining cards acting as adjacent options
- when `Bridge Videos` is opened from impact storytelling, keep the
  impact-story handoff and any selected-video review state above the generic
  metric strip and category pills so the route still leads with the active
  story decision, not just the library summary
- when `Bridge Videos` is opened from a selected feed post, keep that post in
  focus inside the library surface itself with summary and visible performance
  metrics; the route should not rely on the outer handoff banner alone
- keep the bridge-video route structurally split the same way: top library
  review surface first, then the generic metric strip, then category/library
  sections below as sibling surfaces instead of one dashboard card wrapping
  everything
- when a succession candidate is selected, keep that `Selected candidate`
  review state above the generic succession KPI strip so the route reads like
  a person-owned transition review before it broadens into chapter-wide
  leadership-gap and timeline context
- the `Full table` control inside the candidate pipeline should hand off into
  the generic member-pipeline route (`/chapter?view=members`) instead of
  staying as a passive badge
- keep the succession route structurally flat after that top review surface:
  the leadership-gap section, candidate pipeline, and transition timeline
  should read as sibling operating sections rather than cards nested inside a
  larger dashboard wrapper
- local leaderboard contract: metric pills should own explicit leaderboard
  comparison state, the visible region selector should stay route-owned inside
  `/chapter?view=leaderboard&region=...`, and per-row `Best practices` should
  open a chapter-specific handoff before dropping the leader into feed
  analytics

Notes:

- The Make render showed `Events` as an ambiguous label with more than one hit.
  Keep the local app route explicit as `/chapter?view=events`.
- Keep the chapter-home screen label in exact Title Case:
  `Chapter Leadership Home`.
- The compact left rail should read like the `Student Leadership Command Center`
  prototype, with a concise `Leadership Center` brand subtitle instead of a
  generic leadership dashboard shell.
- The left rail should behave like a compact operating sidebar, not a duplicate
  overview surface. In the desktop mockup, brand, campaign context, chapter
  identity, and nav groups stay visible together in the first viewport, while
  quick actions and weekly-priority review belong to the main content surface.
  `/chapter` should keep long descriptive copy and bulky summary cards out of
  the rail so navigation remains the dominant operating frame.
- the weekly-priority area should stay operational too: action focus, key
  counts, and next-step buttons first, with any extra rationale compressed
  rather than expanded into separate explainer cards

## 3. Staff Command Center

Reference:

- `Staff Command Center Dashboard`

Observed navigation:

- `Chapters`
- `Campaigns`
- `Proof / UGC`
- `Feed Studio`
- `Feed Analytics`
- `HubSpot`
- `Best Practices`
- `Admin`

Recommended local ownership:

- `/staff?view=chapters`
- `/staff?view=campaigns`
- `/staff?view=proof_ugc`
- `/staff?view=feed_studio`
- `/staff?view=feed_analytics`
- `/staff?view=hubspot`
- `/staff?view=best_practices`
- `/staff?view=admin`

Observed per-view intent:

- `Chapters` = portfolio table, risk scan, export, coach packet
- `Campaigns` = campaign operations, interventions, coach review, and risk-lane
  drill-in from the summary cards into a narrower execution table
- `Proof / UGC` = queue and moderation states
- `Feed Studio` = member/leader audience curation
- `Feed Analytics` = content performance view with an overview-first table state
  and a selected-post impact panel
- `HubSpot` = chapter intelligence lookup
- `Best Practices` = reusable operating patterns with share actions
- `Admin` = system health and failed job retry visibility

Verified Best Practices controls from the live Make clickthrough:

- campaign filter select
- country filter select
- per-card `Share to Feed`
- per-card `Send to Coaches`

Observed first viewport:

- heading: `Portfolio Overview`
- dense KPI strip plus filter row at the top
- portfolio table is the main body surface, not secondary content below large
  hero treatment
- risk posture is encoded directly in the table via status and decision fields

Verified portfolio-screen details:

- top nav exposes all 8 staff screens in one strip
- keep the dark control bar feeling branded and operational: `myMEDLIFE`
  identity at the left, the eight route tabs as the primary control row, and
  the intervention badge visible in that same header strip
- filters include risk, country, campaign, and coach
- visible table columns include chapter, coach, campaign, status, leads, RSVPs,
  attendance, assignments, evidence, points/week, HubSpot, last active, risk,
  and decision
- keep the portfolio filters behaving like immediate owned controls rather
  than a separate apply-form workflow; the toolbar should feel like one dense
  operating strip, and `Export` should remain a real action instead of doubling
  as the filter submit path
- local parity note: the default `/staff?view=chapters` pass should keep the
  top strip compact and navigation-first so `Portfolio Overview` remains the
  first working surface instead of sitting below a generic command-center hero
- local shell note: on that default `Chapters` state, keep `myMEDLIFE` and
  `Staff Command Center` present as compact shell identity inside the dark top
  strip, then let `Portfolio Overview` remain the first full content heading
- local compactness note: keep the KPI band, filters, and secondary portfolio
  actions vertically tight so the chapter table enters the first viewport
  sooner; avoid a tall spacer row that makes the table feel like a secondary
  section below the overview controls

Verified screen-title contract from the dedicated staff Make file:

- `Chapters` opens `Portfolio Overview`
- `Campaigns` opens `Campaign Operations`
- `Proof / UGC` opens `Proof / UGC Review Queue`
- `Feed Studio` opens `Feed Curation Studio`
- `Feed Analytics` opens `Feed Analytics`
- `HubSpot` opens `HubSpot + Chapter Intelligence`
- `Best Practices` opens `Best Practices Library`
- `Admin` opens `System Health`

Verified local route proof:

- `/staff?view=feed_analytics` opens the overview-first `Feed Analytics`
  surface with the post-performance table visible as the primary command-center
  state, without review-data chrome in the readable shell
- `/staff?view=campaigns` opens directly into `Campaign Operations`
  without the generic staff hero, metric strip, or portfolio snapshot stack
  taking over the first viewport
- `/staff?view=best_practices` opens directly into `Best Practices Library`
  so the library header, filters, and share actions land before generic
  command-center scaffolding
- `/staff?view=hubspot` opens directly into `HubSpot + Chapter Intelligence`
  as a route-level page heading instead of an inner panel title
- `/staff?view=admin` opens `System Health` as the default admin route title,
  while the member-home handoff still lands as `Admin Console`
- `/staff?view=best_practices&bestPractice=...` should preserve the selected
  practice state in the live route, with the explicit `Selected practice`
  block visible before the library card grid
- `/staff?view=feed_studio&bestPractice=...` should preserve the best-practice
  source context so the curation route still explains which library pattern
  opened the share flow and how to return
- `/staff?view=feed_analytics&feedPost=...` opens the selected-post impact
  panel while preserving feed-draft and audience context
- `/staff?view=proof_ugc&proof=...` should make the chosen moderation state
  visible before the generic queue list, so the route reads like a selected
  review workflow first and a queue second
- when a feed post is selected, keep that `Impact Analysis` review state above
  the generic KPI strip and post-performance table so the route still reads as
  a selected-post operating review first, not the overview dashboard with an
  extra side panel appended later
- local leader alignment note: the chapter-leader selected-post block should
  also use `Impact Analysis` language, not a generic `Selected post` label, so
  the route framing matches the review intent
- local leader alignment note: selected-post CTAs in `Feed Analytics` should
  consistently read `Open member review`, not oscillate between `review` and
  `follow-up`, so the action language stays stable across posts and handoff
  contexts
- local leader alignment note: bridge-video handoff CTAs should prefer the
  direct `Share Bridge Video` language over generic wording like `Open sharing
  flow`, so the route action reads the same way the Make surface presents it
- `/staff?view=chapters&chapter=...&decision=...` opens the chapter drawer as
  a route-owned support state with coach-decision posture, quick links, and
  pinned intervention actions visible in the same review surface

Shell note:

- the desktop shell should read `Staff Command Center` in Title Case
- keep the screen label in the content area distinct from the nav label when
  the mockup does that, especially `Feed Studio` -> `Feed Curation Studio` and
  `Admin` -> `System Health`
- avoid review-only sample chips like `Staff Command Center sample`; the shell
  should feel like the real command center even when the data source is mock
- keep the data-source notice out of the readable staff command-center shell;
  source-status messaging belongs in blocked states and admin/review lanes

Screen-family note:

- the Make reasoning pane explicitly calls out 8 navigable staff screens plus a
  right-side chapter detail drawer
- use that as part of the build map even when each screen is not exhaustively
  crawled in one pass

Drawer rule:

- the chapter drawer should read like a decision workspace, not just a chapter
  facts panel
- selecting `Advance`, `Hold`, or `Intervene` should visibly change the support
  posture and pinned footer actions before the reviewer leaves the drawer
- the drawer should surface decision-led content near the top of the review
  stack: current posture, focus-now bullets, and recent signals that explain why
  the selected move is being recommended
- local parity note: the drawer should keep the underlying recommended move
  visible even when the reviewer previews a different posture, so the workspace
  clearly distinguishes system recommendation from reviewer-selected action

Campaign view rule:

- the campaign risk cards should behave like clickable state selectors, not
  passive summaries
- choosing a risk card should keep the reviewer on the same campaign screen but
  narrow the execution table to that exact risk lane
- campaign tabs, bulk actions, and chapter-detail links should preserve the
  selected campaign-risk state until the reviewer clears it

Proof-review rule:

- the side review panel should explain consent and approval posture in plain
  language, not only as terse pills
- approval tiers should show why a tier is allowed or blocked so the reviewer
  can tell what consent posture is actually permitting

Notes:

- The desktop rail should stay compact and navigation-first. The staff mockup
  reads like an operating command center, so the local `/staff` surface should
  keep long summary copy and stacked stat cards out of the space above the
  primary view navigation.
- the top staff-screen strip should read like a compact operating toolbar:
  active screen, navigation, and timestamp first; descriptive helper prose is
  secondary at best
- local parity note: on non-`chapters` staff screens, avoid a full helper line
  like `...keeps the current HQ review lane in focus.` in the dark top strip;
  let the shell title, active pills, and the screen's own content header carry
  the context instead

## 4. SLT Prep

Reference:

- `myMEDLIFE SLT Prep Phase`

Observed surfaces:

- overview / home
- trip prep checklist
- flight details
- trip timeline
- notifications / profile-style communication surface
- staff dashboard

Recommended local ownership:

- `/slt-prep`
- `/slt-prep/checklist`
- `/slt-prep/flights`
- `/slt-prep/timeline`
- `/slt-prep/profile`
- `/slt-prep/staff`

### Overview

Observed visible state:

- `Peru SLT — July 2026`
- `Readiness Score`
- `SLT Deadlines`
- `Checklist`
- CTA-like items for overdue and due-soon work
- bottom nav: `Home`, `Trip Prep`, `Events`, `Profile`

Observed transitions:

- deadline cards -> checklist item detail or deadline-specific route
- `View all` -> timeline
- `Staff Dashboard Access` -> staff traveler readiness screen

Verified overview deep links from the live render:

- `/timeline`
- `/payments`
- `/forms`
- `/checklist`
- `/meetings`
- `/extensions`
- `/item/flight-info`
- `/staff-dashboard`

Local alignment note:

- the current app surface should name the readiness block `Readiness Score`
  and expose the numeric percentage directly, so the overview reads like a
  traveler-readiness dashboard rather than a generic checklist summary
- the traveler packet should prefer the explicit label `Notifications` over
  `Alerts` when naming the route in subnav / packet navigation

Recommended app mapping:

- overview -> `/slt-prep`
- `View all` -> `/slt-prep/timeline`
- `Staff Dashboard Access` -> `/slt-prep/staff`

Handoff rule:

- when Overview sends the traveler into a specific checklist detail, preserve
  that the detail came from Overview so the return path still feels attached to
  the readiness summary and deadline stack
- if staff or coach opens that same overview for a selected traveler, preserve
  the selected traveler across the subnav and child routes so the packet stays
  attached to the reviewed person rather than snapping back to a generic
  traveler view

### Trip Prep

Observed visible state:

- `Readiness Checklist`
- status filters: `All`, `Missing`, `Due Soon`, `Complete`
- source hints embedded in rows:
  - `Shopify`
  - `HubSpot`
  - `Luma`

Recommended local ownership:

- `/slt-prep/checklist`
- `/slt-prep/checklist/[itemId]`
- `/slt-prep/flights`

Build rule:

- keep external systems mock-safe and visibly separated from app truth
- when Checklist opens a specific detail route, preserve that source so the
  detail still feels like one item inside the task inventory rather than a
  disconnected form
- if the checklist is opened for a selected traveler from staff review, keep
  that traveler attached to checklist filters, detail links, and back paths

### Flights

Observed visible state:

- flight-specific status separate from general profile
- outbound vs return itinerary context
- upload / confirmation posture

Recommended local ownership:

- `/slt-prep/flights`

Build rule:

- keep the flight route distinct from general profile so itinerary issues are
  easy to scan and route from alerts

### Events / Timeline

Observed visible state:

- heading: `Trip Timeline`
- major milestones from deposit through departure day

Recommended local ownership:

- `/slt-prep/timeline`

Route-family rule:

- when a coach or staff reviewer opens timeline for a selected traveler, keep
  that traveler attached to the timeline subnav and nearby packet routes

### Profile / Notifications

Observed visible state:

- `Notifications`
- `Recent Notifications`
- `Communication Preferences`
- actions such as `Submit flight info`, `Join meeting`, `Pay balance`,
  `Choose extension`

Recommended local ownership:

- `/slt-prep/profile`
- notification actions should deep-link into the relevant prep route
- `Submit flight info` should deep-link into `/slt-prep/flights`

Current parity note:

- `/slt-prep/profile` should feel like the bottom-nav destination from the Make
  prototype by blending traveler profile context with recent notifications and
  communication posture
- `/slt-prep/notifications` can remain the expanded alert-feed route
- `/slt-prep/notifications` should lead with `Notifications`,
  `Recent Notifications`, and `Communication Preferences` rather than
  review-only explainer cards
- traveler profile and notifications routes should stay traveler-owned surfaces;
  preserve selected traveler context in URL/deep links, but keep the staff
  review handoff card in `/slt-prep/staff` instead of rendering it on the
  traveler pages themselves
- `/slt-prep/forms` now should lead with `Required Forms Hub` and keep the
  traveler-specific context in supporting copy instead of putting the traveler
  name into the route title itself
- `/slt-prep/payments` now should lead with `Payment Status` and keep the
  traveler-specific context in supporting copy so the route reads like the
  packet label first and the selected traveler second
- `/slt-prep/payments` should also preserve the visible first-viewport finance
  hierarchy from the Make screen: `Payment Options`, `Payment History`, and
  `Payment Information` should remain literal route headings instead of being
  replaced by generic local support labels
- `/slt-prep/meetings` now should lead with `Pre-Trip Meetings` and keep the
  traveler-specific context in supporting copy so the route reads like the
  packet label first and the selected traveler second
- `/slt-prep/extensions` now should lead with `Extensions & Tours` and keep the
  traveler-specific context in supporting copy instead of naming the screen as
  a traveler-specific add-on summary
- `/slt-prep/extensions` should keep the intro copy close to the Make tone:
  optional Peru add-ons, lasting memories, and early booking pressure, without
  reading like a detached purchasing tool
- `/slt-prep/forms`, `/slt-prep/payments`, `/slt-prep/meetings`, and
  `/slt-prep/extensions` should stay inside that same traveler packet instead
  of dropping a selected traveler back to generic subpages

Handoff rule:

- when Profile or Notifications sends the traveler into a specific checklist
  detail, preserve whether that detail came from the profile blend or the
  notification feed so the return path and explanation stay specific
- when those routes are opened for a selected traveler from staff review, keep
  the selected traveler attached to the notification, profile, and next-step
  prep links, but do not render a second staff-review handoff card on the
  traveler screens themselves

### Staff Dashboard

Observed visible state:

- heading: `Traveler Readiness Dashboard`
- summary counts for total travelers, ready, need attention, high risk
- filters:
  - `All`
  - `Missing Flights`
  - `Missing Forms`
  - `Unpaid Balance`
  - `High Risk`

Recommended local ownership:

- `/slt-prep/staff`

Observed model:

- staff dashboard is a distinct reviewer surface for traveler readiness
- treat it as a real operating destination, not a modal attached to the
  traveler screens

Local alignment note:

- the first viewport should keep `Traveler Readiness Dashboard`, the four
  summary counts, and the filter pills visible together
- prefer the filter set `All`, `Missing Flights`, `Missing Forms`,
  `Unpaid Balance`, and `High Risk`
- avoid review-only explainer cards like dashboard-posture or support-watchout
  panels competing with the reviewer surface
- keep the readable dashboard focused on traveler operations rather than a
  mock-source badge; source-status messaging can stay in review/admin routes

Handoff rule:

- if the staff dashboard drills into a specific traveler blocker, preserve that
  the checklist detail came from Staff so the screen can explain the reviewer
  context instead of pretending it is always a traveler-owned route
- keep that same selected traveler attached if the reviewer moves from the
  detail into related traveler routes like profile, flights, timeline, or back
  into staff

## 5. Build Guidance From The Clickthrough

Use the Figma Make files as a route and state source in this order:

1. visible nav items
2. observed CTA transitions
3. view-specific sections, cards, tables, and filters
4. polish, spacing, and color treatment

When the Make render is incomplete or inconsistent:

- preserve the route if the product brief requires it
- follow the repo's existing route pattern
- note the gap instead of deleting the surface from the app

Shell rule for command-center surfaces:

- chapter leader, coach, and staff command centers should not stack a second
  desktop-global header above the mockup-owned sidebar navigation
- let the surface itself own the primary desktop navigation model
- keep review-only tools and safety notices present, but secondary to the
  command-center frame
- on readable command-center shells, keep source-status notices out of the
  first-party product frame and reserve them for blocked states or admin/review
  surfaces

## 6. Suggested Implementation Order

Use this order for parity work after the current leader-nav pass:

1. close the member mobile loop end to end: home -> campaigns -> action detail
   -> submit evidence -> events -> points -> profile, because the Make file
   exposes that sequence most concretely
2. finish the SLT loop from overview -> checklist -> detail -> timeline ->
   staff dashboard so the traveler and reviewer stories feel connected and the
   overview behaves like a real routing hub
3. tighten chapter leader query-param views until each nav item feels like its
   own operating surface, especially `member_profile`, `committees`, `impact`,
   `bridge_videos`, `succession`, and `feed_analytics`
4. tighten staff command center view density and transitions, especially
   `campaigns`, `proof_ugc`, `best_practices`, and `admin`
