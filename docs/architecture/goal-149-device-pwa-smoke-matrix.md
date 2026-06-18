# Goal 149: Device and PWA Smoke Matrix

Goal 149 turns the remaining real-device/PWA launch risk into a concrete local
review matrix on `/admin/design-qa`.

## What changed

- `getDesignQaReadiness(actor)` now returns seven device/PWA smoke checks.
- `DesignQaReadinessPanel` renders each device/PWA check with route, reviewer
  actor email, browser/device, scenario, pass signal, and still-blocked launch
  boundary.
- `/admin/design-qa` now shows the device/PWA check count alongside Figma,
  mobile, accessibility, zero-write, and launch-blocker posture.
- MVP progress, coverage, release readiness, README, Supabase local notes, and
  the local MVP review guide now reference the Goal 149 device/PWA matrix.

## Device and PWA checks

- iPhone Safari on `/rush-month`
- Android Chrome on `/rush-month/actions`
- Desktop Chrome on `/admin`
- iPhone installed PWA on `/offline`
- Android installed PWA on `/offline`
- iPad Safari on `/rush-month/dashboard`
- Staging Safari, Chrome, and Edge on `/admin/design-qa`

## Pass signal

Reviewers should confirm responsive layout, tap targets, installed-PWA shell
behavior, offline recovery, no stale private data, no offline-write claims,
desktop admin readability, tablet leader readability, and staging
cross-browser rendering before pilot approval.

## Still blocked

This is a local review aid only. It does not approve production auth, browser
writes, proof uploads, public proof publishing, external sends, real student
pilots, or student invitations.

## Review URL

```text
http://localhost:3000/admin/design-qa
```
