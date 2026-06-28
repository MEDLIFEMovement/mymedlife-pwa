# Auth Module

## What This Owns
- Authentication mode selection, local reviewer identity, role-derived actor context, and post-login routing.
- Existing implementation lives mainly in `src/services/local-actor-context.ts`, `src/services/supabase-auth-config.ts`, `src/services/auth-session.ts`, and login routes.

## What This Does Not Own
- Workspace-specific navigation or UI shell layout.
- Supabase project provisioning, production auth settings, or secret management.

## Routes
- `/login`
- root and workspace redirects that depend on authenticated actor context.

## Components And Services
- Actor context services resolve role, scope, traveler state, and landing surface.
- Login UI and server actions stay route-owned until a later file move.

## Data Models
- `LocalActorContext`, auth session status, actor audience, canonical roles, and scopes.

## Flags
- `ds_admin_controls` protects backend auth/admin controls.

## Permissions
- Role routing must be enforced server-side. UI hiding is not a security boundary.

## Integrations
- Supabase Auth is the future/live auth source. Local mock mode remains review-safe.

## Tests
- `tests/login-page.test.tsx`
- `tests/login-actions.test.ts`
- `tests/auth-session.test.ts`
- `tests/landing-route.test.ts`

## Safe Modification
- Change role routing in services first, then update route tests.
- Do not add new auth providers or production settings without explicit approval.

## TODOs
- Move auth-specific services into this module once the launch branch is calmer.
