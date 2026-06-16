# AGENTS.md

This repo is governed by a Codex-owned architecture workflow for the custom
myMEDLIFE PWA at `www.myMEDLIFE.org`.

Build the smallest clear Rush Month operating loop first. Do not overbuild. Do
not replace or modify the Discourse prototype from this repo unless Nick
explicitly approves that change.

## Model Routing

For every Linear issue, begin by stating the recommended model and the reason.

Use GPT-5.4 mini for:

- routine scaffolding
- simple UI
- TypeScript components
- Tailwind styling
- mock data
- simple forms
- documentation updates
- minor bug fixes
- simple tests

Recommend GPT-5.5 Thinking or the strongest available reasoning model before:

- repo or architecture decisions
- Supabase schema, RLS, auth, or security decisions
- role and permission decisions
- integration contracts or n8n outbox design
- AI/event design
- points or KPI ledger design
- major refactors
- final PR review before merge

Use this wording when escalation is needed:

```text
Nick, switch me to GPT-5.5 Thinking for this next step because this affects the
long-term architecture, security, integrations, or review safety of the app.
```

## Stack Boundary

The current myMEDLIFE plan recommends:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage
- Vercel deployment
- GitHub PR workflow
- Linear issue tracking

Kiomi's general standard defaults to Vite, TanStack Router, TanStack Query, Hono,
Cloudflare services, and evlog.

Do not silently mix stacks. If the team wants to switch from the current Next.js
path to Kiomi's default stack, pause and confirm with Nick/team first.

## Source Of Truth

GitHub is canonical for code and implementation evidence.

Linear is canonical for issue scope, ownership, acceptance criteria, and status.

Discourse is a prototype/reference layer, not the final source of truth for this
custom PWA.

Supabase should become the app source of truth for:

- users
- chapters
- memberships
- role approvals
- assignments
- evidence/proof reviews
- points ledger
- KPI ledger
- campaign status
- structured app events

n8n should remain an external orchestration layer, not the owner of app truth.

## Integration Boundary

External writes are disabled until explicitly approved.

Do not trigger real writes to:

- HubSpot
- Luma
- warehouse or Data Hub
- Power BI
- n8n

Instead, record structured `IntegrationEvent` and `AutomationOutbox` rows so
future automation can safely pick up approved events.

## Human Maintainability Rules

Build in a standard, boring, conventional way that a human developer team can
maintain without AI.

Rules:

- Keep files small.
- Keep functions small.
- Use clear names.
- Avoid `any` unless there is a documented reason.
- Keep UI, business logic, data access, shared types, validation, and config
  separated.
- Validate external inputs.
- Avoid hidden side effects.
- Avoid clever abstractions and custom framework-like systems.
- Avoid unnecessary dependencies.
- Document environment variables before using them.
- Add tests for important logic when implementation begins.

Preferred future structure:

```text
src/
  app/
  components/
  features/
    assignments/
    campaigns/
    evidence/
    integrations/
    points/
  lib/
  services/
  shared/
    schemas/
    types/
tests/
```

## Collaboration Rules

- Use one branch per issue or focused work packet.
- Use PRs for material changes.
- Keep `main` protected when branch protection is available.
- Do not commit secrets, tokens, passwords, API keys, or private credentials.
- Do not reformat unrelated files.
- Do not rename files unless needed.
- Stop and ask if the task crosses a forbidden boundary or scope becomes
  unclear.

Material PRs should include:

- Linear issue ID
- scope summary
- files changed
- validation summary
- assumptions
- risks or blockers
- handoff note

## Current Goal Guardrail

The active goal is Goal 38: admin control center with production data, enabled
browser writes, admin mutation controls, reminder automation, escalation
packets, uploads, public proof sharing, and external integrations still
disabled.

Allowed:

- server-only, read-only local Supabase client setup
- mock fallback when Supabase env vars are missing or unsafe
- local Supabase environment documentation and `.env.example`
- small read-only data-access/service functions
- connecting `/chapter`, `/rush-month`, or `/coach` to read-only local data
- adding local-only fake actor context from seed profiles, memberships, staff
  roles, and coach assignments
- showing role-aware read-only context for fake member, leader, coach, admin,
  DS admin, and super admin users
- using `MYMEDLIFE_LOCAL_ACTOR_EMAIL` as a local-only role switch in mock
  fallback and local Supabase modes
- role-aware navigation labels, restricted-state messaging, read filters, and
  tests for the main permission boundaries
- local-only contract previews for action started, proof submitted, HQ
  proof-sharing decisions, audit intent, integration events, and disabled
  outbox rows
- disabled write-readiness services that list future write tables while
  returning blocked write attempts
- `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false` documentation, as long as code
  still refuses writes even if the env var is set to true
- local write implementation planning for assignment creation, action starts,
  proof submissions, and HQ proof-sharing decisions, as long as the
  implementation remains disabled
- a typed write-plan matrix and tests that document future RLS/security cases
- one local Supabase `action_started` write function that updates assignment
  status, records an internal event, records an integration-ready event row, and
  records an audit log together
- RLS/security tests proving direct assignment-start table updates are blocked
- one local Supabase `evidence_submitted` proof/testimonial metadata function
  that updates assignment status, creates evidence metadata, records an internal
  event, records an integration-ready event row, creates a disabled outbox row,
  and records an audit log together
- RLS/security tests proving direct evidence inserts are blocked
- one local Supabase `hq_sharing_decision_logged` function that updates proof
  sharing status, creates an HQ approval decision, records an internal event,
  records an integration-ready event row, creates a disabled outbox row, and
  records an audit log together
- RLS/security tests proving direct approval inserts are blocked
- proof/video storage planning that documents future private and public buckets,
  consent metadata, upload constraints, and access boundaries while keeping
  uploads disabled
- disabled proof-storage readiness services and tests that prove
  `MYMEDLIFE_ALLOW_PROOF_UPLOADS=true` does not upload files
- one local Supabase `action_assigned` assignment creation function that creates
  the assignment, records an internal event, records an integration-ready event
  row, creates a disabled outbox row, and records an audit log together
- RLS/security tests proving direct assignment inserts are blocked
- auth/onboarding planning that defines future sign-in, profile creation,
  chapter join request, membership approval, role assignment, coach assignment,
  and staff role assignment boundaries while keeping live auth disabled
- tests proving live auth and production users remain disabled
- live-data connection planning that defines the route-by-route migration order
  from mock data to local Supabase and controlled pilot readiness
- tests proving production Supabase, browser writes, and external writes remain
  disabled
- read-only campaign catalog and campaign detail shells for Rush Month and the
  next major campaign families
- action committee event-planning shells that show owners, student action,
  feedback/NPS posture, proof prompts, and mock/disabled Luma state
- proof-library posture that treats bridge videos, testimonials, UGC, and
  chapter recaps as belief-building assets requiring HQ sharing decisions
- tests proving DS Admin cannot read campaign, event, proof, student, points,
  or KPI truth
- a role-aware Rush Month dashboard that shows the right next action, metrics,
  assignments, events, proof prompts, leaderboard, watchouts, and integration
  posture for the selected local actor
- exact starter campaign shells for Planning / Goal Setting, Chapter
  Engagement, SLT Promotion, Moving Mountains, Leadership Transition, Grow the
  Movement, and Start a Chapter
- visible browser-write activation gates that make first-write prerequisites
  clear while keeping enabled controls disabled until Nick approves live auth
  and browser writes
- a visible assignment-create browser-write activation gate on
  `/rush-month/actions` that references the local `action_assigned` function
  while keeping enabled controls disabled
- a visible proof-submission browser-write activation gate on
  `/rush-month/actions/[assignmentId]` that references the local
  `evidence_submitted` function while keeping proof saves, uploads, public
  sharing, and enabled controls disabled
- a visible HQ proof-sharing browser-write activation gate on
  `/rush-month/review` that references the local `hq_sharing_decision` function
  while keeping decision saves, public sharing, and enabled controls disabled
- one local Supabase `coach_decision_logged` function that updates phase
  readiness, records a coach review, records an internal event, records an
  integration-ready event row, creates a disabled outbox row, and records an
  audit log together
- a visible coach-decision browser-write activation gate on `/coach` that
  references the local `coach_decision_logged` function while keeping decision
  saves, n8n escalation packets, external automation, and enabled controls
  disabled
- a consolidated `/admin` write activation readiness panel that summarizes the
  first browser-write gates, their routes, local functions, role posture, and
  remaining blockers while keeping enabled controls at zero
- a `/admin` write activation approval plan that recommends the first write
  activation order, names required approvals, and keeps every requirement
  incomplete until Nick/team explicitly approve the next goal
- an action-start activation contract on `/rush-month/actions/[assignmentId]`
  that documents the future `startAssignmentAction` server path while still
  returning a disabled attempt and requiring server-side auth identity later
- action-start result states on `/rush-month/actions/[assignmentId]` that show
  future success, disabled, duplicate, auth, permission, not-found, and error
  messages without creating a server action or enabling browser writes
- proof submission result states on `/rush-month/actions/[assignmentId]` that
  show future submitted, disabled, upload-disabled, duplicate, auth,
  permission, not-ready, not-found, and error messages without saving proof,
  uploading files, publishing proof, or enabling browser writes
- HQ proof decision result states on `/rush-month/review` that show future
  approved, changes-requested, do-not-share, disabled, auth, permission,
  not-found, already-decided, public-sharing-disabled, and error messages
  without saving decisions, publishing proof, or enabling browser writes
- coach decision result states on `/coach` that show future advance, hold,
  intervene, disabled, escalation-disabled, auth, permission, portfolio,
  note, blocker-summary, and error messages without saving decisions, sending
  escalation packets, or enabling browser writes
- an admin result-state coverage review that shows which first write candidates
  have reviewed result states, marks all five first candidates covered, and
  does not treat coverage as activation approval
- assignment creation result states on `/rush-month/actions` that show future
  created, disabled, reminder-disabled, duplicate, auth, permission,
  validation, and error messages without saving assignments, sending reminders,
  or enabling browser writes
- a browser-local Rush Month operating loop on `/rush-month/loop` that lets a
  reviewer click through assignment, action start, proof submission, completion
  review, points, KPIs, HQ sharing posture, coach decision, structured events,
  disabled outbox rows, and audit logs without Supabase writes or external
  sends
- a read-only admin control center on `/admin` that names user, role, chapter,
  campaign template, integration/outbox, audit log, and system health surfaces
  without enabling admin mutation controls
- role-aware proof/evidence and review screens that explain HQ owns broad
  proof-sharing decisions
- loading, empty, fallback, and error states
- tests for read-only services and fallback behavior
- README and documentation updates
- normal app checks

Not allowed without Nick's next approval:

- production Supabase connection or linked project changes
- live Supabase auth wiring in the student UI
- real browser sessions, cookies, sign-in flows, or production auth
- app write paths to Supabase
- enabling browser app writes or `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES` to
  perform real UI writes
- proof uploads or file storage writes
- public proof sharing or publishing
- real users or real role assignments
- real HubSpot writes
- real Luma writes
- real n8n workflows
- warehouse or Power BI exports
- email, SMS, or AI writes
- complex data-access frameworks
- all-campaign buildout
- native iOS or Android apps
