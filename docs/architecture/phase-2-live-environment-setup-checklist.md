# MED-472 Phase 2 Live Environment Setup Checklist

Date: 2026-06-19

## Goal

Define the local, preview, staging, and production setup plan for Supabase and
Vercel without creating real hosted environments or committing credentials.

## Named Environments

- Local app: `http://localhost:3000`
- Local alternate host used in review and callbacks: `http://127.0.0.1:3000`
- Vercel preview: branch and commit preview URLs
- Staging: exact domain still needs owner confirmation
- Production: `https://www.mymedlife.org`

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

- exact URL still needs owner confirmation
- planned callback shape: `https://staging.mymedlife.org/auth/callback`

Production:

- `https://www.mymedlife.org/auth/callback`
- exact production Site URL only

## Backup, Monitoring, And Rollback Expectations

- Name who checks hosted Supabase backups before pilot invitations.
- Name who watches staging and production health during the pilot.
- Agree whether rollback uses Vercel instant rollback, preview promotion, or a
  rebuild-to-production flow.
- Keep the rollback owner human, not tool-driven.

## Blocked Live Actions

Do not do the following from this issue alone:

- create real hosted Supabase projects
- add staging or production keys to source control
- point the live domain at an unapproved deployment
- promote preview to production before the security gate is satisfied
