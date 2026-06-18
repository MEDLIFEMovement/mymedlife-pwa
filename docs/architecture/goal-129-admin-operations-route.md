# Goal 129: Admin Operations Route

Goal 129 adds `/admin/operations` as a focused, read-only production operations
review route for Admin, DS Admin, and Super Admin reviewers.

The route reuses the existing production operations runbook service. It names
incident triage, auth/access recovery, database/RLS recovery, write rollback,
proof moderation, integration recovery, mobile PWA support, and pilot
communications before any live pilot decision.

## What Changed

- `src/app/admin/operations/page.tsx`
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
browser writes, proof uploads, outbox sends, monitoring claims, backup claims,
support-owner claims, integration recovery claims, or student invitations.

Mock fallback mode stays honest: local playbooks can be reviewed, but live
operations remain blocked until owners, alert channels, backup proof, rollback
steps, integration recovery rules, mobile PWA support, and day-one student
support are approved.

## Review Path

Open `/admin/operations` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show launch `no`, eight runbook areas, blocked live evidence,
`0` sends, and `0` secrets.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to operating routes instead of seeing launch operations posture.
