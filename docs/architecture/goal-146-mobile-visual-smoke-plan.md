# Goal 146: Mobile Visual Smoke Plan

Goal 146 turns `/admin/design-qa` from a high-level Figma/mobile checklist into
a concrete phone-sized route review plan for the local myMEDLIFE MVP.

## What changed

- `getDesignQaReadiness(actor)` now returns eight mobile visual smoke checks.
- `DesignQaReadinessPanel` renders the route, reviewer actor email, 390px
  viewport, target signal, pass signal, and still-blocked launch boundary for
  each check.
- `/admin/design-qa` now shows the mobile check count next to the existing
  Figma, accessibility, role-complexity, pilot-safety, and zero-write posture.
- MVP progress, coverage, release readiness, README, Supabase local notes, and
  the local MVP review guide now reference the Goal 146 mobile plan.
- Goal 147 also mirrors these checks into the admin route smoke manifest so
  `/admin` and `/admin/design-qa` stay aligned for reviewer handoff.

## Mobile smoke routes

Run each route at the primary `390px wide phone viewport`.

- `/rush-month` as `member.a@mymedlife.test`
- `/rush-month/actions` as `member.a@mymedlife.test`
- `/rush-month/evidence` as `member.a@mymedlife.test`
- `/rush-month/dashboard` as `leader.a@mymedlife.test`
- `/coach` as `coach@mymedlife.test`
- `/admin/nick-review` as `admin@mymedlife.test`
- `/offline` as `member.a@mymedlife.test`
- `/proof-library/upload` as `admin@mymedlife.test`

## Pass signal

Each route should make the next action, role scope, text fit, touch targets, and
safety copy clear on a phone without suggesting that production writes, uploads,
external sends, or invitations are enabled.

## Still blocked

This is a local visual review aid only. It does not approve production Supabase,
browser writes, proof storage, public proof publishing, n8n, HubSpot, Luma,
warehouse, Power BI, email, SMS, AI sends, real pilots, or student invitations.

## Review URL

```text
http://localhost:3000/admin/design-qa
```
