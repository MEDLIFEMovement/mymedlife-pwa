# Figma Implementation Matrix

This document turns the Figma Make mockups into an implementation map for
myMEDLIFE across all of the dimensions that matter in the app:

- routes
- roles
- clickthrough transitions
- states
- shell ownership
- data shape
- reusable component families
- integration boundaries

Use it with:

- `docs/architecture/figma-route-and-surface-map.md`
- `docs/architecture/figma-clickthrough-screen-inventory.md`

If live Figma access is temporarily unavailable, this matrix still stands as
the current build contract until the clickthrough inventory can be refreshed.

## Current Local Checkpoint

As of `2026-06-23`, the local repo clears the main implementation gates:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

That makes the current matrix useful as a parity and product-truth checklist,
not just as a future roadmap.

Current strongest verified surface families:

- chapter leader command center routes under `/chapter`
- cross-role command-center route-title hierarchy across coach and staff
- SLT traveler and staff route families clearing the current local goal gates

Verified recent parity passes:

- chapter leader: home / overview framing, member pipeline, member profile,
  committees, events, impact, bridge-video hub, succession, and feed analytics
- coach: campaign route hierarchy, chapter-detail route heading, and
  support-notes route heading
- staff: campaigns, proof queue, feed studio, feed analytics, hubspot,
  best-practices, and admin/system-health route headings
- SLT traveler: forms now leads with `Required Forms Hub`, meetings now leads
  with `Pre-Trip Meetings`, payments now leads with `Payment Status`,
  extensions now leads with `Extensions & Tours`, and those traveler routes
  keep the selected traveler context in their packet-safe handoffs while
  payments also restores the visible `Payment Options` and `Payment History`
  hierarchy from the Make clickthrough
- branch baseline: `pnpm test`, `pnpm lint`, `pnpm typecheck`, and
  `pnpm build` all passed on the current branch after these parity slices

What this implies for the next implementation slices:

- prefer remaining cross-role gaps over re-polishing already-verified chapter
  leader screens unless a new mismatch is found
- the member route family also clears its focused route suite, so next member
  passes should prioritize first-viewport hierarchy and route-identity cleanup
  over proving the existence of the top-level routes again
- the next SLT passes should focus on the remaining traveler packet routes
  where the packet is still more explicit than the current local wording,
  especially deeper checklist/detail states; the shared handoff copy now
  carries traveler-aware source context, so the remaining work is mostly about
  the last route-support details now that the packet-facing route titles are
  aligned
- SOP builder remains its own backend-lane parity track and should stay
  separated from the command-center route-title cleanup work
- when a remaining gap is discovered inside a verified family, keep the next
  pass bounded and evidence-backed, the same way the recent chapter leader
  passes were handled

## How To Use This Matrix

For any screen family we build or refine:

1. start from the role's default screen
2. mirror the visible first-viewport hierarchy
3. make every visible CTA land on a real route or state
4. model the screen's explicit state variants
5. seed the minimum data needed to make the screen believable
6. keep external systems mock-safe unless approval explicitly opens them

Do not declare parity from spacing and color alone. A screen is only "mapped"
when its routes, visible states, and clickthrough destinations are accounted
for.

## 0. Role-Based Login Workspace

Reference mockup:

- `Role-Based App Shells + Workspace Login`

Primary role:

- authenticated user choosing a workspace entry point

### Route map

- `/login`

### First-viewport contract

- workspace-oriented sign-in copy
- six workspace entry cards
- seeded account sign-in panel
- access-boundary explanation
- selected-workspace state

### Required clickthroughs

- General Member -> `/login?redirectTo=/app`
- Student Leader -> `/login?redirectTo=/leader`
- Sales Coach / Sales Staff -> `/login?redirectTo=/staff`
- Staff -> `/login?redirectTo=/staff`
- Data Solutions / Admin -> `/login?redirectTo=/admin`
- Super Admin -> `/login?redirectTo=/admin`

### Required states

- default sign-in
- selected workspace card
- signed-in session summary
- disabled / review-mode session
- nested redirect preserved
- unsafe redirect rejected

### Data domains

- workspace cards
- seeded review accounts
- auth session state
- redirect target
- access boundaries

### Component families

- intro hero
- workspace card grid
- seeded account form
- session summary panel
- boundary summary panel

### Boundaries

- the clicked workspace is only an entry point
- post-auth routing must still be role-driven
- nested owned destinations like `/app/slt-prep` should stay available when selected through the redirect target

## Cross-Surface Build Rules

### Role ownership

- Member surfaces own the mobile-first student loop.
- Chapter leader surfaces own chapter operations and people management.
- Coach surfaces own a narrower chapter portfolio and support workflow.
- Staff and admin surfaces own HQ operations, review, and health visibility.
- SLT Prep includes both a traveler experience and a distinct staff reviewer
  surface.

### Shell ownership

- Member and SLT traveler flows own their mobile bottom-nav feel.
- Chapter, coach, and staff command centers own their desktop navigation frame.
- Do not add a second competing desktop-global header above a mockup-owned
  command-center shell.
- Keep source-status notices out of readable chapter, coach, staff, and SLT
  staff command-center shells; reserve them for blocked states and admin/review
  surfaces.

### External systems

- HubSpot, Luma, Shopify, n8n, warehouse, Power BI, SMS/email, and AI actions
  remain blocked or read-only until explicit approval opens a lane.
- Their names may appear as status sources or mock context where the mockups
  imply them, but they do not become live sources of truth by default.

### Canonical role and scope layer

- Treat the full-send-package role model as the product contract:
  `student_member`, `traveler`, `committee_member`, `committee_chair`,
  `eboard_officer`, `vice_president`, `president`, `coach`,
  `department_staff`, `sales_coach`, `sales_admin`, `ds_admin`,
  `super_admin`.
- Treat these scopes as the product contract:
  `own`, `committee`, `chapter`, `assigned_coach_portfolio`, `department`,
  `all_platform`, `breakglass`.
- Keep current database keys and hosted policies compatible by translating at
  the app boundary first.
- Do not let route or component visibility depend on scattered raw
  audience-string checks once the canonical layer is available.

## 1. Member Mobile App

Reference mockup:

- `myMEDLIFE App Prototype`

Primary role:

- student / member

### Route map

- `/`
- `/campaigns`
- `/rush-month`
- `/rush-month/dashboard`
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- `/rush-month/events`
- `/rush-month/events/[eventId]`
- `/rush-month/evidence`
- `/rush-month/leaderboard`
- `/profile`

### First-viewport contract

- chapter identity
- personal greeting
- this-week priority
- home-owned role-jump control cluster
- active campaign summary
- assigned actions
- points / leaderboard summary
- upcoming events
- coach message
- bottom navigation

### Required clickthroughs

- active campaign card -> `/campaigns`
- `Start next action` -> specific action detail route
- `See all` in actions -> `/rush-month/actions`
- `RSVP` -> `/rush-month/events/[eventId]`
- points / leaderboard CTA -> `/rush-month/leaderboard`
- bottom nav destinations:
  - `Home` -> `/`
  - `Campaigns` -> `/campaigns`
  - `Events` -> `/rush-month/events`
  - `Points` -> `/rush-month/leaderboard`
  - `Profile` -> `/profile`
- role jumps:
  - `Leader Hub` -> `/chapter?view=overview`
  - `Coach View` -> `/coach?view=chapters`
  - `Admin` -> `/staff?view=admin`
- keep `Full board` as the chapter leaderboard CTA on Home, not as a fourth
  switch-view control
- when those role jumps open, preserve the handoff as a named surface transition
  into `Leader Hub`, `Coach Dashboard`, or `Admin Console`, with a clear
  `Student view` path back into the member loop

### Required states

- default home
- campaign overview
- assigned-actions list
- action detail
- submit-evidence state
- direct non-member landings on `/rush-month/actions/[assignmentId]` should
  redirect back to the broader actions lane so the member task route stays
  member-owned
- leader follow-up queues and leader-visible assignment cards should keep
  review inside `/rush-month/actions` with an assignment-selected state instead
  of sending leaders into the member-owned detail route
- event list
- event detail / RSVP state
- points / leaderboard
- profile
- confirmation state after evidence submission

### Data domains

- member profile
- chapter
- campaign
- assignments
- events
- points / leaderboard
- coach message
- proof status

### Component families

- mobile hero / greeting block
- campaign progress card
- action cards
- event cards
- points stat cards
- bottom nav
- submit-evidence form
- confirmation panel

### Current parity note

- the member campaign route now restores the `What Good Looks Like` checklist
  plus the featured `Intro GBM` event summary from the Make clickthrough,
  instead of flattening the screen to KPIs, role groups, and buttons alone
- the member action-detail route now keeps `Action Detail` as the route label
  while the assignment title owns the main hero hierarchy, matching the Make
  clickthrough more closely than the earlier title-first local pass
- the local member action-detail panel now exposes that route label as a real
  secondary heading signal, so the screen reads closer to the Make hierarchy
  and gives the route label better accessibility than plain body text

### Boundaries

- event attendance and proof approval can be mocked
- no external sends
- no live CRM writes
- no live AI actions

## 2. Rush Month Campaign Loop

Reference mockup:

- `myMEDLIFE App Prototype`

Primary roles:

- member
- chapter leader
- coach / staff as downstream reviewers

### Route map

- `/campaigns`
- `/rush-month`
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- `/rush-month/events`
- `/rush-month/events/[eventId]`
- `/rush-month/evidence`
- `/rush-month/leaderboard`

### Visible build contract

- campaign phase is explicit
- KPI strip is explicit
- assigned actions are grouped by role
- why-it-matters context is visible
- evidence requirements are visible before submission

### Required states

- campaign overview
- action not started
- action in progress
- submit-evidence open
- submitted / pending review
- approved / rejected proof status
- event RSVP state
- leaderboard context for the same campaign

### CTA contract

- `/rush-month` -> redirect into `/rush-month/dashboard` so the top-level
  campaign entry lands inside the owned member loop instead of drifting into a
  dead shell
- direct leader landings on `/rush-month/events` or
  `/rush-month/events/[eventId]` should redirect back into
  `/chapter?view=events` with the selected event preserved, unless the route
  is explicitly carrying chapter review handoff context
- `View my actions` -> `/rush-month/actions`
- `Submit evidence` -> assignment-scoped submit state
- event-detail follow-up -> next concrete action or proof handoff
- leaderboard CTA should reinforce the same campaign loop, not escape into a
  generic dead end
- if the points surface shows a next-step CTA, keep it on the owned points
  route together with recent approvals and the points explainer

### Data domains

- campaigns
- KPIs
- action assignments
- evidence requirements
- proof review status
- events
- points ledger

### Boundaries

- keep proof upload and approval lanes mock-safe unless the approved write path
  is explicitly open

## Current Backend Parity Note

- the internal backend routes now share an explicit lane nav so permissions,
  committees, workflows, SOP library, and campaign-specific builder screens
  behave like one owned admin route family instead of isolated pages
- the SOP builder now exposes a tab-specific workbench layer with route-backed
  default focus, adjacent-tab links, guardrails, and workflow stats so the
  first viewport reads like internal tooling rather than a static hero plus
  card list
- the SOP library now mirrors the Make library more directly with summary
  cards, route-owned status pills, search, and a table-style campaign list
- the steps tab now mirrors the Make builder more directly with a
  sections/versions/settings sidebar, a workflow-step canvas, and a right-side
  step-detail panel
- the role-matrix tab now behaves more like a real workflow matrix with
  role/action/access columns, route handoffs, and proof/points/KPI/comms
  summaries instead of only a generic selected-card stack
- the version-review tab now keeps current draft, current live version,
  impact-summary cards, publish controls, and change-log history visible
- the builder version lane now treats current template posture as a first-class
  selected record, so version/publish state is explicit instead of being
  inferred only from older history entries
- the completion tab now behaves more like the Make workflow gate view with
  completion-type coverage, evidence-type coverage, a completion/proof/approval
  rule table, and route-backed reviewer handoffs
- the points/KPI tab now keeps role-based point logic, chapter rollup posture,
  approval-before-points, leaderboard visibility, and KPI impact inside the
  same backend lane
- the comms tab now behaves like a trigger registry rather than a generic card
  stack, with source-system posture, timing, approval-needed, mock/live status,
  and integration boundaries visible together
- the preview tab now shows role-based impact rows for screen changes, action,
  proof, approval, points, KPI, and communication effects instead of only
  generic preview cards
- the SOP library now keeps selected campaign detail on the same route through
  `focus=...`, so the library behaves like a real registry workspace rather
  than only a filterable catalog
- visible builder controls now route into mock-safe on-screen action states for
  filter, add-step, duplicate-step, disable-step, publish, schedule, and
  rollback review instead of stopping at inert buttons
- the admin review packet is still stronger than the builder/configuration UX
- the builder routes and typed workflow rules now exist locally in mock-safe
  form
- the remaining backend gap is now the intentional mutation stop line: the
  route-owned review states for mutable actions exist, but actual
  reorder/create/persist/archive/publish behavior is still blocked
- the chapter leader overview hero now restores the large visible health dial
  from the Make command-center first viewport, so the command surface leads
  with chapter posture before the metrics grid
- the staff chapters overview now keeps the KPI strip above the filter toolbar,
  matching the Make portfolio screen's first-viewport scan order
- the compact staff header now behaves more like the Make control bar: branded
  left identity, tabs as the main control row, and the intervention signal kept
  in the header instead of reading like a generic local nav strip
- the compact staff header now also keeps stronger current-surface context and
  iconized view tabs, so the HQ lane reads like the same command-center family
  as chapter and coach instead of a flatter local dashboard shell
- the SOP builder now carries role-correct local preview handoffs across its
  route-backed tabs, so linked product surfaces are reviewed in the intended
  actor context instead of only through the admin reviewer route

## 3. SLT Prep

Reference mockup:

- `myMEDLIFE SLT Prep Phase`

Primary roles:

- student traveler
- staff reviewer

### Route map

- `/slt-prep`
- `/slt-prep/checklist`
- `/slt-prep/checklist/[itemId]`
- `/slt-prep/forms`
- `/slt-prep/payments`
- `/slt-prep/flights`
- `/slt-prep/meetings`
- `/slt-prep/extensions`
- `/slt-prep/timeline`
- `/slt-prep/notifications`
- `/slt-prep/profile`
- `/slt-prep/staff`

### First-viewport contract

- trip identity
- departure countdown
- readiness score
- alerts with urgency posture
- deadlines
- top actionable prep steps
- mobile nav / subnav into the rest of the flow

### Required clickthroughs

- overview cards -> exact checklist detail or route-level destination
- `View all` timeline -> `/slt-prep/timeline`
- notification actions -> exact prep destinations
- staff-dashboard access -> `/slt-prep/staff`
- if a staff or coach reviewer opens the traveler packet, selected-traveler
  context should persist across subnav destinations and child routes, but the
  traveler-facing `/slt-prep/profile` and `/slt-prep/notifications` pages
  should stay traveler-owned and avoid rendering a staff-review handoff card
  on the page itself

### Required states

- traveler overview
- checklist with filters
- checklist detail
- forms status
- payment status
- flights status
- meetings / orientation status
- extensions choice
- timeline
- notifications / communication preferences
- staff readiness dashboard

### Data domains

- trip
- traveler readiness
- checklist items
- forms
- payments
- flights
- meetings
- extensions
- notifications
- reviewer risk state

### Component families

- readiness score card
- alert cards
- checklist rows
- due-soon / risk pills
- itinerary panels
- timeline list
- traveler-readiness table
- bulk reviewer actions

### Boundaries

- Shopify, HubSpot, and Luma can appear as status-source labels only
- traveler/staff SLT routes keep separate ownership even when they share data

## 4. Chapter Leader Command Center

Reference mockup:

- `Student Leadership Command Center`

Primary roles:

- `committee_chair`
- `eboard_officer`
- `vice_president`
- `president`

### Route map

- `/chapter?view=overview`
- `/chapter?view=leaderboard`
- `/chapter?view=members`
- `/chapter?view=member_profile`
- `/chapter?view=committees`
- `/chapter?view=events`
- `/chapter?view=impact`
- `/chapter?view=bridge_videos`
- `/chapter?view=succession`
- `/chapter?view=feed_analytics`

### First-viewport contract

- owned desktop left rail
- chapter identity
- active campaign context
- health score / KPI strip
- risk alerts
- weekly priority
- quick actions

### Required states

- chapter overview
- leaderboard comparison state
- member pipeline state
- member profile state
- committee filter/detail state
- event filter/detail state
- impact storytelling state
- bridge-video review state
- succession state
- feed-analytics state

### Boundaries

- chapter routes own leader operating context first
- deeper review/write lanes may hand off to `/chapter/members`, `/proof-library`,
  or `/rush-month/review`, but do not flatten the chapter context prematurely

## 5. Coach Command Center

Reference sources:

- `Staff Command Center Dashboard`
- local coach route family

Primary roles:

- `coach`
- `sales_coach`

### Route map

- `/coach?view=chapters`
- `/coach?view=chapter_detail`
- `/coach?view=campaigns`
- `/coach?view=support_notes`

### First-viewport contract

- owned portfolio identity
- urgent chapter risks
- support next steps
- clear separation from the full HQ command center

### Boundaries

- coach view is narrower than staff HQ view
- coaches do not inherit admin configuration ownership by default

## 6. Staff HQ Command Center

Reference mockup:

- `Staff Command Center Dashboard`

Primary roles:

- `department_staff`
- `sales_admin`
- `ds_admin`
- `super_admin`

### Route map

- `/staff?view=chapters`
- `/staff?view=campaigns`
- `/staff?view=proof_ugc`
- `/staff?view=feed_studio`
- `/staff?view=feed_analytics`
- `/staff?view=hubspot`
- `/staff?view=best_practices`
- `/staff?view=admin`

### First-viewport contract

- dense portfolio framing
- filters and search
- KPI strip
- decision posture
- chapter drawer or review panel path

### Boundaries

- `/staff` owns HQ operations and review
- `/admin` owns backend inspection, launch/safety packets, and future config
- do not overload `/staff?view=admin` with builder/configuration flows that
  need dedicated backend routes

## 7. Admin Backend

Primary roles:

- `department_staff`
- `sales_admin`
- `ds_admin`
- `super_admin`

### Route map

- keep existing `/admin/*` review/safety routes
- add:
- `/admin`
- `/admin/permissions`
- `/admin/permissions?section=routes|personas`
- `/admin/permissions?section=...&focus=...`
- `/admin/committees`
- `/admin/committees?section=committees|campaigns`
- `/admin/committees?section=...&focus=...`
- `/admin/workflows`
- `/admin/workflows?section=lanes|onboarding|writes`
- `/admin/workflows?section=...&focus=...`
- `/admin/staff-dry-run`
- `/admin/sop-library`

### Build contract

- current launch/review packets remain first-class
- `/admin` now acts as the overview lane for the backend route family, so
  reviewers can move into the broader review and tooling lanes without the
  admin surface reading like a disconnected stack of pages
- `/admin/master-data` should keep a direct handoff to `/admin/sop-builder`
  visible so the master-data inventory remains obviously connected to the
  workflow builder instead of reading as a dead-end catalog
- new backend lanes should extend the admin story, not replace it
- committee registry state should stay route-owned on `/admin/committees`
- keep inspector/configuration routes read-only or mock-safe until explicit
  write approval exists

## 8. Campaign SOP Builder

Reference mockup:

- `SOP Creation Section`

Primary roles:

- `sales_admin`
- `department_staff`
- `ds_admin`
- `super_admin`

### Route map

- `/admin/sop-library`
- `/admin/sop-library?query=...&status=...&shell=...`
- `/admin/sop-builder/[campaignSlug]?tab=steps`
- `/admin/sop-builder/[campaignSlug]?tab=role-matrix`
- `/admin/sop-builder/[campaignSlug]?tab=completion`
- `/admin/sop-builder/[campaignSlug]?tab=points-kpi`
- `/admin/sop-builder/[campaignSlug]?tab=comms`
- `/admin/sop-builder/[campaignSlug]?tab=preview`
- `/admin/sop-builder/[campaignSlug]?tab=version`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...&mode=filter|add_step|add_step_after_last|duplicate_step|disable_step|publish|schedule|rollback`

### Data domains

- campaign versions
- SOP steps
- role action rules
- completion rules
- evidence rules
- approval rules
- points rules
- KPI rules
- communication trigger rules
- audit records

### Boundaries

- build as structured workflow tooling, not content editing
- keep search/filter state on the SOP library route
- keep the current selected library definition visible near the first viewport
  so workbench context does not disappear behind the lower table/detail sections
- keep selected builder detail on the same builder route through `focus=...`
- keep the builder's current tab and current focus explicit near the top of the
  page before the deeper tab-specific editor/workbench content
- downstream sends remain blocked
- use mock-safe local data and schema-shaped services first
- no live payment changes
- no live traveler data writes without approval

## 4. Student Leadership Command Center

Reference mockup:

- `Student Leadership Command Center`

Primary role:

- chapter leader / e-board

### Route map

- `/chapter`
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

### First-viewport contract

- chapter identity
- active campaign context
- left-rail navigation groups
- chapter health
- risk alerts
- weekly priority
- quick actions

### Required clickthroughs

- nav items -> explicit query-param views
- `Create Event` -> event creation flow or event-owned quick-action state
- `Assign Action` -> assignment flow or member-pipeline-owned quick-action state
- `Review Members` -> member pipeline / review state
- `Export` -> member-pipeline-owned export handoff state
- `Add Member` -> member-pipeline-owned intake handoff state
- member-pipeline approval handoff -> `/chapter/members`
- member-profile action buttons -> member-profile-owned review states before
  succession, assignment, or future note lanes
- impact CTAs and impact-highlight `Share this story` actions -> impact-owned
  storytelling handoff states before `Bridge Videos`
- `Submit Bridge Video` -> bridge-library-owned handoff state before
  `/proof-library`
- `Promote Emerging Leader` -> succession-owned quick-action state
- `Share Bridge Video` -> bridge-video-library-owned quick-action state
- leaderboard region filter and metric pills -> leaderboard-owned comparison
  state
- leaderboard `Best practices` CTA -> best-practice learning / handoff state
- `Add Committee` -> committee-owned create state
- committee create handoff -> `/action-committees`
- feed re-engagement CTAs -> specific member follow-up state
- `Share to Feed` and `Ask Members to Respond` -> feed-analytics-owned follow-up
  states instead of generic escapes
- bridge-video category pills -> filtered bridge-video state
- bridge-video / proof intake handoff -> `/proof-library/upload`
- leader evidence-review handoff -> `/rush-month/review`

### Required states

- chapter home overview
- leaderboard
- leaderboard filtered
- member pipeline
- person-level member profile
- committees
- committee detail / selected row
- committee-owned add-committee review state before `/action-committees`
- events
- event committee filter as route-owned state
- impact
- bridge videos
- succession
- feed analytics

### Route-owned proof already in app

- `/chapter?view=members` proves the member-pipeline table is a stable route
  state instead of only a component-level mockup
- `/chapter?view=impact` proves the story-first impact dashboard state
- `/chapter?view=succession&member=...` proves the selected-candidate
  succession surface with gaps and timeline context
- `/chapter?view=feed_analytics` proves the overview-first feed analytics
  surface, and feed-owned handoff states are separately covered in route tests

### Data domains

- chapter
- chapter health metrics
- campaigns
- member pipeline
- committees
- events
- proof / bridge videos
- succession readiness
- feed engagement

### Component families

- compact left rail
- KPI / health cards
- risk cards
- quick-action buttons
- member tables
- person drawer / profile sections
- content library cards
- analytics panels

### Boundaries

- leader writes can stay mock-safe until their lane is approved
- keep this surface chapter-owned, not HQ-admin flavored

## 5. Coach Command Center

Reference sources:

- `Staff Command Center Dashboard`
- role-model guidance in the repo

Primary role:

- coach

### Route map

- `/coach`
- `/coach?view=chapters`
- `/coach?view=chapter_detail`
- `/coach?view=support_notes`
- `/coach?view=campaigns`
- handoff-owned shared screens may also open on `/coach?view=proof_ugc`,
  `/coach?view=feed_studio`, `/coach?view=feed_analytics`,
  `/coach?view=hubspot`, and `/coach?view=best_practices`, but they should
  still render on the coach route instead of dropping into a generic fallback

### First-viewport contract

- assigned portfolio
- urgent risks
- coach-specific support actions
- clear separation from HQ-admin breadth

### Required states

- portfolio overview
- selected chapter detail
- coach notes / interventions
- campaign support context

### Data domains

- assigned chapters
- risk indicators
- support notes
- interventions
- campaign posture

### Component families

- portfolio table
- chapter drawer
- coach note panels
- decision / risk pills

### Boundaries

- coach should not inherit every HQ admin function
- narrow, chapter-support framing wins over generic internal tooling

## 6. Staff Command Center

Reference mockup:

- `Staff Command Center Dashboard`

Primary roles:

- staff
- HQ operator
- admin

### Route map

- `/staff?view=chapters`
- `/staff?view=campaigns`
- `/staff?view=proof_ugc`
- `/staff?view=feed_studio`
- `/staff?view=feed_analytics`
- `/staff?view=hubspot`
- `/staff?view=best_practices`
- `/staff?view=admin`

### First-viewport contract

- dense top nav
- filter row
- KPI strip
- portfolio-table-first layout
- visible risk / decision posture

### Required clickthroughs

- chapters row -> chapter drawer or chapter-focused state
- drawer decision control -> visible `Advance` / `Hold` / `Intervene` posture
  with footer actions that stay attached to that selected support move
- campaigns -> operations matrix
- campaign risk cards -> same-screen campaign-risk state that filters the
  execution table without dropping the selected campaign context
- proof queue -> selected proof review panel with consent explanation,
  recommended-use guidance, and approval-tier gating
- feed analytics default route -> overview-first post-performance table
- feed analytics selected-post route -> impact panel that keeps feed draft,
  audience, and follow-up context visible
- feed analytics re-engagement -> specific follow-up or content state
- best-practice CTA from proof review -> filtered best-practices view
- admin cards -> system health, outbox, audit, and review lanes

### Route-owned proof already in app

- `/staff?view=chapters&chapter=...&decision=...` proves the chapter drawer can
  open as a stable review state rather than a purely client-only overlay
- `/staff?view=feed_analytics` proves the overview-first analytics table state
- `/staff?view=feed_analytics&feedPost=...` proves the selected-post impact
  panel state while preserving draft and audience context

### Required states

- chapters
- campaigns
- campaign risk filtered
- proof / UGC
- feed studio
- feed analytics
- HubSpot intelligence
- best-practices library
- admin health

### Data domains

- chapters
- campaigns
- assignments
- proof / UGC
- feed posts
- feed analytics
- CRM posture
- best-practice library
- system health
- automation outbox
- audit logs

### Component families

- dense filters
- KPI strip
- portfolio table
- chapter drawer
- proof review panel
- feed curation columns
- analytics tables
- admin health cards
- outbox / audit tables

### Boundaries

- HubSpot remains informational until approved
- no external sends from outbox
- no production configuration changes through the app

## 7. What Counts As Parity

A surface is not at parity just because it looks close.

For this project, parity means:

- the correct role lands on the correct default screen
- the visible navigation model matches the mockup family
- visible CTAs land somewhere real
- the major subpages or states exposed by the clickthrough exist
- the screen has believable mock data shaped around its real objects
- mobile and desktop shell ownership matches the role surface
- blocked integrations stay clearly blocked

If one of those is missing, the surface is still only partially mapped.

## 8. Recommended Working Order

When using the Make files as the implementation map, work in this order:

1. route and role ownership
2. first-viewport hierarchy
3. clickthrough and CTA destinations
4. state variants
5. mock data shape
6. reusable components
7. visual polish

That order keeps us from mistaking a good-looking screen for a finished one.
