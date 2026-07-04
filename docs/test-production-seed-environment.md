# myMEDLIFE Test Production Seed Environment

This packet creates a realistic but fully fictitious myMEDLIFE test environment for production-style review.

Core safety rule: every user-visible seeded object starts with `Test`, and every login email uses `test.*@example.com`.

## What It Creates

- 7 Test chapters
- 60+ fake users
- Staff, coach, DS Admin, and Super Admin accounts
- Presidents, vice presidents, secretaries, treasurers, committee chairs, committee members, and general members
- MEDLIFE committee structures
- Rush Month campaigns, phases, assignments, tasks, Luma-style events, evidence, approvals, points, KPI rows, activity rows, integration posture rows, disabled outbox rows, risk flags, readiness reviews, and audit logs

No real MEDLIFE names, real emails, API keys, external sends, uploads, or production integrations are included.

## Chapters

| Chapter | Scenario |
|---|---|
| Test Boston University | Highly active, complete leadership team, many committees, completed tasks, pending evidence, high leaderboard scores |
| Test Boston College | Excellent recruitment, large membership, moderate committee activity |
| Test Duke | Strong leadership, overdue tasks, coach reminders |
| Test McGill | Brand-new, small leadership team, few members, minimal activity |
| Test New York University | Outstanding event attendance and social engagement, weak task completion |
| Test UCLA | Strong Safe Homes and Moving Mountains committees with many completed tasks |
| Test University of Texas | Large chapter, mixed engagement, varied committee stages, good admin review examples |

## Commands

Build the seed packet locally:

```bash
pnpm test-production:build
```

Validate the seed packet:

```bash
pnpm test-production:check
```

This writes generated review files to `.codex-artifacts/test-production/`:

- `seed-test-production.sql`
- `cleanup-test-production.sql`
- `test-production-logins.md`
- `test-production-summary.json`

## Apply Locally

Seed local Supabase:

```bash
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --local
```

Remove all Test seed data from local Supabase:

```bash
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA pnpm test-production:cleanup -- --local
```

## Hosted/Staging/Production Use

Do not run the seed or cleanup commands against hosted staging or hosted production unless the launch owner explicitly approves that environment.

For a linked Supabase project:

```bash
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --linked
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA pnpm test-production:cleanup -- --linked
```

For a database URL stored in an environment variable:

```bash
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --db-url-env SUPABASE_DB_URL
MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA pnpm test-production:cleanup -- --db-url-env SUPABASE_DB_URL
```

The database URL must not be committed or pasted into docs, PRs, Linear, or chat.

## Default Password

All generated Test accounts use:

```text
TestMEDLIFE!2026
```

This password is for fictitious review accounts only. Rotate or remove these users before any real chapter rollout.

## Review Logins

After running `pnpm test-production:build`, open:

```text
.codex-artifacts/test-production/test-production-logins.md
```

That file lists every generated login, role, chapter, and the view it demonstrates.

Representative logins include:

| Role | Example login |
|---|---|
| General member | `test.bu.general.member.1@example.com` |
| Student leader | `test.bu.president.jamie@example.com` |
| Committee chair | `test.bu.safe-homes.chair@example.com` |
| Sales coach | `test.sales.coach@example.com` |
| Staff/Admin | `test.administrator@example.com` |
| DS Admin | `test.revops.systems.manager@example.com` |
| Super Admin | `test.super.admin@example.com` |

## Cleanup Scope

The cleanup SQL only targets:

- rows with visible names beginning with `Test`
- fake emails matching `test.%@example.com`
- generated seed-family payloads
- disabled test outbox/integration rows

The cleanup command is intentionally guarded with `MYMEDLIFE_TEST_PRODUCTION_CONFIRM=REMOVE_TEST_DATA`.

## Implementation Notes

- Seed SQL is deterministic and idempotent.
- IDs are generated from stable seed keys.
- Re-running the seed updates the same Test rows instead of creating duplicates.
- Outbox rows are `disabled`.
- Integration rows are mock-safe.
- The seed includes `auth.users` and `auth.identities` so password login can work after the SQL is applied.
- The current schema does not have separate persisted comments or notifications tables; those review states are represented through `app.events` activity rows.
