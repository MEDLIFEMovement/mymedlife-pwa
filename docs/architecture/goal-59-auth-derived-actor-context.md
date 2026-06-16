# Goal 59: Auth-Derived Actor Context

Goal 59 connects the local Supabase Auth session from Goal 58 to the app's
role-aware actor context.

## What This Adds

- `getLocalActorContext()` now checks for a signed-in local Supabase Auth user.
- When a local auth session exists, the app uses that user's email to derive
  member, leader, coach, admin, DS admin, or super admin context.
- When auth is disabled, signed out, or unavailable, the app keeps the existing
  `MYMEDLIFE_LOCAL_ACTOR_EMAIL` debug fallback.
- The local actor notice now shows whether identity came from the auth session
  or the debug actor email.
- The local role switcher explains that the auth session controls role context
  while signed in.
- Tests cover auth-session precedence and fallback behavior.

## Safety Boundary

This goal does not enable:

- production Supabase Auth
- production users
- browser app writes
- proof uploads
- public proof sharing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The app still uses local-only Supabase Auth and mock/local read paths. Browser
write gates remain blocked.

## Why This Matters

The first browser write cannot safely use `MYMEDLIFE_LOCAL_ACTOR_EMAIL` as
identity. Goal 59 moves the app toward server-derived identity by letting every
route that already calls `getLocalActorContext()` prefer the signed-in local
Supabase user.

## Next Step

Goal 60 should use this auth-derived actor context to re-review the first
browser write candidate, `action_started`, and add a server-action readiness
layer that still blocks writes unless the local Supabase session, RLS function,
and explicit write approval are all present.
