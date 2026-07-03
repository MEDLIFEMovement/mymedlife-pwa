# MED-474 Phase 2 RLS And Security Release Gate

Date: 2026-06-19

## Goal

Convert the current local Supabase planning and RLS tests into a concrete
release gate for staging and the first pilot.

## Gate Requirements

- RLS remains enabled on every app table exposed to app users.
- Direct table writes are denied for guarded flows.
- Approved function or RPC writes succeed only for the correct role and chapter
  scope.
- Audit rows persist for meaningful writes.
- Role and chapter isolation is proven.
- Storage policies are approved before proof uploads are enabled.
- Service keys remain server-only.
- CI evidence is attached before each write promotion.

## Current Local Evidence

- `docs/architecture/supabase-schema-auth-rls-plan.md`
- `docs/testing/rls-test-plan.md`
- `supabase/tests/database/rls_goal_5.test.sql`
- `supabase/tests/database/rls_goal_115.test.sql`
- `/admin/database-security`

## Hosted Review Items

- confirm which schemas are exposed through the Data API
- confirm the hosted staging project exposes `app` alongside `public` and
  `graphql_public` before any signed-in browser or server read is trusted
- confirm whether any `public` tables need explicit `GRANT` statements
- confirm hosted RLS coverage for member, leader, coach, admin, DS Admin, and
  Super Admin scopes
- confirm storage policy posture before MED-480
- confirm service-key handling and rotation owner

## Supabase 2026 Public-Schema Change

Supabase now expects explicit grants for new tables in `public` before those
tables are reachable through the Data API. If the app ever exposes `public`
tables, grants, RLS, and policies need to be reviewed as one unit.

## June 20 Staging Proof

- Hosted staging auth on `https://staging.mymedlife.org` was verified against
  the approved staging Supabase project.
- Signed-in browser reads initially failed because PostgREST only exposed
  `public` and `graphql_public`.
- Staging reads recovered after `app` was added to `pgrst.db_schemas` and the
  PostgREST schema cache was reloaded.
- After that fix, signed-in staging requests for `profiles`, `memberships`,
  `campaigns`, `assignments`, and related review tables returned `200` in the
  Supabase API logs instead of `406`.

## Blocked Live Actions

Do not do the following from this issue alone:

- run live migrations against hosted Supabase
- enable hosted proof storage
- allow production browser writes
- trust a hosted environment before DS/security sign-off
