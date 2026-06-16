# Supabase Local Development

Goals 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, and 16 add the local-only Supabase
foundation for myMEDLIFE. Goal 17 adds proof/video storage planning without
creating storage buckets or upload paths.

This does not connect the app to production Supabase. It does not create real
users, enable live auth in the UI, add browser write controls, or trigger
HubSpot, Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

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
create buckets, upload files, publish proof, or send external automation.

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

## Known Codex Environment Limitation

This Codex environment did not have Docker installed, so the SQL files and tests
were added but the Supabase local stack could not be started here. A developer
with Docker can run the commands above to execute the migration, seed data, and
pgTAP RLS tests. GitHub CI is also configured to run the Supabase reset/test
path on a Docker-capable Ubuntu runner.
