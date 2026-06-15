# Supabase Local Development

Goals 5, 7, and 8 add the local-only Supabase foundation for myMEDLIFE.

This does not connect the app to production Supabase. It does not create real
users, enable live auth in the UI, add app write paths, or trigger HubSpot,
Luma, n8n, warehouse, Power BI, email, SMS, or AI writes.

## What Was Added

- `supabase/config.toml`: standard local Supabase project config.
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`: first
  local schema, role helpers, RLS policies, grants, and safety triggers.
- `supabase/migrations/20260615130000_goal_7_campaign_operating_model.sql`:
  local campaign operating model refinements for templates, readiness, campaign
  lanes, risk flags, closeouts, and assignment operating fields.
- `supabase/seed.sql`: fake local users, chapters, memberships, staff roles,
  Rush Month records, proof/testimonial records, disabled/mock outbox rows, and
  fake Goal 7 operating-model records.
- `supabase/tests/database/rls_goal_5.test.sql`: pgTAP tests for the first RLS
  permission model.
- `supabase/tests/database/rls_goal_7.test.sql`: pgTAP tests for campaign
  template, readiness, lane ownership, risk, closeout, and assignment-field
  protection boundaries.
- `src/lib/supabase-readonly.ts`: server-only REST reader for local Supabase.
- `src/services/read-only-app-data.ts`: mock-safe read model used by app pages.
- `.env.example`: local-only read configuration template.

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
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key from supabase start>
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
- `http://localhost:3000/coach`

Each route shows a small data-source notice. If the local Supabase URL or key is
missing, unsafe, or unavailable, the app falls back to mock data.

Goal 8 intentionally uses a server-only read path. It does not add browser auth,
student sign-in, role switching, or app writes.

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

## Known Codex Environment Limitation

This Codex environment did not have Docker installed, so the SQL files and tests
were added but the Supabase local stack could not be started here. A developer
with Docker can run the commands above to execute the migration, seed data, and
pgTAP RLS tests. GitHub CI is also configured to run the Supabase reset/test
path on a Docker-capable Ubuntu runner.
