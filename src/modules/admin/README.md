# Admin Module

## What This Owns
- Backend route family, review packets, launch gates, secure DS tools, and admin navigation posture.

## What This Does Not Own
- Staff command-center product workflows or member/leader experiences.

## Routes
- `/admin/*`

## Components And Services
- Admin app shell, backend lane nav, restricted states, review packets, and admin read models.

## Data Models
- Admin panel, write packet, audit posture, system health, and launch gate state.

## Flags
- `ds_admin_controls`, `feature-flags`, `theme_design_system`, and integration provider flags.

## Permissions
- General staff may access approved review surfaces. DS/Super Admin own sensitive controls.

## Integrations
- Integration consoles and outbox surfaces live under admin but provider behavior is owned by integration modules.

## Tests
- `tests/admin-page.test.tsx`
- `tests/admin-backend-review-pages.test.tsx`
- `tests/feature-flags-theme-pages.test.tsx`

## Safe Modification
- Keep backend tooling in `/admin/*`; do not overload staff query views with DS controls.

## TODOs
- Move admin-specific services and route helpers into this module.
