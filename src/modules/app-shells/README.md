# App Shells Module

## What This Owns
- The distinct student, leader, staff, admin, and SLT Prep workspace shells.
- Existing implementation lives mainly in `src/components/*app-shell*`, shell wrappers, and workspace routes.

## What This Does Not Own
- Business rules for events, proof, points, permissions, or integrations.

## Routes
- `/app`
- `/leader`
- `/staff`
- `/admin`
- `/app/slt-prep` and `/slt-prep/*`

## Components And Services
- `StudentAppShell`, `LeaderAppShell`, `StaffAppShell`, `AdminAppShell`, and SLT shell/module wrappers.
- Route guards use actor context and visibility services.

## Data Models
- Navigation items, mobile navigation items, actor surface family, and landing surface.

## Flags
- Shell routes should stay readable even when feature modules fall back.

## Permissions
- Manual URL access must be blocked server-side by route family.

## Integrations
- None directly. Shells display integration posture from feature modules.

## Tests
- `tests/app-shell.test.tsx`
- `tests/shell-wrappers.test.tsx`
- `tests/owned-route-redirect.test.ts`

## Safe Modification
- Keep shell UI separate by role. Do not add one universal sidebar with hidden items.

## TODOs
- Move shell components into this module behind stable exports.
