# Goal 128: Admin Design QA Route

Goal 128 adds `/admin/design-qa` as a focused, read-only Figma and mobile QA
review route for Admin, DS Admin, and Super Admin reviewers.

The route reuses the existing design QA readiness service. It names the Figma
target, 390px phone viewport, mobile next-action clarity, role complexity,
accessibility baseline, mission tone, pilot-safety messaging, offline recovery,
and final production visual QA blockers before any live pilot decision.

## What Changed

- `src/app/admin/design-qa/page.tsx`
- `src/services/app-route-registry.ts`
- `src/services/static-route-metadata.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/stakeholder-review-plan.ts`
- `src/services/live-data-connection-plan.ts`
- `src/services/mvp-coverage-checklist.ts`
- `src/services/mvp-progress-map.ts`
- `src/services/mvp-release-readiness.ts`
- `docs/review/local-mvp-review-guide.md`
- `docs/supabase-local-development.md`

## Safety Boundary

The route is read-only. It does not approve live launch, production auth,
browser writes, proof uploads, public proof sharing, external sends, staging
claims, final Figma matching, mobile QA, accessibility QA, or PWA install/offline
approval.

Mock fallback mode stays honest: reviewers can inspect design QA prompts, but
final visual QA still needs side-by-side Figma review, real phone checks,
keyboard/screen-reader checks, offline/PWA checks, and staging smoke checks.

## Review Path

Open `/admin/design-qa` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show the Figma target, mobile review size, ready/review/blocked
counts, zero browser writes, and zero external sends.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to operating routes instead of seeing launch QA posture.
