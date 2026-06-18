# Goal 148: Accessibility Smoke Plan

Goal 148 turns the design QA accessibility baseline into a concrete local review
packet for keyboard and screen-reader smoke checks.

## What changed

- `getDesignQaReadiness(actor)` now returns seven accessibility smoke checks.
- `DesignQaReadinessPanel` renders each accessibility check with route, reviewer
  actor email, interaction, target signal, pass signal, and still-blocked launch
  boundary.
- `/admin/design-qa` now shows the accessibility check count alongside the
  existing Figma, mobile, zero-write, and launch-blocker posture.
- MVP progress, coverage, release readiness, README, Supabase local notes, and
  the local MVP review guide now reference the Goal 148 accessibility plan.

## Accessibility smoke routes

- `/` as `member.a@mymedlife.test`
- `/rush-month/actions` as `member.a@mymedlife.test`
- `/proof-library/upload` as `admin@mymedlife.test`
- `/rush-month/dashboard` as `leader.a@mymedlife.test`
- `/coach` as `coach@mymedlife.test`
- `/offline` as `member.a@mymedlife.test`
- `/admin/design-qa` as `member.a@mymedlife.test`

## Pass signal

Reviewers should confirm keyboard focus order, visible focus, skip-link
behavior, labels, headings, restricted-state copy, disabled-control copy, and
non-color-only status cues before pilot approval.

## Still blocked

This is a local review aid only. It does not approve production auth, browser
writes, proof uploads, public proof publishing, external sends, real student
pilots, or student invitations.

## Review URL

```text
http://localhost:3000/admin/design-qa
```
