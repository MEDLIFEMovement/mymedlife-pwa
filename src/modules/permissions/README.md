# Permissions Module

## What This Owns
- Canonical role/scope interpretation, route visibility, permission registry, and cross-workspace access checks.

## What This Does Not Own
- Login UI, Supabase policy migrations, or feature-specific business decisions.

## Routes
- `/admin/permissions`
- All guarded workspace routes consume permission decisions.

## Components And Services
- Existing implementation lives in `src/services/role-visibility.ts`, canonical role helpers, and permission workspace services.

## Data Models
- Canonical role, scope, actor surface family, navigation visibility, and route access decision.

## Flags
- `ds_admin_controls` and module flags that expose or hide controls.

## Permissions
- Server-side guards are required for every workspace boundary.

## Integrations
- RLS/security evidence stays separate from UI permission checks.

## Tests
- `tests/canonical-role-scope.test.ts`
- `tests/role-visibility.test.ts`
- `tests/admin-permissions-workspace.test.ts`

## Safe Modification
- Update service-level permission tests before changing route visibility.

## TODOs
- Move role/permission services into this module.
