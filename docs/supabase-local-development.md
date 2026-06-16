# Supabase Local Development

Goals 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, and 16 add the local-only Supabase
foundation for myMEDLIFE. Goal 17 adds proof/video storage planning without
creating storage buckets or upload paths. Goal 18 adds a local-only audited
chapter-leader assignment creation function. Goal 19 adds auth/onboarding
planning without enabling live auth or production users. Goal 20 adds the
route-by-route live-data connection plan without enabling production data.
Goals 21 and 22 expand read-only campaign/dashboard surfaces. Goals 23 through
27 add visible browser-write activation gates while keeping enabled controls
off. Goal 27 also adds the local-only audited coach decision function. Goal 58
adds localhost-only Supabase Auth sign-in for fake local seed users. Goal 59
maps that local auth session into role-aware app context. Goal 60 adds the first
local-only browser-to-Supabase write path for `action_started`. Goal 61 adds a
stable local seed assignment plus readback proof for that first write. Goal 62
adds the second local-only browser-to-Supabase write path for
`evidence_submitted` proof/testimonial metadata. Goal 63 adds the third
local-only browser-to-Supabase write path for `hq_sharing_decision`. Goal 64
adds the fourth local-only browser-to-Supabase write path for `action_assigned`
assignment creation. Goal 65 adds the fifth local-only browser-to-Supabase
write path for `coach_decision_logged`.

This does not connect the app to production Supabase. It does not create real
users, enable production auth in the UI, enable browser writes beyond the local
action-start, assignment creation, proof metadata, HQ proof decision, and coach
decision slices, or trigger HubSpot, Luma, n8n, warehouse, Power BI, email, SMS,
or AI writes.

## What Was Added

- `supabase/config.toml`: standard local Supabase project config.
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`: first
  local schema, role helpers, RLS policies, grants, and safety triggers.
- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`:
  local campaign operating model refinements for templates, readiness, campaign
  lanes, risk flags, closeouts, and assignment operating fields.
- `supabase/migrations/20260616090000_goal_14_action_start_write.sql`: first
  local action-start write function plus direct-start bypass protection.
- `supabase/migrations/20260616093000_goal_15_proof_submission_write.sql`:
  first local proof/testimonial metadata write function plus direct evidence
  insert bypass protection.
- `supabase/migrations/20260616103000_goal_16_hq_proof_sharing_decision.sql`:
  first local HQ proof-sharing decision write function plus direct approval
  insert bypass protection.
- `supabase/migrations/20260616110000_goal_18_leader_assignment_create.sql`:
  first local chapter-leader assignment creation function plus direct
  assignment insert bypass protection.
- `supabase/migrations/20260616120000_goal_27_coach_decision.sql`: first local
  coach advance / hold / intervene function plus direct readiness validation
  bypass protection.
- `supabase/seed.sql`: fake local users, chapters, memberships, staff roles,
  Rush Month records, proof/testimonial records, disabled/mock outbox rows, and
  fake Goal 7 operating-model records.
- `supabase/tests/database/rls_goal_5.test.sql`: pgTAP tests for the first RLS
  permission model.
- `supabase/tests/database/rls_goal_7.test.sql`: pgTAP tests for campaign
  template, readiness, lane ownership, risk, closeout, and assignment-field
  protection boundaries.
- `supabase/tests/database/rls_goal_14.test.sql`: pgTAP tests for the first
  local `action_started` database write path.
- `supabase/tests/database/rls_goal_15.test.sql`: pgTAP tests for the first
  local `evidence_submitted` proof/testimonial metadata write path.
- `supabase/tests/database/rls_goal_16.test.sql`: pgTAP tests for the first
  local `hq_sharing_decision_logged` proof/testimonial sharing decision path.
- `supabase/tests/database/rls_goal_18.test.sql`: pgTAP tests for the first
  local `action_assigned` assignment creation path.
- `supabase/tests/database/rls_goal_27.test.sql`: pgTAP tests for the first
  local `coach_decision_logged` readiness decision path.
- `src/lib/supabase-readonly.ts`: server-only REST reader for local Supabase.
- `src/services/read-only-app-data.ts`: mock-safe read model used by app pages.
- `.env.example`: local-only read configuration template.
- `src/services/local-actor-context.ts`: local-only actor context reader for
  fake seed users, memberships, staff roles, and coach assignments.
- `src/components/local-actor-notice.tsx`: visible local actor context display
  used by read-only pages.
- `src/services/role-visibility.ts`: read-only role visibility helpers for the
  local app shell.
- `src/components/local-role-switcher.tsx`: local debug panel listing fake
  actor emails for `MYMEDLIFE_LOCAL_ACTOR_EMAIL`.
- `src/components/restricted-state.tsx`: plain-English restricted-state UI for
  roles that should not read a page or panel.
- `src/services/local-action-contracts.ts`: local-only action/proof/HQ sharing
  contract previews for future write implementation.
- `tests/local-action-contracts.test.ts`: unit tests proving the local contract
  boundaries before any app writes are introduced.
- `src/services/write-readiness.ts`: disabled write-readiness airlock for future
  action/proof/HQ decision persistence.
- `src/components/write-readiness-notice.tsx`: visible no-write notice listing
  future tables that would be touched after approval.
- `tests/write-readiness.test.ts`: unit tests proving writes remain disabled,
  even when the local write env var is set.
- `docs/architecture/goal-13-local-write-implementation-plan.md`: reviewable
  local write plan for the first future write operations.
- `src/services/write-plan-matrix.ts`: typed plan matrix for future write
  operations, role boundaries, table targets, and required tests.
- `tests/write-plan-matrix.test.ts`: unit tests keeping the write plan aligned
  with the disabled write-readiness airlock.
- `docs/architecture/goal-14-action-start-write.md`: local action-start write
  architecture note.
- `docs/architecture/goal-15-proof-submission-write.md`: local
  proof/testimonial metadata write architecture note.
- `docs/architecture/goal-16-hq-proof-sharing-decision.md`: local HQ
  proof/testimonial sharing decision architecture note.
- `docs/architecture/goal-17-proof-video-storage-plan.md`: proof/video storage
  architecture plan with uploads still disabled.
- `docs/architecture/goal-18-leader-assignment-create.md`: local
  chapter-leader assignment creation architecture note.
- `docs/architecture/goal-19-auth-onboarding-plan.md`: future auth/onboarding
  architecture note with live auth still disabled.
- `docs/architecture/goal-20-live-data-connection-plan.md`: future
  route-by-route live-data connection plan with production data still disabled.
- `docs/architecture/goal-21-campaign-operating-shells.md`: read-only campaign
  shells and action committee/proof-library posture.
- `docs/architecture/goal-22-rush-month-dashboard.md`: role-aware Rush Month
  dashboard with browser writes still disabled.
- `docs/architecture/goal-23-action-start-browser-write-gate.md`: visible
  action-start browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-24-leader-assignment-write-gate.md`: visible
  assignment-create browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-25-proof-submission-browser-write-gate.md`: visible
  proof-submission browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-26-hq-proof-sharing-browser-write-gate.md`: visible
  HQ proof-sharing decision browser write activation gate with enabled controls
  still disabled.
- `docs/architecture/goal-27-coach-decision-browser-write-gate.md`: visible
  coach decision browser write activation gate with enabled controls still
  disabled.
- `docs/architecture/goal-58-local-auth-sign-in.md`: local Supabase Auth
  sign-in architecture note with production auth still disabled.
- `docs/architecture/goal-59-auth-derived-actor-context.md`: local Auth session
  to app actor context architecture note with writes still disabled.
- `docs/architecture/goal-60-action-start-server-action.md`: local
  action-start server action architecture note.
- `docs/architecture/goal-61-action-start-readback.md`: local action-start
  readback proof note for the stable fake seed assignment.
- `docs/architecture/goal-62-proof-submission-server-action.md`: local
  proof/testimonial metadata server action architecture note.
- `docs/architecture/goal-63-hq-proof-decision-server-action.md`: local HQ
  proof/testimonial decision server action architecture note.
- `docs/architecture/goal-64-leader-assignment-server-action.md`: local
  chapter-leader assignment creation server action architecture note.
- `src/services/assignment-create-write.ts`: local assignment creation write
  readiness, RPC result mapping, and readback state.
- `src/components/leader-assignment-server-action-panel.tsx`: local-only
  assignment creation form and readback panel for the actions page.
- `docs/architecture/goal-65-coach-decision-server-action.md`: local coach
  decision server action architecture note.
- `src/services/coach-decision-write.ts`: local coach decision write readiness,
  RPC result mapping, and readback state.
- `src/components/coach-decision-server-action-panel.tsx`: local-only coach
  decision form and readback panel for the coach page.
- `src/services/auth-onboarding-plan.ts`: disabled auth/onboarding plan for
  future sign-in, join requests, membership approvals, and role assignments.
- `tests/auth-onboarding-plan.test.ts`: unit tests proving live auth and
  production users remain disabled.
- `src/services/local-actor-context.ts`: actor context service that now prefers
  the signed-in local auth user and falls back to `MYMEDLIFE_LOCAL_ACTOR_EMAIL`.
- `src/services/action-start-write.ts`: local action-start write readiness and
  RPC result mapping.
- `src/services/proof-submission-write.ts`: local proof/testimonial metadata
  write readiness, RPC result mapping, and readback state.
- `src/components/proof-submission-server-action-panel.tsx`: local-only proof
  metadata form and readback panel for action detail pages.
- `tests/proof-submission-write.test.ts`: unit tests proving proof metadata
  writes stay gated and map local RPC results safely.
- `src/services/hq-proof-decision-write.ts`: local HQ proof decision write
  readiness, RPC result mapping, and readback state.
- `src/components/hq-proof-decision-server-action-panel.tsx`: local-only HQ
  decision form and readback panel for the review route.
- `tests/hq-proof-decision-write.test.ts`: unit tests proving HQ decisions stay
  gated and map local RPC results safely.
- `src/services/live-data-connection-plan.ts`: disabled live-data migration
  plan for route order and connection mode.
- `tests/live-data-connection-plan.test.ts`: unit tests proving production
  Supabase, browser writes, and external writes remain disabled.
- `src/services/browser-write-activation.ts`: first action-start browser write
  gate that references the existing local function without enabling it.
- `src/components/browser-write-gate-notice.tsx`: visible reviewer-facing gate
  notice on action detail pages.
- `tests/browser-write-activation.test.ts`: unit tests proving the gate keeps
  enabled browser controls disabled until explicit approval.
- `src/services/proof-storage-readiness.ts`: disabled upload readiness plan for
  future proof files.
- `tests/proof-storage-readiness.test.ts`: unit tests proving proof uploads and
  public publishing remain disabled.

## Requirements

Install or make available:

- Docker
- pnpm

The repo scripts use `pnpm dlx supabase@2.106.0` so contributors do not need a
global Supabase CLI install.

## Local Commands

Start Supabase:

```bash
pnpm supabase:start
```

Apply migrations and seed fake data:

```bash
pnpm supabase:reset
```

Run the RLS/security tests:

```bash
pnpm supabase:test
```

Run normal app checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Optional Read-Only App Connection

The app uses mock data by default. To test the first local Supabase read path:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```bash
MYMEDLIFE_DATA_SOURCE=supabase
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true
MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=false
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key from supabase start>
MYMEDLIFE_LOCAL_ACTOR_EMAIL=member.a@mymedlife.test
```

Then run:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm dev
```

Open these routes:

- `http://localhost:3000/chapter`
- `http://localhost:3000/rush-month`
- `http://localhost:3000/rush-month/actions`
- `http://localhost:3000/coach`
- `http://localhost:3000/admin`

Each route shows a small data-source notice and local actor context notice. If
the local Supabase URL or key is missing, unsafe, or unavailable, the app falls
back to mock data.

Goal 8 intentionally uses a server-only read path. Goal 9 adds local-only actor
switching by fake seed email. Goal 10 uses that actor to filter read-only
navigation, assignments, risks, admin panels, and integration/outbox visibility.
Goal 11 adds local-only action/proof/HQ sharing contract previews. This does
not add browser auth, student sign-in, sessions, cookies, production auth, app
writes, proof uploads, public sharing, or external automation. Goal 12 adds a
disabled write-readiness layer so future table targets are visible while code
still blocks writes. Goal 13 adds the first local write implementation plan and
test matrix. Goal 14 adds the first local Supabase database write function for
`action_started`, but it still does not add browser save controls or production
auth. Goal 15 adds the first local Supabase proof/testimonial metadata write
function for `evidence_submitted`, but it still does not add browser save
controls, file uploads, public proof sharing, or external sends. Goal 16 adds
the first local Supabase HQ proof-sharing decision write function for
`hq_sharing_decision_logged`, but it still does not add browser save controls,
public publishing, or external sends. Goal 17 documents the future proof/video
storage layer and adds disabled upload readiness tests, but it still does not
create buckets, upload files, publish proof, or send external automation. Goal
18 adds the first local Supabase assignment creation function for
`action_assigned`, but it still does not add browser save controls, production
auth, or external sends. Goal 19 defines the future auth/onboarding path, but
it still does not enable live auth, browser sessions, production users,
membership approvals, role assignments, or external sends. Goal 20 defines the
future route-by-route live-data migration order, but it still does not enable
production Supabase, browser writes, or external sends. Goal 27 adds the first
local Supabase coach decision function for `coach_decision_logged` and a visible
browser gate on `/coach`, but it still does not enable browser saves, live auth,
n8n escalation packets, or external sends.

## GitHub CI

The PR workflow at `.github/workflows/goal-5-ci.yml` runs two jobs:

- app checks: lint, typecheck, unit tests, and build
- Supabase RLS tests: starts local Supabase on an Ubuntu runner, resets the
  database with fake seed data, and runs `supabase test db`

## Fake Users

The seed file creates fake local-only users:

- `member.a@mymedlife.test`: General Member in Northview MEDLIFE.
- `leader.a@mymedlife.test`: President/VP and E-Board Member in Northview.
- `coach@mymedlife.test`: Coach assigned to Northview only.
- `admin@mymedlife.test`: MEDLIFE Admin.
- `ds.admin@mymedlife.test`: DS Admin for integration/outbox controls.
- `super.admin@mymedlife.test`: Super Admin.
- `member.b@mymedlife.test`: General Member in Lakeside MEDLIFE.
- `unrelated@mymedlife.test`: Requested but unapproved member.

All seed data is fake and local-only.

## Goal 61 Action-Start Readback Test

After running the local Supabase reset, use this fake Northview assignment to
test the first localhost-only action-start browser write:

```text
50000000-0000-4000-8000-000000000003
```

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_ACTION_START_WRITE=true`.
6. Sign in at `/login` as `member.a@mymedlife.test` with password `password`.
7. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
8. Click `Start this action`.
9. Confirm the refreshed page shows the assignment status as `in_progress` and
   the local readback success message.

This test still does not enable production auth, external sends, proof uploads,
public proof sharing, or any write path except the local action-start slice.

## Goal 62 Proof/Testimonial Metadata Test

Goal 62 uses the same fake Northview assignment after it has been started. The
assignment must be `in_progress` or `changes_requested` before proof metadata
can be saved.

Recommended local test path:

1. Complete the Goal 61 action-start test above for
   `50000000-0000-4000-8000-000000000003`.
2. Keep `MYMEDLIFE_DATA_SOURCE=supabase`.
3. Keep `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
4. Keep `MYMEDLIFE_AUTH_MODE=local_supabase`.
5. Keep `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
6. Set `MYMEDLIFE_ENABLE_PROOF_SUBMISSION_WRITE=true`.
7. Keep `MYMEDLIFE_ALLOW_PROOF_UPLOADS=false`.
8. Stay signed in as `member.a@mymedlife.test`.
9. Open `/rush-month/actions/50000000-0000-4000-8000-000000000003`.
10. Submit the local proof/testimonial metadata form.
11. Confirm the refreshed page shows the assignment status as `submitted` and
    the local proof readback success message.

Expected database behavior:

- `app.submit_assignment_proof_metadata(...)` writes the evidence metadata row.
- The assignment status changes to `submitted`.
- An internal `evidence_submitted` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not upload files, publish proof, enable production auth,
or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## Goal 63 HQ Proof/Testimonial Decision Test

After running the local Supabase reset, use this fake Northview proof item to
test the first localhost-only HQ proof decision browser write:

```text
60000000-0000-4000-8000-000000000001
```

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_HQ_PROOF_DECISION_WRITE=true`.
6. Sign in at `/login` as `admin@mymedlife.test` with password `password`.
7. Open `/rush-month/review`.
8. Confirm the proof queue reads the local evidence item.
9. Submit the local HQ proof decision form.
10. Confirm the refreshed page shows the proof status as `approved` or
    `changes_requested`, depending on the selected decision, and shows the local
    HQ decision readback message.

Expected database behavior:

- `app.record_hq_proof_sharing_decision(...)` updates the evidence review and
  sharing posture.
- An `approvals` row is recorded.
- An internal `hq_sharing_decision_logged` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not upload files, publish proof, enable production auth,
or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## Goal 64 Leader Assignment Creation Test

After running the local Supabase reset, use the fake Northview Rush Month
campaign through `/rush-month/actions`.

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE=true`.
6. Sign in at `/login` as `leader.a@mymedlife.test` with password `password`.
7. Open `/rush-month/actions`.
8. Confirm the local leader assignment creation panel is enabled.
9. Submit the local assignment form.
10. Confirm the refreshed page shows the assignment-created result and local
    readback when the new assignment is visible.

Expected database behavior:

- `app.create_chapter_assignment(...)` creates the assignment row.
- An internal `action_assigned` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not send reminders, enable production auth, upload files,
publish proof, or send HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or
AI writes.

## Goal 65 Coach Decision Test

After running the local Supabase reset, use the fake Northview Rush Month coach
page.

Recommended local test path:

1. Set `MYMEDLIFE_DATA_SOURCE=supabase`.
2. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_READS=true`.
3. Set `MYMEDLIFE_AUTH_MODE=local_supabase`.
4. Set `MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES=true`.
5. Set `MYMEDLIFE_ENABLE_COACH_DECISION_WRITE=true`.
6. Sign in at `/login` as `coach@mymedlife.test` with password `password`.
7. Open `/coach`.
8. Confirm the local coach decision panel is enabled.
9. Submit the local coach decision form.
10. Confirm the refreshed page shows the recorded decision result and local
    readiness readback.

Expected database behavior:

- `app.log_coach_decision(...)` updates phase readiness.
- A `phase_readiness_reviews` row is recorded.
- An internal `coach_decision_logged` event is recorded.
- An integration event is recorded for future automation pickup.
- A disabled automation outbox row is recorded.
- An audit log row is recorded.

This test still does not send n8n escalation packets, enable production auth,
upload files, publish proof, or send HubSpot, Luma, warehouse, Power BI, email,
SMS, or AI writes.

`MYMEDLIFE_LOCAL_ACTOR_EMAIL` also works when the app is using mock fallback
data, so developers can preview all role views without Docker. Restart the local
development server after changing the env var.

## RLS Model In Plain English

- General members can see their own profile, approved chapter work, their own
  proof/testimonials, and their own points.
- Chapter leaders can manage work inside their own chapter, but cannot cross
  into another chapter.
- Coaches can read only chapters in their active portfolio assignment.
- E-Board and Action Committee leaders do not approve proof for broad sharing.
- MEDLIFE Admin/HQ staff can make proof sharing decisions.
- DS Admin and Super Admin can manage integration/outbox status.
- External sends remain disabled or mocked until Nick explicitly approves live
  integrations.
- HQ/Admin can manage global campaign templates; normal students and DS Admins
  cannot.
- Chapter leaders can assign campaign lanes inside their own chapter.
- Coaches can validate readiness and closeouts only for chapters in their
  active portfolio.
- Coach-private risk flags stay hidden from members and chapter leaders.
- Action-start assignment status changes must use
  `app.start_assignment_action` so the assignment update, event row,
  integration event row, and audit log are written together.
- Admin and DS Admin cannot start routine student truth assignments.
- Proof/testimonial metadata submissions must use
  `app.submit_assignment_proof_metadata` so the assignment update, evidence
  metadata row, event row, integration event row, disabled outbox row, and audit
  log are written together.
- Coach, Admin, DS Admin, and Super Admin cannot use the normal proof
  submission path.
- HQ proof/testimonial sharing decisions must use
  `app.record_hq_proof_sharing_decision` so the evidence update, approval row,
  event row, integration event row, disabled outbox row, and audit log are
  written together.
- General Members, Chapter Leaders, Coaches, and DS Admin cannot record HQ
  proof-sharing decisions.
- Chapter-leader assignment creation must use `app.create_chapter_assignment`
  so the assignment row, event row, integration event row, disabled outbox row,
  and audit log are written together.
- General Members, Coaches, Admin, and DS Admin cannot create routine chapter
  assignments.
- Coach decisions must use `app.log_coach_decision` so the phase readiness
  update, readiness review row, event row, integration event row, disabled
  outbox row, and audit log are written together.
- General Members, Chapter Leaders, and DS Admin cannot log coach decisions.

## Known Codex Environment Limitation

This Codex environment did not have Docker installed, so the SQL files and tests
were added but the Supabase local stack could not be started here. A developer
with Docker can run the commands above to execute the migration, seed data, and
pgTAP RLS tests. GitHub CI is also configured to run the Supabase reset/test
path on a Docker-capable Ubuntu runner.
