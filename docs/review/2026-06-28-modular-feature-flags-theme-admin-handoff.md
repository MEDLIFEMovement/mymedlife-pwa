# Modular Feature Flags + Theme Admin Handoff

## What Changed
- Added a central feature flag registry and evaluator in `src/modules/feature-flags`.
- Added `/admin/feature-flags` for DS Admin and Super Admin to review and change module/provider flags with required reasons and audit records.
- Moved feature flag changes out of in-memory-only review mode when `MYMEDLIFE_CONTROL_LAYER_SOURCE=supabase` is enabled, with durable Supabase override, audit, approval, and step-up session rows plus a clear memory fallback when the control layer is intentionally off.
- Added server-side Luma feature flag enforcement so disabled Luma returns fallback state before any external API call.
- Added server-side module fallback gates for SOP workflow runtime, task assignment writes, and proof/UGC submission workspace so those modules can be paused without breaking events, RSVP, points, or leaderboards.
- Added a theme token service in `src/modules/theme`.
- Added `/admin/theme` for DS Admin and Super Admin to edit, draft, publish, roll back, restore, and audit MEDLIFE design tokens.
- Moved theme draft/publish/rollback/restore operations into the same Supabase-backed control layer when enabled, including production approval trail rows and fresh DS/Admin step-up requirements for production changes.
- Added a central CSS token bridge so common legacy utility colors like `text-slate-*`, `bg-white`, `border-slate-*`, and error states resolve through editable theme variables.
- Added module README entrypoints for the major myMEDLIFE areas so humans can orient module-by-module.

## Modules Touched
- `feature-flags`
- `theme`
- `luma`
- `admin`
- `integrations`
- `events`
- `points`
- `sop-workflows`
- `tasks`
- `ugc`
- `staff-analytics`
- `permissions`
- `auth`
- `app-shells`
- `audit`
- `shared-ui`

## Files To Review First
- `src/modules/feature-flags/constants.ts`
- `src/modules/feature-flags/services/feature-flag-service.ts`
- `src/app/admin/feature-flags/page.tsx`
- `src/services/sop-workflow-runtime.ts`
- `src/services/assignment-create-write.ts`
- `src/services/evidence-submission-workspace.ts`
- `src/modules/theme/constants.ts`
- `src/modules/theme/services/theme-service.ts`
- `src/app/admin/theme/page.tsx`
- `src/app/globals.css`
- `src/services/luma-calendar-readiness.ts`
- `src/services/luma-live-pilot.ts`
- `tests/feature-flags-theme-services.test.ts`
- `tests/feature-flags-theme-pages.test.tsx`

## How To Test
- Run focused coverage:
  - `pnpm vitest run tests/feature-flags-theme-services.test.ts tests/feature-flags-theme-pages.test.tsx tests/feature-flag-durable-update.test.ts tests/theme-durable-update.test.ts tests/theme-published-css-durable.test.ts tests/admin-control-actions.test.ts tests/luma-live-pilot.test.ts tests/luma-live-pilot-durable-control.test.ts tests/luma-event-loop-pilot.test.tsx tests/staging-luma-event-loop.test.ts`
- Run typecheck:
  - `pnpm typecheck`
- Review routes locally:
  - `/admin/feature-flags`
  - `/admin/theme`
  - `/admin/luma-live-pilot`

## Flags
- Module flags:
  - `events_luma_points`
  - `ugc_feed_proof`
  - `task_assignment`
  - `sop_workflows_next_action`
  - `staff_analytics_reporting`
  - `integrations_outbox`
  - `mcp_read_only_analytics`
  - `ds_admin_controls`
  - `theme_design_system`
- Provider flags:
  - `integration_luma`
  - `integration_hubspot`
  - `integration_shopify`
  - `integration_givelively`
  - `integration_bigquery`
  - `integration_powerbi`
  - `integration_n8n`
  - `integration_openai`

## Permissions
- `/admin/feature-flags` and `/admin/theme` are visible only to DS Admin and Super Admin.
- Server services reject unauthorized flag and theme mutations.
- Disabled Luma is enforced in service code before `fetch`.

## Risks
- The original handoff was local-first, but this is no longer an in-memory-only
  slice. Feature flags and theme controls now have a Supabase-backed control
  layer in staging with audit rows and DS/Super Admin protections.
- The remaining review risk is hosted pilot completeness, not control-layer
  storage design. Hosted preview proof now exists for both feature-flag saves
  and theme draft saves, and the durable Supabase rows plus `app.audit_logs`
  readback are visible in staging. The open production-moving gap is still the
  separate Luma attendance-to-points proof and the production environment owner
  decisions.
- Production-sensitive flag and theme changes still depend on explicit approval
  reference, confirmation, and a fresh DS/Admin step-up session. That posture is
  implemented, but the production owners and rollout timing remain human
  decisions, not app defaults.
- Some JSX still uses legacy Tailwind color class names for readability, but the common neutral/error classes now route through the theme variables in `src/app/globals.css`. New work should prefer semantic `app-*` classes or explicit `var(--mymedlife-*)` utilities.
- Module READMEs map ownership and safe-change rules; they do not move every legacy service/component file yet.

## Not Included
- Production migration application or production control-layer activation.
- Production Luma setup.
- n8n execution.
- HubSpot, Shopify, GiveLively, BigQuery, Power BI, OpenAI, SMS, email, warehouse, or AI writes.
- Moving every legacy service/component file into `src/modules/<module>`.

## Next PR
- Finish the still-missing hosted pilot proof that requires one real checked-in
  Luma attendee so attendance import can materialize points and leaderboard
  readback, while keeping the readback surfaces explicit about audit rows and
  disabled outbox rows.
- Keep production Supabase/Vercel ownership, rollback/support ownership, and
  production-only env vars as a separate approval packet instead of widening the
  staging control layer.
