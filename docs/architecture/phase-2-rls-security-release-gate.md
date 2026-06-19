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
- confirm whether any `public` tables need explicit `GRANT` statements
- confirm hosted RLS coverage for member, leader, coach, admin, DS Admin, and
  Super Admin scopes
- confirm storage policy posture before MED-480
- confirm service-key handling and rotation owner

## Supabase 2026 Public-Schema Change

Supabase now expects explicit grants for new tables in `public` before those
tables are reachable through the Data API. If the app ever exposes `public`
tables, grants, RLS, and policies need to be reviewed as one unit.

## Blocked Live Actions

Do not do the following from this issue alone:

- run live migrations against hosted Supabase
- enable hosted proof storage
- allow production browser writes
- trust a hosted environment before DS/security sign-off
