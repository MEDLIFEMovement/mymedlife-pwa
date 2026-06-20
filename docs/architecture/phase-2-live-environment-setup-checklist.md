# MED-472 Phase 2 Live Environment Setup Checklist

Date: 2026-06-20

## Goal

Define and track the local, preview, staging, and production setup plan for
Supabase and Vercel without committing credentials.

## Selected Topology

Environment path `B` is the selected Phase 2 topology.

Plain English:

- local stays for development only
- staging is where auth, RLS, and the first approved writes get rehearsed
- production is the real public app
- Vercel preview can exist for branch review, but it points at staging and never
  at production

Technical summary:

- dedicated local Docker Supabase
- dedicated staging Supabase + Vercel staging environment
- dedicated production Supabase + Vercel production environment
- Supabase redirect allow-list includes `http://localhost:3000/**`,
  `http://127.0.0.1:3000/**`, and
  `https://*-<team-or-account-slug>.vercel.app/**`
- production keeps an exact site URL and exact callback URL only

## Named Environments

- Local app: `http://localhost:3000`
- Local alternate host used in review and callbacks: `http://127.0.0.1:3000`
- Vercel preview: branch and commit preview URLs
- Staging: `https://staging.mymedlife.org`
- Production: `https://www.mymedlife.org`

## Current Hosted Supabase State

Connector and CLI verification on 2026-06-20 found:

- staging hosted project: `myMEDLIFE`
- staging project ref: `rceupryepjgkdeqgxzrc`
- staging region: `us-east-1`
- staging status: `ACTIVE_HEALTHY`
- staging created at: `2026-06-17`
- repo migrations applied: 11
- latest migration: `20260620093821_fix_function_search_path_warnings`
- app schema tables: 27
- app tables with RLS enabled: 27
- private storage bucket: `proof-submissions-private`
- edge functions: 0
- Supabase security advisor: no lints after MED-492
- final migration dry run: remote database is up to date
- production hosted project: `myMEDLIFE Production`
- production project ref: `fnlhontvvprwgooevzdl`
- production region: `us-east-1`
- production status: `ACTIVE_HEALTHY`
- production created at: `2026-06-20`
- production migrations: 0
- production security advisor: no lints
- production app schema/data/auth/storage/integrations: not applied

What is still missing:

- Vercel staging attachment for `staging.mymedlife.org`
- preview, staging, and production environment variables outside source control
- approval for if/when Codex should apply the approved schema migrations to
  production, with rollback evidence
- named owners for hosted auth, RLS, first-write validation, backups,
  monitoring, and rollback evidence

## Supabase Ownership

- Kiomi / DS owns hosted Supabase project creation and key handling.
- Production keys remain human-owned and server-only.
- Codex can wire approved environment variables once the human owner provides
  them outside source control.

## Vercel Ownership

- Kiomi / DS owns staging and production environment-variable setup.
- Preview deployments can exist automatically on Vercel, but must not gain
  production secrets.
- Nick owns pilot go/no-go after evidence exists.

## Environment Variables To Name

Browser:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy compatibility if retained)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VERCEL_URL` (preview only)

Server only:

- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (legacy compatibility if retained)

## Callback And Redirect URLs

Local:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`
- allow-list patterns: `http://localhost:3000/**` and `http://127.0.0.1:3000/**`

Preview:

- pattern: `https://*-<team-or-account-slug>.vercel.app/**`
- app callback shape: `https://<branch>.<project>.vercel.app/auth/callback`

Staging:

- `https://staging.mymedlife.org/auth/callback`

Production:

- `https://www.mymedlife.org/auth/callback`
- exact production Site URL only

## Backup, Monitoring, And Rollback Expectations

- Name who checks hosted Supabase backups before pilot invitations.
- Name who watches staging and production health during the pilot.
- Agree whether rollback uses Vercel instant rollback, preview promotion, or a
  rebuild-to-production flow.
- Keep the rollback owner human, not tool-driven.

## Owner Follow-Up

Kiomi / DS:

- review the empty production Supabase project and approve whether/when Codex
  should apply the already-approved schema migrations to production
- attach `staging.mymedlife.org` to the Vercel staging environment
- load preview, staging, and production variables outside source control
- name owners for hosted auth, RLS, first-write validation, backups,
  monitoring, and rollback evidence

Codex:

- keep the repo, Linear, GitHub, and staging evidence current
- wire approved variable names, callback URLs, and route behavior once human
  owners provide them safely
- run hosted validation only after owners approve the exact validation scope

Nick:

- approve pilot timing and final go/no-go after staging proof exists

## Blocked Live Actions

Do not do the following from this issue alone:

- apply production schema migrations or enable production writes without
  DS/security approval
- add staging or production keys to source control
- point the live domain at an unapproved deployment
- promote preview to production before the security gate is satisfied
