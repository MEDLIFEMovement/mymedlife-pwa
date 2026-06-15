# Supabase Local Development

Goal 5 adds a local-only Supabase foundation for myMEDLIFE.

This does not connect the app to production Supabase. It does not create real
users, enable live auth in the UI, or trigger HubSpot, Luma, n8n, warehouse,
Power BI, email, SMS, or AI writes.

## What Was Added

- `supabase/config.toml`: standard local Supabase project config.
- `supabase/migrations/20260615110000_initial_supabase_foundation.sql`: first
  local schema, role helpers, RLS policies, grants, and safety triggers.
- `supabase/seed.sql`: fake local users, chapters, memberships, staff roles,
  Rush Month records, proof/testimonial records, and disabled/mock outbox rows.
- `supabase/tests/database/rls_goal_5.test.sql`: pgTAP tests for the first RLS
  permission model.

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

## Known Codex Environment Limitation

This Codex environment did not have Docker installed, so the SQL files and tests
were added but the Supabase local stack could not be started here. A developer
with Docker can run the commands above to execute the migration, seed data, and
pgTAP RLS tests. GitHub CI is also configured to run the Supabase reset/test
path on a Docker-capable Ubuntu runner.
