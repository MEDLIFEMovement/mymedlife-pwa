# Goal 131: Admin Launch Gate Route

Goal 131 adds `/admin/launch-gate` as a focused, read-only production launch
gate for Admin, DS Admin, and Super Admin reviewers.

The route reuses the existing production launch gate service. It gives Nick,
HQ, DS, and security one direct route for the eight live-launch gates before any
student pilot decision.

Goal 150 extends this route with a staging and pilot launch evidence checklist.
That checklist collects staging URL, Supabase posture, auth callback, RLS/CI,
proof storage, device/PWA/accessibility QA, monitoring, integration-hold, and
support-owner evidence without changing the route's approval boundary.

## What Changed

- `src/app/admin/launch-gate/page.tsx`
- `src/services/app-route-registry.ts`
- `src/services/static-route-metadata.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/stakeholder-review-plan.ts`
- `src/services/live-data-connection-plan.ts`
- `src/services/mvp-coverage-checklist.ts`
- `src/services/mvp-progress-map.ts`
- `src/services/mvp-release-readiness.ts`
- `src/services/production-launch-gate.ts`
- `docs/review/local-mvp-review-guide.md`
- `docs/supabase-local-development.md`

## Safety Boundary

The route is read-only. It does not approve live launch, production auth,
browser writes, proof uploads, database vendor switching, external sends, or
student invitations.

The page should keep `launch no`, `0 writes`, and `0 sends` visible while
reviewers inspect missing live evidence, owner sign-off needs, rollback posture,
and follow-up routes for auth, RLS, write promotion, proof storage, campaign
templates, integrations, audit/observability, and pilot operations.

The Goal 150 checklist is evidence collection only. It must stay blocked until
the staging, security, operations, and pilot support owners record proof outside
the app and Nick approves the next release step.

## Review Path

Open `/admin/launch-gate` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

Admin and Super Admin should see the focused launch gate and a next step to
system health. DS Admin should see the same launch gate with a next step to the
database security review.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to Rush Month instead of seeing launch approval posture.
