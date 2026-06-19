# Goal 147: Mobile Route Smoke Manifest

Goal 147 connects the Goal 146 mobile visual smoke plan to the existing admin
route smoke manifest.

## What changed

- `getMobileVisualSmokeChecks()` is exported from the design QA readiness
  service so route smoke coverage can reuse the same source of truth.
- `getRouteSmokeManifest(actor)` now adds optional mobile-review metadata to the
  eight Goal 146 routes.
- `RouteSmokeManifestPanel` shows each mobile route's reviewer actor email,
  `390px wide phone viewport`, target signal, pass signal, and still-blocked
  launch boundary.
- Route smoke tests now prove that exactly eight rows carry mobile-review
  metadata and that member, leader, and coach checks use the expected fake local
  actor emails.

## Mobile routes bridged into route smoke

- `/rush-month`
- `/rush-month/actions`
- `/rush-month/evidence`
- `/rush-month/dashboard`
- `/coach`
- `/admin/nick-review`
- `/offline`
- `/proof-library/upload`

## Still blocked

This bridge only makes local review easier. It does not approve production
auth, browser writes, proof uploads, public proof publishing, external sends,
real student pilots, or student invitations.

## Review URL

```text
http://localhost:3000/admin
```
