# Goal 130: Admin Database Security Route

Goal 130 adds `/admin/database-security` as a focused, read-only database
security review route for Admin, DS Admin, and Super Admin reviewers.

The route reuses the existing database security decision packet. It makes the
DS concern reviewable without turning the concern into an unapproved stack
change: Supabase Postgres/Auth/Storage remains the MVP recommendation,
PlanetScale MySQL/Vitess is documented as the reviewed tradeoff, and live launch
stays blocked until DS/security approves the required controls.

## What Changed

- `src/app/admin/database-security/page.tsx`
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

The route is read-only. It does not approve live launch, production Supabase,
production auth, a database vendor switch, browser writes, proof uploads,
service-key exposure, external sends, or PHI/ePHI processing.

The route keeps the decision concrete: Supabase fits the current RLS, Auth,
Storage, proof-review, audit, and outbox path; PlanetScale MySQL/Vitess remains
a possible future architecture choice only if the team approves the auth,
authorization, schema, storage, and test rewrite.

## Review Path

Open `/admin/database-security` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show Supabase Postgres/Auth/Storage as recommended,
PlanetScale MySQL/Vitess as reviewed, chapter-scoped RLS and service-key
approval requirements, BAA/HIPAA posture, launch `no`, `0` writes, and `0`
sends.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to operating routes instead of seeing DS/security launch posture.
