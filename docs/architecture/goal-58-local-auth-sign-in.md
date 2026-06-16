# Goal 58: Local Supabase Auth Sign-In

Goal 58 adds the first local Supabase Auth sign-in layer for the myMEDLIFE MVP.

This is a step toward the final Rush Month MVP requirement that members,
leaders, coaches, admins, DS admins, and super admins can log in with real
server-derived identity.

## What This Adds

- `MYMEDLIFE_AUTH_MODE=local_supabase` config gate.
- Localhost-only Supabase Auth config.
- Server-side Supabase SSR client wrapper using cookies.
- `/login` route for fake local seed users.
- Server actions for local sign-in and sign-out.
- Session status panel that confirms whether a local Supabase Auth session is
  active.
- Tests for auth config, session handling, and redirect safety.

## Safety Boundary

This goal does not enable:

- production Supabase Auth
- production users
- browser app writes
- proof uploads
- public proof sharing
- HubSpot, Luma, n8n, warehouse, Power BI, SMS, email, or AI writes

The auth config refuses non-localhost Supabase URLs until production auth is
explicitly approved.

## Why This Comes Next

The previous write gates correctly block browser writes because local actor
strings are not trustworthy identity. Goal 58 begins replacing that weak point
with a real Supabase Auth session, while keeping all write paths disabled.

## Next Step

Goal 59 should map the signed-in local Supabase user to the role-aware app
context that currently comes from `MYMEDLIFE_LOCAL_ACTOR_EMAIL`. Once that works,
the team can re-review the first low-risk browser write: `action_started`.
