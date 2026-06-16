# Goal 46: Route Smoke Manifest

## Purpose

Goal 46 adds a route-level smoke-test manifest to `/admin`.

The manifest tells a human reviewer:

- which MVP routes to open
- which local actor roles to test
- what should appear
- what safety boundary should remain true

## Covered Routes

- `/`
- `/chapter`
- `/rush-month`
- `/rush-month/dashboard`
- `/rush-month/actions`
- `/rush-month/loop`
- `/proof-library`
- `/rush-month/review`
- `/coach`
- `/admin`

## Safety Boundary

The manifest is for manual QA only. It does not:

- run browser tests
- approve release
- enable live auth
- enable browser writes
- enable uploads
- enable public proof sharing
- enable external integrations

All manifest counts keep browser writes and external sends at `0`.

## Implementation Notes

- `src/services/route-smoke-manifest.ts` owns route rows, role variants,
  expected results, and safety assertions.
- `src/components/route-smoke-manifest-panel.tsx` renders the admin panel.
- `/admin` mounts the panel after the MVP coverage checklist.
- `tests/route-smoke-manifest.test.ts` covers admin, DS admin, super admin,
  route coverage, safety assertions, and hidden chapter/coach roles.
