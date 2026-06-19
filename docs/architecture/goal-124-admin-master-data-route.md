# Goal 124: Admin Master Data Route

Goal 124 adds `/admin/master-data` as a focused, read-only admin inventory for
fake users, named role coverage, chapter scope, and campaign templates.

The existing `/admin` control center still summarizes the inventory alongside
release readiness, outbox, audit, health, write gates, and launch blockers. This
route gives Admin, DS Admin, and Super Admin reviewers a cleaner place to review
the master-data boundary before any production admin mutation path exists.

## What Changed

- `src/services/admin-master-data-workspace.ts`
- `src/app/admin/master-data/page.tsx`
- `tests/admin-master-data-workspace.test.ts`
- `src/services/app-route-registry.ts`
- `src/services/static-route-metadata.ts`
- `src/services/route-smoke-manifest.ts`
- `src/services/stakeholder-review-plan.ts`
- `src/services/mvp-coverage-checklist.ts`
- `src/services/mvp-progress-map.ts`
- `src/services/mvp-release-readiness.ts`
- `src/services/live-data-connection-plan.ts`
- `src/components/admin-control-center-panel.tsx`
- `docs/review/local-mvp-review-guide.md`
- `docs/supabase-local-development.md`

## Safety Boundary

The route is read-only. It does not create production users, edit profiles,
assign roles, approve memberships, edit chapters, edit campaign templates,
change coach assignments, or send external automation.

Live auth, production Supabase writes, HubSpot, Luma, n8n, warehouse, Power BI,
SMS, email, and AI writes remain disabled.

## Review Path

Open `/admin/master-data` as `admin@mymedlife.test`,
`ds.admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show fake users, named roles, chapter scope, campaign templates,
blocked write labels, `0` mutation controls, `0` production auth, and `0`
external sends.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to operating routes instead of seeing admin inventory.
