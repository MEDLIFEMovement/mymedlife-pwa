# myMEDLIFE PWA

myMEDLIFE is the custom, mobile-first MEDLIFE chapter operating app for
`www.myMEDLIFE.org`.

This repo is a parallel build to the current Discourse prototype. Do not replace
or modify Discourse from this repo unless Nick explicitly approves that change.
Discourse remains a reference/prototype/community layer while this app explores
the production-style custom PWA path.

## Current Goal

The current goal is Goal 75: first-write readback evidence. This remains
mock-safe by default and extends `/admin/first-write` so HQ reviewers can see
the expected post-drill readback evidence for assignment status, internal event,
integration event, audit log, and zero automation outbox sends.
Production data, broad browser writes, admin mutation controls, real uploads,
public proof sharing, and external integrations remain disabled.

Goal 74 added `/admin/first-write` so HQ reviewers can see the exact local
Supabase/auth/flag checks required before the first action-start browser write
is tested on localhost.

Goal 73 added `/admin/pilot-scope` so HQ reviewers can choose the smallest safe
first Rush Month pilot, compare staff-only / one-chapter / later expansion
options, and see which approvals still block real student invitations.

Goal 72 added `/admin/staff-dry-run` so HQ reviewers can rehearse the Rush
Month MVP with fake local actor emails, pass criteria, structured events to
notice, and zero-write safety assertions before staging or student pilot
approval.

Goal 71 added an admin-visible pilot gate so reviewers can distinguish local
stakeholder review, staff dry run, staging review, first student pilot, and later
pilot expansion before any production launch is approved.

Goal 70 added an admin-visible Figma/mobile QA layer so reviewers can evaluate
next-action clarity, phone usability, role complexity, accessibility, mission
tone, pilot safety copy, and final visual launch blockers before any production
launch is approved.

Goal 69 added `/rush-month/events` so reviewers can see event plans, expected
student action, NPS prompts, proof prompts, disabled Luma posture, future
structured events, and disabled outbox rows before any Luma sync, attendance
import, reminder, warehouse export, or automation is approved.

Goal 5 turned the approved Goal 4 database plan into a local-only Supabase
foundation:

- local Supabase project structure
- first migration for core tables, role helpers, RLS policies, and safety
  triggers
- fake seed data for Rush Month, chapters, roles, proof/testimonials, coach
  portfolio access, and disabled/mock integration rows
- pgTAP RLS/security tests
- documentation for local setup and reset/test commands

Goal 6 reviewed that foundation against MEDLIFE Sales SOP knowledge bases and
defines the next safe local schema refinement plan before live auth or real
integrations.

Goal 7 implements that plan locally by adding campaign templates, phase
templates, campaign officer lanes, readiness reviews, risk flags, closeouts,
expanded proof/evidence types, fake seed data, and RLS/security tests.

Goal 8 added the first safe read-only bridge from the app to local Supabase data
while keeping mock data as the default fallback.

Goal 9 adds a local-only actor context layer so developers can test fake member,
leader, coach, admin, DS admin, and super admin read context without enabling
production auth or app writes.

Goal 10 turns that local actor context into role-aware navigation, restricted
state messaging, read filters, and permission tests for the Rush Month shell.

Goal 11 adds local-only contracts for starting an action, submitting proof,
previewing HQ proof-sharing decisions, recording audit intent, and shaping
disabled outbox rows. It updates the action detail, proof, and review screens
without adding real persistence, uploads, auth sessions, or integrations.

Goal 12 adds an explicit disabled write-readiness layer. It documents which
tables future action/proof/HQ decisions would touch, shows those future write
targets in the UI, and keeps every app write blocked until Nick approves a
later security-reviewed implementation goal.

Goal 13 turns that airlock into a reviewable local write implementation plan.
It defines the first local write paths, the role boundaries, the tables
they would touch, and the RLS tests required before any write is enabled. It
does not turn on writes.

Goal 14 implements the first local Supabase write path for starting an
assignment. It adds an auditable database function and RLS/security tests for
`action_started`, but it does not wire browser save controls or production auth.

Goal 15 implements the first local Supabase proof/testimonial metadata write
path. It adds an auditable database function and RLS/security tests for
`evidence_submitted`, but it does not upload files, publish proof, wire browser
save controls, or send external automation.

Goal 16 implements the first local Supabase HQ proof-sharing decision write
path. It adds an auditable database function and RLS/security tests for
`hq_sharing_decision_logged`, but it does not publish proof, wire browser save
controls, or send external automation.

Goal 17 prepares proof/video storage architecture and disabled upload
readiness. It documents future buckets, consent metadata, file constraints, and
access boundaries, but it does not create buckets, upload files, publish proof,
or send external automation.

Goal 18 implements the first local Supabase chapter-leader assignment creation
path. It adds an auditable database function and RLS/security tests for
`action_assigned`, but it does not wire browser save controls, production auth,
or external automation.

Goal 19 defines the future auth/onboarding path for sign-in, profile creation,
chapter join requests, membership approval, role assignment, coach assignment,
and staff role assignment. It does not enable live auth, browser sessions,
production users, or onboarding writes.

Goal 20 defines the future route-by-route migration from mock data to local
Supabase and then controlled pilot readiness. It does not enable production
Supabase, browser writes, or external writes.

Goal 21 expands the mock-safe app from a Rush Month-only shell into the first
reusable campaign operating system surface. It adds campaign catalog pages,
campaign detail pages, action committee event planning, proof-library posture,
role-aware visibility, and tests while keeping the app read-only/mock-safe.

Goal 22 adds a role-aware Rush Month dashboard, a friendly mock leaderboard,
dashboard service tests, and the exact starter campaign shells required by the
final MVP goal.

Goal 23 adds a visible, testable browser-write activation gate for the first
candidate write route: `action_started` on `/rush-month/actions/[assignmentId]`.
It references the existing local Supabase function and RLS tests but still keeps
the browser control disabled until live auth and explicit write approval.

Goal 24 adds the same visible, testable browser-write activation gate for
chapter-leader assignment creation: `action_assigned` on `/rush-month/actions`.
It aligns the TypeScript write plan with the existing local Supabase assignment
creation function and still keeps the browser control disabled until live auth
and explicit write approval.

Goal 25 adds the same visible, testable browser-write activation gate for
proof/testimonial submission: `evidence_submitted` on
`/rush-month/actions/[assignmentId]`. It references the existing local Supabase
proof metadata function and keeps proof saves, uploads, public sharing, browser
writes, and external automation disabled.

Goal 26 adds the same visible, testable browser-write activation gate for HQ
proof-sharing decisions: `hq_sharing_decision` on `/rush-month/review`. It
references the existing local Supabase HQ decision function and keeps decision
saves, public proof sharing, browser writes, and external automation disabled.

Goal 27 adds the same visible, testable browser-write activation gate for coach
advance / hold / intervene decisions: `coach_decision_logged` on `/coach`. It
adds the local Supabase `app.log_coach_decision(...)` function and keeps coach
decision saves, browser writes, n8n escalation packets, and external automation
disabled.

Goal 28 adds a consolidated `/admin` write activation readiness panel. It
collects the first five browser-write gates into one reviewable staff/debug
surface and keeps every enabled control at zero until live auth and browser
write approval are explicitly granted.

Goal 29 adds a plain-English `/admin` approval plan for the first write
activation order. It recommends `action_started` as the first candidate and
lists the approvals required before any browser save control can be enabled.

Goal 30 defines the future action-start browser/server contract on
`/rush-month/actions/[assignmentId]`. It documents the future
`startAssignmentAction -> app.start_assignment_action` path, requires server-side
auth identity, and still returns a disabled attempt instead of saving.

Goal 31 defines the plain-English result states for that future action-start
save. The action detail route now shows the current disabled result, the future
result for the selected mock action, and the possible success/error states
without creating a server action or enabling browser writes.

Goal 32 defines the plain-English result states for the future proof/testimonial
save. The action detail route now shows the current disabled proof result, the
future result for the selected mock proof input, and the possible proof
success/error states without enabling proof saves, uploads, public sharing, or
external automation.

Goal 33 defines the plain-English result states for future HQ proof-sharing
decisions. The review route now shows the current disabled HQ decision result,
the future result for the selected mock decision, and the possible approval /
change-request / do-not-share states without enabling decision saves, public
proof publishing, or external automation.

Goal 34 defines the plain-English result states for future coach decisions. The
coach route now shows the current disabled coach decision result, the future
result for the selected mock advance / hold / intervene decision, and the
possible blocked states without enabling decision saves or n8n escalation
packets.

Goal 35 adds an admin-facing result-state coverage review. It shows that four
first-write candidates have result states and that leader assignment creation
still needs result states before write activation can be considered.

Goal 36 defines the plain-English result states for future leader assignment
creation. The actions route now shows the current disabled assignment-create
result, the future result for the selected mock assignment, and the possible
success/validation/permission/reminder-disabled states. The admin coverage panel
now shows all five first-write candidates covered while writes remain disabled.

Goal 37 adds a browser-local Rush Month operating loop on `/rush-month/loop`.
It lets a reviewer click through leader assignment, member action start, proof
submission, local completion review, points/KPI movement, HQ sharing posture,
coach decision, structured events, disabled outbox rows, and audit logs without
writing to Supabase or sending external automation.

Goal 38 adds a read-only admin control center to `/admin`. It names the MVP
admin surfaces for users, roles, chapters, campaign templates, integration
events, automation outbox, audit logs, and system health placeholders while
keeping admin mutation controls disabled.

Goal 39 adds reusable role-aware next-action guidance. `/`, `/chapter`, and
`/rush-month` now show a plain-English priority for the selected local actor:
member, chapter leader, coach, admin, DS admin, or super admin. The guidance is
read-only and does not enable auth, browser writes, uploads, proof publishing,
or external integrations.

Goal 40 adds a read-only leader follow-up board to `/rush-month/actions`.
Leaders, coaches, admins, and super admins can see prioritized assignment
follow-up rows, while members stay focused on their own actions and DS admins
remain restricted to integration posture. Reminder sends and external
automation remain disabled.

Goal 41 adds a mock-safe coach portfolio readiness panel to `/coach`. Coaches,
admins, and super admins can compare fake portfolio chapters, handoff posture,
risk, proof pending, and advance / hold / intervene state. Coach assignment
changes remain read-only and disabled.

Goal 42 adds structured proof-sharing review states to `/proof-library`.
Leaders, coaches, admins, and super admins can see whether proof/testimonials
need consent/context, HQ review, internal learning use, or future public review.
Public publishing and external exports remain disabled.

Goal 43 adds clearer member recognition to `/rush-month/dashboard`. Members can
see rank, points, recognition, friendly leaderboard context, and understandable
chapter impact while DS Admin remains restricted from student points truth.

Goal 44 adds a read-only campaign closeout/readiness panel to `/rush-month`.
Leaders, coaches, admins, and super admins can see whether assignment
completion, proof posture, event feedback, and coach decision state support
advance, hold, or intervention. Closeout writes and exports remain disabled.

Goal 45 adds an admin-facing MVP coverage checklist to `/admin`. It summarizes
what the Rush Month MVP can demonstrate locally, what is read-only/mock-only,
and what remains blocked until live auth, browser writes, uploads, public proof
sharing, or integrations are approved.

Goal 46 adds a route-level smoke-test manifest to `/admin`. Admin, DS admin,
and super admin reviewers can see which core MVP routes to open, which local
roles to test, what should appear, and which safety boundary must remain true.

Goal 47 adds a plain-English release-readiness summary to `/admin`. It marks
the local Rush Month MVP as ready for stakeholder review but not ready for live
student launch until auth, writes, uploads, production setup, and integrations
are approved.

Goal 48 adds role-aware mobile quick navigation, active route styling, a
keyboard skip link, and reviewer-focused accessibility polish. It keeps the app
read-only/mock-safe and does not enable live auth, browser writes, uploads,
public proof sharing, or external integrations.

Goal 49 moves the existing local actor notice and local role switcher into the
shared app shell so every actor-aware route gets consistent reviewer context
without duplicating the same panels in route files.

Goal 50 adds the first install-readiness layer for the PWA: a manifest route,
app metadata, a local icon, and a test. It does not add offline caching, a
service worker, push notifications, auth, writes, uploads, public proof sharing,
or external integrations.

Goal 51 adds plain-English browser/page titles and descriptions for the main
routes through a small static metadata registry. It does not change permissions,
data loading, writes, auth, uploads, public proof sharing, or integrations.

Goal 52 adds a small route registry and tests to prove role-aware primary
navigation, mobile quick navigation, and the admin route smoke manifest point at
known app routes.

Goal 53 adds a plain-English admin route coverage summary showing known routes,
primary/mobile navigation coverage, smoke routes, and zero expected writes or
external sends.

Goal 54 adds a no-code stakeholder review path to `/admin` so reviewers know
which local actor email and route to use for member, leader, proof, coach, and
admin safety review.

Goal 55 adds a plain-English admin glossary for non-coder reviewers. It defines
local actor, mock data, browser write, external send, outbox, proof, RLS, and
stakeholder review.

Goal 56 adds an admin environment safety summary that explains safe local flags
without showing secrets, keys, tokens, passwords, or private connection strings.

Goal 57 adds a plain-English local MVP review guide for non-coder reviewers,
including pass/fail signals and the next approval boundary.

Goal 58 adds a localhost-only Supabase Auth sign-in route for fake local seed
users. It begins the real session foundation needed for the MVP, but does not
connect production Supabase, create real users, enable browser app writes, or
enable external writes.

Goal 59 maps signed-in local Supabase Auth users into the role-aware actor
context used across the app. Routes now prefer the local auth session over the
debug actor email when a matching fake local profile is signed in. Browser
writes, production auth, production users, uploads, public proof sharing, and
external sends remain disabled.

Goal 60 adds the first local browser-to-Supabase write path for
`action_started` on `/rush-month/actions/[assignmentId]`. It requires localhost
Supabase Auth, a signed-in fake seed user, `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`,
and `MYMEDLIFE_ENABLE_ACTION_START_WRITE=true`. All other browser writes,
production data, uploads, public proof sharing, and external sends remain
disabled.

Goal 61 adds a stable local seed assignment for that first write path and shows
plain-English readback after a start result. Local reviewers can use
`50000000-0000-4000-8000-000000000003` to confirm the page refreshes from
`not_started` to `in_progress` after the localhost-only action-start write.

Goal 62 adds the second local browser-to-Supabase write path for
`evidence_submitted` proof/testimonial metadata on
`/rush-month/actions/[assignmentId]`. It requires the same localhost-only auth
and local write posture as Goal 60, plus
`MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`, an assignment already in
`in_progress` or `changes_requested`, and proof uploads remaining disabled. It
records metadata only through the existing audited database function and does
not upload files, publish proof, or send automation.

Goal 63 adds the third local browser-to-Supabase write path for
`hq_sharing_decision` on `/rush-month/review`. It lets fake local Admin or
Super Admin users record HQ proof-sharing decisions through the existing
audited database function, while still refusing public proof publishing and all
external automation.

Goal 64 adds the fourth local browser-to-Supabase write path for
`action_assigned` on `/rush-month/actions`. It lets fake local chapter leaders
or Super Admin users create a local assignment through the existing audited
database function, while still keeping reminders and all external automation
disabled.

Goal 65 adds the fifth local browser-to-Supabase write path for
`coach_decision_logged` on `/coach`. It lets fake local Coach, Admin, or Super
Admin users record advance / hold / intervene decisions through the existing
audited database function, while still keeping n8n escalation packets and all
external automation disabled.

Goal 66 adds an admin-facing MVP progress map. It groups the remaining product
into understandable subprojects, shows directional local-review and live-MVP
percentages, names risks and route evidence, and keeps the app honest about
auth, uploads, production deploy, admin operations, and external integrations
still needing approval or future build work.

Goal 67 adds a read-only chapter membership workspace at `/chapter/members`.
It shows roster follow-up, join requests, role coverage, disabled future
membership controls, audit previews, and outbox previews for leaders, coaches,
admins, and super admins while keeping members and DS Admin out of membership
management truth.

Goal 68 adds a mock-safe proof upload intake readiness route at
`/proof-library/upload`. Students, leaders, coaches, admins, and super admins
can preview future file constraints, consent/context requirements, disabled
upload/publish/export controls, future structured events, and disabled outbox
destinations while DS Admin stays out of student proof content. No files are
uploaded, no buckets are created, no proof is published, and no external
automation runs.

Goal 69 adds a mock-safe Rush Month event readiness route at
`/rush-month/events`. Members, leaders, coaches, admins, and super admins can
review event plans, student actions, NPS questions, proof prompts, disabled
Luma posture, future structured event records, and disabled outbox rows while
DS Admin remains restricted from chapter event truth. No Luma event writes,
attendance imports, reminders, warehouse exports, n8n workflows, or AI summaries
run.

Do not connect production Supabase, create real users, enable browser app
writes beyond the approved local action-start, assignment creation, proof
metadata, HQ proof decision, and coach decision slices, or enable external writes until Nick approves a later
implementation goal.

## Recommended Stack

Recommended model for this stack decision: GPT-5.5 Thinking.
Reason: stack choice affects the long-term architecture, hosting, data model,
integrations, and security posture.

Recommended stack for this repo:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel deployment
- GitHub PR workflow
- Linear issue tracking

Why this recommendation:

- The myMEDLIFE build handoff explicitly recommends Next.js, Supabase, and
  Vercel for this custom PWA.
- The repo is already scaffolded as a Next.js app.
- Supabase is the planned app source of truth for auth, chapter membership,
  permissions, assignments, evidence, points, KPIs, and events.
- Vercel fits the public PWA deployment path for `www.myMEDLIFE.org`.

Stack conflict to keep visible:

- Kiomi's general project standard defaults to Vite, TanStack Router, TanStack
  Query, Hono, Cloudflare services, and evlog.
- Do not silently mix these stacks.
- If the team wants to switch to Kiomi's default stack, confirm that decision
  with Nick/team before changing this repo.

## Product Posture

myMEDLIFE should turn MEDLIFE campaign SOPs into distributed student action. It
should not become a passive SOP library, a generic marketing site, or a forum.

The first acceptance test is Rush Month:

leader assigns action -> member completes action -> evidence is submitted ->
leader/coach reviews -> points/KPIs update -> coach sees advance/hold/intervene.

All external integrations are mock-first until explicitly approved.

## Important Docs

- [Agent standards](./AGENTS.md)
- [Foundation and Rush Month MVP architecture](./docs/architecture/foundation-and-rush-month-mvp.md)
- [Supabase schema, auth, and RLS design plan](./docs/architecture/supabase-schema-auth-rls-plan.md)
- [Goal 6 Supabase foundation review and Goal 7 plan](./docs/architecture/goal-6-supabase-foundation-review.md)
- [Goal 13 local write implementation plan](./docs/architecture/goal-13-local-write-implementation-plan.md)
- [Goal 14 action start write](./docs/architecture/goal-14-action-start-write.md)
- [Goal 15 proof submission write](./docs/architecture/goal-15-proof-submission-write.md)
- [Goal 16 HQ proof sharing decision](./docs/architecture/goal-16-hq-proof-sharing-decision.md)
- [Goal 17 proof and video storage plan](./docs/architecture/goal-17-proof-video-storage-plan.md)
- [Goal 18 leader assignment creation](./docs/architecture/goal-18-leader-assignment-create.md)
- [Goal 19 auth and onboarding plan](./docs/architecture/goal-19-auth-onboarding-plan.md)
- [Goal 20 live data connection plan](./docs/architecture/goal-20-live-data-connection-plan.md)
- [Goal 21 campaign operating shells](./docs/architecture/goal-21-campaign-operating-shells.md)
- [Goal 22 Rush Month role-aware dashboard](./docs/architecture/goal-22-rush-month-dashboard.md)
- [Goal 23 action-start browser write gate](./docs/architecture/goal-23-action-start-browser-write-gate.md)
- [Goal 24 leader assignment browser write gate](./docs/architecture/goal-24-leader-assignment-write-gate.md)
- [Goal 25 proof submission browser write gate](./docs/architecture/goal-25-proof-submission-browser-write-gate.md)
- [Goal 26 HQ proof-sharing browser write gate](./docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md)
- [Goal 27 coach decision browser write gate](./docs/architecture/goal-27-coach-decision-browser-write-gate.md)
- [Goal 28 write activation readiness dashboard](./docs/architecture/goal-28-write-activation-readiness.md)
- [Goal 29 write activation approval plan](./docs/architecture/goal-29-write-activation-approval-plan.md)
- [Goal 30 action-start activation contract](./docs/architecture/goal-30-action-start-activation-contract.md)
- [Goal 31 action-start result states](./docs/architecture/goal-31-action-start-result-states.md)
- [Goal 32 proof submission result states](./docs/architecture/goal-32-proof-submission-result-states.md)
- [Goal 33 HQ proof decision result states](./docs/architecture/goal-33-hq-proof-decision-result-states.md)
- [Goal 34 coach decision result states](./docs/architecture/goal-34-coach-decision-result-states.md)
- [Goal 35 result-state coverage review](./docs/architecture/goal-35-result-state-coverage.md)
- [Goal 36 assignment creation result states](./docs/architecture/goal-36-assignment-create-result-states.md)
- [Goal 37 Rush Month local operating loop](./docs/architecture/goal-37-rush-month-local-loop.md)
- [Goal 38 admin control center](./docs/architecture/goal-38-admin-control-center.md)
- [Goal 39 role next actions](./docs/architecture/goal-39-role-next-actions.md)
- [Goal 40 leader follow-up board](./docs/architecture/goal-40-leader-follow-up-board.md)
- [Goal 41 coach portfolio readiness](./docs/architecture/goal-41-coach-portfolio-readiness.md)
- [Goal 42 proof-sharing review states](./docs/architecture/goal-42-proof-sharing-review-states.md)
- [Goal 43 member recognition](./docs/architecture/goal-43-member-recognition.md)
- [Goal 44 campaign closeout readiness](./docs/architecture/goal-44-campaign-closeout-readiness.md)
- [Goal 45 MVP coverage checklist](./docs/architecture/goal-45-mvp-coverage-checklist.md)
- [Goal 46 route smoke manifest](./docs/architecture/goal-46-route-smoke-manifest.md)
- [Goal 47 MVP release readiness](./docs/architecture/goal-47-mvp-release-readiness.md)
- [Goal 48 mobile navigation polish](./docs/architecture/goal-48-mobile-navigation-polish.md)
- [Goal 49 centralized local actor panels](./docs/architecture/goal-49-centralized-local-actor-panels.md)
- [Goal 50 PWA install readiness](./docs/architecture/goal-50-pwa-install-readiness.md)
- [Goal 51 page metadata](./docs/architecture/goal-51-page-metadata.md)
- [Goal 52 route registry guard](./docs/architecture/goal-52-route-registry-guard.md)
- [Goal 53 route coverage summary](./docs/architecture/goal-53-route-coverage-summary.md)
- [Goal 54 stakeholder review path](./docs/architecture/goal-54-stakeholder-review-path.md)
- [Goal 55 admin glossary](./docs/architecture/goal-55-admin-glossary.md)
- [Goal 56 environment safety summary](./docs/architecture/goal-56-environment-safety-summary.md)
- [Goal 57 local MVP review guide](./docs/architecture/goal-57-local-review-guide.md)
- [Goal 58 local Supabase Auth sign-in](./docs/architecture/goal-58-local-auth-sign-in.md)
- [Goal 59 auth-derived actor context](./docs/architecture/goal-59-auth-derived-actor-context.md)
- [Goal 60 action-start server action](./docs/architecture/goal-60-action-start-server-action.md)
- [Goal 61 action-start readback proof](./docs/architecture/goal-61-action-start-readback.md)
- [Goal 62 proof submission server action](./docs/architecture/goal-62-proof-submission-server-action.md)
- [Goal 63 HQ proof decision server action](./docs/architecture/goal-63-hq-proof-decision-server-action.md)
- [Goal 64 leader assignment server action](./docs/architecture/goal-64-leader-assignment-server-action.md)
- [Goal 65 coach decision server action](./docs/architecture/goal-65-coach-decision-server-action.md)
- [Goal 66 MVP progress map](./docs/architecture/goal-66-mvp-progress-map.md)
- [Goal 67 chapter membership workspace](./docs/architecture/goal-67-chapter-membership-workspace.md)
- [Goal 68 proof upload intake readiness](./docs/architecture/goal-68-proof-upload-intake.md)
- [Goal 69 Rush Month event readiness](./docs/architecture/goal-69-rush-month-event-readiness.md)
- [Local MVP review guide](./docs/review/local-mvp-review-guide.md)
- [Future RLS test plan](./docs/testing/rls-test-plan.md)
- [Supabase local development](./docs/supabase-local-development.md)
- [Codex operating brief](./docs/operating-brief.md)

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Run checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run local Supabase when Docker is available:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test
```

To test the read-only local Supabase path:

```bash
cp .env.example .env.local
# Set MYMEDLIFE_DATA_SOURCE=supabase
# Set MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
# Set SUPABASE_SERVICE_ROLE_KEY to the local service role key printed by Supabase
# Optional: set MYMEDLIFE_LOCAL_ACTOR_EMAIL to one of the fake seed users.
# This also works when the app is using mock fallback data.
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

## Environment Variables

No live external services are required for the current mock app or local
database foundation. The app uses mock data unless local Supabase reads are
explicitly enabled.

```bash
MYMEDLIFE_DATA_SOURCE=mock
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=false
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false
MYMEDLIFE_ENABLE_ACTION_START_WRITE=false
MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=false
MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=false
MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=false
MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=false
MYMEDLIFE_ALLOW_PROOF_UPLOADS=false
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MYMEDLIFE_LOCAL_ACTOR_EMAIL=member.a@mymedlife.test
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Rules:

- Never commit real secrets.
- Keep `MYMEDLIFE_DATA_SOURCE=mock` unless you are intentionally testing local
  Supabase.
- Goal 8 only permits localhost Supabase reads. Non-local Supabase URLs fall
  back to mock data.
- Goal 9 actor switching is local-only and reads fake seed users by email. It
  does not add browser sign-in, sessions, cookies, or production auth.
- Goal 10 role filtering is read-only and local-only. It uses
  `MYMEDLIFE_LOCAL_ACTOR_EMAIL` to preview member, leader, coach, admin, DS
  admin, and super admin views.
- Goal 11 local action/proof contracts are preview-only. They shape future
  events, audit logs, and disabled outbox rows but do not save data, upload
  files, publish proof, or trigger automation.
- Goal 12 write-readiness is an airlock. `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES`
  is documented but still blocked by code until a later approved goal adds
  real local writes with RLS tests.
- Goal 13 write planning is documentation and tests only. It names the first
  future write paths, including assignment creation, but the app still refuses
  to save data.
- Goal 14 adds the first local Supabase database write function for
  `action_started`. Browser saves require the later Goal 60 local-only server
  action flags.
- Goal 15 adds the first local Supabase database write function for
  `evidence_submitted` proof/testimonial metadata. Browser saves require the
  later Goal 62 local-only server action flags. Uploads, public proof sharing,
  and external automation remain disabled.
- Goal 16 adds the first local Supabase database write function for
  `hq_sharing_decision_logged` proof/testimonial sharing decisions. The browser
  UI still does not save decisions, publish proof, or send automation.
- Goal 17 adds proof/video storage planning and disabled upload readiness.
  `MYMEDLIFE_ALLOW_PROOF_UPLOADS=true` still does not upload files or publish
  proof.
- Goal 18 adds the first local Supabase database write function for
  `action_assigned` chapter-leader assignment creation. The browser UI still
  does not save assignments or send automation.
- Goal 19 adds auth/onboarding planning and tests. Live auth, browser sessions,
  production users, join requests, membership approvals, and role assignments
  remain disabled.
- Goal 20 adds the route-by-route live-data connection plan. Production
  Supabase, browser writes, and external writes remain disabled.
- Goal 21 adds read-only campaign shells, action committee event examples, and
  proof-library posture. It still does not build all campaigns, publish proof,
  enable browser writes, or send anything externally.
- Goal 22 adds a role-aware Rush Month dashboard and exact starter campaign
  shells. It still does not enable browser writes, live auth, proof uploads, or
  external sends.
- Goal 23 adds a browser-write activation gate for action start. It still keeps
  the enabled browser control off, even if the local write env var is set.
- Goal 24 adds a browser-write activation gate for leader assignment creation.
  It also keeps the enabled browser control off, even if the local write env var
  is set.
- Goal 25 adds a browser-write activation gate for proof/testimonial submission.
  It still keeps proof saves, uploads, public sharing, and enabled browser
  controls off, even if the local write env var is set.
- Goal 26 adds a browser-write activation gate for HQ proof-sharing decisions.
  It still keeps decision saves, public sharing, and enabled browser controls
  off, even if the local write env var is set.
- Goal 27 adds a browser-write activation gate for coach decisions. It still
  keeps coach decision saves, n8n escalation packets, and enabled browser
  controls off, even if the local write env var is set.
- Goal 28 adds the consolidated write activation readiness panel on `/admin`.
  It keeps every enabled browser control at zero.
- Goal 29 adds the write activation approval plan on `/admin`. It does not
  grant approval or activate any write.
- Goal 30 adds the action-start activation contract on
  `/rush-month/actions/[assignmentId]`. It does not create a server action or
  save from the browser.
- Goal 31 adds action-start result states. It does not wire those states to a
  real browser write.
- Goal 32 adds proof submission result states. It does not wire those states to
  a real browser write, upload, public sharing workflow, or external automation.
- Goal 33 adds HQ proof decision result states. It does not wire those states
  to a real browser write, public proof publishing workflow, or external
  automation.
- Goal 34 adds coach decision result states. It does not wire those states to a
  real browser write, n8n escalation packet, or external automation.
- Goal 35 adds an admin result-state coverage review. It does not treat
  coverage as approval, and it keeps assignment creation marked as missing
  result-state review.
- Goal 36 adds assignment creation result states and marks all five first write
  candidates covered in the admin coverage panel. It still does not enable
  browser writes or reminder automation.
- Goal 37 adds a browser-local Rush Month operating loop. It is interactive
  review evidence only; it still does not save to Supabase or send external
  automation.
- Goal 38 adds a read-only admin control center. It names the required admin
  MVP surfaces but does not enable admin mutations.
- Goal 48 adds role-aware mobile quick navigation and active route styling.
  It improves reviewer usability without enabling live auth, browser writes,
  uploads, public proof sharing, or external integrations.
- Goal 49 centralizes the local actor notice and role switcher in `AppShell`
  so actor-aware routes inherit consistent reviewer context without duplicating
  page-level debug panels.
- Goal 50 adds static PWA install metadata and an app icon. It does not add a
  service worker, offline caching, push notifications, live auth, browser
  writes, uploads, public proof sharing, or external integrations.
- Goal 51 adds static page titles and descriptions for core routes. It does
  not change permissions, data loading, writes, auth, uploads, public proof
  sharing, or integrations.
- Goal 52 adds a route registry guard for primary navigation, mobile
  navigation, and admin smoke-manifest links. It does not change route
  permissions, visibility, data loading, writes, auth, uploads, public proof
  sharing, or integrations.
- Goal 53 adds an admin route coverage summary. It does not add routes, change
  navigation behavior, or enable auth, writes, uploads, public proof sharing,
  or integrations.
- Goal 54 adds an admin stakeholder review path. It does not enable auth,
  browser writes, uploads, public proof sharing, reminders, escalation packets,
  or external integrations.
- Goal 55 adds a plain-English admin glossary. It does not enable auth, writes,
  uploads, public proof sharing, external sends, reminders, escalation packets,
  service workers, or production data.
- Goal 56 adds an environment safety summary without showing secrets. It does
  not enable auth, writes, uploads, public proof sharing, external sends,
  reminders, escalation packets, service workers, or production data.
- Goal 57 adds a plain-English local MVP review guide. It is documentation only
  and does not enable auth, writes, uploads, public proof sharing, external
  integrations, service workers, reminders, escalation packets, or production
  data.
- Goal 58 adds localhost-only Supabase Auth sign-in at `/login` for fake local
  seed users. It does not enable production Supabase Auth, production users,
  browser app writes, uploads, public proof sharing, or external sends.
- Goal 59 maps signed-in local Supabase Auth users into role-aware actor
  context. It keeps the debug actor fallback and still does not enable
  production auth, production users, browser writes, uploads, public proof
  sharing, or external sends.
- Goal 60 adds the first local action-start server action. It requires local
  Supabase Auth, a fake seed user, and both local write flags. It does not
  enable production Supabase, production users, assignment creation writes,
  proof writes, coach writes, uploads, public proof sharing, or external sends.
- Goal 62 adds the second local server action for proof/testimonial metadata.
  It requires local Supabase Auth, a fake seed user, local write flags, an
  in-progress or changes-requested assignment, and uploads disabled. It does
  not upload files, publish proof, or trigger external sends.
- Goal 63 adds the third local server action for HQ proof/testimonial sharing
  decisions. It requires local Supabase Auth, a fake Admin or Super Admin seed
  user, local write flags, a UUID evidence item, and public sharing disabled.
  It does not publish proof or trigger external sends.
- Goal 64 adds the fourth local server action for chapter-leader assignment
  creation. It requires local Supabase Auth, a fake leader or Super Admin seed
  user, local write flags, UUID chapter/campaign rows, and reminder automation
  disabled. It creates a disabled outbox row but sends no reminders.
- Goal 65 adds the fifth local server action for coach advance / hold /
  intervene decisions. It requires local Supabase Auth, a fake Coach, Admin, or
  Super Admin seed user, local write flags, UUID chapter/campaign/phase rows,
  and escalation packets disabled. It creates a disabled outbox row but sends no
  escalation packet.
- Goal 68 adds the proof upload intake readiness route at
  `/proof-library/upload`. It validates future file/consent/context posture and
  names future events/outbox destinations, but it does not create storage
  buckets, upload files, publish proof, export raw proof, or trigger external
  sends.
- Goal 69 adds the Rush Month event readiness route at `/rush-month/events`.
  It previews event plans, NPS questions, proof prompts, disabled Luma posture,
  future structured events, and disabled outbox destinations, but it does not
  create/update Luma events, import attendance, send NPS reminders, export
  warehouse rows, or trigger external sends.
- Keep real HubSpot, Luma, warehouse, Power BI, and n8n writes disabled until
  explicitly approved.
- Use mock-safe integration events and outbox rows before adding real syncs.

## Current App State

The app currently uses mock data by default. When local Supabase env vars are
explicitly enabled, these server-rendered routes can read fake local Supabase
data and fake local actor context. With or without local Supabase running,
`MYMEDLIFE_LOCAL_ACTOR_EMAIL` can preview the Goal 10 local role views:

- `/chapter`
- `/chapter/members`
- `/campaigns`
- `/campaigns/[campaignSlug]`
- `/action-committees`
- `/rush-month`
- `/rush-month/dashboard`
- `/rush-month/loop`
- `/rush-month/events`
- `/rush-month/actions`
- `/rush-month/actions/[assignmentId]`
- `/rush-month/evidence`
- `/rush-month/review`
- `/proof-library`
- `/proof-library/upload`
- `/coach`
- `/admin`

There is no live Supabase auth, browser app write path, production database
connection, HubSpot write, Luma write, warehouse export, Power BI export, n8n
workflow, or AI summary.

Goal 2 route shells:

- `/`: mobile-first app front door
- `/chapter`: chapter home shell
- `/chapter/members`: read-only roster, join request, role coverage, and membership control posture
- `/campaigns`: role-aware campaign catalog
- `/campaigns/[campaignSlug]`: campaign detail, action lanes, events, proof, KPIs, and disabled integration posture
- `/action-committees`: action committee and chapter event operating examples
- `/rush-month`: Rush Month campaign shell
- `/rush-month/dashboard`: role-aware Rush Month operating dashboard
- `/rush-month/loop`: browser-local end-to-end Rush Month operating-loop demo
- `/rush-month/events`: mock-safe event, NPS, proof prompt, disabled Luma, and future outbox readiness
- `/rush-month/actions`: role-aware visible assignments plus disabled leader assignment gate
- `/rush-month/actions/[assignmentId]`: role-aware action detail, local proof contract preview, and disabled proof submission gate
- `/rush-month/evidence`: role-aware proof/testimonial list
- `/rush-month/review`: HQ proof-sharing review preview and disabled HQ decision gate
- `/proof-library`: role-aware proof/testimonial library posture
- `/proof-library/upload`: mock-safe proof upload intake readiness, consent/context checks, disabled upload controls, and future event/outbox posture
- `/coach`: coach dashboard shell
- `/admin`: admin/super-admin integration placeholder

Mock Rush Month data lives in `src/data/mock-rush-month.ts`. Mock campaign,
action committee, event, and proof library data lives in
`src/data/mock-campaigns.ts`. Shared domain types live in
`src/shared/types/domain.ts` and `src/shared/types/campaigns.ts`. Validation
schemas live in `src/shared/schemas/domain.ts`. Pure mock workflow logic lives
in `src/services/rush-month-service.ts`. Campaign operating logic lives in
`src/services/campaign-ops-service.ts`. Local action/proof contract previews
live in `src/services/local-action-contracts.ts`. Disabled future write
boundaries live in `src/services/write-readiness.ts`. Small reusable UI
components live in `src/components`.

Goal 4 Supabase planning lives in
`docs/architecture/supabase-schema-auth-rls-plan.md`. The draft SQL sketch lives
in `docs/architecture/drafts/0001_supabase_schema_draft.sql` and is not an
applied migration.

Goal 5 local Supabase implementation lives in:

- `.github/workflows/goal-5-ci.yml`
- `supabase/config.toml`
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`
- `supabase/seed.sql`
- `supabase/tests/database/rls_goal_5.test.sql`
- `docs/supabase-local-development.md`

Goal 6 planning lives in:

- `docs/architecture/goal-6-supabase-foundation-review.md`
- `docs/architecture/drafts/0002_goal_6_schema_refinements_draft.sql`

Goal 7 local schema refinement lives in:

- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`
- `supabase/tests/database/rls_goal_7.test.sql`
- additional fake Goal 7 records in `supabase/seed.sql`

Goal 8 read-only app foundation lives in:

- `.env.example`
- `src/lib/supabase-readonly.ts`
- `src/services/read-only-app-data.ts`
- `src/components/data-source-notice.tsx`
- `tests/supabase-readonly.test.ts`
- `tests/read-only-app-data.test.ts`

Goal 10 role-aware read-only proof lives in:

- `src/services/role-visibility.ts`
- `src/components/local-role-switcher.tsx`
- `src/components/restricted-state.tsx`
- role-aware updates to `/chapter`, `/rush-month`, `/rush-month/actions`,
  `/coach`, and `/admin`
- `tests/role-visibility.test.ts`

Goal 11 local proof/action contracts live in:

- `src/services/local-action-contracts.ts`
- `tests/local-action-contracts.test.ts`
- expanded proof evidence types in `src/shared/types/domain.ts` and
  `src/shared/schemas/domain.ts`
- role-aware updates to `/rush-month/actions/[assignmentId]`,
  `/rush-month/evidence`, and `/rush-month/review`

Goal 12 disabled write-readiness lives in:

- `src/services/write-readiness.ts`
- `src/components/write-readiness-notice.tsx`
- `tests/write-readiness.test.ts`
- visible write-readiness notices on action detail and HQ review screens

Goal 13 local write planning lives in:

- `docs/architecture/goal-13-local-write-implementation-plan.md`
- `src/services/write-plan-matrix.ts`
- `tests/write-plan-matrix.test.ts`

Goal 14 local action-start write lives in:

- `docs/architecture/goal-14-action-start-write.md`
- `supabase/migrations/20260616090000_goal_14_action_start_write.sql`
- `supabase/tests/database/rls_goal_14.test.sql`

Goal 15 local proof/testimonial metadata write lives in:

- `docs/architecture/goal-15-proof-submission-write.md`
- `supabase/migrations/20260616093000_goal_15_proof_submission_write.sql`
- `supabase/tests/database/rls_goal_15.test.sql`

Goal 16 local HQ proof/testimonial sharing decision write lives in:

- `docs/architecture/goal-16-hq-proof-sharing-decision.md`
- `supabase/migrations/20260616103000_goal_16_hq_proof_sharing_decision.sql`
- `supabase/tests/database/rls_goal_16.test.sql`

Goal 17 proof/video storage planning lives in:

- `docs/architecture/goal-17-proof-video-storage-plan.md`
- `src/services/proof-storage-readiness.ts`
- `tests/proof-storage-readiness.test.ts`

Goal 18 local leader assignment creation lives in:

- `docs/architecture/goal-18-leader-assignment-create.md`
- `supabase/migrations/20260616110000_goal_18_leader_assignment_create.sql`
- `supabase/tests/database/rls_goal_18.test.sql`

Goal 19 auth/onboarding planning lives in:

- `docs/architecture/goal-19-auth-onboarding-plan.md`
- `src/services/auth-onboarding-plan.ts`
- `tests/auth-onboarding-plan.test.ts`

Goal 58 local Supabase Auth sign-in lives in:

- `docs/architecture/goal-58-local-auth-sign-in.md`
- `src/app/login/page.tsx`
- `src/app/login/actions.ts`
- `src/lib/supabase-server.ts`
- `src/services/supabase-auth-config.ts`
- `src/services/auth-session.ts`
- `tests/supabase-auth-config.test.ts`
- `tests/auth-session.test.ts`

Goal 59 auth-derived actor context lives in:

- `docs/architecture/goal-59-auth-derived-actor-context.md`
- `src/services/local-actor-context.ts`
- `src/components/local-actor-notice.tsx`
- `src/components/local-role-switcher.tsx`
- `tests/local-actor-context.test.ts`

Goal 60 local action-start server action lives in:

- `docs/architecture/goal-60-action-start-server-action.md`
- `src/app/rush-month/actions/[assignmentId]/actions.ts`
- `src/components/action-start-server-action-panel.tsx`
- `src/services/action-start-write.ts`
- `tests/action-start-write.test.ts`

Goal 62 local proof/testimonial metadata server action lives in:

- `docs/architecture/goal-62-proof-submission-server-action.md`
- `src/app/rush-month/actions/[assignmentId]/actions.ts`
- `src/components/proof-submission-server-action-panel.tsx`
- `src/services/proof-submission-write.ts`
- `tests/proof-submission-write.test.ts`

Goal 63 local HQ proof decision server action lives in:

- `docs/architecture/goal-63-hq-proof-decision-server-action.md`
- `src/app/rush-month/review/actions.ts`
- `src/app/rush-month/review/page.tsx`
- `src/components/hq-proof-decision-server-action-panel.tsx`
- `src/services/hq-proof-decision-write.ts`
- `tests/hq-proof-decision-write.test.ts`

Goal 64 local leader assignment server action lives in:

- `docs/architecture/goal-64-leader-assignment-server-action.md`
- `src/app/rush-month/actions/actions.ts`
- `src/app/rush-month/actions/page.tsx`
- `src/components/leader-assignment-server-action-panel.tsx`
- `src/services/assignment-create-write.ts`
- `tests/assignment-create-write.test.ts`

Goal 65 local coach decision server action lives in:

- `docs/architecture/goal-65-coach-decision-server-action.md`
- `src/app/coach/actions.ts`
- `src/app/coach/page.tsx`
- `src/components/coach-decision-server-action-panel.tsx`
- `src/services/coach-decision-write.ts`
- `tests/coach-decision-write.test.ts`

Goal 66 MVP progress map lives in:

- `docs/architecture/goal-66-mvp-progress-map.md`
- `src/components/mvp-progress-map-panel.tsx`
- `src/services/mvp-progress-map.ts`
- `tests/mvp-progress-map.test.ts`

Goal 67 chapter membership workspace lives in:

- `docs/architecture/goal-67-chapter-membership-workspace.md`
- `src/app/chapter/members/page.tsx`
- `src/components/chapter-membership-workspace-panel.tsx`
- `src/services/chapter-membership-workspace.ts`
- `tests/chapter-membership-workspace.test.ts`

Goal 20 live-data connection planning lives in:

- `docs/architecture/goal-20-live-data-connection-plan.md`
- `src/services/live-data-connection-plan.ts`
- `tests/live-data-connection-plan.test.ts`

Goal 21 campaign operating shells live in:

- `docs/architecture/goal-21-campaign-operating-shells.md`
- `src/shared/types/campaigns.ts`
- `src/data/mock-campaigns.ts`
- `src/services/campaign-ops-service.ts`
- `src/components/campaign-card.tsx`
- `src/app/campaigns/page.tsx`
- `src/app/campaigns/[campaignSlug]/page.tsx`
- `src/app/action-committees/page.tsx`
- `src/app/proof-library/page.tsx`
- `tests/campaign-ops-service.test.ts`

Goal 22 Rush Month dashboard lives in:

- `docs/architecture/goal-22-rush-month-dashboard.md`
- `src/app/rush-month/dashboard/page.tsx`
- `src/data/mock-leaderboard.ts`
- `src/services/rush-month-dashboard-service.ts`
- `src/shared/types/rush-month-dashboard.ts`
- `tests/rush-month-dashboard-service.test.ts`

Goal 23 action-start browser write gate lives in:

- `docs/architecture/goal-23-action-start-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/components/browser-write-gate-notice.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions/[assignmentId]`

Goal 24 leader assignment browser write gate lives in:

- `docs/architecture/goal-24-leader-assignment-write-gate.md`
- `src/services/local-action-contracts.ts`
- `src/services/write-plan-matrix.ts`
- `src/services/write-readiness.ts`
- `src/services/browser-write-activation.ts`
- `tests/local-action-contracts.test.ts`
- `tests/write-plan-matrix.test.ts`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions`

Goal 25 proof submission browser write gate lives in:

- `docs/architecture/goal-25-proof-submission-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/app/rush-month/actions/[assignmentId]/page.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/actions/[assignmentId]` for roles that
  can submit proof

Goal 26 HQ proof-sharing browser write gate lives in:

- `docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md`
- `src/services/browser-write-activation.ts`
- `src/app/rush-month/review/page.tsx`
- `tests/browser-write-activation.test.ts`
- visible gate notice on `/rush-month/review` for roles that can make HQ
  sharing decisions

Goal 27 coach decision browser write gate lives in:

- `docs/architecture/goal-27-coach-decision-browser-write-gate.md`
- `supabase/migrations/20260616120000_goal_27_coach_decision_write.sql`
- `supabase/tests/database/rls_goal_27.test.sql`
- visible gate notice on `/coach`

Goal 28 write activation readiness lives in:

- `docs/architecture/goal-28-write-activation-readiness.md`
- `src/services/write-activation-readiness.ts`
- `src/components/write-activation-readiness-panel.tsx`
- `tests/write-activation-readiness.test.ts`
- visible readiness panel on `/admin`

Goal 29 write activation approval plan lives in:

- `docs/architecture/goal-29-write-activation-approval-plan.md`
- `src/services/write-activation-approval-plan.ts`
- `src/components/write-activation-approval-plan-panel.tsx`
- `tests/write-activation-approval-plan.test.ts`
- visible approval plan on `/admin`

Goal 30 action-start activation contract lives in:

- `docs/architecture/goal-30-action-start-activation-contract.md`
- `src/services/action-start-activation-contract.ts`
- `src/components/action-start-activation-contract-panel.tsx`
- `tests/action-start-activation-contract.test.ts`
- visible contract on `/rush-month/actions/[assignmentId]`

Goal 31 action-start result states live in:

- `docs/architecture/goal-31-action-start-result-states.md`
- `src/services/action-start-result-states.ts`
- `src/components/action-start-result-states-panel.tsx`
- `tests/action-start-result-states.test.ts`
- visible result-state panel on `/rush-month/actions/[assignmentId]`

Goal 32 proof submission result states live in:

- `docs/architecture/goal-32-proof-submission-result-states.md`
- `src/services/proof-submission-result-states.ts`
- `src/components/proof-submission-result-states-panel.tsx`
- `tests/proof-submission-result-states.test.ts`
- visible proof result-state panel on `/rush-month/actions/[assignmentId]`

Goal 33 HQ proof decision result states live in:

- `docs/architecture/goal-33-hq-proof-decision-result-states.md`
- `src/services/hq-proof-decision-result-states.ts`
- `src/components/hq-proof-decision-result-states-panel.tsx`
- `tests/hq-proof-decision-result-states.test.ts`
- visible HQ decision result-state panel on `/rush-month/review`

Goal 34 coach decision result states live in:

- `docs/architecture/goal-34-coach-decision-result-states.md`
- `src/services/coach-decision-result-states.ts`
- `src/components/coach-decision-result-states-panel.tsx`
- `tests/coach-decision-result-states.test.ts`
- visible coach decision result-state panel on `/coach`

Goal 35 result-state coverage review lives in:

- `docs/architecture/goal-35-result-state-coverage.md`
- `src/services/write-result-state-coverage.ts`
- `src/components/write-result-state-coverage-panel.tsx`
- `tests/write-result-state-coverage.test.ts`
- visible coverage review panel on `/admin`

Goal 36 assignment creation result states live in:

- `docs/architecture/goal-36-assignment-create-result-states.md`
- `src/services/assignment-create-result-states.ts`
- `src/components/assignment-create-result-states-panel.tsx`
- `tests/assignment-create-result-states.test.ts`
- visible assignment-create result-state panel on `/rush-month/actions`
- updated coverage review on `/admin`

Goal 37 Rush Month local operating loop lives in:

- `docs/architecture/goal-37-rush-month-local-loop.md`
- `src/services/rush-month-local-loop.ts`
- `src/components/rush-month-local-loop-demo.tsx`
- `src/app/rush-month/loop/page.tsx`
- `tests/rush-month-local-loop.test.ts`
- navigation entry in `src/services/role-visibility.ts`

Goal 38 admin control center lives in:

- `docs/architecture/goal-38-admin-control-center.md`
- `src/services/admin-control-center.ts`
- `src/components/admin-control-center-panel.tsx`
- `tests/admin-control-center.test.ts`
- visible admin control center panel on `/admin`

Goal 9 local actor context lives in:

- `src/services/local-actor-context.ts`
- `src/components/local-actor-notice.tsx`
- `tests/local-actor-context.test.ts`

## Linear Lane

Primary live issues:

- MED-412: Bootstrap myMEDLIFE PWA repo lane
- MED-413: Define Supabase schema and role model
- MED-414: Build Rush Month MVP action loop
- MED-415: Build evidence submission and review workflow
- MED-416: Build points, KPI events, and leaderboard stubs
- MED-417: Build Luma, HubSpot, warehouse, and AI mock integration layer
- MED-418: Run bake-off evaluation against Discourse prototype

## Definition of Done for Goal 38

Goal 38 is complete when a human developer can open `/admin` and see the
read-only admin control center for users, roles, chapters, campaign templates,
integration/outbox posture, audit-log readiness, and system-health placeholders
with no admin mutation controls enabled.

The app remains mock-first by default. Goal 38 does not wire production
Supabase, create a server action, enable browser writes, upload files, publish
proof, remove mock fallback, send reminders or escalation packets, enable admin
mutations, or activate real integrations.
