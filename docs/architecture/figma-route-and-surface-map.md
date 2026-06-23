# Figma Route And Surface Map

Use the Figma Make mockups as a product map for myMEDLIFE, not just as visual
reference.

Treat them as a map of what to create in all of their dimensions: routes,
subpages, role switches, drawers, filters, detail states, empty states,
review states, and visible next-step actions.

See also:

- `docs/architecture/figma-clickthrough-screen-inventory.md`
- `docs/architecture/figma-implementation-matrix.md`

That companion doc records the clickable states observed in the Make renders
and maps them to local routes and query-param views.

That means each mockup should inform:

- which route exists
- which role owns that route
- which tabs, drawers, filters, or subpages exist
- which states are visible
- which actions are real and where they go next
- which supporting data domains the surface needs
- which component patterns repeat across surfaces
- which responsive shell the surface owns
- which integrations stay mocked, read-only, or blocked

## What "Use It As A Map" Means

For myMEDLIFE, a Figma Make file is not just a style reference.

It is a map for:

- information architecture
- route structure
- role boundaries
- clickthrough hierarchy
- state models
- visible priorities above the fold
- the component families we need to build
- the minimum believable data each screen needs
- what must stay mock-safe until approval opens live writes

In practice, that means each prototype should answer all of these questions:

- what is the default screen for this role
- what can this user click next
- what subpage, filter, drawer, or detail state appears after that click
- what data must exist for the screen to feel real
- what success, warning, blocked, review, or empty states are implied
- what part of the shell belongs to the screen itself versus the global app
- what stays local or mock-only even if the screen mentions external systems

If we cannot answer those questions yet, the parity work is not done.

## Working Rule

When a Make prototype is inspectable, treat its clickable navigation, subpages,
drawers, and view switches as implementation targets.

Do not stop at:

- color palette
- card styling
- rough layout vibe
- one static screenshot

The goal is route parity and state parity first, then visual polish.

## Fallback Rule

If live Figma Make access is temporarily unavailable, do not fall back to
using the mockups as loose style inspiration.

Instead:

- treat `docs/architecture/figma-clickthrough-screen-inventory.md` as the
  current canonical map
- keep building against the last verified screen, route, and state inventory
- refresh that inventory the next time live Figma access is available again

This same fallback applies when the Figma connector is present but temporarily
unusable, for example because authentication expired. In that case, continue
building from the last verified clickthrough inventory and refresh the live map
after reauth instead of downgrading the mockup to moodboard status.

The fallback should preserve product intent:

- clickable subpages still count as scope
- route and state expectations still count as scope
- visual polish stays secondary to the interaction model

The practical reading of this rule is:

- a Make file is a screen map
- a Make click is a route, drawer, filter, or state transition candidate
- a partially working Make flow is still useful evidence for what the product
  surface wants to be

## Browser Inspection Rule

If the dedicated Figma connector is present but its auth is stale, the Make
prototype may still be directly inspectable in the browser.

Use that path before giving up on clickthrough discovery.

Current verified fallback:

- the Make page can load in the in-app browser even when `figma.whoami`
  fails with expired auth
- the live preview is exposed through an iframe, so the visible navigation and
  screen text can still be inspected from the browser session
- this is good enough to keep mapping routes, subpages, screen titles, and
  state changes while connector auth is being repaired

Practical rule:

1. try live Make clickthrough in the browser
2. use the visible screen state and iframe-readable text as the route contract
3. only fall back to the inventory docs when the browser path is also blocked

Do not collapse to "general vibe" just because the API-backed Figma identity
check failed.

## Dimensions To Mirror

When we inspect a Figma Make prototype, treat it as a build map across all of
these dimensions:

- route structure
- role ownership
- navigation model
- first-viewport hierarchy
- cards and sections that appear together
- CTA destinations
- subpages exposed by clickthrough
- filters, drawers, and tabs
- empty / blocked / review states
- mobile vs desktop shell behavior
- supporting data domains
- repeatable component families
- role-to-role handoff paths
- mock-safe versus live-approved boundaries

That means we should click through the prototype to discover hidden subpages and
state changes before deciding a local surface is "close enough."

Do not reduce the Make references to:

- "member mobile vibe"
- "leader dashboard vibe"
- "staff dashboard vibe"

We are trying to mirror the screen families, not just the art direction.

## Implementation Dimensions

Every parity pass should explicitly account for each of these dimensions:

1. Route dimension:
   default route, child routes, query-param views, detail routes, and return
   paths.
2. Role dimension:
   which actor owns the screen, which role jumps are allowed, and which role
   switches stay out of scope.
3. State dimension:
   selected tabs, filters, empty states, risk states, success states, review
   states, and confirmation states.
4. CTA dimension:
   every visible button, link, pill, or card that implies a next step should
   land somewhere explicit.
5. Data dimension:
   mock data should be shaped around the objects the screen clearly needs, not
   generic filler content.
6. Shell dimension:
   the mockup may own the primary sidebar, bottom nav, filter row, or local
   header; we should not bury that under a conflicting app chrome.
7. Component dimension:
   repeated cards, KPI strips, pills, drawers, tables, checklists, and detail
   panels should become reusable local component families.
8. Integration dimension:
   external-system references can inform labels and statuses, but they stay
   mock-safe or read-only until explicit approval opens a real lane.

The companion implementation matrix turns those dimensions into per-surface
build guidance:

- `docs/architecture/figma-implementation-matrix.md`

## Canonical Role And Scope Overlay

The full send package adds a richer role model than the current repo-wide
`audience` labels.

Use these as the canonical product roles even when the current runtime still
maps multiple of them into the same local audience bucket:

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

Use these as the canonical operational scopes:

- `own`
- `committee`
- `chapter`
- `assigned_coach_portfolio`
- `department`

## Current Checkpoint

As of `2026-06-23`, the repo's local verification baseline is green:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

That means current parity work should optimize for product-surface truth, not
for repairing a broken local baseline.

Current verified route-family checkpoint:

- member-owned routes exist across `/`, `/campaigns`, `/rush-month/*`, and
  `/profile`
- the member top-level route family now also clears the focused route suite for
  campaigns, action detail, events, leaderboard, and profile, so the remaining
  member gap is more likely to be in deeper submit/review states or visual
  hierarchy than in missing top-level destinations
- chapter leader routes exist across `/chapter?view=overview|leaderboard|members|member_profile|committees|events|impact|bridge_videos|succession|feed_analytics`
- coach and staff command-center routes exist as separate shells
- SLT Prep traveler and staff routes exist as their own surface family
- admin/backend routes now include `/admin/permissions`, `/admin/committees`,
  `/admin/workflows`, `/admin/sop-library`, and `/admin/sop-builder/[campaignSlug]`

Most recently tightened from live Figma/browser comparison:

- chapter leader `members`
- chapter leader `member_profile`
- chapter leader `committees`
- chapter leader `events`
- chapter leader `impact`
- chapter leader `bridge_videos`
- chapter leader `succession`
- chapter leader `feed_analytics`
- chapter leader `overview` metric ordering

The remaining parity work is therefore narrower and clearer:

- continue beyond the chapter-leader family into member, coach, staff, SLT
  Prep, and backend routes where the current route exists but first-viewport
  hierarchy or detail states still drift from the mockups
- keep updating this map when a route family moves from rough route coverage to
  verified route/state parity
- `all_platform`
- `breakglass`

Current repo reality:

- local route ownership is still primarily resolved through
  `chapter_member`, `chapter_leader`, `coach`, `admin`, `ds_admin`, and
  `super_admin`
- persisted database role keys still use the current `general_member`,
  `action_committee_member`, `action_committee_chair`, `e_board_member`,
  `president_vp`, `coach`, `admin`, `ds_admin`, and `super_admin` set
- do not rename hosted schema or RLS layers just to match this overlay; map at
  the app boundary first

## Clickthrough Rule

For every major surface:

1. inspect the default visible state
2. click every visible nav item, button, and state switch the prototype exposes
3. record the resulting screen or state
4. map that result to a local route, query-param view, drawer, or component
   state
5. implement the navigation and state model before polishing visuals

If the prototype reveals a subpage, we should treat that subpage as part of the
scope even if it was not visible in the first screenshot.

If a clickthrough is inconsistent:

1. keep the destination route if the product brief requires it
2. use the stable parts of the Make structure to design the route
3. note the inconsistency explicitly instead of deleting the screen from scope

## Surface Map

### 1. Student Mobile App

Primary role:

- member / student

Reference mockup:

- `myMEDLIFE App Prototype`

Core route map:

- `/` -> role-routed member home when the local actor is a member
- `/campaigns` -> member campaign landing / Rush Month detail surface
- `/rush-month` -> broader Rush Month operating shell / role-aware review path
- `/rush-month/dashboard` -> campaign progress and KPI surface
- `/rush-month/actions` -> assigned actions list
- `/rush-month/actions/[assignmentId]` -> action detail, why-it-matters,
  evidence expectations, confirmation state
- `/rush-month/events` -> event list
- `/rush-month/events/[eventId]` -> event detail / RSVP state
- `/rush-month/evidence` -> evidence / proof status surface
- `/rush-month/leaderboard` -> points and leaderboard
- `/profile` -> member profile route

Expected navigation model:

- Home
- Campaigns
- Events
- Points
- Profile

Expected interaction model:

- "Rush Month" CTA opens the campaign route
- member campaign cards and campaign-entry CTAs across home and profile should
  land on `/campaigns`
- "Start next action" opens a specific action detail route
- points and leaderboard are a real destination, not a static card
- events route and event detail both exist
- profile is a real route, not placeholder copy
- role jumps from the member app should lead into real leader / coach / staff
  surfaces, even if the Make app prototype only verifies some of those jumps
  cleanly

First-viewport signals to preserve:

- chapter identity and greeting
- clear weekly priority CTA
- campaign progress
- assigned actions
- upcoming events
- points / leaderboard access
- leader message
- bottom mobile nav

Verified Make note:

- the member prototype clearly reveals Home, Campaigns, Events, Points, action
  detail, and a leader jump
- the current Make `Profile` clickthrough is behaviorally inconsistent, so
  local route ownership matters more than reproducing that glitch

### 2. SLT Prep

Primary roles:

- student traveler
- staff reviewer

Reference mockup:

- `myMEDLIFE SLT Prep Phase`

Core route map:

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

Expected interaction model:

- readiness score and alerts are visible on the main prep surface
- checklist items deep-link into detail routes
- traveler status is broken out across forms, payments, flights, meetings, and timeline
- staff review uses its own route instead of piggybacking on the traveler view
- the overview screen should behave like a routing hub into the rest of the
  prep system

First-viewport signals to preserve:

- trip identity and countdown
- readiness score
- red / yellow / green alert posture
- the next urgent prep action
- bottom-nav or subnav access to the rest of the prep flow

Verified Make note:

- the live SLT overview exposed direct links into timeline, payments, forms,
  checklist, meetings, extensions, a specific next item, and staff dashboard
- use that overview as the canonical routing hub for the prep experience

### 3. Student Leadership Command Center

Primary role:

- chapter leader / e-board

Reference mockup:

- `Student Leadership Command Center`

Core route map:

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
- `/campaigns`
- `/campaigns/[campaignSlug]`
- `/action-committees`
- `/proof-library`
- `/chapter/members` -> deeper membership approval / write-readiness lane, not
  the primary Figma command-center navigation target

Expected interaction model:

- chapter dashboard is a real operating surface, not a generic admin page
- member pipeline and review work should route into chapter member views
- `Review Members` should stay as a chapter-owned member-pipeline review state
  before opening person-level member review
- visible member-pipeline CTAs like `Export` and `Add Member` should open as
  chapter-owned review states before handing off to the broader membership lane
- campaign health, quick actions, and leadership workflow should be stateful
- committee, event, impact, and succession surfaces should follow the same
  chapter operating context

Verified Make note:

- the live leader file confirms that grouped nav, campaign context, chapter
  identity, quick actions, and risk posture should all coexist above the fold
- live clickthrough also confirmed concrete subpages for chapter home,
  leaderboard, committees, and feed analytics, with route-worthy state inside
  those screens rather than one static dashboard
- committee inspection should stay route-owned inside `/chapter` via
  `committee=...`, and the `Add Committee` CTA should first open a chapter
  review state before the broader committee workspace
- events should keep the visible `All Committees` control as route-owned
  `eventCommittee=...` state, and the `Create Event` CTA should stay inside the
  chapter surface first before handing off to the broader event workflow
- member profiles should keep visible actions like `Promote to Chair`,
  `Schedule Values Interview`, `Assign Leadership Action`, `Nominate for
  E-Board`, and `Add Note` as member-profile-owned states first, so the person
  context is not lost before broader lane handoff
- impact should keep `Share Impact Story`, `Create Bridge Video`, and
  per-highlight `Share this story` actions as impact-owned storytelling states
  first, with `Bridge Videos` opened as a downstream handoff instead of a
  generic jump
- `Bridge Videos` should keep `Submit Bridge Video` as a bridge-library-owned
  state first, before handing off into the broader proof workspace
- feed analytics should keep `Share to Feed` and `Ask Members to Respond` as
  explicit handoff states so the leader sees a review banner before leaving for
  the bridge library or member review surface
- leaderboard should keep metric pills as explicit comparison state, and each
  `Best practices` CTA should carry chapter-specific handoff context into feed
  analytics instead of behaving like a generic link
- leaderboard region selection should stay route-owned inside
  `/chapter?view=leaderboard&region=...` so the comparison set can change
  without flattening back into a static badge
- during inspection, the Make `Path to page or screen` field kept showing
  `home` while the visible preview changed screens, so use the rendered sidebar
  state as the interaction contract instead of copying that control literally
- if the app feels generic on `/chapter`, the first thing to inspect is route
  hierarchy and left-rail ownership, not missing data

First-viewport signals to preserve:

- compact operating left rail
- visible nav groups above the fold on desktop
- active campaign context
- chapter health and weekly priority
- immediate quick-action access

Local parity note:

- treat the desktop left rail as navigation-first, not summary-first

### 4. Coach Command Center

Primary role:

- coach

Reference sources:

- `Staff Command Center Dashboard` for portfolio behavior
- role model notes for coach-specific narrowing

Core route map:

- `/coach`
- `/coach?view=chapter_detail`
- `/coach?view=support_notes`
- coach support flows should link onward into chapter and review contexts

Expected interaction model:

- assigned chapter portfolio is the first screen
- chapter detail is a distinct coach-owned state, not just an HQ staff drill-in
- support notes are a distinct coach-owned state
- coach priorities, risk review, and note-taking are visible without dropping
  into staff-only admin framing

Build note:

- the coach surface can borrow density and review posture from staff, but should
  still read as a narrower owned portfolio, not the full HQ control plane

First-viewport signals to preserve:

- portfolio ownership
- urgent chapter risks
- support actions
- visible separation from the broader staff command center

### 5. Staff Command Center

Primary roles:

- staff
- HQ operator

Reference mockup:

- `Staff Command Center Dashboard`

Core route map:

- `/staff?view=chapters`
- `/staff?view=campaigns`
- `/staff?view=proof_ugc`
- `/staff?view=feed_studio`
- `/staff?view=feed_analytics`
- `/staff?view=hubspot`
- `/staff?view=best_practices`
- `/staff?view=admin`

Expected interaction model:

- Chapters = dense portfolio table plus chapter drawer
- Campaigns = campaign operations view with risk cards and execution matrix
- campaign risk cards behave as route-owned filters that narrow the execution
  table while keeping the selected campaign, source handoff, and bulk-action
  context attached
- Proof / UGC = queue plus review panel
- Feed Studio = 3-panel curation workspace
- Feed Analytics = post table plus impact panel
- HubSpot = chapter selector plus CRM/activity view
- Best Practices = filterable library with chapter-share actions
- Admin = integration health, outbox review, audit visibility

Verified Make note:

- the live staff file clearly exposes the top-nav screen family, dense filter
  row, KPI strip, and portfolio-table-first layout
- the Make reasoning pane also names the deeper screens and right-side chapter
  drawer, which should be treated as part of the target build map

First-viewport signals to preserve:

- dense portfolio / operations framing
- branded control bar with immediate current-surface context
- iconized top-nav screen family, not a generic text-only local tab strip
- filters and search near the top
- KPI cards and decision posture
- immediate path into deeper review drawers or panels

### 6. Admin Backend

Primary roles:

- `department_staff`
- `sales_coach`
- `sales_admin`
- `ds_admin`
- `super_admin`

Core route map:

- `/admin`
- `/admin/review-path`
- `/admin/nick-review`
- `/admin/release-readiness`
- `/admin/launch-gate`
- `/admin/audit-log`
- `/admin/integration-outbox`
- `/admin/master-data`
- `/admin/database-security`
- `/admin/system-health`
- `/admin/design-qa`
- `/admin/operations`
- `/admin/first-write`
- `/admin/write-sequence`
- `/admin/proof-write`
- `/admin/hq-proof-write`
- `/admin/assignment-write`
- `/admin/coach-write`
- `/admin/pilot-scope`
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

Expected interaction model:

- keep the current launch/review packet routes intact
- `/admin` should behave as the overview lane for the internal backend family,
  with visible routes back into permissions, committees, workflows, and SOP
  tooling instead of leaving the overview as a disconnected audit packet
- add the backend lanes the full send package requires instead of replacing the
  current safety-review routes
- admin configuration routes should live under `/admin/*`, not as extra
  `view=` states on `/staff`
- committee registry should keep section and selected-record state on the same
  route rather than splitting committee lanes into disconnected backend screens
- workflow registry should keep section and selected-record state on the same
  route rather than splitting into disconnected backend screens
- DS/admin roles can inspect broader system posture than chapter leaders or
  coaches, but external writes remain blocked until explicit approval

Repo mismatch note:

- the current repo already has strong review/safety routes under `/admin/*`
- the packet's additional read-only inspector lanes now exist locally under
  `/admin/*`
- live SOP Creation inspection now confirms the library first viewport and
  steps-builder first viewport, so the remaining backend gap is narrower:
  deeper parity for non-steps tabs and later mutable states

### 7. Campaign SOP Builder

Primary roles:

- `sales_admin`
- `department_staff`
- `ds_admin`
- `super_admin`

Reference mockup:

- `SOP Creation Section`

Core route map:

- `/admin/sop-library`
- `/admin/sop-builder/[campaignSlug]?tab=steps`
- `/admin/sop-builder/[campaignSlug]?tab=role-matrix`
- `/admin/sop-builder/[campaignSlug]?tab=completion`
- `/admin/sop-builder/[campaignSlug]?tab=points-kpi`
- `/admin/sop-builder/[campaignSlug]?tab=comms`
- `/admin/sop-builder/[campaignSlug]?tab=preview`
- `/admin/sop-builder/[campaignSlug]?tab=version`
- `/admin/sop-library?query=...&status=...`
- `/admin/sop-library?focus=...&query=...&status=...`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...`
- `/admin/sop-builder/[campaignSlug]?tab=...&focus=...&mode=filter|add_step|add_step_after_last|duplicate_step|disable_step|publish|schedule|rollback`

Expected interaction model:

- this is a workflow-logic builder, not a content editor
- the library route owns list/search/filter/status/version entry
- the library route now also owns selected campaign detail on the same page, so
  a chosen definition can stay visible without leaving `/admin/sop-library`
- the library first viewport should surface the current selected definition,
  core counts, and builder posture before the deeper table/detail sections
- the builder route owns step flow, role matrix, completion rules, points/KPI,
  comms triggers, preview, and versioning
- selected builder detail should remain route-owned on the same page via
  `focus=...`, so a chosen step/rule/scenario/audit record stays visible
  without leaving the builder surface
- the builder first viewport should name the current tab and current focus
  before the deeper tab-specific workbench content so reviewers can orient
  quickly inside the backend lane
- all outbound systems stay mock-safe; myMEDLIFE records workflow rules and
  downstream trigger intent, not live email/SMS sends

Repo mismatch note:

- the current repo now contains a first-class SOP library/builder route family
  with typed mock-safe workflow data and tab state
- the current local parity now covers:
  - library summary cards
  - route-owned status pills and search
  - table-owned campaign rows
  - steps-tab three-pane builder layout
  - role-matrix workflow table
  - completion / proof / approval rule table plus route-backed reviewer handoffs
  - points / KPI role-impact table plus leaderboard and chapter-rollup posture
  - comms trigger registry plus integration-boundary cards
  - preview-by-role impact table with route-backed preview hops
  - version-review draft-vs-live comparison
  - route-owned mock-safe states for filter, add-step, duplicate-step,
    disable-step, publish, schedule, and rollback review
- the remaining work is now narrower: actual add/remove/reorder/duplicate/
  disable/archive/persist/publish mutations remain intentionally blocked

## Implementation Rules

1. If the mockup shows a view switch, it should map to a route, query-param
   view, drawer state, or other explicit app state.
2. If the mockup shows a CTA, it should navigate somewhere real or reveal a
   real state.
3. If the mockup shows multiple subpages, we should inspect them one by one and
   implement parity screen by screen.
4. If a surface already has the right data but still feels generic, check route
   hierarchy, labels, nav, and statefulness before adding more features.
5. Keep the app role-based. myMEDLIFE is one app with different operating
   surfaces, not one generic dashboard with cosmetic role changes.

## Current Repo Mismatches To Carry Forward

- the route family is already broader than the original packet in some member
  and review lanes, and the canonical role/scope layer now covers the richer
  full-send-package role model at the app boundary and in local preview, but
  hosted persistence still relies on the legacy database-role keys
- the admin review packet is more mature than the SOP-builder/configuration
  backend described in the packet
- the admin/backend route families are now stronger than the mutable SOP
  builder/configuration workflows behind them, so backend parity should keep
  focusing on typed mock-safe action states before any hosted write rollout

## Current Parity Use

Use this map when choosing the next parity pass.

Priority order:

1. screens where the route exists but still feels generic
2. screens where the mockup exposes a deeper subpage or drawer we have not
   matched yet
3. screens where actions still do not lead somewhere real
4. visual polish after route/state parity is in place
