# Goal 125: Admin Integration Outbox Route

Goal 125 adds `/admin/integration-outbox` as a focused, read-only DS/Admin
review route for structured integration events, automation outbox rows,
destination safety, audit posture, and blocked live-send controls.

Goal 155 extends this same route with a live-send preflight checklist for source
events, payload/idempotency, audit readback, destination policy, and
secrets/sends boundaries before any queue mutation or external automation is
approved.

The route keeps the myMEDLIFE app and Supabase read model as the source of
truth. It is n8n-ready, but it does not move truth into n8n, HubSpot, Luma,
warehouse, Power BI, SMS, email, or AI systems.

## What Changed

- `src/services/admin-integration-outbox-workspace.ts`
- `src/app/admin/integration-outbox/page.tsx`
- `tests/admin-integration-outbox-workspace.test.ts`
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

The route is read-only. It does not mutate queue state, approve live sends,
retry failed sends, edit payloads, unlock queue rows, rotate integration
secrets, send reminders, export warehouse or Power BI rows, run AI summaries,
or trigger external automation.

DS Admin can review integration and outbox posture without row-level
chapter/member audit details.

## Review Path

Open `/admin/integration-outbox` as `ds.admin@mymedlife.test`,
`admin@mymedlife.test`, or `super.admin@mymedlife.test`.

The page should show structured integration events, automation outbox rows,
destination safety, the Goal 155 live-send preflight checklist, local readback
rows when available, audit posture, blocked live controls, `0` live sends, `0`
browser writes, `0` external writes, and `0` secrets.

Chapter members, chapter leaders, and coaches should see the restricted state
and return to operating routes instead of seeing integration queue posture.
